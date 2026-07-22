import { describe, expect, it } from "vitest";

import {
  badgesSchema,
  currencySchema,
  formatPrice,
  inventoryQtySchema,
  inventoryStatusSchema,
  majorToMinor,
  minorToMajor,
  narrationClipIdsSchema,
  optionalUuidSchema,
  priceMajorSchema,
  PRICE_MAX_MINOR,
  productSpecsSchema,
  productWriteSchema,
  SPEC_FIELDS,
  titleSchema,
} from "./schemas";

/**
 * Unit tests for the S8 product write contract. The money round-trip is the
 * load-bearing part: `create_order` charges whatever this module stored, so
 * major→minor→major must be exact — integer minor units, no floats, ever.
 */

describe("money — majorToMinor", () => {
  it("converts a plain 2dp amount exactly (12.34 → 1234)", () => {
    expect(majorToMinor("12.34")).toBe(1234);
  });

  it("converts zero (0 → 0)", () => {
    expect(majorToMinor("0")).toBe(0);
  });

  it("pads a 1dp amount — trailing-zero minor units (12.3 → 1230)", () => {
    expect(majorToMinor("12.3")).toBe(1230);
  });

  it("converts a whole amount (48 → 4800)", () => {
    expect(majorToMinor("48")).toBe(4800);
  });

  it("is exact where float math is not (0.29 → 29, 19.99 → 1999)", () => {
    // 0.29 * 100 === 28.999999999999996 in IEEE 754 — string math avoids it.
    expect(majorToMinor("0.29")).toBe(29);
    expect(majorToMinor("19.99")).toBe(1999);
  });

  it("accepts the documented cap (9999999.99 → PRICE_MAX_MINOR)", () => {
    expect(majorToMinor("9999999.99")).toBe(PRICE_MAX_MINOR);
  });

  it.each([
    ["three decimal places", "12.345"],
    ["negative", "-1"],
    ["grouping commas", "1,234"],
    ["trailing dot", "12."],
    ["leading dot", ".50"],
    ["exponent", "1e3"],
    ["hex", "0x10"],
    ["empty", ""],
    ["words", "twelve"],
    ["currency prefix", "£12.34"],
    ["8-digit units (over cap)", "10000000"],
    ["Infinity", "Infinity"],
  ])("rejects %s (%j)", (_label, input) => {
    expect(majorToMinor(input)).toBeNull();
  });

  it("tolerates surrounding whitespace only", () => {
    expect(majorToMinor(" 12.34 ")).toBe(1234);
    expect(majorToMinor("12 .34")).toBeNull();
  });
});

describe("money — minorToMajor and the round trip", () => {
  it("formats canonically (1234 → \"12.34\")", () => {
    expect(minorToMajor(1234)).toBe("12.34");
  });

  it("formats zero as \"0.00\"", () => {
    expect(minorToMajor(0)).toBe("0.00");
  });

  it("keeps trailing-zero minor units (1230 → \"12.30\")", () => {
    expect(minorToMajor(1230)).toBe("12.30");
  });

  it("pads sub-10 pence (1205 → \"12.05\", 5 → \"0.05\")", () => {
    expect(minorToMajor(1205)).toBe("12.05");
    expect(minorToMajor(5)).toBe("0.05");
  });

  it("round-trips every canonical form exactly", () => {
    for (const major of ["12.34", "0.00", "12.30", "0.29", "9999999.99"]) {
      expect(minorToMajor(majorToMinor(major)!)).toBe(major);
    }
  });

  it("round-trips minor → major → minor across boundary values", () => {
    for (const minor of [0, 1, 99, 100, 101, 1999, PRICE_MAX_MINOR]) {
      expect(majorToMinor(minorToMajor(minor))).toBe(minor);
    }
  });

  it("throws on a float or negative — a non-integer can never be formatted as money", () => {
    expect(() => minorToMajor(12.34)).toThrow(RangeError);
    expect(() => minorToMajor(-1)).toThrow(RangeError);
    expect(() => minorToMajor(Number.NaN)).toThrow(RangeError);
  });
});

describe("formatPrice", () => {
  it("uses the symbol for known currencies", () => {
    expect(formatPrice(4850, "GBP")).toBe("£48.50");
    expect(formatPrice(4850, "EUR")).toBe("€48.50");
    expect(formatPrice(4850, "USD")).toBe("$48.50");
  });

  it("falls back to an explicit code suffix for unknown currencies", () => {
    expect(formatPrice(4850, "SEK")).toBe("48.50 SEK");
  });
});

