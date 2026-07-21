/**
 * Tool schemas + system prompts, one per LLM feature.
 *
 * These JSON Schemas are hand-written rather than generated so they can be
 * strict-mode clean: every object carries `additionalProperties: false` and
 * lists every property in `required`. Optionality is expressed as a nullable
 * type, which is what strict tool-use wants — and it also means the model
 * has to say "no evidence for this" out loud instead of quietly omitting a
 * field.
 *
 * The system prompts are the stable half of every request (spec §2.4 —
 * they carry `cache_control` at the call site).
 */

import type { ToolSpec } from "./call";

const str = (maxLength?: number) =>
  maxLength === undefined ? { type: "string" } : { type: "string", maxLength };

const nullableStr = (maxLength: number) => ({ type: ["string", "null"], maxLength });

/* ------------------------------------------------------------------ */
/* interview follow-ups                                                */
/* ------------------------------------------------------------------ */

export const INTERVIEW_TOOL: ToolSpec = {
  name: "propose_followups",
  description:
    "Propose up to three follow-up questions for the current interview beat, and list only the facts the maker actually stated.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["followUps", "extracted", "beatSatisfied"],
    properties: {
      followUps: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["because", "question"],
          properties: {
            because: {
              ...str(200),
              description:
                "The maker's own detail this follow-up grew from, e.g. 'Because you mentioned wedging the clay by hand →'.",
            },
            question: {
              ...str(300),
              description: "One warm, specific question. Never two questions in one.",
            },
          },
        },
      },
      extracted: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "value", "quote"],
          properties: {
            field: { ...str(48), description: "e.g. material, technique, place, timePerPiece, moodWord, paletteSignal" },
            value: str(400),
            quote: {
              ...str(400),
              description:
                "The maker's VERBATIM words from the transcript that support this fact. Copy exactly; do not paraphrase.",
            },
          },
        },
      },
      beatSatisfied: {
        type: "boolean",
        description: "True when this beat's required details are covered and we should move on.",
      },
    },
  },
};

export const INTERVIEW_SYSTEM = `You are the interviewer inside KOL, a marketplace where makers tell their own story on film.

Your register: a curious shopkeeper leaning on the counter. Warm, specific, unhurried. Never a form, never an interrogation.

HARD RULES
1. You only ASK and REFLECT. You never write the maker's story, never put words in her mouth, never suggest what she "probably" means.
2. Every follow-up must grow from something she ACTUALLY SAID in this beat's transcript. Quote her detail back in the "because" field. If the transcript is empty or says nothing concrete yet, return zero follow-ups.
3. Maximum three follow-ups, one question each. Probe toward the specific and sensory — real materials, real place-names, felt textures, actual times. Those specifics are what make her shop hers.
4. EXTRACTION IS EVIDENCE-BOUND. Only list a fact if her verbatim words support it, and put those exact words in "quote". If you are tempted to infer, don't — omit the fact. An empty extracted list is a correct answer. Inventing a fact is the worst thing you can do here.
5. Set beatSatisfied true only when the beat's required details are genuinely covered.`;

/* ------------------------------------------------------------------ */
/* design derivation (D15)                                             */
/* ------------------------------------------------------------------ */

const BLOCK_TYPES = [
  "hero-video",
  "craft-story",
  "product-showcase",
  "product-detail",
  "voice-quote",
  "process-reel",
  "reviews",
  "trust-badge",
  "thank-you",
  "atmosphere",
  "contact-cta",
];

