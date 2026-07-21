/**
 * Gate ② scoring — the weighted coherence rubric (spec §6.2/§6.3).
 *
 * Kept out of the route file so the eval harness and the UI can share the
 * exact same threshold and weights the publish gate uses. A floor that
 * differs between "what we test" and "what we ship" is not a floor.
 */

/** Launch-tunable, deliberately named rather than inlined in a branch. */
export const COHERENCE_THRESHOLD = 0.75;

export const RUBRIC_WEIGHTS = {
  hierarchy: 0.3,
  coherence: 0.35,
  fitToBrand: 0.25,
  slopAvoidance: 0.1,
} as const;

export interface RubricDimensions {
  hierarchy: number;
  coherence: number;
  fitToBrand: number;
  slopAvoidance: number;
}

export function weightedScore(d: RubricDimensions): number {
  const raw =
    d.hierarchy * RUBRIC_WEIGHTS.hierarchy +
    d.coherence * RUBRIC_WEIGHTS.coherence +
    d.fitToBrand * RUBRIC_WEIGHTS.fitToBrand +
    d.slopAvoidance * RUBRIC_WEIGHTS.slopAvoidance;
  return Math.round(raw * 100) / 100;
}
