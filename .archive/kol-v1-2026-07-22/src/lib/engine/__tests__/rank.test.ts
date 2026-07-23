import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { SCORING_WEIGHTS, createRulesRanker, seededJitter } from "../rank";
import type { Candidate, EngineContext } from "../types";

// rank.ts is a server-only module (it reads RLS-private buyer_signals via the
// service role); vitest runs without the react-server condition, so the
// package must be stubbed here exactly as the Wave-1 suites stub server.ts.
vi.mock("server-only", () => ({}));

type SignalRowLike = {
  subject_type: "maker" | "store" | "product";
  subject_id: string;
  signal_type:
    | "visit"
    | "purchase"
    | "question"
    | "save"
    | "follow"
    | "commission"
    | "review";
  weight: number;
  created_at: string;
};

/** Records every table touched; resolves the one buyer_signals query shape. */
function serviceDbStub(rows: SignalRowLike[], tables: string[] = []) {
  const db = {
    from(table: string) {
      tables.push(table);
      return {
        select: () => ({
          eq: () => ({
            or: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      };
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, tables };
}

const neverDb = {
  from() {
    throw new Error("service db must not be touched in this scenario");
  },
} as unknown as SupabaseClient<Database>;

function ctx(overrides: Partial<EngineContext> = {}): EngineContext {
  return {
    state: "FEED",
    buyerId: null,
    sessionId: "session-1",
    storeScope: null,
    productId: null,
    moodHint: null,
    limit: 12,
    ...overrides,
  };
}

let seq = 0;

function candidate(overrides: {
  videoId?: string;
  ownerId?: string;
  storeId?: string | null;
  createdAt?: string;
  purpose?: string[];
  mood?: string[];
  productLinks?: string[];
  durationMs?: number | null;
} = {}): Candidate {
  seq += 1;
  const videoId = overrides.videoId ?? `video-${seq}`;
  const createdAt = overrides.createdAt ?? "2026-07-20T00:00:00+00:00";
  const storeId = overrides.storeId === undefined ? "store-1" : overrides.storeId;
  return {
    videoId,
    video: {
      id: videoId,
      owner_id: overrides.ownerId ?? "owner-1",
      store_id: storeId,
      src: `https://cdn.example/${videoId}.mp4`,
      poster: null,
      duration_ms: overrides.durationMs === undefined ? 20_000 : overrides.durationMs,
      captions_src: null,
      created_at: createdAt,
    },
    profile: {
      id: `profile-${seq}`,
      video_id: videoId,
      purpose: overrides.purpose ?? ["intro"],
      page_eligibility: ["feed"],
      product_links: overrides.productLinks ?? [],
      mood: overrides.mood ?? [],
      anti_repetition_key: null,
      created_at: createdAt,
    },
    storeId,
    ownerId: overrides.ownerId ?? "owner-1",
    features: null,
    score: null,
  };
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SCORING_WEIGHTS (§3.2)", () => {
  it("is the launch table verbatim, keyed by all 8 buyer states", () => {
    expect(SCORING_WEIGHTS).toEqual({
      FEED: { business: 0.3, situation: 0.15, freshness: 0.25, relationship: 0.3 },
      GROWN: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
      WORLD_OPEN: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
      WORLD_BROWSE: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
      NARRATE_SHRINK: { business: 0.6, situation: 0.3, freshness: 0.1, relationship: 0 },
      PRODUCT_PAGE: { business: 0.6, situation: 0.3, freshness: 0.1, relationship: 0 },
      CHECKOUT: { business: 0.7, situation: 0.3, freshness: 0, relationship: 0 },
      THANK_YOU: { business: 0.7, situation: 0.3, freshness: 0, relationship: 0 },
    });
  });
});

describe("seededJitter (§3.3)", () => {
  it("is deterministic: same (sessionId, videoId) → identical value", () => {
    expect(seededJitter("session-a", "video-1")).toBe(seededJitter("session-a", "video-1"));
  });

  it("stays inside [0, ε) for the default and a custom epsilon", () => {
    for (let i = 0; i < 50; i += 1) {
      const value = seededJitter(`session-${i}`, `video-${i}`);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(0.05);
      const custom = seededJitter(`session-${i}`, `video-${i}`, 0.5);
      expect(custom).toBeGreaterThanOrEqual(0);
      expect(custom).toBeLessThan(0.5);
    }
  });

  it("varies with the videoId and with the sessionId", () => {
    expect(seededJitter("session-a", "video-1")).not.toBe(
      seededJitter("session-a", "video-2"),
    );
    expect(seededJitter("session-a", "video-1")).not.toBe(
      seededJitter("session-b", "video-1"),
    );
  });
});

describe("RulesRanker — determinism", () => {
  const sixIdenticalClips = () =>
    ["a", "b", "c", "d", "e", "f"].map((id) => candidate({ videoId: `video-${id}` }));

  it("same sessionId → identical order; new sessionId → reshuffled; Math.random NEVER called", async () => {
    const randomSpy = vi.spyOn(Math, "random");
    const ranker = createRulesRanker({ serviceDb: neverDb });

    const first = await ranker.rank(sixIdenticalClips(), ctx({ sessionId: "visit-1" }));
    const second = await ranker.rank(sixIdenticalClips(), ctx({ sessionId: "visit-1" }));
    const reshuffled = await ranker.rank(sixIdenticalClips(), ctx({ sessionId: "visit-2" }));

    expect(first.map((c) => c.videoId)).toEqual(second.map((c) => c.videoId));
    expect(reshuffled.map((c) => c.videoId)).not.toEqual(first.map((c) => c.videoId));
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it("is pure: fills features/score on a NEW array and never mutates its input", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    const input = sixIdenticalClips();

    const ranked = await ranker.rank(input, ctx());

    expect(ranked).not.toBe(input);
    for (const original of input) {
      expect(original.features).toBeNull();
      expect(original.score).toBeNull();
    }
    for (const scored of ranked) {
      expect(scored.features).not.toBeNull();
      expect(typeof scored.score).toBe("number");
    }
    const scores = ranked.map((c) => c.score ?? 0);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("is named rules-v1 and returns [] for an empty pool", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    expect(ranker.name).toBe("rules-v1");
    await expect(ranker.rank([], ctx())).resolves.toEqual([]);
  });
});

describe("RulesRanker — business + situation terms", () => {
  it("orders exact purpose intent above adjacent (WORLD_BROWSE: process > craft-story)", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    const processClip = candidate({ videoId: "video-process", purpose: ["process"] });
    const storyClip = candidate({ videoId: "video-story", purpose: ["craft-story"] });

    const ranked = await ranker.rank(
      [storyClip, processClip],
      ctx({ state: "WORLD_BROWSE", storeScope: "store-1" }),
    );

    expect(ranked.map((c) => c.videoId)).toEqual(["video-process", "video-story"]);
    expect(ranked[0]?.features?.business).toBe(1);
    expect(ranked[1]?.features?.business).toBe(0.5);
  });

  it("moodHint pulls matching-mood clips up (Jaccard situation term)", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    const calm = candidate({ videoId: "video-calm", mood: ["calm"] });
    const energetic = candidate({ videoId: "video-energetic", mood: ["energetic"] });

    const ranked = await ranker.rank(
      [energetic, calm],
      ctx({ state: "FEED", moodHint: ["calm"] }),
    );

    expect(ranked.map((c) => c.videoId)).toEqual(["video-calm", "video-energetic"]);
  });
});

describe("RulesRanker — relationship term (§5, D16-7)", () => {
  it("anonymous buyer → relationship 0 for every candidate and NO service-role query", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    const ranked = await ranker.rank(
      [candidate(), candidate()],
      ctx({ buyerId: null }),
    );
    for (const scored of ranked) {
      expect(scored.features?.relationship).toBe(0);
    }
  });

  it("zero relationship weight (THANK_YOU) never touches buyer_signals even signed-in", async () => {
    const ranker = createRulesRanker({ serviceDb: neverDb });
    const thankyou = candidate({ purpose: ["thankyou"] });
    await expect(
      ranker.rank([thankyou], ctx({ state: "THANK_YOU", buyerId: "buyer-1", storeScope: "store-1" })),
    ).resolves.toHaveLength(1);
  });

  it("a followed maker ranks above a stranger — per-buyer signals, buyer_signals only", async () => {
    const followed = candidate({ videoId: "video-followed", ownerId: "maker-followed", storeId: "store-f" });
    const stranger = candidate({ videoId: "video-stranger", ownerId: "maker-stranger", storeId: "store-s" });
    const { db, tables } = serviceDbStub([
      {
        subject_type: "maker",
        subject_id: "maker-followed",
        signal_type: "follow",
        weight: 1,
        created_at: daysAgo(1),
      },
    ]);
    const ranker = createRulesRanker({ serviceDb: db });

    const ranked = await ranker.rank(
      [stranger, followed],
      ctx({ buyerId: "buyer-1" }),
    );

    expect(ranked.map((c) => c.videoId)).toEqual(["video-followed", "video-stranger"]);
    expect(ranked[0]?.features?.relationship).toBeGreaterThan(0);
    expect(ranked[1]?.features?.relationship).toBe(0);
    // The ranker NEVER re-queries eligibility: the only table it may read
    // is buyer_signals (via the service role).
    expect([...new Set(tables)]).toEqual(["buyer_signals"]);
  });

  it("visit contribution is capped at 3 effective visits", async () => {
    const clip = () => candidate({ videoId: "video-x", ownerId: "maker-x", storeId: null });
    const visit = (): SignalRowLike => ({
      subject_type: "maker",
      subject_id: "maker-x",
      signal_type: "visit",
      weight: 1,
      created_at: daysAgo(0),
    });

    const tenVisits = createRulesRanker({
      serviceDb: serviceDbStub(Array.from({ length: 10 }, visit)).db,
    });
    const threeVisits = createRulesRanker({
      serviceDb: serviceDbStub(Array.from({ length: 3 }, visit)).db,
    });

    const [cappedAtTen] = await tenVisits.rank([clip()], ctx({ buyerId: "buyer-1" }));
    const [cappedAtThree] = await threeVisits.rank([clip()], ctx({ buyerId: "buyer-1" }));

    expect(cappedAtTen?.features?.relationship).toBeCloseTo(
      cappedAtThree?.features?.relationship ?? Number.NaN,
      5,
    );
  });

  it("recency decay: a 400-day-old purchase contributes ~nothing next to a fresh one", async () => {
    const clip = () => candidate({ videoId: "video-x", ownerId: "maker-x", storeId: null });
    const purchase = (createdAt: string): SignalRowLike => ({
      subject_type: "maker",
      subject_id: "maker-x",
      signal_type: "purchase",
      weight: 1,
      created_at: createdAt,
    });

    const fresh = createRulesRanker({ serviceDb: serviceDbStub([purchase(daysAgo(0))]).db });
    const stale = createRulesRanker({ serviceDb: serviceDbStub([purchase(daysAgo(400))]).db });

    const [freshClip] = await fresh.rank([clip()], ctx({ buyerId: "buyer-1" }));
    const [staleClip] = await stale.rank([clip()], ctx({ buyerId: "buyer-1" }));

    expect(staleClip?.features?.relationship ?? 1).toBeLessThan(0.001);
    expect(freshClip?.features?.relationship ?? 0).toBeGreaterThan(0.4);
  });

  it("the squash keeps relationship in [0, 1) even for enormous affinity — bias, never monopoly", async () => {
    const clip = () => candidate({ videoId: "video-x", ownerId: "maker-x", storeId: null });
    const heavy: SignalRowLike[] = Array.from({ length: 20 }, () => ({
      subject_type: "maker",
      subject_id: "maker-x",
      signal_type: "commission",
      weight: 100,
      created_at: daysAgo(0),
    }));

    const ranker = createRulesRanker({ serviceDb: serviceDbStub(heavy).db });
    const [scored] = await ranker.rank([clip()], ctx({ buyerId: "buyer-1" }));

    expect(scored?.features?.relationship ?? 1).toBeLessThan(1);
    expect(scored?.features?.relationship ?? 0).toBeGreaterThan(0.99);
  });
});
