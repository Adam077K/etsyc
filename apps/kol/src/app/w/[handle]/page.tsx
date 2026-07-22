import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createEngineDeps, selectVideos } from "@/lib/engine";
import { renderStore } from "@/lib/renderer/render-store";
import { validateStoreConfig } from "@/lib/store-config/schema";
import type { StoreConfig } from "@/lib/store-config/types";
import { createClient } from "@/lib/supabase/server";

/**
 * /w/[handle] — a maker's world, deep-linkable (spec B3 / E5 ruling: a
 * buyer arriving cold, with no feed pass, still gets the full world and
 * can name the person whose world they are standing in).
 *
 * Public route (lib/auth/routes.ts: everything unclaimed is public); RLS
 * is the read boundary and `published = true` is asserted here as well so
 * an unpublished world is a 404, never a leaked draft.
 *
 * The engine and the renderer meet ONLY at videos.id: selectVideos
 * (WORLD_OPEN, store scope, limit 1) picks the store's signature clip for
 * the persistent single-clip slot, and the renderer pins it via
 * media.clips[].id ≡ videos.id. The engine never reads blocks or
 * stores.config; the renderer never reads the canonical video tables.
 */

/** Ring cookie name — B1's feed must reuse this so the anti-repetition
 *  session is ONE session across surfaces. */
const ENGINE_RING_COOKIE = "kol_engine_ring";

const getWorld = cache(
  async (
    handle: string,
  ): Promise<{ storeId: string; name: string; craft: string | null; config: StoreConfig } | null> => {
    const supabase = await createClient();
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, craft, config")
      .eq("handle", handle)
      .eq("published", true)
      .maybeSingle();
    if (!store) return null;

    // Stored configs were validated at write time (P3); a row that fails
    // now is corrupt data, not a render case — degrade to 404 rather than
    // an unstyled or broken world.
    const parsed = validateStoreConfig(store.config);
    if (!parsed.ok) {
      console.warn(`[w/${handle}] stored config failed validation — serving 404`, parsed.errors);
      return null;
    }
    return { storeId: store.id, name: store.name, craft: store.craft, config: parsed.config };
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const world = await getWorld(handle);
  // 404 here, not only in the page: metadata resolves BEFORE streaming
  // starts, so the status code is still settable (the loading.tsx boundary
  // means a notFound() thrown mid-stream would arrive after a 200).
  if (!world) notFound();
  return {
    title: `${world.config.maker.displayName} — ${world.name} · KOL`,
    description: world.config.maker.bio,
  };
}

/**
 * The engine's WORLD_OPEN read. Isolated so ANY failure — missing secret,
 * DB hiccup, empty selection — degrades to `undefined` and the world still
 * opens on the seller's own binding order: a failure never blocks the film.
 */
async function selectSignatureClipId(storeId: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const deps = createEngineDeps({
      read: () => cookieStore.get(ENGINE_RING_COOKIE)?.value,
      write: (value: string) => {
        try {
          cookieStore.set(ENGINE_RING_COOKIE, value, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          });
        } catch {
          // Server Components cannot persist cookies (same posture as
          // lib/supabase/server.ts). The ring still READS here, so feed
          // history reaches this selection; persistence of THIS read's
          // ring happens on surfaces served by route handlers/actions.
        }
      },
    });
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const selection = await selectVideos(
      {
        state: "WORLD_OPEN",
        buyerId: user?.id ?? null,
        // No app-level session id exists yet (B1 owns establishing one);
        // per-request scope only affects the ranker's seeded jitter on a
        // limit-1 store-scoped read. Swap to the session id when B1 lands.
        sessionId: crypto.randomUUID(),
        storeScope: storeId,
        productId: null,
        moodHint: null,
        limit: 1,
      },
      deps,
    );
    return selection.clips[0]?.videoId;
  } catch (error) {
    console.warn("[w] engine WORLD_OPEN read failed — world opens unpinned", error);
    return undefined;
  }
}

export default async function WorldPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const world = await getWorld(handle);
  if (!world) notFound();

  const pinnedClipId = await selectSignatureClipId(world.storeId);

  // world-open: the unfold is this surface; scrolling advances toward
  // WORLD_BROWSE — that stage change is B4's (StoreWorld's stage machinery
  // is the handoff point), not built here.
  return renderStore(world.config, { initialStage: "world-open", pinnedClipId });
}
