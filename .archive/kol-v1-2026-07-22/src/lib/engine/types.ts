/**
 * Video engine — shared type contract (P6, ADR-0003 / KOL-video-engine-spec.md).
 * SHARED FILE: authored byte-identically by P6a and P6b on parallel branches.
 * Do not edit without a CTO contract change — both halves compile against it.
 */

export type BuyerState =
  | "FEED" | "GROWN" | "WORLD_OPEN" | "WORLD_BROWSE"
  | "NARRATE_SHRINK" | "PRODUCT_PAGE" | "CHECKOUT" | "THANK_YOU";

export type Purpose =
  | "intro" | "craft-story" | "process" | "product-narration" | "thankyou" | "atmosphere";
export type PageEligibility =
  | "feed" | "grown" | "world" | "product" | "checkout" | "thankyou";
export type Mood = "calm" | "warm" | "energetic" | "intimate";

export interface EngineContext {
  state: BuyerState;
  buyerId: string | null;   // null = anonymous → Relationship term is 0
  sessionId: string;        // seeded-jitter + anti-repetition scope
  storeScope: string | null;
  productId: string | null;
  moodHint: Mood[] | null;
  limit: number;
}

/** Mirrors public.video_profiles Row (database.types.ts) — snake_case, arrays never null. */
export interface VideoProfileRow {
  id: string;
  video_id: string;
  purpose: string[];
  page_eligibility: string[];
  product_links: string[];
  mood: string[];
  anti_repetition_key: string | null;
  created_at: string;
}

/** Mirrors public.videos Row. */
export interface VideoRow {
  id: string;
  owner_id: string;
  store_id: string | null;
  src: string;
  poster: string | null;
  duration_ms: number | null;
  captions_src: string | null;
  created_at: string;
}

export interface ScoreFeatures {
  business: number;
  situation: number;
  freshness: number;
  relationship: number;
}

export interface ScoringWeights {
  business: number;
  situation: number;
  freshness: number;
  relationship: number;
}

export interface Candidate {
  videoId: string;
  video: VideoRow;
  profile: VideoProfileRow;
  storeId: string | null;
  ownerId: string;
  features: ScoreFeatures | null;  // null until rank() has run
  score: number | null;            // null until rank() has run
}

export interface ScoreTrace {
  videoId: string;
  features: ScoreFeatures;
  weights: ScoringWeights;
  jitter: number;
  score: number;
}

export interface SelectedClip {
  videoId: string;
  storeId: string | null;
  ownerId: string;
  src: string;
  poster: string | null;
  durationMs: number | null;
  captionsSrc: string | null;
  antiRepetitionKey: string;   // resolved: profile.anti_repetition_key ?? videoId
}

export interface Selection {
  clips: SelectedClip[];
  debug?: ScoreTrace[];
}

/** Stage-2 seam (video-engine §4.1). Reorders/trims only — never re-queries eligibility. */
export interface Ranker {
  readonly name: string;
  rank(candidates: Candidate[], ctx: EngineContext): Promise<Candidate[]>;
}

/** Anti-repetition key ring — bounded, newest-wins (video-engine §3.1). */
export const KEY_RING_MAX = 50;
export type KeyRing = readonly string[];

export interface KeyRingStore {
  read(): Promise<KeyRing>;
  write(ring: KeyRing): Promise<void>;
}

/** Composition seam: selectVideos takes its stages as deps so the halves stay independent. */
export interface EngineDeps {
  eligible: (ctx: EngineContext) => Promise<Candidate[]>;
  ranker: Ranker;
  ring: KeyRingStore;
}

/** Dedupe key resolution — anti_repetition_key, falling back to videoId (video-engine §3.1). */
export function resolveAntiRepetitionKey(candidate: Candidate): string {
  return candidate.profile.anti_repetition_key ?? candidate.videoId;
}
