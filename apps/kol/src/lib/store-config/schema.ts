/**
 * Store-config v1.3 — RUNTIME ZOD VALIDATOR (P3, the D4 spine contract).
 *
 * Source of truth: docs/03-system-design/store-config.schema.md (v1.3-LOCKED).
 * Every read/write of `stores.config` passes through `StoreConfigSchema`;
 * `types.ts` is the hand-written compile-time mirror, proven field-identical
 * to `z.infer<typeof StoreConfigSchema>` at the bottom of this file.
 *
 * Owns (validator-owned — the DB cannot check ids inside jsonb, ADR-0001 OQ-2):
 *  - the v1.3 shape exactly (strict objects — unknown keys rejected)
 *  - `theme` discriminated union on `kind`: curated enum rails (D9 layer 1)
 *    apply ONLY to `kind:"curated"`; a `kind:"custom"` theme is never
 *    palette-capped (D15) — its guarantee is the AA gate + critic + approval
 *  - per-block `props` discriminated union on `type` (11 catalog blocks)
 *  - referential integrity WITHIN the object: every `bindings.*` id,
 *    `productLinks`, `mediaIds`, `narrationClipTags`, `avatarMediaId`,
 *    `voiceAnchorClipId`, `approvedSections` resolves. (The Wave-1 write path
 *    additionally cross-checks `media.clips[].id` against owned `videos.id`.)
 *  - structural invariants: exactly one `hero-video`; `blocks` order-
 *    significant with stable unique ids
 *  - custom-theme gate: `kind:"custom"` may not leave `meta.status:"draft"`
 *    without a passing `meta.criticScore`
 *  - AA block-ground rule: midtone ground `"c"` is display-only — rejected on
 *    body-copy blocks (`craft-story`, `contact-cta`)
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared scalars
// ---------------------------------------------------------------------------

/**
 * P9 auto-critic pass bar (ai-pipeline-spec §6: `criticScore ≥ 0.75` to pass;
 * a launch-tunable constant, not hardcoded magic — tune HERE only).
 */
export const CRITIC_PASS_THRESHOLD = 0.75;

const nonEmptyString = z.string().min(1);

/** #rgb or #rrggbb — the 7 custom-palette roles accept any valid hex (D15). */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    error: 'must be a hex color ("#rgb" or "#rrggbb")',
  });

const isoDateTime = z.iso.datetime();

/**
 * Asset URLs (clip/image/voiceover src, poster, captionsSrc) accept ONLY
 * https:// or root-relative "/…" — javascript:, data:, vbscript:, and
 * protocol-relative "//" are rejected (these values reach src attributes).
 */
const assetUrl = z.string().regex(/^(?:https:\/\/\S+|\/(?!\/)\S*)$/, {
  error:
    'asset URL must be https:// or root-relative "/…" — javascript:, data:, vbscript:, and protocol-relative "//" are rejected',
});

/**
 * Font family names reach CSS custom properties — bounded charset (letters,
 * digits, spaces, hyphens, quotes) and ≤ 64 chars, so no CSS metacharacters
 * (";", "{", "(", ":") can ride through a custom theme.
 */
const fontFamilyName = z
  .string()
  .max(64, { error: "font family must be ≤ 64 chars" })
  .regex(/^[A-Za-z0-9 '"-]+$/, {
    error: "font family must contain only letters, digits, spaces, hyphens, or quotes",
  });

// ---------------------------------------------------------------------------
// §2.2 theme — discriminated union on `kind` (D9 rails | D15 seller freedom)
// ---------------------------------------------------------------------------

export const PALETTE_IDS = [
  "sunbaked",
  "market-plum",
  "cuberto-noir",
  "orchard",
  "bazaar",
] as const;

export const FONT_PAIRING_IDS = [
  "statement-grotesk",
  "warm-serif",
  "modern-mono-grotesk",
  "character-maximal",
] as const;

/** Design-system v2 §4.5 — maps to MOTION_INTENSITY 3 / 5 / 7 / 8. */
export const MOTION_PRESETS = ["hushed", "fluid", "liquid", "dimensional"] as const;

export const RADIUS_IDENTITIES = ["sharp", "soft", "round"] as const;
export const DENSITIES = ["airy", "standard"] as const;
export const THEME_MODES = ["light", "dark"] as const;

const themeModeSchema = z.enum(THEME_MODES);

