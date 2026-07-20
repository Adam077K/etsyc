import type { CSSProperties, ReactNode } from "react";
import type {
  BlockGround,
  BlockOfType,
  BlockType,
  Clip,
  Product,
  StoreConfig,
  StoreImage,
  Voiceover,
} from "@/lib/store-config/types";
import { cn } from "@/lib/utils";

/**
 * The 4 mandatory render states (block catalog cross-cutting rules).
 * A block that renders only `success` is not shippable.
 */
export type BlockState = "loading" | "empty" | "error" | "success";

/** The data a block may resolve bindings against (config minus theme/blocks). */
export type StoreData = Pick<
  StoreConfig,
  "maker" | "media" | "products" | "voiceovers"
>;

/**
 * Common signature every block component implements; `isPreview` switches
 * empty states between live-omission and the seller-preview ghost prompt.
 */
export interface BlockProps<K extends BlockType = BlockType> {
  block: BlockOfType<K>;
  data: StoreData;
  state?: BlockState;
  isPreview?: boolean;
}

// ---------------------------------------------------------------------------
// Binding resolvers — referential integrity is validated at write time (P3);
// at render time missing ids degrade to the block's error/empty design.
// ---------------------------------------------------------------------------

export function imageById(data: StoreData, id: string | null | undefined): StoreImage | undefined {
  return data.media.images.find((img) => img.id === id);
}

export function clipById(data: StoreData, id: string | null | undefined): Clip | undefined {
  return data.media.clips.find((clip) => clip.id === id);
}

export function productById(data: StoreData, id: string): Product | undefined {
  return data.products.find((product) => product.id === id);
}

export function voiceoverById(data: StoreData, id: string): Voiceover | undefined {
  return data.voiceovers.find((vo) => vo.id === id);
}

export function firstClip(data: StoreData, clipTags: string[]): Clip | undefined {
  for (const tag of clipTags) {
    const clip = clipById(data, tag);
    if (clip) return clip;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Block-ground sections (P2-a — the Faire color-block move)
// ---------------------------------------------------------------------------

/**
 * When a block sets `blockGround`, the section renders full-bleed in
 * --block-{a|b|c} with --on-block-* ink, --space-12→16 internal padding, and
 * washes its ground in first on reveal (§4.2 — the wash is the section's own
 * background paint; children reveal after it). Local --ink/--muted/--line are
 * re-pointed at the on-block ink so nested content recolors without any block
 * branching on ground. AA scoping (which blocks may take which grounds) is
 * enforced by the catalog + critic, not silently corrected here.
 */
export function groundStyle(ground: Exclude<BlockGround, null>): CSSProperties {
  return {
    backgroundColor: `var(--block-${ground})`,
    color: `var(--on-block-${ground})`,
    "--ink": `var(--on-block-${ground})`,
    "--muted": `color-mix(in oklab, var(--on-block-${ground}) 72%, var(--block-${ground}))`,
    "--line": `color-mix(in oklab, var(--on-block-${ground}) 24%, var(--block-${ground}))`,
    "--surface": `color-mix(in oklab, var(--on-block-${ground}) 8%, var(--block-${ground}))`,
    // Accent inverts on a colored ground: the world accent can sit adjacent
    // to (or BE, on custom worlds) the ground hue and vanish — on-block ink
    // becomes the interactive color, the ground its ink.
    "--accent": `var(--on-block-${ground})`,
    "--accent-ink": `var(--block-${ground})`,
  } as CSSProperties;
}

/**
 * Section wrapper: full-bleed edge-to-edge on a color-block ground (no
 * gutter, §1.2), page-contained reading width otherwise.
 */
export function BlockSection({
  ground = null,
  className,
  innerClassName,
  children,
}: {
  ground?: BlockGround;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  if (ground) {
    return (
      <section
        style={groundStyle(ground)}
        className={cn("w-full py-[var(--space-12)] md:py-[var(--space-16)]", className)}
      >
        <div className={cn("mx-auto max-w-page px-[var(--space-2)] md:px-[var(--space-6)]", innerClassName)}>
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className={cn("w-full", className)}>
      <div className={cn("mx-auto max-w-page px-[var(--space-2)] md:px-[var(--space-6)]", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Eyebrow label — caption role, uppercase, positive tracking (§1.1). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-text text-caption uppercase tracking-[0.08em] text-muted", className)}>
      {children}
    </p>
  );
}
