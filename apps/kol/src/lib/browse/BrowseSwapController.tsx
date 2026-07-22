"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { useFilmLayer } from "@/components/film/FilmLayer";
import type { WorldStage } from "@/lib/renderer/stages";
import type { Clip } from "@/lib/store-config/types";

import { SWAP_MIN_INTERVAL_MS } from "./contract";
import { selectBrowseClip } from "./select-browse-clip";

/**
 * BrowseSwapController — the headless WORLD_BROWSE choreographer (B4).
 *
 * Owns two behaviours and no pixels:
 *
 *  1. WORLD_OPEN → WORLD_BROWSE on the first scroll. The pair is
 *     deliberately edge-less (stage-edges.ts): it is a scroll, not an
 *     event, and nothing animates.
 *  2. Contextual clip swaps while browsing (screen-specs §4.2): a swap is
 *     permitted only at a BLOCK BOUNDARY — when a new world-body block
 *     crosses 50% of the viewport — and at most once per 12 s
 *     (SWAP_MIN_INTERVAL_MS). The floor starts at mount, so the maker
 *     finishes the opening clip's first breath before changing subject.
 *
 * The swap itself is entirely the Film Layer's: `swapClip` loads the
 * INACTIVE buffer, waits for `canplay`, starts playback, and only then
 * cross-fades over --dur-swap. This controller never touches a <video>,
 * never mutates `src`, and owns no film mechanism. Reduced motion needs no
 * branch here — a cross-fade is not motion, and globals.css stretches the
 * fade duration itself.
 *
 * SWAPS ARE SCORING-DRIVEN, NEVER RANDOM (AC): the ONLY clip source is the
 * engine's weighted-sum selection via the selectBrowseClip server action;
 * anti-repetition runs inside the engine after scoring. A `null` selection
 * (nothing eligible) keeps the current clip — graceful, never an error.
 */

/** IO band that fires exactly when an element crosses the viewport midline. */
const MIDLINE_MARGIN = "-50% 0px -50% 0px";

export function BrowseSwapController({
  storeId,
  clips,
  stage,
  worldRef,
  onEnterBrowse,
}: {
  storeId: string;
  /** The world config's clips — re-joined on videoId so focalPoint rides. */
  clips: Clip[];
  stage: WorldStage;
  /** The world root — the controller finds `.kol-world-body > *` under it. */
  worldRef: RefObject<HTMLDivElement | null>;
  onEnterBrowse: () => void;
}) {
  const layer = useFilmLayer();

  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  // The 12 s floor covers the opening clip too — mount time is attempt
  // zero (set in the mount effect; render must stay pure). Until it lands,
  // requestSwap treats "unset" as "just mounted", which the floor blocks.
  const lastAttemptRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  // Consecutive-crossing dedupe: dwelling on (or re-entering) the same
  // block is not a new boundary. A crossing consumed by the floor still
  // counts as seen — swaps respond to crossings, never fire detached from
  // one (the shopkeeper reacts to what you turned to look at).
  const lastBlockRef = useRef<Element | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    lastAttemptRef.current ??= Date.now();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestSwap = useCallback(() => {
    // No layer (bare mounts) → degrade silently; wrong stage → not ours.
    if (!layer || stageRef.current !== "world-browse") return;
    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - (lastAttemptRef.current ?? now) < SWAP_MIN_INTERVAL_MS) return;
    // Floor on ATTEMPTS, not successes — an empty pool must not turn every
    // block boundary into a server round-trip.
    lastAttemptRef.current = now;
    inFlightRef.current = true;

    void selectBrowseClip(storeId)
      .then((selected) => {
        if (!selected || !mountedRef.current) return;
        // A late response after the buyer docked (B5's territory) or left
        // must not change the subject under them.
        if (stageRef.current !== "world-browse") return;
        // Engine and renderer meet at videos.id (§B0): prefer the config
        // clip so focalPoint travels into both buffers and the poster
        // underlay (CPO Ruling 3).
        const configClip = clips.find((clip) => clip.id === selected.videoId);
        if (configClip) {
          layer.swapClip(configClip);
        } else if (selected.poster !== null) {
          layer.swapClip({
            src: selected.src,
            poster: selected.poster,
            captionsSrc: selected.captionsSrc,
          });
        }
        // No poster and not mirrored in config → keep the current clip
        // (the layer's poster-first contract needs a poster to stand on).
      })
      .catch(() => {
        // Engine unreachable → the current clip keeps playing. Never error
        // chrome over a live film (screen-specs §4.4).
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [layer, storeId, clips]);

  // 1 · WORLD_OPEN → WORLD_BROWSE on the first scroll — a scroll, not an
  // event; the film's rect does not move and no edge fires.
  useEffect(() => {
    if (stage !== "world-open") return;
    const advance = () => onEnterBrowse();
    window.addEventListener("scroll", advance, { passive: true, once: true });
    return () => window.removeEventListener("scroll", advance);
  }, [stage, onEnterBrowse]);

  // 2 · Block-boundary observation. Observing starts at world-open (so a
  // boundary crossed in the same breath as the browse entry still counts);
  // requestSwap gates actual swapping on world-browse.
  useEffect(() => {
    const root = worldRef.current;
    if (!layer || !root) return;
    if (stage !== "world-open" && stage !== "world-browse") return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === lastBlockRef.current) continue;
          lastBlockRef.current = entry.target;
          requestSwap();
        }
      },
      { rootMargin: MIDLINE_MARGIN, threshold: 0 },
    );

    // The world loads progressively — blocks resolve (and empty optional
    // blocks are OMITTED, so nodes appear/disappear). Track the live child
    // set rather than a one-shot query.
    const observed = new Set<Element>();
    const sync = () => {
      for (const section of root.querySelectorAll(".kol-world-body > *")) {
        if (!observed.has(section)) {
          observed.add(section);
          io.observe(section);
        }
      }
      for (const section of observed) {
        if (!section.isConnected) {
          observed.delete(section);
          io.unobserve(section);
        }
      }
    };
    sync();

    let mutation: MutationObserver | undefined;
    if (typeof MutationObserver !== "undefined") {
      mutation = new MutationObserver(sync);
      for (const body of root.querySelectorAll(".kol-world-body")) {
        mutation.observe(body, { childList: true });
      }
    }

    return () => {
      io.disconnect();
      mutation?.disconnect();
    };
  }, [layer, worldRef, stage, requestSwap]);

  return null;
}
