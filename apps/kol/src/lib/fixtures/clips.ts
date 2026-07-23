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
  },
  // --- Process ---
  {
    id: "process-centre",
    surface: "process",
    title: "Centre",
    playsOn: "How it's made · step one",
    filmed: false,
    hint: "/media/clay-wheel.jpg",
  },
  {
    id: "process-raise",
    surface: "process",
    title: "Raise",
    playsOn: "How it's made · step two",
    filmed: false,
    hint: "/media/clay-shape.jpg",
  },
  {
    id: "process-salt-fire",
    surface: "process",
    title: "Salt-fire",
    playsOn: "How it's made · step three",
    filmed: true,
    poster: "/media/clay-drying.jpg",
    duration: "0:31",
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
  },
  {
    id: "shop-plates",
    surface: "shop",
    title: "The everyday glaze",
    playsOn: "Everyday Plates · docked in the corner",
    filmed: false,
    hint: "/media/plates.jpg",
  },
  {
    id: "shop-tumblers",
    surface: "shop",
    title: "The morning speckle",
    playsOn: "Morning Tumblers · docked in the corner",
    filmed: false,
    hint: "/media/mono-ceramics.jpg",
  },
  // --- Studio ---
  {
    id: "studio-walk",
    surface: "studio",
    title: "Round the Alfama studio",
    playsOn: "Your story · the studio frame",
    filmed: false,
    hint: "/media/clay-shelf.jpg",
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
  },
];

export function clipsForGroup(surface: ClipSurface): Clip[] {
  return CLIPS.filter((c) => c.surface === surface);
}

export const FILMED_COUNT = CLIPS.filter((c) => c.filmed).length;
export const TO_FILM_COUNT = CLIPS.filter((c) => !c.filmed).length;
