/**
 * The buyer-journey world stages the renderer must survive (spec P4,
 * store-engine-spine): the hero film persists — never unmounts, never
 * pauses — across every one of these. FEED/GROWN belong to the feed
 * surface (B1) in the full app; the renderer carries them so the unfold
 * can be simulated and transition-tested end-to-end before the feed exists.
 */
export const WORLD_STAGES = [
  "feed",
  "grown",
  "world-open",
  "world-browse",
  "narrate-shrink",
] as const;

export type WorldStage = (typeof WORLD_STAGES)[number];

/** Stage labels for the preview stage rail (buyer-journey vocabulary). */
export const STAGE_LABELS: Record<WorldStage, string> = {
  feed: "Feed",
  grown: "Grown",
  "world-open": "World opens",
  "world-browse": "Browse",
  "narrate-shrink": "Narrate",
};

/** Stages where the world body (non-hero blocks) is present around the film. */
export function isWorldUnfolded(stage: WorldStage): boolean {
  return stage !== "feed" && stage !== "grown";
}
