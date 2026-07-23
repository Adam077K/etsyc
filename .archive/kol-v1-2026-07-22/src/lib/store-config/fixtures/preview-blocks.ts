import type { ReviewEntry } from "@/components/blocks/reviews";
import type { BlockBindings, ClipPurpose, StoreBlock, StoreConfig } from "../types";

/**
 * /preview 4-state matrix source — one representative block per catalog type,
 * derived from the SELECTED fixture so every binding resolves against its own
 * data and the matrix renders under BOTH theme.kind paths (curated + custom).
 * Blocks the fixture's world already composes are reused verbatim (real
 * maker-authored props beat synthesized copy); missing types are synthesized
 * from the fixture's media/products/voiceovers. Synthesized text is always
 * the maker's own words (bio / voiceover transcript) — never invented quotes
 * (D10 voice honesty).
 */
export function matrixBlocksFor(config: StoreConfig): StoreBlock[] {
  const types: StoreBlock["type"][] = [
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
  return types.map((type, order) => {
    const existing = config.blocks.find((block) => block.type === type);
    const block = existing ?? synthesize(type, config);
    return { ...block, order } as StoreBlock;
  });
}

const noBindings: BlockBindings = { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] };

function clipsFor(config: StoreConfig, purpose: ClipPurpose): string[] {
  const tagged = config.media.clips
    .filter((clip) => clip.videoProfile.purpose.includes(purpose))
    .map((clip) => clip.id);
  return tagged;
}

/** Purpose-tagged clips, falling back to any clip (never a dangling id). */
function clipsOrAny(config: StoreConfig, purpose: ClipPurpose): string[] {
  const tagged = clipsFor(config, purpose);
  if (tagged.length > 0) return tagged;
  const first = config.media.clips[0];
  return first ? [first.id] : [];
}

function synthesize(type: StoreBlock["type"], config: StoreConfig): StoreBlock {
  const { maker, media, products, voiceovers } = config;
  const id = `mx_${type}`;
  const base = { id, order: 0 };
  const firstProduct = products[0];
  const firstImage = media.images[0];
  const portraitId = maker.avatarMediaId ?? firstImage?.id;

  switch (type) {
    case "hero-video":
      return {
        ...base,
        type,
        variant: "center-column",
        props: { showCraftLine: true },
        bindings: { ...noBindings, clipTags: clipsOrAny(config, "intro") },
      };
    case "craft-story":
      // maker's own words only: craft line as the heading, bio as the body
      return {
        ...base,
        type,
        variant: "text-left-media-right",
        props: { heading: maker.craft, body: maker.bio },
        bindings: { ...noBindings, imageIds: portraitId ? [portraitId] : [] },
      };
    case "product-showcase":
      return {
        ...base,
        type,
        variant: "rail",
        props: { eyebrow: maker.craft, heading: `From ${maker.displayName.split(" ")[0]}’s bench` },
        bindings: {
          ...noBindings,
          productIds: products.map((product) => product.id),
          voiceoverIds: voiceovers
            .filter((vo) => vo.elementRef.kind === "product")
            .map((vo) => vo.id),
        },
      };
    case "product-detail":
      return {
        ...base,
        type,
        variant: "image-gallery",
        props: { showModel3d: false },
        bindings: {
          ...noBindings,
          productIds: firstProduct ? [firstProduct.id] : [],
          clipTags: firstProduct?.narrationClipTags ?? [],
          voiceoverIds: voiceovers
            .filter((vo) => vo.elementRef.kind === "product" && vo.elementRef.id === firstProduct?.id)
            .map((vo) => vo.id),
        },
      };
    case "voice-quote": {
      const spoken = voiceovers.find((vo) => vo.transcript !== null);
      return {
        ...base,
        type,
        variant: "text+waveform",
        props: {
          quote: spoken?.transcript ?? maker.bio.split(/(?<=\.)\s/)[0] ?? maker.bio,
          attribution: maker.displayName,
          blockGround: "a",
        },
        bindings: { ...noBindings, voiceoverIds: spoken ? [spoken.id] : [] },
      };
    }
    case "process-reel":
      return {
        ...base,
        type,
        variant: "single-reel",
        props: { caption: maker.craft },
        bindings: { ...noBindings, clipTags: clipsOrAny(config, "process") },
      };
    case "reviews":
      return { ...base, type, variant: "list", props: { layout: "list" }, bindings: noBindings };
    case "trust-badge": {
      const anchor = maker.trust.realMaker.voiceAnchorClipId;
      return {
        ...base,
        type,
        variant: "expandable-detail",
        props: {},
        bindings: { ...noBindings, clipTags: anchor ? [anchor] : [] },
      };
    }
    case "thank-you":
      // no clip → the designed text+media fallback IS the success state
      return {
        ...base,
        type,
        variant: "video-message",
        props: {},
        bindings: { ...noBindings, clipTags: clipsFor(config, "thankyou") },
      };
    case "atmosphere":
      return {
        ...base,
        type,
        variant: "block-ground",
        props: { toneShift: "warm", blockGround: "b" },
        bindings: noBindings,
      };
    case "contact-cta":
      return {
        ...base,
        type,
        variant: "footer-strip",
        props: { label: `Message ${maker.displayName.split(" ")[0]}`, blockGround: "a" },
        bindings: noBindings,
      };
  }
}

/** Live review data is a P4 backend table (catalog §7) — matrix wire-shape mock. */
export const previewReviews: ReviewEntry[] = [
  {
    id: "rv_1",
    author: "Amara O.",
    rating: 5,
    date: "3 June 2026",
    body: "The ridge is exactly where your thumb wants to rest. Tea tastes different out of something this considered.",
  },
  {
    id: "rv_2",
    author: "Jonas K.",
    rating: 4,
    date: "22 May 2026",
    body: "Glaze pooled darker on mine than the photos — Sena warned me it would, and it's the best thing about it.",
  },
  {
    id: "rv_3",
    author: "Priya S.",
    rating: 5,
    date: "9 May 2026",
    body: "Arrived wrapped in her father's workshop shavings. The bowl is now the table's centre of gravity.",
  },
];
