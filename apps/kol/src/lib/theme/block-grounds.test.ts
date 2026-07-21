import { describe, expect, it } from "vitest";
import { groundStyle } from "@/components/blocks/shared";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { customThemeVars } from "./custom";
import { palettes } from "./tokens";

/**
 * WCAG 2.x contrast math (relative luminance) over the block-ground pairs —
 * the numeric backing for the P2-a AA constraint:
 *  - --block-a / --block-b carry BODY copy (craft-story, contact-cta) → the
 *    on-block ink must clear AA body 4.5:1 on every palette;
 *  - --block-c is DISPLAY-ONLY (voice-quote, atmosphere) → AA large-text
 *    3:1 floor. The schema-level rejection of "c" on body-copy blocks is
 *    covered in components/blocks/props.test.ts; this proves the tokens
 *    themselves hold the ratios those rules assume.
 * These pairs certify ALL text inside a colored section because groundStyle
 * points --ink AND --muted at the full on-block ink (no softened mix — QA
 * cycle-2: a 72% mix measured 3.32:1 body on sunbaked --block-a).
 * Full-page axe-core runs are the QA-Lead gate on /preview.
 */

function channel(hex: string, offset: number): number {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  return 0.2126 * channel(h, 0) + 0.7152 * channel(h, 2) + 0.0722 * channel(h, 4);
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("curated block-ground pairs hold the AA ratios the catalog scopes", () => {
  for (const palette of Object.values(palettes)) {
    const { blockA, onBlockA, blockB, onBlockB, blockC, onBlockC } = palette.blocks;

    it(`${palette.id}: --block-a and --block-b clear AA body 4.5:1`, () => {
      expect(contrastRatio(blockA, onBlockA)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(blockB, onBlockB)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${palette.id}: --block-c clears AA large-text 3:1 (display-only ground)`, () => {
      expect(contrastRatio(blockC, onBlockC)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("groundStyle keeps every text var on the AA-certified on-block ink", () => {
  for (const ground of ["a", "b", "c"] as const) {
    it(`ground "${ground}": --ink and --muted are the RAW on-block var, never a mix`, () => {
      const style = groundStyle(ground) as Record<string, string>;
      expect(style["--ink"]).toBe(`var(--on-block-${ground})`);
      // regression pin (QA cycle-2): a color-mix here re-fails AA body copy
      expect(style["--muted"]).toBe(`var(--on-block-${ground})`);
    });
  }
});

describe("custom-theme derived block-ground pairs hold AA (noor fixture)", () => {
  it("body-eligible grounds a/b clear 4.5:1 on the derived pairs", () => {
    if (customStore.theme.kind !== "custom") throw new Error("fixture must be custom");
    const vars = customThemeVars(customStore.theme);
    const v = (key: `--${string}`): string => {
      const value = vars[key];
      if (!value) throw new Error(`custom theme vars missing ${key}`);
      return value;
    };
    // --block-a/-c = accent + accentInk (the pipeline's AA-gated pair);
    // --block-b = inverted band (ink ground, bg type)
    expect(contrastRatio(v("--block-a"), v("--on-block-a"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(v("--block-b"), v("--on-block-b"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(v("--block-c"), v("--on-block-c"))).toBeGreaterThanOrEqual(3);
  });
});
