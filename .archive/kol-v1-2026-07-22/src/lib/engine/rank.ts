// SERVER-ONLY MODULE — the ranker reads `buyer_signals`, which is RLS-private
// (video-engine §5.4). The Relationship term is computed server-side with the
// service-role client and is never sent to or computed in the browser.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type {
  BuyerState,
  Candidate,
  EngineContext,
  Mood,
  Purpose,
  Ranker,
  ScoreFeatures,
  ScoringWeights,
} from "./types";

/**
 * Stage 2 — the default `RulesRanker` (video-engine §3.2/§3.3/§5).
 *
 *   score = w_business·Business + w_situation·Situation
 *         + w_freshness·Freshness + w_relation·Relationship
 *
 * Every term is normalised to [0,1] before weighting. The ranker NEVER
 * re-queries eligibility — it only fills features and reorders what stage 1
 * already deemed eligible. No `Math.random` anywhere: the Freshness jitter is
 * `seededJitter(sessionId, videoId)`, so the same session reproduces the same
 * order and a new session reshuffles.
 */

/** §3.2 launch weights, verbatim — configuration, not architecture (ADR-0003). */
export const SCORING_WEIGHTS: Record<BuyerState, ScoringWeights> = {
  FEED: { business: 0.3, situation: 0.15, freshness: 0.25, relationship: 0.3 },
  GROWN: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
  WORLD_OPEN: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
  WORLD_BROWSE: { business: 0.45, situation: 0.3, freshness: 0.15, relationship: 0.1 },
  NARRATE_SHRINK: { business: 0.6, situation: 0.3, freshness: 0.1, relationship: 0 },
  PRODUCT_PAGE: { business: 0.6, situation: 0.3, freshness: 0.1, relationship: 0 },
  CHECKOUT: { business: 0.7, situation: 0.3, freshness: 0, relationship: 0 },
  THANK_YOU: { business: 0.7, situation: 0.3, freshness: 0, relationship: 0 },
};

const DEFAULT_EPSILON = 0.05;
const DAY_MS = 86_400_000;
/** Freshness: `1 - normalized_age`, age normalised over a 90-day horizon. */
const AGE_HORIZON_DAYS = 90;
/** Missing data (no mood target, untagged mood, null duration) scores neutral. */
const NEUTRAL = 0.5;

/**
 * §3.3 — deterministic jitter into [0, ε), ε default 0.05. FNV-1a 32-bit over
 * `sessionId:videoId`: same session → identical order (reproducible,
 * testable); new session → new seed → the feed reshuffles per visit.
 */
export function seededJitter(
  sessionId: string,
  videoId: string,
  epsilon: number = DEFAULT_EPSILON,
): number {
  const input = `${sessionId}:${videoId}`;
  let hash = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return ((hash >>> 0) / 0x100000000) * epsilon;
}

// --- Business — purpose fit to the state's intent (§3.2 term table) ---------
// Exact intent match = 1.0, adjacent = 0.5. The intent ordering follows the
// §2 state→query map's purpose listing (first-listed = the state's primary
// intent; WORLD_OPEN's signature clip is the intro the world unfolds around).

const PURPOSE_INTENT: Record<
  BuyerState,
  { exact: readonly Purpose[]; adjacent: readonly Purpose[] }
> = {
  FEED: { exact: ["intro"], adjacent: ["craft-story", "atmosphere"] },
  GROWN: { exact: ["intro"], adjacent: ["craft-story"] },
  WORLD_OPEN: { exact: ["intro"], adjacent: ["craft-story", "atmosphere"] },
  WORLD_BROWSE: { exact: ["process"], adjacent: ["atmosphere", "craft-story"] },
  NARRATE_SHRINK: { exact: ["product-narration"], adjacent: [] },
  PRODUCT_PAGE: { exact: ["product-narration"], adjacent: ["process"] },
  CHECKOUT: { exact: ["atmosphere"], adjacent: [] },
  THANK_YOU: { exact: ["thankyou"], adjacent: [] },
};

function overlapsSet(tags: readonly string[], wanted: readonly string[]): boolean {
  return tags.some((tag) => wanted.includes(tag));
}

