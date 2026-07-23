/**
 * GROWN selection view-model (B2) — the client-safe shape of the engine's
 * GROWN preset result. Pure types only: `select.ts` (server-only) produces
 * it, the grow surface renders it, and the B3 handoff carries it. Mirrors
 * the seam style of B1a's `FeedResult` — never raw engine types.
 */

export interface GrownClip {
  videoId: string;
  storeId: string | null;
  src: string;
  poster: string | null;
  durationMs: number | null;
  captionsSrc: string | null;
}

export interface GrownSelection {
  /**
   * "success" | "error" only — GROWN has no empty state by construction:
   * it is reached from a real tapped clip, and that clip alone is a valid
   * selection even when the engine finds no peers (grow-interaction spec,
   * Risk table: "Grown clip alone is valid; peers optional").
   */
  status: "success" | "error";
  /** The engine's grown pick — usually the tapped intro clip promoted. */
  grown: GrownClip | null;
  /** The tapped store's peer clips, carried into the world handoff (B3). */
  peers: GrownClip[];
}
