import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { createEligible, FEED_CANDIDATE_CAP, SCOPED_CANDIDATE_CAP } from "../eligible";
import type { EngineContext } from "../types";

/**
 * Unit tests for stage 1 — the 8-state query map (video-engine §2). The
 * Supabase builder is stubbed with a call-recording fake so each state's
 * predicates are asserted literally: `contains` = `@>`, `overlaps` = `&&`.
 * The live suite (live-eligibility.test.ts) verifies the same map against
 * the real GIN-indexed staging DB.
 */

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface FakeResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

class FakeQuery {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly result: FakeResult) {}

  private record(method: string, args: unknown[]): this {
    this.calls.push({ method, args });
    return this;
  }

  select(...args: unknown[]) {
    return this.record("select", args);
  }
  contains(...args: unknown[]) {
    return this.record("contains", args);
  }
  overlaps(...args: unknown[]) {
    return this.record("overlaps", args);
  }
  eq(...args: unknown[]) {
    return this.record("eq", args);
  }
  order(...args: unknown[]) {
    return this.record("order", args);
  }
  limit(...args: unknown[]) {
    return this.record("limit", args);
  }

  then<T>(resolve: (value: FakeResult) => T): Promise<T> {
    return Promise.resolve(this.result).then(resolve);
  }
}

/** One FakeQuery per db.from() call, consuming `results` in order. */
function fakeDb(results: FakeResult[]) {
  const queries: FakeQuery[] = [];
  const db = {
    from(table: string) {
      const query = new FakeQuery(
        results[queries.length] ?? { data: [], error: null },
      );
      query.calls.push({ method: "from", args: [table] });
      queries.push(query);
      return query;
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, queries };
}

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

let rowSeq = 0;

function row(overrides: {
  videoId?: string;
  storeId?: string | null;
  createdAt?: string;
  purpose?: string[];
  page?: string[];
  productLinks?: string[];
  mood?: string[];
  key?: string | null;
}) {
  rowSeq += 1;
  const videoId = overrides.videoId ?? `video-${rowSeq}`;
  return {
    id: `profile-${rowSeq}`,
    video_id: videoId,
    purpose: overrides.purpose ?? ["intro"],
    page_eligibility: overrides.page ?? ["feed"],
    product_links: overrides.productLinks ?? [],
    mood: overrides.mood ?? [],
    anti_repetition_key: overrides.key ?? null,
    created_at: overrides.createdAt ?? "2026-07-01T00:00:00+00:00",
    videos: {
      id: videoId,
      owner_id: "owner-1",
      store_id: overrides.storeId === undefined ? "store-1" : overrides.storeId,
      src: `https://cdn.example/${videoId}.mp4`,
      poster: null,
      duration_ms: 20_000,
      captions_src: null,
      created_at: overrides.createdAt ?? "2026-07-01T00:00:00+00:00",
    },
  };
}

function methodsUsed(query: FakeQuery | undefined): Set<string> {
  return new Set((query?.calls ?? []).map((call) => call.method));
}

function call(query: FakeQuery | undefined, method: string): RecordedCall[] {
  return (query?.calls ?? []).filter((c) => c.method === method);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FEED (§2.1)", () => {
  it("uses the POSITIVE feed predicate — no store filter, no blocklist call shape", async () => {
    const { db, queries } = fakeDb([{ data: [], error: null }]);
    await createEligible(db)(ctx({ state: "FEED" }));

    expect(queries).toHaveLength(1);
    const [query] = queries;
    expect(call(query, "from")[0]?.args).toEqual(["video_profiles"]);
    expect(call(query, "select")[0]?.args).toEqual(["*, videos!inner(*)"]);
    expect(call(query, "contains")).toEqual([
      { method: "contains", args: ["page_eligibility", ["feed"]] },
    ]);
    expect(call(query, "overlaps")).toEqual([
      { method: "overlaps", args: ["purpose", ["intro", "craft-story", "atmosphere"]] },
    ]);
    // F3 (§6): the window is bounded SERVER-SIDE — newest-tagged first,
    // capped — so db-max-rows truncation can never precede the JS sort.
    expect(call(query, "order")).toEqual([
      { method: "order", args: ["created_at", { ascending: false }] },
    ]);
    expect(call(query, "limit")).toEqual([
      { method: "limit", args: [FEED_CANDIDATE_CAP] },
    ]);
    expect(FEED_CANDIDATE_CAP).toBe(300);
    // Cross-maker: no store restriction; and structurally no negative
    // (not/neq) predicate exists — the exclusion is the positive contains.
    expect(methodsUsed(query)).toEqual(
      new Set(["from", "select", "contains", "overlaps", "order", "limit"]),
    );
  });

  it("reduces to each store's newest eligible clip (distinct on store_id) with features/score null", async () => {
    const storeAOld = row({ storeId: "store-a", createdAt: "2026-01-01T00:00:00+00:00" });
    const storeANew = row({ storeId: "store-a", createdAt: "2026-07-01T00:00:00+00:00" });
    const storeB = row({ storeId: "store-b", createdAt: "2026-03-01T00:00:00+00:00" });
    const { db } = fakeDb([{ data: [storeAOld, storeB, storeANew], error: null }]);

    const candidates = await createEligible(db)(ctx({ state: "FEED" }));

    expect(candidates.map((c) => c.videoId)).toEqual([
      storeANew.video_id,
      storeB.video_id,
    ]);
    for (const candidate of candidates) {
      expect(candidate.features).toBeNull();
      expect(candidate.score).toBeNull();
    }
    expect(candidates[0]?.storeId).toBe("store-a");
    expect(candidates[0]?.ownerId).toBe("owner-1");
    expect(candidates[0]?.profile.page_eligibility).toEqual(["feed"]);
    expect(candidates[0]?.video.src).toContain(storeANew.video_id);
  });

  it("newest-per-store reduction holds within the capped window (F3)", async () => {
    // The server returns AT MOST FEED_CANDIDATE_CAP rows, newest-tagged
    // first. Whatever arrives, the JS sort + reduction still yield one
    // newest clip per store — semantics unchanged inside the window.
    const windowRows = [
      row({ storeId: "store-a", createdAt: "2026-07-10T00:00:00+00:00" }),
      row({ storeId: "store-b", createdAt: "2026-07-09T00:00:00+00:00" }),
      row({ storeId: "store-a", createdAt: "2026-07-08T00:00:00+00:00" }),
      row({ storeId: "store-c", createdAt: "2026-07-07T00:00:00+00:00" }),
      row({ storeId: "store-b", createdAt: "2026-07-06T00:00:00+00:00" }),
    ];
    const { db, queries } = fakeDb([{ data: windowRows, error: null }]);

    const candidates = await createEligible(db)(ctx({ state: "FEED" }));

    expect(windowRows.length).toBeLessThanOrEqual(FEED_CANDIDATE_CAP);
    expect(call(queries[0], "limit")).toEqual([
      { method: "limit", args: [FEED_CANDIDATE_CAP] },
    ]);
    expect(candidates.map((c) => c.storeId)).toEqual(["store-a", "store-b", "store-c"]);
    expect(candidates.map((c) => c.videoId)).toEqual([
      windowRows[0]?.video_id,
      windowRows[1]?.video_id,
      windowRows[3]?.video_id,
    ]);
  });
});

