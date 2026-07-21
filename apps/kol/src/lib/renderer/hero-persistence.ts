"use client";

import { createContext, useContext } from "react";

/**
 * True only inside the renderer's persistent hero slot (HeroStage).
 * FilmFrame reads this to switch off scroll-gated pausing: the hero film
 * NEVER pauses on a world-stage transition (spec P4 — the signature
 * invariant; the film always wins). Everywhere else the default (false)
 * keeps the catalog's scroll-gated play/pause behavior.
 */
export const HeroPersistenceContext = createContext(false);

export function useHeroPersistence(): boolean {
  return useContext(HeroPersistenceContext);
}
