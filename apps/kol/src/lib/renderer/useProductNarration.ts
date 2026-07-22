"use client";

import { useEffect, useRef, useState } from "react";

import { useFilmLayer } from "@/components/film/FilmLayer";
import type { NarrationClip } from "@/lib/narration/actions";

/**
 * useProductNarration — B5's fallback-chain consumer.
 *
 * When the buyer enters NARRATE_SHRINK, ask the engine for the ONE
 * narration clip scoped to the open product and hand it to the Film Layer
 * (`swapClip` — the in-frame cross-fade fires while the film is still in
 * its dock flight, §5.2, because the request races the 440ms FLIP and the
 * layer accepts swaps mid-flight). The ENGINE owns the fallback chain;
 * this hook owns only the last rung and the four states, all of them
 * non-blocking:
 *
 *   loading   — request in flight. The dock is already at its corner with
 *               the persistent clip playing (or the layer's poster-first
 *               paint on a cold start); the product surface NEVER waits on
 *               this hook.
 *   narrating — a clip resolved and was handed to the layer, which
 *               guarantees the cross-fade never shows a paused or black
 *               frame; a 404/decode failure on the incoming buffer quietly
 *               keeps the playing film (layer-owned error path).
 *   fallback  — no clip: untagged product, dangling product_links id, or a
 *               fetch fault after ONE quiet retry. The persistent clip
 *               simply keeps playing — indistinguishable from success by
 *               design (§5.4): no message, no affordance, no different
 *               dock treatment. During the seed period (P7 tagging dark)
 *               this is the PRIMARY path, not an edge case.
 *   idle      — not in NARRATE_SHRINK.
 *
 * The exposed status is DERIVED (never set synchronously in an effect):
 * state holds only settled results, keyed by store|product so a stale
 * settlement can't describe the current request. Stale results never swap
 * either — a response landing after undock, or after the buyer moved on
 * to another product, is discarded by generation guard; otherwise a slow
 * narration fetch could overwrite the world film the buyer already
 * returned to. Without a FilmLayerProvider above, the hook degrades to
 * the no-match outcome (useFilmSlot's no-crash contract).
 */

export type NarrationStatus = "idle" | "loading" | "narrating" | "fallback";

export interface ProductNarrationOptions {
  storeId: string;
  /** null → the engine's store-wide narration fallback still applies. */
  productId: string | null;
  /** True while the world is in NARRATE_SHRINK. */
  active: boolean;
}

/** One quiet retry, spaced enough to outlive a transient network blip. */
const RETRY_DELAY_MS = 800;

/**
 * Server-boundary loader — lazy so the server action's module graph never
 * evaluates in a client test rig; vitest module mocks intercept dynamic
 * imports the same as static ones.
 */
async function loadSelectNarration() {
  const { selectNarration } = await import("@/lib/narration/actions");
  return selectNarration;
}

export function useProductNarration({ storeId, productId, active }: ProductNarrationOptions): {
  status: NarrationStatus;
} {
  const layer = useFilmLayer();
  const [settled, setSettled] = useState<{
    key: string;
    status: "narrating" | "fallback";
  } | null>(null);
  const genRef = useRef(0);

  const key = `${storeId}|${productId ?? ""}`;

  useEffect(() => {
    const gen = ++genRef.current;
    if (!active || !layer) return;

    let cancelled = false;
    let retryTimer: number | undefined;

    const settle = (status: "narrating" | "fallback") => {
      if (!cancelled && genRef.current === gen) setSettled({ key, status });
    };

    const apply = (clip: NarrationClip | null) => {
      if (cancelled || genRef.current !== gen) return; // stale — never swap
      if (clip === null) {
        settle("fallback");
        return;
      }
      layer.swapClip({
        src: clip.src,
        // a posterless clip row still swaps: PosterStill hides itself on a
        // bad src and the layer's surface fill keeps the frame non-black
        poster: clip.poster ?? "",
        captionsSrc: clip.captionsSrc,
      });
      settle("narrating");
    };

    const request = (retriesLeft: number) => {
      loadSelectNarration()
        .then((select) => select({ storeId, productId }))
        .then(({ clip }) => apply(clip))
        .catch(() => {
          if (cancelled || genRef.current !== gen) return;
          if (retriesLeft > 0) {
            // ONE quiet retry — the film plays on; never an error surface
            retryTimer = window.setTimeout(() => request(retriesLeft - 1), RETRY_DELAY_MS);
            return;
          }
          settle("fallback");
        });
    };
    request(1);

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [active, layer, storeId, productId, key]);

  // Derived, so idle/loading need no state writes: outside NARRATE_SHRINK
  // it is idle; inside, a settlement for THIS key decides, else the
  // request is still in flight (provider-less mounts settle as fallback —
  // there is no film to narrate into).
  const status: NarrationStatus = !active
    ? "idle"
    : layer === null
      ? "fallback"
      : settled?.key === key
        ? settled.status
        : "loading";

  return { status };
}