export const CuratedThemeSchema = z.strictObject({
  kind: z.literal("curated"),
  paletteId: z.enum(PALETTE_IDS, {
    error: `theme.paletteId must be a curated design-system v2 palette id (${PALETTE_IDS.join(" | ")})`,
  }),
  mode: themeModeSchema,
  fontPairingId: z.enum(FONT_PAIRING_IDS, {
    error: `theme.fontPairingId must be a curated design-system v2 pairing id (${FONT_PAIRING_IDS.join(" | ")})`,
  }),
  motionPreset: z.enum(MOTION_PRESETS, {
    error: `theme.motionPreset must be a design-system v2 preset (${MOTION_PRESETS.join(" | ")})`,
  }),
  radiusIdentity: z.enum(RADIUS_IDENTITIES),
  density: z.enum(DENSITIES),
});

/**
 * D15: full seller-brand freedom — any-hex roles, catalog font families.
 * The curated-enum invariant deliberately does NOT apply here; never
 * palette-cap a custom theme. The guarantee is the WCAG-AA contrast gate +
 * auto-critic + maker approval (see the custom-theme gate in superRefine).
 */
export const CustomThemeSchema = z.strictObject({
  kind: z.literal("custom"),
  customPalette: z.strictObject({
    mode: themeModeSchema,
    roles: z.strictObject({
      bg: hexColor,
      surface: hexColor,
      ink: hexColor,
      inkMuted: hexColor,
      accent: hexColor,
      accentInk: hexColor,
      border: hexColor,
    }),
  }),
  customPairing: z.strictObject({
    displayFamily: fontFamilyName,
    textFamily: fontFamilyName,
    scaleRatio: z.number().positive(),
    displayWeight: z.number().positive(),
    textWeight: z.number().positive(),
  }),
  motionPreset: z.enum(MOTION_PRESETS),
  radiusIdentity: z.enum(RADIUS_IDENTITIES),
  density: z.enum(DENSITIES),
});

export const ThemeSchema = z.discriminatedUnion("kind", [
  CuratedThemeSchema,
  CustomThemeSchema,
]);

// ---------------------------------------------------------------------------
// §2.1 maker — identity + trust (D7)
// ---------------------------------------------------------------------------

export const MakerSchema = z.strictObject({
  id: nonEmptyString,
  displayName: nonEmptyString,
  handle: nonEmptyString,
  craft: nonEmptyString,
  location: nonEmptyString,
  bio: z.string().max(280, { error: "maker.bio must be ≤ 280 chars (maker's own words)" }),
  avatarMediaId: z.string().nullable(),
  trust: z.strictObject({
    realMaker: z.strictObject({
      status: z.enum(["verified", "pending", "unverified"]),
      verifiedAt: isoDateTime.nullable(),
      voiceAnchorClipId: z.string().nullable(),
    }),
    aiTransparency: z.strictObject({
      level: z.enum(["maker-authored", "ai-assisted", "ai-drafted"]),
      disclosure: nonEmptyString,
      aiAssistedFields: z.array(z.string()),
    }),
  }),
});

// ---------------------------------------------------------------------------
// §2.3 media — clips (D5-tagged) + images
// ---------------------------------------------------------------------------

export const CLIP_PURPOSES = [
  "intro",
  "craft-story",
  "process",
  "product-narration",
  "thankyou",
  "atmosphere",
] as const;

export const PAGE_ELIGIBILITIES = [
  "feed",
  "grown",
  "world",
  "product",
  "checkout",
  "thankyou",
] as const;

export const CLIP_MOODS = ["calm", "warm", "energetic", "intimate"] as const;

/**
 * Config-side mirror for authoring/reference only — canonical source of truth
 * is the `video_profiles` table (ADR-0001 OQ-2); the video engine ignores
 * this inline copy.
 */
export const VideoProfileSchema = z.strictObject({
  purpose: z.array(z.enum(CLIP_PURPOSES)),
  pageEligibility: z.array(z.enum(PAGE_ELIGIBILITIES)),
  productLinks: z.array(z.string()),
  mood: z.array(z.enum(CLIP_MOODS)),
  antiRepetitionKey: nonEmptyString,
});

export const ClipSchema = z.strictObject({
  id: nonEmptyString,
  kind: z.literal("video"),
  src: assetUrl,
  poster: assetUrl,
  durationMs: z.number().int().nonnegative(),
  captionsSrc: assetUrl.nullable(),
  videoProfile: VideoProfileSchema,
});

