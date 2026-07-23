/**
 * The SHARED eval harness (video-engine spec §7 — AGREED with Workstream B,
 * 2026-07-19). One harness for both workstreams: this spec's
 * `tagging_accuracy` / `ranking_ndcg@k` and B's extraction / design-coherence
 * / critic evals all ride these exact shapes. Extend it, don't fork it —
 * B builds on this same file later. The `breakdown?` field on MetricResult
 * is B's agreed additive extension; metrics on this workstream do not set it.
 */

/**
 * Dataset format (§7): each eval file exports
 * `export const goldenExamples: GoldenExample[]` — min 10 per feature,
 * covering happy-path, edge, adversarial, boundary. B encodes its slop/good
 * labels in `tags?`; this workstream uses `tags` for `adversarial` (hard
 * CI gate) and descriptive grouping.
 */
export type GoldenExample<I, O> = {
  id: string;
  input: I;
  expected: O;
  description: string;
  tags?: string[];
};

export type MetricResult = {
  /** 0–1 (required). */
  score: number;
  pass: boolean;
  detail?: string;
  /** OPTIONAL (B's extension) — multi-component metrics only. */
  breakdown?: Record<string, number>;
};

export type Metric<I, O> = (out: O, expected: O, input: I) => MetricResult;

/**
 * What runEval needs from the feature under test: a name (for the report)
 * and a runner that produces the feature's output for one input, plus the
 * summed `cost_usd` of the LLM calls it made (from the §10.1 cost log) so
 * the run reports a real `eval_cost_usd`, not an estimate.
 */
export type EvalFeature<I, O> = {
  name: string;
  run: (input: I) => Promise<{ output: O; costUsd: number }>;
};

export type PerExampleResult = {
  id: string;
  description: string;
  tags: string[];
  score: number;
  pass: boolean;
  detail?: string;
  breakdown?: Record<string, number>;
};

export type EvalRun = {
  feature: string;
  threshold: number;
  passed: number;
  failed: number;
  meanScore: number;
  perExample: PerExampleResult[];
  eval_cost_usd: number;
  /**
   * The CI gate (§7): false if meanScore < threshold OR any example tagged
   * `adversarial` regresses (fails). Assert on this in the eval's test.
   */
  ok: boolean;
};

export const ADVERSARIAL_TAG = "adversarial";

export async function runEval<I, O>(
  feature: EvalFeature<I, O>,
  examples: readonly GoldenExample<I, O>[],
  metric: Metric<I, O>,
  threshold: number,
): Promise<EvalRun> {
  const perExample: PerExampleResult[] = [];
  let evalCostUsd = 0;

  // Sequential on purpose: a golden set is small, and serial calls keep the
  // rate-limit path (§10.2) out of the eval's own way.
  for (const example of examples) {
    const { output, costUsd } = await feature.run(example.input);
    evalCostUsd += costUsd;
    const result = metric(output, example.expected, example.input);
    perExample.push({
      id: example.id,
      description: example.description,
      tags: example.tags ?? [],
      score: result.score,
      pass: result.pass,
      ...(result.detail !== undefined ? { detail: result.detail } : {}),
      ...(result.breakdown !== undefined
        ? { breakdown: result.breakdown }
        : {}),
    });
  }

  const passed = perExample.filter((r) => r.pass).length;
  const failed = perExample.length - passed;
  const meanScore =
    perExample.length === 0
      ? 0
      : perExample.reduce((sum, r) => sum + r.score, 0) / perExample.length;
  const adversarialRegressed = perExample.some(
    (r) => r.tags.includes(ADVERSARIAL_TAG) && !r.pass,
  );

  return {
    feature: feature.name,
    threshold,
    passed,
    failed,
    meanScore,
    perExample,
    eval_cost_usd: evalCostUsd,
    ok: meanScore >= threshold && !adversarialRegressed,
  };
}
