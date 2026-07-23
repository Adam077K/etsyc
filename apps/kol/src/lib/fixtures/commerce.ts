/**
 * Commerce fixtures for Arc 2 (product / checkout / thank-you). SCREENS-ONLY,
 * all synthetic demo content. Prices are demo store figures; the card form is a
 * visibly-fake mock (no real payment, no real brand). Stock imagery reused from
 * the maker worlds (see public/media/CREDITS.md).
 */

import { WORLDS } from "./worlds";
import { getMaker, type Maker } from "./makers";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  author: string;
  place: string;
  /** verified-purchase — a trust cue, never a star rating (no deal-grid clutter) */
  verified: boolean;
  /** the review as a short story, in the buyer's own words */
  body: string;
  /** confirms the piece matched what was promised (D16-5 expectation-accuracy) */
  asExpected: boolean;
}

export interface ProductDetail {
  id: string;
  worldSlug: string;
  name: string;
  price: string;
  priceValue: number;
  note?: string;
  /** the docked film's contextual narration clip for THIS product (journey 5) */
  clipLabel: string;
  clipDuration: string;
  /**
   * Optional real contextual clip at /media/video/product-<id>.mp4 for the
   * docked PiP. Set once the file exists; falls back to the still otherwise.
   * See public/media/video/README.md.
   */
  filmSrc?: string;
  gallery: string[];
  /** description in the maker's voice */
  description: string[];
  /** "Exactly what to expect" — the required structured info standard (D16-4) */
  specs: ProductSpec[];
  reviews: Review[];
}

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  carafe: {
    id: "carafe",
    worldSlug: "odd-clay",
    name: "Salt-Fired Carafe",
    price: "£52",
    priceValue: 52,
    note: "1 of a kind",
    clipLabel: "Lena on the salt-firing",
    clipDuration: "0:24",
    gallery: ["/media/salt-ceramics.jpg", "/media/clay-shape.jpg", "/media/clay-shelf.jpg"],
    description: [
      "This is the carafe I reach for first. One litre, thrown in a single pull, with a thumb-rest worn in exactly where my hand sat raising it.",
      "The surface is written by the kiln — sea salt thrown in at peak heat vaporises and settles as an orange-peel glaze. No two are alike, so the one you see is the one you get.",
    ],
    specs: [
      { label: "Holds", value: "1 litre" },
      { label: "Dimensions", value: "22cm tall · 11cm base" },
      { label: "Material", value: "Salt-fired stoneware, food-safe glaze" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Hand-wash; not for the dishwasher" },
      { label: "Returns", value: "30 days · repairs offered for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Marianne T.",
        place: "Porto",
        verified: true,
        asExpected: true,
        body: "It arrived wrapped in newspaper with a handwritten note. The glaze is even more alive in person — it catches the morning light on my table. I use it every single day.",
      },
      {
        id: "r2",
        author: "Devin O.",
        place: "Brooklyn",
        verified: true,
        asExpected: true,
        body: "Bought it after watching Lena's film. Knowing whose hands made it changes how it feels to pour from. Heavier and more solid than I expected, in the best way.",
      },
    ],
  },
  plates: {
    id: "plates",
    worldSlug: "odd-clay",
    name: "Everyday Plates",
    price: "£96",
    priceValue: 96,
    note: "Set of 4",
    clipLabel: "Lena on daily-use glaze",
    clipDuration: "0:19",
    gallery: ["/media/plates.jpg", "/media/clay-drying.jpg", "/media/clay-shelf.jpg"],
    description: [
      "A set of four, no two the same size — that is deliberate. Plates should feel like a family, not a factory line.",
      "Glazed for real life: chip them, stack them, run them through the dishwasher. They only look better with a few honest marks.",
    ],
    specs: [
      { label: "Set", value: "4 plates, 21–23cm" },
      { label: "Material", value: "Stoneware, reactive glaze" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Dishwasher-safe" },
      { label: "Variation", value: "Sizes and tone vary by piece" },
      { label: "Returns", value: "30 days · repairs for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Sofia L.",
        place: "Lisbon",
        verified: true,
        asExpected: true,
        body: "We use these for everything now. The slight differences between each plate are the whole charm — dinner feels a little more considered.",
      },
    ],
  },
  tumblers: {
    id: "tumblers",
    worldSlug: "odd-clay",
    name: "Morning Tumblers",
    price: "£64",
    priceValue: 64,
    note: "Set of 4",
    clipLabel: "Lena on the speckle",
    clipDuration: "0:16",
    gallery: ["/media/mono-ceramics.jpg", "/media/clay-wheel.jpg", "/media/clay-shelf.jpg"],
    description: [
      "Sized for the first coffee of the day — small enough to cup in two hands, heavy enough to feel like it means it.",
      "Speckled porcelain with a raw clay foot, so it grips the saucer and warms slowly. Four to a set, because mornings are better shared.",
    ],
    specs: [
      { label: "Set", value: "4 tumblers, 8cm" },
      { label: "Holds", value: "200ml" },
      { label: "Material", value: "Speckled porcelain" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Dishwasher-safe" },
      { label: "Returns", value: "30 days · repairs for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Aiko M.",
        place: "Kyoto",
        verified: true,
        asExpected: true,
        body: "The weight is perfect. My morning ritual feels different holding one of these instead of a mug from a shop.",
      },
    ],
  },
  length: {
    id: "length",
    worldSlug: "indigo-ash",
    name: "Indigo Length · 2m",
    price: "£120",
    priceValue: 120,
    note: "Dye-lot unique",
    clipLabel: "Sabine on reading the vat",
    clipDuration: "0:28",
    gallery: ["/media/textile-fold.jpg", "/media/indigo-dye.jpg", "/media/textile-machine.jpg"],
    description: [
      "Two metres of hand-dipped cotton, for the tailor or maker who already knows what they want it to become.",
      "The depth of blue is a record of how many times I chose to go back into the vat. This lot went in nine times. The next will be its own colour entirely.",
    ],
    specs: [
      { label: "Length", value: "2m × 1.1m wide" },
      { label: "Material", value: "100% cotton, natural indigo" },
      { label: "Dye", value: "Hand-dipped, 9 immersions" },
      { label: "Made to order", value: "Ships in 1–2 weeks" },
      { label: "Care", value: "Cold hand-wash; will soften, holds the blue" },
      { label: "Returns", value: "14 days on uncut lengths" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Amara K.",
        place: "London",
        verified: true,
        asExpected: true,
        body: "I made a jacket from this and it's the most complimented thing I own. The blue is so much deeper than any dyed fabric I've bought before.",
      },
      {
        id: "r2",
        author: "Ren P.",
        place: "Amsterdam",
        verified: true,
        asExpected: true,
        body: "Sabine messaged to ask what I was making before she cut the lot. That never happens. The cloth is beautiful and the care is the real luxury.",
      },
    ],
  },
  wrap: {
    id: "wrap",
    worldSlug: "indigo-ash",
    name: "The Everyday Wrap",
    price: "£85",
    priceValue: 85,
    note: "Made to order",
    clipLabel: "Sabine on the everyday wrap",
    clipDuration: "0:21",
    gallery: ["/media/textile-scarf.jpg", "/media/textiles-rack.jpg", "/media/indigo-dye.jpg"],
    description: [
      "Light enough for a Dakar afternoon, deep enough for a London winter. The one piece I told myself I'd keep, and then made again.",
      "Finished by hand on a machine older than me. It softens with every wash and never lets go of the blue.",
    ],
    specs: [
      { label: "Dimensions", value: "180cm × 65cm" },
      { label: "Material", value: "Hand-dyed cotton-linen" },
      { label: "Made to order", value: "Ships in 1–2 weeks" },
      { label: "Care", value: "Cold wash, line dry" },
      { label: "Variation", value: "Each dye-lot is unique" },
      { label: "Returns", value: "30 days" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Nadia B.",
        place: "Paris",
        verified: true,
        asExpected: true,
        body: "I wear it three seasons out of four. It arrived softer than I imagined and the colour has only got better with washing.",
      },
    ],
  },
};

export function getProduct(slug: string, productId: string): ProductDetail | undefined {
  const p = PRODUCT_DETAILS[productId];
  return p && p.worldSlug === slug ? p : undefined;
}

/** All (slug, product) pairs for generateStaticParams. */
export function allProductParams(): { slug: string; product: string }[] {
  return Object.values(PRODUCT_DETAILS).map((p) => ({
    slug: p.worldSlug,
    product: p.id,
  }));
}

/** Trust badge (D7) — two honest layers, personalised per maker. */
export function trustLayers(maker: Maker) {
  return {
    realMaker: {
      title: "Verified real maker",
      body: `${maker.name} is a real person — identity confirmed and anchored by her own voice on film.`,
    },
    aiTransparency: {
      title: "Honest about AI",
      body: "AI helped draft this shop's layout and tidy the copy. The object, the film, and the voice are the maker's own.",
    },
  };
}

/* ---- Mock bag + order (checkout / thank-you) ---- */

export interface BagLine {
  productId: string;
  qty: number;
}

export const MOCK_BAG: BagLine[] = [
  { productId: "carafe", qty: 1 },
  { productId: "wrap", qty: 1 },
];

export interface ResolvedLine {
  product: ProductDetail;
  maker: Maker;
  qty: number;
  lineTotal: number;
}

export function resolveBag(bag: BagLine[] = MOCK_BAG): ResolvedLine[] {
  const lines: ResolvedLine[] = [];
  for (const { productId, qty } of bag) {
    const product = PRODUCT_DETAILS[productId];
    if (!product) continue;
    const maker = getMaker(product.worldSlug);
    if (!maker) continue;
    lines.push({ product, maker, qty, lineTotal: product.priceValue * qty });
  }
  return lines;
}

// Free UK shipping — matches the product-page promise (a mocked UI must not
// contradict itself). Rendered as "Free · UK" in the summary.
export const SHIPPING = 0;

export function bagTotals(lines: ResolvedLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { subtotal, shipping: SHIPPING, total: subtotal + SHIPPING };
}

export const gbp = (n: number) => `£${n.toFixed(2)}`;

export const MOCK_ORDER = {
  number: "KOL-2607-4413",
  date: "23 July 2026",
  email: "you@example.com",
  deliveryEstimate: "Arrives 6–10 August",
};

/**
 * Personal thank-you note per maker, in their own voice (journey step 8).
 * `filmSrc` (optional) points at /media/video/thankyou-<slug>.mp4 for the
 * thank-you hero clip — set once the file exists; falls back to the still.
 */
export const THANK_YOU_NOTES: Record<
  string,
  { line: string; clip: string; filmSrc?: string }
> = {
  "odd-clay": {
    line: "Thank you — truly. Your carafe is on the drying shelf now; I'll pack it the morning it's ready and slip a note in the box.",
    clip: "0:22",
  },
  "indigo-ash": {
    line: "Merci. Your wrap goes into the vat this week. I'll send word the moment the blue is deep enough to cut.",
    clip: "0:18",
  },
};

export function thankYouFor(worldSlug: string) {
  return THANK_YOU_NOTES[worldSlug];
}
