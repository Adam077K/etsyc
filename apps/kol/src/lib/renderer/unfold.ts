import { STAGGER_MS } from "@/components/motion/Reveal";

/**
 * World-unfold choreography timing — screen-specs §3.3, binding.
 *
 * The unfold is a 900 ms HARD CAP on --ease-cinematic in three timed bands:
 *
 *   0–280     ground wash + feed fade-out (CSS: the .kol-world background
 *             cross-fade in globals.css — no per-block math)
 *   140–620   blocks rise in staggered waves — translateY 18→0, 70 ms
 *             stagger, NEAREST-TO-FILM FIRST outward in both directions;
 *             parallax depth: blocks further from the film travel ~1.3×
 *             the distance
 *   340–900   atmosphere bands and secondary media resolve last — the
 *             world "breathes out"
 *   t=900     settled. Nothing animates after this — large worlds clamp
 *             their tail delays so every rise completes inside the cap.
 *
 * Pure math, no DOM: StoreWorld feeds each block's film-distance in and
 * writes the result as per-item CSS custom properties; the transitions
 * themselves live in globals.css. The reverse edge (WORLD_OPEN → GROWN) is
 * derived there too: --dur-unfold × --return-ratio = 702 ms, no stagger.
 */

/** §3.3 hard cap — nothing animates after this. */
export const UNFOLD_HARD_CAP_MS = 900;
/** Band 2 opens: the first (nearest-to-film) block starts rising here. */
export const UNFOLD_WAVE_START_MS = 140;
/** Band 3 opens: atmosphere never resolves before this. */
export const UNFOLD_ATMOSPHERE_START_MS = 340;
/** One block's rise (translateY + opacity) — matches --dur-enter. */
export const UNFOLD_RISE_DURATION_MS = 340;
/** Atmosphere's slow opacity resolve — 340 + 560 lands exactly on the cap. */
export const UNFOLD_ATMOSPHERE_DURATION_MS = 560;
/** Band 2 rise distance for the nearest block (px). */
export const UNFOLD_RISE_BASE_PX = 18;
/** Parallax depth — the furthest block travels ~1.3× the nearest's rise. */
export const UNFOLD_RISE_PARALLAX = 1.3;

export interface UnfoldTiming {
  /** transition-delay, ms from unfold start. */
  delayMs: number;
  /** transition-duration, ms — delayMs + durationMs never exceeds the cap. */
  durationMs: number;
  /** translateY start offset, px — 0 for atmosphere (it resolves, not rises). */
  risePx: number;
}

/**
 * Timing for one world-body block.
 *
 * @param distance 1-based distance from the hero film in block order —
 *   1 = adjacent to the film, counted outward in BOTH directions (the
 *   block directly above and the block directly below the film are both
 *   distance 1: nearest-to-film first).
 * @param maxDistance the largest distance in this world (≥ 1) — scales the
 *   parallax so the furthest block travels ~1.3× the nearest's rise.
 * @param isAtmosphere atmosphere bands resolve in band 3 (340–900) as an
 *   opacity-only breath, regardless of proximity to the film.
 */
export function unfoldTiming(
  distance: number,
  maxDistance: number,
  isAtmosphere: boolean,
): UnfoldTiming {
  const wave = UNFOLD_WAVE_START_MS + (distance - 1) * STAGGER_MS;

  if (isAtmosphere) {
    // band 3: never before 340; deep-world stragglers clamp so the resolve
    // still completes at the cap (duration shrinks before delay grows past
    // the last slot that fits).
    const latestStart = UNFOLD_HARD_CAP_MS - UNFOLD_RISE_DURATION_MS;
    const delayMs = Math.min(Math.max(wave, UNFOLD_ATMOSPHERE_START_MS), latestStart);
    const durationMs = Math.min(UNFOLD_ATMOSPHERE_DURATION_MS, UNFOLD_HARD_CAP_MS - delayMs);
    return { delayMs, durationMs, risePx: 0 };
  }

  // band 2 wave, clamped to the cap: in a deep world the tail blocks share
  // the last start slot that still completes by t=900 (ordering among the
  // clamped tail ties — acceptable; violating the cap is not).
  const latestStart = UNFOLD_HARD_CAP_MS - UNFOLD_RISE_DURATION_MS;
  const delayMs = Math.min(wave, latestStart);

  // parallax depth: interpolate 1× → ~1.3× across the world's real depth so
  // the nearest block rises exactly 18px and the furthest ~23.4px.
  const depth = maxDistance > 1 ? (distance - 1) / (maxDistance - 1) : 0;
  const risePx =
    Math.round(UNFOLD_RISE_BASE_PX * (1 + (UNFOLD_RISE_PARALLAX - 1) * depth) * 10) / 10;

  return { delayMs, durationMs: UNFOLD_RISE_DURATION_MS, risePx };
}
