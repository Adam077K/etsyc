"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { BlockState } from "@/components/blocks/shared";
import { BrowseSwapController } from "@/lib/browse/BrowseSwapController";
import type { StoreBlock, StoreConfig } from "@/lib/store-config/types";
import { themeStyle } from "@/lib/theme/apply-theme";
import { cn } from "@/lib/utils";
import { HeroStage } from "./HeroStage";
import { renderBlock } from "./render-block";
import { isWorldUnfolded, STAGE_LABELS, WORLD_STAGES, type WorldStage } from "./stages";
import { unfoldTiming } from "./unfold";
import { useProductNarration } from "./useProductNarration";
import { WorldInteractionContext, type WorldInteraction } from "./world-interaction";

export interface StoreWorldProps {
  config: StoreConfig;
  /** Fallback state for every block without a per-block override. */
  state?: BlockState;
  /** Per-block state control by block id — progressive loading / local degrade. */
  blockStates?: Record<string, BlockState>;
  isPreview?: boolean;
  /** Simulated buyer-journey stage the world starts in. */
  initialStage?: WorldStage;
  /**
   * B5/B6 hook: fires alongside the built-in NARRATE_SHRINK advance when a
   * buyer clicks a product (B4 exposes the handoff; B5 owns the shrink).
   */
  onProductSelect?: (productId: string) => void;
  /**
   * Product the dock narrates at NARRATE_SHRINK. Normally OMITTED — the
   * in-world journey wires itself: B4's product click records
   * `selectedProductId` and the narration hook consumes it directly. Pass
   * this only to OVERRIDE that wiring (B6: the product page renders around
   * the dock and owns which product is open). null/omitted with no click
   * recorded → the engine's store-wide narration fallback applies.
   */
  narrationProductId?: string | null;
  /**
   * The engine's WORLD_OPEN pick (Selection.clips[0].videoId) — the store's
   * signature clip for the persistent single-clip slot. The engine and the
   * renderer meet ONLY here, at videos.id ≡ media.clips[].id: when the id is
   * among the hero's own clipTags it is preferred; otherwise the seller's
   * binding order stands (the engine can bias the slot, never force a clip
   * the seller didn't bind).
   */
  pinnedClipId?: string;
}

/**
 * StoreWorld — the client world shell renderStore composes. Owns the three
 * renderer-level guarantees the blocks can't own for themselves:
 *
 *  1. Renderer-level 4 states — empty: the unpublished-store guard (never a
 *     broken shell); loading/error: threaded PER BLOCK via `blockStates`
 *     (progressive skeletons, local degrade), with `state` as the fallback;
 *     success: the full interactive world.
 *  2. Hero persistence — exactly one hero-video block mounts inside
 *     HeroStage (`layoutId="hero-video"`), which registers the ONE film
 *     slot with the app-root Film Layer (Amendment A): the film frame
 *     never unmounts and never shows a paused or black frame across
 *     world-stage transitions. Extra hero blocks (a validator invariant
 *     upstream, P3) are defensively dropped rather than registering a
 *     second shared slot.
 *  3. Stage choreography — `data-world-stage` drives the unfold: in
 *     feed/grown the body is faded out (opacity + inert, CSS in
 *     globals.css); world-open reveals it on --ease-kol; narrate-shrink
 *     docks the film (the Film Layer's dock edge, claimed by HeroStage).
 *     Blocks keep their own §4.2 reveals — the renderer never
 *     double-animates them.
 */
