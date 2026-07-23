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

/**
 * A single tile in a world's optional "wall" — a dense, editorial masonry of the
 * maker's own room (images + woven films). OPTIONAL per world: only a maker with
 * a deep real-media library (currently Two Dots) fills one, which is exactly why
 * her world reads as the most obviously-hers in the build. A tile is a film when
 * `filmSrc` is set (played muted/looped via <MakerFilm>), otherwise a still.
 * `ratio` is the tile's own aspect (Tailwind aspect-* value) so the wall packs
 * with real editorial variety, never a uniform grid.
 */
export interface WorldWallItem {
  src: string;
  /** optional real clip; when set the tile is a muted, looped film (src = poster). */
  filmSrc?: string;
  alt: string;
  /** the tile's aspect ratio — drives the masonry rhythm. */
  ratio: "square" | "portrait" | "tall" | "landscape" | "video";
  /** optional overlaid label, in the maker's register. */
  caption?: string;
}

export interface MakerWorld {
  /** maker id (also the route slug) */
  slug: string;
  /** per-maker accent — one of the locked grounds, never a new colour */
  accent: Ground;
  /**
   * Optional override for the persistent hero film. Defaults to the maker's
   * feed image; set only when a world should open on a different frame than its
   * feed tile (e.g. Risograph Room leads on the ink-in-motion action register
   * rather than a static finished-print wall, PRODUCT.md Principle 1/3).
   */
  heroFilm?: string;
  /** the world's opening line, in the maker's voice */
  tagline: string;
  /** 2-3 short paragraphs — the maker's own story */
  story: string[];
  storyImage: string;
  /**
   * Optional accurate alt for storyImage. Set it when the still is NOT a
   * portrait of the maker (the maker-world default alt names the person); an
   * object/scene still needs its own description. Falls back to name + studio.
   */
  storyImageAlt?: string;
  /** section headers authored per-maker, in their own voice (no flattening) */
  processSectionHeader: string;
  process: WorldProcessStep[];
  /** OPTIONAL dense gallery wall — the maker's whole room, images + woven films.
      Present only for makers with a deep real-media library (Two Dots). */
  wallSectionHeader?: string;
  wallSectionKicker?: string;
  wall?: WorldWallItem[];
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
        image: "/media/wood-joint.jpg",
      },
    ],
    products: [
      {
        id: "field-stool",
        name: "The Field Stool",
        price: "£145",
        blurb: "Three legs, wedged and tenoned by hand. Stand on it, stack it, hand it down.",
        image: "/media/wood-stool.jpg",
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
    storyImageAlt: "Hand-glazed stoneware bottles for decanting botanical oils, sealed with wax",
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
    // Leads on the ink-in-motion action register, not the static finished-print
    // wall (that stays the feed tile + studio shot). PRODUCT.md Principle 1/3.
    heroFilm: "/media/riso-ink.jpg",
    tagline: "Wet ink on the left drum, a clean sheet on the right — let's find out what today's overlap wants to be.",
    story: [
      "I fell for riso because it refuses to behave. You split a picture into two colours, print one over the other, and the machine shifts everything half a millimetre — so the overlap glows in a third colour you didn't ask for and couldn't mix if you tried.",
      "Every print goes through the drum by hand, one colour at a time. The ink sits on top of the paper instead of soaking in, so you can feel it with a fingertip — a little raised, a little imperfect, unmistakably printed by a person and not a laser.",
      "Two inks, cotton paper, a hand-cranked letterpress for the type. That's the whole studio. The limits are the fun — I've made more with two colours than I ever did with a full-colour printer.",
    ],
    storyImage: "/media/riso-overprint.jpg",
    storyImageAlt: "A two-colour risograph overprint, the misregistered inks glowing a third colour",
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
        image: "/media/riso-ink.jpg",
      },
    ],
    products: [
      {
        id: "overprint-07",
        name: "Overprint Study · No. 07",
        price: "£34",
        blurb: "Two inks, one happy collision — a fluoro pink and a blue that make a third colour where they cross.",
        image: "/media/riso-overprint.jpg",
        note: "Edition of 40",
      },
      {
        id: "ink-field",
        name: "Ink Field · Riso Print",
        price: "£30",
        blurb: "A single flood of riso blue, run through the drum until the texture does all the talking.",
        image: "/media/riso-ink.jpg",
        note: "Edition of 30",
      },
    ],
    shopSectionHeader: "Printed by hand, two colours at a time.",
    studioImage: "/media/prints-wall.jpg",
    studioCaption: "The drying wall — Euljiro, Seoul",
    voice: "A print you can feel with your eyes shut is worth ten you scroll past. — Juno",
  },
  "two-dots": {
    slug: "two-dots",
    // Clay — stage-red / theatrical curtain register; the truest fit for a
    // dress-up costume world and keeps cross-world differentiation load-bearing
    // (plum stays sole to Grain & Groove). CEO-approved reassignment.
    accent: "clay",
    tagline: "Pick anyone you like. I'll sew you into them by the weekend.",
    story: [
      "I started making costumes because my own kids kept asking to be things the shops didn't sell. A specific dragon. A very specific swan. So I learned to sew the exact one in their head, not the nearest one on a shelf.",
      "Everything here is cut and stitched by hand, in a small room that is always covered in felt. Parents come and make alongside me — that's half the point. The child leaves wearing something, and the grown-up leaves having made it.",
      "I care most about the five seconds after they put it on, when they stop being shy and start being the thing. You can't buy that off a rack. You have to sew it in.",
    ],
    storyImage: "/media/twodots/workshop.jpg",
    storyImageAlt: "Two makers at sewing machines in the Two Dots studio, fabric in hand",
    processSectionHeader: "Made the slow way, on purpose.",
    process: [
      {
        id: "gather",
        label: "01",
        title: "A pile of nothing",
        body: "Every costume starts as offcuts, felt, and a child's very firm opinion about exactly which animal they are this month. No pattern survives first contact with a four-year-old.",
        image: "/media/twodots/materials.jpg",
      },
      {
        id: "sew",
        label: "02",
        title: "Cut and sewn here, by hand",
        body: "It's all made in the room, often with the parent at the next machine. Real seams, real hems — built to be run in, sat in, and slept in if it comes to that.",
        image: "/media/twodots/workshop.jpg",
      },
      {
        id: "become",
        label: "03",
        title: "Then they disappear into it",
        body: "The last step isn't mine. It's the moment they turn around in the mirror and the shy kid is gone and the dragon is standing there instead.",
        image: "/media/twodots/butterfly-back.jpg",
      },
    ],
    wallSectionKicker: "The whole room",
    wallSectionHeader: "This is the studio — pinned to the wall.",
    // Two Dots' real-media library is deep enough to fill a wall: her hero clip,
    // the wings-that-spin film, and the felt, materials, quilting and printed
    // pieces around them. Every asset is Founder-provided and CREDITS-cleared;
    // no identifiable child face appears (the flagged workshop.jpg is kept OUT of
    // the wall on purpose). This is what makes her world unmistakably hers.
    wall: [
      {
        src: "/media/twodots/hero-poster.jpg",
        filmSrc: "/media/video/two-dots.mp4",
        alt: "Sharon's hands making a small felt craft, filmed top-down in the studio",
        ratio: "video",
        caption: "In the studio, on film",
      },
      {
        src: "/media/twodots/felt.jpg",
        alt: "The felt drawer — butterfly, cactus, panda and other felt characters laid out",
        ratio: "portrait",
        caption: "The felt drawer",
      },
      {
        src: "/media/twodots/materials.jpg",
        alt: "Beads, denim, fabric, scissors and yarn laid out ready to cut",
        ratio: "landscape",
      },
      {
        src: "/media/twodots/butterfly-back.jpg",
        filmSrc: "/media/video/product-butterfly-wings.mp4",
        alt: "A child, hooded so no face shows, spinning to lift handmade felt butterfly wings",
        ratio: "tall",
        caption: "Wings that spin",
      },
      {
        src: "/media/twodots/quilt.jpg",
        alt: "Patchwork-quilt detail — eyelet lace, tartan and floral cotton with a dusty-rose binding",
        ratio: "square",
      },
      {
        src: "/media/twodots/tote.jpg",
        alt: "A hand-printed cat-face cotton drawstring bag",
        ratio: "portrait",
        caption: "Studio-printed by the kids",
      },
      {
        src: "/media/twodots/devil-back.jpg",
        alt: "The little-devil costume seen from behind — felt wings and a tutu",
        ratio: "tall",
      },
    ],
    shopSectionHeader: "A few to become.",
    products: [
      {
        id: "butterfly-wings",
        name: "Butterfly Wings",
        price: "£58",
        blurb: "Felt wings on a hidden harness, cut so they lift when she spins. Made to be spun in.",
        image: "/media/twodots/butterfly-back.jpg",
        note: "Made to measure",
      },
      {
        id: "little-devil",
        name: "The Little Devil",
        price: "£64",
        blurb: "Soft felt horns, a tulle skirt with real body, and a trident that's all foam — mischief, no sharp edges.",
        image: "/media/twodots/devil-back.jpg",
        note: "Made to measure",
      },
      {
        id: "cat-tote",
        name: "The Cat Tote",
        price: "£18",
        blurb: "A cotton drawstring bag, every little cat face hand-printed by a kid in the studio. No two the same.",
        image: "/media/twodots/tote.jpg",
        note: "Studio-printed",
      },
      {
        id: "costume-workshop",
        name: "Parent & Child Workshop",
        price: "£45",
        blurb: "Two hours, two people, one costume you make together and take home the same day.",
        image: "/media/twodots/materials.jpg",
        note: "Per pair · booked by date",
      },
    ],
    studioImage: "/media/twodots/felt.jpg",
    studioCaption: "The felt drawer — Two Dots studio",
    voice: "The shops sell what a child should want. I make the one they already dreamed up. — Sharon",
  },
};

export function getWorld(slug: string): MakerWorld | undefined {
  return WORLDS[slug];
}

export const WORLD_SLUGS = Object.keys(WORLDS);
