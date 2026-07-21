import { describe, expect, it } from "vitest";
import {
  blockPropsSchemaByType,
  blockSchemaByType,
  validateBlockProps,
} from "./props";
import { StoreBlockSchema } from "@/lib/store-config/schema";
import type { BlockType } from "@/lib/store-config/types";

const ALL_TYPES: BlockType[] = [
  "hero-video",
  "craft-story",
  "product-showcase",
  "product-detail",
  "voice-quote",
  "process-reel",
  "reviews",
  "trust-badge",
  "thank-you",
  "atmosphere",
  "contact-cta",
];

/** A minimal VALID props object per catalog type. */
const validProps: Record<BlockType, unknown> = {
  "hero-video": { showCraftLine: true },
  "craft-story": { heading: "Ash from the workshop", body: "Every glaze starts as swept ash." },
  "product-showcase": { eyebrow: "From the kiln" },
  "product-detail": { showModel3d: false },
  "voice-quote": { quote: "The wheel leaves a mark. I leave it in." },
  "process-reel": { caption: "One tumbler, start to trim" },
  reviews: { layout: "list" },
  "trust-badge": {},
  "thank-you": { message: "Thank you for giving this piece a home." },
  atmosphere: { toneShift: "warm" },
  "contact-cta": { label: "Message Sena" },
};

/** A WRONG-SHAPE props object per type (missing required / unknown key / bad enum). */
const invalidProps: Record<BlockType, unknown> = {
  "hero-video": {}, // showCraftLine required
  "craft-story": { heading: "Only a heading" }, // body required
  "product-showcase": { showCraftLine: true }, // unknown key (strict)
  "product-detail": { showModel3d: "yes" }, // wrong primitive
  "voice-quote": { quote: 42 }, // wrong primitive
  "process-reel": { caption: 42 }, // wrong primitive
  reviews: { layout: "grid" }, // not a catalog layout
  "trust-badge": { extra: true }, // strict: no props allowed
  "thank-you": { message: 3 }, // wrong primitive
  atmosphere: { toneShift: "loud" }, // not a catalog tone
  "contact-cta": {}, // label required
};

describe("per-type props schemas (P3 discriminated union re-surface)", () => {
  it("covers exactly the 11 catalog types", () => {
    expect(Object.keys(blockSchemaByType).sort()).toEqual([...ALL_TYPES].sort());
    expect(Object.keys(blockPropsSchemaByType).sort()).toEqual([...ALL_TYPES].sort());
  });

  for (const type of ALL_TYPES) {
    it(`${type}: accepts its own props shape`, () => {
      expect(validateBlockProps(type, validProps[type])).toEqual({ ok: true });
    });

    it(`${type}: rejects wrong-shape props`, () => {
      const result = validateBlockProps(type, invalidProps[type]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
    });
  }

  it("the union rejects one type's props under another type's discriminant", () => {
    const block = {
      id: "b_x",
      order: 0,
      type: "hero-video",
      variant: "full-bleed",
      props: validProps["craft-story"], // wrong props for hero-video
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    };
    expect(StoreBlockSchema.safeParse(block).success).toBe(false);
  });
});

describe("block-ground AA constraint (P2-a)", () => {
  const bodyCopyTypes = ["craft-story", "contact-cta"] as const;
  const displayTypes = ["voice-quote", "atmosphere"] as const;

  for (const type of bodyCopyTypes) {
    it(`${type} (body copy): dark grounds a/b and null pass, midtone "c" is rejected`, () => {
      for (const ground of ["a", "b", null] as const) {
        expect(validateBlockProps(type, { ...(validProps[type] as object), blockGround: ground })).toEqual({ ok: true });
      }
      const rejected = validateBlockProps(type, { ...(validProps[type] as object), blockGround: "c" });
      expect(rejected.ok).toBe(false);
    });
  }

  for (const type of displayTypes) {
    it(`${type} (display type): all three grounds and null pass`, () => {
      for (const ground of ["a", "b", "c", null] as const) {
        expect(validateBlockProps(type, { ...(validProps[type] as object), blockGround: ground })).toEqual({ ok: true });
      }
    });
  }

  it("non-eligible blocks reject a blockGround prop entirely (strict objects)", () => {
    for (const type of ["hero-video", "product-showcase", "thank-you"] as const) {
      const result = validateBlockProps(type, { ...(validProps[type] as object), blockGround: "a" });
      expect(result.ok).toBe(false);
    }
  });
});
