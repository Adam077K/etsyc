/**
 * Store-config v1.2 — TYPES ONLY.
 *
 * Mirrors docs/03-system-design/store-config.schema.md exactly. The runtime
 * Zod validator is a P3 backend deliverable; this file is the frontend's
 * compile-time contract and must stay field-for-field in sync with the doc.
 * Enum ids are design-system v2 — no v1 aliases exist anywhere.
 */

// ---------------------------------------------------------------------------
// §2.2 theme — discriminated union on `kind` (D9 rails | D15 seller freedom)
// ---------------------------------------------------------------------------

export type PaletteId =
  | "sunbaked"
  | "market-plum"
  | "cuberto-noir"
  | "orchard"
  | "bazaar";

export type FontPairingId =
  | "statement-grotesk"
  | "warm-serif"
  | "modern-mono-grotesk"
  | "character-maximal";

/** §4.5 — maps to MOTION_INTENSITY 3 / 5 / 7 / 8. */
export type MotionPreset = "hushed" | "fluid" | "liquid" | "dimensional";

export type ThemeMode = "light" | "dark";
export type RadiusIdentity = "sharp" | "soft" | "round";
export type Density = "airy" | "standard";

export interface CuratedTheme {
  kind: "curated";
  paletteId: PaletteId;
  mode: ThemeMode;
  fontPairingId: FontPairingId;
  motionPreset: MotionPreset;
  radiusIdentity: RadiusIdentity;
  density: Density;
}

/** The 7 required any-hex roles of a seller-brand palette (D15). */
export interface CustomPaletteRoles {
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentInk: string;
  border: string;
}

export interface CustomTheme {
  kind: "custom";
  customPalette: {
    mode: ThemeMode;
    roles: CustomPaletteRoles;
  };
  customPairing: {
    /** From the hosted font catalog (AI-pipeline §5.5). */
    displayFamily: string;
    textFamily: string;
    scaleRatio: number;
    displayWeight: number;
    textWeight: number;
  };
  motionPreset: MotionPreset;
  radiusIdentity: RadiusIdentity;
  density: Density;
}

export type Theme = CuratedTheme | CustomTheme;

// ---------------------------------------------------------------------------
// §2.1 maker — identity + trust (D7)
// ---------------------------------------------------------------------------

export interface Maker {
  id: string;
  displayName: string;
  handle: string;
  craft: string;
  location: string;
  /** Maker's own words, ≤ 280 chars. */
  bio: string;
  avatarMediaId: string | null;
  trust: {
    realMaker: {
      status: "verified" | "pending" | "unverified";
      verifiedAt: string | null;
      voiceAnchorClipId: string | null;
    };
    aiTransparency: {
      level: "maker-authored" | "ai-assisted" | "ai-drafted";
      disclosure: string;
      aiAssistedFields: string[];
    };
  };
}

// ---------------------------------------------------------------------------
// §2.3 media — clips (D5-tagged) + images
// ---------------------------------------------------------------------------

export type ClipPurpose =
  | "intro"
  | "craft-story"
  | "process"
  | "product-narration"
  | "thankyou"
  | "atmosphere";

export type PageEligibility =
  | "feed"
  | "grown"
  | "world"
  | "product"
  | "checkout"
  | "thankyou";

export type ClipMood = "calm" | "warm" | "energetic" | "intimate";

/**
 * Config-side mirror for authoring/reference only — the canonical source of
 * truth is the `video_profiles` table (ADR-0001 OQ-2); the video engine
 * ignores this inline copy.
 */
export interface VideoProfile {
  purpose: ClipPurpose[];
  pageEligibility: PageEligibility[];
  productLinks: string[];
  mood: ClipMood[];
  antiRepetitionKey: string;
}

export interface Clip {
  id: string;
  kind: "video";
  src: string;
  poster: string;
  durationMs: number;
  /** WebVTT — accessibility. */
  captionsSrc: string | null;
  videoProfile: VideoProfile;
}

export type ImageAspect = "1:1" | "4:5" | "3:2" | "16:9";

export interface StoreImage {
  id: string;
  src: string;
  /** Required — accessibility, never empty. */
  alt: string;
  aspect: ImageAspect;
  /** 0–1, for art-directed cropping. */
  focalPoint: { x: number; y: number };
}

export interface Media {
  clips: Clip[];
  images: StoreImage[];
}

// ---------------------------------------------------------------------------
// §2.4 products
// ---------------------------------------------------------------------------

export type InventoryStatus = "in-stock" | "made-to-order" | "sold-out";
export type ProductBadge = "one-of-a-kind" | "made-to-order" | "limited";

export interface Product {
  id: string;
  title: string;
  /** amount in minor units (pence). */
  price: { amount: number; currency: string };
  description: string;
  mediaIds: string[];
  model3dId: string | null;
  narrationClipTags: string[];
  inventory: { status: InventoryStatus; qty: number | null };
  badges: ProductBadge[];
}

// ---------------------------------------------------------------------------
// §2.5 voiceovers — per-element real voice (D10/D11)
// ---------------------------------------------------------------------------

