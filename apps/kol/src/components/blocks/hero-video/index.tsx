"use client";

import { useState } from "react";
import { FilmFrame } from "@/components/media/FilmFrame";
import { PosterStill } from "@/components/media/PosterStill";
import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { Skeleton } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { firstClip, type BlockProps } from "../shared";

/**
 * Block 1 · hero-video — the persistent maker film the world unfolds around.
 * Exactly one per world. Will carry layoutId="hero-video" when the Phase-6
 * unfold/dock choreography lands; here it renders the three resting variants.
 * Sound off until opt-in; controls are mute + captions only (FilmFrame).
 */
export function HeroVideoBlock({ block, data, state = "success", isPreview }: BlockProps<"hero-video">) {
  const clip = firstClip(data, block.bindings.clipTags);
  const [clipFailed, setClipFailed] = useState(false);

  const frameClass = {
    "full-bleed": "aspect-video w-full", // edge-to-edge, radius 0
    "center-column": "mx-auto aspect-video w-full max-w-page rounded-lg md:w-[72%]",
    "corner-shrunk": "ml-auto aspect-video w-80 rounded-md shadow-raised",
  }[block.variant];

  // Empty — seller preview only; a published world can't reach this. If a
  // poster already exists (clip uploaded, world un-published) it shows behind
  // the prompt per the catalog ("poster still with a muted prompt").
  if (state === "empty" || !clip) {
    if (!isPreview) return null;
    return (
      <section className="mx-auto w-full max-w-page px-[var(--space-2)] md:px-[var(--space-6)]">
        <div className={cn("relative flex items-center justify-center overflow-hidden bg-surface", frameClass)}>
          {clip ? (
            <PosterStill src={clip.poster} className="absolute inset-0 h-full w-full object-cover opacity-40" />
          ) : null}
          <EmptyPrompt
            prompt="Add your first clip"
            hint="Your film is the front door of your world — 30 seconds of you at work is enough to start."
            className="border-none bg-transparent"
          />
        </div>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section
        aria-busy="true"
        className="mx-auto w-full max-w-page px-[var(--space-2)] md:px-[var(--space-6)]"
      >
        <div className={cn("relative overflow-hidden bg-surface", frameClass)}>
          {/* poster shows immediately; shimmer is a progress edge, never a spinner */}
          <PosterStill src={clip.poster} className="h-full w-full object-cover opacity-60" />
          <Skeleton className="absolute inset-x-0 bottom-0 h-1 rounded-none" />
        </div>
      </section>
    );
  }

  const showError = state === "error" || clipFailed;

  return (
    <section
      className={cn(
        block.variant === "full-bleed"
          ? "w-full"
          : "mx-auto w-full max-w-page px-[var(--space-2)] md:px-[var(--space-6)]",
      )}
    >
      {/* container-query root: display-hero sizes to the FRAME, not the
          viewport, so sub-page-width containers (matrix cells, docked
          variants) scale the line down instead of clipping mid-word */}
      <div className={cn("kol-scrim relative overflow-hidden [container-type:inline-size]", frameClass)}>
        {showError ? (
          <div className="relative flex h-full w-full items-end bg-surface">
            <PosterStill src={clip.poster} className="absolute inset-0 h-full w-full object-cover" />
            <p className="relative m-4 rounded-md bg-surface/85 px-3 py-2 text-caption text-muted">
              Couldn&rsquo;t load this clip
            </p>
          </div>
        ) : (
          <FilmFrame clip={clip} className="h-full" onError={() => setClipFailed(true)} />
        )}
        {/* the one big line per world — display-hero over film, --on-media ink over the scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-[var(--space-4)] md:p-[var(--space-8)]">
          <h1 className="font-display font-bold leading-[0.92] tracking-[-0.03em] text-on-media [text-wrap:balance] text-[min(var(--fs-display-hero),10cqi)]">
            {data.maker.displayName}
          </h1>
          {block.props.showCraftLine ? (
            <p className="mt-2 font-text text-caption uppercase tracking-[0.08em] text-on-media/90">
              {data.maker.craft} · {data.maker.location}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
