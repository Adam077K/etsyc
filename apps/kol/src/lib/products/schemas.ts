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
// Money — integer minor units, exact string math, per-currency exponent
// ---------------------------------------------------------------------------

/**
 * The supported currency set, each with its ISO-4217 minor-unit exponent
 * (adversary F4). The stored integer's MEANING depends on the exponent: a
 * seller typing ¥4800 must store 4800, not 480000 — get this wrong and the
 * stored number silently disagrees with both the seller and the buyer.
 * Restricting to a curated table means an unsupported currency fails loudly
 * at authoring instead of mis-storing; adding support = adding a row here
 * (the round-trip suite iterates this table, so a new row is auto-covered,
 * and a drift test pins each exponent against Intl/CLDR).
 *
 * Membership: GBP/EUR/USD were already in use; NGN and JOD are the fixture
 * makers' home currencies (Lagos; Amman); CAD/AUD/CHF/AED are common maker
 * markets; JPY/KRW and JOD/KWD/BHD/OMR bring the zero- and three-decimal
 * classes in as classes, not one-off patches.
 */
export const CURRENCIES = {
  GBP: { exponent: 2, symbol: "£" },
  EUR: { exponent: 2, symbol: "€" },
  USD: { exponent: 2, symbol: "$" },
  CAD: { exponent: 2 },
  AUD: { exponent: 2 },
  CHF: { exponent: 2 },
  NGN: { exponent: 2, symbol: "₦" },
  AED: { exponent: 2 },
  JPY: { exponent: 0, symbol: "¥" },
  KRW: { exponent: 0, symbol: "₩" },
  JOD: { exponent: 3 },
  KWD: { exponent: 3 },
  BHD: { exponent: 3 },
  OMR: { exponent: 3 },
} as const satisfies Record<string, { exponent: 0 | 2 | 3; symbol?: string }>;

export type CurrencyCode = keyof typeof CURRENCIES;
export type CurrencyExponent = (typeof CURRENCIES)[CurrencyCode]["exponent"];

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

/**
 * Exponent for a stored currency code. Unknown codes (legacy rows written
 * before the F4 restriction — none observed in practice) fall back to 2,
 * which is what the display path always assumed for them.
 */
export function currencyExponent(currency: string): CurrencyExponent {
  return (CURRENCIES as Record<string, { exponent: CurrencyExponent }>)[currency]?.exponent ?? 2;
}

/** 999,999,999 minor units — comfortably inside int4 for EVERY exponent. */
export const PRICE_MAX_MINOR = 999_999_999;

/**
 * Major-unit input → integer minor units at the currency's exponent.
 * Exponent 2: "48", "48.5", "48.50"; exponent 0: whole amounts only
 * ("4800" — a decimal point is a hard reject, never a rounding);
 * exponent 3: up to "12.345". Rejects signs, grouping, exponent notation,
 * excess decimal places, and anything over PRICE_MAX_MINOR (the int4
 * guard — a 7-digit three-decimal amount would overflow int4 without it).
 * Never parses the input as a float — units and fraction are extracted as
 * separate integers.
 */
export function majorToMinor(input: string, exponent: CurrencyExponent = 2): number | null {
  const pattern =
    exponent === 0 ? /^(\d{1,7})$/ : new RegExp(`^(\\d{1,7})(?:\\.(\\d{1,${exponent}}))?$`);
  const match = pattern.exec(input.trim());
  if (!match) return null;
  const units = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(exponent, "0") || "0");
  const minor = units * 10 ** exponent + fraction;
  return minor > PRICE_MAX_MINOR ? null : minor;
}

/**
 * Integer minor units → canonical major string at the currency's exponent
 * (1234 → "12.34" at 2; 4800 → "4800" at 0; 12345 → "12.345" at 3).
 */
export function minorToMajor(minor: number, exponent: CurrencyExponent = 2): string {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new RangeError(`minorToMajor expects a non-negative integer, got ${minor}`);
  }
  if (exponent === 0) return String(minor);
  const scale = 10 ** exponent;
  const units = Math.trunc(minor / scale);
  const fraction = minor % scale;
  return `${units}.${String(fraction).padStart(exponent, "0")}`;
}

/**
 * Display formatting for a stored price — pure string concatenation over
 * the exponent-aware minorToMajor, so no float ever enters the render path.
 * Unknown currencies fall back to "12.34 SEK" (exponent 2, explicit code)
 * rather than guessing a symbol.
 */
export function formatPrice(minor: number, currency: string): string {
  const major = minorToMajor(minor, currencyExponent(currency));
  const symbol = (CURRENCIES as Record<string, { symbol?: string }>)[currency]?.symbol;
  return symbol ? `${symbol}${major}` : `${major} ${currency}`;
}

/**
 * char(3), default GBP; lowercase is normalised, never rejected. Membership
 * is the F4 rule: only currencies whose exponent this module knows may be
 * stored — an unsupported code is a loud authoring-time rejection, never a
 * silently mis-stored integer.
 */
export const currencySchema = z
  .string()
  .trim()
  .transform((v) => (v === "" ? "GBP" : v.toUpperCase()))
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error: "Currency is a 3-letter ISO code (GBP, EUR, USD…).",
    }),
  )
  .pipe(
    z.custom<CurrencyCode>((v) => typeof v === "string" && v in CURRENCIES, {
      error: `We can't take payments in that currency yet — supported: ${Object.keys(CURRENCIES).join(", ")}.`,
    }),
  );

/** The exponent-aware "price looks off" copy, per currency class. */
function priceFormatMessage(currency: CurrencyCode): string {
  const exponent = CURRENCIES[currency].exponent;
  if (exponent === 0) {
    return `Price looks off — ${currency} takes whole amounts only, like 4800.`;
  }
  if (exponent === 3) {
    return "Price looks off — use a plain amount with up to three decimal places, like 12.345.";
  }
  return "Price looks off — use a plain amount like 48 or 48.50.";
}

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

/**
 * The field shapes, price still a raw string: how many decimal places a
 * price may carry depends on the CURRENCY (F4), so major→minor conversion
 * is cross-field and happens in the object-level transform below — after
 * both fields parsed, still inside this module (the single conversion
 * point). Exported so shape-level tests can introspect the key set.
 */
export const productWriteFieldsSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  materials: materialsSchema,
  price: z.string({ error: "Add a price." }),
  currency: currencySchema,
  inventoryStatus: inventoryStatusSchema,
  inventoryQty: inventoryQtySchema,
  badges: badgesSchema,
  model3dId: optionalUuidSchema,
  specs: productSpecsSchema,
});

export const productWriteSchema = productWriteFieldsSchema.transform((data, ctx) => {
  const minor = majorToMinor(data.price, CURRENCIES[data.currency].exponent);
  if (minor === null) {
    ctx.addIssue({ code: "custom", path: ["price"], message: priceFormatMessage(data.currency) });
    return z.NEVER;
  }
  return { ...data, price: minor };
});

export type ProductWriteInput = z.infer<typeof productWriteSchema>;

/** Product/spec row lookups are id-keyed — the only valid argument is a uuid. */
export const productIdSchema = z.uuid({ error: "not a product id" });
