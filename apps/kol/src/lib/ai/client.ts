/**
 * Server-only Anthropic client for the seller pipeline.
 *
 * The key lives in `process.env.ANTHROPIC_API_KEY` and never leaves the
 * server: this module throws if it is ever evaluated in a browser bundle,
 * and nothing here is re-exported through a "use client" boundary.
 *
 * `hasAI()` is the honesty switch. With no key the routes still answer 200,
 * but they answer with a clearly-labelled deterministic mock (`simulated:
 * true`) — the UI says so out loud. We never imply a model ran when it
 * didn't.
 */

import Anthropic from "@anthropic-ai/sdk";

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/ai/client.ts is server-only — it must never reach the client bundle.",
  );
}

/** Models, per docs/03-system-design/KOL-ai-pipeline-spec.md §2. */
export const MODELS = {
  /** Interview follow-ups, extraction, copy, critic coherence. */
  sonnet: "claude-sonnet-4-6",
  /** Design derivation (D15) — the single hardest reasoning step. */
  opus: "claude-opus-4-7",
  /** Cheap classification (beat-satisfied). */
  haiku: "claude-haiku-4-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/** Feature ids used by the cost log and the eval harness (§10.1). */
export type AiFeature =
  | "interview_followup"
  | "beat_classifier"
  | "extraction"
  | "design_derivation"
  | "copy_gen"
  | "critic_coherence";

let cached: Anthropic | null = null;

/** True when a real key is configured. Never returns the key itself. */
export function hasAI(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

/**
 * The guarded client. Callers must check `hasAI()` first — this throws
 * rather than constructing a client that would 401 on every request.
 */
export function getClient(): Anthropic {
  if (!hasAI()) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set — call hasAI() and degrade to the simulated path.",
    );
  }
  if (cached === null) {
    cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cached;
}

/** Reset between eval runs / tests. */
export function resetClient(): void {
  cached = null;
}
