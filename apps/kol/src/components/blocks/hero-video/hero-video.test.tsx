import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BlockState } from "@/components/blocks/shared";
import {
  clipObjectPosition,
  DEFAULT_CLIP_FOCAL_POINT,
} from "@/components/media/focal-point";
import { renderBlock } from "@/lib/renderer/render-store";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import type { BlockOfType, StoreConfig } from "@/lib/store-config/types";

/**
 * P3-EXT renderer support — the two v1.3 Wave-3 additive fields, through the
 * SAME dispatch the world renderer uses (renderBlock):
 *  - `hero-video.props.statement`: renders as the hero line when the maker
 *    authored one; when absent NOTHING is promoted into the slot (D10 — no
 *    generated line, no craft-line promotion, no store-name substitute).
 *  - `clips[].focalPoint`: object-position crop on the film frame + poster
 *    states, renderer-defaulted to centre when the config omits it.
 */

function cloneSena(): StoreConfig {
  return structuredClone(senaStore);
}

function heroSetup(config: StoreConfig): {
  block: BlockOfType<"hero-video">;
  data: Pick<StoreConfig, "maker" | "media" | "products" | "voiceovers">;
} {
  const block = config.blocks.find((b) => b.type === "hero-video");
  if (!block || block.type !== "hero-video") throw new Error("fixture must contain a hero");
  return {
    block,
    data: {
      maker: config.maker,
      media: config.media,
      products: config.products,
      voiceovers: config.voiceovers,
    },
  };
}

function markup(config: StoreConfig, state: BlockState = "success"): string {
  const { block, data } = heroSetup(config);
  return renderToStaticMarkup(
    createElement(Fragment, null, renderBlock(block, data, state, false)),
  );
}

describe("hero-video statement — the maker's one big line (D10)", () => {
  it("renders a maker-authored statement as the hero line, replacing the name line", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    block.props.statement = "Clay remembers every hand.";
    const html = markup(config);
    expect(html).toContain("Clay remembers every hand.");
    // the statement takes the single hero slot — the name line yields to it
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain("Sena Okonkwo");
  });

  it("statement absent → NO fallback into the hero slot: the name line renders exactly as before", () => {
    const html = markup(cloneSena());
    // pre-amendment render, unchanged: one h1 carrying the maker's NAME
    // (an identity line, not words attributed to the maker)
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Sena Okonkwo");
  });

  it("statement absent + craft line hidden → still no promotion of anything into the hero slot", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    block.props.showCraftLine = false;
    const html = markup(config);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Sena Okonkwo");
    // the craft line is gone entirely — never re-surfaced as a hero line
    expect(html).not.toContain("hand-thrown stoneware");
  });
});

describe("clips[].focalPoint — cross-aspect crop anchor", () => {
  function setHeroClipFocalPoint(config: StoreConfig, focalPoint: { x: number; y: number }): void {
    const clip = config.media.clips.find((c) => c.id === "clip_intro");
    if (!clip) throw new Error("fixture must contain clip_intro");
    clip.focalPoint = focalPoint;
  }

  it("crops the film frame to the authored focal point (success)", () => {
    const config = cloneSena();
    setHeroClipFocalPoint(config, { x: 0.3, y: 0.2 });
    expect(markup(config)).toContain("object-position:30% 20%");
  });

  it("defaults to centre when the stored config omits focalPoint (renderer default, not parse-injected)", () => {
    expect(markup(cloneSena())).toContain("object-position:50% 50%");
  });

  it("applies the same crop to the poster in the loading and error states", () => {
    const config = cloneSena();
    setHeroClipFocalPoint(config, { x: 0.7, y: 0.4 });
    expect(markup(config, "loading")).toContain("object-position:70% 40%");
    expect(markup(config, "error")).toContain("object-position:70% 40%");
  });

  it("clipObjectPosition: authored point maps to percentages; absent maps to the centre default", () => {
    expect(clipObjectPosition({ focalPoint: { x: 0, y: 1 } })).toBe("0% 100%");
    expect(clipObjectPosition({})).toBe("50% 50%");
    expect(DEFAULT_CLIP_FOCAL_POINT).toEqual({ x: 0.5, y: 0.5 });
  });
});
