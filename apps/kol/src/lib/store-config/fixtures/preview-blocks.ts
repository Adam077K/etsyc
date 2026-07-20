import type { ReviewEntry } from "@/components/blocks/reviews";
import type { StoreBlock } from "../types";

/**
 * /preview 4-state matrix coverage — one representative block per catalog
 * type (the Sena world exercises 7 of 11; these fill product-detail,
 * voice-quote, reviews, thank-you and pin variants worth screenshotting).
 * All bindings resolve against the Sena fixture's data.
 */
export const previewBlocks: StoreBlock[] = [
  {
    id: "pv_hero",
    type: "hero-video",
    variant: "center-column",
    order: 0,
    props: { showCraftLine: true },
    bindings: { clipTags: ["clip_intro"], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_story",
    type: "craft-story",
    variant: "text-left-media-right",
    order: 1,
    props: {
      heading: "Ash from my father’s workshop",
      body: "The glaze on every piece starts as swept ash from the floor of my father’s carpentry shop in Lagos. I sieve it, wash it, and fire it to 1280°C.",
    },
    bindings: { imageIds: ["img_sena_portrait"], clipTags: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_show",
    type: "product-showcase",
    variant: "rail",
    order: 2,
    props: { eyebrow: "From the kiln", heading: "Small batches, fired weekly" },
    bindings: {
      productIds: ["p_ridge_tumbler", "p_ash_bowl"],
      voiceoverIds: ["vo_glaze"],
      clipTags: [],
      imageIds: [],
    },
  },
  {
    id: "pv_detail",
    type: "product-detail",
    variant: "image-gallery",
    order: 3,
    props: { showModel3d: false },
    bindings: {
      productIds: ["p_ridge_tumbler"],
      voiceoverIds: ["vo_glaze"],
      clipTags: ["clip_tumbler"],
      imageIds: [],
    },
  },
  {
    id: "pv_quote",
    type: "voice-quote",
    variant: "text+waveform",
    order: 4,
    props: {
      quote: "The wheel leaves a mark. I leave it in.",
      attribution: "Sena, on the ridge",
      blockGround: "a",
    },
    bindings: { voiceoverIds: ["vo_glaze"], clipTags: [], imageIds: [], productIds: [] },
  },
  {
    id: "pv_reel",
    type: "process-reel",
    variant: "single-reel",
    order: 5,
    props: { caption: "One tumbler, start to trim" },
    bindings: { clipTags: ["clip_wheel"], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_reviews",
    type: "reviews",
    variant: "list",
    order: 6,
    props: { layout: "list" },
    bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_trust",
    type: "trust-badge",
    variant: "expandable-detail",
    order: 7,
    props: {},
    bindings: { clipTags: ["clip_intro"], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_thanks",
    type: "thank-you",
    variant: "video-message",
    order: 8,
    props: {},
    bindings: { clipTags: ["clip_thanks"], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_atmos",
    type: "atmosphere",
    variant: "block-ground",
    order: 9,
    props: { toneShift: "warm", blockGround: "b" },
    bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
  },
  {
    id: "pv_cta",
    type: "contact-cta",
    variant: "footer-strip",
    order: 10,
    props: { label: "Message Sena", blockGround: "a" },
    bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
  },
];

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
