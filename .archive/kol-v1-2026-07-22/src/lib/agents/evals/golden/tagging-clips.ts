import type { GoldenExample } from "../harness";
// Type-only import — erased at compile time, so the server-only chain in
// suggest.ts never loads from here.
import type { SuggestClipInput } from "@/lib/tagging/suggest";

/**
 * Golden clip set for the `tagging_accuracy` eval (video-engine spec §6.4):
 * 13 labelled clips (≥12 floor) covering one per purpose value (6), a
 * multi-purpose clip, the THANKYOU adversarial case, an ambiguous product
 * reference, a no-transcript degrade case, a foreign-language caption, a
 * thankyou-boundary clip, and an energetic-mood clip.
 *
 * The stores/products here are deliberately DIFFERENT from the few-shot
 * examples in suggest.ts's system prompt ("Sena Ceramics") — scoring the
 * model on its own few-shot inputs would be contamination, not evaluation.
 *
 * Expected labels cover the four F1-scored fields only; anti_repetition_key
 * is free-form and confidence is variable, so neither is ground-truthable.
 */

export type TaggingEvalInput = SuggestClipInput;

export type TaggingEvalExpected = {
  purpose: string[];
  page_eligibility: string[];
  product_links: string[];
  mood: string[];
};

export type TaggingGoldenExample = GoldenExample<
  TaggingEvalInput,
  TaggingEvalExpected
>;

// ── Store A: Vera Klay Studio (ceramics) ──
const CUPS = "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1"; // Espresso cup set
const VASE_WHITE = "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2"; // Winter-white vase
const BOWL = "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3"; // Sgraffito bowl
const VASE_MIDNIGHT = "d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4"; // Midnight vase

const VERA_STORE = {
  name: "Vera Klay Studio",
  craft: "ceramics",
  bio: "Wheel-thrown pots from a converted barn.",
};

const VERA_PRODUCTS = [
  {
    id: CUPS,
    title: "Espresso cup set",
    description: "Nested pair; the saucer doubles as a lid.",
  },
  {
    id: VASE_WHITE,
    title: "Winter-white vase",
    description: "Snow-matte glaze, single-stem neck.",
  },
  {
    id: BOWL,
    title: "Sgraffito bowl",
    description: "Leaf pattern carved through dark slip.",
  },
  {
    id: VASE_MIDNIGHT,
    title: "Midnight vase",
    description: "Deep cobalt, wide shoulder.",
  },
];

// ── Store B: Dřevo Marek (woodworking) ──
const BOARD = "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5"; // Walnut serving board

const MAREK_STORE = {
  name: "Dřevo Marek",
  craft: "woodworking",
  bio: null,
};

const MAREK_PRODUCTS = [
  {
    id: BOARD,
    title: "Walnut serving board",
    description: "End-grain, oil finish.",
  },
];

function vtt(...cues: string[]): string {
  return `WEBVTT\n\n${cues
    .map((text, i) => {
      const start = String(i * 8).padStart(2, "0");
      const end = String(i * 8 + 7).padStart(2, "0");
      return `00:00:${start}.000 --> 00:00:${end}.500\n${text}`;
    })
    .join("\n\n")}`;
}

