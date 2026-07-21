/**
 * POST /api/ai/critic — the auto-critic, two gates in strict order.
 *
 *   ① WCAG-AA. Computed here, in code, from src/lib/theme/contrast.ts.
 *      The model is never asked, never shown the question, and cannot
 *      overturn the answer. It is arithmetic.
 *   ② Coherence. An LLM score against a weighted rubric, with a 0.75 floor.
 *      It ONLY runs if ① passed — a config that fails contrast never
 *      reaches a taste judgement and can never be published.
 *
 * That ordering is the whole design. Full brand freedom (D15) is only safe
 * because the accessibility floor is computed rather than judged, so the
 * subjective gate is spending its budget on whether the world is HERS —
 * never on whether it is readable.
 */

import { NextResponse } from "next/server";
import { describeAaFailures, runAaGate } from "@/lib/ai/aa";
import { AiCallError, logSimulated, runStructuredCall } from "@/lib/ai/call";
import { MODELS, hasAI } from "@/lib/ai/client";
import {
  coherenceModelOutputSchema,
  criticRequestSchema,
  type CriticResponse,
} from "@/lib/ai/schemas";
import { COHERENCE_THRESHOLD, weightedScore } from "@/lib/ai/rubric";
import { simulatedCoherence } from "@/lib/ai/simulated";
import { CRITIC_SYSTEM, CRITIC_TOOL } from "@/lib/ai/tools";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = criticRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { config, storeId } = parsed.data;

  /* ---------- GATE ① — deterministic, always runs first ---------- */
  const aa = runAaGate(config.theme);

  if (!aa.pass) {
    // ② never runs. No model score exists, so we report none — not a zero.
    const payload: CriticResponse = {
      simulated: false,
      aaPass: false,
      aaFindings: aa.findings,
      coherence: null,
      verdict: "fail-aa",
      threshold: COHERENCE_THRESHOLD,
    };
    return NextResponse.json({ ...payload, aaSummary: describeAaFailures(aa) });
  }

  /* ---------- GATE ② — only reachable once ① passed ---------- */
  if (!hasAI()) {
    const startedAt = Date.now();
    const coherence = simulatedCoherence(config.blocks.length, config.copy !== undefined);
    logSimulated("critic_coherence", Date.now() - startedAt, storeId);
    const score = weightedScore(coherence);
    const payload: CriticResponse = {
      simulated: true,
      aaPass: true,
      aaFindings: aa.findings,
      coherence: { ...coherence, score },
      verdict: score >= COHERENCE_THRESHOLD ? "pass" : "fail-coherence",
      threshold: COHERENCE_THRESHOLD,
    };
    return NextResponse.json(payload);
  }

  try {
    const { data } = await runStructuredCall({
      feature: "critic_coherence",
      model: MODELS.sonnet,
      system: CRITIC_SYSTEM,
      tool: CRITIC_TOOL,
      schema: coherenceModelOutputSchema,
      maxTokens: 2_000,
      ...(storeId !== undefined ? { storeId } : {}),
      userContent: [
        "This draft has already PASSED the deterministic WCAG-AA gate. Score coherence only.",
        "",
        "Derived design system:",
        JSON.stringify(config.theme, null, 2),
        "",
        "Blocks, in render order:",
        JSON.stringify(config.blocks, null, 2),
        "",
        config.copy !== undefined ? `Copy:\n${JSON.stringify(config.copy, null, 2)}` : "Copy: (none supplied)",
      ].join("\n"),
    });

    const score = weightedScore(data);
    const payload: CriticResponse = {
      simulated: false,
      aaPass: true,
      aaFindings: aa.findings,
      coherence: { ...data, score },
      verdict: score >= COHERENCE_THRESHOLD ? "pass" : "fail-coherence",
      threshold: COHERENCE_THRESHOLD,
    };
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof AiCallError ? err.message : "The critic could not be reached.";
    // gate ① still holds — report the real AA result and be honest about ②
    return NextResponse.json(
      {
        simulated: false,
        aaPass: true,
        aaFindings: aa.findings,
        coherence: null,
        verdict: "fail-coherence",
        threshold: COHERENCE_THRESHOLD,
        error: message,
      },
      { status: 502 },
    );
  }
}
