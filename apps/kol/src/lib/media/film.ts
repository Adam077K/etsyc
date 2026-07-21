"use client";

/**
 * Film media plumbing — the drop-in seam for D12 maker footage.
 *
 * Every film surface in KOL is currently a designed gradient. Real footage
 * doesn't exist yet, so rather than fake it, the video path is built and
 * simply has nothing to load: pass `src` and you get a real <video>; omit
 * it (or let the file 404) and the gradient stands in. See
 * public/media/README.md for the file contract.
 */

import { useSyncExternalStore } from "react";

export type FilmVariant = "v1" | "v2" | "v3" | "v4" | "v5";

/** Gradient stand-ins, one per maker palette. Matches the approved mockups. */
export const FILM_GRADIENTS: Record<FilmVariant, string> = {
  v1: "linear-gradient(140deg,#8a6a4f,#3f3327 60%,#241d16)", // sena · stoneware
  v2: "linear-gradient(140deg,#6d7a4a,#2f3a24 60%,#1a2016)", // elias · bookbinding
  v3: "linear-gradient(140deg,#4c93a8,#26414c 60%,#16242a)", // tomas · woodwork
  v4: "linear-gradient(140deg,#b8452a,#5c2317 60%,#2a1410)", // mira · copper
  v5: "linear-gradient(140deg,#7a2e4a,#3d1726 60%,#1e0c13)", // noor · indigo
};

export function gradientFor(variant: string | undefined): string {
  const key = (variant ?? "v1") as FilmVariant;
  return FILM_GRADIENTS[key] ?? FILM_GRADIENTS.v1;
}

/**
 * Tracks `prefers-reduced-motion`. Film never autoplays when it's set —
 * the poster (or gradient) holds and the viewer presses play.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** The server can't know the preference; assume motion is allowed. */
const getReducedMotionServer = (): boolean => false;

export function usePrefersReducedMotion(): boolean {
  // An external browser preference is exactly what useSyncExternalStore is
  // for — subscribing in an effect and mirroring it into state would tear
  // during hydration and trips react-hooks/set-state-in-effect.
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );
}
