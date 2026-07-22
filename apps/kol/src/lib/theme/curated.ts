/**
 * Curated theme path — registry lookup by palette id + mode (D9 layer 1).
 * Emits the shared per-world CSS variable set that every block consumes.
 */

import type { CuratedTheme } from "@/lib/store-config/types";
import {
  densitySectionGap,
  fontPairings,
  getPaletteTokens,
  nameplateRegisters,
  palettes,
  radiusIdentities,
} from "./tokens";

export type ThemeVars = Record<`--${string}`, string>;

/**
 * The accent-CTA pair, AA-measured per palette+mode (WCAG body 4.5:1):
 * LIGHT modes set on-media cream on the accent darkened 5% (srgb) —
 * measured 4.72–8.7:1. DARK modes set the near-black ground on the raw
 * accent — 5.08–5.97:1 — except market-plum dark, whose midtone accent
 * needs cream on a 10% darken (4.81:1). Ratios computed with the WCAG
 * relative-luminance formula against these exact srgb mixes; QA re-measures
 * at the gate. `--accent` itself stays the untouched brand hue for
 * non-text uses (waveform, stars, focus ring — UI-component 3:1 scope).
 */
function accentCtaPair(
  paletteId: CuratedTheme["paletteId"],
  mode: CuratedTheme["mode"],
  palette: ReturnType<typeof getPaletteTokens>,
): { bg: string; ink: string } {
  if (mode === "light") {
    return { bg: `color-mix(in srgb, ${palette.accent} 95%, black)`, ink: palette.onMedia };
  }
  if (paletteId === "market-plum") {
    return { bg: `color-mix(in srgb, ${palette.accent} 90%, black)`, ink: palette.onMedia };
  }
  return { bg: palette.accent, ink: palette.ground };
}

export function curatedThemeVars(theme: CuratedTheme): ThemeVars {
  const palette = getPaletteTokens(theme.paletteId, theme.mode);
  const blocks = palettes[theme.paletteId].blocks;
  const pairing = fontPairings[theme.fontPairingId];
  const radius = radiusIdentities[theme.radiusIdentity];
  const cta = accentCtaPair(theme.paletteId, theme.mode, palette);

  return {
    // palette contract (design-system §2)
    "--ground": palette.ground,
    "--surface": palette.surface,
    "--ink": palette.ink,
    "--muted": palette.muted,
    "--line": palette.line,
    "--accent": palette.accent,
    "--accent-2": palette.accent2,
    // the high-emphasis CTA pair (AA-measured, see accentCtaPair)
    "--accent-cta": cta.bg,
    "--accent-ink": cta.ink,
    "--on-media": palette.onMedia,
    // block-ground set (P2-a)
    "--block-a": blocks.blockA,
    "--on-block-a": blocks.onBlockA,
    "--block-b": blocks.blockB,
    "--on-block-b": blocks.onBlockB,
    "--block-c": blocks.blockC,
    "--on-block-c": blocks.onBlockC,
    // over-media scrim (§1.1) — ground-tinted bottom-up gradient
    "--scrim": `linear-gradient(to top, color-mix(in oklab, ${palette.ground} 45%, black) 0%, transparent 55%)`,
    // solid text-backdrop scrim (gate-2 / invariant I5): the hero chrome band
    // paints THIS at full opacity under every set line, so over-film text
    // contrast is contrast(on-media, scrim-strong) — deterministic on any
    // footage. keep=40% holds ≥9:1 vs on-media on the lightest curated
    // ground (locked in scrim-strong.test.ts — 2× the AA body floor, real
    // headroom, not tuned to the 4.5 fiction).
    "--scrim-strong": `color-mix(in oklab, ${palette.ground} 40%, black)`,
    // pairing (§3)
    "--font-display": pairing.display,
    "--font-text": pairing.text,
    "--font-mono": pairing.mono,
    "--weight-display": String(pairing.displayWeight),
    "--weight-text": String(pairing.textWeight),
    // nameplate register (§2.1a / R1) — resolved from the pairing's
    // strokeClass; the renderer reads these three and never a font name
    "--nameplate-size": nameplateRegisters[pairing.strokeClass].size,
    "--nameplate-weight": nameplateRegisters[pairing.strokeClass].weight,
    "--nameplate-tracking": nameplateRegisters[pairing.strokeClass].tracking,
    // radius identity (§1.3)
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    // density (§1.2)
    "--space-section": densitySectionGap[theme.density],
  };
}
