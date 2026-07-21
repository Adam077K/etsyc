/**
 * Zod contracts for every AI route — request bodies AND model output.
 *
 * Two separate jobs live here:
 *
 *  1. Request validation. Nothing reaches a model unvalidated.
 *  2. Output validation. Structured output is requested via strict tool-use,
 *     but a schema the model *should* honour is not a schema we *trust*: the
 *     same Zod objects re-parse whatever came back before any of it is
 *     rendered or persisted.
 *
 * The hand-written JSON Schemas that accompany them (tools.ts) mirror these
 * shapes; Zod is the enforcement, JSON Schema is the request to the model.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* shared primitives                                                   */
/* ------------------------------------------------------------------ */

export const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be #rgb or #rrggbb");

export const themeModeSchema = z.enum(["light", "dark"]);
export const motionPresetSchema = z.enum(["hushed", "fluid", "liquid", "dimensional"]);
export const radiusIdentitySchema = z.enum(["sharp", "soft", "round"]);
export const densitySchema = z.enum(["airy", "standard"]);

export const blockTypeSchema = z.enum([
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
]);

/* ------------------------------------------------------------------ */
/* /api/ai/interview                                                   */
/* ------------------------------------------------------------------ */

export const interviewRequestSchema = z.object({
  /** One of the seven fixed beats (spec §3.1) — the spine never changes. */
  beat: z.string().min(1).max(64),
  /** What she has actually said so far, in this beat. */
  transcriptSoFar: z.string().max(20_000),
  /** Answers already captured on earlier beats, for context (not invention). */
  priorAnswers: z.array(z.string().max(4_000)).max(20).default([]),
  /** Follow-ups already spent on this beat — the max-3 budget is enforced in code. */
  followUpsAsked: z.number().int().min(0).max(3).default(0),
});
export type InterviewRequest = z.infer<typeof interviewRequestSchema>;

/** A single extracted fact must carry the maker's own words that support it. */
export const extractedFactSchema = z.object({
  field: z.string().min(1).max(48),
  value: z.string().min(1).max(400),
  /** Verbatim span from the transcript. Checked in code, not trusted. */
  quote: z.string().min(1).max(400),
});
export type ExtractedFact = z.infer<typeof extractedFactSchema>;

export const interviewModelOutputSchema = z.object({
  followUps: z
    .array(
      z.object({
        because: z.string().min(1).max(200),
        question: z.string().min(1).max(300),
      }),
    )
    .max(3),
  extracted: z.array(extractedFactSchema).max(12),
  beatSatisfied: z.boolean(),
});
export type InterviewModelOutput = z.infer<typeof interviewModelOutputSchema>;

export const interviewResponseSchema = interviewModelOutputSchema.extend({
  simulated: z.boolean(),
  /** Facts the model asserted that were NOT traceable to the transcript. */
  droppedFacts: z.array(extractedFactSchema),
});
export type InterviewResponse = z.infer<typeof interviewResponseSchema>;

/* ------------------------------------------------------------------ */
/* /api/ai/draft                                                       */
/* ------------------------------------------------------------------ */

export const draftRequestSchema = z.object({
  /** beat → what she said. The only input to derivation (spec §5). */
  interviewAnswers: z.record(z.string().min(1), z.string().max(20_000)),
  storeId: z.string().max(64).optional(),
});
export type DraftRequest = z.infer<typeof draftRequestSchema>;

/**
 * Flat block shape the model emits. Every prop is present-and-nullable so
 * the tool schema can be `strict: true`; `normalizeBlocks` folds it back
 * into the real discriminated `StoreBlock` union.
 */
export const draftBlockSchema = z.object({
  id: z.string().min(1).max(48),
  order: z.number().int().min(0).max(50),
  type: blockTypeSchema,
  variant: z.string().min(1).max(48),
  heading: z.string().max(200).nullable(),
  body: z.string().max(1_200).nullable(),
  pullQuote: z.string().max(300).nullable(),
  quote: z.string().max(300).nullable(),
  attribution: z.string().max(120).nullable(),
  caption: z.string().max(300).nullable(),
  eyebrow: z.string().max(120).nullable(),
  label: z.string().max(120).nullable(),
  showCraftLine: z.boolean().nullable(),
  showModel3d: z.boolean().nullable(),
  toneShift: z.enum(["warm", "cool", "neutral"]).nullable(),
  blockGround: z.enum(["a", "b", "c"]).nullable(),
});
export type DraftBlock = z.infer<typeof draftBlockSchema>;

export const draftThemeSchema = z.object({
  mode: themeModeSchema,
  roles: z.object({
    bg: hexColor,
    surface: hexColor,
    ink: hexColor,
    inkMuted: hexColor,
    accent: hexColor,
    accentInk: hexColor,
    border: hexColor,
  }),
  displayFamily: z.string().min(1).max(64),
  textFamily: z.string().min(1).max(64),
  scaleRatio: z.number().min(1.05).max(1.8),
  displayWeight: z.number().int().min(100).max(900),
  textWeight: z.number().int().min(100).max(900),
  motionPreset: motionPresetSchema,
  radiusIdentity: radiusIdentitySchema,
  density: densitySchema,
  /** Trace: which described materials/light produced these colours. */
  derivedFrom: z.array(z.string().max(160)).max(12),
});
export type DraftTheme = z.infer<typeof draftThemeSchema>;

export const draftModelOutputSchema = z.object({
  theme: draftThemeSchema,
  blocks: z.array(draftBlockSchema).min(3).max(12),
  copy: z.object({
    tagline: z.string().min(1).max(200),
    bio: z.string().min(1).max(280),
  }),
  rationale: z.string().max(1_200),
});
export type DraftModelOutput = z.infer<typeof draftModelOutputSchema>;

/* ------------------------------------------------------------------ */
/* /api/ai/critic                                                      */
/* ------------------------------------------------------------------ */

/** What the critic is handed: the derived theme plus the blocks to judge. */
export const criticRequestSchema = z.object({
  config: z.object({
    theme: draftThemeSchema,
    blocks: z.array(draftBlockSchema).max(20).default([]),
    copy: z
      .object({ tagline: z.string().max(200), bio: z.string().max(400) })
      .optional(),
  }),
  storeId: z.string().max(64).optional(),
});
export type CriticRequest = z.infer<typeof criticRequestSchema>;

export const aaFindingSchema = z.object({
  pair: z.string(),
  foreground: z.string(),
  background: z.string(),
  ratio: z.number(),
  threshold: z.number(),
  pass: z.boolean(),
  sc: z.string(),
});
export type AaFinding = z.infer<typeof aaFindingSchema>;

export const coherenceModelOutputSchema = z.object({
  hierarchy: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  fitToBrand: z.number().min(0).max(1),
  slopAvoidance: z.number().min(0).max(1),
  rationale: z.string().max(1_200),
  fixes: z.array(z.string().max(300)).max(8),
});
export type CoherenceModelOutput = z.infer<typeof coherenceModelOutputSchema>;

export const criticResponseSchema = z.object({
  simulated: z.boolean(),
  /** Gate ① — computed in code from contrast.ts. The model never decides this. */
  aaPass: z.boolean(),
  aaFindings: z.array(aaFindingSchema),
  /** Gate ② — null when gate ① failed, because it never ran. */
  coherence: coherenceModelOutputSchema.extend({ score: z.number().min(0).max(1) }).nullable(),
  verdict: z.enum(["pass", "fail-aa", "fail-coherence"]),
  threshold: z.number(),
});
export type CriticResponse = z.infer<typeof criticResponseSchema>;
