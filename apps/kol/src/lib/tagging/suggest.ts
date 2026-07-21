import "server-only";

import {
  LlmCallError,
  LlmUnavailableError,
  isLlmConfigured,
  runLlmCall,
} from "@/lib/agents/llm";

import {
  MOOD,
  PAGE_ELIGIBILITY,
  PURPOSE,
  tagSuggestionSchema,
  type TagSuggestion,
} from "./schemas";

/**
 * AI-assisted tagging (spec P7 / video-engine spec §6.2): a Haiku
 * `TagSuggestion` from the clip's WebVTT captions + duration + store/brand
 * context. Classification over a fixed enum set is a simple, short,
 * structured task — Haiku is the right tier (CLAUDE.md routing); escalate to
 * Sonnet only if the accuracy eval fails.
 *
 * A suggestion is ALWAYS a draft: it is never written to `video_profiles`
 * without an explicit seller confirm, and the confirmed write re-validates
 * through `videoProfileWriteSchema` (the trust boundary in schemas.ts).
 */

export const TAGGING_FEATURE = "video-profile-tagging";
export const TAGGING_MODEL = "claude-haiku-4-5";

/** Malformed output → structural retry with the Zod error fed back, max 2
 * (ai-pipeline §10.2), then degrade to manual. */
const MAX_STRUCTURAL_RETRIES = 2;

export type SuggestClipInput = {
  captionsSrc: string | null;
  durationMs: number | null;
  store: { name: string; craft: string | null; bio: string | null } | null;
  products: { id: string; title: string; description: string | null }[];
};

export type SuggestOutcome =
  | { status: "ok"; suggestion: TagSuggestion; costUsd: number }
  | {
      status: "unavailable";
      reason:
        | "not-configured"
        | "overloaded"
        | "malformed"
        | "error";
      message: string;
      costUsd: number;
    };

/**
 * The STABLE system block — role, the frozen enum definitions, the
 * thankyou-only constraint, output rules, and four few-shot examples. It is
 * identical for every clip, so it carries `cache_control: ephemeral` and
 * reuses at ~10% input cost across a tagging session (§6.2). Anything
 * per-clip goes in the user message, never here.
 */
const SYSTEM_PROMPT = `You tag maker footage for KOL, a video-native maker marketplace. Sellers upload short film clips of their craft; your tags decide where each clip may appear. A seller always reviews and confirms your suggestion before anything is saved — suggest honestly and conservatively.

## Tag vocabulary (FROZEN — use these exact lowercase kebab-case strings and no others)

purpose — what the clip is (multiple allowed):
- "intro": the maker introduces themself or their studio
- "craft-story": the story, history, or philosophy behind the craft
- "process": making, shaping, firing, assembling — hands at work
- "product-narration": the maker talks about one or more specific products
- "thankyou": a closing thank-you / gratitude message to a buyer
- "atmosphere": ambient studio footage, texture, mood — little or no speech

page_eligibility — where the clip may appear (multiple allowed):
- "feed": the public discovery feed
- "grown": a buyer's grown/personalised space
- "world": the maker's store world
- "product": a product page
- "checkout": the checkout flow
- "thankyou": the post-purchase thank-you moment

mood — how the clip feels (multiple allowed): "calm", "warm", "energetic", "intimate"

product_links — ids of products the clip clearly narrates or shows. Use ONLY ids from the provided product list. If the reference is ambiguous or the product is not in the list, leave it out.

anti_repetition_key — a short lowercase kebab slug naming the clip's dominant subject (e.g. "sena-wheel"); clips sharing a key are not repeated in one visit. Use "" if nothing distinctive.

confidence — one number, 0 to 1, for the suggestion as a whole. When unsure, LOWER the confidence rather than guessing.

## THE THANKYOU-ONLY CONSTRAINT (locked — never violate)

If a clip is a thank-you/closing-gratitude message, it MUST be tagged purpose: ["thankyou"] and page_eligibility: ["thankyou"] — both exactly that single value, nothing else. NEVER propose "feed" (or any other page) for a thank-you clip. This is a hard platform rule, not a preference.

## Degrade, don't hallucinate

If the transcript is empty or missing, tag only what the provided context safely supports. Prefer empty arrays and low confidence over invented tags. An untagged clip is safe; a wrongly tagged one is not.

## Output

Output ONLY a valid JSON object with exactly these keys: purpose, page_eligibility, product_links, mood, anti_repetition_key, confidence. No prose, no markdown fences, no trailing commentary.

## Examples

Input: store "Sena Ceramics" (craft: ceramics); products: [{"id":"11111111-1111-4111-8111-111111111111","title":"Stoneware mug"}]; duration 34s; transcript: "Hi, I'm Sena. This is my little studio by the canal, where every piece starts as a lump of grey clay."
Output: {"purpose":["intro"],"page_eligibility":["feed","world"],"product_links":[],"mood":["warm"],"anti_repetition_key":"sena-studio-intro","confidence":0.9}

Input: store "Sena Ceramics" (craft: ceramics); products: [{"id":"11111111-1111-4111-8111-111111111111","title":"Stoneware mug"}]; duration 58s; transcript: "The wheel spins at about two hundred revolutions. You centre the clay, open it, and pull the wall up in three passes."
Output: {"purpose":["process"],"page_eligibility":["feed","world","grown"],"product_links":[],"mood":["calm"],"anti_repetition_key":"sena-wheel","confidence":0.85}

Input: store "Sena Ceramics" (craft: ceramics); products: [{"id":"11111111-1111-4111-8111-111111111111","title":"Stoneware mug"},{"id":"22222222-2222-4222-8222-222222222222","title":"Ash-glaze vase"}]; duration 41s; transcript: "This stoneware mug holds exactly a double espresso and a splash. The glaze breaks amber where the rim curves."
Output: {"purpose":["product-narration"],"page_eligibility":["world","product"],"product_links":["11111111-1111-4111-8111-111111111111"],"mood":["warm","intimate"],"anti_repetition_key":"stoneware-mug","confidence":0.9}

Input: store "Sena Ceramics" (craft: ceramics); products: []; duration 19s; transcript: "Thank you — truly. Every order keeps this wheel turning, and I made this piece thinking of whoever would open the box."
Output: {"purpose":["thankyou"],"page_eligibility":["thankyou"],"product_links":[],"mood":["intimate","warm"],"anti_repetition_key":"sena-thankyou","confidence":0.95}`;

