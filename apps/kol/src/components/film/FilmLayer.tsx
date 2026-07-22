"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FilmControls } from "@/components/media/FilmControls";
import { clipObjectPosition } from "@/components/media/focal-point";
import { PosterStill } from "@/components/media/PosterStill";
import { cn } from "@/lib/utils";
import { startAspectCounter, ASPECT_EPSILON } from "./aspect-counter";
import { EDGE_TABLE, parseCssTime, resolveEdgeMs, resolveSwapMs, type FilmEdge } from "./edge-table";
import { readSpringVideoParams, springLinearEasing } from "./spring-easing";

/**
 * FilmLayer — ONE film, mounted once at app root, for the life of the
 * session (Amendment A / design-direction §6.2).
 *
 * Why it exists: the real FEED is cross-maker — N sibling cards from N
 * stores — and React cannot relocate a host <video> across component trees
 * without unmounting it. So no screen owns the film element. Screens are
 * SLOT REGISTRARS: they publish the rect the film should occupy
 * (`publishRect`), claim it (`setActiveSlot`, which FLIPs the frame between
 * rects on the §5.2 edge table), and ask for clips (`swapClip`).
 *
 * The frame holds TWO stacked <video> buffers (A/B) because changing `src`
 * on a live video runs the media load algorithm — readyState resets,
 * playback stops, poster or black flashes. A clip swap loads the INACTIVE
 * buffer, waits for `canplay`, starts playback, and only then cross-fades
 * over --dur-swap. The binding AC, both halves:
 *   - same-source transitions (grow/ungrow/unfold/dock/undock) get TRUE
 *     element persistence — claims never touch the buffers, cross-fading
 *     on them is forbidden;
 *   - source-changing swaps get the in-frame cross-fade, with the incoming
 *     buffer at readyState >= 3 AND already playing before the fade begins.
 * "The film frame never unmounts and never shows a paused or black frame."
 *
 * Inherits FilmFrame's behaviour: poster-first, muted until opt-in (the
 * hard tone line), captions toggle, quiet fallback to the poster on
 * decode/404. Controls are the shared FilmControls — not a fork.
 *
 * Paint order against page content follows the film stacking contract in
 * globals.css (--z-film-bed / --z-film-chrome / --z-film): undocked, the
 * layer rides BELOW slot chrome so the maker's headline, craft line and
 * scrim read over the film; docked, it floats above as the corner card.
 */

export interface FilmRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FilmSlotOptions {
  /** Viewport-anchored slot (the docked corner) instead of document flow. */
  fixed?: boolean;
  /** Border radius the frame should adopt at this slot (snaps, not FLIPped). */
  radius?: string;
}

export interface FilmClaimOptions {
  /** §5.1 return-ratio rule for a forward edge walked backwards in preview. */
  reverse?: boolean;
  /**
   * Fresh rect (+ slot options) measured by the claimer, recorded as part
   * of the claim itself: measure `first` → update rect → FLIP, atomically.
   * Publishing ahead of the claim would snap the live frame onto the new
   * rect first and every SAME-slot edge would animate a zero delta
   * (gate-1 P1) — so claimers pass the rect here instead.
   */
  rect?: FilmRect;
  slotOptions?: FilmSlotOptions;
}

/**
 * What a swap needs from a clip — the v1.3 `Clip` is structurally
 * assignable, so callers pass the clip object whole and `focalPoint`
 * (CPO Ruling 3) rides into BOTH buffers and the poster underlay.
 */
export interface FilmClipSource {
  src: string;
  poster: string;
  captionsSrc?: string | null;
  /** clips[].focalPoint (v1.3) — optional, centre-defaulted at the buffer. */
  focalPoint?: { x: number; y: number };
}

