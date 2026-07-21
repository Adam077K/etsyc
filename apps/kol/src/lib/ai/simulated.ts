/**
 * The honest degraded path.
 *
 * With no ANTHROPIC_API_KEY every route still answers 200 — but it answers
 * with output produced here, and every one of those responses carries
 * `simulated: true` so the UI can say so in plain words. We would rather
 * show a maker "no model ran — this is a stand-in" than let her believe a
 * model read her story when nothing did.
 *
 * Everything below is DETERMINISTIC: same input, same output. No randomness,
 * no clock. That makes the degraded path testable, and it makes the
 * difference between simulated and real output visible rather than subtle.
 *
 * Note what the simulated interview does NOT do: it never asserts a fact it
 * cannot point at in the transcript. The lexicon match below quotes her
 * actual sentence. If she said nothing matchable, it extracts nothing.
 */

import type {
  CoherenceModelOutput,
  DraftModelOutput,
  DraftTheme,
  ExtractedFact,
  InterviewModelOutput,
} from "./schemas";

/* ------------------------------------------------------------------ */
/* small deterministic helpers                                         */
/* ------------------------------------------------------------------ */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/* ------------------------------------------------------------------ */
/* interview                                                           */
/* ------------------------------------------------------------------ */

/** Sensory/material vocabulary — the specifics a custom design is built from. */
const LEXICON: { field: string; terms: string[] }[] = [
  { field: "material", terms: ["clay", "stoneware", "glaze", "wool", "linen", "oak", "walnut", "brass", "silver", "steel", "leather", "glass", "dye", "thread", "resin"] },
  { field: "technique", terms: ["wedging", "throwing", "wheel", "kiln", "fired", "hand-built", "woven", "carved", "forged", "hammered", "stitched", "turned"] },
  { field: "place", terms: ["workshop", "studio", "barn", "garage", "kitchen", "shed", "bench", "loft"] },
  { field: "light", terms: ["north light", "morning light", "daylight", "window", "dawn", "dusk", "lamplight"] },
  { field: "timePerPiece", terms: ["hours", "days", "weeks", "minutes", "months"] },
];

const GENERIC_PROBES: Record<string, string> = {
  material: "What does that material actually feel like in your hands when it's right?",
  technique: "Walk me through that step — what are you watching for while you do it?",
  place: "What's the first thing someone would notice walking into that space?",
  light: "How does that light change what you do in a day?",
  timePerPiece: "And how much of that is waiting versus working?",
};

export function simulatedInterview(
  transcriptSoFar: string,
  followUpsAsked: number,
): InterviewModelOutput {
  const lines = sentences(transcriptSoFar);
  const extracted: ExtractedFact[] = [];
  const hits: { field: string; term: string; quote: string }[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const group of LEXICON) {
      for (const term of group.terms) {
        if (!lower.includes(term)) continue;
        if (hits.some((h) => h.field === group.field && h.term === term)) continue;
        hits.push({ field: group.field, term, quote: line });
        // the quote is her actual sentence — nothing here is invented
        extracted.push({ field: group.field, value: term, quote: line });
      }
    }
  }

  const budget = Math.max(0, 3 - followUpsAsked);
  const seen = new Set<string>();
  const followUps: { because: string; question: string }[] = [];

  for (const hit of hits) {
    if (followUps.length >= Math.min(2, budget)) break;
    if (seen.has(hit.field)) continue;
    seen.add(hit.field);
    const probe = GENERIC_PROBES[hit.field];
    if (probe === undefined) continue;
    followUps.push({ because: `Because you mentioned ${hit.term} →`, question: probe });
  }

  return {
    followUps: followUps.slice(0, 3),
    extracted: extracted.slice(0, 12),
    beatSatisfied: hits.length >= 4 || followUpsAsked >= 3,
  };
}

/* ------------------------------------------------------------------ */
/* draft                                                               */
/* ------------------------------------------------------------------ */

/**
 * Three coherent, AA-clean stand-in systems. Picked by a hash of her
 * answers so the same interview always yields the same world — and so the
 * simulated path visibly cannot do what derivation does (these are chosen,
 * not derived, which is the point of labelling them).
 */
