/**
 * One call path for every LLM feature: strict tool-use for structured
 * output, Zod re-validation of whatever came back, bounded retries, and a
 * cost-log line on every attempt — success or failure.
 *
 * Structured output is requested with `strict: true` + a forced
 * `tool_choice`, so the model must answer by filling the tool's schema
 * rather than by writing prose we then have to parse. On a validation
 * failure the validator's own error is fed back as a follow-up turn (max 2
 * structural retries, spec §10.2) before we give up honestly.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { getClient, type AiFeature, type ModelId } from "./client";
import { logCall, type CallOutcome } from "./cost-log";

export interface ToolSpec {
  name: string;
  description: string;
  /** Hand-written JSON Schema. Strict mode: additionalProperties:false + full `required`. */
  inputSchema: Record<string, unknown>;
}

export interface StructuredCallOptions<T> {
  feature: AiFeature;
  model: ModelId;
  /** Used on 529 overload — spec §10.2 falls Opus back to Sonnet. */
  fallbackModel?: ModelId;
  system: string;
  userContent: string;
  tool: ToolSpec;
  schema: z.ZodType<T>;
  maxTokens?: number;
  traceId?: string;
  storeId?: string;
  iteration?: number;
}

export interface StructuredCallResult<T> {
  data: T;
  model: ModelId;
  /** True when the answer came from the fallback model after an overload. */
  fellBack: boolean;
}

export class AiCallError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid_output" | "api_error",
  ) {
    super(message);
    this.name = "AiCallError";
  }
}

const MAX_RATE_LIMIT_RETRIES = 5;
const MAX_STRUCTURAL_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function backoffMs(attempt: number): number {
  return Math.min(250 * 2 ** attempt + Math.random() * 200, 8_000);
}

function firstToolInput(message: Anthropic.Message, toolName: string): unknown {
  for (const block of message.content) {
    if (block.type === "tool_use" && block.name === toolName) return block.input;
  }
  return undefined;
}

/**
 * Run one structured call. Throws `AiCallError` rather than returning junk —
 * callers decide whether to surface the failure or degrade.
 */
export async function runStructuredCall<T>(
  opts: StructuredCallOptions<T>,
): Promise<StructuredCallResult<T>> {
  const client = getClient();
  const tools = [
    {
      name: opts.tool.name,
      description: opts.tool.description,
      strict: true,
      input_schema: opts.tool.inputSchema,
    },
  ] as unknown as Anthropic.Tool[];

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.userContent }];

  let activeModel: ModelId = opts.model;
  let fellBack = false;
  let structuralRetries = 0;
  let rateLimitRetries = 0;
  let lastError = "unknown failure";

  // guard against a pathological loop even if both counters interleave
  for (let step = 0; step < 12; step += 1) {
    const startedAt = Date.now();
    let message: Anthropic.Message;

    try {
      message = await client.messages.create({
        model: activeModel,
        max_tokens: opts.maxTokens ?? 8_000,
        system: [
          {
            type: "text",
            text: opts.system,
            // the system block is the stable half of every call — cache it
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
        tools,
        tool_choice: { type: "tool", name: opts.tool.name },
      });
    } catch (err) {
      const latencyMs = Date.now() - startedAt;

      if (err instanceof Anthropic.RateLimitError && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
        logCall({
          feature: opts.feature,
          model: activeModel,
          latencyMs,
          ok: false,
          outcome: "retry",
          ...(opts.traceId !== undefined ? { traceId: opts.traceId } : {}),
          ...(opts.storeId !== undefined ? { storeId: opts.storeId } : {}),
          ...(opts.iteration !== undefined ? { iteration: opts.iteration } : {}),
        });
        await sleep(backoffMs(rateLimitRetries));
        rateLimitRetries += 1;
        continue;
      }

      const overloaded =
        err instanceof Anthropic.APIError && (err.status === 529 || err.status === 503);
      if (overloaded && opts.fallbackModel !== undefined && !fellBack) {
        logCall({
          feature: opts.feature,
          model: activeModel,
          latencyMs,
          ok: false,
          outcome: "fallback",
          ...(opts.traceId !== undefined ? { traceId: opts.traceId } : {}),
          ...(opts.storeId !== undefined ? { storeId: opts.storeId } : {}),
        });
        activeModel = opts.fallbackModel;
        fellBack = true;
        continue;
      }

      logCall({
        feature: opts.feature,
        model: activeModel,
        latencyMs,
        ok: false,
        outcome: "error",
        ...(opts.traceId !== undefined ? { traceId: opts.traceId } : {}),
        ...(opts.storeId !== undefined ? { storeId: opts.storeId } : {}),
      });
      throw new AiCallError(
        err instanceof Error ? err.message : "Anthropic request failed",
        "api_error",
      );
    }

    const latencyMs = Date.now() - startedAt;
    const raw = firstToolInput(message, opts.tool.name);
    const parsed = opts.schema.safeParse(raw);

    logCall({
      feature: opts.feature,
      model: activeModel,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cachedTokens: message.usage.cache_read_input_tokens ?? 0,
      latencyMs,
      ok: parsed.success,
      outcome: parsed.success ? (fellBack ? "fallback" : "ok") : "retry",
      ...(opts.traceId !== undefined ? { traceId: opts.traceId } : {}),
      ...(opts.storeId !== undefined ? { storeId: opts.storeId } : {}),
      ...(opts.iteration !== undefined ? { iteration: opts.iteration } : {}),
    });

    if (parsed.success) return { data: parsed.data, model: activeModel, fellBack };

    lastError = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");

    if (structuralRetries >= MAX_STRUCTURAL_RETRIES) break;
    structuralRetries += 1;

    // feed the validator's own complaint back — targeted, not "try again"
    messages.push(
      { role: "assistant", content: message.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id:
              message.content.find(
                (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
              )?.id ?? "unknown",
            is_error: true,
            content: `Schema validation failed: ${lastError}. Call ${opts.tool.name} again with a corrected payload.`,
          },
        ],
      },
    );
  }

  throw new AiCallError(`Model output failed validation: ${lastError}`, "invalid_output");
}

/** Log a simulated (no-key) response so degraded runs still show up in cost data. */
export function logSimulated(feature: AiFeature, latencyMs: number, storeId?: string): void {
  const outcome: CallOutcome = "simulated";
  logCall({
    feature,
    model: "none",
    latencyMs,
    ok: true,
    outcome,
    ...(storeId !== undefined ? { storeId } : {}),
  });
}
