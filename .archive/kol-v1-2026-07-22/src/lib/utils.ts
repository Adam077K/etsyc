import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Minor units → display price with tabular figures expected downstream.
 * Locale is a parameter (buyer locale arrives with P5 i18n); the en-GB
 * default keeps SSR/CSR output identical until then.
 *
 * The divisor is the CURRENCY's minor-unit exponent, taken from Intl/CLDR
 * itself (F4): a flat /100 rendered ¥4800 as "¥48.00" and 12.345 KWD as
 * "KWD123.45". Buyer-side currencies come from stored world configs (any
 * well-formed ISO code — the P3 contract), so deriving digits from Intl
 * covers all of them, and a drift test pins the seller-side CURRENCIES
 * table to the same digits. Display-only float division: minor units are
 * integers ≤ 1e9 (exact in float64) and Intl rounds to the currency's own
 * digits, so the rendered string always mirrors storage exactly.
 */
export function formatPrice(amount: number, currency: string, locale = "en-GB"): string {
  const format = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(amount / 10 ** digits);
}
