"use client";

import { AudioLines } from "lucide-react";
import { SmartImage } from "@/components/media/SmartImage";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";
import type { StoreImage } from "@/lib/store-config/types";
import { formatPrice } from "@/lib/utils";
import {
  BlockSection,
  Eyebrow,
  firstClip,
  imageById,
  productById,
  voiceoverById,
  type BlockProps,
} from "../shared";
import { FilmFrame } from "@/components/media/FilmFrame";

const inventoryCopy = {
  "in-stock": (qty: number | null) => (qty !== null ? `${qty} available` : "In stock"),
  "made-to-order": () => "Made to order",
  "sold-out": () => "Sold out",
} as const;

/**
 * Block 4 · product-detail — the single-product deep view where the corner
 * video narrates and the buyer decides. Add-to-cart is the ONE high-emphasis
 * accent action in the world. Empty is n/a (route guard); a 3d-viewer variant
 * without a model silently falls back to image-gallery.
 */
export function ProductDetailBlock({ block, data, state = "success" }: BlockProps<"product-detail">) {
  const product = productById(data, block.bindings.productIds[0] ?? "");

  // Empty: n/a by route guard — nothing sensible to render without a product.
  if (state === "empty" || !product) return null;

  const gallery = product.mediaIds
    .map((id) => imageById(data, id))
    .filter((img): img is StoreImage => img !== undefined);
  const narrationClip = firstClip(data, [...block.bindings.clipTags, ...product.narrationClipTags]);
  const voiceover = block.bindings.voiceoverIds
    .map((id) => voiceoverById(data, id))
    .find((vo) => vo?.elementRef.id === product.id);

  // 3d-viewer falls back silently when model3dId is null; the GLB island
  // itself (<model-viewer>/R3F) is the Phase-6 dimensional beat.
  const variant =
    block.variant === "3d-viewer" && !product.model3dId ? "image-gallery" : block.variant;

  if (state === "loading") {
    const aspect = gallery[0]?.aspect ?? "4:5";
    return (
      <BlockSection>
        <div aria-busy="true" className="grid gap-[var(--space-6)] md:grid-cols-2">
          <Skeleton
            className={{ "1:1": "aspect-square", "4:5": "aspect-[4/5]", "3:2": "aspect-[3/2]", "16:9": "aspect-video" }[aspect] + " w-full rounded-md"}
          />
          {/* price + CTA area reserved — no layout shift on resolve */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-24" />
            <SkeletonLines lines={3} />
            <Skeleton className="h-11 w-40 rounded-pill" />
          </div>
        </div>
      </BlockSection>
    );
  }

  const inventoryUnresolved = state === "error";

  return (
    <BlockSection>
      <div className="grid gap-[var(--space-6)] md:grid-cols-2 md:items-start">
        {/* media column — media leads text (§4.2) */}
        <Reveal className="space-y-[var(--space-2)]">
          {variant === "video-led" && narrationClip ? (
            <FilmFrame clip={narrationClip} className="aspect-video rounded-md" />
          ) : null}
          {gallery.length > 0 ? (
            <>
              {/* error state: SmartImage keeps alt text visible per image */}
              {gallery[0] ? <SmartImage image={gallery[0]} /> : null}
              {gallery.length > 1 ? (
                <div className="flex gap-[var(--space-1)]">
                  {gallery.slice(1).map((img) => (
                    <SmartImage key={img.id} image={img} className="w-24" />
                  ))}
                </div>
              ) : null}
            </>
          ) : variant !== "video-led" ? (
            <div className="flex aspect-[4/5] items-end rounded-md bg-surface p-4">
              <span className="text-caption text-muted">{product.title}</span>
            </div>
          ) : null}
        </Reveal>

        <div className="space-y-[var(--space-3)]">
          <Reveal delayMs={STAGGER_MS}>
            {product.badges[0] ? <Eyebrow>{product.badges[0]}</Eyebrow> : null}
            <h1 className="mt-1 font-display text-h1 [text-wrap:balance]">{product.title}</h1>
            <p className="mt-2 font-mono text-h3 tabular-nums">
              {formatPrice(product.price.amount, product.price.currency)}
            </p>
          </Reveal>

          <Reveal delayMs={STAGGER_MS * 2}>
            <p className="max-w-measure text-body-lg text-muted">{product.description}</p>
          </Reveal>

          <Reveal delayMs={STAGGER_MS * 3} className="space-y-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              {inventoryUnresolved
                ? "Checking availability…"
                : inventoryCopy[product.inventory.status](product.inventory.qty)}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {/* the one high-emphasis accent action in the world */}
              <Button
                variant="accent"
                size="lg"
                disabled={inventoryUnresolved || product.inventory.status === "sold-out"}
                title={inventoryUnresolved ? "We couldn't confirm availability — try again shortly" : undefined}
              >
                Add to cart
              </Button>
              {voiceover ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 py-2 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink active:scale-[0.98]"
                >
                  <AudioLines className="h-4 w-4 text-accent" aria-hidden="true" />
                  {voiceover.label}
                </button>
              ) : null}
            </div>
            {/* compact trust chips render inline here via the trust-badge block (catalog §4) */}
            <div className="flex gap-2 pt-[var(--space-1)]">
              {data.maker.trust.realMaker.status === "verified" ? (
                <Badge variant="ink">Real maker · verified</Badge>
              ) : (
                <Badge>Verification in progress</Badge>
              )}
              <Badge>{data.maker.trust.aiTransparency.level}</Badge>
            </div>
          </Reveal>
        </div>
      </div>
    </BlockSection>
  );
}
