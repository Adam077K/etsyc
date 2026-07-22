import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import {
  EngineSecretMissingError,
  createDefaultDeps,
  createEngineDeps,
  selectVideos,
} from "../index";
import type { EngineContext, EngineDeps, Selection } from "../types";

/**
 * REAL-COMPOSITION suite (W2-WIRE STEP 4, QA-Lead condition 3).
 *
 * Every stage here is the real module: real createEligible, real
 * createRulesRanker, real createCookieKeyRing and real antiRepetition
 * (inside real selectVideos), wired through the real composition root
 * (createDefaultDeps). The ONLY substitution is the Supabase client at the
 * outermost boundary — a hand-written SEMANTIC fake that applies
 * contains/overlaps/eq/order/limit to an in-memory table, so the engine's
 * actual query predicates do the filtering (not a JS re-statement of them).
 *
 * There is deliberately NO module mock in this file: nothing under
 * lib/engine/* is ever mocked here, and nothing may ever be.
 */

// --- boundary fakes -----------------------------------------------------------

interface FakeVideoRow {
  id: string;
  owner_id: string;
  store_id: string | null;
  src: string;
  poster: string | null;
  duration_ms: number | null;
  captions_src: string | null;
  created_at: string;
}

interface FakeProfileRow {
  id: string;
  video_id: string;
  purpose: string[];
  page_eligibility: string[];
  product_links: string[];
  mood: string[];
  anti_repetition_key: string | null;
  created_at: string;
  videos: FakeVideoRow;
}

function arrayColumn(row: FakeProfileRow, column: string): string[] {
  switch (column) {
    case "page_eligibility":
      return row.page_eligibility;
    case "purpose":
      return row.purpose;
    case "product_links":
      return row.product_links;
    case "mood":
      return row.mood;
    default:
      throw new Error(`semantic fake: unsupported array column "${column}"`);
  }
}

/**
 * Applies the engine's REAL predicates to an in-memory table. `contains` is
 * `@>` (superset), `overlaps` is `&&` (intersection) — the same semantics
 * Postgres serves, so a wrong predicate in the engine fails these tests.
 */
class SemanticProfilesQuery {
  private rows: FakeProfileRow[];

  constructor(rows: readonly FakeProfileRow[]) {
    this.rows = [...rows];
  }

  select(_columns: string): this {
    return this;
  }

  contains(column: string, values: string[]): this {
    this.rows = this.rows.filter((row) =>
      values.every((value) => arrayColumn(row, column).includes(value)),
    );
    return this;
  }

  overlaps(column: string, values: string[]): this {
    this.rows = this.rows.filter((row) =>
      arrayColumn(row, column).some((value) => values.includes(value)),
    );
    return this;
  }

  eq(column: string, value: unknown): this {
    if (column !== "videos.store_id") {
      throw new Error(`semantic fake: unsupported eq column "${column}"`);
    }
    this.rows = this.rows.filter((row) => row.videos.store_id === value);
    return this;
  }

  order(column: string, opts: { ascending: boolean }): this {
    if (column !== "created_at") {
      throw new Error(`semantic fake: unsupported order column "${column}"`);
    }
    this.rows.sort((a, b) => {
      const delta = Date.parse(a.created_at) - Date.parse(b.created_at);
      return opts.ascending ? delta : -delta;
    });
    return this;
  }

  limit(count: number): this {
    this.rows = this.rows.slice(0, count);
    return this;
  }

  then<T>(resolve: (value: { data: unknown; error: null }) => T): Promise<T> {
    return Promise.resolve({ data: this.rows, error: null }).then(resolve);
  }
}

function anonBoundary(rows: readonly FakeProfileRow[]): SupabaseClient<Database> {
  const db = {
    from(table: string) {
      if (table !== "video_profiles") {
        throw new Error(`semantic fake: unexpected table "${table}" on the anon client`);
      }
      return new SemanticProfilesQuery(rows);
    },
  };
  return db as unknown as SupabaseClient<Database>;
}

interface FakeSignalRow {
  buyer_id: string;
  subject_type: "maker" | "store" | "product";
  subject_id: string;
  signal_type: "commission" | "purchase" | "follow" | "question" | "save" | "review" | "visit";
  weight: number;
  created_at: string;
}

class SemanticSignalsQuery {
  private rows: FakeSignalRow[];

  constructor(rows: readonly FakeSignalRow[]) {
    this.rows = [...rows];
  }

