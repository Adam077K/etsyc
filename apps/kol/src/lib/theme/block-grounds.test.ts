import { describe, expect, it } from "vitest";
import { palettes } from "./tokens";

/**
 * WCAG 2.x contrast math (relative luminance) over the curated block-ground
 * token pairs — the numeric backing for the P2-a AA constraint:
 *  - --block-a / --block-b carry BODY copy (craft-story, contact-cta) → the
 *    on-block ink must clear AA body 4.5:1 on every palette;
 *  - --block-c is DISPLAY-ONLY (voice-quote, atmosphere) → AA large-text
 *    3:1 floor. The schema-level rejection of "c" on body-copy blocks is
 *    covered in components/blocks/props.test.ts; this proves the tokens
 *    themselves hold the ratios those rules assume.
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
