/**
 * SELLER JOURNEY mock data (Arc 4 — "how makers get a world").
 *
 * SCREENS-ONLY pass. Everything here is SYNTHETIC demo material authored for the
 * pitch: the maker is Lena Okafor of Odd Clay Studio — the same maker whose
 * finished world buyers already meet at /m/odd-clay. This arc shows how that
 * world was made: interview -> AI drafts a JSON store config -> maker co-edits
 * -> approves section-by-section -> publishes.
 *
 * Per concept-lock D8/D15/D16 + PRODUCT.md: the AI drafts the store as DATA
 * (blocks + tokens + copy + clip refs), never code; the maker stays the author;
 * SELLER TOOLING is KOL chrome (fixed system) while the maker's own BRAND only
 * appears inside the preview pane. Seller shops get palette FREEDOM — the grounds
 * below are labelled starting points, not a cap.
 */

import type { Ground } from "./makers";

/* ------------------------------------------------------------------ *
 * The journey — visualised on the /sell explainer.
 * ------------------------------------------------------------------ */

export type JourneyIcon = "interview" | "draft" | "edit" | "publish";

export interface JourneyStep {
  id: string;
  index: string;
  icon: JourneyIcon;
  title: string;
  body: string;
  /** the maker's effort vs. what KOL takes off their plate */
  makerDoes: string;
  kolDoes: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "interview",
    index: "01",
    icon: "interview",
    title: "Tell your story",
    body: "A warm, adaptive interview — on film if you like, by voice if you don't. Fixed beats, smart follow-ups. It feels like coffee with someone who's genuinely curious about your craft.",
    makerDoes: "Talk for ten minutes",
    kolDoes: "Listens, transcribes, remembers",
  },
  {
    id: "draft",
    index: "02",
    icon: "draft",
    title: "We draft your world",
    body: "KOL turns what you said into a whole shop — layout, colours drawn from your work, your words kept in your voice. Not a template. A first draft built only from you.",
    makerDoes: "Nothing — go make a cup of tea",
    kolDoes: "Designs the entire first draft",
  },
  {
    id: "co-edit",
    index: "03",
    icon: "edit",
    title: "Make it yours",
    body: "Review it section by section in a simple studio. Swap a block, nudge a colour, re-record a clip, add a tap-to-hear voiceover. Change anything. Keep everything you love.",
    makerDoes: "Tweak, approve, or redo",
    kolDoes: "Handles every pixel and line of code",
  },
  {
    id: "publish",
    index: "04",
    icon: "publish",
    title: "Go live",
    body: "Approve the sections you're happy with and publish. Your world is live at your own address, ready for buyers to meet the human before they meet the thing.",
    makerDoes: "Press publish",
    kolDoes: "Ships it, hosts it, keeps it fast",
  },
];

/* ------------------------------------------------------------------ *
 * Chrome stepper — the three routed tool stops.
 * ------------------------------------------------------------------ */

export type SellStopId = "interview" | "studio" | "publish";

export interface SellStop {
  id: SellStopId;
  label: string;
  href: string;
}

export const SELL_STOPS: SellStop[] = [
  { id: "interview", label: "The interview", href: "/sell/interview" },
  { id: "studio", label: "Your studio", href: "/sell/studio" },
  { id: "publish", label: "Go live", href: "/sell/publish" },
];

/* ------------------------------------------------------------------ *
 * The interview — fixed story beats + a mocked mid-interview transcript.
 * ------------------------------------------------------------------ */

export type BeatId = "story" | "craft" | "workshop" | "values" | "brand";

export interface StoryBeat {
  id: BeatId;
  label: string;
  /** what this beat is drawing out of the maker */
  intent: string;
}

export const STORY_BEATS: StoryBeat[] = [
  { id: "story", label: "Your story", intent: "Where the craft began" },
  { id: "craft", label: "The craft", intent: "How a piece is really made" },
  { id: "workshop", label: "The workshop", intent: "Where the work happens" },
  { id: "values", label: "What you stand for", intent: "Why it's made this way" },
  { id: "brand", label: "Your voice", intent: "How the shop should feel" },
];

export type Speaker = "kol" | "maker";
export type CaptureMode = "film" | "voice";