export const DRAFT_TOOL: ToolSpec = {
  name: "emit_store_draft",
  description:
    "Emit a coherent custom design system plus the ordered blocks of this maker's shop.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["theme", "blocks", "copy", "rationale"],
    properties: {
      theme: {
        type: "object",
        additionalProperties: false,
        required: [
          "mode",
          "roles",
          "displayFamily",
          "textFamily",
          "scaleRatio",
          "displayWeight",
          "textWeight",
          "motionPreset",
          "radiusIdentity",
          "density",
          "derivedFrom",
        ],
        properties: {
          mode: { type: "string", enum: ["light", "dark"] },
          roles: {
            type: "object",
            additionalProperties: false,
            required: ["bg", "surface", "ink", "inkMuted", "accent", "accentInk", "border"],
            properties: {
              bg: { ...str(7), description: "#rrggbb page background" },
              surface: str(7),
              ink: str(7),
              inkMuted: str(7),
              accent: str(7),
              accentInk: { ...str(7), description: "text/icon colour ON accent" },
              border: str(7),
            },
          },
          displayFamily: { ...str(64), description: "any real font family, e.g. Fraunces" },
          textFamily: str(64),
          scaleRatio: { type: "number", minimum: 1.05, maximum: 1.8 },
          displayWeight: { type: "integer", minimum: 100, maximum: 900 },
          textWeight: { type: "integer", minimum: 100, maximum: 900 },
          motionPreset: {
            type: "string",
            enum: ["hushed", "fluid", "liquid", "dimensional"],
          },
          radiusIdentity: { type: "string", enum: ["sharp", "soft", "round"] },
          density: { type: "string", enum: ["airy", "standard"] },
          derivedFrom: {
            type: "array",
            maxItems: 12,
            items: str(160),
            description:
              "Trace each colour to what she described, e.g. 'wet stoneware → surface'.",
          },
        },
      },
      blocks: {
        type: "array",
        minItems: 3,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "order",
            "type",
            "variant",
            "heading",
            "body",
            "pullQuote",
            "quote",
            "attribution",
            "caption",
            "eyebrow",
            "label",
            "showCraftLine",
            "showModel3d",
            "toneShift",
            "blockGround",
          ],
          properties: {
            id: str(48),
            order: { type: "integer", minimum: 0, maximum: 50 },
            type: { type: "string", enum: BLOCK_TYPES },
            variant: { ...str(48), description: "a variant valid for this block type" },
            heading: nullableStr(200),
            body: nullableStr(1200),
            pullQuote: nullableStr(300),
            quote: nullableStr(300),
            attribution: nullableStr(120),
            caption: nullableStr(300),
            eyebrow: nullableStr(120),
            label: nullableStr(120),
            showCraftLine: { type: ["boolean", "null"] },
            showModel3d: { type: ["boolean", "null"] },
            toneShift: { type: ["string", "null"], enum: ["warm", "cool", "neutral", null] },
            blockGround: { type: ["string", "null"], enum: ["a", "b", "c", null] },
          },
        },
      },
      copy: {
        type: "object",
        additionalProperties: false,
        required: ["tagline", "bio"],
        properties: {
          tagline: str(200),
          bio: { ...str(280), description: "In her voice, from her words. Max 280 chars." },
        },
      },
      rationale: { ...str(1200), description: "Why this world is hers and not a house style." },
    },
  },
};

export const DRAFT_SYSTEM = `You derive a maker's entire shop — colours, type, motion, block composition, copy — from her own interview answers.

FULL BRAND FREEDOM (D15). KOL's five curated palettes (sunbaked, market-plum, cuberto-noir, orchard, bazaar) are calibration examples of what a coherent system looks like. They are STARTING POINTS, NOT A CAP. You may and usually should depart from them entirely. Two different makers must never collapse to the same world; defaulting to a safe house style is a failure, not a safe choice.

DERIVE, DON'T DECORATE
- Ground the palette in the materials, light and place she described. "Wet stoneware, ash glaze, north light" is a palette brief; read it as one.
- Every colour in derivedFrom must trace to something she actually said.
- Map her described feel to type (character, weight, scale), motion preset, radius and density.

ACCESSIBILITY BY CONSTRUCTION (a deterministic gate verifies this afterwards and cannot be argued with):
- ink on bg ≥ 4.5:1, ink on surface ≥ 4.5:1
- inkMuted on bg and on surface ≥ 4.5:1
- accentInk on accent ≥ 4.5:1
- border on surface and on bg ≥ 3:1
Choose hexes that clear these by construction. Keep her hue and chroma; buy the headroom with lightness.

BLOCKS
- Exactly one hero-video, always first.
- Order tells her story: origin → craft → products → trust → invitation, varied to fit her.
- Only set props that belong to a block type; everything else is null.

COPY (D10): her voice, drawn from her words. Never invent biography, never invent a claim about her materials or process. If you don't know it, don't write it.`;

/* ------------------------------------------------------------------ */
/* critic — coherence only (gate ② ; AA is computed in code)           */
/* ------------------------------------------------------------------ */

export const CRITIC_TOOL: ToolSpec = {
  name: "score_coherence",
  description:
    "Score an already-accessible store draft on hierarchy, coherence, fit-to-brand and slop-avoidance.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["hierarchy", "coherence", "fitToBrand", "slopAvoidance", "rationale", "fixes"],
    properties: {
      hierarchy: { type: "number", minimum: 0, maximum: 1 },
      coherence: { type: "number", minimum: 0, maximum: 1 },
      fitToBrand: { type: "number", minimum: 0, maximum: 1 },
      slopAvoidance: { type: "number", minimum: 0, maximum: 1 },
      rationale: str(1200),
      fixes: { type: "array", maxItems: 8, items: str(300) },
    },
  },
};

export const CRITIC_SYSTEM = `You are KOL's auto-critic, second gate only.

The first gate — WCAG-AA contrast — has ALREADY been computed deterministically in code and has already passed. Do not score accessibility, do not comment on contrast, do not second-guess it. It is arithmetic and it is not yours.

Score exactly four dimensions, 0–1 each:
- hierarchy (0.30): does the eye land in the right order — film, then story, then pieces? Is the type scale doing work?
- coherence (0.35): do palette, type, motion, atmosphere, copy and block order read as ONE intentional brand?
- fitToBrand (0.25): does this match the maker described, in her own words? Generic, safe, house-style output scores LOW here even if it is pretty.
- slopAvoidance (0.10): AI tells — lorem cadence, arbitrary radius, a mismatched accent, motion that means nothing.

Unconventional is not a defect. A strange, specific, confident world that is true to this maker should score HIGH. Penalize blandness, not boldness.

Give a short rationale and concrete fixes. You are advising, not editing: your fixes are never auto-applied.`;
