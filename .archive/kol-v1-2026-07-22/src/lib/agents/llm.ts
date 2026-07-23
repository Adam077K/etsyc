import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { costOf, logLlmCall, type LlmCallLog } from "./cost-log";

/**
 * The shared thin Anthropic client wrapper — every LLM call in apps/kol goes
 * through `runLlmCall` so error handling (ai-pipeline §10.2) and cost logging
 * (§10.1) are structurally impossible to skip. Extend this file for new
 * features; never instantiate a parallel client.
 *
 * ANTHROPIC_API_KEY is read from server env only (`server-only` guards the
 * import graph); it never reaches a client bundle and is never hardcoded.
 */

/** 529 overload / 429 retries exhausted — the caller degrades gracefully
 * (for tagging: the seller tags manually; a failed suggestion never blocks
 * them and never writes data). */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmUnavailableError";
  }
}

/** Any other 4xx/5xx — typed and surfaced, NO silent failure (§10.2). */
export class LlmCallError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlmCallError";
    this.status = status;
  }
}

/** Lets callers branch to their no-AI path before attempting a call. */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MAX_RETRIES_429 = 3;

function backoffMs(attempt: number): number {
  // 250ms · 2^n with full jitter (§10.2).
  return Math.round(250 * 2 ** attempt * (0.5 + Math.random()));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusOf(error: unknown): number | undefined {
  return typeof error === "object" && error !== null && "status" in error
    ? (error as { status?: number }).status
    : undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type LlmCallResult = {
  text: string;
  model: string;
  usage: { input_tokens: number; output_tokens: number; cached_tokens: number };
  /** The emitted cost-log entry — evals sum `cost_usd` off it. */
  log: LlmCallLog;
};

export async function runLlmCall(options: {
  feature: string;
  model: string;
  system: Anthropic.MessageCreateParams["system"];
  messages: Anthropic.MessageParam[];
  maxTokens: number;
  temperature?: number;
}): Promise<LlmCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LlmUnavailableError(
      "ANTHROPIC_API_KEY is not configured in this environment.",
    );
  }
  // maxRetries: 0 — retry policy is ours (§10.2), not the SDK default's.
  const anthropic = new Anthropic({ apiKey, maxRetries: 0 });

  for (let attempt = 0; ; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await anthropic.messages.create({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature ?? 0,
        system: options.system,
        messages: options.messages,
      });

      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cached_tokens: response.usage.cache_read_input_tokens ?? 0,
      };
      const log = logLlmCall({
        feature: options.feature,
        model: response.model,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cached_tokens: usage.cached_tokens,
        cost_usd: costOf(response.model, usage),
        latency_ms: Date.now() - startedAt,
        outcome: "ok",
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      return { text, model: response.model, usage, log };
    } catch (error: unknown) {
      const status = statusOf(error);
      const latency = Date.now() - startedAt;
      const base = {
        feature: options.feature,
        model: options.model,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        latency_ms: latency,
      };

      if (status === 429 && attempt < MAX_RETRIES_429) {
        // Rate limit → exponential backoff and retry (§10.2).
        logLlmCall({ ...base, outcome: "retry" });
        await sleep(backoffMs(attempt));
        continue;
      }
      if (status === 529 || status === 429) {
        // Overloaded (or rate-limit retries exhausted) → graceful fallback;
        // the caller degrades to its manual path.
        logLlmCall({ ...base, outcome: "fallback" });
        throw new LlmUnavailableError(
          status === 529
            ? "The model is overloaded right now."
            : "Rate limited and out of retries.",
        );
      }
      // Anything else: typed error, logged, surfaced — never silent.
      logLlmCall({ ...base, outcome: "error" });
      throw new LlmCallError(
        `LLM call failed (${options.feature}): ${messageOf(error)}`,
        status,
      );
    }
  }
}
