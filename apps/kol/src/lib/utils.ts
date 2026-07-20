import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Minor units → display price with tabular figures expected downstream.
 * Locale is a parameter (buyer locale arrives with P5 i18n); the en-GB
 * default keeps SSR/CSR output identical until then.
 */
export function formatPrice(amount: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount / 100);
}
