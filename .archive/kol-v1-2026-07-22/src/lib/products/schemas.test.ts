import { describe, expect, it } from "vitest";

import { formatPrice as formatPriceIntl } from "@/lib/utils";
import {
  badgesSchema,
  CURRENCIES,
  CURRENCY_CODES,
  currencyExponent,
  currencySchema,
  formatPrice,
  inventoryQtySchema,
  inventoryStatusSchema,
  majorToMinor,
  minorToMajor,
  narrationClipIdsSchema,
  optionalUuidSchema,
  PRICE_MAX_MINOR,
  productSpecsSchema,
  productWriteFieldsSchema,
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

describe("money — per-currency exponent (adversary F4)", () => {
  it("JPY: a seller typing 4800 stores 4800 — NOT 480000 (the mis-store F4 exists to prevent)", () => {
    expect(majorToMinor("4800", 0)).toBe(4800);
  });

  it("JPY: decimal input is a hard reject, never a rounding", () => {
    expect(majorToMinor("48.5", 0)).toBeNull();
    expect(majorToMinor("48.00", 0)).toBeNull();
    expect(majorToMinor("48.", 0)).toBeNull();
  });

  it("KWD: three decimal places convert exactly (12.345 → 12345)", () => {
    expect(majorToMinor("12.345", 3)).toBe(12345);
    expect(majorToMinor("12.3", 3)).toBe(12300);
    expect(majorToMinor("12.3456", 3)).toBeNull();
  });

  it("three-decimal inputs respect the int4 cap — 7-digit units would overflow without it", () => {
    // 9,999,999.999 KWD = 9,999,999,999 minor units > int4 — must reject
    expect(majorToMinor("9999999.999", 3)).toBeNull();
    // the largest representable three-decimal price is exactly the cap
    expect(majorToMinor("999999.999", 3)).toBe(PRICE_MAX_MINOR);
  });

  it("minorToMajor honours the exponent (4800@0 → \"4800\", 12345@3 → \"12.345\", 5@3 → \"0.005\")", () => {
    expect(minorToMajor(4800, 0)).toBe("4800");
    expect(minorToMajor(12345, 3)).toBe("12.345");
    expect(minorToMajor(5, 3)).toBe("0.005");
  });

  it("currencyExponent: supported codes get their ISO exponent; unknown legacy codes fall back to 2", () => {
    expect(currencyExponent("JPY")).toBe(0);
    expect(currencyExponent("KWD")).toBe(3);
    expect(currencyExponent("GBP")).toBe(2);
    expect(currencyExponent("SEK")).toBe(2);
  });
});

describe("money — the full boundary round-trip, every supported currency", () => {
  /** Seller-typed inputs per exponent class — what the buyer must see back. */
  const TYPED: Record<0 | 2 | 3, string[]> = {
    0: ["4800", "1", "9999999"],
    2: ["48.50", "0.29", "19.99", "48"],
    3: ["12.345", "0.005", "999999.999"],
  };

  it.each(CURRENCY_CODES)("%s: typed → stored integer → displayed, exactly", (code) => {
    const exponent = CURRENCIES[code].exponent;
    for (const typed of TYPED[exponent]) {
      const stored = majorToMinor(typed, exponent);
      expect(stored, `${code} ${typed} must store`).not.toBeNull();
      // storage is an integer, and the seller's exact amount comes back
      expect(Number.isSafeInteger(stored)).toBe(true);
      const canonical =
        exponent === 0 || typed.includes(".") ? typed : `${typed}.${"0".repeat(exponent)}`;
      expect(minorToMajor(stored!, exponent)).toBe(canonical);
      // seller-side display carries the exact canonical amount
      expect(formatPrice(stored!, code)).toContain(canonical);
    }
  });

  it("pins each declared exponent to Intl/CLDR — the table cannot drift from what the buyer path renders", () => {
    for (const code of CURRENCY_CODES) {
      const digits = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: code,
      }).resolvedOptions().maximumFractionDigits;
      expect(digits, `${code} exponent drift`).toBe(CURRENCIES[code].exponent);
    }
  });

  it("buyer display (lib/utils, Intl path): ¥4800 renders as 4,800 — never 48.00", () => {
    const jpy = formatPriceIntl(4800, "JPY");
    expect(jpy).toContain("4,800");
    expect(jpy).not.toContain("48.00");
    expect(jpy).not.toContain(".");
  });

  it("buyer display: 12.345 KWD renders three decimals — never 123.45", () => {
    const kwd = formatPriceIntl(12345, "KWD");
    expect(kwd).toContain("12.345");
    expect(kwd).not.toContain("123.45");
  });

  it("buyer display: 2dp currencies are unchanged (£48.50)", () => {
    expect(formatPriceIntl(4850, "GBP")).toBe("£48.50");
  });
});

describe("currencySchema", () => {
  it("defaults empty to GBP", () => {
    expect(currencySchema.parse("")).toBe("GBP");
  });

  it("normalises lowercase input", () => {
    expect(currencySchema.parse("jpy")).toBe("JPY");
  });

  it("accepts every supported code", () => {
    for (const code of CURRENCY_CODES) {
      expect(currencySchema.parse(code)).toBe(code);
    }
  });

  it.each(["GB", "GBPX", "12A", "£££"])("rejects malformed %j", (input) => {
    expect(currencySchema.safeParse(input).success).toBe(false);
  });

  it("rejects a well-formed but UNSUPPORTED code loudly — better than silently mis-storing its integer (F4)", () => {
    for (const code of ["SEK", "TRY", "XXX"]) {
      const parsed = currencySchema.safeParse(code);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("supported");
      }
    }
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

  it("cross-field (F4): the price's accepted precision follows the CURRENCY", () => {
    // JPY — whole amounts store verbatim…
    const jpy = productWriteSchema.safeParse({ ...valid, currency: "JPY", price: "4800" });
    expect(jpy.success).toBe(true);
    if (jpy.success) {
      expect(jpy.data.price).toBe(4800);
      expect(jpy.data.currency).toBe("JPY");
    }
    // …and 2dp input is a field error on price, naming the rule
    const jpyDecimal = productWriteSchema.safeParse({ ...valid, currency: "JPY", price: "48.50" });
    expect(jpyDecimal.success).toBe(false);
    if (!jpyDecimal.success) {
      const issue = jpyDecimal.error.issues.find((i) => i.path[0] === "price");
      expect(issue?.message).toContain("whole amounts");
    }
    // KWD — three decimals store exactly
    const kwd = productWriteSchema.safeParse({ ...valid, currency: "KWD", price: "12.345" });
    expect(kwd.success).toBe(true);
    if (kwd.success) expect(kwd.data.price).toBe(12345);
  });

  it("an unsupported currency is a currency-field error — the price is never converted on a guessed exponent", () => {
    const parsed = productWriteSchema.safeParse({ ...valid, currency: "TRY" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path[0] === "currency")).toBe(true);
    }
  });

  it("has no client-set store_id, status, or created_at anywhere in its shape", () => {
    const keys = Object.keys(productWriteFieldsSchema.shape);
    expect(keys).not.toContain("storeId");
    expect(keys).not.toContain("store_id");
    expect(keys).not.toContain("createdAt");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("status");
  });
});
