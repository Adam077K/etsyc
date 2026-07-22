/**
 * Gate-2 (B3 hero) — the solid text-backdrop scrim, invariant I5 (no waiver).
 *
 * The critic's finding: the caption band measured 3.78:1 on sunbaked-light —
 * and even the "passing" 4.89:1 was measured over a smooth synthetic
 * gradient, the most forgiving backdrop that exists. Tuning to those numbers
 * is tuning to a fiction. The fix makes the number footage-INDEPENDENT: the
 * hero chrome band paints `--scrim-strong` at full opacity under every set
 * line, so over-film text contrast is exactly
 * contrast(--on-media, --scrim-strong), whatever the film shows.
 *
 * This suite locks that pair with REAL headroom (≥7:1, not the 4.5 floor)
 * for every curated palette × mode and for the custom any-hex path's noor
 * fixture, measured on the ACTUAL emitted vars through contrast.ts.
 * resolveThemeColor signals bad input by throwing — a throw is a FAIL here,
 * surfaced explicitly rather than swallowed.
 */

import { describe, expect, it } from "vitest";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { PALETTE_IDS, THEME_MODES } from "@/lib/store-config/schema";
import type { CuratedTheme } from "@/lib/store-config/types";
import { contrastRatio, resolveThemeColor } from "./contrast";
import { curatedThemeVars } from "./curated";
import { customThemeVars } from "./custom";
import { palettes } from "./tokens";

/**
 * The binding over-film floor (design-lead gate-2 ruling, project-wide):
 * type over film measures ≥5.5:1 body / ≥4.0:1 large — a full point over
 * the I5 4.5 floor, because every number this wave was measured against
 * zero-variance synthetic footage.
 */
const OVER_FILM_BODY_FLOOR = 5.5;

/** Our own target on top of the binding floor: real headroom, not the edge. */
const SCRIM_STRONG_TARGET = 7;

function measured(vars: Record<string, string>): number {
  const onMediaExpr = vars["--on-media"] ?? "";
  const scrimStrongExpr = vars["--scrim-strong"] ?? "";
  for (const expr of [onMediaExpr, scrimStrongExpr]) {
    // a throw (or a missing var) is a FAIL with the expression named, never a skip
    expect(expr, "theme path must emit --on-media and --scrim-strong").not.toBe("");
    expect(() => resolveThemeColor(expr), `unresolvable theme color: ${expr}`).not.toThrow();
  }
  return contrastRatio(resolveThemeColor(onMediaExpr), resolveThemeColor(scrimStrongExpr));
}

describe("--scrim-strong: deterministic over-film text backdrop (gate-2 / I5)", () => {
  const combos = PALETTE_IDS.flatMap((paletteId) =>
    THEME_MODES.map((mode) => [paletteId, mode] as const),
  );

  it.each(combos)(
    "%s · %s — on-media on scrim-strong holds ≥7:1 (2× the measured 3.78 failure's floor)",
    (paletteId, mode) => {
      const theme: CuratedTheme = {
        kind: "curated",
        paletteId,
        mode,
        fontPairingId: palettes[paletteId].boundPairing,
        motionPreset: "fluid",
        radiusIdentity: "soft",
        density: "standard",
      };
      const ratio = measured(curatedThemeVars(theme) as Record<string, string>);
      expect(ratio).toBeGreaterThanOrEqual(SCRIM_STRONG_TARGET);
      expect(ratio).toBeGreaterThanOrEqual(OVER_FILM_BODY_FLOOR); // the binding floor, stated
    },
  );

  it("custom any-hex path (noor fixture) — same contract through customThemeVars", () => {
    const theme = customStore.theme;
    if (theme.kind !== "custom") throw new Error("noor fixture must be custom-themed");
    const ratio = measured(customThemeVars(theme) as Record<string, string>);
    expect(ratio).toBeGreaterThanOrEqual(SCRIM_STRONG_TARGET);
    expect(ratio).toBeGreaterThanOrEqual(OVER_FILM_BODY_FLOOR);
  });

  it("custom LIGHT mode (ferreirapress seed roles) — the onMedia=surface branch, live on a seed world but previously never contrast-verified", () => {
    // fail-safe-hunt finding: customThemeVars picks on-media per mode
    // (dark→ink, light→surface). Every fixture is dark-mode custom, so the
    // LIGHT branch shipped exercised only by the ferreirapress seed world —
    // rendered live, asserted nowhere. Pinned here with that seed's exact
    // roles so the branch has an output-level test, not just line coverage.
    const theme = customStore.theme;
    if (theme.kind !== "custom") throw new Error("noor fixture must be custom-themed");
    const light = {
      ...theme,
      customPalette: {
        mode: "light" as const,
        roles: {
          bg: "#f7f2e9",
          surface: "#fffdf7",
          ink: "#1c1917",
          inkMuted: "#57514a",
          accent: "#b5310c",
          accentInk: "#fff7ef",
          border: "#d8cfc0",
        },
      },
    };
    const vars = customThemeVars(light) as Record<string, string>;
    // light mode must select the light-reading role (surface), not ink
    expect(vars["--on-media"]).toBe("#fffdf7");
    const ratio = measured(vars);
    expect(ratio).toBeGreaterThanOrEqual(SCRIM_STRONG_TARGET);
    expect(ratio).toBeGreaterThanOrEqual(OVER_FILM_BODY_FLOOR);
  });

  it("sena fixture (the capture that failed at 3.78:1) — curated path emits the pair", () => {
    const theme = senaStore.theme;
    if (theme.kind !== "curated") throw new Error("sena fixture must be curated-themed");
    const ratio = measured(curatedThemeVars(theme) as Record<string, string>);
    expect(ratio).toBeGreaterThanOrEqual(SCRIM_STRONG_TARGET);
    expect(ratio).toBeGreaterThanOrEqual(OVER_FILM_BODY_FLOOR);
  });
});
