"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { easeOut } from "@/lib/motion";

/**
 * The continuous film layer (Wave 3, Track A).
 *
 * A SINGLE persistent film element lives in the app shell (<FilmStage>, mounted
 * in the root layout) and is never unmounted across the buyer routes
 * `/m/[slug] → …/p/[product] → /checkout → /thank-you`. Because the <video>
 * DOM node survives every route change, playback and currentTime are literally
 * continuous — the film is never "re-mounted from black" at a route boundary.
 *
 * Buyer surfaces register a FilmIntent (which maker, which clip, poster, label)
 * and drive the stage's position through the shared MotionValues below —
 * transform + opacity only, never layout properties. Two driving styles:
 *   • discrete route transitions → `driveTo(...)` springs the values on the
 *     locked ease curve.
 *   • scroll-linked docking (the maker world) → bind values straight from the
 *     route's own `useTransform(scrollYProgress, …)` via `.set()` each frame,
 *     which never triggers a React render.
 */

export interface FilmIntent {
  /** maker id — also the /m/[slug] route slug. Identity of the film subject. */
  makerId: string;
  /** optional real clip; falls back to the poster still inside <MakerFilm>. */
  videoSrc?: string;
  poster: string;
  alt: string;
  /** contextual label shown as chrome over the stage (journey step 5). */
  clipLabel?: string;
  /** small meta line under the label (e.g. "Odd Clay Studio · 0:24"). */
  clipMeta?: string;
  /** chip framing: the live cue changes per beat of the journey. */
  chip?: "watch" | "now-playing" | "personal";
  /** playhead to seed on mount — carries currentTime across the feed→world seam. */
  seedTime?: number;
  /** show the stage's own chip (legible on large films; hidden on the tiny PiP,
      where the route renders its own contextual label). Defaults to true. */
  stageChip?: boolean;
}

/** The shared transform of the persistent film — all transform/opacity. */
export interface FilmMotion {
  scale: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  radius: MotionValue<number>;
  opacity: MotionValue<number>;
  /** transform-origin in percent (0–100). */
  originX: MotionValue<number>;
  originY: MotionValue<number>;
  /** 0–1 drop-shadow strength. */
  shadow: MotionValue<number>;
}

export type FilmTarget = Partial<{
  scale: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  originX: number;
  originY: number;
  shadow: number;
}>;

/** Optional pointer interaction the active route grants the stage. */
export interface FilmInteraction {
  onActivate: () => void;
  label: string;
}

interface FilmController {
  intent: FilmIntent | null;
  m: FilmMotion;
  /** live <video> node (when a clip is playing) — for currentTime seeding. */
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  interaction: FilmInteraction | null;
  present: (intent: FilmIntent) => void;
  clear: () => void;
  setInteraction: (i: FilmInteraction | null) => void;
  /** Spring the transform toward a target on the locked ease. Reduced-motion
      collapses the duration to ~0 so it settles instantly (presence, no move). */
  driveTo: (target: FilmTarget, opts?: { duration?: number; reduce?: boolean }) => void;
  /** Snap immediately (no animation) — used to seed the handoff rect. */
  snapTo: (target: FilmTarget) => void;
}

const FilmCtx = createContext<FilmController | null>(null);

export function useFilm(): FilmController {
  const c = useContext(FilmCtx);
  if (!c) throw new Error("useFilm must be used within <FilmProvider>");
  return c;
}

export function FilmProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = useState<FilmIntent | null>(null);
  const [interaction, setInteraction] = useState<FilmInteraction | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const radius = useMotionValue(0);
  const opacity = useMotionValue(0);
  const originX = useMotionValue(50);
  const originY = useMotionValue(50);
  const shadow = useMotionValue(0);

  const m = useMemo<FilmMotion>(
    () => ({ scale, x, y, radius, opacity, originX, originY, shadow }),
    [scale, x, y, radius, opacity, originX, originY, shadow],
  );

  // Track running animations so a new drive cancels the previous one per value.
  const runningRef = useRef<AnimationPlaybackControls[]>([]);

  const present = useCallback((next: FilmIntent) => {
    setIntent((prev) => {
      // Idempotent: identical intent keeps the same node → no remount, no churn.
      if (
        prev &&
        prev.makerId === next.makerId &&
        prev.videoSrc === next.videoSrc &&
        prev.poster === next.poster &&
        prev.clipLabel === next.clipLabel &&
        prev.clipMeta === next.clipMeta &&
        prev.chip === next.chip
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIntent(null);
    setInteraction(null);
  }, []);

  const snapTo = useCallback(
    (t: FilmTarget) => {
      runningRef.current.forEach((c) => c.stop());
      runningRef.current = [];
      if (t.scale !== undefined) scale.set(t.scale);
      if (t.x !== undefined) x.set(t.x);
      if (t.y !== undefined) y.set(t.y);
      if (t.radius !== undefined) radius.set(t.radius);
      if (t.opacity !== undefined) opacity.set(t.opacity);
      if (t.originX !== undefined) originX.set(t.originX);
      if (t.originY !== undefined) originY.set(t.originY);
      if (t.shadow !== undefined) shadow.set(t.shadow);
    },
    [scale, x, y, radius, opacity, originX, originY, shadow],
  );

  const driveTo = useCallback(
    (t: FilmTarget, opts?: { duration?: number; reduce?: boolean }) => {
      runningRef.current.forEach((c) => c.stop());
      const duration = opts?.reduce ? 0.001 : opts?.duration ?? 0.7;
      const tr = { duration, ease: easeOut } as const;
      const next: AnimationPlaybackControls[] = [];
      const map: [MotionValue<number>, number | undefined][] = [
        [scale, t.scale],
        [x, t.x],
        [y, t.y],
        [radius, t.radius],
        [opacity, t.opacity],
        [originX, t.originX],
        [originY, t.originY],
        [shadow, t.shadow],
      ];
      // Origin must jump before a move (animating origin warps the path).
      if (t.originX !== undefined) originX.set(t.originX);
      if (t.originY !== undefined) originY.set(t.originY);
      for (const [mv, val] of map) {
        if (val === undefined || mv === originX || mv === originY) continue;
        next.push(animate(mv, val, tr));
      }
      runningRef.current = next;
    },
    [scale, x, y, radius, opacity, originX, originY, shadow],
  );

  const value = useMemo<FilmController>(
    () => ({
      intent,
      m,
      videoRef,
      interaction,
      present,
      clear,
      setInteraction,
      driveTo,
      snapTo,
    }),
    [intent, m, interaction, present, clear, driveTo, snapTo],
  );

  return <FilmCtx.Provider value={value}>{children}</FilmCtx.Provider>;
}
