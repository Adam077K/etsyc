/**
 * B4 (WORLD_BROWSE) shared contract — importable from client and server.
 * Lives apart from the server action because a "use server" module may only
 * export async functions.
 */

/**
 * COOKIE NAMES LIVE IN lib/feed — deliberately not redeclared here.
 * `FEED_SESSION_COOKIE` ("kol_sid", lib/feed/session.ts — minted by the
 * proxy middleware, never by B4) and `FEED_RING_COOKIE` ("kol_ring",
 * lib/feed/select.ts) are the single source of truth: the same session
 * identity scopes the engine's jitter and the same ring carries
 * anti-repetition from FEED into WORLD_BROWSE, so a buyer is never
 * re-shown in a world what the feed just played. The server action imports
 * them directly (select.ts is server-only, so the names cannot be
 * re-exported from this client-safe module).
 */

/**
 * Swap choreography floor (screen-specs §4.2, closes B4 OQ #1): a swap is
 * permitted only at a block boundary, when a new block crosses 50% of the
 * viewport, and at most once per 12 seconds. The floor is dramatic, not
 * technical — it stops a fast scroller from triggering a strobe of clips.
 */
export const SWAP_MIN_INTERVAL_MS = 12_000;

/**
 * The WORLD_BROWSE selection view-model — NOT raw engine types (B1a
 * precedent). The client re-joins `videoId` against the world config's
 * `media.clips[]` (they meet at `videos.id`, §B0) so `focalPoint` rides the
 * swap whole; src/poster/captions are the fallback when a canonical clip
 * isn't mirrored in the config.
 */
export interface BrowseSwapClip {
  videoId: string;
  src: string;
  poster: string | null;
  captionsSrc: string | null;
}

/** `null` = nothing eligible to swap to — the player keeps the current clip. */
export type BrowseClipResult = BrowseSwapClip | null;