export const IMAGE_ASPECTS = ["1:1", "4:5", "3:2", "16:9"] as const;

export const StoreImageSchema = z.strictObject({
  id: nonEmptyString,
  src: assetUrl,
  alt: z.string().min(1, { error: "images[].alt is required and never empty (a11y)" }),
  aspect: z.enum(IMAGE_ASPECTS),
  focalPoint: z.strictObject({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
});

export const MediaSchema = z.strictObject({
  clips: z.array(ClipSchema),
  images: z.array(StoreImageSchema),
});

// ---------------------------------------------------------------------------
// §2.4 products
// ---------------------------------------------------------------------------

export const INVENTORY_STATUSES = ["in-stock", "made-to-order", "sold-out"] as const;
export const PRODUCT_BADGES = ["one-of-a-kind", "made-to-order", "limited"] as const;

export const ProductSchema = z.strictObject({
  id: nonEmptyString,
  title: nonEmptyString,
  price: z.strictObject({
    // amount in minor units (pence)
    amount: z.number().int().nonnegative(),
    currency: z.string().regex(/^[A-Z]{3}$/, {
      error: "products[].price.currency must be a 3-letter ISO-4217 code (e.g. GBP)",
    }),
  }),
  description: z.string(),
  mediaIds: z.array(z.string()),
  model3dId: z.string().nullable(),
  narrationClipTags: z.array(z.string()),
  inventory: z.strictObject({
    status: z.enum(INVENTORY_STATUSES),
    qty: z.number().int().nonnegative().nullable(),
  }),
  badges: z.array(z.enum(PRODUCT_BADGES)),
});

// ---------------------------------------------------------------------------
// §2.5 voiceovers — per-element real voice (D10/D11)
// ---------------------------------------------------------------------------

export const VoiceoverSchema = z.strictObject({
  id: nonEmptyString,
  elementRef: z.strictObject({
    kind: z.enum(["block", "product", "field"]),
    id: nonEmptyString,
    field: z.string().nullable(),
  }),
  src: assetUrl,
  durationMs: z.number().int().nonnegative(),
  transcript: z.string().nullable(),
  label: nonEmptyString,
});

// ---------------------------------------------------------------------------
// §2.6 blocks — discriminated union on `type` (11 catalog blocks)
// ---------------------------------------------------------------------------

/**
 * P2-a block grounds. Midtone `"c"` is DISPLAY-ONLY: valid on display blocks
 * (`voice-quote`, `atmosphere`), rejected on body-copy blocks (`craft-story`,
 * `contact-cta`) — the AA constraint. Two schemas, one per class.
 */
const displayBlockGroundSchema = z.enum(["a", "b", "c"]).nullable().optional();
const bodyBlockGroundSchema = z
  .enum(["a", "b"], {
    error:
      'blockGround on body-copy blocks (craft-story, contact-cta) must be "a" | "b" | null — midtone "c" is display-only (AA)',
  })
  .nullable()
  .optional();

export const BlockBindingsSchema = z.strictObject({
  clipTags: z.array(z.string()),
  imageIds: z.array(z.string()),
  productIds: z.array(z.string()),
  voiceoverIds: z.array(z.string()),
});

const blockBase = {
  id: nonEmptyString,
  order: z.number().int().nonnegative(),
  bindings: BlockBindingsSchema,
} as const;

export const HeroVideoBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("hero-video"),
  variant: z.enum(["full-bleed", "center-column", "corner-shrunk"]),
  props: z.strictObject({ showCraftLine: z.boolean() }),
});

export const CraftStoryBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("craft-story"),
  variant: z.enum(["text-left-media-right", "stacked-editorial", "pull-quote"]),
  props: z.strictObject({
    heading: nonEmptyString,
    body: nonEmptyString,
    pullQuote: z.string().optional(),
    blockGround: bodyBlockGroundSchema,
  }),
});

export const ProductShowcaseBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("product-showcase"),
  variant: z.enum(["rail", "masonry", "featured-single"]),
  props: z.strictObject({
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
  }),
});

export const ProductDetailBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("product-detail"),
  variant: z.enum(["image-gallery", "3d-viewer", "video-led"]),
  props: z.strictObject({ showModel3d: z.boolean() }),
});

