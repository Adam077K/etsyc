"use server";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { z } from "zod";

import { createEngineDeps, selectVideos } from "@/lib/engine";
import { createClient } from "@/lib/supabase/server";

import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE } from "@/lib/feed/session";

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

    // Session scope for jitter + the ring — minted on first engine read.
    let sessionId = jar.get(FEED_SESSION_COOKIE)?.value;
    if (!sessionId) {
      sessionId = randomUUID();
      jar.set(FEED_SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    // Relationship term only — selection reads stay on the engine's own
    // anon client (createEngineDeps wires that internally; W2-WIRE).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const deps = createEngineDeps({
      read: () => jar.get(FEED_RING_COOKIE)?.value,
      write: (value) =>
        jar.set(FEED_RING_COOKIE, value, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
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