export interface InterviewTurn {
  id: string;
  speaker: Speaker;
  beat: BeatId;
  text: string;
  /** KOL turns can be tagged as an adaptive follow-up rather than a fixed beat */
  followUp?: boolean;
  /** maker turns carry the capture used + a clip duration */
  mode?: CaptureMode;
  duration?: string;
}

/**
 * Mid-interview state: the story beat is done (two exchanges, one an adaptive
 * follow-up), and KOL has just opened the craft beat. The maker's craft answer
 * is the live turn — captured on screen, not scripted here.
 */
export const INTERVIEW_TRANSCRIPT: InterviewTurn[] = [
  {
    id: "t1",
    speaker: "kol",
    beat: "story",
    text: "Let's start where you started. Tell me about the first time clay felt like it was yours — not a class, not a hobby, but yours.",
  },
  {
    id: "t2",
    speaker: "maker",
    beat: "story",
    mode: "film",
    duration: "0:48",
    text: "My uncle welded a wheel out of an old bicycle in my mother's yard in Lagos. I was nine. It wobbled then and it still wobbles now — I brought it all the way to Lisbon and I refuse to fix it.",
  },
  {
    id: "t3",
    speaker: "kol",
    beat: "story",
    followUp: true,
    text: "That wobble — do people ever feel it in the finished pieces?",
  },
  {
    id: "t4",
    speaker: "maker",
    beat: "story",
    mode: "film",
    duration: "0:22",
    text: "They do. No two of my pots match, because no two mornings match. That isn't a flaw I put up with — it's the whole reason I make.",
  },
  {
    id: "t5",
    speaker: "kol",
    beat: "craft",
    text: "Beautiful. Now take me through one morning at the wheel — from the first fistful of clay to the piece you set down to dry.",
  },
];

/** The beat the live turn belongs to (the maker is answering craft now). */
export const ACTIVE_BEAT: BeatId = "craft";

/* ------------------------------------------------------------------ *
 * The AI-drafted store — a JSON config of blocks + tokens + copy.
 * Copy is the maker's own words (reuses the Odd Clay world) so the studio
 * preview renders their real draft, not a lorem stand-in.
 * ------------------------------------------------------------------ */

export type BlockType =
  | "hero"
  | "story"
  | "process"
  | "shop"
  | "studio"
  | "voice";

export interface BlockSwap {
  id: string;
  label: string;
  /** a one-line description of what this layout does */
  note: string;
}

export interface DraftBlock {
  id: string;
  type: BlockType;
  /** the section name shown in the studio list, in plain maker language */
  section: string;
  /** which interview beat KOL drew this section from */
  fromBeat: BeatId;
  /** KOL's warm note on why it drafted this, shown in the edit panel */
  aiNote: string;
  /** layout options for the swap-block control; first is the drafted default */
  swaps: BlockSwap[];
  /** whether this section can carry a re-recordable film clip */
  hasClip: boolean;
  /** default per-element voiceover targets a maker can attach their voice to */
  voiceTargets: string[];
  /** did the AI's first draft land it (pre-approved) or does it need review */
  draftApproved: boolean;
  /** true for sections the maker may leave off without blocking publish */
  optional?: boolean;
}

export interface AccentOption {
  id: Ground;
  label: string;
  hex: string;
  /** text tone that sits legibly on this ground (scrim rule / AA) */
  onGround: "light" | "dark";
}

/**
 * Palette starting points (D15: not a cap — a coherent set drawn from Lena's
 * own glazes). The drafted default is "clay", matching her salt-fired work.
 */
export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "clay", label: "Kiln Clay", hex: "#7C2D12", onGround: "light" },
  { id: "plum", label: "Fig Plum", hex: "#4C2740", onGround: "light" },
  { id: "olive", label: "Studio Olive", hex: "#4E5A2A", onGround: "light" },
  { id: "sky", label: "Slip Blue", hex: "#41628C", onGround: "light" },
  { id: "bone", label: "Bone Paper", hex: "#EFE6D6", onGround: "dark" },
];

export const DRAFT_ACCENT: Ground = "clay";