const STAND_IN_THEMES: DraftTheme[] = [
  {
    mode: "light",
    roles: {
      bg: "#EFE7D8",
      surface: "#E6DCC7",
      ink: "#2C2620",
      inkMuted: "#5A5145",
      accent: "#8F5A3A",
      accentInk: "#FBF7EF",
      border: "#8C7F6B",
    },
    displayFamily: "Fraunces",
    textFamily: "General Sans",
    scaleRatio: 1.25,
    displayWeight: 600,
    textWeight: 400,
    motionPreset: "fluid",
    radiusIdentity: "soft",
    density: "standard",
    derivedFrom: ["stand-in system — no model ran"],
  },
  {
    mode: "dark",
    roles: {
      bg: "#14181C",
      surface: "#1E242B",
      ink: "#EEF2F5",
      inkMuted: "#A9B4BE",
      accent: "#C7973F",
      accentInk: "#14181C",
      border: "#4A5763",
    },
    displayFamily: "Space Grotesk",
    textFamily: "IBM Plex Sans",
    scaleRatio: 1.25,
    displayWeight: 600,
    textWeight: 400,
    motionPreset: "hushed",
    radiusIdentity: "sharp",
    density: "standard",
    derivedFrom: ["stand-in system — no model ran"],
  },
  {
    mode: "light",
    roles: {
      bg: "#F7F3EC",
      surface: "#ECE4D8",
      ink: "#241F1B",
      inkMuted: "#544C43",
      accent: "#5C4A7D",
      accentInk: "#FFFFFF",
      border: "#9A8E7E",
    },
    displayFamily: "Playfair Display",
    textFamily: "Inter",
    scaleRatio: 1.333,
    displayWeight: 700,
    textWeight: 400,
    motionPreset: "liquid",
    radiusIdentity: "round",
    density: "airy",
    derivedFrom: ["stand-in system — no model ran"],
  },
];

export function simulatedDraft(interviewAnswers: Record<string, string>): DraftModelOutput {
  const joined = Object.entries(interviewAnswers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");

  const theme = STAND_IN_THEMES[hash(joined) % STAND_IN_THEMES.length]!;
  const first = sentences(Object.values(interviewAnswers).join(" "))[0] ?? "";

  const blocks: DraftModelOutput["blocks"] = [
    {
      id: "b1",
      order: 0,
      type: "hero-video",
      variant: "full-bleed",
      heading: null,
      body: null,
      pullQuote: null,
      quote: null,
      attribution: null,
      caption: null,
      eyebrow: null,
      label: null,
      showCraftLine: true,
      showModel3d: null,
      toneShift: null,
      blockGround: null,
    },
    {
      id: "b2",
      order: 1,
      type: "craft-story",
      variant: "text-left-media-right",
      heading: "Your craft, in your words",
      // her own first sentence, verbatim — the stand-in writes nothing new
      body: first.length > 0 ? first : "Your interview answers will appear here.",
      pullQuote: null,
      quote: null,
      attribution: null,
      caption: null,
      eyebrow: null,
      label: null,
      showCraftLine: null,
      showModel3d: null,
      toneShift: null,
      blockGround: null,
    },
    {
      id: "b3",
      order: 2,
      type: "product-showcase",
      variant: "rail",
      heading: "The pieces",
      body: null,
      pullQuote: null,
      quote: null,
      attribution: null,
      caption: null,
      eyebrow: "Made by hand",
      label: null,
      showCraftLine: null,
      showModel3d: null,
      toneShift: null,
      blockGround: null,
    },
    {
      id: "b4",
      order: 3,
      type: "contact-cta",
      variant: "footer-strip",
      heading: null,
      body: null,
      pullQuote: null,
      quote: null,
      attribution: null,
      caption: null,
      eyebrow: null,
      label: "Follow along",
      showCraftLine: null,
      showModel3d: null,
      toneShift: null,
      blockGround: null,
    },
  ];

  return {
    theme,
    blocks,
    copy: {
      tagline: "A stand-in world — no model has read your interview yet.",
      bio: first.length > 0 ? first.slice(0, 280) : "Your own words go here.",
    },
    rationale:
      "SIMULATED. No ANTHROPIC_API_KEY is configured, so nothing was derived from this interview — this is a deterministic stand-in system chosen by hash, not a design read from her story.",
  };
}

/* ------------------------------------------------------------------ */
/* critic — gate ② only (gate ① is always real, always computed)       */
/* ------------------------------------------------------------------ */

export function simulatedCoherence(blockCount: number, hasCopy: boolean): CoherenceModelOutput {
  // a transparent structural heuristic, not a judgement: it counts things
  const hierarchy = blockCount >= 4 ? 0.82 : 0.7;
  const coherence = blockCount >= 3 ? 0.8 : 0.68;
  const fitToBrand = hasCopy ? 0.78 : 0.7;
  return {
    hierarchy,
    coherence,
    fitToBrand,
    slopAvoidance: 0.75,
    rationale:
      "SIMULATED. No model scored this. These numbers come from a structural heuristic (block count and whether copy is present) and must not be read as a coherence judgement.",
    fixes: ["Set ANTHROPIC_API_KEY to get a real coherence read."],
  };
}
