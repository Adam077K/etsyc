/**
 * Per-maker WORLD data for the maker-world route (/m/[slug]).
 * SCREENS-ONLY, all synthetic demo content paired with verified stock (see
 * public/media/CREDITS.md). Prices are demo figures for the mock storefront,
 * not real commercial claims.
 *
 * Per concept-lock D15 + DESIGN.md: KOL's own UI keeps the fixed system. Maker
 * personality expresses through IMAGERY, an ACCENT tint drawn from the locked
 * palette, and COPY VOICE — never by breaking palette or type. Worlds are built
 * so personalization is provable across distinct makers and grounds: Odd Clay
 * (warm, clay), Indigo & Ash (cool, sky), Grain & Groove (deep, plum), Ember &
 * Rue (herbaceous, olive), Risograph Room (paper-bright, bone). Each voice is
 * authored to read as a different human (concept-lock D15).
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
  "grain-groove": {
    slug: "grain-groove",
    accent: "plum",
    tagline: "Mind the sawdust — everything in here took longer than it should have. On purpose.",
    story: [
      "My grandfather built church pews that are still standing. He never wrote a measurement down; the joints were the drawing. I learned the same way — by ruining enough boards that my hands finally stopped arguing with the grain.",
      "Everything here is cut by hand and held together by the wood itself. No screws, no nails, no filler smeared over a bad cut. When a joint comes out wrong I burn the board. Twenty years of that has kept me honest.",
      "The timber is all reclaimed — beams pulled from houses older than me, here in Oaxaca. Wood that already proved it can hold a roof up. I just give it a second argument to win.",
    ],
    storyImage: "/media/maker-soren.jpg",
    processSectionHeader: "The wood gets the last word.",
    process: [
      {
        id: "read",
        label: "01",
        title: "Read the board",
        body: "I don't cut until I know which way the grain wants to run. Fight it and it splits on you inside a year. Follow it and it holds for a lifetime.",
        image: "/media/woodwork.jpg",
      },
      {
        id: "joint",
        label: "02",
        title: "One clean joint",
        body: "Everything locks together with hand-cut joinery — no screws to work loose, no glue doing the real job. If it wobbles on my floor, it never sees yours.",
        image: "/media/stool-blue.jpg",
      },
    ],
    products: [
      {
        id: "field-stool",
        name: "The Field Stool",
        price: "£145",
        blurb: "Three legs, wedged and tenoned by hand. Stand on it, stack it, hand it down.",
        image: "/media/stool-blue.jpg",
        note: "Made to order",
      },
      {
        id: "butterfly-board",
        name: "Butterfly Board",
        price: "£68",
        blurb: "A serving board joined with walnut butterfly keys — the repair that became the whole point.",
        image: "/media/woodwork.jpg",
        note: "1 of a kind",
      },
    ],
    shopSectionHeader: "Made to be handed down.",
    studioImage: "/media/woodwork.jpg",
    studioCaption: "The bench, under the tin roof — Oaxaca",
    voice: "A chair should outlast the argument about who gets to sit in it. — Tomás",
  },
  "ember-rue": {
    slug: "ember-rue",
    accent: "olive",
    tagline: "Lean in — everything in this room is trying to tell you where it grew.",
    story: [
      "I can walk you through my week by smell. Monday is neroli, sharp and green off the bitter-orange trees. By Friday it has softened into something you'd wear to dinner. I bottle it the exact hour it turns right.",
      "Nothing synthetic comes through the door. I distil in a copper still my father soldered, in batches small enough that I can smell when one goes wrong. Three drops of oil for an armful of petals — that is the honest exchange, and I won't cheat it.",
      "Everything is decanted by hand into glazed stoneware, sealed with wax, and labelled with the day it was made. Plastic never touches it. Neither does a hurry.",
    ],
    storyImage: "/media/salt-ceramics.jpg",
    processSectionHeader: "I work by nose, not by clock.",
    process: [
      {
        id: "draw",
        label: "01",
        title: "Draw it off by hand",
        body: "Every oil is drawn and blended a few millilitres at a time — by pipette, by nose. No blend leaves this bench until I've worn it on my own wrist for a full day and it hasn't turned on me by midnight.",
        image: "/media/apothecary.jpg",
      },
      {
        id: "seal",
        label: "02",
        title: "Bottle & seal",
        body: "It's decanted into glazed stoneware, waxed, and dated. Stone keeps the light out and the scent in far better than the clear glass everyone expects — so the last drop smells like the first.",
        image: "/media/salt-ceramics.jpg",
      },
    ],
    products: [
      {
        id: "neroli-cedar",
        name: "Neroli & Cedar Oil",
        price: "£46",
        blurb: "Bitter-orange blossom cut with Atlas cedar — bright at noon, warm by midnight.",
        image: "/media/apothecary.jpg",
        note: "Distilled to order",
      },
      {
        id: "rose-absolute",
        name: "Sealed Vessel · Rose Absolute",
        price: "£58",
        blurb: "Damask rose, kept in glazed stoneware the way it wants to be kept — dark, sealed, patient.",
        image: "/media/salt-ceramics.jpg",
        note: "1 of a batch",
      },
    ],
    shopSectionHeader: "Small bottles, long afternoons.",
    studioImage: "/media/apothecary.jpg",
    studioCaption: "The distilling bench — the Mellah, Marrakesh",
    voice: "A scent should follow you out the door and still be arguing with you at midnight. — Noor",
  },
  "risograph-room": {
    slug: "risograph-room",
    accent: "bone",
    tagline: "Come in — mind the wet ink. Everything here is a hair out of register, and that's the good part.",
    story: [
      "I fell for riso because it refuses to behave. You split a picture into two colours, print one over the other, and the machine shifts everything half a millimetre — so the overlap glows in a third colour you didn't ask for and couldn't mix if you tried.",
      "Every print goes through the drum by hand, one colour at a time. The ink sits on top of the paper instead of soaking in, so you can feel it with a fingertip — a little raised, a little imperfect, unmistakably printed by a person and not a laser.",
      "Two inks, cotton paper, a hand-cranked letterpress for the type. That's the whole studio. The limits are the fun — I've made more with two colours than I ever did with a full-colour printer.",
    ],
    storyImage: "/media/indigo-dye.jpg",
    processSectionHeader: "Two inks. A hundred happy accidents.",
    process: [
      {
        id: "wall",
        label: "01",
        title: "The wall decides",
        body: "Nothing leaves until it's pinned to this wall for a week. If a print still stops me on the way to the kettle, it's good. If I walk straight past it, it goes back in the ink-test pile.",
        image: "/media/prints-wall.jpg",
      },
      {
        id: "feel",
        label: "02",
        title: "Ink you can feel",
        body: "Riso ink sits on top of the paper, never in it. Run a fingertip across a fresh print and you feel the colour — raised, tacky-bright, a little uneven. That texture is the entire point.",
        image: "/media/indigo-dye.jpg",
      },
    ],
    products: [
      {
        id: "overprint-07",
        name: "Overprint Study · No. 07",
        price: "£34",
        blurb: "Two inks, one happy collision — a fluoro pink and a blue that make a third colour where they cross.",
        image: "/media/prints-wall.jpg",
        note: "Edition of 40",
      },
      {
        id: "ink-field",
        name: "Ink Field · Riso Print",
        price: "£30",
        blurb: "A single flood of riso blue, run through the drum until the texture does all the talking.",
        image: "/media/indigo-dye.jpg",
        note: "Edition of 30",
      },
    ],
    shopSectionHeader: "Printed by hand, two colours at a time.",
    studioImage: "/media/prints-wall.jpg",
    studioCaption: "The drying wall — Euljiro, Seoul",
    voice: "A print you can feel with your eyes shut is worth ten you scroll past. — Juno",
  },
};

export function getWorld(slug: string): MakerWorld | undefined {
  return WORLDS[slug];
}

export const WORLD_SLUGS = Object.keys(WORLDS);
