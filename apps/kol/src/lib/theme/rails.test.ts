/**
 * P8 — curated design rails, locked.
 *
 * 1. Enum lock: the token registries and store-config v1.3 enum tuples (P3,
 *    the frozen contract) are the SAME set — runtime proof on top of the
 *    compile-time Record<Id, …> typing, so neither side drifts.
 * 2. Every curated combination resolves to a complete token set.
 * 3. Curated + custom emit the identical var vocabulary (renderer never
 *    branches on theme.kind).
 * 4. A curated theme with a non-enum value is rejected (D9 layer 1)…
 * 5. …and a custom theme is NEVER enum-capped (D15 canary: rails are
 *    starting points, not a cap — the flattening the product exists to fight).
 */

import { describe, expect, it } from "vitest";
import {
  CuratedThemeSchema,
  CustomThemeSchema,
  DENSITIES,
  FONT_PAIRING_IDS,
  MOTION_PRESETS,
  PALETTE_IDS,
  RADIUS_IDENTITIES,
  THEME_MODES,
} from "@/lib/store-config/schema";
import type { CuratedTheme, CustomTheme } from "@/lib/store-config/types";
import { curatedThemeVars } from "./curated";
import { customThemeVars } from "./custom";
import { motionSpec, themeVars } from "./apply-theme";
import {
  densitySectionGap,
  fontPairings,
  motionPresets,
  palettes,
  radiusIdentities,
} from "./tokens";

/** Vars every world root must define — the vocabulary P4/P5 read (spine §P8). */
const REQUIRED_WORLD_VARS = [
  "--ground",
  "--surface",
  "--ink",
  "--muted",
  "--line",
  "--accent",
  "--accent-2",
  "--accent-3",
  "--accent-cta",
  "--accent-ink",
  "--on-media",
  "--block-a",
  "--on-block-a",
  "--block-b",
  "--on-block-b",
  "--block-c",
  "--on-block-c",
  "--scrim",
  "--font-display",
  "--font-text",
  "--font-mono",
  "--weight-display",
  "--weight-text",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--space-section",
] as const;

const baseCurated: CuratedTheme = {
  kind: "curated",
  paletteId: "sunbaked",
  mode: "light",
  fontPairingId: "statement-grotesk",
  motionPreset: "fluid",
  radiusIdentity: "soft",
  density: "standard",
};

/** An off-rail seller brand — none of these values appear in any curated set. */
const offRailCustom: CustomTheme = {
  kind: "custom",
  customPalette: {
    mode: "light",
    roles: {
      bg: "#0B3D2E",
      surface: "#10513D",
      ink: "#F2FFF9",
      inkMuted: "#9CCDB9",
      accent: "#FF6B9D",
      accentInk: "#2A0114",
      border: "#1E6A50",
    },
  },
  customPairing: {
    displayFamily: "Ogg",
    textFamily: "Söhne",
    scaleRatio: 1.28,
    displayWeight: 640,
    textWeight: 380,
  },
  motionPreset: "liquid",
  radiusIdentity: "round",
  density: "airy",
};

describe("enum lock — registries ≡ store-config v1.3 tuples (no drift)", () => {
  it("palette registry keys equal PALETTE_IDS", () => {
    expect(Object.keys(palettes).sort()).toEqual([...PALETTE_IDS].sort());
  });

  it("font-pairing registry keys equal FONT_PAIRING_IDS", () => {
    expect(Object.keys(fontPairings).sort()).toEqual([...FONT_PAIRING_IDS].sort());
  });

  it("motion registry keys equal MOTION_PRESETS", () => {
    expect(Object.keys(motionPresets).sort()).toEqual([...MOTION_PRESETS].sort());
  });

  it("radius registry keys equal RADIUS_IDENTITIES", () => {
    expect(Object.keys(radiusIdentities).sort()).toEqual([...RADIUS_IDENTITIES].sort());
  });

  it("density registry keys equal DENSITIES", () => {
    expect(Object.keys(densitySectionGap).sort()).toEqual([...DENSITIES].sort());
  });

  it("registry ids self-identify (no copy-paste key/id mismatch)", () => {
    for (const [key, palette] of Object.entries(palettes)) expect(palette.id).toBe(key);
    for (const [key, pairing] of Object.entries(fontPairings)) expect(pairing.id).toBe(key);
    for (const [key, preset] of Object.entries(motionPresets)) expect(preset.id).toBe(key);
  });

  it("each palette's bound pairing is a real pairing (§3 palette↔pairing binding)", () => {
    for (const palette of Object.values(palettes)) {
      expect(FONT_PAIRING_IDS).toContain(palette.boundPairing);
    }
  });
});

