import { describe, expect, it } from "vitest";

import {
  MOOD,
  PAGE_ELIGIBILITY,
  PURPOSE,
  antiRepetitionKeySchema,
  tagSuggestionSchema,
  videoIdSchema,
  videoProfileWriteSchema,
  violatesThankyouOnly,
} from "./schemas";

const UUID_A = "6f1c1a2e-0b3d-4c5e-8f7a-9b0c1d2e3f4a";
const UUID_B = "0d9b8c7a-6e5f-4a3b-9c2d-1e0f9a8b7c6d";

const validWrite = {
  purpose: ["process"],
  page_eligibility: ["feed", "world"],
  product_links: [UUID_A],
  mood: ["calm"],
  anti_repetition_key: "sena-wheel",
};

describe("frozen tag constants (dispatch packet §7 — P6 reads these exact values)", () => {
  it("PURPOSE / PAGE_ELIGIBILITY / MOOD are byte-identical to the contract", () => {
    expect(PURPOSE).toEqual([
      "intro",
      "craft-story",
      "process",
      "product-narration",
      "thankyou",
      "atmosphere",
    ]);
    expect(PAGE_ELIGIBILITY).toEqual([
      "feed",
      "grown",
      "world",
      "product",
      "checkout",
      "thankyou",
    ]);
    expect(MOOD).toEqual(["calm", "warm", "energetic", "intimate"]);
  });
});

describe("videoProfileWriteSchema", () => {
  it("accepts a full valid manual payload", () => {
    const parsed = videoProfileWriteSchema.parse(validWrite);
    expect(parsed).toEqual(validWrite);
  });

  it("accepts all-empty arrays (untagged = invisible to the engine — the safe default)", () => {
    const parsed = videoProfileWriteSchema.parse({
      purpose: [],
      page_eligibility: [],
      product_links: [],
      mood: [],
      anti_repetition_key: null,
    });
    expect(parsed.purpose).toEqual([]);
    expect(parsed.anti_repetition_key).toBeNull();
  });

  it.each([
    ["purpose", ["selfie"]],
    ["purpose", ["Intro"]], // casing is part of the contract — no normalisation
    ["page_eligibility", ["homepage"]],
    ["mood", ["moody"]],
  ])("rejects a value outside the frozen %s list: %j", (field, bad) => {
    expect(
      videoProfileWriteSchema.safeParse({ ...validWrite, [field]: bad })
        .success,
    ).toBe(false);
  });

  it("rejects duplicate tag values instead of silently deduping", () => {
    expect(
      videoProfileWriteSchema.safeParse({
        ...validWrite,
        purpose: ["process", "process"],
      }).success,
    ).toBe(false);
    expect(
      videoProfileWriteSchema.safeParse({
        ...validWrite,
        product_links: [UUID_A, UUID_A],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid product link", () => {
    expect(
      videoProfileWriteSchema.safeParse({
        ...validWrite,
        product_links: ["not-a-uuid"],
      }).success,
    ).toBe(false);
  });

  it("rejects unknown keys (strict object — a bypassing caller gets no ride-alongs)", () => {
    expect(
      videoProfileWriteSchema.safeParse({ ...validWrite, video_id: UUID_B })
        .success,
    ).toBe(false);
  });
});

describe("thankyou-only invariant (write-time, both ways)", () => {
  it("accepts exactly purpose:['thankyou'] + page_eligibility:['thankyou']", () => {
    const parsed = videoProfileWriteSchema.safeParse({
      ...validWrite,
      purpose: ["thankyou"],
      page_eligibility: ["thankyou"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects thankyou purpose mixed with any other purpose", () => {
    const parsed = videoProfileWriteSchema.safeParse({
      ...validWrite,
      purpose: ["thankyou", "intro"],
      page_eligibility: ["thankyou"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects thankyou eligibility mixed with feed (the exact leak P6 structurally excludes)", () => {
    const parsed = videoProfileWriteSchema.safeParse({
      ...validWrite,
      purpose: ["thankyou"],
      page_eligibility: ["thankyou", "feed"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects thankyou on one side without the other being exactly ['thankyou']", () => {
    // page says thankyou, purpose doesn't
    expect(
      videoProfileWriteSchema.safeParse({
        ...validWrite,
        purpose: ["intro"],
        page_eligibility: ["thankyou"],
      }).success,
    ).toBe(false);
    // purpose says thankyou, page doesn't
    expect(
      videoProfileWriteSchema.safeParse({
        ...validWrite,
        purpose: ["thankyou"],
        page_eligibility: ["checkout"],
      }).success,
    ).toBe(false);
  });

  it("passes clips with no thankyou anywhere", () => {
    expect(
      violatesThankyouOnly({
        purpose: ["intro", "process"],
        page_eligibility: ["feed", "world"],
      }),
    ).toBe(false);
  });

  it("violatesThankyouOnly flags the same shapes the schema rejects", () => {
    expect(
      violatesThankyouOnly({
        purpose: ["thankyou"],
        page_eligibility: ["thankyou", "feed"],
      }),
    ).toBe(true);
    expect(
      violatesThankyouOnly({
        purpose: ["thankyou"],
        page_eligibility: ["thankyou"],
      }),
    ).toBe(false);
  });
});

describe("antiRepetitionKeySchema", () => {
  it("stores empty as null (absence, not a blank string)", () => {
    expect(antiRepetitionKeySchema.parse("")).toBeNull();
    expect(antiRepetitionKeySchema.parse("   ")).toBeNull();
    expect(antiRepetitionKeySchema.parse(null)).toBeNull();
  });

  it("accepts a lowercase kebab slug", () => {
    expect(antiRepetitionKeySchema.parse("sena-wheel")).toBe("sena-wheel");
    expect(antiRepetitionKeySchema.parse("wheel2")).toBe("wheel2");
  });

  it.each(["Sena-Wheel", "sena_wheel", "-sena", "sena-", "sena--wheel", "séna"])(
    "rejects %s (not a lowercase kebab slug)",
    (bad) => {
      expect(antiRepetitionKeySchema.safeParse(bad).success).toBe(false);
    },
  );

  it("rejects > 64 chars", () => {
    expect(antiRepetitionKeySchema.safeParse("a".repeat(65)).success).toBe(
      false,
    );
  });
});

describe("tagSuggestionSchema", () => {
  const validSuggestion = { ...validWrite, confidence: 0.85 };

  it("accepts a valid suggestion", () => {
    expect(tagSuggestionSchema.parse(validSuggestion).confidence).toBe(0.85);
  });

  it("rejects confidence outside 0–1", () => {
    expect(
      tagSuggestionSchema.safeParse({ ...validSuggestion, confidence: 1.2 })
        .success,
    ).toBe(false);
    expect(
      tagSuggestionSchema.safeParse({ ...validSuggestion, confidence: -0.1 })
        .success,
    ).toBe(false);
  });

  it("rejects a suggestion missing confidence", () => {
    expect(tagSuggestionSchema.safeParse(validWrite).success).toBe(false);
  });

  it("enforces the thankyou-only invariant on suggestions too (an invalid proposal never reaches the seller)", () => {
    expect(
      tagSuggestionSchema.safeParse({
        ...validSuggestion,
        purpose: ["thankyou"],
        page_eligibility: ["thankyou", "feed"],
      }).success,
    ).toBe(false);
  });
});

describe("videoIdSchema", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(videoIdSchema.parse(UUID_A)).toBe(UUID_A);
    expect(videoIdSchema.safeParse("42").success).toBe(false);
  });
});