function businessTerm(candidate: Candidate, state: BuyerState): number {
  const intent = PURPOSE_INTENT[state];
  if (overlapsSet(candidate.profile.purpose, intent.exact)) return 1;
  if (overlapsSet(candidate.profile.purpose, intent.adjacent)) return 0.5;
  return 0;
}

// --- Situation — mood fit (Jaccard) + duration fit for the slot -------------
// State-default moods per the §2 map; GROWN (inherit feed clip) and WORLD_*
// (store brand mood) arrive via ctx.moodHint from the caller.

const STATE_DEFAULT_MOOD: Record<BuyerState, readonly Mood[] | null> = {
  FEED: null,
  GROWN: null,
  WORLD_OPEN: null,
  WORLD_BROWSE: null,
  NARRATE_SHRINK: ["intimate"],
  PRODUCT_PAGE: ["intimate"],
  CHECKOUT: ["calm"],
  THANK_YOU: ["warm"],
};

/** Feed favours short punchy clips; the world player tolerates longer. */
const IDEAL_DURATION_MS: Record<BuyerState, number> = {
  FEED: 30_000,
  GROWN: 60_000,
  WORLD_OPEN: 90_000,
  WORLD_BROWSE: 90_000,
  NARRATE_SHRINK: 45_000,
  PRODUCT_PAGE: 45_000,
  CHECKOUT: 30_000,
  THANK_YOU: 30_000,
};