export const goldenExamples: TaggingGoldenExample[] = [
  {
    id: "intro-barn-studio",
    description: "plain maker introduction — happy path for purpose:intro",
    tags: ["happy"],
    input: {
      captionsSrc: vtt(
        "Hello — I'm Vera. This barn has been my studio for nine years.",
        "Everything here is thrown on a wheel my father built.",
      ),
      durationMs: 28_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["intro"],
      page_eligibility: ["feed", "world"],
      product_links: [],
      mood: ["warm"],
    },
  },
  {
    id: "craft-story-grandmother-glaze",
    description: "family glaze recipe — happy path for purpose:craft-story",
    tags: ["happy"],
    input: {
      captionsSrc: vtt(
        "My grandmother wrote this glaze recipe in a school notebook in 1962.",
        "I still mix it by hand the way she did, bucket by bucket.",
      ),
      durationMs: 36_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["craft-story"],
      page_eligibility: ["feed", "world"],
      product_links: [],
      mood: ["warm"],
    },
  },
  {
    id: "process-trimming-foot",
    description: "trimming at the wheel — happy path for purpose:process",
    tags: ["happy"],
    input: {
      captionsSrc: vtt(
        "Once the cup is leather-hard, I flip it and trim the foot.",
        "Long ribbons of clay come off until the wall is even.",
      ),
      durationMs: 52_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["process"],
      page_eligibility: ["feed", "world", "grown"],
      product_links: [],
      mood: ["calm"],
    },
  },
  {
    id: "product-narration-espresso-set",
    description:
      "maker narrates a listed product by name — happy path for product_links",
    tags: ["happy"],
    input: {
      captionsSrc: vtt(
        "These espresso cups come as a nested pair.",
        "The saucer doubles as a lid — my favourite detail.",
      ),
      durationMs: 33_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["product-narration"],
      page_eligibility: ["world", "product"],
      product_links: [CUPS],
      mood: ["warm"],
    },
  },
  {
    id: "thankyou-plain",
    description: "plain gratitude message — purpose:thankyou coverage + gate",
    tags: ["happy", "thankyou-gate"],
    input: {
      captionsSrc: vtt(
        "Thank you for ordering from me. I wrapped this one this morning.",
        "I hope it feels like it was made for you — because it was.",
      ),
      durationMs: 18_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["thankyou"],
      page_eligibility: ["thankyou"],
      product_links: [],
      mood: ["intimate", "warm"],
    },
  },
  {
    id: "atmosphere-rain-kiln-hum",
    description: "ambient studio footage, no speech — purpose:atmosphere",
    tags: ["happy"],
    input: {
      captionsSrc: vtt("[rain on the roof]", "[kiln fan hum]"),
      durationMs: 44_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["atmosphere"],
      page_eligibility: ["world", "grown"],
      product_links: [],
      mood: ["calm"],
    },
  },
  {
    id: "multi-story-process-sgraffito",
    description: "technique demo wrapped in a teacher story — multi-purpose",
    tags: ["edge", "multi-purpose"],
    input: {
      captionsSrc: vtt(
        "Sgraffito means carving through the slip while it's still damp.",
        "My teacher in Osaka made me practice the same leaf for a month.",
        "You can still see her leaf in every line I carve.",
      ),
      durationMs: 61_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["craft-story", "process"],
      page_eligibility: ["feed", "world"],
      product_links: [],
      mood: ["calm"],
    },
  },
  {
    id: "thankyou-with-product-mention",
    description:
      "ADVERSARIAL: gratitude message that names a product and invites a shop revisit — must stay thankyou-only, NEVER feed",
    tags: ["adversarial", "thankyou-gate"],
    input: {
      captionsSrc: vtt(
        "Thank you so much — your winter-white vase is on its way.",
        "I glazed a little extra snow into the rim, just for you.",
        "See you in the shop again soon, I hope.",
      ),
      durationMs: 24_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["thankyou"],
      page_eligibility: ["thankyou"],
      product_links: [VASE_WHITE],
      mood: ["intimate", "warm"],
    },
  },
  {
    id: "ambiguous-vase-reference",
    description:
      "narrates 'the vase' when the store lists two vases — ambiguous reference must NOT be linked",
    tags: ["edge", "ambiguous-product"],
    input: {
      captionsSrc: vtt(
        "The vase in this film holds one stem — that's the point.",
        "One flower, nothing else, and the neck does the arranging for you.",
      ),
      durationMs: 30_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["product-narration"],
      page_eligibility: ["world", "product"],
      product_links: [],
      mood: ["calm"],
    },
  },
  {
    id: "no-transcript-degrade",
    description:
      "empty captions — must degrade to empty tags, not hallucinate from duration alone",
    tags: ["edge", "degrade"],
    input: {
      captionsSrc: "",
      durationMs: 22_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: [],
      page_eligibility: [],
      product_links: [],
      mood: [],
    },
  },
  {
    id: "foreign-language-czech-process",
    description:
      "Czech-language planing clip — classification must survive a non-English caption",
    tags: ["edge", "foreign-language"],
    input: {
      captionsSrc: vtt(
        "Hoblina musí být tenká jako papír.",
        "Když ostří zpívá, dřevo se neláme — ořech je na tohle nejlepší.",
      ),
      durationMs: 47_000,
      store: MAREK_STORE,
      products: MAREK_PRODUCTS,
    },
    expected: {
      purpose: ["process"],
      page_eligibility: ["feed", "world", "grown"],
      product_links: [],
      mood: ["calm"],
    },
  },
  {
    id: "thanks-for-watching-boundary",
    description:
      "process clip that ENDS with a casual 'thanks for watching' — must NOT trip the thankyou-only rule",
    tags: ["boundary", "thankyou-inverse"],
    input: {
      captionsSrc: vtt(
        "That's one full day at the lathe in forty seconds.",
        "Thanks for watching — next week I'll show the oil finish.",
      ),
      durationMs: 40_000,
      store: MAREK_STORE,
      products: MAREK_PRODUCTS,
    },
    expected: {
      purpose: ["process"],
      page_eligibility: ["feed", "world", "grown"],
      product_links: [],
      mood: ["energetic"],
    },
  },
  {
    id: "raku-day-energetic",
    description: "raku firing rush — mood:energetic coverage",
    tags: ["happy", "mood-energetic"],
    input: {
      captionsSrc: vtt(
        "Raku day — we pull the pots glowing at nine hundred degrees.",
        "Straight into the sawdust, and everything smokes at once.",
      ),
      durationMs: 38_000,
      store: VERA_STORE,
      products: VERA_PRODUCTS,
    },
    expected: {
      purpose: ["process"],
      page_eligibility: ["feed", "world"],
      product_links: [],
      mood: ["energetic"],
    },
  },
];
