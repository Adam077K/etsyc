"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createEngineDeps, selectVideos } from "@/lib/engine";
import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE, resolveFeedSessionId } from "@/lib/feed/session";
import { createClient } from "@/lib/supabase/server";

/**
 * NARRATE_SHRINK selection boundary (B5, contextual-narration-shrink spec).
 *
 * ONE engine read: the clip narrating the product the buyer just opened.
 * The ENGINE owns the fallback chain (eligible.ts productScoped — never
 * reimplemented here):
 *
 *   1. the product-narration clip tied to THIS product
 *      (product_links @> {productId});
 *   2. zero rows — a dangling, stale or absent link is a DATA state, never
 *      a DB error (product_links is uuid[] with no element-level FK) →
 *      any product-narration clip in the store;
 *   3. still empty → empty selection; the CLIENT keeps the currently
 *      playing persistent clip in the dock.
 *
 * And nothing here throws to the buyer: every defect — non-uuid ids
 * (preview fixtures), a missing engine secret, a network fault — degrades
 * to { clip: null }, which the dock renders identically to "this maker
 * recorded no narration" (screen-specs §5.4: all outcomes look the same).
 * There is NEVER buyer-time generation — the engine SELECTS from
 * already-tagged real footage only (D5).
 */

const narrationInputSchema = z.object({
  storeId: z.uuid(),
  productId: z.uuid().nullable(),
});

/**
 * The shared first-party cookie attribute set — B4's RING_COOKIE_OPTIONS
 * shape; the proxy middleware, B1a and every other writer set exactly
 * these. Cookie identity is (name, domain, path) — `Secure` is NOT part of
 * the key — so a write WITHOUT it would REPLACE the middleware's cookie
 * and strip the attribute, putting the HMAC-bearing ring on plaintext
 * http:// requests in production (gate-2 F2). A function, not a module
 * const: NODE_ENV must resolve at write time, never freeze at import.
 */
function ringCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  } as const;
}

/** Serializable slice of SelectedClip the dock swap needs. */
export interface NarrationClip {
  videoId: string;
  src: string;
  poster: string | null;
  captionsSrc: string | null;
}

export async function selectNarration(input: {
  storeId: string;
  productId: string | null;
}): Promise<{ clip: NarrationClip | null }> {
  try {
    const parsed = narrationInputSchema.safeParse(input);
    if (!parsed.success) {
      // Fixture/preview store ids aren't uuids — quiet fallback, no throw.
      return { clip: null };
    }

    const jar = await cookies();

    // Session identity is READ-ONLY here: the proxy middleware is the SOLE
    // kol_sid minter. resolveFeedSessionId validates the client-supplied
    // value (a cookie is untrusted input — a malformed id must never seed
    // the engine's jitter, gate-2 F1) and falls back to an ephemeral id
    // for the one request before the middleware's re-mint lands. Writing
    // kol_sid here would race the middleware's Set-Cookie on the same
    // response (last-write-wins) and could strip its attribute set.
    const sessionId = resolveFeedSessionId(jar.get(FEED_SESSION_COOKIE)?.value);

    // Relationship term only — selection reads stay on the engine's own
    // anon client (createEngineDeps wires that internally; W2-WIRE).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const deps = createEngineDeps({
      read: () => jar.get(FEED_RING_COOKIE)?.value,
      write: (value) => jar.set(FEED_RING_COOKIE, value, ringCookieOptions()),
    });

    const selection = await selectVideos(
      {
        state: "NARRATE_SHRINK",
        buyerId: user?.id ?? null,
        sessionId,
        storeScope: parsed.data.storeId,
        productId: parsed.data.productId,
        moodHint: null,
        limit: 1,
      },
      deps,
    );

    const clip = selection.clips[0];
    return clip
      ? {
          clip: {
            videoId: clip.videoId,
            src: clip.src,
            poster: clip.poster,
            captionsSrc: clip.captionsSrc,
          },
        }
      : { clip: null };
  } catch (error) {
    // Missing secret, network fault, unexpected engine defect — logged for
    // ops, invisible to the buyer: the dock keeps the persistent clip.
    console.error(
      JSON.stringify({
        event: "narration_select_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return { clip: null };
  }
}
