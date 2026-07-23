# KOL agent evals — the shared harness

One harness for every LLM feature (video-engine spec §7, AGREED with
Workstream B 2026-07-19): tagging accuracy + the ranker offline eval ride the
same shapes as B's extraction / design-coherence / critic evals. Extend this
directory; never fork it.

## What lives here

| File | Role |
|------|------|
| `harness.ts` | `GoldenExample` / `Metric` / `runEval` — the shared core. `runEval` returns `{ passed, failed, meanScore, perExample[], eval_cost_usd, ok }`; `ok` is the CI gate (false if `meanScore < threshold` OR any `adversarial`-tagged example fails). |
| `golden/tagging-clips.ts` | 13 labelled golden clips for `tagging_accuracy` (one per purpose value, multi-purpose, the adversarial thankyou clip, ambiguous product ref, no-transcript degrade, foreign-language, thankyou-boundary, energetic mood). |
| `tagging-accuracy.metric.ts` | The pure `tagging_accuracy` metric: per-field set-F1 over `purpose`/`page_eligibility`/`mood`/`product_links` + the thankyou hard gate (proposing `feed` on a thankyou clip = automatic FAIL regardless of F1). |
| `tagging-accuracy.metric.test.ts` | Keyless unit tests for the metric math and harness gating. |
| `tagging-accuracy.eval.ts` | The LIVE eval — runs the real `suggestTags` pipeline on `claude-haiku-4-5`. Ship gates: macro-F1 ≥ 0.80 AND thankyou-gate 100%. |

## Running

```bash
pnpm test                                            # unit tests + evals (evals auto-skip without keys)
pnpm test -- src/lib/agents/evals/tagging-accuracy.eval.ts   # just the live eval
```

Live evals need `ANTHROPIC_API_KEY` in `apps/kol/.env.local`; without it they
skip — they are never mocked and never report estimated numbers.

## Conventions (binding for new evals)

- Each eval file exports `export const goldenExamples: GoldenExample[]` —
  minimum 10 per feature, covering happy-path, edge, adversarial, boundary.
  Tag hard-gate cases `"adversarial"`; `runEval` fails the run if one regresses.
- Every LLM call goes through `lib/agents/llm.ts`, which emits the §10.1
  cost-log line; feature runners return per-call `costUsd` so `runEval` can
  report a real `eval_cost_usd`.
- Metrics are pure modules (no LLM, no `server-only`) so their math is
  unit-testable keyless. `breakdown?` on `MetricResult` is Workstream B's
  additive extension — this workstream's metrics don't set it.
