import type { ReactNode } from "react";
import { blockRegistry } from "@/components/blocks/registry";
import type { BlockProps, BlockState } from "@/components/blocks/shared";
import type { StoreBlock, StoreConfig } from "@/lib/store-config/types";
import { themeStyle } from "@/lib/theme/apply-theme";
import { cn } from "@/lib/utils";

/**
 * renderStore — THE one renderer (concept-lock D4): a store-config JSON in,
 * a maker world out. Handles BOTH theme kinds (curated registry lookup /
 * custom any-hex roles) by converging them onto identical CSS variables at
 * the world root; sorts blocks by `order`; maps each through the registry.
 * Referential-integrity of bindings is a write-time (Zod, P3) guarantee —
 * at render time a dangling id degrades to the block's designed error/empty.
 */
export function renderStore(
  config: StoreConfig,
  options: { state?: BlockState; isPreview?: boolean } = {},
): ReactNode {
  const { state = "success", isPreview = false } = options;
  const data = {
    maker: config.maker,
    media: config.media,
    products: config.products,
    voiceovers: config.voiceovers,
  };

  const ordered = [...config.blocks].sort((a, b) => a.order - b.order);

  return (
    <div
      data-store={config.storeId}
      data-theme-kind={config.theme.kind}
      data-motion-preset={config.theme.motionPreset}
      style={themeStyle(config.theme)}
      className={cn(
        "kol-world flex min-h-screen flex-col bg-ground font-text text-body text-ink",
        "gap-[var(--space-section)] pb-[var(--space-section)]",
      )}
    >
      {ordered.map((block) => renderBlock(block, data, state, isPreview))}
    </div>
  );
}

/**
 * Single-block dispatch — exported for the /preview 4-state matrix so the
 * critic screenshots the exact components the world renderer composes.
 */
export function renderBlock(
  block: StoreBlock,
  data: BlockProps["data"],
  state: BlockState = "success",
  isPreview = false,
): ReactNode {
  // Correlated-union dispatch: the registry is keyed so that
  // blockRegistry[block.type] accepts exactly `block`'s narrowed type; TS
  // can't correlate the two generics across the index, hence the local cast.
  const Component = blockRegistry[block.type] as React.ComponentType<BlockProps>;
  return (
    <Component
      key={block.id}
      block={block}
      data={data}
      state={state}
      isPreview={isPreview}
    />
  );
}
