"use client";

import { SmartImage } from "@/components/media/SmartImage";
import { TapToHear } from "@/components/media/TapToHear";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { ErrorInline } from "@/components/states/ErrorInline";
import { Skeleton } from "@/components/states/Skeleton";
import { useWorldInteraction } from "@/lib/renderer/world-interaction";
import type { Product } from "@/lib/store-config/types";
import { cn, formatPrice } from "@/lib/utils";
import {
  BlockSection,
  Eyebrow,
  imageById,
  productById,
  voiceoverById,
  type BlockProps,
  type StoreData,
} from "../shared";

/**
 * Block 3 · product-showcase — a gallery, not a grid dump. The generic
 * 3-column card row is BANNED (catalog): variants are rail / masonry /
 * featured-single. Prices in mono tabular figures; hover lifts on the card
 * shadow; inventory truth as a quiet chip.
 */
export function ProductShowcaseBlock({ block, data, state = "success", isPreview }: BlockProps<"product-showcase">) {
  const products = block.bindings.productIds
    .map((id) => productById(data, id))
    .filter((p): p is Product => p !== undefined);

  if (state === "empty" || products.length === 0) {
    if (!isPreview) return null;
    return (
      <BlockSection>
        <EmptyPrompt
          prompt="No products yet — add your first piece"
          hint="Each piece gets its own story, photos, and (if you like) your voice on it."
        />
      </BlockSection>
    );
  }

  if (state === "loading") {
    // skeletons sized to each product's real media aspect — no generic squares
    return (
      <BlockSection>
        <div aria-busy="true" className="flex gap-[var(--space-3)] overflow-hidden">
          {products.slice(0, 4).map((product) => {
            const aspect = imageById(data, product.mediaIds[0])?.aspect ?? "4:5";
            return (
              <div key={product.id} className="w-64 shrink-0 space-y-2">
                <Skeleton
                  className={cn(
                    "w-full rounded-md",
                    { "1:1": "aspect-square", "4:5": "aspect-[4/5]", "3:2": "aspect-[3/2]", "16:9": "aspect-video" }[aspect],
                  )}
                />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            );
          })}
        </div>
      </BlockSection>
    );
  }

  if (state === "error") {
    return (
      <BlockSection>
        <ErrorInline message="Couldn't load these pieces" onRetry={() => window.location.reload()} />
      </BlockSection>
    );
  }

  const header = (
    <Reveal className="mb-[var(--space-4)] space-y-1">
      {block.props.eyebrow ? <Eyebrow>{block.props.eyebrow}</Eyebrow> : null}
      {block.props.heading ? (
        <h2 className="font-display text-h2 [text-wrap:balance]">{block.props.heading}</h2>
      ) : null}
    </Reveal>
  );

  if (block.variant === "featured-single") {
    const [featured, ...rest] = products;
    if (!featured) return null;
    return (
      <BlockSection>
        {header}
        <div className="grid gap-[var(--space-6)] md:grid-cols-[3fr_2fr] md:items-end">
          <Reveal>
            <ProductCard product={featured} data={data} oversized voiceoverIds={block.bindings.voiceoverIds} />
          </Reveal>
          {rest.length > 0 ? (
            <div className="grid gap-[var(--space-3)]">
              {rest.map((product, i) => (
                <Reveal key={product.id} delayMs={STAGGER_MS * (i + 1)}>
                  <ProductCard product={product} data={data} voiceoverIds={block.bindings.voiceoverIds} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </BlockSection>
    );
  }

  if (block.variant === "masonry") {
    return (
      <BlockSection>
        {header}
        <div className="columns-1 gap-[var(--space-3)] sm:columns-2 lg:columns-3 [&>*]:mb-[var(--space-3)] [&>*]:break-inside-avoid">
          {products.map((product, i) => (
            <Reveal key={product.id} delayMs={STAGGER_MS * i}>
              <ProductCard product={product} data={data} voiceoverIds={block.bindings.voiceoverIds} />
            </Reveal>
          ))}
        </div>
      </BlockSection>
    );
  }

  // rail — horizontal scroll, silky
  return (
    <BlockSection>
      {header}
      <ul className="-mx-[var(--space-2)] flex snap-x gap-[var(--space-3)] overflow-x-auto px-[var(--space-2)] pb-[var(--space-2)] md:-mx-[var(--space-6)] md:px-[var(--space-6)]">
        {products.map((product, i) => (
          <Reveal as="li" key={product.id} delayMs={STAGGER_MS * i} className="w-72 shrink-0 snap-start">
            <ProductCard product={product} data={data} voiceoverIds={block.bindings.voiceoverIds} />
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}

function ProductCard({
  product,
  data,
  voiceoverIds = [],
  oversized = false,
}: {
  product: Product;
  data: StoreData;
  voiceoverIds?: string[];
  oversized?: boolean;
}) {
  const image = imageById(data, product.mediaIds[0]);
  const interaction = useWorldInteraction();
  const voiceover = voiceoverIds
    .map((id) => voiceoverById(data, id))
    .find((vo) => vo?.elementRef.kind === "product" && vo.elementRef.id === product.id);

  const body = (
    <>
      <div className="overflow-hidden rounded-md transition-shadow duration-state ease-kol group-hover:shadow-card">
        {image ? (
          <SmartImage image={image} rounded={false} className={cn(oversized && "md:aspect-[4/5]")} />
        ) : (
          <div className="flex aspect-[4/5] items-end bg-surface p-4">
            <span className="text-caption text-muted">{product.title}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className={cn("font-text font-medium text-ink", oversized ? "text-h3" : "text-body")}>
            {product.title}
          </h3>
          <p className="mt-1 font-mono text-body tabular-nums text-muted">
            {formatPrice(product.price.amount, product.price.currency)}
          </p>
        </div>
        {product.badges[0] ? <Badge>{product.badges[0]}</Badge> : null}
      </div>
    </>
  );

  return (
    <article className="group transition-transform duration-state ease-kol hover:-translate-y-0.5">
      {/* B4: in a live world the card is the doorway toward NARRATE_SHRINK.
          A native button (keyboard + global :focus-visible ring) whose
          accessible name IS the card content; TapToHear stays a SIBLING —
          nested interactive controls are invalid and unreachable. Without
          the world context (preview matrix, bare mounts) the card renders
          exactly as Wave 2 shipped. */}
      {interaction ? (
        <button
          type="button"
          onClick={() => interaction.onProductSelect(product.id)}
          className="block w-full cursor-pointer text-left"
        >
          {body}
        </button>
      ) : (
        body
      )}
      {voiceover ? (
        <TapToHear src={voiceover.src} label={voiceover.label} className="mt-2 px-3 py-1.5" />
      ) : null}
    </article>
  );
}
