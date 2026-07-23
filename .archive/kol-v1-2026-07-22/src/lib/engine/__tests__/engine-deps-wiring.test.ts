import { afterEach, describe, expect, it, vi } from "vitest";

import { createEngineDeps } from "../index";
import type { Candidate, EngineContext } from "../types";

/**
 * KEYLESS wiring guard for createEngineDeps (QA-Lead gate-1 must-fix 6).
 *
 * The single defect W2-WIRE exists to close — a signed-in seller's own
 * unpublished clips entering the public feed — was previously caught ONLY by
 * live-composition.test.ts, which needs staging keys. This suite pins the
 * wiring with zero keys: the anon factory's output MUST land in the
 * eligibility path, and the service-role factory's output MUST reach the
 * ranker ONLY. Mutation-verified: swapping `db: createAnonClient()` for
 * `createAdminClient()` in createEngineDeps turns this file red.
 *
 * ONLY the two supabase client factories are mocked — nothing under
 * lib/engine/* is ever mocked here (same rule as composition.test.ts).
 */

const { fromLog, createAnonClientSpy, createAdminClientSpy } = vi.hoisted(() => {
  const fromLog: string[] = [];
  /** Chainable recording stub: every `.from(table)` call logs `label:table`. */
  function recordingClient(label: "anon" | "admin") {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "contains", "overlaps", "eq", "or", "order", "limit"]) {
      query[method] = () => query;
    }
    query.then = <T>(resolve: (value: { data: never[]; error: null }) => T): Promise<T> =>
      Promise.resolve({ data: [] as never[], error: null }).then(resolve);
    return {
      from(table: string) {
        fromLog.push(`${label}:${table}`);
        return query;
      },
    };
  }
  const anonSentinel = recordingClient("anon");
  const adminSentinel = recordingClient("admin");
  return {
    fromLog,
    createAnonClientSpy: vi.fn(() => anonSentinel),
    createAdminClientSpy: vi.fn(() => adminSentinel),
  };
});

vi.mock("@/lib/supabase/anon", () => ({ createAnonClient: createAnonClientSpy }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: createAdminClientSpy }));

/** ≥32 bytes — createEngineDeps enforces the minimum secret length. */
const TEST_SECRET = "w2-wire-deps-wiring-test-secret-32-bytes-min";

function memoryCookieJar() {
  const jar = {
    value: undefined as string | undefined,
    read: (): string | undefined => jar.value,
    write: (next: string): void => {
      jar.value = next;
    },
  };
  return jar;
}

function ctx(overrides: Partial<EngineContext> = {}): EngineContext {
  return {
    state: "FEED",
    buyerId: null,
    sessionId: "session-wiring",
    storeScope: null,
    productId: null,
    moodHint: null,
    limit: 12,
    ...overrides,
  };
}

/** Minimal ranked-pool member so rank() takes the buyer_signals path. */
function candidate(): Candidate {
  const createdAt = "2026-07-01T00:00:00+00:00";
  return {
    videoId: "video-1",
    video: {
      id: "video-1",
      owner_id: "owner-1",
      store_id: "store-1",
      src: "https://cdn.example/video-1.mp4",
      poster: null,
      duration_ms: 20_000,
      captions_src: null,
      created_at: createdAt,
    },
    profile: {
      id: "profile-1",
      video_id: "video-1",
      purpose: ["intro"],
      page_eligibility: ["feed"],
      product_links: [],
      mood: [],
      anti_repetition_key: null,
      created_at: createdAt,
    },
    storeId: "store-1",
    ownerId: "owner-1",
    features: null,
    score: null,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  fromLog.length = 0;
  createAnonClientSpy.mockClear();
  createAdminClientSpy.mockClear();
});

describe("createEngineDeps — client wiring (keyless invariant guard)", () => {
  it("eligibility reads the ANON client; the service-role client reaches the ranker ONLY", async () => {
    vi.stubEnv("ENGINE_COOKIE_SECRET", TEST_SECRET);
    const deps = createEngineDeps(memoryCookieJar());

    // Both factories were invoked exactly once by the composition root.
    expect(createAnonClientSpy).toHaveBeenCalledOnce();
    expect(createAdminClientSpy).toHaveBeenCalledOnce();

    // Stage 1: the eligibility query MUST run on the anon factory's output.
    // Running it on the admin (or cookie-bound user) client is the
    // unpublished-clip defect — drafts satisfy owner RLS, enter the FEED
    // pool, and newestPerStore guarantees them a slot.
    await deps.eligible(ctx({ state: "FEED" }));
    expect(fromLog).toEqual(["anon:video_profiles"]);

    // Stage 2: the buyer_signals read (RLS-private, §5.4) MUST run on the
    // service-role factory's output — and the anon client must not see it.
    await deps.ranker.rank([candidate()], ctx({ state: "FEED", buyerId: "buyer-1" }));
    expect(fromLog).toEqual(["anon:video_profiles", "admin:buyer_signals"]);
  });
});
