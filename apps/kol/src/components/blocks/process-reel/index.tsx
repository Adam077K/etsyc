"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FilmFrame } from "@/components/media/FilmFrame";
import { PosterStill } from "@/components/media/PosterStill";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";
import type { Clip } from "@/lib/store-config/types";
import { cn } from "@/lib/utils";
import { BlockSection, clipById, type BlockProps } from "../shared";

/**
 * Block 6 · process-reel — behind-the-scenes craft in motion. Supporting
 * footage (distinct from hero-video): autoplays muted on scroll-into-view,
 * failed clips are skipped rather than blocking the carousel.
 */
export function ProcessReelBlock({ block, data, state = "success" }: BlockProps<"process-reel">) {
  const clips = block.bindings.clipTags
    .map((tag) => clipById(data, tag))
    .filter((clip): clip is Clip => clip !== undefined);
  const [index, setIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  // Empty: no process footage → block hidden.
  if (state === "empty" || clips.length === 0) return null;

  if (state === "loading") {
    return (
      <BlockSection>
        <div aria-busy="true" className="space-y-[var(--space-2)]">
          <div className="flex gap-[var(--space-2)]">
            {/* first poster leads; siblings hold as skeleton frames */}
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-surface">
              {clips[0] ? (
                <PosterStill src={clips[0].poster} className="h-full w-full object-cover opacity-60" />
              ) : null}
              <Skeleton className="absolute inset-x-0 bottom-0 h-1 rounded-none" />
            </div>
            {clips.slice(1, 3).map((clip) => (
              <Skeleton key={clip.id} className="hidden aspect-video w-1/3 shrink-0 rounded-md md:block" />
            ))}
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </BlockSection>
    );
  }

  // Error state / runtime failures: skip failed clips, keep the reel usable.
  const playable = state === "error" ? [] : clips.filter((clip) => !failedIds.includes(clip.id));

  if (playable.length === 0) {
    // every clip failed → quiet poster fallback + retry, never a dead block
    const poster = clips[0];
    return (
      <BlockSection>
        <div className="relative flex aspect-video w-full items-end overflow-hidden rounded-md bg-surface">
          {poster ? (
            <PosterStill src={poster.poster} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="relative m-4 flex items-center gap-3 rounded-md bg-surface/85 px-3 py-2">
            <span className="text-caption text-muted">Couldn&rsquo;t load this footage</span>
            <button
              type="button"
              onClick={() => setFailedIds([])}
              className="min-h-11 rounded-pill px-3 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        </div>
      </BlockSection>
    );
  }

  const active = playable[Math.min(index, playable.length - 1)];
  const isCarousel = block.variant === "multi-clip-carousel" && playable.length > 1;

  return (
    <BlockSection>
      <Reveal as="figure" className="space-y-[var(--space-2)]">
        <div className="relative">
          {active ? (
            <FilmFrame
              key={active.id}
              clip={active}
              className="aspect-video rounded-md"
              onError={() => setFailedIds((ids) => [...ids, active.id])}
            />
          ) : null}
          {isCarousel ? (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-[var(--space-2)]">
              <CarouselArrow
                dir="prev"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              />
              <CarouselArrow
                dir="next"
                disabled={index >= playable.length - 1}
                onClick={() => setIndex((i) => Math.min(playable.length - 1, i + 1))}
              />
            </div>
          ) : null}
        </div>
        {block.props.caption ? (
          <figcaption className="text-caption uppercase tracking-[0.04em] text-muted">
            {block.props.caption}
            {isCarousel ? (
              <span className="ml-2 font-mono tabular-nums">
                {index + 1}/{playable.length}
              </span>
            ) : null}
          </figcaption>
        ) : null}
      </Reveal>
    </BlockSection>
  );
}

function CarouselArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous clip" : "Next clip"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-pill bg-surface/85 text-ink shadow-subtle transition-all duration-tap ease-kol active:scale-[0.98]",
        disabled && "pointer-events-none opacity-0",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
