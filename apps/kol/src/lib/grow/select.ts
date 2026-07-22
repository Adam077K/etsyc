// SERVER-ONLY MODULE — reaches the engine composition root, which reads
// ENGINE_COOKIE_SECRET and constructs the service-role ranker. The browser
// gets to this only through the `requestGrownSelection` server action.
import "server-only";

import { createEngineDeps, selectVideos, type EngineContext } from "@/lib/engine";
import type { GrownClip, GrownSelection } from "./types";

/**
 * GROWN preset bound (grow-interaction spec §Scalability: "peer resolution
 * scoped to one store_id — bounded"). Seed stores carry ~5 clips each; 6
 * leaves headroom without ever becoming a feed-sized read.
 */
export const GROWN_LIMIT = 6;

/**
 * First-party session cookie the grow surface reads/sets for engine
 * identity (seeded jitter + anti-repetition scope). NOT the auth session —
 * it must exist for anonymous buyers too. B1a's feed data layer derives
 * the same identity; converge on one name at feed integration.
 */
export const GROW_SESSION_COOKIE = "kol_session";

/** Signed anti-repetition ring cookie (value shape is the engine's). */
export const ENGINE_RING_COOKIE = "kol_engine_ring";

/**
 * The engine's GROWN read for a tapped clip's store: returns the grown
 * clip (usually the same feed intro clip promoted — spec D5) plus that
 * store's peers. Errors NEVER throw into the render tree — the grown
 * surface keeps playing the tapped clip regardless; this result only
 * confirms the pick and supplies peers for the B3 handoff.
 */
export async function getGrownSelection(opts: {
  storeId: string;
  /** The tapped clip — preferred as the grown pick when the engine returns it. */
  tappedVideoId: string | null;
  buyerId: string | null;
  sessionId: string;
  cookies: { read: () => string | undefined; write: (value: string) => void };
}): Promise<GrownSelection> {
  const ctx: EngineContext = {
    state: "GROWN",
    buyerId: opts.buyerId,
    sessionId: opts.sessionId,
    storeScope: opts.storeId,
    productId: null,
    moodHint: null,
    limit: GROWN_LIMIT,
  };
  try {
    const deps = createEngineDeps(opts.cookies);
    const selection = await selectVideos(ctx, deps);
    const clips: GrownClip[] = selection.clips.map((clip) => ({
      videoId: clip.videoId,
      storeId: clip.storeId,
      src: clip.src,
      poster: clip.poster,
      durationMs: clip.durationMs,
      captionsSrc: clip.captionsSrc,
    }));
    const grown =
      (opts.tappedVideoId !== null
        ? clips.find((clip) => clip.videoId === opts.tappedVideoId)
        : undefined) ??
      clips[0] ??
      null;
    return {
      status: "success",
      grown,
      peers: clips.filter((clip) => clip !== grown),
    };
  } catch {
    return { status: "error", grown: null, peers: [] };
  }
}
