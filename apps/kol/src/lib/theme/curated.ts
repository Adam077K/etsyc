/**
 * Curated theme path — registry lookup by palette id + mode (D9 layer 1).
 * Emits the shared per-world CSS variable set that every block consumes.
 */

import type { CuratedTheme } from "@/lib/store-config/types";
import {
  densitySectionGap,
  fontPairings,
  getPaletteTokens,
  palettes,
  radiusIdentities,
} from "./tokens";

export type ThemeVars = Record<`--${string}`, string>;

export function curatedThemeVars(theme: CuratedTheme): ThemeVars {
  const palette = getPaletteTokens(theme.paletteId, theme.mode);
  const blocks = palettes[theme.paletteId].blocks;
  const pairing = fontPairings[theme.fontPairingId];
  const radius = radiusIdentities[theme.radiusIdentity];

  return {
    // palette contract (design-system §2)
    "--ground": palette.ground,
    "--surface": palette.surface,
    "--ink": palette.ink,
    "--muted": palette.muted,
    "--line": palette.line,
    "--accent": palette.accent,
    "--accent-2": palette.accent2,
    // two-accent palettes leave --accent-3 unset in the doc; falling back to
    // --accent keeps any accent-3 utility harmless instead of transparent.
    "--accent-3": palette.accent3 ?? palette.accent,
    "--accent-ink": palette.onMedia,
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
    // pairing (§3)
    "--font-display": pairing.display,
    "--font-text": pairing.text,
    "--font-mono": pairing.mono,
    "--weight-display": String(pairing.displayWeight),
    "--weight-text": String(pairing.textWeight),
    // radius identity (§1.3)
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    // density (§1.2)
    "--space-section": densitySectionGap[theme.density],
  };
}
