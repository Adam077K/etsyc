/**
 * ASK-THE-MAKER INBOX mock data (post-publish seller tooling).
 *
 * SCREENS-ONLY, additive. Everything here is SYNTHETIC demo material for the
 * pitch: the maker is Lena Okafor of Odd Clay Studio — the same maker whose
 * finished world buyers meet at /m/odd-clay and whose seller journey lives under
 * /sell. This surface is the flip side of the buyer's "Ask {maker}" affordance
 * on the product page: real people writing to a real person, kept as
 * correspondence, never as support tickets.
 *
 * Per concept-lock D16-3 (Ask the Maker) + D16-6 (buyer↔maker messaging) + D15:
 * seller tooling is KOL's own fixed chrome. The buyer questions and Lena's
 * replies are authored to match her adversarially-reviewed voice, and every
 * product fact she cites is drawn from the real carafe/plates/tumbler specs in
 * commerce.ts — never invented.
 */

export type LetterStatus = "needs-reply" | "answered";
export type ReplyMode = "text" | "film" | "voice";

export interface LetterEntry {
  id: string;
  /** who is speaking in this turn of the correspondence */
  from: "buyer" | "maker";
  /** the message body — for a filmed/voiced maker reply, the spoken transcript */
  body: string;
  /** relative time label (mock — no real clock) */
  at: string;
  /** maker turns may be answered on film or by voice, KOL's differentiator */
  mode?: ReplyMode;
  duration?: string;
}

export interface Letter {
  id: string;
  /** buyer first name only — this reads as a letter, not a CRM record */
  buyerFirst: string;
  buyerPlace: string;
  /** initials shown in place of a fabricated buyer photo */
  initials: string;
  /** the piece they're writing about; null for a note about the shop itself */
  productId: string | null;
  subject: string;
  /** still for the piece in question (from the maker's own gallery) */
  image: string;
  status: LetterStatus;
  /** one-line preview for the list */
  preview: string;
  at: string;
  /** the exchange so far, oldest first */
  thread: LetterEntry[];
  /**
   * A reply KOL has drafted in the maker's own voice, ready to send or edit.
   * Present only where the demo shows the drafted-reply affordance.
   */
  draftReply?: string;
}

// Re-exported for existing importers; canonical source is lib/seller-identity.
export { MAKER_AVATAR, MAKER_FIRST } from "@/lib/seller-identity";

export const LETTERS: Letter[] = [
  {
    id: "carafe-hot-coffee",
    buyerFirst: "Clara",
    buyerPlace: "Copenhagen",
    initials: "CV",
    productId: "carafe",
    subject: "Salt-Fired Carafe",
    image: "/media/salt-ceramics.jpg",
    status: "needs-reply",
    preview: "Will it hold hot coffee, or is it more of a water jug?",
    at: "2h ago",
    thread: [
      {
        id: "carafe-1",
        from: "buyer",
        at: "2h ago",
        body: "I watched your film and I can't stop thinking about this carafe. Silly question — will it hold hot coffee, or is it more of a water jug?",
      },
    ],
    draftReply:
      "Not silly at all — it's built for exactly that. It's salt-fired stoneware with a food-safe glaze, so heat doesn't trouble it; pour your coffee straight in. The full litre sees two people through a slow morning. Only ask is a hand-wash after — never the dishwasher.",
  },
  {
    id: "tumblers-darker-glaze",
    buyerFirst: "Wren",
    buyerPlace: "Bristol",
    initials: "WA",
    productId: "tumblers",
    subject: "Morning Tumblers",
    image: "/media/mono-ceramics.jpg",
    status: "needs-reply",
    preview: "Do these come in a darker glaze — something closer to charcoal?",
    at: "4h ago",
    thread: [
      {
        id: "tumblers-1",
        from: "buyer",
        at: "4h ago",
        body: "These are lovely. Do they come in a darker glaze? I'm after something closer to charcoal for my partner — the speckled cream is beautiful but not quite them.",
      },
    ],
  },
  {
    id: "plates-dishwasher",
    buyerFirst: "Jonah",
    buyerPlace: "Leeds",
    initials: "JR",
    productId: "plates",
    subject: "Everyday Plates",
    image: "/media/plates.jpg",
    status: "answered",
    preview: "You answered — every day, no ceremony.",
    at: "Yesterday",
    thread: [
      {
        id: "plates-1",
        from: "buyer",
        at: "Yesterday",
        body: "We've got two small kids and a lot of Weetabix. Can these really go in the dishwasher every day, or am I asking for trouble?",
      },
      {
        id: "plates-2",
        from: "maker",
        mode: "text",
        at: "Yesterday",
        body: "Every day, no ceremony. I glaze them for real life — stack them, run them through the dishwasher, let them earn a few honest marks. They only look better for it. The Weetabix is the real test, and they'll pass.",
      },
    ],
  },
  {
    id: "studio-visit",
    buyerFirst: "Sofia",
    buyerPlace: "Lisbon",
    initials: "SM",
    productId: null,
    subject: "Odd Clay Studio",
    image: "/media/clay-shelf.jpg",
    status: "answered",
    preview: "You replied on film — a walk round the Alfama studio.",
    at: "3d ago",
    thread: [
      {
        id: "studio-1",
        from: "buyer",
        at: "3d ago",
        body: "I've watched your shop film three times now. Where in Lisbon are you — can people ever visit the studio?",
      },
      {
        id: "studio-2",
        from: "maker",
        mode: "film",
        duration: "0:18",
        at: "3d ago",
        body: "Come by — we're up in Alfama, second floor, the one with the drying shelf my landlord swears is a fire hazard. Knock loudly; the wheel drowns everything out.",
      },
    ],
  },
];

/** Product still for the small "about" chip in an open letter, if any. */
export function letterProductImage(letter: Letter): string {
  return letter.image;
}
