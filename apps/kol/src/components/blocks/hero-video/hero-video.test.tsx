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

describe("hero-video statement + identity line — E5 ruling (D10)", () => {
  it("statement present → it holds the display tier and the maker's name LEADS the caption line beneath (never absent from the hero frame)", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    block.props.statement = "Clay remembers every hand.";
    const html = markup(config);
    expect(html).toContain("Clay remembers every hand.");
    // exactly one display-tier line — the statement
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Clay remembers every hand\.<\/h1>/);
    // E5: identity never yields to voice — the name demotes to caption
    // lead, it does not disappear (B3 is deep-linkable; a cold arrival
    // must be able to name the person whose words they are reading)
    expect(html).toContain("Sena Okonkwo");
    expect(html).toMatch(/<span>Sena Okonkwo<\/span> · /);
  });

  it("statement present + craft line hidden → the caption line still renders, carrying the name alone", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    block.props.statement = "Clay remembers every hand.";
    block.props.showCraftLine = false;
    const html = markup(config);
    expect(html.match(/<h1/g)).toHaveLength(1);
    // name present with showCraftLine either true or false (binding AC)
    expect(html).toContain("<span>Sena Okonkwo</span>");
    // the craft line itself is genuinely off
    expect(html).not.toContain("hand-thrown stoneware");
  });

  it("statement absent → the NAME holds the display tier (nameplate: stored identity, not attributed speech)", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    delete block.props.statement;
    const html = markup(config);
    // exactly one display-tier line and its content is maker.displayName
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Sena Okonkwo<\/h1>/);
    // nameplate register, never the speech register (weight/tracking split
    // is the load-bearing part of E5)
    expect(html).toMatch(/<h1[^>]*font-bold[^>]*tracking-\[-0\.03em\]/);
  });

  it("statement absent + craft line hidden → still no promotion of anything into the hero slot", () => {
    const config = cloneSena();
    const { block } = heroSetup(config);
    delete block.props.statement;
    block.props.showCraftLine = false;
    const html = markup(config);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Sena Okonkwo<\/h1>/);
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
