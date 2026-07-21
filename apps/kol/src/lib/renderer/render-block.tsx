import type { ReactNode } from "react";
import { BlockBoundary } from "@/components/blocks/BlockBoundary";
import { blockRegistry } from "@/components/blocks/registry";
import type { BlockProps, BlockState } from "@/components/blocks/shared";
import type { StoreBlock } from "@/lib/store-config/types";

/**
 * Single-block dispatch — registry lookup + per-block crash boundary.
 * Lives apart from render-store so the client StoreWorld and the server
 * /preview matrix share it without a module cycle.
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
    <BlockBoundary key={block.id} blockId={block.id}>
      <Component block={block} data={data} state={state} isPreview={isPreview} />
    </BlockBoundary>
  );
}
