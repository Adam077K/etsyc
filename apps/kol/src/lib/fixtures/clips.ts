/**
 * FILM LIBRARY mock data (post-publish seller tooling).
 *
 * SCREENS-ONLY, additive. Every clip in Lena Okafor's world (Odd Clay Studio)
 * as a manageable library — the seller-side view of the footage the video engine
 * plays across her buyer surfaces. This makes KOL's video-first thesis tangible
 * for the maker: each clip knows WHERE IT PLAYS, and every un-filmed slot is
 * shown honestly, as an invitation rather than an error.
 *
 * Per concept-lock D5 (one video engine selecting from the maker's real footage
 * by surface + context) + D15 (seller tooling is KOL's fixed chrome): the clip
 * slots below mirror the real surfaces in worlds.ts / commerce.ts. Only the
 * cover film has real footage today (public/media/video/odd-clay.mp4); every
 * other filmed slot falls back to its poster still exactly as the buyer surfaces
 * do, and un-filmed slots carry the honest "not filmed yet" state.
 */

export type ClipSurface = "cover" | "process" | "shop" | "studio" | "after-sale";

export interface ClipGroup {
  id: ClipSurface;
  label: string;
  /** a warm one-liner on what this group of clips does for the maker */
  note: string;
}

export const CLIP_GROUPS: ClipGroup[] = [
  { id: "cover", label: "Your cover", note: "The first thing a buyer meets — on the feed and at the top of your world." },
  { id: "process", label: "How it's made", note: "The steps buyers scroll through. Short is fine — a hand at work says the most." },
  { id: "shop", label: "The shop", note: "The clip the video engine docks into a corner when someone opens a piece." },
  { id: "studio", label: "The studio", note: "Where the work happens. One walk-around is plenty." },
  { id: "after-sale", label: "After a sale", note: "The personal thank-you that plays the moment someone buys." },
];

export interface Clip {
  id: string;
  surface: ClipSurface;
  /** the clip's name, in plain maker language */
  title: string;
  /** where this clip plays, buyer-facing, for the WHERE-IT-PLAYS line */
  playsOn: string;
  /** true once the maker has footage; false slots show the honest empty state */
  filmed: boolean;
  /** poster still for a filmed clip (mirrors the buyer-surface fallback) */
  poster?: string;
  duration?: string;
  /**
   * Real clip source, set ONLY when the file exists in public/media/video/.
   * Today just the cover; everything else falls back to its poster, exactly as
   * the buyer surfaces do. See public/media/video/README.md.
   */
  filmSrc?: string;
  /** for un-filmed slots: the still that hints at what this clip could be */
  hint?: string;
  /**
   * Call-sheet payoff — WHY this shot earns its place, in KOL's warm shopkeeper
   * voice. Connects the maker's effort to what it does for a buyer. Surfaced on
   * un-filmed slots so the queue reads as invitations, never chores.
   */
  why?: string;
  /**
   * Viewfinder framing guidance for the capture ritual — KOL directing the
   * maker like a patient DP ("show us the wheel, not your face"). Warm, concrete,
   * under the honesty bar; mirrors the interview's KOL voice.
   */
  frame?: string;
  /**
   * The rolling-state line — quieter than `frame`: reassurance while the take
   * runs, not fresh direction (the maker's hands are busy). Present-tense, calm,
   * same voice bar. Falls back to a gentle default when unset.
   */
  keepGoing?: string;
}

