/**
 * B4 (WORLD_BROWSE) shared contract — importable from client and server.
 * Lives apart from the server action because a "use server" module may only
 * export async functions.
 */

/**
 * First-party session identity cookie (NOT the auth session — must work for
 * anonymous buyers). The engine's seeded jitter and anti-repetition scope
 * both key off it: same session → same order, new session → reshuffle.
 *
 * CONVERGED WITH B1a (2026-07-22): name, value shape (uuid) and attributes
 * (httpOnly / lax / secure-in-prod / path=/ / NO maxAge — browser-session
 * lifetime is load-bearing for the reshuffle AC) match B1a's
 * `FEED_SESSION_COOKIE` (lib/feed/session.ts). B4 NEVER MINTS IT — the
 * proxy middleware (updateSession) mints on every matched request; two
 * minters = races. Gate-2 follow-up: swap this literal for B1a's export
 * once both branches merge.
 */
export const KOL_SESSION_COOKIE = "kol_sid";

/**
 * The engine's signed anti-repetition key ring (cookie-ring.ts owns the
 * value format; callers pass it through opaque). One ring across FEED and
 * WORLD_BROWSE so nothing loops anywhere within a session. Matches B1a's
 * `FEED_RING_COOKIE` (lib/feed/select.ts). B4's server action IS the
 * intended ring-persistence path: B1a's RSC deliberately cannot write
 * cookies (a persisted ring on feed reloads would break "same sessionId →
 * same order"), so the ring this unit writes is the ring the feed reads.
 */
export const ENGINE_RING_COOKIE = "kol_ring";

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