describe("priceMajorSchema", () => {
  it("parses a valid amount to integer minor units", () => {
    const parsed = priceMajorSchema.safeParse("48.50");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toBe(4850);
  });

  it.each(["12.345", "-1", "", "free", "£5"])("rejects %j", (input) => {
    expect(priceMajorSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a missing price with a humane message", () => {
    const parsed = priceMajorSchema.safeParse(null);
    expect(parsed.success).toBe(false);
  });
});

describe("currencySchema", () => {
  it("defaults empty to GBP", () => {
    expect(currencySchema.parse("")).toBe("GBP");
  });

  it("normalises lowercase input", () => {
    expect(currencySchema.parse("eur")).toBe("EUR");
  });

  it.each(["GB", "GBPX", "12A", "£££"])("rejects %j", (input) => {
    expect(currencySchema.safeParse(input).success).toBe(false);
  });
});

describe("titleSchema", () => {
  it("trims and accepts a real title", () => {
    expect(titleSchema.parse("  Hollowgrain bowl ")).toBe("Hollowgrain bowl");
  });

  it("rejects empty and whitespace-only", () => {
    expect(titleSchema.safeParse("").success).toBe(false);
    expect(titleSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects over 140 characters", () => {
    expect(titleSchema.safeParse("x".repeat(141)).success).toBe(false);
  });
});

describe("inventory", () => {
  it("accepts the three statuses and nothing else", () => {
    for (const s of ["in-stock", "made-to-order", "sold-out"]) {
      expect(inventoryStatusSchema.safeParse(s).success).toBe(true);
    }
    expect(inventoryStatusSchema.safeParse("in stock").success).toBe(false);
    expect(inventoryStatusSchema.safeParse(null).success).toBe(false);
  });

  it("qty: empty → null, digits → int, junk/negative/decimal rejected", () => {
    expect(inventoryQtySchema.parse("")).toBeNull();
    expect(inventoryQtySchema.parse("12")).toBe(12);
    expect(inventoryQtySchema.parse("0")).toBe(0);
    expect(inventoryQtySchema.safeParse("-1").success).toBe(false);
    expect(inventoryQtySchema.safeParse("2.5").success).toBe(false);
    expect(inventoryQtySchema.safeParse("many").success).toBe(false);
  });
});

describe("badgesSchema", () => {
  it("accepts a subset and dedupes a forged repeat", () => {
    expect(badgesSchema.parse(["limited", "limited"])).toEqual(["limited"]);
    expect(badgesSchema.parse([])).toEqual([]);
  });

  it("rejects an unknown badge", () => {
    expect(badgesSchema.safeParse(["bestseller"]).success).toBe(false);
  });
});

describe("ids", () => {
  it("optionalUuidSchema: empty → null, uuid passes, junk rejected", () => {
    expect(optionalUuidSchema.parse("")).toBeNull();
    expect(
      optionalUuidSchema.parse("6e0d4f9e-8a5f-4a5e-9a3b-2f1c0d9e8b7a"),
    ).toBe("6e0d4f9e-8a5f-4a5e-9a3b-2f1c0d9e8b7a");
    expect(optionalUuidSchema.safeParse("not-an-id").success).toBe(false);
  });

  it("narrationClipIdsSchema: uuids only", () => {
    expect(
      narrationClipIdsSchema.safeParse([
        "6e0d4f9e-8a5f-4a5e-9a3b-2f1c0d9e8b7a",
      ]).success,
    ).toBe(true);
    expect(narrationClipIdsSchema.safeParse(["nope"]).success).toBe(false);
  });
});

describe("productSpecsSchema", () => {
  it("carries the 10 columns the applied product_specs table has", () => {
    expect(SPEC_FIELDS).toHaveLength(10);
  });

  it("stores empties as null and trims real values", () => {
    const parsed = productSpecsSchema.parse(
      Object.fromEntries(SPEC_FIELDS.map((f) => [f, ""])),
    );
    for (const f of SPEC_FIELDS) expect(parsed[f]).toBeNull();

    const withValue = productSpecsSchema.parse({
      ...Object.fromEntries(SPEC_FIELDS.map((f) => [f, ""])),
      dimensions: "  18cm × 12cm ",
    });
    expect(withValue.dimensions).toBe("18cm × 12cm");
  });
});

describe("productWriteSchema — whole-object boundary", () => {
  const valid = {
    title: "Hollowgrain bowl",
    description: "Thrown from a single walnut blank.",
    materials: "walnut, tung oil",
    price: "48.50",
    currency: "",
    inventoryStatus: "in-stock",
    inventoryQty: "3",
    badges: ["one-of-a-kind"],
    model3dId: "",
    specs: Object.fromEntries(SPEC_FIELDS.map((f) => [f, ""])),
  };

  it("parses a full valid form into the exact insert shape", () => {
    const parsed = productWriteSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.price).toBe(4850);
    expect(parsed.data.currency).toBe("GBP");
    expect(parsed.data.inventoryQty).toBe(3);
    expect(parsed.data.model3dId).toBeNull();
  });

  it("rejects when the price is a float-formatted string with 3dp", () => {
    expect(
      productWriteSchema.safeParse({ ...valid, price: "48.505" }).success,
    ).toBe(false);
  });

  it("has no client-set store_id, status, or created_at anywhere in its shape", () => {
    const keys = Object.keys(productWriteSchema.shape);
    expect(keys).not.toContain("storeId");
    expect(keys).not.toContain("store_id");
    expect(keys).not.toContain("createdAt");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("status");
  });
});