export interface Voiceover {
  id: string;
  elementRef: {
    kind: "block" | "product" | "field";
    id: string;
    field: string | null;
  };
  src: string;
  durationMs: number;
  transcript: string | null;
  /** Buyer-facing: "Hear Sena on this glaze". */
  label: string;
}

// ---------------------------------------------------------------------------
// §2.6 blocks — the ordered world (discriminated union on `type`)
// ---------------------------------------------------------------------------

export type BlockType =
  | "hero-video"
  | "craft-story"
  | "product-showcase"
  | "product-detail"
  | "voice-quote"
  | "process-reel"
  | "reviews"
  | "trust-badge"
  | "thank-you"
  | "atmosphere"
  | "contact-cta";

/** P2-a — optional full-bleed color-block ground on 4 block types. */
export type BlockGround = "a" | "b" | "c" | null;

export interface BlockBindings {
  /** Hint set for the video engine (engine still owns selection). */
  clipTags: string[];
  imageIds: string[];
  productIds: string[];
  voiceoverIds: string[];
}

interface BlockBase {
  /** Stable across edits — approvals/critic scores pin to it. */
  id: string;
  /** Render sequence. */
  order: number;
  bindings: BlockBindings;
}

export interface HeroVideoBlock extends BlockBase {
  type: "hero-video";
  variant: "full-bleed" | "center-column" | "corner-shrunk";
  props: { showCraftLine: boolean };
}

export interface CraftStoryBlock extends BlockBase {
  type: "craft-story";
  variant: "text-left-media-right" | "stacked-editorial" | "pull-quote";
  props: {
    heading: string;
    body: string;
    pullQuote?: string;
    /** Dark grounds only for body copy — midtone --block-c rejected here. */
    blockGround?: BlockGround;
  };
}

export interface ProductShowcaseBlock extends BlockBase {
  type: "product-showcase";
  variant: "rail" | "masonry" | "featured-single";
  props: { eyebrow?: string; heading?: string };
}

export interface ProductDetailBlock extends BlockBase {
  type: "product-detail";
  variant: "image-gallery" | "3d-viewer" | "video-led";
  props: { showModel3d: boolean };
}

export interface VoiceQuoteBlock extends BlockBase {
  type: "voice-quote";
  variant: "audio-tap" | "text-only" | "text+waveform";
  props: {
    quote: string;
    attribution?: string;
    /** Display-type block — all three grounds valid, incl. midtone --block-c. */
    blockGround?: BlockGround;
  };
}

export interface ProcessReelBlock extends BlockBase {
  type: "process-reel";
  variant: "single-reel" | "multi-clip-carousel";
  props: { caption?: string };
}

export interface ReviewsBlock extends BlockBase {
  type: "reviews";
  variant: "list" | "rating-summary" | "featured-quote";
  /** Review data itself is live (reviews table), not in store-config. */
  props: { layout?: "list" | "rating-summary" | "featured-quote" };
}

export interface TrustBadgeBlock extends BlockBase {
  type: "trust-badge";
  variant: "inline-compact" | "expandable-detail";
  props: Record<string, never>;
}

export interface ThankYouBlock extends BlockBase {
  type: "thank-you";
  variant: "video-message" | "text+media";
  props: Record<string, never>;
}

export interface AtmosphereBlock extends BlockBase {
  type: "atmosphere";
  variant: "color-wash" | "block-ground" | "image-band" | "motion-divider";
  props: {
    toneShift: "warm" | "cool" | "neutral";
    blockGround?: BlockGround;
  };
}

export interface ContactCtaBlock extends BlockBase {
  type: "contact-cta";
  variant: "button" | "card" | "footer-strip";
  props: {
    label: string;
    /** Body/UI copy — dark grounds only, midtone --block-c rejected. */
    blockGround?: BlockGround;
  };
}

export type StoreBlock =
  | HeroVideoBlock
  | CraftStoryBlock
  | ProductShowcaseBlock
  | ProductDetailBlock
  | VoiceQuoteBlock
  | ProcessReelBlock
  | ReviewsBlock
  | TrustBadgeBlock
  | ThankYouBlock
  | AtmosphereBlock
  | ContactCtaBlock;

/** Narrow a block union member by its `type` discriminant. */
export type BlockOfType<K extends BlockType> = Extract<StoreBlock, { type: K }>;

// ---------------------------------------------------------------------------
// §2.7 meta + §1 top-level shape
// ---------------------------------------------------------------------------

export interface StoreMeta {
  version: number;
  status: "draft" | "in_review" | "approved" | "published";
  /** P9 auto-critic, 0–1; below threshold → regen (D9 layer 2). */
  criticScore: number;
  /** P10 section-by-section human gate (D9 layer 3). */
  approvedSections: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfig {
  schemaVersion: string;
  storeId: string;
  maker: Maker;
  theme: Theme;
  media: Media;
  products: Product[];
  voiceovers: Voiceover[];
  /** ORDERED array — the world, top to bottom. Exactly one hero-video. */
  blocks: StoreBlock[];
  meta: StoreMeta;
}
