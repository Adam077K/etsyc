/**
 * KOL MVP variant — mock data layer.
 *
 * This variant is frontend-functional over mock data by design:
 * the ADR-0001 migration has never been applied (founder-gated), so
 * there is NO Supabase and NO live Stripe here. Every entity below
 * mirrors a real table from ADR-0001 so the swap to live data is a
 * data-source change, not a redesign. See DECISIONS.md 2026-07-21 (D17).
 *
 * Two full worlds exist as store-config fixtures (sena, noor/custom);
 * the other three makers are feed-depth stubs.
 */

export interface MockMaker {
  slug: string;
  name: string;
  craft: string;
  location: string;
  craftLine: string;
  /** film-frame gradient class used by mock media (v1–v5) */
  filmClass: "v1" | "v2" | "v3" | "v4" | "v5";
  /**
   * Real maker footage (D12) — left undefined until the clips exist.
   * When set, the film surfaces render an actual <video>; see
   * public/media/README.md for the file contract. Undefined → gradient.
   */
  videoSrc?: string;
  verified: boolean;
  hasWorld: boolean; // true → /m/[slug] renders a full store config
  followers: number;
  bio: string;
}

export const makers: MockMaker[] = [
  {
    slug: "sena",
    name: "Sena",
    craft: "Stoneware",
    location: "Hudson Valley, NY",
    craftLine: "Wheel-thrown stoneware, ash glazes",
    filmClass: "v1",
    verified: true,
    hasWorld: true,
    followers: 214,
    bio: "Twelve years, one wheel. Ash-glazed stoneware fired slow.",
  },
  {
    slug: "noor",
    name: "Noor",
    craft: "Natural dye",
    location: "Marrakech → Lisbon",
    craftLine: "Indigo, madder, weld — vat-dyed by hand",
    filmClass: "v5",
    verified: true,
    hasWorld: true,
    followers: 187,
    bio: "She learned the vat from her grandmother, who kept one alive for thirty years.",
  },
  {
    slug: "tomas",
    name: "Tomas",
    craft: "Green woodwork",
    location: "Vermont",
    craftLine: "Ash split by hand, spoons and bowls",
    filmClass: "v3",
    verified: true,
    hasWorld: false,
    followers: 96,
    bio: "Green wood moves as it dries. That's the material talking.",
  },
  {
    slug: "mira",
    name: "Mira",
    craft: "Copper",
    location: "Asheville, NC",
    craftLine: "Hand-raised copper, small batch",
    filmClass: "v4",
    verified: false, // verification pending — honest state exercised in UI
    hasWorld: false,
    followers: town(61),
    bio: "A pan takes four days. Most of that is listening to the metal.",
  },
  {
    slug: "elias",
    name: "Elias",
    craft: "Bookbinding",
    location: "Providence, RI",
    craftLine: "Hand-sewn bindings, marbled endpapers",
    filmClass: "v2",
    verified: true,
    hasWorld: false,
    followers: 143,
    bio: "Every book opens flat or it goes back on the bench.",
  },
];

function town(n: number): number {
  return n;
}