export function StoreWorld({
  config,
  state = "success",
  blockStates,
  isPreview = false,
  initialStage = "world-open",
  onProductSelect,
  narrationProductId = null,
  pinnedClipId,
}: StoreWorldProps) {
  const [stage, setStage] = useState<WorldStage>(initialStage);
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // B4 → B5 handoff: a product click advances toward NARRATE_SHRINK (the
  // Film Layer's dock edge fires via HeroStage) and records the product on
  // the world root; B5 narrates it, B4 never builds the shrink.
  const interaction = useMemo<WorldInteraction>(
    () => ({
      selectedProductId,
      onProductSelect: (productId: string) => {
        setSelectedProductId(productId);
        onProductSelect?.(productId);
        setStage("narrate-shrink");
      },
    }),
    [selectedProductId, onProductSelect],
  );

  // B5: entering NARRATE_SHRINK asks the engine for the product's
  // narration clip and cross-fades it into the docked film; no match /
  // any fault → the persistent clip plays on, indistinguishable (§5.4).
  // `data-narration` below is the QA/e2e observability hook — invisible.
  //
  // THE B4 → B5 SEAM (integration wiring — the two units shipped unwired):
  // the productId is B4's recorded click unless the caller overrides it.
  // Without this line the hook read only the prop, nobody passed it on the
  // in-world journey, and NARRATE_SHRINK narrated the store-wide fallback
  // instead of the product the buyer tapped.
  const { status: narrationStatus } = useProductNarration({
    storeId: config.storeId,
    productId: narrationProductId ?? selectedProductId,
    active: stage === "narrate-shrink",
  });

  // Renderer-level EMPTY: an unpublished world never renders a broken shell.
  // Preview is the seller/critic surface — it may look at any status.
  if (config.meta.status !== "published" && !isPreview) {
    return <UnpublishedGuard config={config} />;
  }

  const data = {
    maker: config.maker,
    media: config.media,
    products: config.products,
    voiceovers: config.voiceovers,
  };

  const ordered = [...config.blocks].sort((a, b) => a.order - b.order);
  const heroIndex = ordered.findIndex((block) => block.type === "hero-video");
  const heroBlock = heroIndex === -1 ? undefined : ordered[heroIndex];
  const hero = heroBlock === undefined ? undefined : pinHeroClip(heroBlock, pinnedClipId);
  const before = heroIndex === -1 ? ordered : ordered.slice(0, heroIndex);
  const after =
    heroIndex === -1
      ? []
      : ordered.slice(heroIndex + 1).filter((block) => block.type !== "hero-video");

  const stateOf = (block: StoreBlock): BlockState => blockStates?.[block.id] ?? state;
  const unfolded = isWorldUnfolded(stage);
  // Parallax depth scale for the §3.3 unfold — the furthest block in EITHER
  // direction sets the world's depth so both sides rise on one scale.
  const maxDistance = Math.max(before.length, after.length, 1);

  return (
    <div
      ref={rootRef}
      data-store={config.storeId}
      data-theme-kind={config.theme.kind}
      data-motion-preset={config.theme.motionPreset}
      data-world-stage={stage}
      data-selected-product={selectedProductId ?? undefined}
      data-narration={narrationStatus}
      style={themeStyle(config.theme)}
      className={cn(
        // background-color comes from the .kol-world rule in globals.css
        // (NOT the bg-ground utility) so the §3.3 band-1 ground wash —
        // transparent in feed/grown, the world's --ground from world-open
        // on — can win in the components layer.
        "kol-world flex min-h-screen flex-col font-text text-body text-ink",
        "gap-[var(--space-section)] pb-[var(--space-section)]",
      )}
    >
      <WorldInteractionContext.Provider value={interaction}>
        {before.length > 0 ? (
          <WorldBody unfolded={unfolded}>
            {before.map((block, i) => (
              // above the film: the LAST block borders the hero → distance 1,
              // counted outward (nearest-to-film first in both directions)
              <UnfoldItem key={block.id} block={block} distance={before.length - i} maxDistance={maxDistance}>
                {renderBlock(block, data, stateOf(block), isPreview)}
              </UnfoldItem>
            ))}
          </WorldBody>
        ) : null}
        {hero ? (
          <HeroStage stage={stage}>{renderBlock(hero, data, stateOf(hero), isPreview)}</HeroStage>
        ) : null}
        {after.length > 0 ? (
          <WorldBody unfolded={unfolded}>
            {after.map((block, i) => (
              <UnfoldItem key={block.id} block={block} distance={i + 1} maxDistance={maxDistance}>
                {renderBlock(block, data, stateOf(block), isPreview)}
              </UnfoldItem>
            ))}
          </WorldBody>
        ) : null}
      </WorldInteractionContext.Provider>
      {/* B4 — the WORLD_BROWSE choreographer: first-scroll stage advance +
          scoring-driven clip swaps at block boundaries. Headless; only a
          world with a hero (a film to swap) mounts it. */}
      {hero ? (
        <BrowseSwapController
          storeId={config.storeId}
          clips={config.media.clips}
          stage={stage}
          worldRef={rootRef}
          onEnterBrowse={() => setStage("world-browse")}
        />
      ) : null}
      {isPreview ? <StageRail stage={stage} onStage={setStage} /> : null}
    </div>
  );
}

/**
 * The engine ↔ renderer seam (videos.id ≡ media.clips[].id): prefer the
 * engine's WORLD_OPEN pick by moving it to the front of the hero's OWN
 * clipTags. A pick outside the seller's bindings is ignored — the engine
 * biases the persistent slot, it never overrides the seller's authoring.
 */
function pinHeroClip(hero: StoreBlock, pinnedClipId: string | undefined): StoreBlock {
  if (!pinnedClipId || hero.type !== "hero-video") return hero;
  const { clipTags } = hero.bindings;
  if (!clipTags.includes(pinnedClipId) || clipTags[0] === pinnedClipId) return hero;
  return {
    ...hero,
    bindings: {
      ...hero.bindings,
      clipTags: [pinnedClipId, ...clipTags.filter((tag) => tag !== pinnedClipId)],
    },
  };
}

