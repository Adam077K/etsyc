// SERVER-ONLY MODULE — composes the video engine (whose deps include the
// service-role ranker) with the anon-client maker join. Nothing here may
// reach a client bundle; B1b imports the FeedResult view-model types only.
import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  createEngineDeps,
  selectVideos,
  type EngineContext,
  type SelectedClip,
} from "@/lib/engine";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Discovery-feed data layer (W3-B1a — discovery-feed spec §Technical).
 *
 * getFeedSelection() is the ONLY feed entry point: it builds the FEED
 * EngineContext, runs the engine through createEngineDeps (the composition
 * root that structurally cannot wire the cookie-bound user client into
 * eligibility), joins maker identity from `stores` at the PUBLIC trust
 * level, and returns a view-model — never raw engine types. B1b renders
 * FeedResult; the engine↔renderer contract stays narrow (video-engine §0.1).
 */

/**
 * Feed selection size — spec band 12–24, fixed at 18 by Design-Lead
 * (discovery-feed spec OQ-2, closed 2026-07-21: six three-slot spreads).
 * Named const so B1b and Design-Lead can move it in exactly one place.
 */
export const FEED_LIMIT_DEFAULT = 18;

/**
 * First-party anti-repetition ring cookie (engine stage 3). HttpOnly; the
 * value is HMAC-signed and verified by the engine's cookie ring — a
 * tampered value reads as an empty ring, never as an error.
 */
export const FEED_RING_COOKIE = "kol_ring";

/**
 * The ring cookie's WRITE ATTRIBUTES — the single declaration every ring
 * writer imports, beside the name it belongs to (the DECISIONS.md cookie
 * canon covers attributes, not just names: four independently re-typed
 * copies agreed by luck, and diverging attributes make browsers fork the
 * cookie by scope, silently splitting the ring between journey states).
 * A FUNCTION, not a const: `secure` must resolve NODE_ENV at write time,
 * never freeze at import (gate-2 F2 — the browse module-const had exactly
 * that freeze). Writers: the feed read-path below, grow, browse,
 * narration. The middleware's kol_sid mint re-types the same shape but
 * cannot import from here (edge runtime vs this module's server graph).
 */
export function ringCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  } as const;
}

export type FeedCardAspect = "1:1" | "4:5" | "3:2" | "16:9";

/** 0–1 art-direction anchor (the maker's FACE) for cross-aspect crops. */
export type FeedCardFocalPoint = { x: number; y: number };

/**
 * Data-layer default card aspect: the feed card composes clips at 4:5
 * (ClipSchema v1.3 note / CPO Ruling 3). Per-slot aspect VARIETY is a
 * composition decision owned by B1b + Design-Lead — the data layer emits
 * one honest default rather than inventing a span pattern.
 */
export const FEED_CARD_ASPECT_DEFAULT: FeedCardAspect = "4:5";

export type FeedCard = {
  videoId: string;
  storeId: string;
  /** stores.handle (unique, not null) — defensively falls back to the id. */
  storeSlugOrId: string;
  /** config.maker.displayName, falling back to stores.name. */
  makerName: string;
  /** Craft line — stores.craft column, falling back to config.maker.craft. */
  craft: string | null;
  /** config.maker.location (e.g. "Whitstable, Kent"). */
  place: string | null;
  /** Resolved from config.media.images[maker.avatarMediaId].src. */
  avatarUrl: string | null;
  src: string;
  poster: string | null;
  durationMs: number | null;
  captionsSrc: string | null;
  /** FEED_CARD_ASPECT_DEFAULT for every card — see that const's doc. */
  aspect: FeedCardAspect;
  /**
   * The clip's focalPoint (config.media.clips[].focalPoint, keyed by
   * clip id === videos.id — §B0 OQ-2). null → the RENDERER applies the
   * 0.5/0.5 default (ClipSchema keeps stored configs round-trip clean).
   */
  focalPoint: FeedCardFocalPoint | null;
};

export type FeedResult = {
  status: "success" | "empty" | "error";
  cards: FeedCard[];
};

/**
 * Read-side PROJECTION of stores.config — non-strict on purpose. The P3
 * validator owns write-time correctness; the feed tolerates any stored
 * shape and degrades to column data rather than ever throwing into the
 * render tree.
 */
const feedConfigProjection = z.object({
  maker: z
    .object({
      displayName: z.string().min(1),
      craft: z.string().min(1),
      location: z.string().min(1),
      avatarMediaId: z.string().nullable(),
    })
    .optional(),
  media: z
    .object({
      clips: z
        .array(
          z.object({
            id: z.string().min(1),
            focalPoint: z
              .object({
                x: z.number().min(0).max(1),
                y: z.number().min(0).max(1),
              })
              .optional(),
          }),
        )
        .optional(),
      images: z
        .array(z.object({ id: z.string().min(1), src: z.string().min(1) }))
        .optional(),
    })
    .optional(),
});

type StoreMeta = {
  handle: string;
  name: string;
  craft: string | null;
  makerName: string | null;
  place: string | null;
  avatarUrl: string | null;
  focalPointByVideoId: ReadonlyMap<string, FeedCardFocalPoint>;
};