export interface FilmLayerApi {
  /** A screen tells the layer where the film should sit for a slot. */
  publishRect(slotId: string, rect: FilmRect, options?: FilmSlotOptions): void;
  /**
   * A screen claims the film; the layer FLIPs to that slot's rect on the
   * given §5.2 edge (null = snap — first claim, or a non-event like
   * WORLD_OPEN ↔ WORLD_BROWSE). Pass the freshly measured rect in
   * `options.rect` so the record update happens INSIDE the FLIP.
   */
  setActiveSlot(slotId: string, edge?: FilmEdge | null, options?: FilmClaimOptions): void;
  /** Unregister a slot; if it held the film, the layer parks (stays mounted). */
  releaseSlot(slotId: string): void;
  /** Load a clip into the inactive buffer and cross-fade once it plays. */
  swapClip(clip: FilmClipSource): void;
}

interface SlotRecord {
  rect: FilmRect;
  /** Document-space coords for in-flow slots — scrolls with the page. */
  docLeft: number;
  docTop: number;
  fixed: boolean;
  radius: string;
}

interface FilmClip {
  src: string;
  poster: string;
  captionsSrc: string | null;
  focalPoint?: { x: number; y: number };
}

type BufferKey = "a" | "b";

const FilmLayerContext = createContext<FilmLayerApi | null>(null);

