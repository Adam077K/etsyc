"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFilmLayer } from "@/components/film/FilmLayer";
import { useFilmSlot } from "@/components/film/useFilmSlot";
import { clipObjectPosition } from "@/components/media/focal-point";
import { PosterStill } from "@/components/media/PosterStill";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import type { FeedCard, FeedCardAspect } from "@/lib/feed/select";
import { cn } from "@/lib/utils";

import { AMBIENT_LOOP_SECONDS } from "./focus";
import type { SlotName, SlotSpec } from "./spreads";

/**
 * One maker card (W3-B1b — screen-specs §1.2). Media-first, caption-
 * subordinate: NO card chrome — no border, no shadow, no background. The
 * media is the card. Maker name, craft line, place; nothing else — no
 * price, no rating, no badge, no urgency chrome (the banned list).
 *
 * Film presence follows the Focus Film model (CPO Ruling 2):
 *   focus   — this card's media box is the shared Film Layer's slot; the
 *             claim SNAPS the frame here (focus moves are not §5.2 edges —
 *             that table belongs to the buyer state machine, and B1b may
 *             not extend it) and the clip arrives by the in-frame
 *             --dur-swap cross-fade. ≤200ms total, per the AC.
 *   ambient — a disposable low-fi loop (muted, ≤6s replay window, never
 *             the shared element) so the page reads alive around focus.
 *   rest    — the poster still, focalPoint-cropped to the slot aspect.
 *
 * Stacking contract note: nothing in this card needs to paint OVER the
 * film — the caption sits below the media box, and the :focus-visible
 * outline rings the whole card outside the film rect — so the card adds
 * no z-index and creates no stacking context on the ancestor chain
 * (globals.css film contract; DECISIONS 2026-07-22).
 */

/** md+ slot placement — literal class strings so Tailwind sees them. */
export const SLOT_LAYOUT_CLASS: Record<SlotName, string> = {
  LEAD: "md:col-start-1 md:col-span-7",
  SIDE: "md:col-start-9 md:col-span-4 md:mt-[var(--space-12)]",
  WIDE: "md:col-start-3 md:col-span-8",
  INSET: "md:col-start-1 md:col-span-5 md:mt-[var(--space-8)]",
  TALL: "md:col-start-8 md:col-span-5",
};

/** Single-column aspect (< md) — variety carried by height (§1.6). */
export const MOBILE_ASPECT_CLASS: Record<FeedCardAspect, string> = {
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "3:2": "aspect-[3/2]",
};

/** Desktop slot aspect override at md+. */
export const DESKTOP_ASPECT_CLASS: Record<FeedCardAspect, string> = {
  "4:5": "md:aspect-[4/5]",
  "16:9": "md:aspect-video",
  "1:1": "md:aspect-square",
  "3:2": "md:aspect-[3/2]",
};

