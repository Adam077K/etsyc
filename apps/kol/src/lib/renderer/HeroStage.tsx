"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFilmLayer } from "@/components/film/FilmLayer";
import type { Clip } from "@/lib/store-config/types";
import { HeroPersistenceContext, type HeroFilmSlot } from "./hero-persistence";
import { heroEdgeFor } from "./stage-edges";
import type { WorldStage } from "./stages";

/**
 * HeroStage — demoted from element owner to SLOT REGISTRAR (Amendment A).
 *
 * Wave 0 kept ONE <video> mounted here at a stable tree position and
 * FLIPped a dock class around it. Correct for one world — but the real
 * feed is cross-maker, and React cannot relocate a host node across
 * component trees without unmounting it. So the film element moved UP into
 * the app-root Film Layer, and HeroStage now:
 *
 *   - keeps `data-layout-id="hero-video"` and the `.kol-hero-stage`
 *     view-transition hook;
 *   - PUBLISHES the rect the film should occupy for the current stage
 *     (feed/grown at Wave-0's simulated card scales, world stages at the
 *     frame's own box) and claims the film on the §5.2 edge for each stage
 *     pair. The dock FLIP moved out of here into the Film Layer as the
 *     WORLD_BROWSE ↔ NARRATE_SHRINK edge — B5 will publish the corner
 *     rect itself and must not reimplement the FLIP;
 *   - keeps pinning its in-flow height so the world never reflows while
 *     the film sits in the viewport-fixed corner rect;
 *   - renders no film element. FilmFrame, via HeroPersistenceContext,
 *     registers its frame + clip ("layer" mode) — or, with no
 *     FilmLayerProvider above (bare renderer mounts, unit rigs), owns its
 *     video exactly as Wave 0 did ("self" mode). StoreWorld's hero
 *     persistence guarantee is preserved in substance, relocated in
 *     mechanism.
 */

/** Wave-0 simulated film scales per stage (transform-origin was 50% 0). */
const STAGE_FILM_SCALE: Record<Exclude<WorldStage, "narrate-shrink">, number> = {
  feed: 0.55,
  grown: 0.82,
  "world-open": 1,
  "world-browse": 1,
};

export function HeroStage({ stage, children }: { stage: WorldStage; children: ReactNode }) {
  const layer = useFilmLayer();
  const id = useId();
  const slotId = `hero:${id}`;
  const dockSlotId = `hero-dock:${id}`;
  const shellRef = useRef<HTMLDivElement>(null);
  const filmElRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef(stage);

  /** Publish the film rect for a stage; narrate-shrink publishes the corner. */
  const publishStageRect = useCallback(
    (s: WorldStage) => {
      const element = filmElRef.current;
      if (!element || !layer) return;
      const base = element.getBoundingClientRect();
      if (s === "narrate-shrink") {
        // the old .kol-hero-docked geometry, now computed: clamp(240px,
        // 32vw, 320px) wide, --space-2 off the corner. B5 replaces this
        // with its exclusion-zone-aware rect.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 16;
        const width = Math.min(320, Math.max(240, vw * 0.32));
        const aspect = base.width > 0 ? base.height / base.width : 9 / 16;
        const height = width * aspect;
        layer.publishRect(
          dockSlotId,
          { left: vw - width - margin, top: vh - height - margin, width, height },
          { fixed: true, radius: "var(--radius-md)" },
        );
        return;
      }
      const scale = STAGE_FILM_SCALE[s];
      layer.publishRect(
        slotId,
        {
          // anchored top-center, like Wave 0's transform-origin: 50% 0
          left: base.left + (base.width * (1 - scale)) / 2,
          top: base.top,
          width: base.width * scale,
          height: base.height * scale,
        },
        {
          radius:
            typeof getComputedStyle === "function" ? getComputedStyle(element).borderRadius : "",
        },
      );
    },
    [layer, slotId, dockSlotId],
  );

  /** FilmFrame ("layer" mode) hands us its frame element + clip. */
  const registerFilm = useCallback(
    (element: HTMLElement, clip: Clip) => {
      filmElRef.current = element;
      if (layer) {
        publishStageRect(stageRef.current);
        const target = stageRef.current === "narrate-shrink" ? dockSlotId : slotId;
        layer.setActiveSlot(target, null); // first claim snaps — no edge
        layer.swapClip(clip.src, clip.poster, clip.captionsSrc);
      }
      return () => {
        filmElRef.current = null;
        layer?.releaseSlot(slotId);
        layer?.releaseSlot(dockSlotId);
      };
    },
    [layer, publishStageRect, slotId, dockSlotId],
  );

  // Stage transitions: pin the flow height, publish the new rect, claim on
  // the §5.2 edge. Same source throughout — the layer moves by FLIP
  // transform only and never touches the video buffers.
  useLayoutEffect(() => {
    const previous = stageRef.current;
    stageRef.current = stage;
    if (previous === stage) return;

    const shell = shellRef.current;
    const docking = stage === "narrate-shrink";
    if (shell) {
      // pin the shell's flow height so the page doesn't reflow while the
      // film rides the viewport-fixed corner rect
      if (docking) shell.style.height = `${shell.getBoundingClientRect().height}px`;
      else shell.style.height = "";
    }

    if (!layer || !filmElRef.current) return;
    publishStageRect(stage);
    const { edge, reverse } = heroEdgeFor(previous, stage);
    layer.setActiveSlot(docking ? dockSlotId : slotId, edge, reverse ? { reverse } : undefined);
  }, [stage, layer, publishStageRect, slotId, dockSlotId]);

  // Viewport changes move both the in-flow box and the corner rect.
  useEffect(() => {
    if (!layer) return;
    const onResize = () => publishStageRect(stageRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layer, publishStageRect]);

  const value = useMemo<HeroFilmSlot>(
    () => (layer ? { mode: "layer", registerFilm } : { mode: "self" }),
    [layer, registerFilm],
  );

  return (
    <div ref={shellRef} data-layout-id="hero-video" className="kol-hero-stage">
      <div className="kol-hero-stage-inner">
        <HeroPersistenceContext.Provider value={value}>{children}</HeroPersistenceContext.Provider>
      </div>
    </div>
  );
}
