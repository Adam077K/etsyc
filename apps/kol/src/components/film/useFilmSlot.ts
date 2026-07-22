"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import type { FilmEdge } from "./edge-table";
import { useFilmLayer, type FilmRect } from "./FilmLayer";

/**
 * useFilmSlot — the hook a screen calls to register a Film Layer slot:
 * attach `ref` to the element the film should cover, and the slot publishes
 * its rect on layout, on element resize, and on document-height changes
 * (layout shifts above the slot move it in document space). `claim(edge)`
 * re-measures and hands the film to this slot on a §5.2 edge.
 *
 * Feed cards (B1b), the grow surface (B2) and the dock corner (B5) are the
 * intended callers. Without a FilmLayerProvider above, every call is a
 * no-op — screens degrade, they don't crash.
 */
export function useFilmSlot(options?: { fixed?: boolean }) {
  const layer = useFilmLayer();
  const slotId = useId();
  const fixed = options?.fixed === true;
  const elementRef = useRef<HTMLElement | null>(null);

  const publish = useCallback(() => {
    const element = elementRef.current;
    if (!element || !layer) return;
    const rect = element.getBoundingClientRect();
    const radius =
      typeof getComputedStyle === "function" ? getComputedStyle(element).borderRadius : "";
    layer.publishRect(
      slotId,
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      { fixed, radius },
    );
  }, [layer, slotId, fixed]);

  const ref = useCallback(
    (element: HTMLElement | null) => {
      elementRef.current = element;
      if (element) publish();
    },
    [publish],
  );

  useLayoutEffect(() => {
    publish();
  }, [publish]);

  useEffect(() => {
    if (!layer) return;
    const onResize = () => publish();
    window.addEventListener("resize", onResize);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => publish());
      const element = elementRef.current;
      if (element) observer.observe(element);
      observer.observe(document.body);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      layer.releaseSlot(slotId);
    };
  }, [layer, publish, slotId]);

  /** Claim the film for this slot — fresh rect first, then the edge FLIP. */
  const claim = useCallback(
    (edge?: FilmEdge | null, claimOptions?: { reverse?: boolean }) => {
      if (!layer) return;
      publish();
      layer.setActiveSlot(slotId, edge ?? null, claimOptions);
    },
    [layer, publish, slotId],
  );

  /** Publish a computed rect (element-less slots — e.g. a corner rect). */
  const publishRect = useCallback(
    (rect: FilmRect) => {
      layer?.publishRect(slotId, rect, { fixed });
    },
    [layer, slotId, fixed],
  );

  return { slotId, ref, claim, publish, publishRect };
}
