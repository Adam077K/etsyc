import type { StoreConfig } from "../types";

/**
 * The schema §3 worked example, typed — Sena Okonkwo / Ashwork Ceramics,
 * curated `sunbaked` / `statement-grotesk` / `fluid` (already v2 ids).
 * Media srcs point at local stand-in stills (real team footage is D12,
 * Phase 5); video files intentionally don't exist yet, which exercises the
 * hero/reel poster-fallback design honestly.
 */
export const senaStore: StoreConfig = {
  schemaVersion: "1.3",
  storeId: "a7f3-ashwork",
  maker: {
    id: "mk_sena",
    displayName: "Sena Okonkwo",
    handle: "ashwork",
    craft: "hand-thrown stoneware, wood-ash glazes",
    location: "Lagos & London",
    bio: "I throw in small batches and fire with ash from my father’s workshop. Every piece keeps the mark of the wheel.",
    avatarMediaId: "img_sena_portrait",
    trust: {
      realMaker: {
        status: "verified",
        verifiedAt: "2026-07-12T09:20:00Z",
        voiceAnchorClipId: "clip_intro",
      },
      aiTransparency: {
        level: "ai-assisted",
        disclosure:
          "Sena wrote every word. KOL’s AI suggested the layout and picked the palette; Sena approved each section.",
        aiAssistedFields: ["layout", "palette"],
      },
    },
  },
  theme: {
    kind: "curated",
    paletteId: "sunbaked",
    mode: "light",
    fontPairingId: "statement-grotesk",
    motionPreset: "fluid",
    radiusIdentity: "soft",
    density: "airy",
  },
  media: {
    clips: [
      {
        id: "clip_intro",
        kind: "video",
        src: "/media/ashwork/intro.mp4",
        poster: "/media/ashwork/intro-poster.svg",
        durationMs: 41000,
        captionsSrc: "/media/ashwork/intro.vtt",
        videoProfile: {
          purpose: ["intro"],
          pageEligibility: ["feed", "grown", "world"],
          productLinks: [],
          mood: ["warm", "intimate"],
          antiRepetitionKey: "sena-intro",
        },
      },
      {
        id: "clip_wheel",
        kind: "video",
        src: "/media/ashwork/wheel.mp4",
        poster: "/media/ashwork/wheel-poster.svg",
        durationMs: 28000,
        captionsSrc: "/media/ashwork/wheel.vtt",
        videoProfile: {
          purpose: ["process"],
          pageEligibility: ["world"],
          productLinks: [],
          mood: ["calm"],
          antiRepetitionKey: "sena-wheel",
        },
      },
      {
        id: "clip_tumbler",
        kind: "video",
        src: "/media/ashwork/tumbler.mp4",
        poster: "/media/ashwork/ridge-tumbler.svg",
        durationMs: 19000,
        captionsSrc: "/media/ashwork/tumbler.vtt",
        videoProfile: {
          purpose: ["product-narration"],
          pageEligibility: ["product"],
          productLinks: ["p_ridge_tumbler"],
          mood: ["intimate"],
          antiRepetitionKey: "sena-tumbler",
        },
      },
      {
        id: "clip_thanks",
        kind: "video",
        src: "/media/ashwork/thanks.mp4",
        poster: "/media/ashwork/intro-poster.svg",
        durationMs: 12000,
        captionsSrc: "/media/ashwork/thanks.vtt",
        videoProfile: {
          purpose: ["thankyou"],
          pageEligibility: ["thankyou"],
          productLinks: [],
          mood: ["warm"],
          antiRepetitionKey: "sena-thanks",
        },
      },
    ],
    images: [
      {
        id: "img_sena_portrait",
        src: "/media/ashwork/sena-portrait.svg",
        alt: "Sena at the wheel, hands cupping wet clay",
        aspect: "4:5",
        focalPoint: { x: 0.5, y: 0.4 },
      },
      {
        id: "img_ridge_1",
        src: "/media/ashwork/ridge-tumbler.svg",
        alt: "Ridge tumbler, ash glaze pooling at the base",
        aspect: "1:1",
        focalPoint: { x: 0.5, y: 0.55 },
      },
      {
        id: "img_bowl_1",
        src: "/media/ashwork/ash-bowl.svg",
        alt: "Serving bowl, matte oatmeal exterior",
        aspect: "3:2",
        focalPoint: { x: 0.5, y: 0.5 },
      },
    ],
  },
  products: [
    {
      id: "p_ridge_tumbler",
      title: "Ridge Tumbler",
      price: { amount: 4200, currency: "GBP" },
      description:
        "Thrown with a deliberate ridge you feel under the thumb. Ash glaze pools darker where it runs.",
      mediaIds: ["img_ridge_1"],
      model3dId: null,
      narrationClipTags: ["clip_tumbler"],
      inventory: { status: "made-to-order", qty: null },
      badges: ["made-to-order"],
    },
    {
      id: "p_ash_bowl",
      title: "Ash-glaze Serving Bowl",
      price: { amount: 12800, currency: "GBP" },
      description: "Big enough for a shared meal. Each fires a little differently in the ash.",
      mediaIds: ["img_bowl_1"],
      model3dId: null,
      narrationClipTags: [],
      inventory: { status: "in-stock", qty: 3 },
      badges: ["one-of-a-kind"],
    },
  ],
  voiceovers: [
    {
      id: "vo_glaze",
      elementRef: { kind: "product", id: "p_ridge_tumbler", field: null },
      src: "/media/ashwork/vo_glaze.mp3",
      durationMs: 9000,
      transcript: null,
      label: "Hear Sena on this glaze",
    },
  ],
  blocks: [
    {
      id: "b_hero",
      type: "hero-video",
      variant: "center-column",
      order: 0,
      // statement is fixture-AUTHORED (like all four seed worlds) so /preview
      // shows the statement-present hero by default; ?statement=off exercises
      // the absent path (E5 eyes-on gate). 44 chars — under the 48 cap.
      props: { showCraftLine: true, statement: "Every glaze began as ash on a workshop floor" },
      bindings: { clipTags: ["clip_intro"], imageIds: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_story",
      type: "craft-story",
      variant: "text-left-media-right",
      order: 1,
      props: {
        heading: "Ash from my father’s workshop",
        body: "The glaze on every piece starts as swept ash from the floor of my father’s carpentry shop in Lagos. I sieve it, wash it, and fire it to 1280°C — where it melts into a glass no two kilns repeat. What you hold carries two workshops and thirty years between them.",
      },
      bindings: { imageIds: ["img_sena_portrait"], clipTags: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_proc",
      type: "process-reel",
      variant: "single-reel",
      order: 2,
      props: { caption: "One tumbler, start to trim" },
      bindings: { clipTags: ["clip_wheel"], imageIds: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_show",
      type: "product-showcase",
      variant: "featured-single",
      order: 3,
      props: { eyebrow: "Made to order" },
      bindings: {
        productIds: ["p_ridge_tumbler", "p_ash_bowl"],
        voiceoverIds: ["vo_glaze"],
        clipTags: [],
        imageIds: [],
      },
    },
    {
      // the brave-color move (P2-a): the maker's line washed full-bleed
      // across the clay --block-a ground — the Faire/Kotn section identity
      id: "b_quote",
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
      id: "b_space",
      type: "atmosphere",
      variant: "block-ground",
      order: 5,
      props: { toneShift: "warm", blockGround: "b" },
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_trust",
      type: "trust-badge",
      variant: "expandable-detail",
      order: 6,
      props: {},
      bindings: { clipTags: ["clip_intro"], imageIds: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_cta",
      type: "contact-cta",
      variant: "footer-strip",
      order: 7,
      props: { label: "Message Sena", blockGround: "a" },
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    },
  ],
  meta: {
    version: 3,
    status: "published",
    criticScore: 0.86,
    approvedSections: ["b_hero", "b_story", "b_proc", "b_show", "b_quote", "b_space", "b_trust", "b_cta"],
    createdAt: "2026-07-10T14:02:00Z",
    updatedAt: "2026-07-12T09:25:00Z",
  },
};
