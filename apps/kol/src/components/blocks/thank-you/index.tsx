"use client";

import { useState } from "react";
import { FilmFrame } from "@/components/media/FilmFrame";
import { SmartImage } from "@/components/media/SmartImage";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";
import { BlockSection, firstClip, imageById, type BlockProps } from "../shared";

/**
 * Block 9 · thank-you — the post-purchase personal moment. Relationship
 * close, not a receipt: the maker's own film (sound opt-in) or the warm
 * text+media fallback; the order summary sits quietly below and is NEVER
 * blocked by media. Order data itself is live (P4 checkout) — the summary
 * slot renders whatever the page provides.
 */
export function ThankYouBlock({
  block,
  data,
  state = "success",
  orderSummary,
}: BlockProps<"thank-you"> & { orderSummary?: React.ReactNode }) {
  const clip = firstClip(data, block.bindings.clipTags);
  const portrait = imageById(data, data.maker.avatarMediaId);
  const [clipFailed, setClipFailed] = useState(false);

  if (state === "loading") {
    return (
      <BlockSection>
        <div aria-busy="true" className="mx-auto max-w-2xl space-y-[var(--space-4)]">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface">
            {clip ? (
              <img src={clip.poster} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-60" onError={(e) => e.currentTarget.remove()} />
            ) : null}
            <Skeleton className="absolute inset-x-0 bottom-0 h-1 rounded-none" />
          </div>
          {/* order summary renders immediately below — never waits on the film */}
          {orderSummary ?? <SkeletonLines lines={2} className="mx-auto max-w-sm" />}
        </div>
      </BlockSection>
    );
  }

  // Empty (no thankyou clip) and Error (clip failed) share the designed
  // fallback: the maker's written thanks + portrait — never a bare receipt.
  const useVideo =
    block.variant === "video-message" &&
    clip !== undefined &&
    state !== "empty" &&
    state !== "error" &&
    !clipFailed;

  const firstName = data.maker.displayName.split(" ")[0];

  return (
    <BlockSection>
      <div className="mx-auto max-w-2xl space-y-[var(--space-4)] text-center">
        {useVideo ? (
          <Reveal>
            <FilmFrame
              clip={clip}
              autoPlay={false}
              className="aspect-video rounded-lg shadow-card"
              onError={() => setClipFailed(true)}
            />
          </Reveal>
        ) : (
          <Reveal className="mx-auto flex max-w-md flex-col items-center gap-[var(--space-3)]">
            {portrait ? <SmartImage image={portrait} className="w-40 rounded-lg" /> : null}
          </Reveal>
        )}
        <Reveal delayMs={STAGGER_MS}>
          <h2 className="font-display text-h1 [text-wrap:balance]">
            Thank you — from {firstName}
          </h2>
          <p className="mx-auto mt-2 max-w-measure text-body-lg text-muted">
            {useVideo
              ? `A few words from ${firstName} before your piece goes on the wheel.`
              : `“Every order keeps this workshop going. Your piece will be packed by my own hands.” — ${data.maker.displayName}`}
          </p>
        </Reveal>
        {orderSummary ? (
          <Reveal delayMs={STAGGER_MS * 2} className="border-t border-line pt-[var(--space-3)] text-left">
            {orderSummary}
          </Reveal>
        ) : null}
        <Reveal delayMs={STAGGER_MS * 3}>
          <a
            href="#orders"
            className="inline-flex min-h-11 items-center text-caption uppercase tracking-[0.04em] text-muted underline-offset-4 transition-colors duration-state ease-kol hover:text-ink hover:underline"
          >
            View order
          </a>
        </Reveal>
      </div>
    </BlockSection>
  );
}