export const VoiceQuoteBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("voice-quote"),
  variant: z.enum(["audio-tap", "text-only", "text+waveform"]),
  props: z.strictObject({
    quote: nonEmptyString,
    attribution: z.string().optional(),
    blockGround: displayBlockGroundSchema,
  }),
});

export const ProcessReelBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("process-reel"),
  variant: z.enum(["single-reel", "multi-clip-carousel"]),
  props: z.strictObject({ caption: z.string().optional() }),
});

export const ReviewsBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("reviews"),
  variant: z.enum(["list", "rating-summary", "featured-quote"]),
  // Review data itself is live (reviews table), not in store-config.
  props: z.strictObject({
    layout: z.enum(["list", "rating-summary", "featured-quote"]).optional(),
  }),
});

export const TrustBadgeBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("trust-badge"),
  variant: z.enum(["inline-compact", "expandable-detail"]),
  props: z.strictObject({}),
});

export const ThankYouBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("thank-you"),
  variant: z.enum(["video-message", "text+media"]),
  props: z.strictObject({
    /**
     * v1.3 — OPTIONAL maker-authored thank-you words (D10: voice = the
     * maker's OWN words, never AI-generated). Omitted → the renderer falls
     * back to neutral platform copy, never a fabricated quote.
     */
    message: z.string().optional(),
  }),
});

export const AtmosphereBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("atmosphere"),
  variant: z.enum(["color-wash", "block-ground", "image-band", "motion-divider"]),
  props: z.strictObject({
    toneShift: z.enum(["warm", "cool", "neutral"]),
    blockGround: displayBlockGroundSchema,
  }),
});

export const ContactCtaBlockSchema = z.strictObject({
  ...blockBase,
  type: z.literal("contact-cta"),
  variant: z.enum(["button", "card", "footer-strip"]),
  props: z.strictObject({
    label: nonEmptyString,
    blockGround: bodyBlockGroundSchema,
  }),
});

export const StoreBlockSchema = z.discriminatedUnion("type", [
  HeroVideoBlockSchema,
  CraftStoryBlockSchema,
  ProductShowcaseBlockSchema,
  ProductDetailBlockSchema,
  VoiceQuoteBlockSchema,
  ProcessReelBlockSchema,
  ReviewsBlockSchema,
  TrustBadgeBlockSchema,
  ThankYouBlockSchema,
  AtmosphereBlockSchema,
  ContactCtaBlockSchema,
]);

// ---------------------------------------------------------------------------
// §2.7 meta
// ---------------------------------------------------------------------------

