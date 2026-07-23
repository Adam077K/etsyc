/**
 * applyTheme — the single seam where a store-config theme becomes CSS.
 * Both kinds converge on identical variable names (schema §2.2: "The renderer
 * (P4) reads either shape"); blocks never branch on theme.kind.
 */

import type { CSSProperties } from "react";
import type { MotionPreset, Theme } from "@/lib/store-config/types";
import { curatedThemeVars, type ThemeVars } from "./curated";
import { customThemeVars } from "./custom";
import { motionPresets, type MotionPresetSpec } from "./tokens";

export function themeVars(theme: Theme): ThemeVars {
  return theme.kind === "curated" ? curatedThemeVars(theme) : customThemeVars(theme);
}

/** Inline-style form for the world root element. */
export function themeStyle(theme: Theme): CSSProperties {
  // CSS custom properties are not in CSSProperties' key map; the cast is the
  // standard React escape hatch for var injection.
  return themeVars(theme) as CSSProperties;
}

export function motionSpec(preset: MotionPreset): MotionPresetSpec {
  return motionPresets[preset];
}
