import type { FeedCardFocalPoint } from "@/lib/feed/select";
import type { GrownSelection } from "@/lib/grow/types";

/**
 * B2 seam types — what a feed card hands the grow machinery on tap, and
 * what the grow surface hands B3 on the second tap.
 *
 * `GrowSource` consumes B1a's shipped `FeedCard` view model field-for-
 * field ({ videoId, storeId, makerName, craft, place, src, poster,
 * captionsSrc, focalPoint, … }) — B1b maps a tapped card into this at the
 * tap site with no renames.
 */
export interface GrowSource {
  /** Video cards run the film path; image cards run "meet the person". */
  kind: "video" | "image";
  /** Engine video id — null for image cards (their film comes from GROWN). */
  videoId: string | null;
  storeId: string;
  makerName: string;
  /** FeedCard.craft — composed with `place` into "CERAMICIST · LISBON" (§2.2). */
  craft: string | null;
  /** FeedCard.place (config.maker.location). */
  place: string | null;
  /** Clip src (kind "video"); unused for image cards. */
  src: string;
  /** Clip poster (video) or the portrait image itself (image). */
  poster: string;
  captionsSrc?: string | null;
  /** FeedCard.focalPoint (v1.3, CPO Ruling 3) — rides into the Film Layer;
      null → the renderer's 0.5/0.5 default applies. */
  focalPoint: FeedCardFocalPoint | null;
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
