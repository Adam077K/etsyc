/**
 * POST /api/ai/interview — adaptive follow-ups for the current beat.
 *
 * Two guarantees this route makes, and enforces in code rather than asking
 * the model nicely:
 *
 *  1. The max-3-per-beat budget (spec §3.2) is arithmetic here, not a rule
 *     in a prompt. A maker can never be stuck in a probing loop.
 *  2. Hallucination guard: an extracted fact survives only if the verbatim
 *     quote it cites is actually present in her transcript. Anything else is
 *     dropped and reported in `droppedFacts` — we return null-ish rather
 *     than invent. D10: the interviewer asks and reflects; it never writes
 *     her story.
 */

import { NextResponse } from "next/server";
import { AiCallError, logSimulated, runStructuredCall } from "@/lib/ai/call";
import { MODELS, hasAI } from "@/lib/ai/client";
import {
  interviewModelOutputSchema,
  interviewRequestSchema,
  type ExtractedFact,
  type InterviewResponse,
} from "@/lib/ai/schemas";
import { simulatedInterview } from "@/lib/ai/simulated";
import { INTERVIEW_SYSTEM, INTERVIEW_TOOL } from "@/lib/ai/tools";

export const runtime = "nodejs";

/** Fold typographic noise so a faithful quote isn't rejected on curly quotes. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** A fact is kept only if the transcript really contains the words it cites. */
function splitByEvidence(
  facts: ExtractedFact[],
  transcript: string,
): { kept: ExtractedFact[]; dropped: ExtractedFact[] } {
  const haystack = normalize(transcript);
  const kept: ExtractedFact[] = [];
  const dropped: ExtractedFact[] = [];
  for (const fact of facts) {
    const needle = normalize(fact.quote);
    if (needle.length >= 4 && haystack.includes(needle)) kept.push(fact);
    else dropped.push(fact);
  }
  return { kept, dropped };
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = interviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { beat, transcriptSoFar, priorAnswers, followUpsAsked } = parsed.data;
  const budget = Math.max(0, 3 - followUpsAsked);

  const respond = (
    output: { followUps: { because: string; question: string }[]; extracted: ExtractedFact[]; beatSatisfied: boolean },
    simulated: boolean,
  ): NextResponse => {
    const { kept, dropped } = splitByEvidence(output.extracted, transcriptSoFar);
    const payload: InterviewResponse = {
      simulated,
      followUps: output.followUps.slice(0, budget),
      extracted: kept,
      droppedFacts: dropped,
      // budget spent is also a reason to move on, regardless of the model
      beatSatisfied: output.beatSatisfied || budget === 0,
    };
    return NextResponse.json(payload);
  };

  if (!hasAI()) {
    const startedAt = Date.now();
    const output = simulatedInterview(transcriptSoFar, followUpsAsked);
    logSimulated("interview_followup", Date.now() - startedAt);
    return respond(output, true);
  }

  try {
    const { data } = await runStructuredCall({
      feature: "interview_followup",
      model: MODELS.sonnet,
      system: INTERVIEW_SYSTEM,
      tool: INTERVIEW_TOOL,
      schema: interviewModelOutputSchema,
      maxTokens: 2_000,
      userContent: [
        `Current beat: ${beat}`,
        `Follow-ups already asked on this beat: ${followUpsAsked} (you may propose at most ${budget}).`,
        "",
        "Earlier beats, for context only — do NOT re-ask what she already answered:",
        priorAnswers.length > 0 ? priorAnswers.map((a) => `- ${a}`).join("\n") : "- (nothing yet)",
        "",
        "Her transcript for THIS beat, verbatim:",
        transcriptSoFar.trim().length > 0 ? transcriptSoFar : "(she has not said anything yet)",
      ].join("\n"),
    });
    return respond(data, false);
  } catch (err) {
    // never fabricate a follow-up on failure — say nothing, and say why
    const message =
      err instanceof AiCallError ? err.message : "The interviewer could not be reached.";
    return NextResponse.json(
      {
        simulated: false,
        error: message,
        followUps: [],
        extracted: [],
        droppedFacts: [],
        beatSatisfied: false,
      },
      { status: 502 },
    );
  }
}