describe("store-scoped states (§2 map)", () => {
  const cases = [
    { state: "GROWN", page: ["grown"], purposes: ["intro", "craft-story"] },
    { state: "WORLD_OPEN", page: ["world"], purposes: ["intro", "craft-story", "atmosphere"] },
    { state: "WORLD_BROWSE", page: ["world"], purposes: ["process", "atmosphere", "craft-story"] },
    { state: "CHECKOUT", page: ["checkout"], purposes: ["atmosphere"] },
    { state: "THANK_YOU", page: ["thankyou"], purposes: ["thankyou"] },
  ] as const;

  it.each(cases)("$state: page @> $page, purpose && $purposes, store = scope", async ({ state, page, purposes }) => {
    const { db, queries } = fakeDb([{ data: [], error: null }]);
    await createEligible(db)(ctx({ state, storeScope: "store-9" }));

    const [query] = queries;
    expect(call(query, "contains")).toEqual([
      { method: "contains", args: ["page_eligibility", [...page]] },
    ]);
    expect(call(query, "overlaps")).toEqual([
      { method: "overlaps", args: ["purpose", [...purposes]] },
    ]);
    expect(call(query, "eq")).toEqual([
      { method: "eq", args: ["videos.store_id", "store-9"] },
    ]);
    // F3: scoped states are bounded too — order + cap, semantics unchanged.
    expect(call(query, "order")).toEqual([
      { method: "order", args: ["created_at", { ascending: false }] },
    ]);
    expect(call(query, "limit")).toEqual([
      { method: "limit", args: [SCOPED_CANDIDATE_CAP] },
    ]);
    expect(SCOPED_CANDIDATE_CAP).toBe(100);
  });

  it("null storeScope degrades to [] without issuing a query", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, queries } = fakeDb([]);
    const result = await createEligible(db)(ctx({ state: "GROWN", storeScope: null }));

    expect(result).toEqual([]);
    expect(queries).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});

