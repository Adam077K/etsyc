import { z } from "zod";

/**
 * Zod boundary schemas for video-profile tagging (spec P7).
 *
 * TRUST BOUNDARY — read this before touching anything below.
 * `video_profiles.purpose` / `.page_eligibility` / `.mood` are bare `text[]`
 * in Postgres: the enum lists exist ONLY in a SQL comment — there is NO CHECK
 * constraint and NO Postgres enum type on those columns. This file is
 * therefore the ONLY thing standing between a garbage tag and the video
 * engine (P6), which selects clips purely on these arrays. EVERY write path —
 * manual tagging AND an AI-confirmed suggestion — must pass
 * `videoProfileWriteSchema` before it touches Supabase. Never write
 * `video_profiles` with unparsed input.
 */

/**
 * FROZEN tag constants — the contract P6 reads (Wave-2 dispatch packet §7).
 * All values are lowercase kebab-case, stored exactly as written; no casing
 * normalisation on read. Do NOT alter, rename, or extend a single value —
 * another team's eligibility queries are built on these exact strings.
 */
export const PURPOSE = ["intro","craft-story","process","product-narration","thankyou","atmosphere"] as const;
export const PAGE_ELIGIBILITY = ["feed","grown","world","product","checkout","thankyou"] as const;
export const MOOD = ["calm","warm","energetic","intimate"] as const;

export type Purpose = (typeof PURPOSE)[number];
export type PageEligibility = (typeof PAGE_ELIGIBILITY)[number];
export type Mood = (typeof MOOD)[number];

/**
 * anti_repetition_key: nullable; when present it is a lowercase kebab slug
 * (e.g. "sena-wheel"), max 64 chars. The engine dedupes on it per session.
 */
export const ANTI_REPETITION_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const THANKYOU_ONLY_MESSAGE =
  'A thank-you clip must be tagged exactly purpose:["thankyou"] and page_eligibility:["thankyou"] — nothing else.';

/**
 * The thankyou-only invariant (write-time, belt-and-braces on P6's structural
 * feed exclusion): if `purpose` contains "thankyou" OR `page_eligibility`
 * contains "thankyou", then BOTH must equal exactly ["thankyou"]. Exported so
 * the editor and the eval harness flag the same condition the schema rejects.
 */
export function violatesThankyouOnly(tags: {
  purpose: readonly string[];
  page_eligibility: readonly string[];
}): boolean {
  const touchesThankyou =
    tags.purpose.includes("thankyou") ||
    tags.page_eligibility.includes("thankyou");
  if (!touchesThankyou) return false;
  return !(
    tags.purpose.length === 1 &&
    tags.purpose[0] === "thankyou" &&
    tags.page_eligibility.length === 1 &&
    tags.page_eligibility[0] === "thankyou"
  );
}

function noDuplicates(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

/**
 * Tag arrays are stored exactly as written (no normalisation), so duplicates
 * are rejected rather than silently deduped — a duplicate can only come from
 * a caller bypassing the checkbox UI, and rewriting input at a trust boundary
 * hides the bypass.
 */
const purposeArraySchema = z
  .array(z.enum(PURPOSE, { error: "Pick purposes from the fixed list." }))
  .refine(noDuplicates, { error: "Duplicate purpose tags." });

const pageEligibilityArraySchema = z
  .array(z.enum(PAGE_ELIGIBILITY, { error: "Pick pages from the fixed list." }))
  .refine(noDuplicates, { error: "Duplicate page tags." });

const moodArraySchema = z
  .array(z.enum(MOOD, { error: "Pick moods from the fixed list." }))
  .refine(noDuplicates, { error: "Duplicate mood tags." });

/**
 * product_links is uuid[] with NO element-level FK (Postgres cannot FK array
 * elements) — app-validated only. A dangling id yields zero rows downstream
 * and the engine's documented fallback runs; the engine never errors on it.
 * The 100-link cap is defensive (bounds a hand-rolled PostgREST payload); the
 * picker UI never gets near it.
 */
const productLinksSchema = z
  .array(z.uuid({ error: "That product reference is not valid." }))
  .max(100, { error: "A clip can link at most 100 products." })
  .refine(noDuplicates, { error: "Duplicate product links." });

/** Empty key is stored as null, not "" — absence, not a blank string. */
export const antiRepetitionKeySchema = z
  .string()
  .trim()
  .max(64, { error: "Keep the repetition key under 64 characters." })
  .transform((v, ctx) => {
    if (v === "") return null;
    if (!ANTI_REPETITION_KEY_PATTERN.test(v)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Use a lowercase kebab slug — letters, numbers and single hyphens (e.g. sena-wheel).",
      });
      return z.NEVER;
    }
    return v;
  })
  .nullable();

const thankyouOnlyCheck = (
  tags: { purpose: readonly string[]; page_eligibility: readonly string[] },
  ctx: z.RefinementCtx,
) => {
  if (violatesThankyouOnly(tags)) {
    ctx.addIssue({
      code: "custom",
      message: THANKYOU_ONLY_MESSAGE,
      path: ["purpose"],
    });
    ctx.addIssue({
      code: "custom",
      message: THANKYOU_ONLY_MESSAGE,
      path: ["page_eligibility"],
    });
  }
};

/**
 * The tag-write contract. Field names are snake_case because this IS the
 * `video_profiles` row shape (B0: you write the snake_case table); the
 * parsed output feeds the upsert in actions.ts verbatim. Empty arrays are
 * valid — untagged means INVISIBLE to the engine, which is the safe default.
 */
export const videoProfileWriteSchema = z
  .strictObject({
    purpose: purposeArraySchema,
    page_eligibility: pageEligibilityArraySchema,
    product_links: productLinksSchema,
    mood: moodArraySchema,
    anti_repetition_key: antiRepetitionKeySchema,
  })
  .superRefine(thankyouOnlyCheck);

export type VideoProfileWrite = z.output<typeof videoProfileWriteSchema>;
export type VideoProfileWriteInput = z.input<typeof videoProfileWriteSchema>;

/**
 * The AI TagSuggestion shape (video-engine spec §6.2). A suggestion is ALWAYS
 * a draft: it is never written to `video_profiles` without an explicit seller
 * confirm, and the confirmed write re-validates through
 * `videoProfileWriteSchema` anyway. The thankyou-only refinement applies here
 * too so an invariant-violating proposal is malformed output (ai-pipeline
 * §10.2: structural retry with the validator error fed back), never something
 * a seller sees.
 */
export const tagSuggestionSchema = z
  .strictObject({
    purpose: purposeArraySchema,
    page_eligibility: pageEligibilityArraySchema,
    product_links: productLinksSchema,
    mood: moodArraySchema,
    anti_repetition_key: antiRepetitionKeySchema,
    /** Single 0–1 score; the editor flags the whole suggestion when low. */
    confidence: z.number().min(0).max(1),
  })
  .superRefine(thankyouOnlyCheck);

export type TagSuggestion = z.output<typeof tagSuggestionSchema>;

/** saveVideoProfile is id-keyed — the only valid argument is a uuid. */
export const videoIdSchema = z.uuid({ error: "not a video id" });
