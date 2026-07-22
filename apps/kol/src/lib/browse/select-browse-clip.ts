"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createEngineDeps, selectVideos } from "@/lib/engine";
import { createClient } from "@/lib/supabase/server";

import {
  ENGINE_RING_COOKIE,
  KOL_SESSION_COOKIE,
  type BrowseClipResult,
} from "./contract";

/**
 * The WORLD_BROWSE server boundary — the browser never touches the engine
 * (its composition root is server-only by design). A server action rather
 * than a route handler because the anti-repetition ring and the session
 * cookie must both be WRITTEN per selection, and actions are the one
 * client-callable surface that may set cookies.
 *
 * SWAPS ARE SCORING-DRIVEN, NEVER RANDOM (AC): the clip comes out of
 * `selectVideos`' weighted-sum ranking, and stage 3 (anti-repetition)
 * always runs after scoring, so nothing loops within the session. This
 * module contains no selection logic of its own — it is context assembly
 * and a view-model.
 */

const StoreIdSchema = z.string().uuid();
const SessionIdSchema = z.string().uuid();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * Select the next `process`/`atmosphere` clip for a browsing buyer, or
 * `null` when nothing is eligible — the caller keeps the current clip
 * playing (graceful, never an error; screen-specs §4.4). Engine, DB, or
 * config failures also resolve `null`: a swap that can't happen is a
 * non-event, never error chrome over a playing film.
 */
export async function selectBrowseClip(storeId: string): Promise<BrowseClipResult> {
  // Zod gate on the one external input. Non-uuid store ids (fixtures,
  // preview surfaces) short-circuit before any DB work.
  const parsedStoreId = StoreIdSchema.safeParse(storeId);
  if (!parsedStoreId.success) return null;

  try {
    const cookieStore = await cookies();

    // Session identity: first-party, anonymous-safe, generated on first
    // need. The cookie is client input — anything but a uuid is replaced,
    // never trusted (it seeds the ranker's jitter).
    const rawSession = cookieStore.get(KOL_SESSION_COOKIE)?.value;
    const parsedSession = SessionIdSchema.safeParse(rawSession);
    const sessionId = parsedSession.success ? parsedSession.data : crypto.randomUUID();
    if (!parsedSession.success) {
      cookieStore.set(KOL_SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
    }

    // Anon-safe buyer identity: null = anonymous (Relationship term is 0).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // createEngineDeps is the ONLY permitted entry point — it wires the
    // anon client internally so eligibility can never see a signed-in
    // seller's drafts (§B0 / W2-WIRE).
    const deps = createEngineDeps({
      read: () => cookieStore.get(ENGINE_RING_COOKIE)?.value,
      write: (value) => cookieStore.set(ENGINE_RING_COOKIE, value, COOKIE_OPTIONS),
    });

    const selection = await selectVideos(
      {
        state: "WORLD_BROWSE",
        buyerId: user?.id ?? null,
        sessionId,
        storeScope: parsedStoreId.data,
        productId: null,
        moodHint: null,
        limit: 1,
      },
      deps,
    );

    const clip = selection.clips[0];
    if (!clip) return null;

    return {
      videoId: clip.videoId,
      src: clip.src,
      poster: clip.poster,
      captionsSrc: clip.captionsSrc,
    };
  } catch {
    // Missing secret, DB outage, malformed anything → keep the current
    // clip. The film always wins; the failure surfaces in server logs,
    // never in the world.
    return null;
  }
}
