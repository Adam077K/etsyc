"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FilmFrame } from "@/components/media/FilmFrame";
import { clipObjectPosition } from "@/components/media/focal-point";
import { PosterStill } from "@/components/media/PosterStill";
import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { Skeleton } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { firstClip, type BlockProps } from "../shared";
import { fitHeroStatement } from "./statement-fit";

/**
 * Block 1 · hero-video — the persistent maker film the world unfolds around.
 * Exactly one per world. Will carry layoutId="hero-video" when the Phase-6
 * unfold/dock choreography lands; here it renders the three resting variants.
 * Sound off until opt-in; controls are mute + captions only (FilmFrame).
 */
export function HeroVideoBlock({ block, data, state = "success", isPreview }: BlockProps<"hero-video">) {
  const clip = firstClip(data, block.bindings.clipTags);
  const [clipFailed, setClipFailed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLHeadingElement>(null);
  const statement = block.props.statement;

  // Lines-after-balance fit (gate-2 P1): the ≤48-char budget could not bound
  // a line count across five pairings, so the statement is fitted in the
  // ACTUAL rect — step the display size down until it sets ≤3 lines and the
  // chrome band stays within its frame cap. Re-fits on frame resize.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const chrome = chromeRef.current;
    const h1 = statementRef.current;
    if (!frame || !chrome || !h1 || !statement) return;
    const refit = () => fitHeroStatement({ frame, chrome, statement: h1 });
    refit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(refit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [statement, state, clip]);

  // Mobile aspect (design-lead band ruling): 16:9 at 375px leaves 211px of
  // frame — chrome alone needs ~140px, so no scrim tuning can show film in
  // it. The two full-frame variants go 4:5 below sm (469px tall at 375px:
  // ~60% film stays visible); corner-shrunk stays widescreen.
  const frameClass = {
    "full-bleed": "aspect-[4/5] sm:aspect-video w-full", // edge-to-edge, radius 0
    "center-column": "mx-auto aspect-[4/5] sm:aspect-video w-full max-w-page rounded-lg md:w-[72%]",
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
            <PosterStill
              src={clip.poster}
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              objectPosition={clipObjectPosition(clip)}
            />
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
          <PosterStill
            src={clip.poster}
            className="h-full w-full object-cover opacity-60"
            objectPosition={clipObjectPosition(clip)}
          />
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
          : // panel variants get a deliberate top inset (gate-2 P2: a panel
            // flush to y=0 with only bottom radii reads pushed out of frame)
            "mx-auto w-full max-w-page px-[var(--space-2)] pt-[var(--space-2)] md:px-[var(--space-6)] md:pt-[var(--space-4)]",
      )}
    >
      {/* container-query root: display-hero sizes to the FRAME, not the
          viewport, so sub-page-width containers (matrix cells, docked
          variants) scale the line down instead of clipping mid-word */}
      <div
        ref={frameRef}
        className={cn("kol-scrim relative overflow-hidden [container-type:inline-size]", frameClass)}
      >
        {showError ? (
          <div className="relative flex h-full w-full items-end bg-surface">
            <PosterStill
              src={clip.poster}
              className="absolute inset-0 h-full w-full object-cover"
              objectPosition={clipObjectPosition(clip)}
            />
            <p className="relative m-4 rounded-md bg-surface/85 px-3 py-2 text-caption text-muted">
              Couldn&rsquo;t load this clip
            </p>
          </div>
        ) : (
          <FilmFrame clip={clip} className="h-full" onError={() => setClipFailed(true)} />
        )}
        {/* the one big line per world — display-hero over film, --on-media ink
            over the scrim. Exactly ONE display-tier line in either case (E5
            ruling, screen-specs §3.2): a maker-authored statement takes the
            hero slot light and open (weight 400–500, -0.01em — speech, a
            guest on the maker's face); absent → the maker's NAME holds the
            tier in the NAMEPLATE REGISTER (§2.1a / R1: --nameplate-size/
            -weight/-tracking resolved from the pairing's strokeClass —
            modulated: display-hero/700/-0.03em; uniform: display/600/
            -0.025em. Smaller-and-heavier vs the statement's larger-and-
            lighter; stored identity, not attributed speech). Nothing else is ever promoted
            into the tier (D10: no generated line, no craft-line promotion,
            no store name AS the maker's words). */}
        {/* the chrome band paints its OWN backdrop (gate-2 P1 / invariant I5):
            solid --scrim-strong under every set line, fading out over the
            reserved padding-top zone above. Bottom-anchored inside the
            overflow-hidden frame, it grows DOWN-INTO covered scrim with the
            text by construction — a line can never sit on bare film or page
            ground, so over-film contrast is contrast(on-media, scrim-strong):
            deterministic, footage-independent. */}
        <div
          ref={chromeRef}
          className="kol-hero-chrome pointer-events-none absolute inset-x-0 bottom-0 z-10 px-[var(--space-4)] pb-[var(--space-4)] md:px-[var(--space-8)] md:pb-[var(--space-8)]"
        >
          {statement ? (
            <h1
              ref={statementRef}
              className="font-display font-medium leading-[0.92] tracking-[-0.01em] text-on-media [text-wrap:balance] text-[min(var(--fs-display-hero),8cqi)] sm:text-[min(var(--fs-display-hero),10cqi)]"
            >
              {statement}
            </h1>
          ) : (
            <h1 className="font-display leading-[0.92] text-on-media [text-wrap:balance] [font-weight:var(--nameplate-weight)] [letter-spacing:var(--nameplate-tracking)] text-[min(var(--nameplate-size),10cqi)]">
              {data.maker.displayName}
            </h1>
          )}
          {/* the identity line — the hero frame is NEVER nameless (E5): B3 is
              deep-linkable, and a buyer landing cold must be able to name the
              person whose words they are reading. Statement present → the
              name DEMOTES to lead this caption line (showCraftLine true or
              false); absent → the name is already the display line above and
              the caption stays craft · location. Never truncated — a name
              wraps before it is cut.
              Gap under display-hero (gate-2 P2 crowding, band re-ruling):
              the bound is INK-TO-INK ≥40px — box margin minus descender
              overhang minus caption half-leading (tight 0.92 leading lets
              descenders overhang the line box). mt-12 (48px) clears it on
              both stroke classes (grotesk ~50px, Fraunces ~46px); mt-10
              left Fraunces ~2px short. mt-4 at mobile is proportionate
              to the 8cqi scale. Name gets
              one step of separation (+100 weight — gate-2 P2 identity
              claim; never opacity, §0.4). */}
          {statement ? (
            <p className="mt-4 md:mt-12 font-text text-caption uppercase tracking-[0.08em] text-on-media">
              <span className="font-medium">{data.maker.displayName}</span>
              {block.props.showCraftLine ? (
                <> · {data.maker.craft} · {data.maker.location}</>
              ) : null}
            </p>
          ) : block.props.showCraftLine ? (
            <p className="mt-4 md:mt-12 font-text text-caption uppercase tracking-[0.08em] text-on-media">
              {data.maker.craft} · {data.maker.location}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
