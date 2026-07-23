import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE } from "@/lib/feed/session";

/**
 * The GROWN server boundary (B2): one engine read, zero throw paths.
 * The engine's own fallback chain is covered by the engine suites — these
 * tests pin what the BOUNDARY owns: input hygiene, session identity
 * (validated read-only — the middleware is the sole minter), ring cookie
 * wiring with the FULL shared attribute set, the exact GROWN
 * EngineContext, the serializable GrownClip mapping + tapped-clip
 * promotion, the createEngineDeps-ONLY composition (createDefaultDeps
 * with a user client is the unpublished-clip leak path), and the
 * everything-degrades-to-error-status guarantee. Pattern: B5's
 * lib/narration/actions.test.ts.
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
    createDefaultDeps: vi.fn(),
    getUser: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => mocks.jar }));
vi.mock("@/lib/engine", () => ({
  createEngineDeps: mocks.createEngineDeps,
  // exported by the composition root but FORBIDDEN at this boundary —
  // present in the mock so a swap to it is caught, not an import error
  createDefaultDeps: mocks.createDefaultDeps,
  selectVideos: mocks.selectVideos,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { requestGrownSelection } from "./actions";
import { GROWN_LIMIT } from "./select";

const STORE_ID = "3d1a2f40-88a1-4b6e-b0cf-52f1d1a5a001";

/** The engine's full clip shape — the boundary must slice, not forward. */
function engineClip(videoId: string) {
  return {
    videoId,
    storeId: STORE_ID,
    ownerId: "owner-1",
    src: `/films/${videoId}.mp4`,
    poster: `/stills/${videoId}.jpg`,
    durationMs: 30_000,
    captionsSrc: `/captions/${videoId}.vtt`,
    antiRepetitionKey: videoId,
  };
}

/** The client-safe GrownClip slice of the same clip — 6 fields, no more. */
function grownClip(videoId: string) {
  return {
    videoId,
    storeId: STORE_ID,
    src: `/films/${videoId}.mp4`,
    poster: `/stills/${videoId}.jpg`,
    durationMs: 30_000,
    captionsSrc: `/captions/${videoId}.vtt`,
  };
}

beforeEach(() => {
  mocks.jarStore.clear();
  mocks.setCalls.length = 0;
  mocks.selectVideos.mockReset().mockResolvedValue({ clips: [] });
  mocks.createEngineDeps.mockReset().mockReturnValue({ deps: "stub" });
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

describe("requestGrownSelection — input hygiene", () => {
  it("an empty store id degrades to the error result without touching the engine or the jar", async () => {
    await expect(
      requestGrownSelection({ storeId: "", tappedVideoId: null }),
    ).resolves.toEqual({ status: "error", grown: null, peers: [] });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
    expect(mocks.createEngineDeps).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.setCalls).toHaveLength(0);
  });

  it("an oversized store id (>128) degrades the same way", async () => {
    await expect(
      requestGrownSelection({ storeId: "s".repeat(129), tappedVideoId: null }),
    ).resolves.toEqual({ status: "error", grown: null, peers: [] });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
  });

  it("an empty tapped-video id is rejected — null is the only 'no tap' spelling", async () => {
    await expect(
      requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "" }),
    ).resolves.toEqual({ status: "error", grown: null, peers: [] });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
  });
});

