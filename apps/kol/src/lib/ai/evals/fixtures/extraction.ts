/**
 * Golden set for interview follow-ups + grounded extraction (spec §8a/§8e).
 *
 * The metric that matters here is hallucinationRate, not F1: a pipeline that
 * misses a fact costs a maker a follow-up question; a pipeline that invents
 * one puts words in her mouth, which is the single thing D10 forbids.
 * Several fixtures below are baited — they describe a scene that invites an
 * assumption the transcript does not support.
 */

import type { GoldenExample } from "../harness.ts";

export interface ExtractionInput {
  beat: string;
  transcriptSoFar: string;
  priorAnswers: string[];
  followUpsAsked: number;
}

export interface ExtractionExpectation {
  /** Values that SHOULD be recoverable from the transcript (lowercased substrings). */
  shouldFind: string[];
  /** Values a careless model might assume — finding any of these is a hallucination. */
  mustNotFind: string[];
  /** Whether any follow-up at all is appropriate here. */
  expectFollowUps: boolean;
}

export const extractionGoldenExamples: GoldenExample<ExtractionInput, ExtractionExpectation>[] = [
  {
    id: "ex-01-sena-craft",
    description: "Rich, specific craft answer — should extract materials and technique",
    tags: ["happy-path"],
    input: {
      beat: "Craft",
      followUpsAsked: 0,
      priorAnswers: [],
      transcriptSoFar:
        "I start every pot by wedging the clay by hand — you push and fold it until the air's out and it moves like it wants to. I can feel when it's ready before I ever centre it on the wheel. The ridge tumblers are the ones I'm known for; I throw them tall, then pull three grooves in with my thumb.",
    },
    expected: {
      shouldFind: ["clay", "wedging", "wheel"],
      mustNotFind: ["kiln", "porcelain", "stoneware", "glaze"],
      expectFollowUps: true,
    },
  },
  {
    id: "ex-02-workshop-sensory",
    description: "Workshop beat with strong palette signals — the input design derivation needs",
    tags: ["happy-path"],
    input: {
      beat: "Workshop",
      followUpsAsked: 0,
      priorAnswers: ["I've been throwing pots for twelve years."],
      transcriptSoFar:
        "It's a converted barn with one big north-facing window. Everything's dusted with clay. There's an ash glaze bucket by the door and the light in there is grey and even all day.",
    },
    expected: {
      shouldFind: ["clay", "glaze"],
      mustNotFind: ["oak", "brass", "leather", "kiln"],
      expectFollowUps: true,
    },
  },
  {
    id: "ex-03-vague-answer",
    description: "Generic non-answer — should probe, and must extract nothing",
    tags: ["edge"],
    input: {
      beat: "Brand",
      followUpsAsked: 0,
      priorAnswers: [],
      transcriptSoFar: "I don't know really. I just love making things. It's nice, I suppose.",
    },
    expected: { shouldFind: [], mustNotFind: ["warm", "minimal", "rustic"], expectFollowUps: true },
  },
  {
    id: "ex-04-empty-transcript",
    description: "She hasn't spoken yet — nothing to reflect, nothing to extract",
    tags: ["edge", "adversarial"],
    input: { beat: "Story & origin", followUpsAsked: 0, priorAnswers: [], transcriptSoFar: "" },
    expected: { shouldFind: [], mustNotFind: ["clay", "wood", "studio"], expectFollowUps: false },
  },
  {
    id: "ex-05-budget-spent",
    description: "Three follow-ups already asked — the budget is hard, not advisory",
    tags: ["boundary"],
    input: {
      beat: "Craft",
      followUpsAsked: 3,
      priorAnswers: [],
      transcriptSoFar: "I hand-carve every spoon from green walnut, usually over two evenings.",
    },
    expected: { shouldFind: ["walnut"], mustNotFind: ["oak", "maple"], expectFollowUps: false },
  },
  {
    id: "ex-06-baited-material",
    description:
      "Baited: she names a place famous for a material she never mentions making things from",
    tags: ["adversarial"],
    input: {
      beat: "Workshop",
      followUpsAsked: 0,
      priorAnswers: [],
      transcriptSoFar:
        "My bench is in a shed behind the house, up in the hills outside Stoke. Morning light comes right across it.",
    },
    expected: {
      shouldFind: ["shed"],
      mustNotFind: ["pottery", "ceramic", "clay", "porcelain"],
      expectFollowUps: true,
    },
  },
  {
    id: "ex-07-negation",
    description: "Baited: she says what she does NOT use — extracting it as a material is wrong",
    tags: ["adversarial"],
    input: {
      beat: "Values",
      followUpsAsked: 0,
      priorAnswers: [],
      transcriptSoFar:
        "I won't use resin, ever. No plastics either. It's linen thread and beeswax, and that's the whole list.",
    },
    expected: { shouldFind: ["linen"], mustNotFind: ["resin", "plastic"], expectFollowUps: true },
  },
  {
    id: "ex-08-time-per-piece",
    description: "A concrete duration is exactly the specific the design stage needs",
    tags: ["happy-path"],
    input: {
      beat: "Craft",
      followUpsAsked: 1,
      priorAnswers: ["I weave on a floor loom my grandmother left me."],
      transcriptSoFar:
        "A single throw takes me about four days on the loom, plus a day to finish the edges by hand.",
    },
    expected: { shouldFind: ["days"], mustNotFind: ["weeks", "hours"], expectFollowUps: true },
  },
  {
    id: "ex-09-done-signal",
    description: "She signals she's finished — stop probing, don't push for a fourth detail",
    tags: ["boundary"],
    input: {
      beat: "Personal",
      followUpsAsked: 2,
      priorAnswers: [],
      transcriptSoFar:
        "I've got two kids and a very old dog, and honestly that's about it. That's about all there is to say.",
    },
    expected: { shouldFind: [], mustNotFind: ["married", "hobby"], expectFollowUps: false },
  },
  {
    id: "ex-10-multi-material",
    description: "Several real materials in one answer — recall matters here",
    tags: ["happy-path"],
    input: {
      beat: "Craft",
      followUpsAsked: 0,
      priorAnswers: [],
      transcriptSoFar:
        "The frames are oak, the seats are woven wool, and the joints are pegged — no steel anywhere in them.",
    },
    expected: { shouldFind: ["oak", "wool"], mustNotFind: ["walnut", "leather"], expectFollowUps: true },
  },
];