export const StoreMetaSchema = z.strictObject({
  version: z.number().int().nonnegative(),
  status: z.enum(["draft", "in_review", "approved", "published"]),
  criticScore: z.number().min(0).max(1),
  approvedSections: z.array(z.string()),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

// ---------------------------------------------------------------------------
// §1 top-level shape + cross-object invariants
// ---------------------------------------------------------------------------

const storeConfigShape = z.strictObject({
  schemaVersion: z.literal("1.3", {
    error: 'schemaVersion must be "1.3" (this validator is the v1.3 contract)',
  }),
  storeId: nonEmptyString,
  maker: MakerSchema,
  theme: ThemeSchema,
  media: MediaSchema,
  products: z.array(ProductSchema),
  voiceovers: z.array(VoiceoverSchema),
  blocks: z.array(StoreBlockSchema),
  meta: StoreMetaSchema,
});

type StoreConfigShape = z.infer<typeof storeConfigShape>;

function collectIds(
  ctx: z.core.$RefinementCtx,
  entries: readonly { id: string }[],
  collection: string,
): Set<string> {
  const ids = new Set<string>();
  entries.forEach((entry, i) => {
    if (ids.has(entry.id)) {
      ctx.addIssue({
        code: "custom",
        path: [...collection.split("."), i, "id"],
        message: `duplicate id "${entry.id}" in ${collection} — ids must be unique so references resolve unambiguously`,
      });
    }
    ids.add(entry.id);
  });
  return ids;
}

function checkRefs(
  ctx: z.core.$RefinementCtx,
  refs: readonly string[],
  known: ReadonlySet<string>,
  path: (string | number)[],
  target: string,
): void {
  refs.forEach((ref, i) => {
    if (!known.has(ref)) {
      ctx.addIssue({
        code: "custom",
        path: [...path, i],
        message: `dangling reference: "${ref}" does not resolve to any ${target}`,
      });
    }
  });
}

/**
 * Referential integrity (OQ-2, validator-owned — Wave 0 validates WITHIN the
 * object; the Wave-1 write path adds the `media.clips[].id` → owned
 * `videos.id` DB cross-check in the same transaction) + structural
 * invariants + the custom-theme critic gate.
 */
function storeConfigInvariants(config: StoreConfigShape, ctx: z.core.$RefinementCtx): void {
  const clipIds = collectIds(ctx, config.media.clips, "media.clips");
  const imageIds = collectIds(ctx, config.media.images, "media.images");
  const productIds = collectIds(ctx, config.products, "products");
  const voiceoverIds = collectIds(ctx, config.voiceovers, "voiceovers");
  const blockIds = collectIds(ctx, config.blocks, "blocks");

  // maker: avatar → images; verified Real-Maker requires a resolved voice anchor (D7)
  const { avatarMediaId, trust } = config.maker;
  if (avatarMediaId !== null && !imageIds.has(avatarMediaId)) {
    ctx.addIssue({
      code: "custom",
      path: ["maker", "avatarMediaId"],
      message: `dangling reference: maker.avatarMediaId "${avatarMediaId}" does not resolve to any media.images[].id`,
    });
  }
  const { status, voiceAnchorClipId } = trust.realMaker;
  if (voiceAnchorClipId !== null && !clipIds.has(voiceAnchorClipId)) {
    ctx.addIssue({
      code: "custom",
      path: ["maker", "trust", "realMaker", "voiceAnchorClipId"],
      message: `dangling reference: voiceAnchorClipId "${voiceAnchorClipId}" does not resolve to any media.clips[].id`,
    });
  } else if (status === "verified" && voiceAnchorClipId === null) {
    ctx.addIssue({
      code: "custom",
      path: ["maker", "trust", "realMaker", "voiceAnchorClipId"],
      message:
        'realMaker.status "verified" requires a resolved voiceAnchorClipId — never a false claim (D7)',
    });
  }

  // clips: product_links → real products (OQ-2)
  config.media.clips.forEach((clip, i) => {
    checkRefs(
      ctx,
      clip.videoProfile.productLinks,
      productIds,
      ["media", "clips", i, "videoProfile", "productLinks"],
      `products[].id (clip "${clip.id}")`,
    );
  });

  // products: gallery images + narration clips resolve
  config.products.forEach((product, i) => {
    checkRefs(ctx, product.mediaIds, imageIds, ["products", i, "mediaIds"], `media.images[].id (product "${product.id}")`);
    checkRefs(
      ctx,
      product.narrationClipTags,
      clipIds,
      ["products", i, "narrationClipTags"],
      `media.clips[].id (product "${product.id}")`,
    );
  });

  // blocks: every bindings.* resolves; exactly one hero-video; unique render order
  const seenOrders = new Map<number, string>();
  let heroCount = 0;
  config.blocks.forEach((block, i) => {
    if (block.type === "hero-video") heroCount += 1;

    const clash = seenOrders.get(block.order);
    if (clash !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["blocks", i, "order"],
        message: `blocks are order-significant: order ${block.order} on block "${block.id}" already used by block "${clash}"`,
      });
    }
    seenOrders.set(block.order, block.id);

    const base: (string | number)[] = ["blocks", i, "bindings"];
    checkRefs(ctx, block.bindings.clipTags, clipIds, [...base, "clipTags"], `media.clips[].id (block "${block.id}")`);
    checkRefs(ctx, block.bindings.imageIds, imageIds, [...base, "imageIds"], `media.images[].id (block "${block.id}")`);
    checkRefs(ctx, block.bindings.productIds, productIds, [...base, "productIds"], `products[].id (block "${block.id}")`);
    checkRefs(
      ctx,
      block.bindings.voiceoverIds,
      voiceoverIds,
      [...base, "voiceoverIds"],
      `voiceovers[].id (block "${block.id}")`,
    );
  });
  if (heroCount !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["blocks"],
      message: `exactly one hero-video block required per world (the persistent film) — found ${heroCount}`,
    });
  }

  // voiceovers: elementRef resolves for block/product kinds ("field" refs are
  // caller-defined; unchecked in Wave 0)
  config.voiceovers.forEach((vo, i) => {
    const { kind, id } = vo.elementRef;
    const known = kind === "block" ? blockIds : kind === "product" ? productIds : null;
    if (known !== null && !known.has(id)) {
      ctx.addIssue({
        code: "custom",
        path: ["voiceovers", i, "elementRef", "id"],
        message: `dangling reference: voiceover "${vo.id}" elementRef "${id}" does not resolve to any ${kind === "block" ? "blocks[].id" : "products[].id"}`,
      });
    }
  });

  // meta: approvals pin to sections by block id (D9 layer 3)
  checkRefs(
    ctx,
    config.meta.approvedSections,
    blockIds,
    ["meta", "approvedSections"],
    "blocks[].id (approvals pin to sections by id)",
  );

  // custom-theme gate (D9→D15): the guarantee for kind:"custom" is the AA
  // gate + critic — status may not leave draft without a passing score
  if (
    config.theme.kind === "custom" &&
    config.meta.status !== "draft" &&
    config.meta.criticScore < CRITIC_PASS_THRESHOLD
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["meta", "status"],
      message: `theme.kind "custom" may not leave meta.status "draft" without a passing meta.criticScore (${config.meta.criticScore} < ${CRITIC_PASS_THRESHOLD})`,
    });
  }
}

