/**
 * `pnpm eval` — the eval harness entry point.
 *
 * Three suites:
 *   aa_gate_accuracy      deterministic. Always runs. No key needed.
 *   extraction_grounding  needs a key. Scores recall AND hallucination rate.
 *   design_coherence      needs a key. Scores AA-by-construction, structural
 *                         validity, and no-flattening across three makers.
 *
 * With no ANTHROPIC_API_KEY the two model suites SKIP with a clear message
 * and the run still exits 0 — a missing key is a missing key, not a
 * regression. The AA suite has no excuse: it is arithmetic, it always runs,
 * and if it fails the publish gate is not trustworthy and the run fails.
 */

import process from "node:process";
import { runAaGate } from "../aa.ts";
import { runStructuredCall } from "../call.ts";
import { MODELS, hasAI } from "../client.ts";
import { recentCalls, totalCostUSD } from "../cost-log.ts";
import {
  draftModelOutputSchema,
  interviewModelOutputSchema,
  type DraftModelOutput,
  type InterviewModelOutput,
} from "../schemas.ts";
import { normalizeBlocks } from "../store-config.ts";
import {
  DRAFT_SYSTEM,
  DRAFT_TOOL,
  INTERVIEW_SYSTEM,
  INTERVIEW_TOOL,
} from "../tools.ts";
import { aaGoldenExamples, type AaExpectation } from "./fixtures/aa-gate.ts";
import {
  derivationGoldenExamples,
  type DerivationExpectation,
  type DerivationInput,
} from "./fixtures/derivation.ts";
import {
  extractionGoldenExamples,
  type ExtractionExpectation,
  type ExtractionInput,
} from "./fixtures/extraction.ts";
import { formatRun, runEval, type EvalRunResult } from "./harness.ts";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ */
/* suite 1 — gate ①. Deterministic, always runs.                       */
/* ------------------------------------------------------------------ */

async function runAaSuite(): Promise<EvalRunResult> {
  return runEval<(typeof aaGoldenExamples)[number]["input"], AaExpectation>({
    feature: "aa_gate_accuracy",
    examples: aaGoldenExamples,
    threshold: 1, // arithmetic has no tolerance band
    run: (theme) => {
      const result = runAaGate(theme);
      return {
        pass: result.pass,
        failingPairs: result.findings.filter((f) => !f.pass).map((f) => f.pair),
      };
    },
    metric: (out, expected) => {
      const verdictRight = out.pass === expected.pass;
      const got = new Set(out.failingPairs);
      const want = new Set(expected.failingPairs);
      const missing = [...want].filter((p) => !got.has(p));
      const extra = [...got].filter((p) => !want.has(p));
      const pairsRight = missing.length === 0 && extra.length === 0;
      return {
        score: verdictRight && pairsRight ? 1 : 0,
        pass: verdictRight && pairsRight,
        detail: pairsRight
          ? `verdict ${out.pass ? "PASS" : "FAIL"}`
          : `missing=[${missing.join(", ")}] unexpected=[${extra.join(", ")}]`,
        breakdown: { verdict: verdictRight ? 1 : 0, pairs: pairsRight ? 1 : 0 },
      };
    },
  });
}

/* ------------------------------------------------------------------ */
/* suite 2 — grounded extraction + follow-up quality.                  */
/* ------------------------------------------------------------------ */

