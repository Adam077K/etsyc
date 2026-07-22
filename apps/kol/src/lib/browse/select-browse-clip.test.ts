import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE } from "@/lib/feed/session";

/**
 * The WORLD_BROWSE server boundary: one engine read, zero throw paths.
 * The engine's own scoring and anti-repetition are covered by the engine
 * suites — these tests pin what the BOUNDARY owns: input hygiene, session
 * identity (validated read-only — the middleware is the sole minter),
 * createEngineDeps-ONLY wiring (createDefaultDeps with the user client is
 * the unpublished-clip leak path, §B0 / W2-WIRE), ring cookie wiring with
 * the FULL shared attribute set, the exact WORLD_BROWSE EngineContext, the
 * serializable clip slice, and the everything-degrades-to-null guarantee.
 *
 * Cookie attributes are asserted with toEqual, never toMatchObject — an
 * attribute-stripping replace is how F2 shipped; the set is the contract,
 * not just the names.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_ID = "7c1f4b3a-2d5e-4f60-8a9b-1c2d3e4f5a6b";

const mocks = vi.hoisted(() => {
  const jarStore = new Map<string, string>();
  const setCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    jarStore,
    setCalls,
    depsStub: { deps: "stub" },
    jar: {
      get: (name: string) =>
        jarStore.has(name) ? { name, value: jarStore.get(name)! } : undefined,
      set: (name: string, value: string, options: Record<string, unknown>) => {
        jarStore.set(name, value);
        setCalls.push({ name, value, options });
      },
    },
    selectVideos: vi.fn(),
    createEngineDeps: vi.fn(),
    createDefaultDeps: vi.fn(),
    getUser: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => mocks.jar }));
vi.mock("@/lib/engine", () => ({
  createEngineDeps: mocks.createEngineDeps,
  createDefaultDeps: mocks.createDefaultDeps,
  selectVideos: mocks.selectVideos,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { selectBrowseClip } from "./select-browse-clip";

const STORE_ID = "3d1a2f40-88a1-4b6e-b0cf-52f1d1a5a001";

const ENGINE_CLIP = {
  videoId: "v1",
  storeId: STORE_ID,
  ownerId: "owner-1",
  src: "/films/wheel.mp4",
  poster: "/stills/wheel.jpg",
  durationMs: 28_000,
  captionsSrc: "/captions/wheel.vtt",
  antiRepetitionKey: "v1",
};

beforeEach(() => {
  mocks.jarStore.clear();
  mocks.setCalls.length = 0;
  mocks.selectVideos.mockReset().mockResolvedValue({ clips: [] });
  mocks.createEngineDeps.mockReset().mockReturnValue(mocks.depsStub);
  mocks.createDefaultDeps.mockReset();
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: null } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** kol_sid writes are the middleware's alone — this action never sets one. */
function expectNoSessionWrite() {
  expect(mocks.setCalls.filter((call) => call.name === FEED_SESSION_COOKIE)).toHaveLength(0);
}

describe("selectBrowseClip — input hygiene", () => {
  it("a non-uuid store id (preview fixtures) degrades to null without touching the engine", async () => {
    await expect(selectBrowseClip("sena")).resolves.toBeNull();
    expect(mocks.selectVideos).not.toHaveBeenCalled();
    expect(mocks.createEngineDeps).not.toHaveBeenCalled();
    expect(mocks.setCalls).toHaveLength(0);
  });
});