export const StoreConfigSchema = storeConfigShape.superRefine(storeConfigInvariants);

// ---------------------------------------------------------------------------
// z.infer exports — the runtime-derived contract
// ---------------------------------------------------------------------------

export type StoreConfigZ = z.infer<typeof StoreConfigSchema>;
export type ThemeZ = z.infer<typeof ThemeSchema>;
export type CuratedThemeZ = z.infer<typeof CuratedThemeSchema>;
export type CustomThemeZ = z.infer<typeof CustomThemeSchema>;
export type MakerZ = z.infer<typeof MakerSchema>;
export type MediaZ = z.infer<typeof MediaSchema>;
export type ClipZ = z.infer<typeof ClipSchema>;
export type StoreImageZ = z.infer<typeof StoreImageSchema>;
export type ProductZ = z.infer<typeof ProductSchema>;
export type VoiceoverZ = z.infer<typeof VoiceoverSchema>;
export type StoreBlockZ = z.infer<typeof StoreBlockSchema>;
export type StoreMetaZ = z.infer<typeof StoreMetaSchema>;

// ---------------------------------------------------------------------------
// Compile-time proof: z.infer ≡ types.ts (strict type IDENTITY via the
// invariant-function trick — catches optional-property drift, not just
// assignability). If either side drifts from v1.3, `pnpm typecheck` fails.
// ---------------------------------------------------------------------------

import type {
  Clip,
  CuratedTheme,
  CustomTheme,
  Maker,
  Media,
  Product,
  StoreBlock,
  StoreConfig,
  StoreImage,
  StoreMeta,
  Theme,
  Voiceover,
} from "./types";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

export type _ContractProof = [
  Expect<Equal<StoreConfigZ, StoreConfig>>,
  Expect<Equal<ThemeZ, Theme>>,
  Expect<Equal<CuratedThemeZ, CuratedTheme>>,
  Expect<Equal<CustomThemeZ, CustomTheme>>,
  Expect<Equal<MakerZ, Maker>>,
  Expect<Equal<MediaZ, Media>>,
  Expect<Equal<ClipZ, Clip>>,
  Expect<Equal<StoreImageZ, StoreImage>>,
  Expect<Equal<ProductZ, Product>>,
  Expect<Equal<VoiceoverZ, Voiceover>>,
  Expect<Equal<StoreBlockZ, StoreBlock>>,
  Expect<Equal<StoreMetaZ, StoreMeta>>,
];

// ---------------------------------------------------------------------------
// Validation helpers — the two entry points callers use
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; config: StoreConfigZ }
  | { ok: false; errors: { path: string; message: string }[] };

/**
 * Validate an unknown value as a store-config v1.3 object. Never throws;
 * errors name the exact failing key/id so a co-editor can act (P3 UX note).
 */
export function validateStoreConfig(input: unknown): ValidationResult {
  const result = StoreConfigSchema.safeParse(input);
  if (result.success) {
    return { ok: true, config: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}

/** Throwing variant for trusted call sites (fixtures, tests, seed scripts). */
export function parseStoreConfig(input: unknown): StoreConfigZ {
  return StoreConfigSchema.parse(input);
}
