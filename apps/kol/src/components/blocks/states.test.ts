import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BlockState } from "@/components/blocks/shared";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { matrixBlocksFor } from "@/lib/store-config/fixtures/preview-blocks";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import type { BlockType, StoreConfig } from "@/lib/store-config/types";
import { renderBlock } from "@/lib/renderer/render-store";

/**
 * 4-state discipline, per block, per theme path (catalog cross-cutting rules:
 * "a block that renders only `success` is not shippable"). Static SSR render
 * through the SAME dispatch the world renderer uses (renderBlock), against
 * both fixtures — curated (sena) and custom any-hex (noor). Visual fidelity
 * is the critic's job; these tests pin the state CONTRACT: what must render,
 * what must be omitted, and that nothing throws.
 */

const STATES: BlockState[] = ["success", "loading", "empty", "error"];

/** Optional blocks a LIVE world omits entirely when empty (catalog §1–§11). */
const LIVE_EMPTY_OMITTED: Set<BlockType> = new Set([
  "hero-video", // publish requires ≥1 clip; empty is seller-preview-only
  "craft-story",
  "product-showcase",
  "product-detail", // n/a by route guard
  "voice-quote",
  "process-reel",
  "contact-cta",
]);

/** Blocks whose loading state must show a layout-matched skeleton. */
const SKELETON_ON_LOADING: Set<BlockType> = new Set([
  "hero-video",
  "craft-story",
  "product-showcase",
  "product-detail",
  "voice-quote", // audio affordance shimmer (text shows immediately)
  "process-reel",
  "reviews",
  "trust-badge",
  "thank-you",
  // contact-cta: loading n/a (static from maker data); atmosphere: --ground fill
]);

function markup(config: StoreConfig, block: ReturnType<typeof matrixBlocksFor>[number], state: BlockState, isPreview: boolean): string {
  const data = {
    maker: config.maker,
    media: config.media,
    products: config.products,
    voiceovers: config.voiceovers,
  };
  return renderToStaticMarkup(
    createElement(Fragment, null, renderBlock(block, data, state, isPreview)),
  );
}

const fixtures: [string, StoreConfig][] = [
  ["sena (curated theme)", senaStore],
  ["noor (custom any-hex theme)", customStore],
];

for (const [name, config] of fixtures) {
  describe(`block × state matrix — ${name}`, () => {
    const blocks = matrixBlocksFor(config);

    it("covers all 11 catalog types with resolvable bindings", () => {
      expect(new Set(blocks.map((b) => b.type)).size).toBe(11);
      const clipIds = new Set(config.media.clips.map((c) => c.id));
      const imageIds = new Set(config.media.images.map((i) => i.id));
      const productIds = new Set(config.products.map((p) => p.id));
      const voIds = new Set(config.voiceovers.map((v) => v.id));
      for (const block of blocks) {
        for (const id of block.bindings.clipTags) expect(clipIds.has(id)).toBe(true);
        for (const id of block.bindings.imageIds) expect(imageIds.has(id)).toBe(true);
        for (const id of block.bindings.productIds) expect(productIds.has(id)).toBe(true);
        for (const id of block.bindings.voiceoverIds) expect(voIds.has(id)).toBe(true);
      }
    });

    for (const block of blocks) {
      describe(block.type, () => {
        it("renders all 4 states in seller preview without throwing — empty ≠ blank", () => {
          for (const state of STATES) {
            const html = markup(config, block, state, true);
            // every state, including empty, must render SOMETHING in preview
            expect(html, `${block.type} preview ${state} must not be blank`).not.toBe("");
          }
        });

        it("success renders content in the live world", () => {
          expect(markup(config, block, "success", false)).not.toBe("");
        });

        it(
          LIVE_EMPTY_OMITTED.has(block.type)
            ? "live empty: the block is omitted entirely (never an empty section)"
            : "live empty: the designed empty state renders (invitation/fallback/gap)",
          () => {
            const html = markup(config, block, "empty", false);
            if (LIVE_EMPTY_OMITTED.has(block.type)) {
              expect(html).toBe("");
            } else {
              expect(html).not.toBe("");
            }
          },
        );

        it("error state is quiet + inline — the block still renders around the failure", () => {
          expect(markup(config, block, "error", false)).not.toBe("");
        });

        if (SKELETON_ON_LOADING.has(block.type)) {
          it("loading shows a layout-matched skeleton, never a blank or a spinner", () => {
            const html = markup(config, block, "loading", false);
            expect(html).toContain("kol-skeleton");
            expect(html).not.toMatch(/spinner/i);
          });
        }
      });
    }
  });
}
