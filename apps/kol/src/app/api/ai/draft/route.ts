/**
 * POST /api/ai/draft — brand profile → coherent custom design system →
 * store-config-shaped draft. Spec §5, D15, the load-bearing step.
 *
 * The five curated KOL palettes are passed to the model as calibration
 * exemplars, never as an allowed set: a maker gets HER colours and HER
 * fonts, and the accessibility guarantee comes from the deterministic gate
 * downstream, not from capping what she's allowed to want.
 *
 * The response is normalized into the real `StoreBlock[]` / `CustomTheme`
 * union from src/lib/store-config/types.ts, and carries gate ① already
 * computed — a draft never leaves this route without its contrast measured.
 */

import { NextResponse } from "next/server";
import { runAaGate } from "@/lib/ai/aa";
import { AiCallError, logSimulated, runStructuredCall } from "@/lib/ai/call";
import { MODELS, hasAI } from "@/lib/ai/client";
import { draftModelOutputSchema, draftRequestSchema } from "@/lib/ai/schemas";
import { simulatedDraft } from "@/lib/ai/simulated";
import { normalizeBlocks, toCustomTheme } from "@/lib/ai/store-config";
import { DRAFT_SYSTEM, DRAFT_TOOL } from "@/lib/ai/tools";

export const runtime = "nodejs";

/** Passed as calibration only — "here are five coherent systems; depart from them." */
const CURATED_EXEMPLARS = [
  "sunbaked — warm cream ground, clay accent, serif display",
  "market-plum — deep plum ground, blush accent, high-contrast display",
  "cuberto-noir — near-black ground, electric accent, geometric grotesk",
  "orchard — soft green ground, russet accent, humanist text",
  "bazaar — saturated ochre ground, indigo accent, character display",
].join("\n");

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = draftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { interviewAnswers, storeId } = parsed.data;

  if (Object.keys(interviewAnswers).length === 0) {
    return NextResponse.json(
      { error: "interviewAnswers is empty — there is nothing to derive a world from." },
      { status: 400 },
    );
  }

  const answersBlock = Object.entries(interviewAnswers)
    .map(([beat, answer]) => `## ${beat}\n${answer}`)
    .join("\n\n");

  if (!hasAI()) {
    const startedAt = Date.now();
    const output = simulatedDraft(interviewAnswers);
    logSimulated("design_derivation", Date.now() - startedAt, storeId);
    const aa = runAaGate(output.theme);
    return NextResponse.json({
      simulated: true,
      theme: output.theme,
      customTheme: toCustomTheme(output.theme),
      blocks: normalizeBlocks(output.blocks),
      rawBlocks: output.blocks,
      copy: output.copy,
      rationale: output.rationale,
      aa: { pass: aa.pass, findings: aa.findings },
      model: "none",
    });
  }

  try {
    const { data, model, fellBack } = await runStructuredCall({
      feature: "design_derivation",
      model: MODELS.opus,
      // 529 on the hardest step must not lose her draft — spec §10.2
      fallbackModel: MODELS.sonnet,
      system: DRAFT_SYSTEM,
      tool: DRAFT_TOOL,
      schema: draftModelOutputSchema,
      maxTokens: 8_000,
      ...(storeId !== undefined ? { storeId } : {}),
      userContent: [
        "Here are the maker's interview answers, beat by beat, in her own words.",
        "",
        answersBlock,
        "",
        "Five KOL curated systems, for CALIBRATION ONLY — they show what coherent looks like. You may depart from all of them, and usually should:",
        CURATED_EXEMPLARS,
        "",
        "Derive her world. Every colour in derivedFrom must trace to something she actually said.",
      ].join("\n"),
    });

    const aa = runAaGate(data.theme);

    return NextResponse.json({
      simulated: false,
      theme: data.theme,
      customTheme: toCustomTheme(data.theme),
      blocks: normalizeBlocks(data.blocks),
      rawBlocks: data.blocks,
      copy: data.copy,
      rationale: data.rationale,
      // gate ① is computed on the way out — a draft is never un-measured
      aa: { pass: aa.pass, findings: aa.findings },
      model,
      qualityFlag: fellBack ? "derived-on-fallback-model" : null,
    });
  } catch (err) {
    const message =
      err instanceof AiCallError ? err.message : "Design derivation could not be reached.";
    return NextResponse.json({ simulated: false, error: message }, { status: 502 });
  }
}
