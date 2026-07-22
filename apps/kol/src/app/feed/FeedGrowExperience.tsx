"use client";

import { useCallback } from "react";

import { FeedMagazine } from "@/components/feed/FeedMagazine";
import { GrowProvider, useGrow } from "@/components/grow/GrowProvider";
import type { GrowHandoff, GrowSource } from "@/components/grow/types";
import type { FeedCard, FeedResult } from "@/lib/feed/select";

/**
 * FeedGrowExperience — THE FEED → GROW SEAM (integration wiring; the two
 * units shipped unwired). B1b's FeedMagazine fires `onGrow(card, element)`
 * and B2's API is `useGrow().grow(source, cardElement)` — and the feed
 * page rendered FeedMagazine with no `onGrow` at all, so both units were
 * green while a tap promoted focus and then went nowhere. This client
 * composition is the wiring: it mounts B2's GrowProvider around B1b's
 * magazine and maps the tapped card into a GrowSource at the tap site —
 * the exact mapping B2's seam contract specified ("B1b maps a tapped card
 * into this at the tap site with no renames", grow/types.ts) and nobody
 * wrote. The page (a Server Component) cannot hold this seam itself:
 * callbacks don't cross the server/client boundary.
 */

/** FeedCard → GrowSource: field-for-field per B2's seam contract. */
export function growSourceFromCard(card: FeedCard): GrowSource {
  return {
    kind: "video",
    videoId: card.videoId,
    storeId: card.storeId,
    makerName: card.makerName,
    craft: card.craft,
    place: card.place,
    src: card.src,
    // GrowSource requires a poster string; a posterless card still grows —
    // PosterStill hides itself on a bad src and the layer's surface fill
    // keeps the frame non-black (the Film Layer's poster-first contract).
    poster: card.poster ?? "",
    captionsSrc: card.captionsSrc,
    focalPoint: card.focalPoint,
  };
}

function GrowingMagazine({ result }: { result: FeedResult }) {
  const growApi = useGrow();
  const handleGrow = useCallback(
    (card: FeedCard, element: HTMLElement | null) => {
      // No element ref (unmounted mid-tap) or no provider (bare mounts):
      // the card degrades to focus-only, never a crash — the same
      // degrade contract every film consumer follows.
      if (!growApi || !element) return;
      growApi.grow(growSourceFromCard(card), element);
    },
    [growApi],
  );
  return <FeedMagazine result={result} onGrow={handleGrow} />;
}

export function FeedGrowExperience({ result }: { result: FeedResult }) {
  const handleOpenWorld = useCallback((handoff: GrowHandoff) => {
    // GROWN → WORLD_OPEN is B3's edge (the unfold + the world route),
    // and B3 is deliberately not in this tree yet — no world route
    // exists to navigate to. The second tap keeps the grown column: a
    // boundary no-op, never a broken navigation. The B3 integration
    // replaces this handler; grep for GrowHandoff to find both ends.
    void handoff;
  }, []);
  return (
    <GrowProvider onOpenWorld={handleOpenWorld}>
      <GrowingMagazine result={result} />
    </GrowProvider>
  );
}
