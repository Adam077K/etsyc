/**
 * §2.1a / R1 — the nameplate register is stroke-contrast-aware, not a number.
 *
 * Optical mass is size × weight × stroke contrast: at the same 700,
 * Fraunces reads as an airy nameplate while a uniform-stroke grotesk reads
 * as a logotype stamped on the maker's face. So the register resolves from
 * the pairing's `strokeClass` in the THEME layer, and the renderer only
 * ever reads --nameplate-size/-weight/-tracking (hero-video.test.tsx pins
 * the renderer side). Two axes, not one: statement larger-and-lighter,
 * nameplate smaller-and-heavier — a flat 500–600 was explicitly rejected
 * as under-correcting on heavy uniform faces.
 */

import { describe, expect, it } from "vitest";
import { customStore } from "@/lib/store-config/fixtures/custom";
import type { CuratedTheme } from "@/lib/store-config/types";
import { curatedThemeVars } from "./curated";
import { customThemeVars } from "./custom";
import { fontPairings, palettes } from "./tokens";

const MODULATED = {
  "--nameplate-size": "var(--fs-display-hero)",
  "--nameplate-weight": "700",
  "--nameplate-tracking": "-0.03em",
};
const UNIFORM = {
  "--nameplate-size": "var(--fs-display)",
  "--nameplate-weight": "600",
  "--nameplate-tracking": "-0.025em",
};

function curatedVarsFor(fontPairingId: CuratedTheme["fontPairingId"]) {
  const theme: CuratedTheme = {
    kind: "curated",
    paletteId: "sunbaked",
    mode: "light",
    fontPairingId,
    motionPreset: "fluid",
    radiusIdentity: "soft",
    density: "standard",
  };
  return curatedThemeVars(theme);
}

describe("nameplate register — §2.1a strokeClass → emitted custom properties", () => {
  it("warm-serif (Fraunces, the one modulated face) → display-hero / 700 / -0.03em", () => {
    expect(fontPairings["warm-serif"].strokeClass).toBe("modulated");
    expect(curatedVarsFor("warm-serif")).toMatchObject(MODULATED);
  });

  it.each(["statement-grotesk", "modern-mono-grotesk", "character-maximal"] as const)(
    "%s (uniform stroke) → display / 600 / -0.025em — smaller AND heavier-relative, two axes",
    (pairingId) => {
      expect(fontPairings[pairingId].strokeClass).toBe("uniform");
      expect(curatedVarsFor(pairingId)).toMatchObject(UNIFORM);
    },
  );

  it('kind:"custom" defaults to uniform — the lower-optical-mass fail-safe for any face', () => {
    const theme = customStore.theme;
    if (theme.kind !== "custom") throw new Error("noor fixture must be custom-themed");
    expect(customThemeVars(theme)).toMatchObject(UNIFORM);
  });

  it("every pairing declares a strokeClass — a new pairing cannot ship without one", () => {
    for (const pairing of Object.values(fontPairings)) {
      expect(["modulated", "uniform"]).toContain(pairing.strokeClass);
    }
    // and every curated palette's bound pairing resolves to emitted vars
    for (const palette of Object.values(palettes)) {
      const vars = curatedVarsFor(palette.boundPairing);
      expect(vars["--nameplate-size"]).toBeTruthy();
      expect(vars["--nameplate-weight"]).toBeTruthy();
      expect(vars["--nameplate-tracking"]).toBeTruthy();
    }
  });
});
