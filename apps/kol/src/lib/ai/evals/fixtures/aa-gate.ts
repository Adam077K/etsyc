/**
 * Golden set for gate ① — the deterministic WCAG-AA gate.
 *
 * This is the load-bearing eval: it needs no API key and it must pass on
 * every commit, because the AA gate is the thing that lets KOL give makers
 * full brand freedom without shipping unreadable shops. If this eval ever
 * goes red, the publish gate is lying.
 *
 * Ratios below were computed from the WCAG formula, not eyeballed.
 */

import type { DraftTheme } from "../../schemas.ts";
import type { GoldenExample } from "../harness.ts";

const base: Omit<DraftTheme, "roles" | "mode"> = {
  displayFamily: "Fraunces",
  textFamily: "Inter",
  scaleRatio: 1.25,
  displayWeight: 600,
  textWeight: 400,
  motionPreset: "fluid",
  radiusIdentity: "soft",
  density: "standard",
  derivedFrom: [],
};

const theme = (
  mode: DraftTheme["mode"],
  roles: DraftTheme["roles"],
): DraftTheme => ({ ...base, mode, roles });

export interface AaExpectation {
  pass: boolean;
  /** Pairs that must be reported as failing, by name. */
  failingPairs: string[];
}

export const aaGoldenExamples: GoldenExample<DraftTheme, AaExpectation>[] = [
  {
    id: "aa-01-sena-light",
    description: "Warm stoneware light world — every pair clears comfortably",
    tags: ["happy-path"],
    input: theme("light", {
      bg: "#EFE7D8",
      surface: "#E6DCC7",
      ink: "#2C2620",
      inkMuted: "#5A5145",
      accent: "#8F5A3A",
      accentInk: "#FBF7EF",
      border: "#8C7F6B",
    }),
    expected: { pass: true, failingPairs: [] },
  },
  {
    id: "aa-02-machinist-dark",
    description: "Dark machinist world from the spec's worked example, border repaired",
    tags: ["happy-path"],
    input: theme("dark", {
      bg: "#14181C",
      surface: "#1E242B",
      ink: "#EEF2F5",
      inkMuted: "#A9B4BE",
      accent: "#C7973F",
      accentInk: "#14181C",
      border: "#4A5763",
    }),
    expected: { pass: true, failingPairs: [] },
  },
  {
    id: "aa-03-machinist-dark-unrepaired",
    description:
      "The spec's exact failure: a beautiful on-brand palette with one inaccessible hairline",
    tags: ["boundary"],
    input: theme("dark", {
      bg: "#14181C",
      surface: "#1E242B",
      ink: "#EEF2F5",
      inkMuted: "#A9B4BE",
      accent: "#C7973F",
      accentInk: "#14181C",
      border: "#333E48",
    }),
    expected: { pass: false, failingPairs: ["border on surface"] },
  },
  {
    id: "aa-04-muted-too-light",
    description: "Secondary text at 3.4:1 — the most common real-world AA miss",
    tags: ["boundary"],
    input: theme("light", {
      bg: "#EFE7D8",
      surface: "#E6DCC7",
      ink: "#2C2620",
      inkMuted: "#96897A",
      accent: "#8F5A3A",
      accentInk: "#FBF7EF",
      border: "#8C7F6B",
    }),
    expected: { pass: false, failingPairs: ["inkMuted on bg", "inkMuted on surface"] },
  },
  {
    id: "aa-05-accent-ink-unreadable",
    description: "White label on a mid-tone accent CTA — button text fails",
    tags: ["adversarial"],
    input: theme("light", {
      bg: "#FFFFFF",
      surface: "#F4F4F4",
      ink: "#1A1A1A",
      inkMuted: "#595959",
      accent: "#E8B04B",
      accentInk: "#FFFFFF",
      border: "#767676",
    }),
    expected: { pass: false, failingPairs: ["accentInk on accent"] },
  },
  {
    id: "aa-06-low-contrast-everything",
    description: "Fashionable grey-on-grey — everything fails, nothing crashes",
    tags: ["adversarial"],
    input: theme("light", {
      bg: "#DDDDDD",
      surface: "#D5D5D5",
      ink: "#999999",
      inkMuted: "#AAAAAA",
      accent: "#BBBBBB",
      accentInk: "#CCCCCC",
      border: "#D0D0D0",
    }),
    expected: {
      pass: false,
      failingPairs: [
        "ink on bg",
        "ink on surface",
        "inkMuted on bg",
        "inkMuted on surface",
        "accentInk on accent",
        "accent heading on bg",
        "border on surface",
        "border on bg",
      ],
    },
  },
  {
    id: "aa-07-pure-max-contrast",
    description: "Black on white — the trivial ceiling case",
    tags: ["boundary"],
    input: theme("light", {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      ink: "#000000",
      inkMuted: "#595959",
      accent: "#0B4F9E",
      accentInk: "#FFFFFF",
      border: "#767676",
    }),
    expected: { pass: true, failingPairs: [] },
  },
  {
    id: "aa-08-shorthand-hex",
    description: "#rgb shorthand must be measured, not rejected",
    tags: ["edge"],
    input: theme("light", {
      bg: "#fff",
      surface: "#eee",
      ink: "#111",
      inkMuted: "#555",
      accent: "#046",
      accentInk: "#fff",
      border: "#767676",
    }),
    expected: { pass: true, failingPairs: [] },
  },
  {
    id: "aa-09-malformed-hex",
    description: "An unparseable colour must FAIL the gate, never crash or silently pass",
    tags: ["adversarial"],
    input: theme("light", {
      bg: "not-a-colour",
      surface: "#E6DCC7",
      ink: "#2C2620",
      inkMuted: "#5A5145",
      accent: "#8F5A3A",
      accentInk: "#FBF7EF",
      border: "#8C7F6B",
    }),
    expected: {
      pass: false,
      failingPairs: ["ink on bg", "inkMuted on bg", "accent heading on bg", "border on bg"],
    },
  },
  {
    id: "aa-10-large-text-only-accent",
    description: "Accent heading at 3.2:1 passes as large text but would fail as body",
    tags: ["boundary"],
    input: theme("light", {
      bg: "#EFE7D8",
      surface: "#E6DCC7",
      ink: "#2C2620",
      inkMuted: "#5A5145",
      accent: "#A15F32",
      accentInk: "#FBF7EF",
      border: "#8C7F6B",
    }),
    expected: { pass: true, failingPairs: [] },
  },
];
