"use client";

import { createContext, useContext } from "react";
import type { Clip } from "@/lib/store-config/types";

/**
 * The hero-slot contract between HeroStage (the slot registrar) and
 * FilmFrame (the film primitive), post-Amendment-A.
 *
 * Wave 0 made this a boolean: "you are the persistent hero — play on
 * mount, never pause." The persistence guarantee has since moved UP a
 * layer: the film element lives in the app-root Film Layer, and the hero
 * slot only registers geometry + clip. Three modes:
 *
 *   null    — outside any hero slot: FilmFrame keeps its catalog
 *             behaviour (own <video>, scroll-gated play/pause).
 *   "self"  — inside HeroStage with no FilmLayerProvider above (bare
 *             renderer mounts, unit rigs): FilmFrame owns its <video> and
 *             plays persistently — the exact Wave-0 behaviour.
 *   "layer" — the real app: FilmFrame renders the poster underlay only
 *             and registers its frame + clip; the Film Layer's root
 *             player IS the film. It never unmounts and never shows a
 *             paused or black frame (spec P4, relocated).
 */
export type HeroFilmSlot =
  | { mode: "self" }
  | { mode: "layer"; registerFilm: (element: HTMLElement, clip: Clip) => () => void };

export const HeroPersistenceContext = createContext<HeroFilmSlot | null>(null);

export function useHeroPersistence(): HeroFilmSlot | null {
  return useContext(HeroPersistenceContext);
}
