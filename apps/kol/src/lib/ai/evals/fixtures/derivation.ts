/**
 * Golden set for design derivation (spec §8b) — the D15 no-flattening check.
 *
 * What's scored isn't taste. It's three things a design stage can objectively
 * fail: does the derived palette clear the AA gate by construction, is the
 * emitted structure actually valid, and — the one that matters most — do
 * three very different makers get three genuinely different worlds, rather
 * than the same safe house style with the hexes nudged.
 */

import type { GoldenExample } from "../harness.ts";

export interface DerivationInput {
  makerId: string;
  interviewAnswers: Record<string, string>;
}

export interface DerivationExpectation {
  /** The derived palette should read as this temperature. */
  mode: "light" | "dark";
  /** Signals the derivation must visibly respond to. */
  mustTrace: string[];
}

export const derivationGoldenExamples: GoldenExample<DerivationInput, DerivationExpectation>[] = [
  {
    id: "dv-01-stoneware",
    description: "Warm stoneware potter, north light, ash glaze — a light, earthy world",
    tags: ["happy-path"],
    input: {
      makerId: "sena",
      interviewAnswers: {
        "Story & origin":
          "I left restaurant kitchens twelve years ago and never went back. The wheel was the first thing that ever slowed me down.",
        Craft:
          "I wedge the clay by hand until the air's out, throw it tall, then pull three grooves with my thumb so it sits in your hand.",
        Workshop:
          "A converted barn with one big north-facing window. Ash glaze bucket by the door, clay dust on everything, grey even light all day.",
        Values: "Nothing leaves here that I wouldn't eat off myself. No decals, no shortcuts.",
        Brand: "Walking in should feel like a quiet kitchen on a Sunday morning.",
      },
    },
    expected: { mode: "light", mustTrace: ["clay", "light"] },
  },
  {
    id: "dv-02-machinist",
    description: "Cold, precise metalsmith — none of the five curated palettes fit (the D15 case)",
    tags: ["happy-path", "unconventional"],
    input: {
      makerId: "kade",
      interviewAnswers: {
        "Story & origin": "I trained as a machinist. I make jewellery the way you'd make a part.",
        Craft: "Everything is milled from bar stock, then hand-finished. Tolerances matter to me.",
        Workshop:
          "A unit on an industrial estate. Fluorescent overheads, gunmetal benches, steel blue everywhere, raw brass offcuts in a tray.",
        Values: "No plating, no filler. If it looks solid it is solid.",
        Brand: "Cold, precise, industrial — like a machinist's shop at dawn.",
      },
    },
    expected: { mode: "dark", mustTrace: ["gunmetal", "brass"] },
  },
  {
    id: "dv-03-dyer",
    description: "Loud, saturated natural dyer — must not be flattened toward the potter's world",
    tags: ["adversarial", "unconventional"],
    input: {
      makerId: "rue",
      interviewAnswers: {
        "Story & origin": "I started dyeing in my mum's kitchen with onion skins and got carried away.",
        Craft:
          "Everything is dyed with madder, weld and indigo in big pots. The colours come out shouting.",
        Workshop:
          "A bright yard with lines of wet cloth. Magenta, ochre, deep indigo dripping onto the concrete.",
        Values: "Plant dyes only, and I tell you exactly what's in the pot.",
        Brand: "Like walking into a market stall at full noon. Loud and happy.",
      },
    },
    expected: { mode: "light", mustTrace: ["indigo", "madder"] },
  },
];