export const DRAFT_BLOCKS: DraftBlock[] = [
  {
    id: "hero",
    type: "hero",
    section: "Cover film",
    fromBeat: "story",
    aiNote: "Opened on your wheel clip — it's the strongest thing you gave me. The line \"the wheel is still turning\" is lifted straight from how you talk.",
    swaps: [
      { id: "film", label: "Film cover", note: "Your clip plays full-bleed behind the title" },
      { id: "portrait", label: "Portrait cover", note: "A still of you, title beside it" },
    ],
    hasClip: true,
    voiceTargets: ["The welcome line"],
    draftApproved: true,
  },
  {
    id: "story",
    type: "story",
    section: "Your story",
    fromBeat: "story",
    aiNote: "Kept the Lagos wheel and the wobble — those two details did more than any bio could. Trimmed nothing that was yours.",
    swaps: [
      { id: "split", label: "Story beside photo", note: "Text left, your portrait right" },
      { id: "stacked", label: "Story over photo", note: "Full-width image, text below" },
    ],
    hasClip: false,
    voiceTargets: ["Paragraph one", "Paragraph two"],
    draftApproved: true,
  },
  {
    id: "process",
    type: "process",
    section: "How it's made",
    fromBeat: "craft",
    aiNote: "Broke your morning into Centre, Raise, Salt-fire — your words, your order. Each step wants a short clip when you're ready.",
    swaps: [
      { id: "steps", label: "Three steps", note: "Centre · Raise · Salt-fire, side by side" },
      { id: "filmstrip", label: "Filmstrip", note: "One scrolling row of process clips" },
    ],
    hasClip: true,
    voiceTargets: ["Centre", "Raise", "Salt-fire"],
    draftApproved: false,
  },
  {
    id: "shop",
    type: "shop",
    section: "The shop",
    fromBeat: "craft",
    aiNote: "Laid your pieces out as editorial rows, not a grid — each one gets room to breathe and a line in your voice. Prices are yours to set.",
    swaps: [
      { id: "rows", label: "Editorial rows", note: "One piece per row, alternating sides" },
      { id: "quiet", label: "Quiet grid", note: "A calm three-up of pieces" },
      { id: "hidden", label: "Not yet", note: "Hide the shop until you're ready to sell" },
    ],
    hasClip: false,
    voiceTargets: ["Salt-Fired Carafe", "Everyday Plates", "Morning Tumblers"],
    draftApproved: false,
  },
  {
    id: "studio",
    type: "studio",
    section: "The studio",
    fromBeat: "workshop",
    aiNote: "A wide frame of the Alfama drying shelf, captioned in your voice. This is where you'd drop a walk-around clip later.",
    swaps: [
      { id: "wide", label: "Wide still", note: "One cinematic frame of the space" },
      { id: "pair", label: "Two frames", note: "Bench and shelf, side by side" },
    ],
    hasClip: true,
    voiceTargets: ["The studio caption"],
    draftApproved: false,
  },
  {
    id: "voice",
    type: "voice",
    section: "Closing line",
    fromBeat: "values",
    aiNote: "Ended on your own sentence about a pot lasting thirty years. It says everything a mission statement would, and it's actually yours.",
    swaps: [
      { id: "quote", label: "Spoken close", note: "Your line, big, on your accent colour" },
      { id: "follow", label: "Close + follow", note: "The line, plus a follow button" },
    ],
    hasClip: false,
    voiceTargets: ["The closing line"],
    draftApproved: false,
    optional: true,
  },
];

/* ------------------------------------------------------------------ *
 * Publish — the canonical approval summary the maker lands on.
 * The optional "Closing line" is the one intentionally left for later, so the
 * pitch shows you never have to approve everything to go live.
 * ------------------------------------------------------------------ */

export interface PublishSection {
  id: string;
  section: string;
  approved: boolean;
  optional?: boolean;
  /** what the maker changed, in plain language, for the summary */
  edit: string;
}

export const PUBLISH_SECTIONS: PublishSection[] = [
  { id: "hero", section: "Cover film", approved: true, edit: "Kept the wheel clip" },
  { id: "story", section: "Your story", approved: true, edit: "Approved as drafted" },
  { id: "process", section: "How it's made", approved: true, edit: "Re-recorded the Salt-fire step" },
  { id: "shop", section: "The shop", approved: true, edit: "Set your prices, chose editorial rows" },
  { id: "studio", section: "The studio", approved: true, edit: "Added your voiceover to the caption" },
  { id: "voice", section: "Closing line", approved: false, optional: true, edit: "Saved for later — you can add it any time" },
];

export const PUBLISH_HANDLE = "kol.world/odd-clay";
export const PUBLISH_MAKER = "Odd Clay Studio";