describe("NARRATE_SHRINK / PRODUCT_PAGE (§2.2)", () => {
  it("NARRATE_SHRINK: product_links @> {productId} primary, purpose @> {product-narration}", async () => {
    const narration = row({ page: ["product"], purpose: ["product-narration"] });
    const { db, queries } = fakeDb([{ data: [narration], error: null }]);

    const result = await createEligible(db)(
      ctx({ state: "NARRATE_SHRINK", storeScope: "store-9", productId: "product-1" }),
    );

    expect(queries).toHaveLength(1);
    expect(call(queries[0], "contains")).toEqual([
      { method: "contains", args: ["page_eligibility", ["product"]] },
      { method: "contains", args: ["product_links", ["product-1"]] },
      { method: "contains", args: ["purpose", ["product-narration"]] },
    ]);
    expect(call(queries[0], "eq")).toEqual([
      { method: "eq", args: ["videos.store_id", "store-9"] },
    ]);
    expect(call(queries[0], "limit")).toEqual([
      { method: "limit", args: [SCOPED_CANDIDATE_CAP] },
    ]);
    expect(result.map((c) => c.videoId)).toEqual([narration.video_id]);
  });

  it("dangling product link → zero rows → fallback drops the product_links predicate", async () => {
    const fallbackClip = row({ page: ["product"], purpose: ["product-narration"] });
    const { db, queries } = fakeDb([
      { data: [], error: null },
      { data: [fallbackClip], error: null },
    ]);

    const result = await createEligible(db)(
      ctx({ state: "NARRATE_SHRINK", storeScope: "store-9", productId: "dangling-id" }),
    );

    expect(queries).toHaveLength(2);
    const fallbackContains = call(queries[1], "contains");
    expect(fallbackContains).toEqual([
      { method: "contains", args: ["page_eligibility", ["product"]] },
      { method: "contains", args: ["purpose", ["product-narration"]] },
    ]);
    expect(result.map((c) => c.videoId)).toEqual([fallbackClip.video_id]);
  });

  it("still empty after fallback → empty selection, NEVER a throw", async () => {
    const { db, queries } = fakeDb([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    await expect(
      createEligible(db)(
        ctx({ state: "NARRATE_SHRINK", storeScope: "store-9", productId: "dangling-id" }),
      ),
    ).resolves.toEqual([]);
    expect(queries).toHaveLength(2);
  });

  it("PRODUCT_PAGE primary overlaps purpose {product-narration, process}", async () => {
    const narration = row({ page: ["product"], purpose: ["process"] });
    const { db, queries } = fakeDb([{ data: [narration], error: null }]);

    await createEligible(db)(
      ctx({ state: "PRODUCT_PAGE", storeScope: "store-9", productId: "product-1" }),
    );

    expect(queries).toHaveLength(1);
    expect(call(queries[0], "overlaps")).toEqual([
      { method: "overlaps", args: ["purpose", ["product-narration", "process"]] },
    ]);
    expect(call(queries[0], "contains")).toEqual([
      { method: "contains", args: ["page_eligibility", ["product"]] },
      { method: "contains", args: ["product_links", ["product-1"]] },
    ]);
  });

  it("null productId goes straight to the store-wide narration fallback", async () => {
    const { db, queries } = fakeDb([{ data: [], error: null }]);
    await createEligible(db)(
      ctx({ state: "PRODUCT_PAGE", storeScope: "store-9", productId: null }),
    );

    expect(queries).toHaveLength(1);
    expect(call(queries[0], "contains")).toEqual([
      { method: "contains", args: ["page_eligibility", ["product"]] },
      { method: "contains", args: ["purpose", ["product-narration"]] },
    ]);
  });
});

describe("degrade-safety", () => {
  it("a DB error logs a structured payload and returns [], never a throw", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb([
      { data: null, error: { message: "boom", code: "XX000" } },
    ]);

    await expect(createEligible(db)(ctx({ state: "FEED" }))).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(errorSpy.mock.calls[0]?.[0]));
    expect(payload).toEqual({
      event: "engine_eligibility_error",
      state: "FEED",
      code: "XX000",
      message: "boom",
    });
  });

  it("unknown tag strings pass through unvalidated — mapping never assumes well-formed enums", async () => {
    const weird = row({ purpose: ["SHOUTING", "not-a-real-tag"], page: ["feed"] });
    const { db } = fakeDb([{ data: [weird], error: null }]);

    const result = await createEligible(db)(ctx({ state: "FEED" }));
    expect(result).toHaveLength(1);
    expect(result[0]?.profile.purpose).toEqual(["SHOUTING", "not-a-real-tag"]);
  });
});