export function getMaker(slug: string): MockMaker | undefined {
  return makers.find((m) => m.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Feed (B1/P6 stand-in): mixed clips, engine rules honoured in data.  */
/* No `thankyou`-purpose clip is ever listed feed-eligible.            */
/* ------------------------------------------------------------------ */

export type FeedSize = "a" | "b" | "c" | "d" | "e" | "f";

export interface FeedItem {
  id: string;
  makerSlug: string;
  title: string;
  kind: "video" | "image";
  size: FeedSize;
  aspect: "tall" | "wide" | "square" | "portrait";
  /** why the engine picked it — surfaced on For You (P6+) */
  reason?: string;
}

export const feedItems: FeedItem[] = [
  { id: "f1", makerSlug: "sena", title: "Sena throws the last of the ridge tumblers", kind: "video", size: "a", aspect: "tall" },
  { id: "f2", makerSlug: "noor", title: "Noor, indigo vat, day 9", kind: "video", size: "b", aspect: "square" },
  { id: "f3", makerSlug: "tomas", title: "Tomas splits ash by hand", kind: "video", size: "d", aspect: "portrait" },
  { id: "f4", makerSlug: "mira", title: "Mira finishes a pan that took four days", kind: "video", size: "c", aspect: "wide" },
  { id: "f5", makerSlug: "elias", title: "Elias, endpapers", kind: "video", size: "b", aspect: "square" },
  { id: "f6", makerSlug: "sena", title: "A kiln opening, filmed at 6am", kind: "video", size: "e", aspect: "wide" },
  { id: "f7", makerSlug: "noor", title: "Pulling the first skein", kind: "image", size: "d", aspect: "portrait" },
  { id: "f8", makerSlug: "elias", title: "Sewing a spine, real time", kind: "video", size: "e", aspect: "wide" },
];

export const forYouReasons: Record<string, string> = {
  f1: "Because you follow Sena",
  f2: "You asked Noor a question",
  f6: "Because you follow Sena",
  f7: "You saved the shibori throw",
  f4: "Near your saved makers",
  f8: "You watched Elias to the end",
};

/* ------------------------------------------------------------------ */
/* Products (S8 + P13 + P14). Prices in minor units (cents).           */
/* ------------------------------------------------------------------ */

export interface MockProduct {
  id: string;
  /**
   * The same product's id inside the store-config fixture. Worlds render
   * from the fixture, so links they emit carry THIS id; the product page
   * resolves either. One product, two id spaces, reconciled in getProduct.
   */
  configId?: string;
  makerSlug: string;
  title: string;
  priceMinor: number;
  /**
   * ISO-4217. The prototype seeds USD, but real rows can carry any
   * currency the maker sells in — pinning this to "USD" made the
   * Supabase adapter throw on perfectly valid data.
   */
  currency: CurrencyCode;
  description: string;
  inventory: { status: "in-stock" | "made-to-order" | "sold-out"; qty?: number; leadWeeks?: number };
  filmClass: MockMaker["filmClass"];
  provenance: {
    role: string;
    materials: string;
    process: string;
    location: string;
    partners: string;
  };
  expect: Record<string, string>; // the 11 P14 fields, keyed by label
  voiceoverLine?: string;
}

/** Widened deliberately: a maker in Lisbon does not price in dollars. */
export type CurrencyCode = string;

const EXPECT_KEYS = [
  "Dimensions", "Materials", "Texture", "Handmade variation", "Production time",
  "Shipping", "Care", "Repairs", "Returns", "Customization limits", "First use",
] as const;
export const expectKeys = EXPECT_KEYS;

export const products: MockProduct[] = [
  {
    id: "shibori-throw",
    configId: "p_shibori_throw",
    makerSlug: "noor",
    title: "Shibori throw — deep indigo",
    priceMinor: 24500,
    currency: "USD",
    description:
      "Vat-dyed linen throw, bound and dipped nine times. The unevenness you can see in the film is the point — no two skeins leave the same.",
    inventory: { status: "made-to-order", leadWeeks: 3 },
    filmClass: "v5",
    provenance: {
      role: "Dyed, bound, and finished by Noor — every step",
      materials: "European flax linen; natural indigo, madder root",
      process: "Bound-resist (shibori), nine dips, air-oxidised between each",
      location: "Studio in Lisbon; indigo from a family supplier in Marrakech",
      partners: "Loom-woven blanks from a two-person mill in Guimarães",
    },
    expect: {
      Dimensions: "130 × 180 cm, ±3 cm — cut and hemmed by hand",
      Materials: "100% linen, natural indigo — no synthetic fixers",
      Texture: "Dry, weighty hand; softens with every wash",
      "Handmade variation": "Pattern spacing varies; yours will not match the photo exactly",
      "Production time": "Made to order — about 3 weeks before shipping",
      Shipping: "Tracked, 5–8 days EU/US; ships in paper, no plastic",
      Care: "Cold hand-wash, dry flat, out of direct sun",
      Repairs: "I re-dye & mend for free within 2 years",
      Returns: "14 days if unwashed; made-to-order, so please ask first",
      "Customization limits": "Size & indigo depth, yes; other dyes, ask",
      "First use": "Will release loose indigo once — wash alone the first time",
    },
    voiceoverLine: "The vat tells you when it's ready. You can smell it before you see it.",
  },
  {
    id: "ridge-tumbler",
    configId: "p_ridge_tumbler",
    makerSlug: "sena",
    title: "Ridge tumbler — ash glaze",
    priceMinor: 6800,
    currency: "USD",
    description:
      "Wheel-thrown stoneware tumbler with the ridge line left proud. Ash glaze breaks amber where the flame hits.",
    inventory: { status: "in-stock", qty: 7 },
    filmClass: "v1",
    provenance: {
      role: "Thrown, glazed, and fired by Sena",
      materials: "Local stoneware clay; hardwood-ash glaze",
      process: "Wheel-thrown, once-fired to cone 10 in a gas kiln",
      location: "Barn studio, Hudson Valley NY",
      partners: "None — single pair of hands",
    },
    expect: {
      Dimensions: "9 cm ⌀ × 11 cm, ~330 ml — each within ±5 mm",
      Materials: "Stoneware, food-safe ash glaze (lead-free)",
      Texture: "Satin glaze over visible throwing ridge",
      "Handmade variation": "Glaze break differs on every piece",
      "Production time": "In stock — ships in 2–3 days",
      Shipping: "Double-boxed, tracked, US 3–5 days",
      Care: "Dishwasher fine; avoid thermal shock",
      Repairs: "Chips happen — kintsugi referral, at cost",
      Returns: "30 days, any reason",
      "Customization limits": "Sets of 4+ can be matched on request",
      "First use": "None — use it tonight",
    },
    voiceoverLine: "The ridge is where your thumb lands. That's not an accident.",
  },
  {
    id: "ash-bowl",
    configId: "p_ash_bowl",
    makerSlug: "sena",
    title: "Ash bowl — wide",
    priceMinor: 12400,
    currency: "USD",
    description: "Wide serving bowl, ash glaze pooled at the well.",
    inventory: { status: "in-stock", qty: 3 },
    filmClass: "v1",
    provenance: {
      role: "Thrown, glazed, and fired by Sena",
      materials: "Local stoneware; hardwood-ash glaze",
      process: "Wheel-thrown, cone 10",
      location: "Hudson Valley, NY",
      partners: "None",
    },
    expect: {
      Dimensions: "26 cm ⌀ × 9 cm",
      Materials: "Stoneware, food-safe glaze",
      Texture: "Glassy well, dry rim",
      "Handmade variation": "Pooling pattern unique per bowl",
      "Production time": "In stock — 2–3 days",
      Shipping: "Double-boxed, tracked",
      Care: "Dishwasher fine",
      Repairs: "Kintsugi referral at cost",
      Returns: "30 days",
      "Customization limits": "Glaze depth on request for sets",
      "First use": "None",
    },
  },
  {
    id: "commission-quilt",
    makerSlug: "noor",
    title: "Commissioned indigo quilt (co-created)",
    priceMinor: 88000,
    currency: "USD",
    description: "Full co-creation piece — brief, drafts, and approval before the vat opens.",
    inventory: { status: "made-to-order", leadWeeks: 8 },
    filmClass: "v5",
    provenance: {
      role: "Designed with the buyer; dyed and quilted by Noor",
      materials: "Linen top, cotton batting, natural indigo",
      process: "Shibori panels, hand-quilted",
      location: "Lisbon",
      partners: "None",
    },
    expect: {
      Dimensions: "Set in the brief — up to 220 × 240 cm",
      Materials: "Linen + cotton, natural dye only",
      Texture: "Quilted, weighty",
      "Handmade variation": "Every panel unique",
      "Production time": "~8 weeks after draft approval",
      Shipping: "Insured, tracked",
      Care: "Cold hand-wash",
      Repairs: "Lifetime mending",
      Returns: "Deposit non-refundable after approval; balance refundable pre-ship",
      "Customization limits": "Indigo family only",
      "First use": "Wash alone once",
    },
  },
];

export function getProduct(id: string): MockProduct | undefined {
  return products.find((p) => p.id === id || p.configId === id);
}
export function productsByMaker(slug: string): MockProduct[] {
  return products.filter((p) => p.makerSlug === slug);
}
export function formatPrice(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}

/* ------------------------------------------------------------------ */
/* Reviews (B6+): verified is derived server-side in the real build.   */
/* ------------------------------------------------------------------ */

export interface MockReview {
  id: string;
  productId: string;
  buyer: string;
  verified: boolean;
  stars: 1 | 2 | 3 | 4 | 5;
  expectationAccuracy: 1 | 2 | 3 | 4 | 5;
  body: string;
  variation?: string;
  /** B6+ customization context — what the buyer had made differently */
  customization?: string;
  hasPhoto: boolean;
  makerResponse?: string;
  when: string;
}

export const reviews: MockReview[] = [
  {
    id: "r1",
    productId: "shibori-throw",
    buyer: "Priya",
    verified: true,
    stars: 5,
    expectationAccuracy: 5,
    body: "The unevenness I saw in her video is exactly what showed up on my couch — more textured in person and I love that.",
    variation: "130 × 180, deep indigo",
    hasPhoto: true,
    makerResponse: "This made my week — that batch fought me and won. Enjoy it. — Noor",
    when: "2 weeks ago",
  },
  {
    id: "r2",
    productId: "ridge-tumbler",
    buyer: "Devon",
    verified: true,
    stars: 5,
    expectationAccuracy: 4,
    body: "Slightly darker than the film showed, which she warns you about. The ridge really is where your thumb lands.",
    variation: "Single, amber break",
    hasPhoto: false,
    when: "1 month ago",
  },
];

export function reviewsForProduct(id: string): MockReview[] {
  return reviews.filter((r) => r.productId === id);
}

/* ------------------------------------------------------------------ */
/* Ask the Maker (B12) — public, product-scoped. Separate from P15.    */
/* ------------------------------------------------------------------ */

export interface MockQA {
  id: string;
  productId: string;
  asker: string;
  question: string;
  answer?: string;
  answerKind?: "text" | "audio";
  audioLen?: string;
}

export const questions: MockQA[] = [
  {
    id: "q1",
    productId: "shibori-throw",
    asker: "Devon",
    question: "Does the indigo rub off on light sofas?",
    answer: "A little the first week, like new denim. After the first wash it's set. I'd keep it off cream linen until then.",
    answerKind: "text",
  },
  {
    id: "q2",
    productId: "shibori-throw",
    asker: "Sam",
    question: "Can you make it a touch bigger for a queen bed?",
    answer: "Yes — up to 150 × 200. Listen, I'll tell you why I'd size it this way, it's easier to hear than read.",
    answerKind: "audio",
    audioLen: "0:24",
  },
];

/* ------------------------------------------------------------------ */
/* Inbox (P15): typed 1:1 threads. NEVER mixed with community/Q&A.     */
/* ------------------------------------------------------------------ */

export type ThreadType = "commission" | "question" | "order";

export interface MockMessage {
  from: "you" | "maker";
  kind: "text" | "audio" | "draft";
  body: string;
  draftVersion?: number;
  when: string;
}

export interface MockThread {
  id: string;
  makerSlug: string;
  type: ThreadType;
  subject: string;
  messages: MockMessage[];
  unread: boolean;
}

export const threads: MockThread[] = [
  {
    id: "t-quilt",
    makerSlug: "noor",
    type: "commission",
    subject: "Indigo quilt — draft v3",
    unread: true,
    messages: [
      { from: "you", kind: "text", body: "The second panel feels right. Could the border pull from the same dark dip?", when: "Tue" },
      { from: "maker", kind: "audio", body: "Voice note — why the border wants to stay lighter (0:41)", when: "Tue" },
      { from: "maker", kind: "draft", body: "Draft v3 — border kept light, corners deepened", draftVersion: 3, when: "Wed" },
    ],
  },
  {
    id: "t-tumbler",
    makerSlug: "sena",
    type: "order",
    subject: "Order #1041 — ridge tumblers ×2",
    unread: false,
    messages: [
      { from: "maker", kind: "text", body: "Both tumblers came out of the kiln this morning — the amber break is strong on yours. Shipping tomorrow.", when: "Mon" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Notifications (B16): one-way, maker-voiced, read-only. No replies.  */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "maker-update" | "reply" | "release" | "community" | "commission-milestone" | "order";

export interface MockNotification {
  id: string;
  type: NotificationType;
  makerSlug: string;
  /** maker-attributed, human-voiced copy — never system-voiced */
  line: string;
  deepLink: string; // where it opens — may be an inbox thread; never repliable inline
  when: string;
}

export const notifications: MockNotification[] = [
  { id: "n1", type: "maker-update", makerSlug: "sena", line: "Sena fired a new batch — the kiln opens Friday", deepLink: "/m/sena", when: "2h" },
  { id: "n2", type: "commission-milestone", makerSlug: "noor", line: "Noor posted draft v3 of your quilt", deepLink: "/inbox/t-quilt", when: "1d" },
  { id: "n3", type: "reply", makerSlug: "noor", line: "Noor answered your question about the throw", deepLink: "/m/noor/p/shibori-throw", when: "2d" },
  { id: "n4", type: "order", makerSlug: "sena", line: "Sena shipped order #1041 — tracking inside", deepLink: "/orders/o-1041", when: "3d" },
  { id: "n5", type: "community", makerSlug: "sena", line: "Sena pinned a post in her community: glaze week", deepLink: "/m/sena/community", when: "4d" },
];

/* ------------------------------------------------------------------ */
/* Orders (B9) + thank-you (B8). Maker-authored message ONLY (D10).    */
/* ------------------------------------------------------------------ */

export interface MockOrderItem {
  productId: string;
  qty: number;
  customization?: string;
}

export interface MockOrder {
  id: string;
  makerSlug: string;
  items: MockOrderItem[];
  totalMinor: number;
  placed: string;
  stage: 0 | 1 | 2 | 3 | 4; // accepted → materials → in production → finishing → shipped
  updates: { stage: number; note: string; when: string }[];
  /** maker-authored thank-you — never AI-fabricated */
  thankYou?: string;
}

export const orderStages = ["Accepted", "Materials", "In production", "Finishing", "Shipped"] as const;

export const orders: MockOrder[] = [
  {
    id: "o-1041",
    makerSlug: "sena",
    items: [{ productId: "ridge-tumbler", qty: 2 }],
    totalMinor: 13600,
    placed: "Jul 14",
    stage: 4,
    updates: [
      { stage: 0, note: "Order in — thank you. Throwing this week's batch Thursday.", when: "Jul 14" },
      { stage: 2, note: "Yours are on the third shelf, drying slow.", when: "Jul 16" },
      { stage: 4, note: "Kiln was kind. Shipped, tracking attached.", when: "Jul 20" },
    ],
    thankYou:
      "Thank you for buying from a one-wheel shop. These two came out of the same firing as the ones in the film — use them hard.",
  },
];

export function getOrder(id: string): MockOrder | undefined {
  return orders.find((o) => o.id === id);
}

/* ------------------------------------------------------------------ */
/* Community (B15 · D17 2026-07-21): a LAYER, not the defining feature.*/
/* Single-level comments. Hide-only moderation. Membership = follows.  */
/* ------------------------------------------------------------------ */

export interface MockPost {
  id: string;
  author: string; // maker name or member name
  isMaker: boolean;
  body: string;
  when: string;
  pinned?: boolean;
  comments: { author: string; body: string; when: string; hidden?: boolean }[];
}

export interface MockCommunity {
  makerSlug: string;
  visibility: "public" | "private";
  members: number;
  posts: MockPost[];
  exclusives: { title: string; note: string }[];
}

export const communities: MockCommunity[] = [
  {
    makerSlug: "sena",
    visibility: "public",
    members: 41,
    posts: [
      {
        id: "p1",
        author: "Sena",
        isMaker: true,
        pinned: true,
        body: "Glaze week. I'm testing three ash ratios and posting the breaks here first — community gets pick of the batch before anything lists.",
        when: "2d",
        comments: [
          { author: "Priya", body: "The middle ratio from last time is still my favourite mug.", when: "1d" },
          { author: "Devon", body: "Any chance of a matte one?", when: "1d" },
        ],
      },
      {
        id: "p2",
        author: "Marta",
        isMaker: false,
        body: "Visited the barn studio Saturday — if she opens another kiln-day slot, take it. Watching the opening is something else.",
        when: "5d",
        comments: [{ author: "Sena", body: "Next one's in three weeks — pinning a signup soon.", when: "4d" }],
      },
    ],
    exclusives: [
      { title: "Kiln-opening pick", note: "Members choose from the batch 48h before public listing" },
      { title: "Seconds shelf", note: "Honest flaws, half price, photographed plainly" },
    ],
  },
  {
    makerSlug: "noor",
    visibility: "private",
    members: 3,
    posts: [], // cold-start state — designed, not hidden
    exclusives: [{ title: "Vat-day film", note: "Members see the full dye-day cut" }],
  },
];

export function communityFor(slug: string): MockCommunity | undefined {
  return communities.find((c) => c.makerSlug === slug);
}

/* ------------------------------------------------------------------ */
/* Collections (B17): public board = the reason this is a page.        */
/* ------------------------------------------------------------------ */

export interface MockCollection {
  slug: string; // high-entropy in real build; readable here for the mock
  title: string;
  visibility: "public" | "private";
  items: { kind: "product" | "maker"; ref: string; note?: string }[];
}

export const collections: MockCollection[] = [
  {
    slug: "c-9f3k2m8q",
    title: "Slow textiles",
    visibility: "public",
    items: [
      { kind: "product", ref: "shibori-throw", note: "the one from the vat film" },
      { kind: "maker", ref: "noor" },
      { kind: "product", ref: "commission-quilt" },
    ],
  },
  {
    slug: "c-2b7d0x1p",
    title: "Kitchen, eventually",
    visibility: "private",
    items: [
      { kind: "product", ref: "ridge-tumbler" },
      { kind: "product", ref: "ash-bowl" },
      { kind: "maker", ref: "mira" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Events (B19 · v1.1 — designed-for, not shipped; mock only).         */
/* ------------------------------------------------------------------ */

export interface MockEvent {
  id: string;
  makerSlug: string;
  kind: "workshop" | "studio-tour" | "launch";
  title: string;
  when: string;
  live?: boolean;
  vod?: boolean;
}

export const events: MockEvent[] = [
  { id: "e1", makerSlug: "sena", kind: "studio-tour", title: "Kiln opening, live from the barn", when: "Fri 6pm", live: false },
  { id: "e2", makerSlug: "sena", kind: "workshop", title: "Pulling handles — 40 min, hands on", when: "Aug 2" },
  { id: "e3", makerSlug: "sena", kind: "launch", title: "Ridge series, second firing", when: "Aug 9" },
  { id: "e4", makerSlug: "sena", kind: "studio-tour", title: "Last month's kiln opening (recording)", when: "Jun 20", vod: true },
];

/* ------------------------------------------------------------------ */
/* Seller pipeline (S1–S9) mock state for Sena's own view.             */
/* ------------------------------------------------------------------ */

export const interviewBeats = [
  "Story & origin", "Craft", "Workshop", "Values", "Brand", "Personal", "Product stories",
] as const;

export interface SellerBlockRow {
  id: string;
  type: string;
  label: string;
  aa: { pass: boolean; ratio: string };
  coherence: number;
  approval: "approved" | "needs-review" | "edited";
}

export const sellerBlocks: SellerBlockRow[] = [
  { id: "b1", type: "hero-video", label: "Hero film — wheel, morning light", aa: { pass: true, ratio: "8.2:1" }, coherence: 0.86, approval: "approved" },
  { id: "b2", type: "craft-story", label: "Twelve years, one wheel", aa: { pass: true, ratio: "7.1:1" }, coherence: 0.84, approval: "approved" },
  { id: "b3", type: "product-showcase", label: "Ridge series rail", aa: { pass: true, ratio: "6.4:1" }, coherence: 0.82, approval: "edited" },
  { id: "b4", type: "voice-quote", label: "“The ridge is where your thumb lands.”", aa: { pass: true, ratio: "5.9:1" }, coherence: 0.79, approval: "needs-review" },
  { id: "b5", type: "process-reel", label: "Kiln opening reel", aa: { pass: true, ratio: "7.7:1" }, coherence: 0.88, approval: "approved" },
  { id: "b6", type: "contact-cta", label: "Follow / message strip", aa: { pass: true, ratio: "4.9:1" }, coherence: 0.81, approval: "approved" },
];

export const publishPreconditions = [
  { key: "aa", label: "WCAG-AA hard gate — every block passes", met: true },
  { key: "approved", label: "All rendered blocks approved", met: false },
  { key: "anchor", label: "Real-Maker voice anchor resolved", met: true },
  { key: "specs", label: "P14 product specs complete on every product", met: true },
] as const;
