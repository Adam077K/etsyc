import type { FilmEdge } from "@/components/film/edge-table";
import type { WorldStage } from "./stages";

/**
 * Stage-pair → §5.2 edge mapping for the buyer walk. WORLD_OPEN ↔
 * WORLD_BROWSE is deliberately edge-less — it is a scroll, not an event,
 * and nothing may animate there. The preview rail can jump non-adjacent
 * stages; jumps resolve to the nearest §5.2 edge rather than inventing new
 * ones. WORLD_OPEN → GROWN (preview back-walk only) is unfold reversed
 * under the §5.1 return-ratio rule — a derived reverse, not a new edge.
 */
const STAGE_ORDER: Record<WorldStage, number> = {
  feed: 0,
  grown: 1,
  "world-open": 2,
  "world-browse": 3,
  "narrate-shrink": 4,
};

export function heroEdgeFor(
  previous: WorldStage,
  next: WorldStage,
): { edge: FilmEdge | null; reverse?: boolean } {
  if (previous === next) return { edge: null };
  if (next === "narrate-shrink") return { edge: "dock" };
  if (previous === "narrate-shrink") return { edge: "undock" };
  if (STAGE_ORDER[next] > STAGE_ORDER[previous]) {
    if (previous === "feed") return { edge: "grow" };
    if (previous === "world-open" && next === "world-browse") return { edge: null };
    return { edge: "unfold" };
  }
  if (next === "feed") return { edge: "ungrow" };
  if (next === "grown") return { edge: "unfold", reverse: true };
  return { edge: null }; // world-browse → world-open: still a scroll
}
