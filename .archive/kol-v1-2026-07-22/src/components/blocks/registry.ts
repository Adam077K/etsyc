import type { ComponentType } from "react";
import type { BlockType } from "@/lib/store-config/types";
import type { BlockProps } from "./shared";
import { HeroVideoBlock } from "./hero-video";
import { CraftStoryBlock } from "./craft-story";
import { ProductShowcaseBlock } from "./product-showcase";
import { ProductDetailBlock } from "./product-detail";
import { VoiceQuoteBlock } from "./voice-quote";
import { ProcessReelBlock } from "./process-reel";
import { ReviewsBlock } from "./reviews";
import { TrustBadgeBlock } from "./trust-badge";
import { ThankYouBlock } from "./thank-you";
import { AtmosphereBlock } from "./atmosphere";
import { ContactCtaBlock } from "./contact-cta";

/**
 * type → component map, the D4 seam: `blocks[].type` is the only thing the
 * renderer needs to compose a world. Adding a 12th block = one component +
 * one entry here (+ the catalog/schema updates that gate it).
 */
export const blockRegistry: { [K in BlockType]: ComponentType<BlockProps<K>> } = {
  "hero-video": HeroVideoBlock,
  "craft-story": CraftStoryBlock,
  "product-showcase": ProductShowcaseBlock,
  "product-detail": ProductDetailBlock,
  "voice-quote": VoiceQuoteBlock,
  "process-reel": ProcessReelBlock,
  reviews: ReviewsBlock,
  "trust-badge": TrustBadgeBlock,
  "thank-you": ThankYouBlock,
  atmosphere: AtmosphereBlock,
  "contact-cta": ContactCtaBlock,
};
