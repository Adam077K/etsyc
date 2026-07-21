/**
 * Deterministic WCAG contrast math — the one place gate ① is computed.
 *
 * Shared by the seller editor (live AA read-out while she tunes her hexes)
 * and the buyer-facing world (picking a readable ink for a maker-chosen
 * accent). No model judgement anywhere in here: it is arithmetic, which is
 * exactly why the publish gate can lean on it.
 */

/** True only for `#rgb` / `#rrggbb`. Anything else is not applied as CSS. */
export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The readable type colour to sit ON a maker-chosen background. Used for
 * `--accent-ink` when she picks her own accent, so a CTA never ships with
 * unreadable text just because the hex was hers.
 */
export function readableInk(background: string): string {
  return contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#141414")
    ? "#FFFFFF"
    : "#141414";
}
