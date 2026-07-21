/**
 * The shared eval harness (spec §8d — the shape agreed with Workstream C).
 *
 * One runner, one dataset shape, one metric interface, so pipeline evals and
 * video-engine evals report the same way and their costs roll up together.
 * Project rule: an AI feature ships with an eval and a cost log, or it
 * doesn't ship.
 */

export interface GoldenExample<I = unknown, O = unknown> {
  id: string;
  input: I;
  expected: O;
  description: string;
  /** e.g. ["adversarial"], ["slop"], ["good","unconventional"] */
  tags?: string[];
}

export interface MetricResult {
  /** 0..1 primary score. */
  score: number;
  pass: boolean;
  detail?: string;
  /** sub-metrics: precision, recall, f1, hallucinationRate… */
  breakdown?: Record<string, number>;
}

export type Metric<I, O> = (out: O, expected: O, input: I) => MetricResult;

export interface PerExampleResult extends MetricResult {
  id: string;
  description: string;
  tags: string[];
  error?: string;
}

export interface EvalRunResult {
  feature: string;
  passed: number;
  failed: number;
  meanScore: number;
  threshold: number;
  /** False if meanScore is under threshold OR any adversarial example failed. */
  ok: boolean;
  perExample: PerExampleResult[];
}

export interface RunEvalOptions<I, O> {
  feature: string;
  examples: GoldenExample<I, O>[];
  /** Produces the output under test for one example. */
  run: (input: I) => Promise<O> | O;
  metric: Metric<I, O>;
  threshold: number;
}

export async function runEval<I, O>(opts: RunEvalOptions<I, O>): Promise<EvalRunResult> {
  const perExample: PerExampleResult[] = [];

  for (const example of opts.examples) {
    const tags = example.tags ?? [];
    try {
      const out = await opts.run(example.input);
      const result = opts.metric(out, example.expected, example.input);
      perExample.push({ ...result, id: example.id, description: example.description, tags });
    } catch (err) {
      // a thrown example is a failed example, never a skipped one
      perExample.push({
        score: 0,
        pass: false,
        id: example.id,
        description: example.description,
        tags,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const passed = perExample.filter((r) => r.pass).length;
  const failed = perExample.length - passed;
  const meanScore =
    perExample.length === 0
      ? 0
      : perExample.reduce((acc, r) => acc + r.score, 0) / perExample.length;
  const adversarialRegression = perExample.some((r) => r.tags.includes("adversarial") && !r.pass);

  return {
    feature: opts.feature,
    passed,
    failed,
    meanScore: Math.round(meanScore * 1000) / 1000,
    threshold: opts.threshold,
    ok: meanScore >= opts.threshold && !adversarialRegression,
    perExample,
  };
}

export function formatRun(result: EvalRunResult): string {
  const head = `${result.ok ? "PASS" : "FAIL"}  ${result.feature}  mean=${result.meanScore.toFixed(3)} (threshold ${result.threshold})  ${result.passed}/${result.perExample.length} examples`;
  const lines = result.perExample
    .filter((r) => !r.pass)
    .map(
      (r) =>
        `    ✕ ${r.id} — ${r.description}${r.detail !== undefined ? ` [${r.detail}]` : ""}${r.error !== undefined ? ` (threw: ${r.error})` : ""}`,
    );
  return [head, ...lines].join("\n");
}