async function runExtractionSuite(): Promise<EvalRunResult> {
  return runEval<ExtractionInput, ExtractionExpectation>({
    feature: "extraction_grounding",
    examples: extractionGoldenExamples,
    threshold: 0.8,
    run: async (input) => {
      const budget = Math.max(0, 3 - input.followUpsAsked);
      const { data } = await runStructuredCall<InterviewModelOutput>({
        feature: "interview_followup",
        model: MODELS.sonnet,
        system: INTERVIEW_SYSTEM,
        tool: INTERVIEW_TOOL,
        schema: interviewModelOutputSchema,
        maxTokens: 2_000,
        userContent: [
          `Current beat: ${input.beat}`,
          `Follow-ups already asked on this beat: ${input.followUpsAsked} (at most ${budget} more).`,
          "",
          "Earlier beats, context only:",
          input.priorAnswers.length > 0 ? input.priorAnswers.map((a) => `- ${a}`).join("\n") : "- (nothing yet)",
          "",
          "Her transcript for THIS beat, verbatim:",
          input.transcriptSoFar.length > 0 ? input.transcriptSoFar : "(she has not said anything yet)",
        ].join("\n"),
      });
      // the route enforces the budget in code; the eval scores what the model did
      return {
        shouldFind: data.extracted.map((f) => norm(f.value)),
        mustNotFind: data.extracted
          .filter((f) => !norm(input.transcriptSoFar).includes(norm(f.quote)))
          .map((f) => norm(f.value)),
        expectFollowUps: data.followUps.length > 0,
      } satisfies ExtractionExpectation;
    },
    metric: (out, expected, input) => {
      const found = out.shouldFind;
      const hay = norm(input.transcriptSoFar);

      const recallHits = expected.shouldFind.filter((want) =>
        found.some((f) => f.includes(want) || want.includes(f)),
      ).length;
      const recall = expected.shouldFind.length === 0 ? 1 : recallHits / expected.shouldFind.length;

      const forbidden = found.filter((f) =>
        expected.mustNotFind.some((bad) => f.includes(bad)),
      ).length;
      // ungrounded = the model's own quote isn't in her transcript
      const ungrounded = out.mustNotFind.length;
      const hallucinations = forbidden + ungrounded;
      const hallucinationRate = found.length === 0 ? 0 : hallucinations / found.length;

      const followUpsRight = out.expectFollowUps === expected.expectFollowUps;
      const groundedAll = found.every((f) => hay.includes(f) || f.length === 0);

      // hallucination is disqualifying — recall can never buy it back
      const score = hallucinations > 0 ? 0 : recall * 0.7 + (followUpsRight ? 0.3 : 0);

      return {
        score,
        pass: hallucinations === 0 && recall >= 0.5 && followUpsRight,
        detail: `recall=${recall.toFixed(2)} hallucinations=${hallucinations} followUps=${followUpsRight ? "ok" : "wrong"}`,
        breakdown: {
          recall,
          hallucinationRate,
          groundedAll: groundedAll ? 1 : 0,
          followUpsRight: followUpsRight ? 1 : 0,
        },
      };
    },
  });
}

/* ------------------------------------------------------------------ */
/* suite 3 — design derivation.                                        */
/* ------------------------------------------------------------------ */

const derivedThemes: { id: string; palette: string[] }[] = [];

