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
import { PosterStill } from "@/components/media/PosterStill";
import { cn } from "@/lib/utils";
import { EDGE_TABLE, resolveEdgeMs, resolveSwapMs, type FilmEdge } from "./edge-table";
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

export interface FilmLayerApi {
  /** A screen tells the layer where the film should sit for a slot. */
  publishRect(slotId: string, rect: FilmRect, options?: FilmSlotOptions): void;
  /**
   * A screen claims the film; the layer FLIPs to that slot's rect on the
   * given §5.2 edge (null = snap — first claim, or a non-event like
   * WORLD_OPEN ↔ WORLD_BROWSE). `reverse` applies the §5.1 return-ratio
   * rule when a forward edge is walked backwards in preview.
   */
  setActiveSlot(slotId: string, edge?: FilmEdge | null, options?: { reverse?: boolean }): void;
  /** Unregister a slot; if it held the film, the layer parks (stays mounted). */
  releaseSlot(slotId: string): void;
  /** Load a clip into the inactive buffer and cross-fade once it plays. */
  swapClip(src: string, poster: string, captionsSrc?: string | null): void;
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
  buffersRef.current = buffers;
  const [front, setFront] = useState<BufferKey>("a");
  const frontRef = useRef<BufferKey>("a");
  const [pendingSwap, setPendingSwap] = useState<{ buffer: BufferKey; gen: number } | null>(null);
  const pendingRef = useRef(pendingSwap);
  pendingRef.current = pendingSwap;
  const swapGenRef = useRef(0);
  const currentSrcRef = useRef<string | null>(null);

  const [posterSrc, setPosterSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);

  const bufferEl = useCallback(
    (key: BufferKey) => (key === "a" ? videoARef.current : videoBRef.current),
    [],
  );

  /**
   * Move the frame to a slot's rect. Layout position (position/left/top/
   * width/height) snaps in one write; motion is FLIP — invert to where the
   * frame just was, flush, release on the edge's transition. Same-source,
   * transform-only: the buffers are never touched here.
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

      const first = frame.getBoundingClientRect();

      frame.style.position = record.fixed ? "fixed" : "absolute";
      frame.style.left = `${record.fixed ? record.rect.left : record.docLeft}px`;
      frame.style.top = `${record.fixed ? record.rect.top : record.docTop}px`;
      frame.style.width = `${record.rect.width}px`;
      frame.style.height = `${record.rect.height}px`;
      if (record.radius) frame.style.borderRadius = record.radius;
      else frame.style.removeProperty("border-radius");

      const snap = () => {
        // Reduced motion / first claim / rect tracking: the FLIP SKIPS its
        // invert step entirely (§5.3) — running it at 0.01ms would jump.
        frame.style.transition = "none";
        frame.style.transform = "";
        void frame.getBoundingClientRect();
        frame.style.transition = "";
      };

      if (
        edge === null ||
        options?.wasParked === true ||
        prefersReducedMotion() ||
        first.width <= 0 ||
        first.height <= 0
      ) {
        snap();
        return;
      }

      const last = frame.getBoundingClientRect();
      if (last.width <= 0 || last.height <= 0) {
        snap();
        return;
      }

      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const sx = first.width / last.width;
      const sy = first.height / last.height;

      const spec = EDGE_TABLE[edge];
      const durationMs = resolveEdgeMs(edge, options);
      frame.style.transition = "none";
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
      frame.style.transform = "";
    },
    [],
  );

  const publishRect = useCallback(
    (slotId: string, rect: FilmRect, options?: FilmSlotOptions) => {
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
      // re-publish of the live slot (resize, layout shift) tracks by SNAP —
      // rect maintenance is not an edge
      if (activeSlotRef.current === slotId) {
        positionToSlot(slotId, null);
        setDocked(fixed);
      }
    },
    [positionToSlot],
  );

  const setActiveSlot = useCallback(
    (slotId: string, edge: FilmEdge | null = null, options?: { reverse?: boolean }) => {
      const wasParked = activeSlotRef.current === null;
      activeSlotRef.current = slotId;
      setActiveSlotId(slotId);
      setDocked(slots.current.get(slotId)?.fixed === true);
      positionToSlot(slotId, wasParked ? null : edge, { ...options, wasParked });
    },
    [positionToSlot],
  );

  const releaseSlot = useCallback((slotId: string) => {
    slots.current.delete(slotId);
    if (activeSlotRef.current === slotId) {
      // park — hidden, but never unmounted (the frame outlives every screen)
      activeSlotRef.current = null;
      setActiveSlotId(null);
      setDocked(false);
    }
  }, []);

  const swapClip = useCallback((src: string, poster: string, captionsSrc: string | null = null) => {
    if (currentSrcRef.current === src) return;
    currentSrcRef.current = src;
    const gen = ++swapGenRef.current;
    const incoming: BufferKey = frontRef.current === "a" ? "b" : "a";
    setFailed(false);
    setPosterSrc(poster);
    setBuffers((prev) => ({ ...prev, [incoming]: { src, poster, captionsSrc } }));
    setPendingSwap({ buffer: incoming, gen });
  }, []);

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
          frontRef.current = pendingSwap.buffer;
          setFront(pendingSwap.buffer);
          setPendingSwap(null);
        })
        .catch(() => {
          if (cancelled || swapGenRef.current !== pendingSwap.gen) return;
          // Autoplay veto (browser policy). If a film is playing, keep it —
          // never trade a playing frame for a paused one. On a cold start
          // promote anyway: the incoming poster shows (poster-first, no
          // error chrome — FilmFrame parity).
          const outgoing = bufferEl(frontRef.current);
          const outgoingLive =
            outgoing !== null && buffersRef.current[frontRef.current] !== null && !outgoing.paused;
          if (outgoingLive) {
            currentSrcRef.current = buffersRef.current[frontRef.current]?.src ?? null;
            setPendingSwap(null);
            return;
          }
          frontRef.current = pendingSwap.buffer;
          setFront(pendingSwap.buffer);
          setPendingSwap(null);
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
  }, [pendingSwap, bufferEl]);

  // After the cross-fade the hidden rear buffer releases its decoder. The
  // pause is unobservable — opacity 0 behind an opaque, already-playing
  // front — so the "never shows a paused frame" AC holds.
  useEffect(() => {
    const rearKey: BufferKey = front === "a" ? "b" : "a";
    const rear = bufferEl(rearKey);
    if (!rear || buffersRef.current[rearKey] === null) return;
    const timer = window.setTimeout(() => rear.pause(), resolveSwapMs() + 80);
    return () => window.clearTimeout(timer);
  }, [front, bufferEl]);

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
            quiet decode/404 fallback; bg-surface beneath means never black */}
        {posterSrc !== null ? <PosterStill src={posterSrc} className="kol-film-poster" /> : null}
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