function jaccard(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const value of setA) {
    if (setB.has(value)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function situationTerm(candidate: Candidate, ctx: EngineContext): number {
  const target =
    ctx.moodHint !== null && ctx.moodHint.length > 0
      ? ctx.moodHint
      : STATE_DEFAULT_MOOD[ctx.state];
  const moodScore =
    target === null || target.length === 0 || candidate.profile.mood.length === 0
      ? NEUTRAL
      : jaccard(candidate.profile.mood, target);
  const ideal = IDEAL_DURATION_MS[ctx.state];
  const duration = candidate.video.duration_ms;
  const durationFit =
    duration === null
      ? NEUTRAL
      : duration <= ideal
        ? 1
        : Math.max(0, 1 - (duration - ideal) / ideal);
  return 0.7 * moodScore + 0.3 * durationFit;
}

// --- Freshness — recency + seeded jitter (§3.3) ------------------------------

function freshnessTerm(candidate: Candidate, ctx: EngineContext, now: number): number {
  const ageDays = Math.max(0, (now - Date.parse(candidate.video.created_at)) / DAY_MS);
  const ageScore = 1 - Math.min(ageDays / AGE_HORIZON_DAYS, 1);
  // Scale into [0, 1-ε] before adding jitter so jitter always affects ordering
  // (two brand-new clips must not both clamp to 1.0) and the term stays [0,1).
  return (
    ageScore * (1 - DEFAULT_EPSILON) +
    seededJitter(ctx.sessionId, candidate.videoId, DEFAULT_EPSILON)
  );
}

// --- Relationship — per-buyer affinity, NEVER popularity (§5) ----------------

type SignalRow = Pick<
  Database["public"]["Tables"]["buyer_signals"]["Row"],
  "subject_type" | "subject_id" | "signal_type" | "weight" | "created_at"
>;

/** §5.2 signal → relationship weight (multiplies buyer_signals.weight). */
const SIGNAL_WEIGHTS: Record<SignalRow["signal_type"], number> = {
  commission: 5.0,
  purchase: 4.0,
  follow: 3.0,
  question: 2.0,
  save: 1.5,
  review: 1.5,
  visit: 1.0,
};

/** §5.3 guards: recency decay τ, visit cap, saturating squash x/(x+k). */
const RECENCY_TAU_DAYS = 30;
const VISIT_CAP_EFFECTIVE = 3;
const SQUASH_K = 5;

/**
 * One batched query for the whole candidate pool — ALWAYS filtered to
 * `buyer_id = ctx.buyerId` (§5.3 guard 1). No global counts, no cross-buyer
 * aggregate, ever: that is popularity, the exact flattening KOL exists to
 * fight. A query failure degrades to zero affinity, never a crash.
 */
async function fetchBuyerSignals(
  serviceDb: SupabaseClient<Database>,
  buyerId: string,
  candidates: readonly Candidate[],
): Promise<SignalRow[]> {
  const makerIds = new Set<string>();
  const storeIds = new Set<string>();
  const productIds = new Set<string>();
  for (const candidate of candidates) {
    makerIds.add(candidate.ownerId);
    if (candidate.storeId !== null) storeIds.add(candidate.storeId);
    for (const productId of candidate.profile.product_links) productIds.add(productId);
  }
  const scopes: string[] = [];
  if (makerIds.size > 0) {
    scopes.push(`and(subject_type.eq.maker,subject_id.in.(${[...makerIds].join(",")}))`);
  }
  if (storeIds.size > 0) {
    scopes.push(`and(subject_type.eq.store,subject_id.in.(${[...storeIds].join(",")}))`);
  }
  if (productIds.size > 0) {
    scopes.push(`and(subject_type.eq.product,subject_id.in.(${[...productIds].join(",")}))`);
  }

  const { data, error } = await serviceDb
    .from("buyer_signals")
    .select("subject_type, subject_id, signal_type, weight, created_at")
    .eq("buyer_id", buyerId)
    .or(scopes.join(","));
  if (error) {
    console.error(
      JSON.stringify({
        event: "engine_relationship_error",
        code: error.code,
        message: error.message,
      }),
    );
    return [];
  }
  return data ?? [];
}

function relationshipTerm(
  candidate: Candidate,
  signals: readonly SignalRow[],
  now: number,
): number {
  const linkedProducts = new Set(candidate.profile.product_links);
  let visitRaw = 0;
  let restRaw = 0;
  for (const signal of signals) {
    const matches =
      (signal.subject_type === "maker" && signal.subject_id === candidate.ownerId) ||
      (signal.subject_type === "store" && signal.subject_id === candidate.storeId) ||
      (signal.subject_type === "product" && linkedProducts.has(signal.subject_id));
    if (!matches) continue;
    const ageDays = Math.max(0, (now - Date.parse(signal.created_at)) / DAY_MS);
    const term =
      SIGNAL_WEIGHTS[signal.signal_type] *
      signal.weight *
      Math.exp(-ageDays / RECENCY_TAU_DAYS);
    if (signal.signal_type === "visit") visitRaw += term;
    else restRaw += term;
  }
  // Visit capped at 3 effective visits; the whole rawAffinity is squashed so
  // relationship biases toward makers you care about but can never monopolise
  // the feed — discovery of new makers is preserved (§5.3 guards 2+3).
  const raw = restRaw + Math.min(visitRaw, VISIT_CAP_EFFECTIVE * SIGNAL_WEIGHTS.visit);
  return raw / (raw + SQUASH_K);
}

// --- The ranker ---------------------------------------------------------------

export function createRulesRanker(deps: { serviceDb: SupabaseClient<Database> }): Ranker {
  return {
    name: "rules-v1",
    async rank(candidates: Candidate[], ctx: EngineContext): Promise<Candidate[]> {
      if (candidates.length === 0) return [];
      const weights = SCORING_WEIGHTS[ctx.state];
      const now = Date.now();
      // Anonymous buyer → Relationship = 0 (cold-start). A zero relationship
      // weight (narration/checkout/thankyou states) skips the service-role
      // query entirely — no signal read can influence those states.
      const signals =
        ctx.buyerId === null || weights.relationship === 0
          ? []
          : await fetchBuyerSignals(deps.serviceDb, ctx.buyerId, candidates);
      const scored = candidates.map((candidate): Candidate & { score: number } => {
        const features: ScoreFeatures = {
          business: businessTerm(candidate, ctx.state),
          situation: situationTerm(candidate, ctx),
          freshness: freshnessTerm(candidate, ctx, now),
          relationship: ctx.buyerId === null ? 0 : relationshipTerm(candidate, signals, now),
        };
        const score =
          weights.business * features.business +
          weights.situation * features.situation +
          weights.freshness * features.freshness +
          weights.relationship * features.relationship;
        return { ...candidate, features, score };
      });
      // Deterministic order: score desc, then videoId — exact ties can't flap.
      scored.sort((a, b) => b.score - a.score || a.videoId.localeCompare(b.videoId));
      return scored;
    },
  };
}
