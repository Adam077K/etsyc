import type { Metric } from "./harness";
import type {
  TaggingEvalExpected,
  TaggingEvalInput,
} from "./golden/tagging-clips";

/**
 * The `tagging_accuracy` metric (video-engine spec §6.4): per-field set-F1
 * over the four array fields, PLUS the exact-match hard gate on the thankyou
 * constraint — proposing "feed" on a thankyou clip is an automatic FAIL
 * regardless of F1. Pure module (no LLM, no server-only) so the math is
 * unit-testable without a key.
 */

/** Per-example pass bar; the run-level macro-F1 threshold is the same. */
export const TAGGING_ACCURACY_THRESHOLD = 0.8;

export const THANKYOU_GATE_DETAIL = "THANKYOU-GATE VIOLATION";

/** Set-F1 with the standard empty-vs-empty convention: both empty = 1
 * (predicting "nothing" when "nothing" is correct is a perfect answer —
 * this is what rewards honest degradation on the no-transcript clip). */
export function setF1(
  out: readonly string[],
  expected: readonly string[],
): number {
  if (out.length === 0 && expected.length === 0) return 1;
  const expectedSet = new Set(expected);
  const overlap = new Set(out.filter((v) => expectedSet.has(v))).size;
  return (2 * overlap) / (new Set(out).size + expectedSet.size);
}

/** The gate looks at the label, not the model: any clip whose ground truth
 * is a thankyou clip must never be proposed for the feed. */
export function violatesThankyouGate(
  out: TaggingEvalExpected,
  expected: TaggingEvalExpected,
): boolean {
  const isThankyouClip =
    expected.purpose.includes("thankyou") ||
    expected.page_eligibility.includes("thankyou");
  return isThankyouClip && out.page_eligibility.includes("feed");
}

export const taggingAccuracyMetric: Metric<
  TaggingEvalInput,
  TaggingEvalExpected
> = (out, expected) => {
  const fieldF1s = [
    setF1(out.purpose, expected.purpose),
    setF1(out.page_eligibility, expected.page_eligibility),
    setF1(out.mood, expected.mood),
    setF1(out.product_links, expected.product_links),
  ];
  const score =
    fieldF1s.reduce((sum, f1) => sum + f1, 0) / fieldF1s.length;

  if (violatesThankyouGate(out, expected)) {
    return {
      score,
      pass: false,
      detail: `${THANKYOU_GATE_DETAIL}: proposed "feed" for a thankyou clip (locked constraint)`,
    };
  }

  return {
    score,
    pass: score >= TAGGING_ACCURACY_THRESHOLD,
    ...(score < TAGGING_ACCURACY_THRESHOLD
      ? { detail: `mean set-F1 ${score.toFixed(3)} below threshold` }
      : {}),
  };
};