  select(_columns: string): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    if (column !== "buyer_id") {
      throw new Error(`semantic fake: unsupported eq column "${column}"`);
    }
    this.rows = this.rows.filter((row) => row.buyer_id === value);
    return this;
  }

  // The scope union (`or(...)`) only narrows further — passthrough is a safe
  // over-approximation for a boundary fake; the buyer_id eq is what the §5.3
  // privacy guard hangs on and it IS applied above.
  or(_filters: string): this {
    return this;
  }

  then<T>(resolve: (value: { data: unknown; error: null }) => T): Promise<T> {
    return Promise.resolve({ data: this.rows, error: null }).then(resolve);
  }
}

function serviceBoundary(rows: readonly FakeSignalRow[]): SupabaseClient<Database> {
  const db = {
    from(table: string) {
      if (table !== "buyer_signals") {
        throw new Error(
          `semantic fake: unexpected table "${table}" on the service client`,
        );
      }
      return new SemanticSignalsQuery(rows);
    },
  };
  return db as unknown as SupabaseClient<Database>;
}

// --- fixtures -----------------------------------------------------------------

let fixtureSeq = 0;

function clip(overrides: {
  videoId?: string;
  storeId?: string | null;
  ownerId?: string;
  createdAt?: string;
  purpose?: string[];
  page?: string[];
  productLinks?: string[];
  mood?: string[];
  key?: string | null;
}): FakeProfileRow {
  fixtureSeq += 1;
  const videoId = overrides.videoId ?? `video-${fixtureSeq}`;
  const createdAt = overrides.createdAt ?? "2026-07-01T00:00:00+00:00";
  return {
    id: `profile-${fixtureSeq}`,
    video_id: videoId,
    purpose: overrides.purpose ?? ["intro"],
    page_eligibility: overrides.page ?? ["feed"],
    product_links: overrides.productLinks ?? [],
    mood: overrides.mood ?? [],
    anti_repetition_key: overrides.key ?? null,
    created_at: createdAt,
    videos: {
      id: videoId,
      owner_id: overrides.ownerId ?? "owner-1",
      store_id: overrides.storeId === undefined ? `store-${fixtureSeq}` : overrides.storeId,
      src: `https://cdn.example/${videoId}.mp4`,
      poster: null,
      duration_ms: 20_000,
      captions_src: null,
      created_at: createdAt,
    },
  };
}

/**
 * Six stores, one feed clip each — identical created_at / purpose / mood /
 * duration so every scoring term ties and the seeded jitter alone decides
 * the order — plus one thankyou clip (tagged ['thankyou'] ONLY, the locked
 * write-time invariant) that the REAL positive feed predicate must exclude.
 */
function feedWorld(): FakeProfileRow[] {
  const stamp = "2026-07-01T00:00:00+00:00";
  const feedClips = ["a", "b", "c", "d", "e", "f"].map((slug) =>
    clip({
      videoId: `feed-${slug}`,
      storeId: `store-${slug}`,
      createdAt: stamp,
      purpose: ["intro"],
      page: ["feed"],
    }),
  );
  const thankyou = clip({
    videoId: "thankyou-a",
    storeId: "store-a",
    createdAt: stamp,
    purpose: ["thankyou"],
    page: ["thankyou"],
  });
  return [...feedClips, thankyou];
}

// --- rig ------------------------------------------------------------------------

const TEST_SECRET = "w2-wire-composition-test-secret";

function memoryCookieJar(initial?: string) {
  const jar = {
    value: initial,
    read: (): string | undefined => jar.value,
    write: (next: string): void => {
      jar.value = next;
    },
  };
  return jar;
}

function engine(opts: {
  rows: readonly FakeProfileRow[];
  signals?: readonly FakeSignalRow[];
}): { deps: EngineDeps; jar: ReturnType<typeof memoryCookieJar> } {
  const jar = memoryCookieJar();
  const deps = createDefaultDeps({
    db: anonBoundary(opts.rows),
    serviceDb: serviceBoundary(opts.signals ?? []),
    secret: TEST_SECRET,
    cookies: { read: jar.read, write: jar.write },
  });
  return { deps, jar };
}

function ctx(overrides: Partial<EngineContext> = {}): EngineContext {
  return {
    state: "FEED",
    buyerId: null,
    sessionId: "session-composition",
    storeScope: null,
    productId: null,
    moodHint: null,
    limit: 12,
    ...overrides,
  };
}

const ids = (selection: Selection): string[] =>
  selection.clips.map((selected) => selected.videoId);

// --- the real pipeline ----------------------------------------------------------

