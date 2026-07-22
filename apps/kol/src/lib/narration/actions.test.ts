import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE } from "@/lib/feed/session";

/**
 * The NARRATE_SHRINK server boundary: one engine read, zero throw paths.
 * The engine's own fallback chain is covered by the engine suites — these
 * tests pin what the BOUNDARY owns: input hygiene, session identity
 * (validated read-only — the middleware is the sole minter), ring cookie
 * wiring with the FULL shared attribute set, the exact EngineContext, the
 * serializable clip mapping, and the everything-degrades-to-null
 * guarantee.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_ID = "7c1f4b3a-2d5e-4f60-8a9b-1c2d3e4f5a6b";

const mocks = vi.hoisted(() => {
  const jarStore = new Map<string, string>();
  const setCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    jarStore,
    setCalls,
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
    getUser: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => mocks.jar }));
vi.mock("@/lib/engine", () => ({
  createEngineDeps: mocks.createEngineDeps,
  selectVideos: mocks.selectVideos,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { selectNarration } from "./actions";

const STORE_ID = "3d1a2f40-88a1-4b6e-b0cf-52f1d1a5a001";
const PRODUCT_ID = "9f5b7c52-3a86-4e0d-9db0-6f5a29d2b101";

const ENGINE_CLIP = {
  videoId: "v1",
  storeId: STORE_ID,
  ownerId: "owner-1",
  src: "/films/mug.mp4",
  poster: "/stills/mug.jpg",
  durationMs: 30_000,
  captionsSrc: "/captions/mug.vtt",
  antiRepetitionKey: "v1",
};

beforeEach(() => {
  mocks.jarStore.clear();
  mocks.setCalls.length = 0;
  mocks.selectVideos.mockReset().mockResolvedValue({ clips: [] });
  mocks.createEngineDeps.mockReset().mockReturnValue({ deps: "stub" });
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: null } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** kol_sid writes are the middleware's alone — this action never sets one. */
function expectNoSessionWrite() {
  expect(mocks.setCalls.filter((call) => call.name === FEED_SESSION_COOKIE)).toHaveLength(0);
}

describe("selectNarration — input hygiene", () => {
  it("a non-uuid store id (preview fixtures) degrades to null without touching the engine", async () => {
    await expect(selectNarration({ storeId: "sena", productId: null })).resolves.toEqual({
      clip: null,
    });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
    expect(mocks.setCalls).toHaveLength(0);
  });

  it("a non-uuid product id degrades the same way", async () => {
    await expect(
      selectNarration({ storeId: STORE_ID, productId: "not-a-uuid" }),
    ).resolves.toEqual({ clip: null });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
  });
});

describe("selectNarration — the one engine read", () => {
  it("builds the NARRATE_SHRINK context: product-scoped, limit 1, ephemeral session when the cookie is absent", async () => {
    mocks.selectVideos.mockResolvedValue({ clips: [ENGINE_CLIP] });

    const result = await selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID });

    expect(mocks.selectVideos).toHaveBeenCalledTimes(1);
    const [ctx, deps] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toEqual({
      state: "NARRATE_SHRINK",
      buyerId: null,
      // no cookie → resolveFeedSessionId's ephemeral fallback: a real
      // uuid, and NOT written back — the middleware re-mints on response
      sessionId: expect.stringMatching(UUID_RE),
      storeScope: STORE_ID,
      productId: PRODUCT_ID,
      moodHint: null,
      limit: 1,
    });
    expect(deps).toEqual({ deps: "stub" });
    expectNoSessionWrite();

    // the clip crosses the boundary as the serializable 4-field slice only
    expect(result).toEqual({
      clip: {
        videoId: "v1",
        src: "/films/mug.mp4",
        poster: "/stills/mug.jpg",
        captionsSrc: "/captions/mug.vtt",
      },
    });
  });

  it("reuses a VALID existing session cookie and passes the signed-in buyer", async () => {
    mocks.jarStore.set(FEED_SESSION_COOKIE, SESSION_ID);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "buyer-7" } } });

    await selectNarration({ storeId: STORE_ID, productId: null });

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({
      sessionId: SESSION_ID,
      buyerId: "buyer-7",
      productId: null,
    });
    expectNoSessionWrite();
  });

  it("a malformed kol_sid never reaches the engine's jitter seed and is never re-minted here (gate-2 F1)", async () => {
    // a cookie is client input — B2/B3/B4 reject this via
    // resolveFeedSessionId, and B5 must resolve the SAME identity they do
    mocks.jarStore.set(FEED_SESSION_COOKIE, "notauuid");

    await selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID });

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({ sessionId: expect.stringMatching(UUID_RE) });
    expect((ctx as { sessionId: string }).sessionId).not.toBe("notauuid");
    // the middleware is the sole minter — no competing Set-Cookie from here
    expectNoSessionWrite();
  });

  it("wires the ring cookie by its canonical name, read AND write, with the FULL shared attribute set", async () => {
    mocks.jarStore.set(FEED_RING_COOKIE, "signed-ring-value");

    await selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID });

    const [cookieOpts] = mocks.createEngineDeps.mock.calls[0]! as [
      { read: () => string | undefined; write: (value: string) => void },
    ];
    expect(cookieOpts.read()).toBe("signed-ring-value");
    cookieOpts.write("next-ring");
    const written = mocks.setCalls.find((call) => call.name === FEED_RING_COOKIE);
    expect(written?.value).toBe("next-ring");
    // exact set, not a subset — a missing attribute is how F2 shipped
    expect(written?.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false, // NODE_ENV=test here; the production case is below
      path: "/",
    });
  });

  it("ring writes carry `secure` in production — an attribute-stripping replace is the F2 defect (gate-2 F2)", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID });

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

describe("selectNarration — the no-throw guarantee", () => {
  it("an empty selection (dangling product_links, untagged store) is null, not an error", async () => {
    await expect(
      selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID }),
    ).resolves.toEqual({ clip: null });
  });

  it("an engine fault degrades to null and logs — the buyer never sees it", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.selectVideos.mockRejectedValue(new Error("engine secret missing"));

    await expect(
      selectNarration({ storeId: STORE_ID, productId: PRODUCT_ID }),
    ).resolves.toEqual({ clip: null });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("narration_select_failed"),
    );
    errorSpy.mockRestore();
  });
});
