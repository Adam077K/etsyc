/**
 * P8 — WCAG-AA contrast audit of the curated set, at the doc's honest scope
 * (design-system v2 §2 AA-levels note):
 *
 *   body 4.5:1 — ink/muted on ground+surface, the CTA pair, on-block ink on
 *   the dark block-grounds; large-text 3:1 — the two documented midtone
 *   grounds (sunbaked --block-c sky, cuberto-noir --block-c electric, both
 *   display-only — the validator rejects "c" on body-copy blocks) and
 *   non-text accent-on-ground UI; on-media type is measured against the
 *   opaque scrim bottom.
 *
 * Ratios are measured on the ACTUAL emitted vars (color-mix forms evaluated
 * by contrast.ts), so a token edit that breaks AA fails here, not in QA.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PALETTE_IDS, THEME_MODES } from "@/lib/store-config/schema";
import type { CuratedTheme } from "@/lib/store-config/types";
import { curatedThemeVars } from "./curated";
import { palettes } from "./tokens";
import { AA_BODY, AA_LARGE_TEXT, contrastRatio, resolveThemeColor } from "./contrast";

/** §2: these two midtone grounds are large-text-only; all others carry body. */
const LARGE_TEXT_ONLY_BLOCK_C = new Set(["sunbaked", "cuberto-noir"]);

function varsFor(paletteId: (typeof PALETTE_IDS)[number], mode: "light" | "dark") {
  const theme: CuratedTheme = {
    kind: "curated",
    paletteId,
    mode,
    fontPairingId: palettes[paletteId].boundPairing,
    motionPreset: "fluid",
    radiusIdentity: "soft",
    density: "standard",
  };
  return curatedThemeVars(theme);
}

const combos = PALETTE_IDS.flatMap((paletteId) =>
  THEME_MODES.map((mode) => [paletteId, mode] as const),
);

describe.each(combos)("%s · %s", (paletteId, mode) => {
  const vars = varsFor(paletteId, mode);
  const on = (fg: `--${string}`, bg: `--${string}`) =>
    contrastRatio(resolveThemeColor(vars[fg] as string), resolveThemeColor(vars[bg] as string));

  it("primary + secondary text clear body AA on ground and surface", () => {
    expect(on("--ink", "--ground")).toBeGreaterThanOrEqual(AA_BODY);
    expect(on("--ink", "--surface")).toBeGreaterThanOrEqual(AA_BODY);
    expect(on("--muted", "--ground")).toBeGreaterThanOrEqual(AA_BODY);
    expect(on("--muted", "--surface")).toBeGreaterThanOrEqual(AA_BODY);
  });

  it("the CTA pair (--accent-ink on --accent-cta) clears body AA", () => {
    expect(on("--accent-ink", "--accent-cta")).toBeGreaterThanOrEqual(AA_BODY);
  });

  it("raw accent on ground clears the 3:1 UI-component floor", () => {
    expect(on("--accent", "--ground")).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
  });

  it("on-media type clears body AA against the opaque scrim bottom", () => {
    const scrimBottom = /color-mix\(in oklab, [^)]+\)/.exec(vars["--scrim"] as string);
    expect(scrimBottom).not.toBeNull();
    const backdrop = resolveThemeColor(scrimBottom![0]);
    expect(
      contrastRatio(resolveThemeColor(vars["--on-media"] as string), backdrop),
    ).toBeGreaterThanOrEqual(AA_BODY);
  });

  it("block-ground inks meet their documented per-combo level", () => {
    expect(on("--on-block-a", "--block-a")).toBeGreaterThanOrEqual(AA_BODY);
    expect(on("--on-block-b", "--block-b")).toBeGreaterThanOrEqual(AA_BODY);
    const blockCFloor = LARGE_TEXT_ONLY_BLOCK_C.has(paletteId) ? AA_LARGE_TEXT : AA_BODY;
    expect(on("--on-block-c", "--block-c")).toBeGreaterThanOrEqual(blockCFloor);
  });
});

/**
 * Chrome-default headroom (AA fix, 2026-07): sunbaked light is KOL's own
 * chrome fallback (globals.css :root), rendered on every non-world page.
 * `--muted` was regraded #6F6153 → #645648 specifically to buy headroom over
 * the 4.5 body floor, so future translucent surfaces/scrims can't silently
 * push it under. Encode the headroom — 5.5, not just 4.5 — so a regrade
 * cannot silently spend it. (Sunbaked-light-only: the other palettes clear
 * body AA at 4.78–5.27 light and are intentionally not regraded — see
 * docs/06-design/KOL-wave3-aa-fix-muted.md §3.)
 */
describe("sunbaked light — chrome-default --muted headroom", () => {
  const MUTED_HEADROOM = 5.5;
  const vars = varsFor("sunbaked", "light");
  const on = (fg: `--${string}`, bg: `--${string}`) =>
    contrastRatio(resolveThemeColor(vars[fg] as string), resolveThemeColor(vars[bg] as string));

  it("--muted clears 5.5:1 on ground and surface, not just the 4.5 floor", () => {
    expect(on("--muted", "--ground")).toBeGreaterThanOrEqual(MUTED_HEADROOM);
    expect(on("--muted", "--surface")).toBeGreaterThanOrEqual(MUTED_HEADROOM);
  });

  it("globals.css :root chrome fallback --muted matches the token", () => {
    const css = readFileSync(
      fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
      "utf8",
    );
    const fallback = /--muted:\s*(#[0-9a-fA-F]{3,6})/.exec(css)?.[1];
    expect(fallback?.toLowerCase()).toBe(palettes.sunbaked.light.muted.toLowerCase());
  });
});
