import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { Candidate, EngineContext, VideoProfileRow, VideoRow } from "./types";

/**
 * Stage 1 — eligibility (video-engine §2, the 8-state query map).
 *
 * One set-intersection query per buyer state over the GIN-indexed
 * `video_profiles` arrays, joined to `videos` for scope. `.contains` is
 * Postgres `@>` (array-contains) and `.overlaps` is `&&` (array-overlap) —
 * both GIN-index-served.
 *
 * The FEED predicate is POSITIVE (`page_eligibility @> {'feed'}`): a
 * thankyou clip is tagged `['thankyou']` ONLY (locked, store-config §2.3),
 * so it can never satisfy the feed query. The exclusion is structural —
 * there is no code path that adds a thank-you clip to the feed, and this
 * module must never grow a blocklist variant of that rule.
 *
 * Tag arrays are bare `text[]` with no CHECK constraint: an unknown string
 * simply fails the set intersection (degrade-safe), and untagged footage
 * (empty arrays) matches no state query at all — invisible by default.
 *
 * Returns `Candidate[]` with `features: null` and `score: null`; stage 2
 * (rank) fills both. RLS note: `videos`/`video_profiles` are public-readable
 * for PUBLISHED stores, so the anon-key client is sufficient here.
 */

const CANDIDATE_SELECT = "*, videos!inner(*)";

type EligibleRow = VideoProfileRow & { videos: VideoRow };

/** Awaited query shape — structural, so unit tests can stub the builder. */
type EligibilityQuery = PromiseLike<{
  data: unknown;
  error: { message: string; code?: string } | null;
}>;

function toCandidate(row: EligibleRow): Candidate {
  return {
    videoId: row.video_id,
    video: row.videos,
    profile: {
      id: row.id,
      video_id: row.video_id,
      purpose: row.purpose,
      page_eligibility: row.page_eligibility,
      product_links: row.product_links,
      mood: row.mood,
      anti_repetition_key: row.anti_repetition_key,
      created_at: row.created_at,
    },
    storeId: row.videos.store_id,
    ownerId: row.videos.owner_id,
    features: null,
    score: null,
  };
}

/** Newest clip first (`order by v.created_at desc`), stable id tie-break. */
function byNewestFirst(a: Candidate, b: Candidate): number {
  const delta = Date.parse(b.video.created_at) - Date.parse(a.video.created_at);
  return delta !== 0 ? delta : a.videoId.localeCompare(b.videoId);
}

/**
 * FEED's `distinct on (v.store_id)` applied post-fetch (PostgREST has no
 * DISTINCT ON): input is newest-first, so the first clip seen per store is
 * that store's newest eligible clip — one hero candidate per store enters
 * scoring (magazine variety, §2.1).
 */
function newestPerStore(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string | null>();
  const out: Candidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.storeId)) continue;
    seen.add(candidate.storeId);
    out.push(candidate);
  }
  return out;
}

/** Runs a built query; a DB error degrades to an empty pool, never a throw. */
async function run(query: EligibilityQuery, state: string): Promise<Candidate[]> {
  const { data, error } = await query;
  if (error) {
    console.error(
      JSON.stringify({
        event: "engine_eligibility_error",
        state,
        code: error.code ?? null,
        message: error.message,
      }),
    );
    return [];
  }
  return ((data ?? []) as EligibleRow[]).map(toCandidate).sort(byNewestFirst);
}

export function createEligible(
  db: SupabaseClient<Database>,
): (ctx: EngineContext) => Promise<Candidate[]> {
  const profiles = () => db.from("video_profiles").select(CANDIDATE_SELECT);

  /** Store-scoped states: page ⊇ {page}, purpose && purposes, store = scope. */
  async function scoped(
    ctx: EngineContext,
    page: string[],
    purposes: string[],
  ): Promise<Candidate[]> {
    if (ctx.storeScope === null) {
      console.error(
        JSON.stringify({ event: "engine_eligibility_missing_scope", state: ctx.state }),
      );
      return [];
    }
    return run(
      profiles()
        .contains("page_eligibility", page)
        .overlaps("purpose", purposes)
        .eq("videos.store_id", ctx.storeScope),
      ctx.state,
    );
  }

  /**
   * NARRATE_SHRINK / PRODUCT_PAGE (§2.2). Primary: the clip tied to THIS
   * product via `product_links @> {productId}`. `product_links` has no
   * element-level FK — a dangling id yields ZERO ROWS (never an error) and
   * the documented fallback runs: drop the product_links predicate → any
   * product-narration clip in the store; still empty → empty selection.
   */
  async function productScoped(ctx: EngineContext): Promise<Candidate[]> {
    if (ctx.storeScope === null) {
      console.error(
        JSON.stringify({ event: "engine_eligibility_missing_scope", state: ctx.state }),
      );
      return [];
    }
    if (ctx.productId !== null) {
      let primary = profiles()
        .contains("page_eligibility", ["product"])
        .contains("product_links", [ctx.productId])
        .eq("videos.store_id", ctx.storeScope);
      primary =
        ctx.state === "PRODUCT_PAGE"
          ? primary.overlaps("purpose", ["product-narration", "process"])
          : primary.contains("purpose", ["product-narration"]);
      const hit = await run(primary, ctx.state);
      if (hit.length > 0) return hit;
    }
    return run(
      profiles()
        .contains("page_eligibility", ["product"])
        .contains("purpose", ["product-narration"])
        .eq("videos.store_id", ctx.storeScope),
      ctx.state,
    );
  }

  return async function eligible(ctx: EngineContext): Promise<Candidate[]> {
    switch (ctx.state) {
      case "FEED": {
        // §2.1 — cross-maker (store unrestricted), POSITIVE feed predicate,
        // one newest eligible clip per store. Mood is a scoring bias, never
        // an eligibility filter (keep the pool wide).
        const pool = await run(
          profiles()
            .contains("page_eligibility", ["feed"])
            .overlaps("purpose", ["intro", "craft-story", "atmosphere"]),
          ctx.state,
        );
        return newestPerStore(pool);
      }
      case "GROWN":
        return scoped(ctx, ["grown"], ["intro", "craft-story"]);
      case "WORLD_OPEN":
        return scoped(ctx, ["world"], ["intro", "craft-story", "atmosphere"]);
      case "WORLD_BROWSE":
        return scoped(ctx, ["world"], ["process", "atmosphere", "craft-story"]);
      case "NARRATE_SHRINK":
      case "PRODUCT_PAGE":
        return productScoped(ctx);
      case "CHECKOUT":
        return scoped(ctx, ["checkout"], ["atmosphere"]);
      case "THANK_YOU":
        return scoped(ctx, ["thankyou"], ["thankyou"]);
    }
  };
}
