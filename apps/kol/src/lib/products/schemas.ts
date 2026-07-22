import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";
import { PRODUCT_BADGES } from "@/lib/store-config/schema";

/**
 * Zod boundary schemas for product management (spec S8). Every value that
 * arrives from the product form passes through one of these before it
 * touches Supabase.
 *
 * THE PRICE CONTRACT (Part B S8/B7): price lives in `products` and nowhere
 * else — `create_order` reads `price_amount`/`currency` server-side and has
 * no price parameter, so what this module stores is what checkout charges.
 * Money is an INTEGER in minor units + a char(3) currency, default GBP.
 * The major→minor conversion below is the single place a human-friendly
 * amount becomes a stored integer, and it is pure string math — no floats,
 * anywhere, ever.
 *
 * Deliberately absent from the write schema: store_id (derived server-side
 * from ownership, never client-set), created_at (server-enforced by the
 * MIG-TS trigger), and any price field on order payloads (structurally
 * unreachable — see create_order).
 */

// ---------------------------------------------------------------------------
// Money — integer minor units, exact string math
// ---------------------------------------------------------------------------

/** £9,999,999.99 — comfortably inside int4; matches the 7-digit input cap. */
export const PRICE_MAX_MINOR = 999_999_999;

/**
 * Major-unit input → integer minor units. Accepts "48", "48.5", "48.50";
 * rejects signs, grouping, exponents, >2 decimal places, and anything
 * non-numeric. Never parses the input as a float — units and pence are
 * extracted as separate integers.
 */
export function majorToMinor(input: string): number | null {
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const units = Number(match[1]);
  const pence = Number((match[2] ?? "").padEnd(2, "0"));
  return units * 100 + pence;
}

/** Integer minor units → canonical 2-decimal major string ("1234" → "12.34"). */
export function minorToMajor(minor: number): string {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new RangeError(`minorToMajor expects a non-negative integer, got ${minor}`);
  }
  const units = Math.trunc(minor / 100);
  const pence = minor % 100;
  return `${units}.${String(pence).padStart(2, "0")}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

/**
 * Display formatting for a stored price — pure string concatenation over
 * minorToMajor, so no float ever enters the render path. Unknown currencies
 * fall back to "12.34 SEK" rather than guessing a symbol.
 */
export function formatPrice(minor: number, currency: string): string {
  const major = minorToMajor(minor);
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${major}` : `${major} ${currency}`;
}

export const priceMajorSchema = z
  .string({ error: "Add a price." })
  .transform((v, ctx) => {
    const minor = majorToMinor(v);
    if (minor === null) {
      ctx.addIssue({
        code: "custom",
        message: "Price looks off — use a plain amount like 48 or 48.50.",
      });
      return z.NEVER;
    }
    return minor;
  });

/** char(3), default GBP. Lowercase input is normalised, never rejected. */
export const currencySchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? "GBP" : v.toUpperCase()))
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error: "Currency is a 3-letter ISO code (GBP, EUR, USD…).",
    }),
  );

// ---------------------------------------------------------------------------
// Catalog fields
// ---------------------------------------------------------------------------

export const titleSchema = z
  .string({ error: "Give the piece a title." })
  .trim()
  .min(1, { error: "Give the piece a title — it's how buyers will meet it." })
  .max(140, { error: "Keep the title under 140 characters." });

/** Empty optional copy is stored as null, not "" — absence, not a blank string. */
const optionalCopy = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `Keep ${label} under ${max} characters.` })
    .transform((v) => (v === "" ? null : v));

export const descriptionSchema = optionalCopy(4000, "the description");
export const materialsSchema = optionalCopy(500, "materials");

export const inventoryStatusSchema = z.enum(
  Constants.public.Enums.inventory_status,
  { error: "Pick how this piece is available." },
);

export const inventoryQtySchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    if (!/^\d{1,6}$/.test(v)) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity is a whole number — or leave it blank.",
      });
      return z.NEVER;
    }
    return Number(v);
  });

/** Duplicate badge selections collapse silently — a checkbox can't repeat, but a forged payload can. */
export const badgesSchema = z
  .array(
    z.enum(PRODUCT_BADGES, {
      error: "Badges are one-of-a-kind, made-to-order, or limited.",
    }),
  )
  .max(PRODUCT_BADGES.length)
  .transform((arr) => [...new Set(arr)]);

/** "" → null; anything else must be a uuid. Used for model3d_id. */
export const optionalUuidSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const parsed = z.uuid().safeParse(v);
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", message: "That doesn't look like an id." });
      return z.NEVER;
    }
    return parsed.data;
  });

/**
 * Narration-clip ids (read-side shape). The product↔clip link is canonically
 * `video_profiles.product_links` and is WRITTEN from the clip side by P7's
 * tag editor (/seller/clips/[videoId]) — S8 renders the linkage and deep-links
 * to it, never writes it (closed write list: products, media, product_specs).
 */
export const narrationClipIdsSchema = z
  .array(z.uuid({ error: "not a clip id" }))
  .max(50);

// ---------------------------------------------------------------------------
// product_specs — P14 "Exactly What to Expect" capture (enforcement is P14's
// Wave-4 unit; S8 captures the fields the applied table carries)
// ---------------------------------------------------------------------------

export const SPEC_FIELDS = [
  "dimensions",
  "materials",
  "texture",
  "handmade_variation",
  "production_time",
  "shipping",
  "care",
  "repairs",
  "returns",
  "customization_limits",
] as const;

export type SpecField = (typeof SPEC_FIELDS)[number];

const specText = z
  .string()
  .trim()
  .max(2000, { error: "Keep this under 2000 characters." })
  .transform((v) => (v === "" ? null : v));

export const productSpecsSchema = z.object(
  Object.fromEntries(SPEC_FIELDS.map((f) => [f, specText])) as Record<
    SpecField,
    typeof specText
  >,
);

// ---------------------------------------------------------------------------
// The write contract
// ---------------------------------------------------------------------------

export const productWriteSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  materials: materialsSchema,
  price: priceMajorSchema,
  currency: currencySchema,
  inventoryStatus: inventoryStatusSchema,
  inventoryQty: inventoryQtySchema,
  badges: badgesSchema,
  model3dId: optionalUuidSchema,
  specs: productSpecsSchema,
});

export type ProductWriteInput = z.infer<typeof productWriteSchema>;

/** Product/spec row lookups are id-keyed — the only valid argument is a uuid. */
export const productIdSchema = z.uuid({ error: "not a product id" });
