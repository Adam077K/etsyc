/**
 * Focus Film selection model (W3-B1b — discovery-feed AC "Film presence",
 * CPO Ruling 2). ONE shared Film Layer plays on the card nearest viewport
 * centre; up to two composition-order neighbours run disposable ambient
 * loops so the page reads alive (floor: ≥2 cards in motion whenever ≥2 are
 * in view). Pure functions — the debounce and DOM measurement live in
 * FeedMagazine; the selection rules are testable here without a browser.
 */

/** Focus changes at most once per 400ms (AC) — re-targeting on every
 *  scroll tick is nausea, not life. */
export const FOCUS_DEBOUNCE_MS = 400;

/** Up to two neighbouring cards may play ambient loops (screen-specs §1.3). */
export const AMBIENT_NEIGHBOUR_MAX = 2;

/** Ambient loops replay their first 6 seconds only (≤6s per the AC). */
export const AMBIENT_LOOP_SECONDS = 6;

/**
 * Index of the card nearest viewport centre, given each card's distance
 * from it. Ties keep the earlier (engine-ordered) card; unmeasurable cards
 * pass Infinity. Null when nothing is measurable.
 */
export function pickFocusIndex(distances: readonly number[]): number | null {
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < distances.length; i += 1) {
    const distance = distances[i] ?? Number.POSITIVE_INFINITY;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/**
 * The ambient neighbours for a focus card: nearest composition-order
 * indices first (next below, then above — the page should read alive in
 * the direction of travel), widening at the ends so the floor criterion
 * holds wherever focus sits. Never includes the focus card itself; for
 * any count ≥ 2 it returns at least one index.
 */
export function ambientIndicesFor(
  focusIndex: number,
  count: number,
  max: number = AMBIENT_NEIGHBOUR_MAX,
): number[] {
  const out: number[] = [];
  for (let offset = 1; out.length < max && offset < count; offset += 1) {
    const below = focusIndex + offset;
    const above = focusIndex - offset;
    if (below < count) out.push(below);
    if (out.length < max && above >= 0) out.push(above);
  }
  return out;
}