export function FeedCardView({
  card,
  slot,
  mobileAspect,
  indexInSpread,
  isFocus,
  isAmbient,
  cardRef,
  onActivate,
}: {
  card: FeedCard;
  slot: SlotSpec;
  mobileAspect: FeedCardAspect;
  /** Position within the spread — drives the 70ms reveal stagger. */
  indexInSpread: number;
  isFocus: boolean;
  isAmbient: boolean;
  /** FeedMagazine's rect handle for focus selection. */
  cardRef?: (element: HTMLElement | null) => void;
  /** Tap seam: promote-to-focus happens here; B2 attaches `grow` on top. */
  onActivate: (element: HTMLElement | null) => void;
}) {
  const layer = useFilmLayer();
  const { ref: filmSlotRef, claim, publish } = useFilmSlot();
  const articleRef = useRef<HTMLElement | null>(null);
  const [ambientFailed, setAmbientFailed] = useState(false);

  const setArticleRef = useCallback(
    (element: HTMLElement | null) => {
      articleRef.current = element;
      cardRef?.(element);
    },
    [cardRef],
  );

  // Focus promotion: claim the shared frame onto this media box (snap),
  // then cross-fade the clip in-frame. Without a FilmLayerProvider both
  // calls no-op — the card degrades to its poster, never crashes.
  useEffect(() => {
    if (!isFocus || layer === null) return;
    claim(null);
    layer.swapClip({
      src: card.src,
      poster: card.poster ?? "",
      captionsSrc: card.captionsSrc,
      focalPoint: card.focalPoint ?? undefined,
    });
  }, [isFocus, layer, claim, card.src, card.poster, card.captionsSrc, card.focalPoint]);

  // The entrance Reveal translates this card; a focus claim measured
  // mid-reveal would park the film 16px off. Re-sync the slot rect when
  // the reveal transform settles (rect maintenance snaps, never an edge).
  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLElement>) => {
      if (event.propertyName !== "transform") return;
      if (isFocus) publish();
    },
    [isFocus, publish],
  );

  const focal = clipObjectPosition({ focalPoint: card.focalPoint ?? undefined });
  const detailLine = [card.craft, card.place].filter(Boolean).join(" · ");
  const showAmbient = isAmbient && !isFocus && !ambientFailed;
  const mediaMotionClass =
    "transition-transform duration-state ease-kol motion-safe:group-hover:scale-[1.02] motion-safe:group-has-[:focus-visible]:scale-[1.02]";

  return (
    <article
      ref={setArticleRef}
      data-feed-card=""
      data-feed-slot={slot.name}
      data-feed-focus={isFocus ? "" : undefined}
      data-feed-ambient={showAmbient ? "" : undefined}
      data-feed-motion={isFocus || showAmbient ? "" : undefined}
      className={cn("group relative min-w-0 self-start", SLOT_LAYOUT_CLASS[slot.name])}
      onTransitionEnd={handleTransitionEnd}
    >
      <Reveal delayMs={indexInSpread * STAGGER_MS}>
        <div
          ref={filmSlotRef}
          data-feed-media=""
          className={cn(
            // bg-ground is the designed fallback beneath a loading or
            // failed poster (PosterStill hides itself on 404) — never a
            // black hole, never a spinner
            "relative w-full overflow-hidden rounded-md bg-ground",
            MOBILE_ASPECT_CLASS[mobileAspect],
            DESKTOP_ASPECT_CLASS[slot.aspect],
          )}
        >
          {card.poster !== null ? (
            <PosterStill
              src={card.poster}
              className={cn("absolute inset-0 h-full w-full object-cover", mediaMotionClass)}
              objectPosition={focal}
            />
          ) : null}
          {showAmbient ? (
            <video
              data-feed-ambient-video=""
              // React SSR omits the muted ATTRIBUTE; autoplay policy needs
              // the property set before play — hence the ref belt-and-braces
              ref={(element) => {
                if (element) {
                  element.muted = true;
                  void Promise.resolve(element.play()).catch(() => {
                    /* autoplay veto — the poster beneath stays, quietly */
                  });
                }
              }}
              src={card.src}
              poster={card.poster ?? undefined}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              onError={() => setAmbientFailed(true)}
              onTimeUpdate={(event) => {
                // ambient loops replay a ≤6s window (AC) — the data layer
                // has no low-fi rendition, so the window is enforced here
                const video = event.currentTarget;
                if (video.currentTime > AMBIENT_LOOP_SECONDS) video.currentTime = 0;
              }}
              className={cn("absolute inset-0 h-full w-full object-cover", mediaMotionClass)}
              style={{ objectPosition: focal }}
            />
          ) : null}
        </div>
      </Reveal>
      {/* media leads, text follows — one stagger step behind (§4.2) */}
      <Reveal
        delayMs={indexInSpread * STAGGER_MS + STAGGER_MS}
        className="mt-[var(--space-2)] flex flex-col gap-[var(--space-0-5)]"
      >
        <h2
          className={cn(
            "font-display text-h3 font-medium text-ink",
            "transition-colors duration-state ease-kol",
            "group-hover:text-accent group-has-[:focus-visible]:text-accent",
          )}
        >
          {card.makerName}
        </h2>
        {detailLine !== "" ? (
          <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
            {detailLine}
          </p>
        ) : null}
      </Reveal>
      {/* Stretched tap target: a <button> may not contain a heading, so the
          whole-card target is an absolutely positioned sibling. Its outline
          (globals :focus-visible) rings the full card; 44px floor is the
          card itself. NOTE for B2: over the FOCUS card's media rect this
          button sits under the Film Layer (z 30), so grow-from-focus taps
          land on the layer frame — the caption strip stays tappable. */}
      <button
        type="button"
        onClick={() => onActivate(articleRef.current)}
        aria-label={
          detailLine !== ""
            ? `Watch ${card.makerName} — ${detailLine}`
            : `Watch ${card.makerName}`
        }
        className="absolute inset-0 z-10 min-h-11 w-full cursor-pointer rounded-md"
      />
    </article>
  );
}
