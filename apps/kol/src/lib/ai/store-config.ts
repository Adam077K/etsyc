/**
 * Flat model output → the real store-config union.
 *
 * The model answers into a flat, present-and-nullable block shape (that's
 * what strict tool-use wants). This module folds it back into the
 * discriminated `StoreBlock` union and the `CustomTheme` from
 * src/lib/store-config/types.ts, enforcing the invariants the schema
 * promises but a model can't be trusted to hold: a valid variant per block
 * type, exactly one hero-video, and a contiguous order.
 *
 * Nothing here invents content. If a prop wasn't emitted, it stays empty —
 * a missing heading is a missing heading, not a generated one.
 */

import type {
  BlockType,
  CustomTheme,
  StoreBlock,
  BlockGround,
} from "../store-config/types";
import type { DraftBlock, DraftTheme } from "./schemas";

/** The variant vocabulary per block type, from store-config types.ts. */
const VARIANTS: Record<BlockType, string[]> = {
  "hero-video": ["full-bleed", "center-column", "corner-shrunk"],
  "craft-story": ["text-left-media-right", "stacked-editorial", "pull-quote"],
  "product-showcase": ["rail", "masonry", "featured-single"],
  "product-detail": ["image-gallery", "3d-viewer", "video-led"],
  "voice-quote": ["audio-tap", "text-only", "text+waveform"],
  "process-reel": ["single-reel", "multi-clip-carousel"],
  reviews: ["list", "rating-summary", "featured-quote"],
  "trust-badge": ["inline-compact", "expandable-detail"],
  "thank-you": ["video-message", "text+media"],
  atmosphere: ["color-wash", "block-ground", "image-band", "motion-divider"],
  "contact-cta": ["button", "card", "footer-strip"],
};

const emptyBindings = () => ({
  clipTags: [] as string[],
  imageIds: [] as string[],
  productIds: [] as string[],
  voiceoverIds: [] as string[],
});

function variantFor(type: BlockType, proposed: string): string {
  const allowed = VARIANTS[type];
  return allowed.includes(proposed) ? proposed : allowed[0]!;
}

/**
 * Body/UI blocks reject the midtone `--block-c` ground (types.ts) — a rule
 * the schema states in a comment and nothing enforces. Enforce it here.
 */
function safeGround(ground: BlockGround, allowMidtone: boolean): BlockGround {
  if (ground === null) return null;
  if (!allowMidtone && ground === "c") return null;
  return ground;
}

function toStoreBlock(b: DraftBlock, order: number): StoreBlock | null {
  const bindings = emptyBindings();
  const base = { id: b.id, order, bindings };
  const variant = variantFor(b.type, b.variant);

  switch (b.type) {
    case "hero-video":
      return {
        ...base,
        type: "hero-video",
        variant: variant as "full-bleed" | "center-column" | "corner-shrunk",
        props: { showCraftLine: b.showCraftLine ?? true },
      };
    case "craft-story":
      return {
        ...base,
        type: "craft-story",
        variant: variant as "text-left-media-right" | "stacked-editorial" | "pull-quote",
        props: {
          heading: b.heading ?? "",
          body: b.body ?? "",
          ...(b.pullQuote !== null ? { pullQuote: b.pullQuote } : {}),
          blockGround: safeGround(b.blockGround, false),
        },
      };
    case "product-showcase":
      return {
        ...base,
        type: "product-showcase",
        variant: variant as "rail" | "masonry" | "featured-single",
        props: {
          ...(b.eyebrow !== null ? { eyebrow: b.eyebrow } : {}),
          ...(b.heading !== null ? { heading: b.heading } : {}),
        },
      };
    case "product-detail":
      return {
        ...base,
        type: "product-detail",
        variant: variant as "image-gallery" | "3d-viewer" | "video-led",
        props: { showModel3d: b.showModel3d ?? false },
      };
    case "voice-quote":
      return {
        ...base,
        type: "voice-quote",
        variant: variant as "audio-tap" | "text-only" | "text+waveform",
        props: {
          quote: b.quote ?? b.pullQuote ?? "",
          ...(b.attribution !== null ? { attribution: b.attribution } : {}),
          // display block — all three grounds, including the midtone, are valid
          blockGround: safeGround(b.blockGround, true),
        },
      };
    case "process-reel":
      return {
        ...base,
        type: "process-reel",
        variant: variant as "single-reel" | "multi-clip-carousel",
        props: { ...(b.caption !== null ? { caption: b.caption } : {}) },
      };
    case "reviews":
      return {
        ...base,
        type: "reviews",
        variant: variant as "list" | "rating-summary" | "featured-quote",
        props: { layout: variant as "list" | "rating-summary" | "featured-quote" },
      };
    case "trust-badge":
      return {
        ...base,
        type: "trust-badge",
        variant: variant as "inline-compact" | "expandable-detail",
        props: {},
      };
    case "thank-you":
      return {
        ...base,
        type: "thank-you",
        variant: variant as "video-message" | "text+media",
        props: {},
      };
    case "atmosphere":
      return {
        ...base,
        type: "atmosphere",
        variant: variant as "color-wash" | "block-ground" | "image-band" | "motion-divider",
        props: {
          toneShift: b.toneShift ?? "neutral",
          blockGround: safeGround(b.blockGround, true),
        },
      };
    case "contact-cta":
      return {
        ...base,
        type: "contact-cta",
        variant: variant as "button" | "card" | "footer-strip",
        props: {
          label: b.label ?? b.heading ?? "Get in touch",
          blockGround: safeGround(b.blockGround, false),
        },
      };
    default:
      return null;
  }
}

/**
 * Fold flat blocks into the union. Enforces exactly one hero-video (the
 * first wins, the rest are dropped) and re-numbers `order` contiguously.
 */
export function normalizeBlocks(blocks: DraftBlock[]): StoreBlock[] {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const out: StoreBlock[] = [];
  let heroSeen = false;
  const ids = new Set<string>();

  for (const raw of sorted) {
    if (raw.type === "hero-video") {
      if (heroSeen) continue;
      heroSeen = true;
    }
    // block ids must be stable AND unique — approvals pin to them
    let id = raw.id;
    let n = 2;
    while (ids.has(id)) {
      id = `${raw.id}-${n}`;
      n += 1;
    }
    ids.add(id);

    const block = toStoreBlock({ ...raw, id }, out.length);
    if (block !== null) out.push(block);
  }

  // the world always opens on film — hoist the hero if the model buried it
  const heroAt = out.findIndex((b) => b.type === "hero-video");
  if (heroAt > 0) {
    const [hero] = out.splice(heroAt, 1);
    if (hero !== undefined) out.unshift(hero);
  }
  return out.map((b, i) => ({ ...b, order: i }) as StoreBlock);
}

/** Derived theme → the `theme.kind: "custom"` half of store-config (D15). */
export function toCustomTheme(theme: DraftTheme): CustomTheme {
  return {
    kind: "custom",
    customPalette: { mode: theme.mode, roles: { ...theme.roles } },
    customPairing: {
      displayFamily: theme.displayFamily,
      textFamily: theme.textFamily,
      scaleRatio: theme.scaleRatio,
      displayWeight: theme.displayWeight,
      textWeight: theme.textWeight,
    },
    motionPreset: theme.motionPreset,
    radiusIdentity: theme.radiusIdentity,
    density: theme.density,
  };
}
