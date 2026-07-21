import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { suggestTags, TAGGING_FEATURE } from "@/lib/tagging/suggest";

import {
  goldenExamples,
  type TaggingEvalExpected,
  type TaggingEvalInput,
} from "./golden/tagging-clips";
import { runEval, type EvalFeature } from "./harness";
import {
  TAGGING_ACCURACY_THRESHOLD,
  THANKYOU_GATE_DETAIL,
  taggingAccuracyMetric,
} from "./tagging-accuracy.metric";

/**
 * LIVE `tagging_accuracy` eval (video-engine spec §6.4) — runs the REAL
 * suggestTags pipeline (prompt, structural retries, Zod validation, cost
 * log) against the 13 golden clips on claude-haiku-4-5.
 *
 * Ship gates: macro-F1 ≥ 0.80 AND thankyou-gate 100%. Below threshold the
 * AI-assist stays off (manual tagging only) and the model escalates to
 * Sonnet for a re-eval — that is a CTO decision, not an auto-switch.
 *
 * Auto-skips when ANTHROPIC_API_KEY is absent (CI has no key). Never mock
 * this: a skipped eval is honest, a mocked one is not.
 */

export { goldenExamples };

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
} catch {
  // no .env.local — the suite below skips
}

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

const taggingFeature: EvalFeature<TaggingEvalInput, TaggingEvalExpected> = {
  name: TAGGING_FEATURE,
  run: async (input) => {
    const outcome = await suggestTags(input);
    if (outcome.status === "ok") {
      const { purpose, page_eligibility, product_links, mood } =
        outcome.suggestion;
      return {
        output: { purpose, page_eligibility, product_links, mood },
        costUsd: outcome.costUsd,
      };
    }
    // Degraded/unavailable = the seller gets no suggestion — scored as
    // empty tags. Correct for the no-transcript clip, a real miss elsewhere.
    return {
      output: { purpose: [], page_eligibility: [], product_links: [], mood: [] },
      costUsd: outcome.costUsd,
    };
  },
};

describe.skipIf(!hasKey)("tagging_accuracy eval (live claude-haiku-4-5)", () => {
  vi.setConfig({ testTimeout: 600_000 });

  it("macro-F1 ≥ 0.80 and thankyou-gate 100% over the golden clips", async () => {
    const run = await runEval(
      taggingFeature,
      goldenExamples,
      taggingAccuracyMetric,
      TAGGING_ACCURACY_THRESHOLD,
    );

    const gateViolations = run.perExample.filter((r) =>
      r.detail?.startsWith(THANKYOU_GATE_DETAIL),
    );

    // The run report — one JSON line, same spirit as the §10.1 cost log.
    console.log(
      JSON.stringify({
        event: "eval_run",
        metric: "tagging_accuracy",
        feature: run.feature,
        model: "claude-haiku-4-5",
        macro_f1: Number(run.meanScore.toFixed(4)),
        thankyou_gate: gateViolations.length === 0 ? "pass" : "fail",
        threshold: run.threshold,
        passed: run.passed,
        failed: run.failed,
        eval_cost_usd: Number(run.eval_cost_usd.toFixed(6)),
        per_example: run.perExample,
      }),
    );

    expect(gateViolations).toEqual([]);
    expect(run.meanScore).toBeGreaterThanOrEqual(TAGGING_ACCURACY_THRESHOLD);
    expect(run.ok).toBe(true);
  });
});