describe("selectBrowseClip — the one engine read", () => {
  it("builds the WORLD_BROWSE context: store-scoped, limit 1, ephemeral session when the cookie is absent", async () => {
    mocks.selectVideos.mockResolvedValue({ clips: [ENGINE_CLIP] });

    const result = await selectBrowseClip(STORE_ID);

    expect(mocks.selectVideos).toHaveBeenCalledTimes(1);
    const [ctx, deps] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toEqual({
      state: "WORLD_BROWSE",
      buyerId: null,
      // no cookie → resolveFeedSessionId's ephemeral fallback: a real
      // uuid, and NOT written back — the middleware re-mints on response
      sessionId: expect.stringMatching(UUID_RE),
      storeScope: STORE_ID,
      productId: null,
      moodHint: null,
      limit: 1,
    });
    expect(deps).toBe(mocks.depsStub);
    expectNoSessionWrite();

    // the clip crosses the boundary as the serializable 4-field slice only
    expect(result).toEqual({
      videoId: "v1",
      src: "/films/wheel.mp4",
      poster: "/stills/wheel.jpg",
      captionsSrc: "/captions/wheel.vtt",
    });
  });

  it("reuses a VALID existing session cookie and passes the signed-in buyer", async () => {
    mocks.jarStore.set(FEED_SESSION_COOKIE, SESSION_ID);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "buyer-7" } } });

    await selectBrowseClip(STORE_ID);

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({
      sessionId: SESSION_ID,
      buyerId: "buyer-7",
      storeScope: STORE_ID,
    });
    expectNoSessionWrite();
  });

  it("a malformed kol_sid never reaches the engine's jitter seed and is never re-minted here", async () => {
    // a cookie is client input — B2/B3/B5 reject this via
    // resolveFeedSessionId, and B4 must resolve the SAME identity they do
    mocks.jarStore.set(FEED_SESSION_COOKIE, "notauuid");

    await selectBrowseClip(STORE_ID);

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({ sessionId: expect.stringMatching(UUID_RE) });
    expect((ctx as { sessionId: string }).sessionId).not.toBe("notauuid");
    // the middleware is the sole minter — no competing Set-Cookie from here
    expectNoSessionWrite();
  });

  it("wires deps through createEngineDeps ONLY — createDefaultDeps is unreachable from this boundary", async () => {
    await selectBrowseClip(STORE_ID);

    // createEngineDeps constructs the anon client internally, so a
    // signed-in seller's drafts can never satisfy eligibility here.
    // Swapping to createDefaultDeps with the user client is the
    // unpublished-clip leak path — it must fail THIS test, not nothing.
    expect(mocks.createEngineDeps).toHaveBeenCalledTimes(1);
    expect(mocks.createDefaultDeps).not.toHaveBeenCalled();
    const [cookieOpts] = mocks.createEngineDeps.mock.calls[0]! as [
      { read: () => string | undefined; write: (value: string) => void },
    ];
    expect(typeof cookieOpts.read).toBe("function");
    expect(typeof cookieOpts.write).toBe("function");
    // the deps object is forwarded whole — no re-wrapping between factory
    // and selectVideos
    const [, deps] = mocks.selectVideos.mock.calls[0]!;
    expect(deps).toBe(mocks.depsStub);
  });

  it("wires the ring cookie by its canonical name, read AND write, with the FULL shared attribute set", async () => {
    mocks.jarStore.set(FEED_RING_COOKIE, "signed-ring-value");

    await selectBrowseClip(STORE_ID);

    const [cookieOpts] = mocks.createEngineDeps.mock.calls[0]! as [
      { read: () => string | undefined; write: (value: string) => void },
    ];
    expect(cookieOpts.read()).toBe("signed-ring-value");
    cookieOpts.write("next-ring");
    const written = mocks.setCalls.find((call) => call.name === FEED_RING_COOKIE);
    expect(written?.value).toBe("next-ring");
    // exact set, not a subset — a missing attribute is how F2 shipped, and
    // diverging attributes fork the cookie by scope, splitting the ring
    // between FEED and WORLD_BROWSE
    expect(written?.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false, // NODE_ENV=test here; the production case is below
      path: "/",
    });
  });

  it("ring writes carry `secure` in production — an attribute-stripping replace is the F2 defect", async () => {
    // RING_COOKIE_OPTIONS is evaluated at MODULE scope (boot-time NODE_ENV,
    // stable in production) — a fresh import is required to observe it
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { selectBrowseClip: prodSelectBrowseClip } = await import("./select-browse-clip");

    await prodSelectBrowseClip(STORE_ID);

    const [cookieOpts] = mocks.createEngineDeps.mock.calls[0]! as [
      { read: () => string | undefined; write: (value: string) => void },
    ];
    cookieOpts.write("prod-ring");
    const written = mocks.setCalls.find((call) => call.name === FEED_RING_COOKIE);
    expect(written?.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });
});

describe("selectBrowseClip — the no-throw guarantee", () => {
  it("an empty selection (nothing eligible in this store) is null, not an error", async () => {
    await expect(selectBrowseClip(STORE_ID)).resolves.toBeNull();
  });

  it("an engine fault degrades to null — the buyer keeps the current clip, never error chrome", async () => {
    mocks.selectVideos.mockRejectedValue(new Error("db outage"));

    await expect(selectBrowseClip(STORE_ID)).resolves.toBeNull();
  });

  it("a missing engine secret (createEngineDeps throws) degrades to null before any engine read", async () => {
    mocks.createEngineDeps.mockImplementation(() => {
      throw new Error("[engine] Missing environment variable ENGINE_COOKIE_SECRET.");
    });

    await expect(selectBrowseClip(STORE_ID)).resolves.toBeNull();
    expect(mocks.selectVideos).not.toHaveBeenCalled();
  });
});