/** Null outside a FilmLayerProvider — consumers must degrade, not crash. */
export function useFilmLayer(): FilmLayerApi | null {
  return useContext(FilmLayerContext);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The buffer cross-fade's REAL duration, computed off the element: under
 * reduced motion globals.css stretches the fade to --dur-state, so a
 * token-only --dur-swap read would under-wait and pause the rear buffer
 * with ~0 margin (gate-1 4b). Falls back to the token where computed CSS
 * is unavailable (jsdom/SSR).
 */
export function bufferFadeMs(video: HTMLVideoElement): number {
  if (typeof getComputedStyle !== "function") return resolveSwapMs();
  const raw = getComputedStyle(video).transitionDuration ?? "";
  const parsed = raw
    .split(",")
    .map((part) => parseCssTime(part))
    .filter((ms): ms is number => ms !== null);
  return parsed.length > 0 ? Math.max(...parsed) : resolveSwapMs();
}

/** One layout write: the frame adopts a slot record's box (no motion here). */
function applySlotLayout(frame: HTMLElement, record: SlotRecord) {
  frame.style.position = record.fixed ? "fixed" : "absolute";
  frame.style.left = `${record.fixed ? record.rect.left : record.docLeft}px`;
  frame.style.top = `${record.fixed ? record.rect.top : record.docTop}px`;
  frame.style.width = `${record.rect.width}px`;
  frame.style.height = `${record.rect.height}px`;
  if (record.radius) frame.style.borderRadius = record.radius;
  else frame.style.removeProperty("border-radius");
}

export function FilmLayerProvider({ children }: { children: ReactNode }) {
  const slots = useRef(new Map<string, SlotRecord>());
  const frameRef = useRef<HTMLDivElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  const activeSlotRef = useRef<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [docked, setDocked] = useState(false);

  const [buffers, setBuffers] = useState<Record<BufferKey, FilmClip | null>>({
    a: null,
    b: null,
  });
  const buffersRef = useRef(buffers);
  const [front, setFront] = useState<BufferKey>("a");
  const frontRef = useRef<BufferKey>("a");
  const [pendingSwap, setPendingSwap] = useState<{ buffer: BufferKey; gen: number } | null>(null);
  const pendingRef = useRef(pendingSwap);
  const swapGenRef = useRef(0);
  const currentSrcRef = useRef<string | null>(null);

  // FLIP release in flight: rect maintenance defers while set (a mid-grow
  // ResizeObserver publish must not teleport the film) and lands on
  // transitionend. Token guards against a superseding claim.
  const flightRef = useRef<{ token: number; dispose: () => void } | null>(null);
  const flightTokenRef = useRef(0);
  const maintenanceDirtyRef = useRef(false);
  // Buffer cross-fade in flight: swaps arriving now target the still-
  // VISIBLE fading-out buffer, so they defer (latest wins) until fade end.
  const fadeRef = useRef<{ token: number; dispose: () => void } | null>(null);
  const fadeTokenRef = useRef(0);
  const deferredSwapRef = useRef<FilmClipSource | null>(null);

  // ref mirrors for DOM-event readers (buffer onError, autoplay-veto
  // recovery) — updated post-commit, which is when those events can fire
  useEffect(() => {
    buffersRef.current = buffers;
  }, [buffers]);
  useEffect(() => {
    pendingRef.current = pendingSwap;
  }, [pendingSwap]);

  const [poster, setPoster] = useState<{
    src: string;
    focalPoint?: { x: number; y: number };
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);

  const bufferEl = useCallback(
    (key: BufferKey) => (key === "a" ? videoARef.current : videoBRef.current),
    [],
  );

  /**
   * Move the frame to a slot's rect. Layout position (position/left/top/
   * width/height) snaps in one write; motion is FLIP — measure `first`
   * where the frame visually is, write the new layout, invert, flush,
   * release on the edge's transition. Same-source, transform-only: the
   * buffers are never touched here. While the release is in flight, rect-
   * maintenance publishes defer (flightRef) and land on transitionend.
   * `data-film-edge` is written ONLY beside a non-identity transform — the
   * observable record never claims motion that didn't happen (gate-1 P1).
   */
  const positionToSlot = useCallback(
    (
      slotId: string,
      edge: FilmEdge | null,
      options?: { reverse?: boolean; wasParked?: boolean },
    ) => {
      const frame = frameRef.current;
      const record = slots.current.get(slotId);
      if (!frame || !record) return;

      // a new positioning supersedes any in-flight FLIP; deferred rect
      // maintenance is subsumed — the layout below uses the latest record
      flightRef.current?.dispose();
      flightRef.current = null;
      maintenanceDirtyRef.current = false;

      const first = frame.getBoundingClientRect();

      // neutralise any live transform BEFORE the layout writes so `last`
      // (and a snap landing) measures the un-transformed box
      frame.style.transition = "none";
      frame.style.transform = "";

      applySlotLayout(frame, record);

      const settle = () => {
        // Reduced motion / first claim / rect tracking / identity delta:
        // the FLIP SKIPS its invert step entirely (§5.3) — no transform,
        // no false data-film-edge record.
        void frame.getBoundingClientRect();
        frame.style.transition = "";
        delete frame.dataset.filmEdge;
        delete frame.dataset.filmEdgeMs;
      };

      if (
        edge === null ||
        options?.wasParked === true ||
        prefersReducedMotion() ||
        first.width <= 0 ||
        first.height <= 0
      ) {
        settle();
        return;
      }

      const last = frame.getBoundingClientRect();
      if (last.width <= 0 || last.height <= 0) {
        settle();
        return;
      }

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;

      // identity gate: a same-rect claim is a non-event, not an edge —
      // sub-pixel jitter must not fake choreography either
      if (
        Math.abs(dx) < 0.5 &&
        Math.abs(dy) < 0.5 &&
        Math.abs(sx - 1) < 0.005 &&
        Math.abs(sy - 1) < 0.005
      ) {
        settle();
        return;
      }

      const spec = EDGE_TABLE[edge];
      const durationMs = resolveEdgeMs(edge, options);
      frame.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      void frame.getBoundingClientRect();
      frame.style.transitionProperty = "transform";
      frame.style.transitionDuration = `${durationMs}ms`;
      // literal fallback first; richer forms overwrite where supported —
      // an engine that rejects a value keeps the previous one
      frame.style.transitionTimingFunction = spec.easingFallback;
      frame.style.setProperty("transition-timing-function", spec.easing);
      if (spec.spring) {
        // dock/undock ride the --spring-video linear() curve (§5.2)
        frame.style.setProperty(
          "transition-timing-function",
          springLinearEasing(readSpringVideoParams(), durationMs),
        );
      }
      // observable edge record — QA and e2e assert choreography off these;
      // only ever written beside the non-identity transform above
      frame.dataset.filmEdge = edge;
      frame.dataset.filmEdgeMs = String(durationMs);
      frame.style.transform = "";

      // G1-F2: a non-uniform FLIP (grow — 4:5 card → 16:9 column) would
      // stretch the cover-fit media with the frame for the whole edge.
      // Counter-scale the buffers + poster per sampled frame so only the
      // FRAME changes aspect, never the film. Uniform-scale edges skip it
      // (identity inverse); the flight's dispose is the single stop path.
      const stopAspectCounter =
        Math.abs(sx / sy - 1) >= ASPECT_EPSILON ? startAspectCounter(frame) : null;

      // track the release so mid-flight rect maintenance defers and then
      // lands as a snap when the transform transition ends
      const token = ++flightTokenRef.current;
      const finish = () => {
        const flight = flightRef.current;
        if (!flight || flight.token !== token) return;
        flightRef.current = null;
        flight.dispose();
        if (maintenanceDirtyRef.current) {
          maintenanceDirtyRef.current = false;
          const activeId = activeSlotRef.current;
          const latest = activeId ? slots.current.get(activeId) : undefined;
          if (latest) {
            frame.style.transition = "none";
            frame.style.transform = "";
            applySlotLayout(frame, latest);
            void frame.getBoundingClientRect();
            frame.style.transition = "";
            delete frame.dataset.filmEdge;
            delete frame.dataset.filmEdgeMs;
          }
        }
      };
      const onTransitionEnd = (event: Event) => {
        if (event.target !== frame) return; // buffer opacity fades bubble up
        finish();
      };
      const timer = window.setTimeout(finish, durationMs + 120);
      frame.addEventListener("transitionend", onTransitionEnd);
      frame.addEventListener("transitioncancel", onTransitionEnd);
      flightRef.current = {
        token,
        dispose: () => {
          stopAspectCounter?.();
          window.clearTimeout(timer);
          frame.removeEventListener("transitionend", onTransitionEnd);
          frame.removeEventListener("transitioncancel", onTransitionEnd);
        },
      };
    },
    [],
  );

  const writeSlotRecord = useCallback(
    (slotId: string, rect: FilmRect, options?: FilmSlotOptions): boolean => {
      const fixed = options?.fixed === true;
      const scrollX = typeof window === "undefined" ? 0 : window.scrollX;
      const scrollY = typeof window === "undefined" ? 0 : window.scrollY;
      slots.current.set(slotId, {
        rect,
        docLeft: rect.left + (fixed ? 0 : scrollX),
        docTop: rect.top + (fixed ? 0 : scrollY),
        fixed,
        radius: options?.radius ?? "",
      });
      return fixed;
    },
    [],
  );

  const publishRect = useCallback(
    (slotId: string, rect: FilmRect, options?: FilmSlotOptions) => {
      const fixed = writeSlotRecord(slotId, rect, options);
      // re-publish of the live slot (resize, layout shift) tracks by SNAP —
      // rect maintenance is not an edge. While an edge FLIP is in flight
      // the snap DEFERS (the useFilmSlot body-ResizeObserver fires on any
      // document-height change, e.g. world content mounting mid-grow, and
      // must not teleport the film); it lands on the flight's transitionend.
      if (activeSlotRef.current === slotId) {
        if (flightRef.current) {
          maintenanceDirtyRef.current = true;
        } else {
          positionToSlot(slotId, null);
        }
        setDocked(fixed);
      }
    },
    [positionToSlot, writeSlotRecord],
  );

  const setActiveSlot = useCallback(
    (slotId: string, edge: FilmEdge | null = null, options?: FilmClaimOptions) => {
      // atomic claim: the fresh rect is recorded HERE — after the caller
      // measured it but before the FLIP reads `first` off the live frame —
      // never published ahead as a snap (gate-1 P1: publish-then-claim made
      // every same-slot edge animate a zero delta)
      if (options?.rect) writeSlotRecord(slotId, options.rect, options.slotOptions);
      const wasParked = activeSlotRef.current === null;
      activeSlotRef.current = slotId;
      setActiveSlotId(slotId);
      setDocked(slots.current.get(slotId)?.fixed === true);
      positionToSlot(slotId, wasParked ? null : edge, {
        reverse: options?.reverse,
        wasParked,
      });
    },
    [positionToSlot, writeSlotRecord],
  );

  const releaseSlot = useCallback((slotId: string) => {
    slots.current.delete(slotId);
    if (activeSlotRef.current === slotId) {
      // symmetric with positionToSlot's supersede: an in-flight FLIP has
      // nowhere to land once its slot is gone — dispose it now (counter
      // loop, backstop timer, transition listeners) instead of leaning on
      // the durationMs+120 backstop, and drop any deferred maintenance
      flightRef.current?.dispose();
      flightRef.current = null;
      maintenanceDirtyRef.current = false;
      // park — hidden, but never unmounted (the frame outlives every screen)
      activeSlotRef.current = null;
      setActiveSlotId(null);
      setDocked(false);
    }
  }, []);

  /** The actual buffer load — callers go through swapClip's fade gate. */
  const runSwap = useCallback((clip: FilmClipSource) => {
    // Same-source: claims never touch the buffers (the binding AC's first
    // half) — a re-request of the playing clip is a no-op, not a reload.
    if (currentSrcRef.current === clip.src) return;
    currentSrcRef.current = clip.src;
    const gen = ++swapGenRef.current;
    const incoming: BufferKey = frontRef.current === "a" ? "b" : "a";
    setFailed(false);
    setPoster({ src: clip.poster, focalPoint: clip.focalPoint });
    setBuffers((prev) => ({
      ...prev,
      [incoming]: {
        src: clip.src,
        poster: clip.poster,
        captionsSrc: clip.captionsSrc ?? null,
        focalPoint: clip.focalPoint,
      },
    }));
    setPendingSwap({ buffer: incoming, gen });
  }, []);

  const swapClip = useCallback(
    (clip: FilmClipSource) => {
      if (fadeRef.current) {
        // A cross-fade is running: the only free buffer is the one still
        // VISIBLY fading out — mutating its src mid-fade runs the media
        // load algorithm on a visible frame (gate-1 4a). Defer until fade
        // end, latest intent wins — a re-request of the current clip
        // cancels whatever was queued.
        deferredSwapRef.current = currentSrcRef.current === clip.src ? null : clip;
        return;
      }
      runSwap(clip);
    },
    [runSwap],
  );

  /**
   * A promotion starts the CSS cross-fade — track it so (i) swaps arriving
   * mid-fade defer (4a), (ii) the rear decoder releases only after the
   * COMPUTED fade duration — reduced motion stretches --dur-swap to
   * --dur-state, so the delay derives from the element, not the token (4b)
   * — and (iii) the pause re-checks state when it actually fires: never
   * the front, never a buffer a pending swap is about to play.
   */
  const beginBufferFade = useCallback(
    (outgoingKey: BufferKey) => {
      const outgoing = bufferEl(outgoingKey);
      // cold start: nothing visible is fading — no gate, no pause needed
      if (!outgoing || buffersRef.current[outgoingKey] === null) return;
      fadeRef.current?.dispose();
      const token = ++fadeTokenRef.current;
      const settle = () => {
        const fade = fadeRef.current;
        if (!fade || fade.token !== token) return;
        fadeRef.current = null;
        fade.dispose();
        // release the rear decoder — with a fire-time re-check: NEVER
        // pause the front, never a buffer a pending swap will play (the
        // 4a stale-timer race fired pause() mid-play())
        if (outgoingKey !== frontRef.current && pendingRef.current?.buffer !== outgoingKey) {
          outgoing.pause();
        }
        const deferred = deferredSwapRef.current;
        if (deferred) {
          deferredSwapRef.current = null;
          runSwap(deferred);
        }
      };
      const onTransitionEnd = (event: Event) => {
        if (event.target !== outgoing) return;
        settle();
      };
      const timer = window.setTimeout(settle, bufferFadeMs(outgoing) + 80);
      outgoing.addEventListener("transitionend", onTransitionEnd);
      outgoing.addEventListener("transitioncancel", onTransitionEnd);
      fadeRef.current = {
        token,
        dispose: () => {
          window.clearTimeout(timer);
          outgoing.removeEventListener("transitionend", onTransitionEnd);
          outgoing.removeEventListener("transitioncancel", onTransitionEnd);
        },
      };
    },
    [bufferEl, runSwap],
  );

  // Promote a pending buffer: wait for canplay (readyState >= 3), START
  // PLAYBACK, and only then flip the front — the cross-fade begins with the
  // incoming buffer already playing, so no frame of the swap is paused.
  useEffect(() => {
    if (!pendingSwap) return;
    const video = bufferEl(pendingSwap.buffer);
    if (!video) return;
    let cancelled = false;

    const promote = () => {
      if (cancelled || swapGenRef.current !== pendingSwap.gen) return;
      void Promise.resolve(video.play())
        .then(() => {
          if (cancelled || swapGenRef.current !== pendingSwap.gen) return;
          const outgoingKey = frontRef.current;
          frontRef.current = pendingSwap.buffer;
          setFront(pendingSwap.buffer);
          setPendingSwap(null);
          // the front flip starts the cross-fade — gate swaps + schedule
          // the rear release off the fade itself
          beginBufferFade(outgoingKey);
        })
        .catch(() => {
          if (cancelled || swapGenRef.current !== pendingSwap.gen) return;
          // Autoplay veto (browser policy). If a film is playing, keep it —
          // never trade a playing frame for a paused one. On a cold start
          // promote anyway: the incoming poster shows (poster-first, no
          // error chrome — FilmFrame parity).
          const outgoingKey = frontRef.current;
          const outgoing = bufferEl(outgoingKey);
          const outgoingLive =
            outgoing !== null && buffersRef.current[outgoingKey] !== null && !outgoing.paused;
          if (outgoingLive) {
            currentSrcRef.current = buffersRef.current[outgoingKey]?.src ?? null;
            setPendingSwap(null);
            return;
          }
          frontRef.current = pendingSwap.buffer;
          setFront(pendingSwap.buffer);
          setPendingSwap(null);
          beginBufferFade(outgoingKey);
        });
    };

    if (video.readyState >= 3) {
      promote();
      return () => {
        cancelled = true;
      };
    }
    video.addEventListener("canplay", promote, { once: true });
    return () => {
      cancelled = true;
      video.removeEventListener("canplay", promote);
    };
  }, [pendingSwap, bufferEl, beginBufferFade]);

  // The rear buffer's decoder release lives in beginBufferFade: it waits
  // for the fade's OWN transitionend (computed duration + margin as the
  // fallback), and re-checks front/pending at fire time — the pause is
  // unobservable, opacity 0 behind an opaque, already-playing front.

  // Tab-hide pauses media in mobile browsers, and nothing else would
  // resume the film until the next claim or swap — a returning buyer saw
  // a genuinely paused frame indefinitely (gate-1 4c). Resume the front on
  // return, veto-safely. Parked frames stay parked.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (activeSlotRef.current === null) return;
      const video = bufferEl(frontRef.current);
      if (video && buffersRef.current[frontRef.current] !== null && video.paused) {
        void video.play().catch(() => {
          /* autoplay veto — poster remains, no error chrome */
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [bufferEl]);

  // the provider outlives every screen, but tests (and future multi-root
  // mounts) unmount it — release flight/fade timers and listeners
  useEffect(
    () => () => {
      flightRef.current?.dispose();
      flightRef.current = null;
      fadeRef.current?.dispose();
      fadeRef.current = null;
    },
    [],
  );

  // A claim keeps the film playing — play resumes if the frame was parked.
  useEffect(() => {
    if (activeSlotId === null) return;
    const video = bufferEl(front);
    if (video && buffersRef.current[front] !== null && video.paused) {
      void video.play().catch(() => {
        /* autoplay veto — poster remains, no error chrome */
      });
    }
  }, [activeSlotId, front, bufferEl]);

  // <track default> is load-time only — drive the live TextTrack mode, and
  // only ever caption the visible buffer.
  useEffect(() => {
    for (const key of ["a", "b"] as const) {
      const video = bufferEl(key);
      const track = video?.textTracks[0];
      if (track) track.mode = captionsOn && key === front ? "showing" : "hidden";
    }
  }, [captionsOn, front, buffers, bufferEl]);

  const handleBufferError = useCallback(
    (key: BufferKey) => {
      const pending = pendingRef.current;
      if (pending && pending.buffer === key) {
        // incoming clip failed — stay on the playing film, quietly
        swapGenRef.current += 1;
        setPendingSwap(null);
        currentSrcRef.current = buffersRef.current[frontRef.current]?.src ?? null;
        return;
      }
      if (frontRef.current === key) setFailed(true);
    },
    [],
  );

  const api = useMemo<FilmLayerApi>(
    () => ({ publishRect, setActiveSlot, releaseSlot, swapClip }),
    [publishRect, setActiveSlot, releaseSlot, swapClip],
  );

  const activeClip = buffers[front];
  const parked = activeSlotId === null;

  return (
    <FilmLayerContext.Provider value={api}>
      {children}
      <div
        ref={frameRef}
        data-film-layer=""
        data-film-parked={parked ? "true" : undefined}
        data-film-docked={docked ? "true" : undefined}
        inert={parked ? true : undefined}
        aria-hidden={parked ? true : undefined}
        className="kol-film-layer group"
      >
        {/* poster underlay — poster-first paint while a clip loads, and the
            quiet decode/404 fallback; bg-surface beneath means never black.
            Carries the incoming clip's focal crop so the poster and the
            film agree on where the maker's face is. */}
        {poster !== null ? (
          <PosterStill
            src={poster.src}
            className="kol-film-poster"
            objectPosition={clipObjectPosition(poster)}
          />
        ) : null}
        {/* focal-point crop (v1.3 clips[].focalPoint, CPO Ruling 3) applies
            on BOTH buffers — the layer IS the production path; FilmFrame's
            self-mode crop only covers provider-less mounts */}
        <video
          ref={videoARef}
          data-film-buffer="a"
          src={buffers.a?.src}
          poster={buffers.a?.poster}
          muted={muted}
          loop
          playsInline
          crossOrigin="anonymous"
          onError={() => handleBufferError("a")}
          style={buffers.a ? { objectPosition: clipObjectPosition(buffers.a) } : undefined}
          className={cn(
            "kol-film-buffer",
            front === "a" && buffers.a !== null && !failed && "kol-film-front",
          )}
        >
          {buffers.a?.captionsSrc ? (
            <track kind="captions" src={buffers.a.captionsSrc} srcLang="en" label="English" />
          ) : null}
        </video>
        <video
          ref={videoBRef}
          data-film-buffer="b"
          src={buffers.b?.src}
          poster={buffers.b?.poster}
          muted={muted}
          loop
          playsInline
          crossOrigin="anonymous"
          onError={() => handleBufferError("b")}
          style={buffers.b ? { objectPosition: clipObjectPosition(buffers.b) } : undefined}
          className={cn(
            "kol-film-buffer",
            front === "b" && buffers.b !== null && !failed && "kol-film-front",
          )}
        >
          {buffers.b?.captionsSrc ? (
            <track kind="captions" src={buffers.b.captionsSrc} srcLang="en" label="English" />
          ) : null}
        </video>
        {failed ? (
          <p className="relative m-4 max-w-max rounded-md bg-surface/85 px-3 py-2 text-caption text-muted">
            Couldn&rsquo;t load this clip
          </p>
        ) : null}
        {activeClip !== null && !parked ? (
          <FilmControls
            muted={muted}
            onMuteToggle={() => setMuted((m) => !m)}
            captionsOn={captionsOn}
            onCaptionsToggle={() => setCaptionsOn((c) => !c)}
            showCaptionsToggle={activeClip.captionsSrc !== null}
          />
        ) : null}
      </div>
    </FilmLayerContext.Provider>
  );
}
