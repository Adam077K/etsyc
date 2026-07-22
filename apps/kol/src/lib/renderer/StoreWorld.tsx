"use client";

import { useState, type ReactNode } from "react";
import type { BlockState } from "@/components/blocks/shared";
import type { StoreBlock, StoreConfig } from "@/lib/store-config/types";
import { themeStyle } from "@/lib/theme/apply-theme";
import { cn } from "@/lib/utils";
import { HeroStage } from "./HeroStage";
import { renderBlock } from "./render-block";
import { isWorldUnfolded, STAGE_LABELS, WORLD_STAGES, type WorldStage } from "./stages";
import { unfoldTiming } from "./unfold";

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
  pinnedClipId,
}: StoreWorldProps) {
  const [stage, setStage] = useState<WorldStage>(initialStage);

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
      data-store={config.storeId}
      data-theme-kind={config.theme.kind}
      data-motion-preset={config.theme.motionPreset}
      data-world-stage={stage}
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
  return (
    <nav
      aria-label="Simulate buyer journey stage"
      className="fixed bottom-[var(--space-2)] left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex gap-1 rounded-pill border border-line bg-surface/90 p-1 shadow-raised backdrop-blur">
        {WORLD_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === stage}
            onClick={() => onStage(s)}
            className={cn(
              "min-h-11 rounded-pill px-3 font-mono text-caption uppercase tracking-[0.04em] transition-colors duration-state ease-kol",
              s === stage ? "bg-ink text-ground" : "text-muted hover:text-ink",
            )}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>
    </nav>
  );
}
