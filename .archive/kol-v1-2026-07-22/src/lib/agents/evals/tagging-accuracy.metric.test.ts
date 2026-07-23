import { describe, expect, it } from "vitest";

import type { TaggingEvalExpected } from "./golden/tagging-clips";
import { runEval, type EvalFeature, type GoldenExample } from "./harness";
import {
  TAGGING_ACCURACY_THRESHOLD,
  THANKYOU_GATE_DETAIL,
  setF1,
  taggingAccuracyMetric,
  violatesThankyouGate,
} from "./tagging-accuracy.metric";

/**
 * Pure-math tests for the tagging_accuracy metric and the shared harness —
 * these run keyless in CI; the live LLM run lives in tagging-accuracy.eval.ts.
 */

const empty: TaggingEvalExpected = {
  purpose: [],
  page_eligibility: [],
  product_links: [],
  mood: [],
};

describe("setF1", () => {
  it("both empty → 1 (honest degradation is a perfect answer)", () => {
    expect(setF1([], [])).toBe(1);
  });

  it("identical sets → 1, disjoint sets → 0", () => {
    expect(setF1(["a", "b"], ["b", "a"])).toBe(1);
    expect(setF1(["a"], ["b"])).toBe(0);
  });

  it("partial overlap → 2·|∩| / (|out|+|expected|)", () => {
    expect(setF1(["a", "b", "c"], ["a", "b"])).toBeCloseTo(0.8);
    expect(setF1(["a"], ["a", "b"])).toBeCloseTo(2 / 3);
  });

  it("one side empty → 0", () => {
    expect(setF1([], ["a"])).toBe(0);
    expect(setF1(["a"], [])).toBe(0);
  });
});

describe("thankyou gate", () => {
  const thankyouExpected: TaggingEvalExpected = {
    ...empty,
    purpose: ["thankyou"],
    page_eligibility: ["thankyou"],
  };

  it("flags feed proposed on a thankyou clip", () => {
    expect(
      violatesThankyouGate(
        { ...empty, page_eligibility: ["feed"] },
        thankyouExpected,
      ),
    ).toBe(true);
  });

  it("does not flag a correct thankyou-only proposal", () => {
    expect(violatesThankyouGate(thankyouExpected, thankyouExpected)).toBe(
      false,
    );
  });

  it("does not flag feed on a non-thankyou clip", () => {
    expect(
      violatesThankyouGate(
        { ...empty, page_eligibility: ["feed"] },
        { ...empty, purpose: ["process"], page_eligibility: ["feed"] },
      ),
    ).toBe(false);
  });

  it("is an automatic metric FAIL even when the F1 score is high", () => {
    const out: TaggingEvalExpected = {
      purpose: ["thankyou"],
      page_eligibility: ["thankyou", "feed"], // near-perfect F1, gated anyway
      product_links: [],
      mood: [],
    };
    const result = taggingAccuracyMetric(out, thankyouExpected, {
      captionsSrc: "",
      durationMs: null,
      store: null,
      products: [],
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain(THANKYOU_GATE_DETAIL);
    expect(result.score).toBeGreaterThan(TAGGING_ACCURACY_THRESHOLD);
  });
});

describe("runEval (shared harness)", () => {
  type I = string;
  type O = { value: string };

  const examples: GoldenExample<I, O>[] = [
    { id: "ok-1", input: "a", expected: { value: "a" }, description: "hit" },
    {
      id: "adv-1",
      input: "b",
      expected: { value: "b" },
      description: "adversarial hit",
      tags: ["adversarial"],
    },
  ];

  const echo: EvalFeature<I, O> = {
    name: "echo",
    run: (input) => Promise.resolve({ output: { value: input }, costUsd: 0.001 }),
  };

  const broken: EvalFeature<I, O> = {
    name: "broken",
    run: () => Promise.resolve({ output: { value: "x" }, costUsd: 0.001 }),
  };

  const exact = (out: O, expected: O) =>
    out.value === expected.value
      ? { score: 1, pass: true }
      : { score: 0, pass: false };

  it("sums cost, means scores, and passes a clean run", async () => {
    const run = await runEval(echo, examples, exact, 0.8);
    expect(run.ok).toBe(true);
    expect(run.passed).toBe(2);
    expect(run.failed).toBe(0);
    expect(run.meanScore).toBe(1);
    expect(run.eval_cost_usd).toBeCloseTo(0.002);
  });

  it("CI-fails when an adversarial example regresses, regardless of counts", async () => {
    const run = await runEval(broken, examples, exact, 0);
    // threshold 0 means meanScore alone would pass — the adversarial
    // regression must still sink the run.
    expect(run.ok).toBe(false);
  });
});
