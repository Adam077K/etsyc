/**
 * Cost logging — the project rule is that AI ships with an eval AND a cost
 * log, or it doesn't ship. Every LLM call in this app goes through here.
 *
 * Emits one JSON line per call (the shared Workstream B/C schema, spec
 * §10.1) and keeps the last N entries in a process-local ring buffer so the
 * eval harness can sum a run's spend without scraping stdout.
 *
 * The log never contains the API key, the prompt, or the maker's transcript
 * — only ids, token counts, money and timing.
 */

import type { AiFeature, ModelId } from "./client.ts";

/** USD per 1M tokens, per the May-2026 rate card in CLAUDE.md / the spec. */
const RATES: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export type CallOutcome = "ok" | "retry" | "fallback" | "error" | "simulated";

export interface CostLogEntry {
  event: "llm_call";
  feature: AiFeature;
  model: ModelId | "none";
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCostUSD: number;
  latencyMs: number;
  ok: boolean;
  outcome: CallOutcome;
  ts: string;
  traceId?: string;
  storeId?: string;
  iteration?: number;
}

const RING_SIZE = 200;
const ring: CostLogEntry[] = [];

export function estimateCostUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = RATES[model];
  if (rate === undefined) return 0;
  const usd = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
  // sub-cent precision matters: a single shop is a few cents end to end
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export interface LogCallInput {
  feature: AiFeature;
  model: ModelId | "none";
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  latencyMs: number;
  ok: boolean;
  outcome: CallOutcome;
  traceId?: string;
  storeId?: string;
  iteration?: number;
}

export function logCall(input: LogCallInput): CostLogEntry {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const entry: CostLogEntry = {
    event: "llm_call",
    feature: input.feature,
    model: input.model,
    inputTokens,
    outputTokens,
    cachedTokens: input.cachedTokens ?? 0,
    estimatedCostUSD: estimateCostUSD(input.model, inputTokens, outputTokens),
    latencyMs: Math.round(input.latencyMs),
    ok: input.ok,
    outcome: input.outcome,
    ts: new Date().toISOString(),
    ...(input.traceId !== undefined ? { traceId: input.traceId } : {}),
    ...(input.storeId !== undefined ? { storeId: input.storeId } : {}),
    ...(input.iteration !== undefined ? { iteration: input.iteration } : {}),
  };

  ring.push(entry);
  if (ring.length > RING_SIZE) ring.splice(0, ring.length - RING_SIZE);

  // one JSON line per call — greppable in Vercel logs, parseable by the harness
  console.log(JSON.stringify(entry));
  return entry;
}

/** Newest-last snapshot of the ring buffer. */
export function recentCalls(limit = RING_SIZE): CostLogEntry[] {
  return ring.slice(Math.max(0, ring.length - limit));
}

export function totalCostUSD(entries: CostLogEntry[] = ring): number {
  const sum = entries.reduce((acc, e) => acc + e.estimatedCostUSD, 0);
  return Math.round(sum * 1_000_000) / 1_000_000;
}

export function clearCostLog(): void {
  ring.length = 0;
}