function toStoreMeta(row: {
  id: string;
  handle: string;
  name: string;
  craft: string | null;
  config: unknown;
}): StoreMeta {
  const parsed = feedConfigProjection.safeParse(row.config ?? {});
  if (!parsed.success) {
    // A published store whose config the projection can't read is an
    // anomaly (the write path validates strictly) — surface it, but the
    // feed still renders from column data.
    console.error("[feed] store config unreadable — falling back to columns", {
      storeId: row.id,
      issues: parsed.error.issues.slice(0, 3),
    });
    return {
      handle: row.handle,
      name: row.name,
      craft: row.craft,
      makerName: null,
      place: null,
      avatarUrl: null,
      focalPointByVideoId: new Map(),
    };
  }

  const { maker, media } = parsed.data;
  const focalPointByVideoId = new Map<string, FeedCardFocalPoint>();
  for (const clip of media?.clips ?? []) {
    if (clip.focalPoint) focalPointByVideoId.set(clip.id, clip.focalPoint);
  }
  const avatarUrl =
    maker?.avatarMediaId == null
      ? null
      : ((media?.images ?? []).find((image) => image.id === maker.avatarMediaId)
          ?.src ?? null);

  return {
    handle: row.handle,
    name: row.name,
    craft: row.craft ?? maker?.craft ?? null,
    makerName: maker?.displayName ?? null,
    place: maker?.location ?? null,
    avatarUrl,
    focalPointByVideoId,
  };
}

/**
 * ONE additional anon-client read (never N+1, never via the engine): the
 * engine deliberately returns no maker identity, so the feed resolves
 * store/maker metadata itself at the PUBLIC trust level — RLS
 * `stores_public_read_published` scopes this join exactly like the clip
 * read that produced the selection. Engine order is preserved.
 */
async function resolveMakerCards(
  clips: readonly SelectedClip[],
): Promise<FeedCard[]> {
  const storeIds = [
    ...new Set(
      clips.flatMap((clip) => (clip.storeId === null ? [] : [clip.storeId])),
    ),
  ];
  if (storeIds.length === 0) return [];

  const anon = createAnonClient();
  const { data, error } = await anon
    .from("stores")
    .select("id, handle, name, craft, config")
    .in("id", storeIds);
  if (error) {
    throw new Error(`[feed] maker join failed: ${error.message}`);
  }

  const metaByStoreId = new Map<string, StoreMeta>(
    (data ?? []).map((row) => [row.id, toStoreMeta(row)]),
  );

  const cards: FeedCard[] = [];
  for (const clip of clips) {
    const meta =
      clip.storeId === null ? undefined : metaByStoreId.get(clip.storeId);
    if (clip.storeId === null || meta === undefined) {
      // A FEED clip must belong to a publicly readable store (the clip row
      // itself was served under *_public_read_published). Drop and surface —
      // a maker-less card would break the feed's premise.
      console.error("[feed] clip without a readable store — dropped", {
        videoId: clip.videoId,
        storeId: clip.storeId,
      });
      continue;
    }
    cards.push({
      videoId: clip.videoId,
      storeId: clip.storeId,
      storeSlugOrId: meta.handle === "" ? clip.storeId : meta.handle,
      makerName: meta.makerName ?? meta.name,
      craft: meta.craft,
      place: meta.place,
      avatarUrl: meta.avatarUrl,
      src: clip.src,
      poster: clip.poster,
      durationMs: clip.durationMs,
      captionsSrc: clip.captionsSrc,
      aspect: FEED_CARD_ASPECT_DEFAULT,
      focalPoint: meta.focalPointByVideoId.get(clip.videoId) ?? null,
    });
  }
  return cards;
}

/**
 * Serve the FEED state to ANY visitor. `buyerId: null` is the anonymous
 * cold start (Relationship term = 0); `sessionId` comes from the validated
 * first-party cookie (lib/feed/session.ts). Errors NEVER propagate into the
 * render tree — B1b renders all three states.
 */
export async function getFeedSelection(opts: {
  buyerId: string | null;
  sessionId: string;
  limit?: number;
}): Promise<FeedResult> {
  try {
    const cookieStore = await cookies();
    const deps = createEngineDeps({
      read: () => cookieStore.get(FEED_RING_COOKIE)?.value,
      write: (value) => {
        try {
          cookieStore.set(FEED_RING_COOKIE, value, ringCookieOptions());
        } catch {
          // Called from a Server Component render, where the cookie store
          // is read-only (same idiom as lib/supabase/server.ts setAll).
          // The feed page READS the ring but cannot persist it — which is
          // the correct feed semantics: a reload must not exclude the clips
          // just shown ("same order within a session", discovery-feed AC).
          // Ring persistence happens where the engine runs inside a Server
          // Action / Route Handler (the B2+ journey states).
        }
      },
    });

    const ctx: EngineContext = {
      state: "FEED",
      buyerId: opts.buyerId,
      sessionId: opts.sessionId,
      storeScope: null, // cross-maker (discovery-feed spec §Backend)
      productId: null,
      moodHint: null,
      limit: opts.limit ?? FEED_LIMIT_DEFAULT,
    };

    const selection = await selectVideos(ctx, deps);
    if (selection.clips.length === 0) {
      return { status: "empty", cards: [] };
    }

    const cards = await resolveMakerCards(selection.clips);
    if (cards.length === 0) {
      // The engine had clips but none survived the maker join — a data
      // anomaly (already logged per clip), not an empty marketplace.
      return { status: "error", cards: [] };
    }
    return { status: "success", cards };
  } catch (error) {
    // Engine/DB/config failures serve the error state, never a 500 front
    // door. EngineSecretMissingError lands here too: an unprovisioned
    // secret degrades to the error card, loudly logged.
    console.error("[feed] selection failed — serving error state", {
      anonymous: opts.buyerId === null,
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error),
    });
    return { status: "error", cards: [] };
  }
}
