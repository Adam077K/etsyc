import type { ReactNode } from "react";
import type { BlockState } from "@/components/blocks/shared";
import type { StoreConfig } from "@/lib/store-config/types";
import { StoreWorld } from "./StoreWorld";
import type { WorldStage } from "./stages";

export { renderBlock } from "./render-block";
export { StoreWorld, type StoreWorldProps } from "./StoreWorld";
export { WORLD_STAGES, type WorldStage } from "./stages";

export interface RenderStoreOptions {
  /** Fallback state for every block without a per-block override. */
  state?: BlockState;
  /**
   * Per-block state control by block id — the renderer-level loading story
   * is progressive (each block skeletons/resolves on its own), and a single
   * failed block degrades locally while the world stays usable.
   */
  blockStates?: Record<string, BlockState>;
  isPreview?: boolean;
  /** Simulated buyer-journey stage the world starts in (default world-open). */
  initialStage?: WorldStage;
}

/**
 * renderStore — THE one renderer (concept-lock D4): a store-config JSON in,
 * a maker world out. Handles BOTH theme kinds (curated registry lookup /
 * custom any-hex roles) by converging them onto identical CSS variables at
 * the world root; sorts blocks by `order`; maps each through the registry
 * with per-block state + per-block crash boundary. The hero-video block
 * mounts inside the persistent HeroStage slot (`layoutId="hero-video"`) and
 * survives every world-stage transition without remounting or pausing —
 * see StoreWorld. Referential integrity of bindings is a write-time (Zod,
 * P3) guarantee — at render time a dangling id degrades to the block's
 * designed error/empty.
 */
export function renderStore(config: StoreConfig, options: RenderStoreOptions = {}): ReactNode {
  return (
    <StoreWorld
      config={config}
      state={options.state}
      blockStates={options.blockStates}
      isPreview={options.isPreview}
      initialStage={options.initialStage}
    />
  );
}