/**
 * One world-body block in the §3.3 unfold choreography. Writes the timing
 * (unfold.ts) as CSS custom properties; the folded/unfolded transitions
 * themselves live on .kol-unfold-item in globals.css — transform + opacity
 * only, --ease-cinematic, everything settled by t=900. Atmosphere bands
 * resolve in band 3 (the world "breathes out"), other blocks rise in band-2
 * waves, nearest-to-film first. Reduced motion: globals.css collapses this
 * to an instant fade (no translate, no parallax) — the film never pauses.
 */
function UnfoldItem({
  block,
  distance,
  maxDistance,
  children,
}: {
  block: StoreBlock;
  distance: number;
  maxDistance: number;
  children: ReactNode;
}) {
  const timing = unfoldTiming(distance, maxDistance, block.type === "atmosphere");
  return (
    <div
      className="kol-unfold-item"
      data-unfold-distance={distance}
      style={
        {
          "--unfold-delay": `${timing.delayMs}ms`,
          "--unfold-dur": `${timing.durationMs}ms`,
          "--unfold-rise": `${timing.risePx}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * The non-hero blocks around the film. Stays MOUNTED in feed/grown (so the
 * unfold is a rise-in, not a mount — and nothing inside loses state); each
 * child UnfoldItem carries its own §3.3 fold/rise CSS via [data-world-stage],
 * and inert removes the body from tab order and the accessibility tree
 * while folded.
 */
function WorldBody({ unfolded, children }: { unfolded: boolean; children: ReactNode }) {
  return (
    <div
      className="kol-world-body flex flex-col gap-[var(--space-section)]"
      inert={unfolded ? undefined : true}
    >
      {children}
    </div>
  );
}

/**
 * Renderer-level empty state: the unpublished-store guard. A quiet, themed
 * closed door — never a broken shell (spec P4 edge case).
 */
function UnpublishedGuard({ config }: { config: StoreConfig }) {
  return (
    <div
      data-store={config.storeId}
      data-unpublished-guard=""
      style={themeStyle(config.theme)}
      className="kol-world flex min-h-screen flex-col items-center justify-center gap-[var(--space-2)] bg-ground px-[var(--space-2)] text-center font-text"
    >
      <p className="font-display text-h2 text-ink [text-wrap:balance]">
        {config.maker.displayName}&rsquo;s world isn&rsquo;t open yet
      </p>
      <p className="max-w-measure text-body text-muted">
        {config.maker.displayName} is still shaping this space. Worlds open when their maker says
        they&rsquo;re ready — come back soon.
      </p>
    </div>
  );
}

/**
 * Preview-only stage rail — lets QA/design-critic walk the buyer journey
 * (FEED → GROWN → WORLD_OPEN → WORLD_BROWSE → NARRATE_SHRINK) and watch the
 * film survive every transition. Never rendered on a live world.
 */
function StageRail({
  stage,
  onStage,
}: {
  stage: WorldStage;
  onStage: (stage: WorldStage) => void;
}) {
  // Gate finding P3-A: the rail is LEFT-aligned from md so it can never meet
  // the bottom-RIGHT dock band (right-aligning would guarantee the collision
  // it fixes); below md it stays centered (the mobile centered-vs-centered
  // dock overlap at 375 is a separate case — flagged, not fixed here).
  return (
    <nav
      aria-label="Simulate buyer journey stage"
      className="fixed bottom-[var(--space-2)] left-1/2 z-50 -translate-x-1/2 md:left-[var(--space-2)] md:translate-x-0"
    >
      <div className="flex gap-0.5 rounded-pill border border-line bg-surface/90 p-1 shadow-raised backdrop-blur sm:gap-1">
        {WORLD_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === stage}
            // accessible name stays the canonical label at every viewport —
            // the sub-sm "Open" swap below is visual-only
            aria-label={STAGE_LABELS[s]}
            onClick={() => onStage(s)}
            className={cn(
              // gate finding P1-A: this rail is the instrument mobile reviews
              // are conducted with — at 375 the full-label pill overflowed and
              // clipped ("FEED" read "EED"). Tighter padding + the short
              // world-open label below sm keep all five stages visible at
              // once; a scrollable rail would hide instrument state instead.
              "min-h-11 rounded-pill px-1.5 font-mono text-caption uppercase tracking-[0.04em] transition-colors duration-state ease-kol sm:px-3",
              s === stage ? "bg-ink text-ground" : "text-muted hover:text-ink",
            )}
          >
            {s === "world-open" ? (
              <>
                <span className="sm:hidden">Open</span>
                <span className="hidden sm:inline">{STAGE_LABELS[s]}</span>
              </>
            ) : (
              STAGE_LABELS[s]
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
