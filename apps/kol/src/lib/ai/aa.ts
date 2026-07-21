/**
 * Gate ① — WCAG-AA, computed. No model touches this.
 *
 * This is the whole reason KOL can hand a maker full brand freedom (D15)
 * and still promise a legible shop: the palette cap is replaced by
 * arithmetic. `contrastRatio` from theme/contrast.ts is the only judge, and
 * a failing pair is a fact, not an opinion — which is exactly why the
 * publish gate can lean on it and why nobody, at any level, can override it.
 *
 * Spec §6.1: 1.4.3 text ≥ 4.5:1 (large ≥ 3:1), 1.4.11 structural non-text ≥ 3:1.
 */

// relative, not "@/", so the eval harness can run this file under plain node
import { contrastRatio, isHexColor } from "../theme/contrast";
import type { AaFinding, DraftTheme } from "./schemas";

export const AA_TEXT_MIN = 4.5;
export const AA_LARGE_TEXT_MIN = 3;
export const AA_NON_TEXT_MIN = 3;

interface PairSpec {
  pair: string;
  fg: keyof DraftTheme["roles"];
  bg: keyof DraftTheme["roles"];
  threshold: number;
  sc: string;
}

const PAIRS: PairSpec[] = [
  { pair: "ink on bg", fg: "ink", bg: "bg", threshold: AA_TEXT_MIN, sc: "1.4.3 normal" },
  { pair: "ink on surface", fg: "ink", bg: "surface", threshold: AA_TEXT_MIN, sc: "1.4.3 normal" },
  { pair: "inkMuted on bg", fg: "inkMuted", bg: "bg", threshold: AA_TEXT_MIN, sc: "1.4.3 normal" },
  {
    pair: "inkMuted on surface",
    fg: "inkMuted",
    bg: "surface",
    threshold: AA_TEXT_MIN,
    sc: "1.4.3 normal",
  },
  {
    pair: "accentInk on accent",
    fg: "accentInk",
    bg: "accent",
    threshold: AA_TEXT_MIN,
    sc: "1.4.3 normal",
  },
  {
    pair: "accent heading on bg",
    fg: "accent",
    bg: "bg",
    threshold: AA_LARGE_TEXT_MIN,
    sc: "1.4.3 large",
  },
  {
    pair: "border on surface",
    fg: "border",
    bg: "surface",
    threshold: AA_NON_TEXT_MIN,
    sc: "1.4.11 non-text",
  },
  { pair: "border on bg", fg: "border", bg: "bg", threshold: AA_NON_TEXT_MIN, sc: "1.4.11 non-text" },
];

export interface AaResult {
  pass: boolean;
  findings: AaFinding[];
  /** Lowest measured ratio relative to its own threshold — the weakest link. */
  worst: AaFinding | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Run gate ① over a derived theme. Pure arithmetic; safe to call anywhere. */
export function runAaGate(theme: DraftTheme): AaResult {
  const findings: AaFinding[] = PAIRS.map((spec) => {
    const foreground = theme.roles[spec.fg];
    const background = theme.roles[spec.bg];

    // an unparseable hex is a fail, not a crash — we never silently pass junk
    const measurable = isHexColor(foreground) && isHexColor(background);
    const ratio = measurable ? round2(contrastRatio(foreground, background)) : 0;

    return {
      pair: spec.pair,
      foreground,
      background,
      ratio,
      threshold: spec.threshold,
      pass: measurable && ratio >= spec.threshold,
      sc: spec.sc,
    };
  });

  const failing = findings.filter((f) => !f.pass);
  const ranked = [...findings].sort((a, b) => a.ratio / a.threshold - b.ratio / b.threshold);

  return {
    pass: failing.length === 0,
    findings,
    worst: ranked[0] ?? null,
  };
}

/** Human-readable one-liner for the failing pairs, for regen feedback. */
export function describeAaFailures(result: AaResult): string {
  return result.findings
    .filter((f) => !f.pass)
    .map(
      (f) =>
        `${f.pair} (${f.foreground} on ${f.background}) measured ${f.ratio.toFixed(2)}:1, below the ${f.threshold}:1 floor (${f.sc})`,
    )
    .join("; ");
}
