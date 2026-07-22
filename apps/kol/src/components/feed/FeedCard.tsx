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
import type { MobileSlotName, MobileSlotSpec, SlotAspect, SlotName, SlotSpec } from "./spreads";

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
 *             How many run is a function of cards in view (focus.ts).
 *   rest    — the poster still, focalPoint-cropped to the slot aspect.
 *
 * Below md the card sits in one of the four mobile slots (§1.6): insets
 * are asymmetric, one slot bleeds past both margins, and the caption
 * aligns to its own media's LEFT EDGE — the zig-zagging text column is
 * the mobile anti-grid mechanism, so a fixed page-margin caption would
 * undo it.
 *
 * Stacking contract note: nothing in this card needs to paint OVER the
 * film — the caption sits below the media box, and the :focus-visible
 * outline rings the whole card outside the film rect — so the card adds
 * no z-index and creates no stacking context on the ancestor chain
 * (globals.css film contract; DECISIONS 2026-07-22).
 */

/** md+ column placement — literal class strings so Tailwind sees them. */
export const SLOT_PLACEMENT_CLASS: Record<SlotName, string> = {
  LEAD: "md:col-start-1 md:col-span-7",
  SIDE: "md:col-start-9 md:col-span-4",
  WIDE: "md:col-start-3 md:col-span-8",
  INSET: "md:col-start-1 md:col-span-5",
  TALL: "md:col-start-8 md:col-span-5",
  COLUMN: "md:col-start-5 md:col-span-4",
};

/** md+ drop-Y — applied only when the air pass leaves the plain rhythm. */
export const SLOT_DROP_CLASS: Record<SlotName, string> = {
  LEAD: "",
  SIDE: "md:mt-[var(--space-12)]",
  WIDE: "",
  INSET: "md:mt-[var(--space-8)]",
  TALL: "",
  COLUMN: "md:mt-[var(--space-6)]",
};

/**
 * Vertical placement for a slot at md+: the plain drop, or — when the
 * composition pulls the card up into the previous row's void — a lift of
 * `calc(dropPx − raise%)`. The raise is a percentage of the card's own
 * grid-area width because every height in the layout is width-derived,
 * so the cluster survives viewport scaling. Shared with the skeleton so
 * the loading state is CLS-0 against the live composition.
 */
export function slotLiftProps(
  slot: SlotSpec,
  raisePct: number,
): { className: string; style?: React.CSSProperties } {
  if (raisePct <= 0) return { className: SLOT_DROP_CLASS[slot.name] };
  return {
    className: "md:mt-[var(--feed-lift)]",
    style: {
      "--feed-lift": `calc(${slot.dropYPx}px - ${raisePct}%)`,
    } as React.CSSProperties,
  };
}

/** Aspect at the single-column breakpoint (< md), keyed by slot aspect. */
export const MOBILE_ASPECT_CLASS: Record<FeedCardAspect, string> = {
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "3:2": "aspect-[3/2]",
};

/** Desktop slot aspect override at md+. */
export const DESKTOP_ASPECT_CLASS: Record<SlotAspect, string> = {
  "4:5": "md:aspect-[4/5]",
  "16:9": "md:aspect-video",
  "1:1": "md:aspect-square",
  "3:2": "md:aspect-[3/2]",
  "3:4": "md:aspect-[3/4]",
};

/** §1.6 slot insets on the MEDIA box — the page carries no margin below
 *  md; slots own their edges, and M-BLEED runs viewport edge to edge. */
export const MOBILE_MEDIA_CLASS: Record<MobileSlotName, string> = {
  "M-BLEED": "rounded-none md:rounded-md",
  "M-FULL": "ml-[var(--space-4)] mr-[var(--space-4)] md:ml-0 md:mr-0",
  "M-OFF-L": "ml-[var(--space-4)] mr-[var(--space-16)] md:ml-0 md:mr-0",
  "M-OFF-R": "ml-[var(--space-16)] mr-[var(--space-4)] md:ml-0 md:mr-0",
};

/** The caption aligns to its own media's left edge (§1.6 load-bearing
 *  detail); a bleed's caption indents --space-4 from the viewport edge. */
export const MOBILE_CAPTION_CLASS: Record<MobileSlotName, string> = {
  "M-BLEED": "pl-[var(--space-4)] md:pl-0",
  "M-FULL": "pl-[var(--space-4)] md:pl-0",
  "M-OFF-L": "pl-[var(--space-4)] md:pl-0",
  "M-OFF-R": "pl-[var(--space-16)] md:pl-0",
};

/** §1.6 rhythm: --space-8 after an inset card, --space-12 after a bleed —
 *  a bleed needs more air on the far side of it than an inset does. */
export const MOBILE_RHYTHM_CLASS: Record<MobileSlotName, string> = {
  "M-BLEED": "mb-[var(--space-12)] md:mb-0",
  "M-FULL": "mb-[var(--space-8)] md:mb-0",
  "M-OFF-L": "mb-[var(--space-8)] md:mb-0",
  "M-OFF-R": "mb-[var(--space-8)] md:mb-0",
};

export function FeedCardView({
  card,
  slot,
  raisePct,
  mobileSlot,
  indexInRow,
  isFocus,
  isAmbient,
  cardRef,
  onActivate,
}: {
  card: FeedCard;
  slot: SlotSpec;
  /** Upward pull into the previous row's void at md+ (spreads.ts). */
  raisePct: number;
  mobileSlot: MobileSlotSpec;
  /** Position within the row — drives the 70ms reveal stagger. */
  indexInRow: number;
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
  const lift = slotLiftProps(slot, raisePct);

  return (
    <article
      ref={setArticleRef}
      data-feed-card=""
      data-feed-slot={slot.name}
      data-feed-mobile-slot={mobileSlot.name}
      data-feed-focus={isFocus ? "" : undefined}
      data-feed-ambient={showAmbient ? "" : undefined}
      data-feed-motion={isFocus || showAmbient ? "" : undefined}
      className={cn(
        "group relative min-w-0 self-start",
        SLOT_PLACEMENT_CLASS[slot.name],
        lift.className,
        MOBILE_RHYTHM_CLASS[mobileSlot.name],
      )}
      style={lift.style}
      onTransitionEnd={handleTransitionEnd}
    >
      <Reveal delayMs={indexInRow * STAGGER_MS}>
        <div
          ref={filmSlotRef}
          data-feed-media=""
          className={cn(
            // bg-ground is the designed fallback beneath a loading or
            // failed poster (PosterStill hides itself on 404) — never a
            // black hole, never a spinner
            "relative overflow-hidden rounded-md bg-ground",
            MOBILE_ASPECT_CLASS[mobileSlot.aspect],
            MOBILE_MEDIA_CLASS[mobileSlot.name],
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
        delayMs={indexInRow * STAGGER_MS + STAGGER_MS}
        className={cn(
          "mt-[var(--space-2)] flex flex-col gap-[var(--space-0-5)]",
          MOBILE_CAPTION_CLASS[mobileSlot.name],
        )}
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