function formatDuration(durationMs: number | null): string {
  if (durationMs === null || durationMs <= 0) return "unknown duration";
  return `${Math.round(durationMs / 1000)}s`;
}

/** Builds the per-clip user message — everything volatile lives here so the
 * system block above stays byte-stable for the prompt cache. */
export function buildClipMessage(input: SuggestClipInput): string {
  const store = input.store
    ? `store "${input.store.name}"${input.store.craft ? ` (craft: ${input.store.craft})` : ""}${input.store.bio ? `; about: ${input.store.bio}` : ""}`
    : "store: unknown";
  const products = JSON.stringify(
    input.products.map((p) => ({
      id: p.id,
      title: p.title,
      ...(p.description ? { description: p.description } : {}),
    })),
  );
  const transcript =
    input.captionsSrc && input.captionsSrc.trim() !== ""
      ? input.captionsSrc
      : "(no transcript — captions are empty or missing)";
  return `${store}\nproducts: ${products}\nduration: ${formatDuration(input.durationMs)}\ntranscript (WebVTT):\n${transcript}`;
}

/** The model sometimes wraps JSON in fences despite instructions — strip
 * them before parsing rather than failing the structural check on style. */
function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  return (fenced?.[1] ?? text).trim();
}

export async function suggestTags(
  input: SuggestClipInput,
): Promise<SuggestOutcome> {
  if (!isLlmConfigured()) {
    return {
      status: "unavailable",
      reason: "not-configured",
      message: "AI suggestions aren't set up in this environment yet.",
      costUsd: 0,
    };
  }

  const knownProductIds = new Set(input.products.map((p) => p.id));
  const messages: {
    role: "user" | "assistant";
    content: string;
  }[] = [{ role: "user", content: buildClipMessage(input) }];

  let costUsd = 0;
  for (let attempt = 0; attempt <= MAX_STRUCTURAL_RETRIES; attempt++) {
    let text: string;
    try {
      const result = await runLlmCall({
        feature: TAGGING_FEATURE,
        model: TAGGING_MODEL,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            // Stable block — reused across every clip at cache-read cost.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
        maxTokens: 512,
        temperature: 0,
      });
      text = result.text;
      costUsd += result.log.cost_usd;
    } catch (error: unknown) {
      if (error instanceof LlmUnavailableError) {
        return {
          status: "unavailable",
          reason: "overloaded",
          message: error.message,
          costUsd,
        };
      }
      // LlmCallError and anything unexpected: typed, logged in llm.ts,
      // degraded here — a failed suggestion never blocks the seller.
      return {
        status: "unavailable",
        reason: "error",
        message:
          error instanceof LlmCallError
            ? error.message
            : "The suggestion call failed unexpectedly.",
        costUsd,
      };
    }

    const parsed = tagSuggestionSchema.safeParse(
      (() => {
        try {
          return JSON.parse(extractJson(text)) as unknown;
        } catch {
          return null;
        }
      })(),
    );

    if (parsed.success) {
      return {
        status: "ok",
        suggestion: {
          ...parsed.data,
          // Belt-and-braces on the prompt rule: a suggested link outside the
          // provided product list is a hallucination — drop it server-side.
          product_links: parsed.data.product_links.filter((id) =>
            knownProductIds.has(id),
          ),
        },
        costUsd,
      };
    }

    // Structural retry (§10.2): feed the validator error back so the model
    // can correct shape/values — including a thankyou-only violation, which
    // tagSuggestionSchema rejects so an invalid proposal never reaches the
    // seller.
    messages.push(
      { role: "assistant", content: text },
      {
        role: "user",
        content: `Your output failed validation. Fix it and output ONLY the corrected JSON object.\nValidation errors:\n${JSON.stringify(parsed.error.issues)}`,
      },
    );
  }

  return {
    status: "unavailable",
    reason: "malformed",
    message: "The model couldn't produce valid tags for this clip.",
    costUsd,
  };
}
