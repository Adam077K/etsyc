/**
 * Deterministic WCAG contrast math for the token layer — the audit vocabulary
 * behind the curated AA guarantee (design-system v2 §2 AA-levels note) and a
 * building block for the P9 custom-shop AA gate.
 *
 * Also evaluates the two `color-mix()` forms the theme layer actually emits
 * (srgb/oklab mixes toward black — CTA pair + scrim), so audits measure the
 * REAL emitted var values instead of re-deriving them by hand.
 */

export type Rgb = readonly [number, number, number];

/** #rgb or #rrggbb → 0–1 srgb components. Throws on anything else. */
export function hexToRgb(hex: string): Rgb {
  const body = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())?.[1];
  if (body === undefined) throw new Error(`not a hex color: "${hex}"`);
  const s = body.length === 3 ? body.replace(/./g, "$&$&") : body;
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ];
}

function channelToHex(c: number): string {
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (c: number): number => {
  const clamped = Math.min(1, Math.max(0, c));
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
};

function linearRgb(hex: string): Rgb {
  const [r, g, b] = hexToRgb(hex);
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/** WCAG 2.x relative luminance of an srgb hex color. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = linearRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio (1–21) between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** AA thresholds (§2 AA-levels note): body 4.5 · large-text/UI-component 3. */
export const AA_BODY = 4.5;
export const AA_LARGE_TEXT = 3;

/** `color-mix(in srgb, <hex> p%, black)` — gamma-space componentwise scale. */
export function mixSrgbTowardBlack(hex: string, keepPct: number): string {
  const p = keepPct / 100;
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * p, g * p, b * p]);
}

/**
 * `color-mix(in oklab, <hex> p%, black)` — CSS interpolates Oklab components
 * linearly; Oklab is a linear map of cube-rooted LMS, so interpolating in
 * LMS′ space is exactly equivalent (and black is 0 there).
 */
export function mixOklabTowardBlack(hex: string, keepPct: number): string {
  const p = keepPct / 100;
  const [r, g, b] = linearRgb(hex);
  const l = (p * Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)) ** 3;
  const m = (p * Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)) ** 3;
  const s = (p * Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)) ** 3;
  return rgbToHex([
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]);
}

const COLOR_MIX_BLACK =
  /^color-mix\(in (srgb|oklab), (#[0-9a-fA-F]{3,6}) (\d+(?:\.\d+)?)%, black\)$/;

/**
 * Resolve a theme-layer color expression to hex: raw hex passes through;
 * the emitted `color-mix(in srgb|oklab, <hex> p%, black)` forms are evaluated.
 */
export function resolveThemeColor(expr: string): string {
  const trimmed = expr.trim();
  if (trimmed.startsWith("#")) return rgbToHex(hexToRgb(trimmed));
  const match = COLOR_MIX_BLACK.exec(trimmed);
  const space = match?.[1];
  const hex = match?.[2];
  const pct = match?.[3];
  if (space === undefined || hex === undefined || pct === undefined) {
    throw new Error(`unsupported color expression: "${expr}"`);
  }
  return space === "srgb"
    ? mixSrgbTowardBlack(hex, Number(pct))
    : mixOklabTowardBlack(hex, Number(pct));
}