export const CLIPS: Clip[] = [
  // --- Cover ---
  {
    id: "cover",
    surface: "cover",
    title: "Cover film",
    playsOn: "Your feed tile · the top of your world",
    filmed: true,
    poster: "/media/clay-wheel.jpg",
    duration: "1:12",
    filmSrc: "/media/video/odd-clay.mp4",
    why: "The first frame a buyer meets. It decides whether they stop scrolling for you.",
    frame: "Get in close to the work, not to you — the craft is the cover, not the maker.",
    keepGoing: "Stay on the work. Let it carry the frame.",
  },
  // --- Process ---
  {
    id: "process-centre",
    surface: "process",
    title: "Centre",
    playsOn: "How it's made · step one",
    filmed: false,
    hint: "/media/clay-wheel.jpg",
    why: "The step buyers replay most — the one that turns a browser into a believer.",
    frame: "Get in close and let the wheel fill the frame. We only need your hands and the clay finding its centre — not your face.",
    keepGoing: "That's it — stay low, let the wheel do the talking.",
  },
  {
    id: "process-raise",
    surface: "process",
    title: "Raise",
    playsOn: "How it's made · step two",
    filmed: false,
    hint: "/media/clay-shape.jpg",
    why: "Shows the skill living in your fingers — it's what makes a plain mug feel worth its price.",
    frame: "Rest the phone on the shelf and follow the walls up in one slow pull. Let your hands do the moving, not the camera.",
    keepGoing: "Keep the pull slow. We've got all the time in the world.",
  },
  {
    id: "process-salt-fire",
    surface: "process",
    title: "Salt-fire",
    playsOn: "How it's made · step three",
    filmed: true,
    poster: "/media/clay-drying.jpg",
    duration: "0:31",
    why: "The bit no factory can fake. Buyers feel the risk in it, and trust you more for it.",
    frame: "Catch the moment you open the kiln — the surprise on your face is the shot. A few seconds is plenty.",
    keepGoing: "Let it open in its own time. We're rolling.",
  },
  // --- Shop (contextual product clips) ---
  {
    id: "shop-carafe",
    surface: "shop",
    title: "Lena on the salt-firing",
    playsOn: "Salt-Fired Carafe · docked in the corner",
    filmed: true,
    poster: "/media/salt-ceramics.jpg",
    duration: "0:24",
    why: "Plays beside the buy button on your carafe — your voice is the last thing they hear before they decide.",
    frame: "Hold the carafe and tell one true thing about how it came to be. Talk to the lens like it's a regular at the market.",
    keepGoing: "Just talk to it like a regular. No rush.",
  },
  {
    id: "shop-plates",
    surface: "shop",
    title: "The everyday glaze",
    playsOn: "Everyday Plates · docked in the corner",
    filmed: false,
    hint: "/media/plates.jpg",
    why: "Docks right beside the buy button on your Everyday Plates — the gentle nudge before they add to bag.",
    frame: "Hold one plate up to the light and turn it. Say why you love this glaze the way you'd tell a friend.",
    keepGoing: "Turn it slow in the light. Lovely.",
  },
  {
    id: "shop-tumblers",
    surface: "shop",
    title: "The morning speckle",
    playsOn: "Morning Tumblers · docked in the corner",
    filmed: false,
    hint: "/media/mono-ceramics.jpg",
    why: "Answers the question buyers ask most: what's it actually like to hold in the morning?",
    frame: "Pour a coffee into one and let the speckle catch the light. Ten unhurried seconds, no script.",
    keepGoing: "Let the steam and the speckle do the work.",
  },
  // --- Studio ---
  {
    id: "studio-walk",
    surface: "studio",
    title: "Round the Alfama studio",
    playsOn: "Your story · the studio frame",
    filmed: false,
    hint: "/media/clay-shelf.jpg",
    why: "Where trust is built. Buyers who've seen your studio are the ones who come back.",
    frame: "Walk us in the way you arrive each morning — the south light, the drying shelf, the salt kiln out in the yard.",
    keepGoing: "Wander like it's any morning. We'll follow.",
  },
  // --- After a sale ---
  {
    id: "thank-you",
    surface: "after-sale",
    title: "Your thank-you note",
    playsOn: "Plays for a buyer the moment they order",
    filmed: true,
    poster: "/media/clay-shelf.jpg",
    duration: "0:22",
    why: "The first moment after someone trusts you with an order. It's how a sale becomes a regular.",
    frame: "Look down the lens and say thank you like you mean it — because you do. Short, warm, unrehearsed.",
    keepGoing: "Straight down the lens. Mean it — that's all.",
  },
];

export function clipsForGroup(surface: ClipSurface): Clip[] {
  return CLIPS.filter((c) => c.surface === surface);
}

export const FILMED_COUNT = CLIPS.filter((c) => c.filmed).length;
export const TO_FILM_COUNT = CLIPS.filter((c) => !c.filmed).length;
