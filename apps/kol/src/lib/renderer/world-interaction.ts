"use client";

import { createContext, useContext } from "react";

/**
 * The B4 → B5 handoff contract: blocks report buyer intent UP to the world
 * shell; the shell owns what it means. Clicking a product advances the
 * stage to `narrate-shrink` (the Film Layer's dock edge fires via
 * HeroStage) and records the product on the world root as
 * `data-selected-product` — B5 reads it to narrate the piece; B4 never
 * builds the shrink itself.
 */
export interface WorldInteraction {
  /** The product the buyer went deeper on, `null` until one is chosen. */
  selectedProductId: string | null;
  /** A block-level product click — the doorway toward NARRATE_SHRINK (B5). */
  onProductSelect: (productId: string) => void;
}

export const WorldInteractionContext = createContext<WorldInteraction | null>(null);

/**
 * Null outside a live world (preview matrix, bare block mounts) — blocks
 * degrade to their non-interactive Wave-2 rendering, they don't crash.
 */
export function useWorldInteraction(): WorldInteraction | null {
  return useContext(WorldInteractionContext);
}