describe("the real pipeline — no engine module is mocked", () => {
  it("real pipeline: FEED selection never contains a thankyou clip", async () => {
    const rows = feedWorld();
    const { deps } = engine({ rows });

    const selection = await selectVideos(ctx(), deps);

    expect(selection.clips.length).toBeGreaterThan(0);
    expect(ids(selection)).not.toContain("thankyou-a");
    // The exclusion is the REAL positive predicate (page_eligibility @>
    // {feed}) executed by the semantic boundary — not a filter in the test.
    for (const selected of selection.clips) {
      const source = rows.find((row) => row.video_id === selected.videoId);
      expect(source?.page_eligibility).toContain("feed");
      expect(source?.page_eligibility).not.toContain("thankyou");
    }
  });

  it("real pipeline: selection is a subset of the eligible set", async () => {
    const rows = feedWorld();
    // A signed-in buyer with a purchase signal — the REAL ranker takes the
    // service-role path through the boundary fake and reorders; the
    // selection must still be a subset of stage 1's output, trimmed to limit.
    const signals: FakeSignalRow[] = [
      {
        buyer_id: "buyer-1",
        subject_type: "store",
        subject_id: "store-c",
        signal_type: "purchase",
        weight: 1,
        created_at: "2026-06-30T00:00:00+00:00",
      },
    ];
    const { deps } = engine({ rows, signals });
    const buyerCtx = ctx({ buyerId: "buyer-1", limit: 4 });

    const eligibleSet = await deps.eligible(buyerCtx);
    const selection = await selectVideos(buyerCtx, deps);

    const eligibleIds = new Set(eligibleSet.map((candidate) => candidate.videoId));
    expect(selection.clips.length).toBeGreaterThan(0);
    expect(selection.clips.length).toBeLessThanOrEqual(buyerCtx.limit);
    for (const videoId of ids(selection)) {
      expect(eligibleIds.has(videoId)).toBe(true);
    }
    // The relationship term is live: the purchased-from store won the slot.
    expect(ids(selection)[0]).toBe("feed-c");
  });

  it("real pipeline: the ring suppresses a visit-1 clip on visit 2", async () => {
    const rows = feedWorld();
    const { deps, jar } = engine({ rows });

    const visit1 = await selectVideos(ctx({ limit: 1 }), deps);
    expect(visit1.clips).toHaveLength(1);
    const seenFirst = visit1.clips[0]?.videoId;
    // The REAL cookie ring signed and persisted the visit-1 key.
    expect(jar.value).toBeTruthy();
    expect(jar.value).toContain(".");

    const visit2 = await selectVideos(ctx({ limit: 1 }), deps);
    expect(visit2.clips).toHaveLength(1);
    expect(visit2.clips[0]?.videoId).not.toBe(seenFirst);
  });

  it("real pipeline: same sessionId yields the same order, a new sessionId reshuffles", async () => {
    const rows = feedWorld();
    const runFeed = async (sessionId: string): Promise<string[]> =>
      ids(await selectVideos(ctx({ sessionId, limit: 6 }), engine({ rows }).deps));

    const first = await runFeed("session-alpha");
    const repeat = await runFeed("session-alpha");
    const reshuffled = await runFeed("session-beta");

    expect(first).toHaveLength(6);
    expect(repeat).toEqual(first); // deterministic per session — no Math.random
    expect(new Set(reshuffled)).toEqual(new Set(first)); // same membership…
    expect(reshuffled).not.toEqual(first); // …different order: seeded jitter reshuffles
  });
});

// --- the app-facing entry point ---------------------------------------------------

describe("createEngineDeps — the only entry point app code may call", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws EngineSecretMissingError when ENGINE_COOKIE_SECRET is absent — no insecure fallback", () => {
    const original = process.env.ENGINE_COOKIE_SECRET;
    delete process.env.ENGINE_COOKIE_SECRET;
    try {
      expect(() => createEngineDeps(memoryCookieJar())).toThrow(EngineSecretMissingError);
    } finally {
      if (original !== undefined) process.env.ENGINE_COOKIE_SECRET = original;
    }
  });

  it("treats an empty ENGINE_COOKIE_SECRET as missing", () => {
    vi.stubEnv("ENGINE_COOKIE_SECRET", "");
    expect(() => createEngineDeps(memoryCookieJar())).toThrow(EngineSecretMissingError);
  });

  it("constructs the full dependency set internally once the secret is present", () => {
    vi.stubEnv("ENGINE_COOKIE_SECRET", TEST_SECRET);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://w2-wire-test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-sentinel");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-sentinel");

    const deps = createEngineDeps(memoryCookieJar());

    expect(typeof deps.eligible).toBe("function");
    expect(deps.ranker.name).toBe("rules-v1");
    expect(typeof deps.ring.read).toBe("function");
    expect(typeof deps.ring.write).toBe("function");
  });
});