describe("curated resolution — every combination yields a complete token set", () => {
  it("all 5 palettes × 2 modes × 4 pairings × 3 radii × 2 densities resolve", () => {
    for (const paletteId of PALETTE_IDS) {
      for (const mode of THEME_MODES) {
        for (const fontPairingId of FONT_PAIRING_IDS) {
          for (const radiusIdentity of RADIUS_IDENTITIES) {
            for (const density of DENSITIES) {
              const vars = curatedThemeVars({
                ...baseCurated,
                paletteId,
                mode,
                fontPairingId,
                radiusIdentity,
                density,
              });
              for (const name of REQUIRED_WORLD_VARS) {
                expect(vars[name], `${paletteId}/${mode} missing ${name}`).toBeTruthy();
              }
            }
          }
        }
      }
    }
  });

  it("all 4 motion presets resolve with their MOTION_INTENSITY dial (§4.5)", () => {
    expect(motionSpec("hushed").dial).toBe(3);
    expect(motionSpec("fluid").dial).toBe(5);
    expect(motionSpec("liquid").dial).toBe(7);
    expect(motionSpec("dimensional").dial).toBe(8);
    // hushed alone skips the cinematic world-unfold; every preset has reveals
    for (const preset of MOTION_PRESETS) {
      expect(motionSpec(preset).reveals).toBe(true);
      expect(motionSpec(preset).cinematicUnfold).toBe(preset !== "hushed");
    }
  });

  it("only bazaar declares a third accent; others fall back to --accent", () => {
    for (const paletteId of PALETTE_IDS) {
      const vars = curatedThemeVars({ ...baseCurated, paletteId });
      if (paletteId === "bazaar") {
        expect(vars["--accent-3"]).not.toBe(vars["--accent"]);
      } else {
        expect(vars["--accent-3"]).toBe(vars["--accent"]);
      }
    }
  });
});

describe("kind-agnostic contract — blocks never branch on theme.kind", () => {
  it("curated and custom emit the identical var name set", () => {
    const curated = Object.keys(themeVars(baseCurated)).sort();
    const custom = Object.keys(themeVars(offRailCustom)).sort();
    expect(custom).toEqual(curated);
  });
});

describe("D9 layer 1 — a curated theme with a non-enum value is rejected", () => {
  it.each([
    ["paletteId", { paletteId: "millennial-beige" }],
    ["fontPairingId", { fontPairingId: "inter-everywhere" }],
    ["motionPreset", { motionPreset: "turbo" }],
    ["radiusIdentity", { radiusIdentity: "squircle" }],
    ["density", { density: "compact" }],
  ])("rejects a free %s", (_field, override) => {
    const result = CuratedThemeSchema.safeParse({ ...baseCurated, ...override });
    expect(result.success).toBe(false);
  });
});

describe("D15 canary — a custom theme is NOT enum-capped (0 capped shops)", () => {
  it("accepts a fully off-rail brand: any-hex roles + non-curated families", () => {
    const result = CustomThemeSchema.safeParse(offRailCustom);
    expect(result.success).toBe(true);
  });

  it("renders the off-rail brand verbatim — no snapping to a curated palette", () => {
    const vars = customThemeVars(offRailCustom);
    expect(vars["--ground"]).toBe("#0B3D2E");
    expect(vars["--accent"]).toBe("#FF6B9D");
    // no curated palette owns these values in any mode
    for (const palette of Object.values(palettes)) {
      for (const mode of THEME_MODES) {
        expect(palette[mode].ground).not.toBe(vars["--ground"]);
        expect(palette[mode].accent).not.toBe(vars["--accent"]);
      }
    }
    // families pass through (quoted), not coerced into a curated pairing
    expect(vars["--font-display"]).toContain('"Ogg"');
    expect(vars["--font-text"]).toContain('"Söhne"');
  });
});