async function runDerivationSuite(): Promise<EvalRunResult> {
  derivedThemes.length = 0;

  return runEval<DerivationInput, DerivationExpectation>({
    feature: "design_coherence",
    examples: derivationGoldenExamples,
    threshold: 0.75,
    run: async (input) => {
      const { data } = await runStructuredCall<DraftModelOutput>({
        feature: "design_derivation",
        model: MODELS.opus,
        fallbackModel: MODELS.sonnet,
        system: DRAFT_SYSTEM,
        tool: DRAFT_TOOL,
        schema: draftModelOutputSchema,
        maxTokens: 8_000,
        storeId: input.makerId,
        userContent: [
          "Here are the maker's interview answers, beat by beat, in her own words.",
          "",
          Object.entries(input.interviewAnswers)
            .map(([beat, answer]) => `## ${beat}\n${answer}`)
            .join("\n\n"),
          "",
          "Derive her world. Every colour in derivedFrom must trace to something she actually said.",
        ].join("\n"),
      });

      derivedThemes.push({
        id: input.makerId,
        palette: Object.values(data.theme.roles).map((h) => h.toLowerCase()),
      });

      const aa = runAaGate(data.theme);
      const blocks = normalizeBlocks(data.blocks);
      const heroes = blocks.filter((b) => b.type === "hero-video").length;

      return {
        mode: data.theme.mode,
        mustTrace: [
          ...data.theme.derivedFrom.map(norm),
          aa.pass ? "__aa_pass" : "__aa_fail",
          heroes === 1 && blocks.length >= 3 ? "__structure_ok" : "__structure_bad",
        ],
      } satisfies DerivationExpectation;
    },
    metric: (out, expected) => {
      const aaPass = out.mustTrace.includes("__aa_pass");
      const structureOk = out.mustTrace.includes("__structure_ok");
      const traced = expected.mustTrace.filter((sig) =>
        out.mustTrace.some((line) => line.includes(sig)),
      ).length;
      const traceScore = expected.mustTrace.length === 0 ? 1 : traced / expected.mustTrace.length;

      const score = (aaPass ? 0.5 : 0) + (structureOk ? 0.25 : 0) + traceScore * 0.25;
      return {
        // AA-by-construction is the point: a beautiful illegible palette fails
        score,
        pass: aaPass && structureOk && traceScore >= 0.5,
        detail: `aa=${aaPass ? "pass" : "FAIL"} structure=${structureOk ? "ok" : "BAD"} trace=${traceScore.toFixed(2)} mode=${out.mode}${out.mode === expected.mode ? "" : ` (expected ${expected.mode})`}`,
        breakdown: {
          aaByConstruction: aaPass ? 1 : 0,
          structure: structureOk ? 1 : 0,
          traceToTranscript: traceScore,
          modeMatch: out.mode === expected.mode ? 1 : 0,
        },
      };
    },
  });
}

/** No-flattening (D15): three different makers must not share a palette. */
function distinctnessReport(): string {
  if (derivedThemes.length < 2) return "";
  const pairs: string[] = [];
  for (let i = 0; i < derivedThemes.length; i += 1) {
    for (let j = i + 1; j < derivedThemes.length; j += 1) {
      const a = derivedThemes[i]!;
      const b = derivedThemes[j]!;
      const shared = a.palette.filter((h) => b.palette.includes(h)).length;
      const overlap = shared / a.palette.length;
      pairs.push(
        `    ${a.id} vs ${b.id}: ${(overlap * 100).toFixed(0)}% shared hexes ${overlap > 0.3 ? "← FLATTENING" : "✓"}`,
      );
    }
  }
  return ["  no-flattening (D15):", ...pairs].join("\n");
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const results: EvalRunResult[] = [];

  console.log("\nKOL AI evals\n============\n");

  const aa = await runAaSuite();
  results.push(aa);
  console.log(formatRun(aa));

  if (!hasAI()) {
    console.log(
      [
        "",
        "SKIP  extraction_grounding — no ANTHROPIC_API_KEY set.",
        "SKIP  design_coherence     — no ANTHROPIC_API_KEY set.",
        "",
        "      These two suites call a real model, so they cannot run without a key.",
        "      That is a skip, not a failure: set ANTHROPIC_API_KEY and re-run to",
        "      exercise them. The deterministic AA suite above ran in full.",
      ].join("\n"),
    );
  } else {
    for (const suite of [runExtractionSuite, runDerivationSuite]) {
      const result = await suite();
      results.push(result);
      console.log("");
      console.log(formatRun(result));
      if (result.feature === "design_coherence") {
        const report = distinctnessReport();
        if (report.length > 0) console.log(report);
      }
    }
  }

  const calls = recentCalls();
  console.log(
    `\ncost: ${calls.length} model call(s), $${totalCostUSD(calls).toFixed(4)} estimated\n`,
  );

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`FAILED: ${failed.map((f) => f.feature).join(", ")}\n`);
    process.exitCode = 1;
  } else {
    console.log("All executed suites passed.\n");
  }
}

void main();