describe("requestGrownSelection — the one engine read", () => {
  it("builds the GROWN context: store-scoped, limit GROWN_LIMIT, ephemeral session when the cookie is absent", async () => {
    mocks.selectVideos.mockResolvedValue({ clips: [engineClip("v1")] });

    const result = await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "v1" });

    expect(mocks.selectVideos).toHaveBeenCalledTimes(1);
    const [ctx, deps] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toEqual({
      state: "GROWN",
      buyerId: null,
      // no cookie → resolveFeedSessionId's ephemeral fallback: a real
      // uuid, and NOT written back — the middleware re-mints on response
      sessionId: expect.stringMatching(UUID_RE),
      storeScope: STORE_ID,
      productId: null,
      moodHint: null,
      limit: GROWN_LIMIT,
    });
    expect(deps).toEqual({ deps: "stub" });
    expectNoSessionWrite();

    // the clip crosses the boundary as the serializable 6-field slice only
    // (ownerId and antiRepetitionKey never reach the client)
    expect(result).toEqual({ status: "success", grown: grownClip("v1"), peers: [] });
  });

  it("composes through createEngineDeps ONLY — createDefaultDeps is the unpublished-clip leak path", async () => {
    await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

    // the deps factory that cannot be miswired, called with the ring pair
    expect(mocks.createEngineDeps).toHaveBeenCalledTimes(1);
    expect(mocks.createEngineDeps).toHaveBeenCalledWith({
      read: expect.any(Function),
      write: expect.any(Function),
    });
    // NEVER the raw composition root: handing it the cookie-bound user
    // client would leak a signed-in seller's unpublished drafts into
    // eligibility (lib/engine/index.ts createDefaultDeps contract)
    expect(mocks.createDefaultDeps).not.toHaveBeenCalled();
  });

  it("reuses a VALID existing session cookie and passes the signed-in buyer", async () => {
    mocks.jarStore.set(FEED_SESSION_COOKIE, SESSION_ID);
    mocks.getUser.mockResolvedValue({ data: { user: { id: "buyer-7" } } });

    await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({
      sessionId: SESSION_ID,
      buyerId: "buyer-7",
      storeScope: STORE_ID,
    });
    expectNoSessionWrite();
  });

  it("a malformed kol_sid never reaches the engine's jitter seed and is never re-minted here", async () => {
    // a cookie is client input — resolveFeedSessionId rejects it, and B2
    // must resolve the SAME identity B1a/B5 do (one journey, one session)
    mocks.jarStore.set(FEED_SESSION_COOKIE, "notauuid");

    await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

    const [ctx] = mocks.selectVideos.mock.calls[0]!;
    expect(ctx).toMatchObject({ sessionId: expect.stringMatching(UUID_RE) });
    expect((ctx as { sessionId: string }).sessionId).not.toBe("notauuid");
    // the middleware is the sole minter — no competing Set-Cookie from here
    expectNoSessionWrite();
  });

  it("wires the ring cookie by its canonical name, read AND write, with the FULL shared attribute set", async () => {
    mocks.jarStore.set(FEED_RING_COOKIE, "signed-ring-value");

    await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

    const [cookieOpts] = mocks.createEngineDeps.mock.calls[0]! as [
      { read: () => string | undefined; write: (value: string) => void },
    ];
    expect(cookieOpts.read()).toBe("signed-ring-value");
    cookieOpts.write("next-ring");
    const written = mocks.setCalls.find((call) => call.name === FEED_RING_COOKIE);
    expect(written?.value).toBe("next-ring");
    // exact set, not a subset — a missing attribute is how gate-2 F2
    // shipped; toEqual so a stripped `secure` cannot pass silently
    expect(written?.options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false, // NODE_ENV=test here; the production case is below
      path: "/",
    });
  });

  it("ring writes carry `secure` in production — an attribute-stripping replace is the F2 defect", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

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

describe("requestGrownSelection — grown pick + peers (spec D5)", () => {
  it("promotes the tapped clip to grown and returns the rest as peers", async () => {
    mocks.selectVideos.mockResolvedValue({
      clips: [engineClip("v1"), engineClip("v2"), engineClip("v3")],
    });

    const result = await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "v2" });

    expect(result).toEqual({
      status: "success",
      grown: grownClip("v2"),
      peers: [grownClip("v1"), grownClip("v3")],
    });
  });

  it("falls back to the engine's first clip when the tapped clip is not in the selection", async () => {
    mocks.selectVideos.mockResolvedValue({ clips: [engineClip("v1"), engineClip("v2")] });

    const result = await requestGrownSelection({
      storeId: STORE_ID,
      tappedVideoId: "v-not-returned",
    });

    expect(result.status).toBe("success");
    expect(result.grown).toEqual(grownClip("v1"));
    expect(result.peers).toEqual([grownClip("v2")]);
  });

  it("an image-path grow (tappedVideoId null) takes the engine's first clip", async () => {
    mocks.selectVideos.mockResolvedValue({ clips: [engineClip("v1"), engineClip("v2")] });

    const result = await requestGrownSelection({ storeId: STORE_ID, tappedVideoId: null });

    expect(result.grown).toEqual(grownClip("v1"));
    expect(result.peers).toEqual([grownClip("v2")]);
  });

  it("an empty selection is still a success — the tapped clip alone is valid, peers optional", async () => {
    await expect(
      requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "v1" }),
    ).resolves.toEqual({ status: "success", grown: null, peers: [] });
  });
});

describe("requestGrownSelection — the no-throw guarantee", () => {
  it("an engine fault degrades to the error result — the buyer keeps the tapped clip", async () => {
    mocks.selectVideos.mockRejectedValue(new Error("engine secret missing"));

    await expect(
      requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "v1" }),
    ).resolves.toEqual({ status: "error", grown: null, peers: [] });
  });

  it("a deps-composition fault (missing ENGINE_COOKIE_SECRET) degrades the same way", async () => {
    mocks.createEngineDeps.mockImplementation(() => {
      throw new Error("[engine] Missing environment variable ENGINE_COOKIE_SECRET");
    });

    await expect(
      requestGrownSelection({ storeId: STORE_ID, tappedVideoId: "v1" }),
    ).resolves.toEqual({ status: "error", grown: null, peers: [] });
    expect(mocks.selectVideos).not.toHaveBeenCalled();
  });
});
