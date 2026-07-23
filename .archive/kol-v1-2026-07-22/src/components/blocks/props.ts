import type { z } from "zod";
import {
  AtmosphereBlockSchema,
  ContactCtaBlockSchema,
  CraftStoryBlockSchema,
  HeroVideoBlockSchema,
  ProcessReelBlockSchema,
  ProductDetailBlockSchema,
  ProductShowcaseBlockSchema,
  ReviewsBlockSchema,
  ThankYouBlockSchema,
  TrustBadgeBlockSchema,
  VoiceQuoteBlockSchema,
} from "@/lib/store-config/schema";
import type { BlockType } from "@/lib/store-config/types";

/**
 * Per-type schema surface for the block library — RE-EXPORTED from P3's
 * frozen v1.3 discriminated union (schema.ts), never authored in parallel.
 * This is the library-side lookup the editor/AI-drafter use to validate one
 * block's shape without parsing a whole store-config; the AA block-ground
 * constraint (midtone "c" rejected on body-copy craft-story/contact-cta,
 * accepted on display voice-quote/atmosphere) lives inside these schemas.
 */
export const blockSchemaByType = {
  "hero-video": HeroVideoBlockSchema,
  "craft-story": CraftStoryBlockSchema,
  "product-showcase": ProductShowcaseBlockSchema,
  "product-detail": ProductDetailBlockSchema,
  "voice-quote": VoiceQuoteBlockSchema,
  "process-reel": ProcessReelBlockSchema,
  reviews: ReviewsBlockSchema,
  "trust-badge": TrustBadgeBlockSchema,
  "thank-you": ThankYouBlockSchema,
  atmosphere: AtmosphereBlockSchema,
  "contact-cta": ContactCtaBlockSchema,
} as const satisfies Record<BlockType, z.ZodType>;

/** Just the `props` shape of each type — for per-field editor validation. */
export const blockPropsSchemaByType = {
  "hero-video": HeroVideoBlockSchema.shape.props,
  "craft-story": CraftStoryBlockSchema.shape.props,
  "product-showcase": ProductShowcaseBlockSchema.shape.props,
  "product-detail": ProductDetailBlockSchema.shape.props,
  "voice-quote": VoiceQuoteBlockSchema.shape.props,
  "process-reel": ProcessReelBlockSchema.shape.props,
  reviews: ReviewsBlockSchema.shape.props,
  "trust-badge": TrustBadgeBlockSchema.shape.props,
  "thank-you": ThankYouBlockSchema.shape.props,
  atmosphere: AtmosphereBlockSchema.shape.props,
  "contact-cta": ContactCtaBlockSchema.shape.props,
} as const satisfies Record<BlockType, z.ZodType>;

export type BlockPropsValidation =
  | { ok: true }
  | { ok: false; errors: { path: string; message: string }[] };

/**
 * Validate a candidate `props` object against one block type's schema.
 * Wrong-shape props for a type are rejected (strict objects — unknown keys
 * fail too). Never throws; errors name the failing key (P3 UX rule).
 */
export function validateBlockProps(type: BlockType, props: unknown): BlockPropsValidation {
  const result = blockPropsSchemaByType[type].safeParse(props);
  if (result.success) return { ok: true };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}
