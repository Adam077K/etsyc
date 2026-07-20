import type { StoreConfig } from "../types";

/**
 * A `theme.kind:"custom"` world (D15 seller brand freedom) — Noor Haddad,
 * indigo-dyed linen, studio "Tinctura", Amman & Rotterdam. Her any-hex brand
 * (indigo night ground, ochre accent) is deliberately OUTSIDE the five
 * curated palettes to prove the renderer's custom path: the same variable
 * names, a different world. Fonts are catalog families (pipeline §5.5).
 * Custom configs must pass the AA gate before leaving draft — mirrored in
 * meta.status/criticScore below.
 */
export const customStore: StoreConfig = {
  schemaVersion: "1.2",
  storeId: "c2d9-tinctura",
  maker: {
    id: "mk_noor",
    displayName: "Noor Haddad",
    handle: "tinctura",
    craft: "indigo-dyed linen, shibori folds",
    location: "Amman & Rotterdam",
    bio: "I keep a living indigo vat — it eats, sleeps, and some mornings refuses to dye. Every throw records the day the vat allowed it.",
    avatarMediaId: "img_noor_portrait",
    trust: {
      realMaker: {
        status: "pending",
        verifiedAt: null,
        voiceAnchorClipId: null,
      },
      aiTransparency: {
        level: "ai-drafted",
        disclosure:
          "KOL’s AI drafted this layout and derived the palette from Noor’s studio photos. Noor is reviewing each section; her words are her own.",
        aiAssistedFields: ["layout", "palette", "copy-structure"],
      },
    },
  },
  theme: {
    kind: "custom",
    customPalette: {
      mode: "dark",
      roles: {
        bg: "#10141F",
        surface: "#1A2130",
        ink: "#E9E4D6",
        inkMuted: "#9AA3B8",
        accent: "#E3A857",
        accentInk: "#241705",
        border: "#2A3245",
      },
    },
    customPairing: {
      displayFamily: "Fraunces",
      textFamily: "General Sans",
      scaleRatio: 1.28,
      displayWeight: 650,
      textWeight: 400,
    },
    motionPreset: "liquid", // signature beat is Phase 6 — preset must not error
    radiusIdentity: "sharp",
    density: "standard",
  },
  media: {
    clips: [
      {
        id: "clip_vat",
        kind: "video",
        src: "/media/tinctura/vat.mp4",
        poster: "/media/tinctura/vat-poster.svg",
        durationMs: 36000,
        captionsSrc: "/media/tinctura/vat.vtt",
        videoProfile: {
          purpose: ["intro", "craft-story"],
          pageEligibility: ["feed", "grown", "world"],
          productLinks: [],
          mood: ["calm", "intimate"],
          antiRepetitionKey: "noor-vat",
        },
      },
    ],
    images: [
      {
        id: "img_noor_portrait",
        src: "/media/tinctura/noor-portrait.svg",
        alt: "Noor folding linen, indigo to the elbows",
        aspect: "4:5",
        focalPoint: { x: 0.5, y: 0.35 },
      },
      {
        id: "img_shibori_throw",
        src: "/media/tinctura/shibori-throw.svg",
        alt: "Shibori-fold throw, three dips deep",
        aspect: "1:1",
        focalPoint: { x: 0.5, y: 0.5 },
      },
    ],
  },
  products: [
    {
      id: "p_shibori_throw",
      title: "Shibori Throw — Third Dip",
      price: { amount: 18500, currency: "EUR" },
      description:
        "Folded, clamped, and dipped three times over two days. The white lines are where the cloth held its breath.",
      mediaIds: ["img_shibori_throw"],
      model3dId: null,
      narrationClipTags: [],
      inventory: { status: "in-stock", qty: 2 },
      badges: ["one-of-a-kind"],
    },
  ],
  voiceovers: [
    {
      id: "vo_vat",
      elementRef: { kind: "block", id: "b_quote", field: null },
      src: "/media/tinctura/vo_vat.mp3",
      durationMs: 11000,
      transcript: "The vat is alive. You don't command it, you ask it.",
      label: "Hear Noor on the living vat",
    },
  ],
  blocks: [
    {
      id: "b_hero",
      type: "hero-video",
      variant: "full-bleed",
      order: 0,
      props: { showCraftLine: true },
      bindings: { clipTags: ["clip_vat"], imageIds: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_quote",
      type: "voice-quote",
      variant: "text+waveform",
      order: 1,
      props: {
        quote: "You don’t command the vat. You ask it.",
        attribution: "Noor, on dye day",
        blockGround: "a",
      },
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: ["vo_vat"] },
    },
    {
      id: "b_story",
      type: "craft-story",
      variant: "stacked-editorial",
      order: 2,
      props: {
        heading: "A vat is a pet you can’t see",
        body: "Indigo is fermentation, not pigment. My vat came from a Jordanian dye house that closed in 2019 — I carried a jar of its sludge to Rotterdam and fed it back to life. When the surface blooms copper, we dye. When it sulks, we wait.",
      },
      bindings: { imageIds: ["img_noor_portrait"], clipTags: [], productIds: [], voiceoverIds: [] },
    },
    {
      id: "b_show",
      type: "product-showcase",
      variant: "featured-single",
      order: 3,
      props: { eyebrow: "From the last dye day" },
      bindings: { productIds: ["p_shibori_throw"], voiceoverIds: [], clipTags: [], imageIds: [] },
    },
    {
      id: "b_cta",
      type: "contact-cta",
      variant: "footer-strip",
      order: 4,
      props: { label: "Message Noor" },
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    },
  ],
  meta: {
    version: 1,
    status: "in_review",
    criticScore: 0.81, // passed the AA gate — may leave draft (schema §2.2)
    approvedSections: ["b_hero", "b_quote"],
    createdAt: "2026-07-18T10:12:00Z",
    updatedAt: "2026-07-19T16:40:00Z",
  },
};
