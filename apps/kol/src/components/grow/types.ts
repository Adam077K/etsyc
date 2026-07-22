import type { GrownSelection } from "@/lib/grow/types";

/**
 * B2 seam types — what a feed card hands the grow machinery on tap, and
 * what the grow surface hands B3 on the second tap.
 *
 * `GrowSource` is structurally satisfiable from B1a's `FeedCard` view
 * model ({ videoId, storeId, makerName, src, poster, captionsSrc, … }) —
 * B1b maps a tapped card into this at the tap site. `craftLine` and
 * `focalPoint` are optional because the FeedCard contract does not carry
 * them yet (flagged in decisions_made); everything renders correctly
 * without them.
 */
export interface GrowSource {
  /** Video cards run the film path; image cards run "meet the person". */
  kind: "video" | "image";
  /** Engine video id — null for image cards (their film comes from GROWN). */
  videoId: string | null;
  storeId: string;
  makerName: string;
  /** "CERAMICIST · LISBON" — rendered when present (screen-specs §2.2). */
  craftLine?: string | null;
  /** Clip src (kind "video"); unused for image cards. */
  src: string;
  /** Clip poster (video) or the portrait image itself (image). */
  poster: string;
  captionsSrc?: string | null;
  /** clips[].focalPoint (v1.3, CPO Ruling 3) — rides into the Film Layer. */
  focalPoint?: { x: number; y: number };
  /** Real alt text — required in spirit for the image path. */
  alt?: string;
}

/**
 * Second tap → toward `WORLD_OPEN`. B3 owns the unfold; the composition
 * that receives this mounts the maker's world (StoreWorld at stage
 * "grown", advancing to "world-open" — WORLD_STAGES vocabulary) while the
 * film stays claimed in the root Film Layer. The grow surface does NOT
 * unmount itself on advance: the parent unmounts it after the world's
 * hero slot has claimed the film, so the frame is never parked mid-beat.
 */
export interface GrowHandoff {
  source: GrowSource;
  /** GROWN engine result if resolved — B3 may refetch its own preset regardless. */
  selection: GrownSelection | null;
}
