/**
 * Per-maker WORLD data for the maker-world route (/m/[slug]).
 * SCREENS-ONLY, all synthetic demo content paired with verified stock (see
 * public/media/CREDITS.md). Prices are demo figures for the mock storefront,
 * not real commercial claims.
 *
 * Per concept-lock D15 + DESIGN.md: KOL's own UI keeps the fixed system. Maker
 * personality expresses through IMAGERY, an ACCENT tint drawn from the locked
 * palette, and COPY VOICE — never by breaking palette or type. Two worlds are
 * built so personalization is provable: Odd Clay (warm, clay accent) vs
 * Indigo & Ash (cool, sky accent).
 */

import type { Ground } from "./makers";

export interface WorldProduct {
  id: string;
  name: string;
  price: string;
  blurb: string;
  image: string;
  note?: string;
}

export interface WorldProcessStep {
  id: string;
  label: string;
  title: string;
  body: string;
  image: string;
}

export interface MakerWorld {
  /** maker id (also the route slug) */
  slug: string;
  /** per-maker accent — one of the locked grounds, never a new colour */
  accent: Ground;
  /** the world's opening line, in the maker's voice */
  tagline: string;
  /** 2-3 short paragraphs — the maker's own story */
  story: string[];
  storyImage: string;
  /** section headers authored per-maker, in their own voice (no flattening) */
  processSectionHeader: string;
  process: WorldProcessStep[];
  shopSectionHeader: string;
  products: WorldProduct[];
  studioImage: string;
  studioCaption: string;
  /** a closing line from the maker */
  voice: string;
}

export const WORLDS: Record<string, MakerWorld> = {
  "odd-clay": {
    slug: "odd-clay",
    accent: "clay",
    tagline: "Come in — the wheel is still turning.",
    story: [
      "I learned to throw in my mother's yard in Lagos, on a wheel my uncle welded from a bicycle. When I moved to Lisbon I brought the wheel with me. It still wobbles. I still keep it.",
      "Everything here is thrown by hand, one at a time, in the low morning light. No two pieces match, because no two mornings do. That is not a flaw I tolerate — it is the whole reason I make.",
    ],
    storyImage: "/media/clay-shape.jpg",
    processSectionHeader: "Nothing here is rushed.",
    process: [
      {
        id: "center",
        label: "01",
        title: "Center",
        body: "Every pot begins with a fight to get the clay dead-centre. Get this wrong and nothing that follows can be saved.",
        image: "/media/clay-wheel.jpg",
      },
      {
        id: "raise",
        label: "02",
        title: "Raise",
        body: "The walls come up in three slow pulls. You can feel the moment the form decides what it wants to be.",
        image: "/media/clay-shape.jpg",
      },
      {
        id: "fire",
        label: "03",
        title: "Salt-fire",
        body: "Bisque, glaze, then sea salt thrown into the kiln at peak heat. The vapour writes the surface — I only get a vote.",
        image: "/media/clay-drying.jpg",
      },
    ],
    products: [
      {
        id: "carafe",
        name: "Salt-Fired Carafe",
        price: "£52",
        blurb: "A one-litre carafe with a thumb-rest where my hand rested throwing it.",
        image: "/media/salt-ceramics.jpg",
        note: "1 of a kind",
      },
      {
        id: "plates",
        name: "Everyday Plates",
        price: "£96",
        blurb: "Set of four, meant to be chipped and loved. Dishwasher-safe, honestly.",
        image: "/media/plates.jpg",
        note: "Set of 4",
      },
      {
        id: "tumblers",
        name: "Morning Tumblers",
        price: "£64",
        blurb: "Speckled porcelain, sized for the first coffee of the day.",
        image: "/media/mono-ceramics.jpg",
        note: "Set of 4",
      },
    ],
    shopSectionHeader: "A few pieces, made to keep.",
    studioImage: "/media/clay-shelf.jpg",
    studioCaption: "The drying shelf, Alfama studio — Lisbon",
    voice: "If a pot ends up on your table for thirty years, I have done my job. — Lena",
  },
  "indigo-ash": {
    slug: "indigo-ash",
    accent: "sky",
    tagline: "Feel the cloth before you meet the colour.",
    story: [
      "Indigo is alive. You feed the vat, you read its mood, and on a good day it gives back a blue nothing else can touch. My grandmother kept a vat for forty years. I am keeping hers going.",
      "Each length is dipped by hand, again and again, oxidising blue between every dip. The depth you see is the number of times I chose to go back in.",
    ],
    storyImage: "/media/sabine.jpg",
    processSectionHeader: "The vat sets the pace.",
    process: [
      {
        id: "ferment",
        label: "01",
        title: "Ferment the vat",
        body: "Indigo, wood ash, a week of patience. The vat has to be coaxed alive before a single thread goes in.",
        image: "/media/indigo-dye.jpg",
      },
      {
        id: "finish",
        label: "02",
        title: "Cut & finish by hand",
        body: "Every hem is turned and stitched on a machine older than me. It softens with every wash and never lets go of the blue.",
        image: "/media/textile-machine.jpg",
      },
    ],
    products: [
      {
        id: "length",
        name: "Indigo Length · 2m",
        price: "£120",
        blurb: "Two metres of hand-dipped cotton — for the tailor who already knows what they want.",
        image: "/media/textile-fold.jpg",
        note: "Dye-lot unique",
      },
      {
        id: "wrap",
        name: "The Everyday Wrap",
        price: "£85",
        blurb: "Light enough for a Dakar afternoon, deep enough for a London winter.",
        image: "/media/textile-scarf.jpg",
        note: "Made to order",
      },
    ],
    shopSectionHeader: "Cloth worth the wait.",
    studioImage: "/media/indigo-dye.jpg",
    studioCaption: "The living vat — Médina, Dakar",
    voice: "The blue remembers every hand that made it. — Sabine",
  },
};

export function getWorld(slug: string): MakerWorld | undefined {
  return WORLDS[slug];
}

export const WORLD_SLUGS = Object.keys(WORLDS);
