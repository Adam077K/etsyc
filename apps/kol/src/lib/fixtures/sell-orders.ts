/**
 * SELLER HQ mock data (post-publish home — "where a live maker lives").
 *
 * SCREENS-ONLY, ADDITIVE. Everything here is SYNTHETIC demo material for the
 * pitch, extending the Odd Clay Studio maker (Lena Okafor) whose world buyers
 * already meet at /m/odd-clay and whose seller journey ends at /sell/publish.
 *
 * Order 1 mirrors a real buyer order (carafe + wrap = £137) shown from the
 * MAKER's side as work-to-do. It is an EXPLICIT bag, not the buyer's MOCK_BAG:
 * MOCK_BAG is now the Two Dots buyer-journey bag (Sharon's Butterfly Wings + Cat
 * Tote), and this seller HQ is LENA's — so binding order 1 to MOCK_BAG would show
 * Sharon's pieces as Lena's work ("making 0 of 2"). Kept decoupled so the whole
 * Lena workspace (home / orders / studio / clips / messages / publish) stays one
 * coherent maker.
 *
 * The maker-voiced status lines mirror the buyer's order-status voice: what Lena
 * types here is what her buyer reads (the making line echoes the odd-clay
 * thank-you — "on the drying shelf now"). Engagement numbers are labelled
 * synthetic demo figures; no real sales/ratings are fabricated.
 */

import type { BagLine } from "./commerce";

/* ------------------------------------------------------------------ *
 * Orders — the maker's fulfilment queue.
 * ------------------------------------------------------------------ */

export type OrderStage = "new" | "making" | "shipped";

export interface SellerOrder {
  id: string;
  /** shared order number scheme with the buyer side (KOL-DDMM-nnnn) */
  number: string;
  buyerName: string;
  buyerPlace: string;
  /** when it landed, in plain language */
  placed: string;
  /** the buyer's bag — resolved READ-ONLY via commerce.resolveBag */
  bag: BagLine[];
  /** the maker's own world slug — splits her work from other makers' lines */
  makerSlug: string;
  stage: OrderStage;
  /** the work-to-do headline, in the maker's own voice */
  todo: string;
  /** the promised-by date the maker set */
  promised: string;
}

/**
 * Per-stage voiced status — the maker sets the stage; the `buyerSees` line is
 * exactly what shows on the buyer's order page. Stage 1's "on the drying shelf"
 * is the same sentence as THANK_YOU_NOTES["odd-clay"], making the connection
 * literal: her words travel straight to her buyer.
 */
export const STAGE_META: Record<
  OrderStage,
  { label: string; short: string; buyerSees: string }
> = {
  new: {
    label: "Just in",
    short: "New",
    // First person — this line sits under an "in your voice" label on the
    // maker's side and renders verbatim on the buyer's order page.
    buyerSees: "Your order's with me — I'll start it this week.",
  },
  making: {
    label: "In the making",
    short: "Making",
    buyerSees: "On the drying shelf now — I'll pack it the morning it's ready.",
  },
  shipped: {
    label: "On its way",
    short: "Shipped",
    buyerSees: "Posted this morning — it should reach you within the week.",
  },
};

export const STAGE_ORDER: OrderStage[] = ["new", "making", "shipped"];

/**
 * Three demo orders. Order 1 is a two-maker order (£137) where Lena makes only
 * the carafe; the wrap is Sabine's — it drives the "you make 1 of N, [other]
 * makes the rest" split. Orders 2 & 3 are additive single-maker bags (her own
 * pieces only).
 */
export const SELLER_ORDERS: SellerOrder[] = [
  {
    id: "o-4413",
    number: "KOL-2607-4413",
    buyerName: "Marianne T.",
    buyerPlace: "Porto",
    placed: "2 days ago",
    // Explicit (NOT MOCK_BAG — that's now Two Dots' bag): carafe (yours) +
    // wrap (Sabine's) = £137.
    bag: [
      { productId: "carafe", qty: 1 },
      { productId: "wrap", qty: 1 },
    ],
    makerSlug: "odd-clay",
    stage: "making",
    todo: "Glaze & pack the Salt-Fired Carafe",
    promised: "Aug 14",
  },
  {
    id: "o-4390",
    number: "KOL-2507-4390",
    buyerName: "Sofia L.",
    buyerPlace: "Lisbon",
    placed: "this morning",
    bag: [{ productId: "plates", qty: 1 }], // Everyday Plates · £96
    makerSlug: "odd-clay",
    stage: "new",
    todo: "Throw a fresh set of four",
    promised: "Aug 20",
  },
  {
    id: "o-4361",
    number: "KOL-2307-4361",
    buyerName: "Aiko M.",
    buyerPlace: "Kyoto",
    placed: "6 days ago",
    bag: [{ productId: "tumblers", qty: 1 }], // Morning Tumblers · £64
    makerSlug: "odd-clay",
    stage: "shipped",
    todo: "Speckle-glaze the morning tumblers",
    promised: "Aug 2",
  },
];

/* ------------------------------------------------------------------ *
 * Seller HQ home — the day at a glance.
 * ------------------------------------------------------------------ */

export const HQ_MAKER = {
  name: "Lena",
  studio: "Odd Clay Studio",
  handle: "kol.world/odd-clay",
  worldHref: "/m/odd-clay",
} as const;

/**
 * The week in the maker's world, in KOL's editorial voice — the human numbers,
 * never chart-junk. Figures are labelled synthetic demo data. One dataset
 * (`visits`) drives the single permitted sparkline.
 */
export interface HqPulse {
  metThisWeek: number;
  watchedFilm: number;
  savedYou: number;
  /** last 7 days of visits — the one sparkline on the page */
  visits: number[];
  /** unanswered buyer questions — routes to /sell/messages */
  questions: number;
}

export const HQ_PULSE: HqPulse = {
  metThisWeek: 41,
  watchedFilm: 312,
  savedYou: 6,
  visits: [12, 18, 9, 24, 31, 27, 41],
  questions: 2,
};
