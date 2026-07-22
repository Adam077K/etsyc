/**
 * Shared LLM cost log (ai-pipeline spec §10.1 — AGREED with Workstream B,
 * 2026-07-20). ONE JSON line to stdout per LLM call, no exceptions: eval-run
 * cost and production cost roll up through the same shape across both
 * workstreams. The required core is frozen; `cached_tokens` / `outcome` are
 * the agreed additive optionals this workstream emits.
 */

export type LlmOutcome = "ok" | "retry" | "fallback" | "error";

export type LlmCallLog = {
  event: "llm_call";
  feature: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  ts: string;
  /** Optional additive (§10.1): prompt-cache read hits, for cache-hit rate. */
  cached_tokens?: number;
  /** Optional additive (§10.1): ok | retry | fallback | error. */
  outcome?: LlmOutcome;
};

/**
 * Rate card in USD per million tokens (CLAUDE.md model tiers, May 2026).
 * Prompt-cache reads bill at 10% of input. Unknown models cost out at the
 * most expensive tier so a routing mistake shows up as an overstatement,
 * never an understatement.
 */
type ModelRate = { input: number; output: number; cachedInput: number };

const OPUS_RATE: ModelRate = { input: 5, output: 25, cachedInput: 0.5 };

const RATES_USD_PER_MTOK: Record<string, ModelRate> = {
  "claude-haiku-4-5": { input: 1, output: 5, cachedInput: 0.1 },
  "claude-sonnet-4-6": { input: 3, output: 15, cachedInput: 0.3 },
  "claude-opus-4-7": OPUS_RATE,
};

/** Model ids come back from the API with a date suffix — match the prefix. */
function rateFor(model: string): ModelRate {
  for (const [prefix, rate] of Object.entries(RATES_USD_PER_MTOK)) {
    if (model.startsWith(prefix)) return rate;
  }
  return OPUS_RATE;
}

export function costOf(
  model: string,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cached_tokens?: number;
  },
): number {
  const rate = rateFor(model);
  const cached = usage.cached_tokens ?? 0;
  // input_tokens from the API excludes cache reads; cached tokens are billed
  // separately at the cache-read rate.
  return (
    (usage.input_tokens * rate.input +
      usage.output_tokens * rate.output +
      cached * rate.cachedInput) /
    1_000_000
  );
}

/**
 * Emits the one-line JSON cost log and returns the entry so callers (the
 * eval harness) can sum `cost_usd` into `eval_cost_usd` without re-parsing
 * stdout.
 */
export function logLlmCall(
  entry: Omit<LlmCallLog, "event" | "ts">,
): LlmCallLog {
  const line: LlmCallLog = {
    event: "llm_call",
    ...entry,
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(line));
  return line;
}
