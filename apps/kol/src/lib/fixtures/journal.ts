/**
 * The Journal — KOL's editorial magazine. SCREENS-ONLY pass. Every story,
 * byline, pull-quote and dateline below is SYNTHETIC demo material authored for
 * the mock, in the established fixture voice of each maker (see makers.ts).
 * Film stills are real Unsplash/Pexels stock of real people making real things
 * (see public/media/CREDITS.md) standing in for the maker footage that comes
 * later. Nothing here is a real publication; issue counts describe the mock
 * issue only and no real people are depicted as the named makers.
 */

import type { CraftId, Ground } from "./makers";

/** The issue nameplate — the magazine's colophon voice (Geist Mono). */
export const ISSUE = {
  number: "07",
  season: "Summer",
  year: "2026",
  dateline: "ISSUE 07 · SUMMER 2026",
  runningHead: "THE JOURNAL — LONGFORM FROM THE WORKSHOP FLOOR",
  colophon: "312 MAKERS ON FILM · 41 COUNTRIES · PRINTED ON THE WEB",
  wordmark: "The Journal",
  deck: "Longform stories from the people whose hands make the things — printed in bold, shot on film.",
  intro:
    "Between the scroll of the feed, the Journal slows down. One maker, one morning, one craft told at length — the parts a product page can never hold.",
};

/* ------------------------------------------------------------------ */
/* Index entries — the table of contents as a designed editorial object */
/* ------------------------------------------------------------------ */

export type EntryStatus = "published" | "next-issue";

export interface JournalEntry {
  /** /journal/[slug] route slug (also the SSG param) */
  slug: string;
  kicker: string;
  title: string;
  standfirst: string;
  /** ties the story to a real fixture maker → /m/[makerId] */
  makerId: string;
  makerName: string;
  studio: string;
  place: string;
  craft: CraftId;
  /** the entry's headline pull-quote, in the maker's established voice */
  pullQuote: string;
  image: string;
  tone: "dark" | "light";
  /** the color-blocked ground this entry is printed on */
  ground: Ground;
  readTime: string;
  status: EntryStatus;
}

/** The lead feature — the issue's cover story, built in full at its slug. */
export const LEAD_ENTRY: JournalEntry = {
  slug: "the-morning-light",
  kicker: "Lead feature · Ceramics",
  title: "The Low Morning Light",
  standfirst:
    "Before Lisbon wakes, Lena Okafor is already at a wheel her uncle welded out of a bicycle. A morning in the Alfama studio where Odd Clay is thrown, one pot at a time, in a light that never repeats.",
  makerId: "odd-clay",
  makerName: "Lena Okafor",
  studio: "Odd Clay Studio",
  place: "Lisbon",
  craft: "ceramics",
  pullQuote:
    "No two pieces match, because no two mornings do. That is not a flaw I tolerate — it is the whole reason I make.",
  image: "/media/clay-wheel.jpg",
  tone: "dark",
  ground: "clay",
  readTime: "6 min read",
  status: "published",
};

/**
 * The rest of the issue's contents — mixed scale, printed on the underused
 * plum/olive/sky grounds. These stories are honestly marked "In the next
 * issue": the maker is real fixture data (links to their world), the feature
 * itself is still being set.
 */
export const ISSUE_ENTRIES: JournalEntry[] = [
  {
    slug: "the-vat-is-alive",
    kicker: "The dyer · Textiles",
    title: "The Vat Is Alive",
    standfirst:
      "In Dakar, Sabine Touré keeps a forty-year-old indigo vat breathing. She feeds it, reads its mood, and lets it dye back — a colour that is a record of how many times she chose to go back in.",
    makerId: "indigo-ash",
    makerName: "Sabine Touré",
    studio: "Indigo & Ash",
    place: "Dakar",
    craft: "textiles",
    pullQuote:
      "The vat is alive — you feed it, you read its mood, and it dyes back.",
    image: "/media/sabine.jpg",
    tone: "dark",
    ground: "plum",
    readTime: "5 min read",
    status: "next-issue",
  },
  {
    slug: "forged-for-grandchildren",
    kicker: "The smith · Metal",
    title: "Forged for Grandchildren",
    standfirst:
      "In a Kyoto workshop that smells of charcoal and river water, Kaito Mori hammers kitchen steel meant to outlive the person who buys it. A profile of patience, one blade at a time.",
    makerId: "riverstone-forge",
    makerName: "Kaito Mori",
    studio: "Riverstone Forge",
    place: "Kyoto",
    craft: "metal",
    pullQuote:
      "A knife should outlive the person who buys it. I forge for grandchildren.",
    image: "/media/forge-kaito.jpg",
    tone: "dark",
    ground: "ink",
    readTime: "4 min read",
    status: "next-issue",
  },
  {
    slug: "never-twice-the-same",
    kicker: "The weaver · Textiles",
    title: "Never Twice the Same",
    standfirst:
      "Amara Devi block-prints and handlooms in Jaipur, where the dye lot is never twice the same — and that, she insists, is exactly the point of it.",
    makerId: "marigold-loom",
    makerName: "Amara Devi",
    studio: "Marigold Loom",
    place: "Jaipur",
    craft: "textiles",
    pullQuote: "The dye lot is never twice the same. That is the point of it.",
    image: "/media/quote-portrait.jpg",
    tone: "dark",
    ground: "olive",
    readTime: "5 min read",
    status: "next-issue",
  },
];

/**
 * A designed "in the next issue" contents strip — honest, small, mono. Names
 * real fixture makers whose features are still being set; each links to the
 * maker's world so nothing dead-ends.
 */
export const NEXT_ISSUE: {
  makerId: string;
  line: string;
  studio: string;
  craft: string;
}[] = [
  {
    makerId: "grain-groove",
    studio: "Grain & Groove",
    craft: "Wood",
    line: "Tomás Reyes on joinery without a single screw — where the wood tells you where it wants to bend.",
  },
  {
    makerId: "mesa-marin",
    studio: "Mesa Marín",
    craft: "Slow food",
    line: "Rosa Marín on filling the jar from her own market — her grandmother's recipes, nothing travelling far.",
  },
  {
    makerId: "grainfield",
    studio: "Grainfield",
    craft: "Print",
    line: "Elias Vold on why the grain is the whole argument — shot on film, printed by hand in the dark.",
  },
  {
    makerId: "fieldnote",
    studio: "Fieldnote Leather",
    craft: "Leather",
    line: "Jonah Field on a machine older than he is, and goods that only get better wet.",
  },
];

/* ------------------------------------------------------------------ */
/* The one built story — Lena Okafor, in her established fixture voice */
/* ------------------------------------------------------------------ */

/** Inline prose node — a run of text, or an inline link to a product. */
export type Inline =
  | string
  | { productId: string; label: string };

export type StoryBlock =
  | { type: "para"; content: Inline[]; dropCap?: boolean }
  | { type: "subhead"; text: string }
  | { type: "pull"; text: string; feature?: boolean }
  | {
      type: "figure";
      image: string;
      /** describes the image itself — kept distinct from the editorial caption
          so screen readers do not double-announce the same words */
      alt: string;
      caption: string;
      span: "wide" | "full";
    };

export interface JournalStory {
  slug: string;
  /** the maker's world — inline product mentions resolve to /m/[worldSlug]/p/… */
  worldSlug: string;
  kicker: string;
  title: string;
  standfirst: string;
  byline: string;
  dateline: string;
  readTime: string;
  heroImage: string;
  heroAlt: string;
  /** per-story accent — one of the locked grounds, never a new colour */
  accent: Ground;
  blocks: StoryBlock[];
  colophon: {
    words: string;
    fieldNotes: string;
    stills: string;
    typeset: string;
    issue: string;
  };
}

export const STORIES: Record<string, JournalStory> = {
  "the-morning-light": {
    slug: "the-morning-light",
    worldSlug: "odd-clay",
    kicker: "Issue 07 · Lead feature · Ceramics",
    title: "The Low Morning Light",
    standfirst:
      "Before Lisbon wakes, Lena Okafor is already at a wheel her uncle welded out of a bicycle. A morning in the Alfama studio where Odd Clay is thrown — one pot at a time, in a light that never repeats.",
    byline: "Words by Lena Okafor, as told to KOL",
    dateline: "Odd Clay Studio · Alfama, Lisbon",
    readTime: "6 min read",
    heroImage: "/media/clay-wheel.jpg",
    heroAlt:
      "Hands raising the wall of a pot on a potter's wheel in low morning light",
    accent: "clay",
    blocks: [
      {
        type: "para",
        dropCap: true,
        content: [
          "The first thing I do in the morning is not touch the clay. I open the shutter, and I wait for the light. In Alfama the sun comes up over the river and moves across the studio wall like it is looking for something. I have learned to throw in the twenty minutes before it finds me — when the room is still cool and my hands are still honest. By the time the light is high and flat, the day belongs to everyone else. The morning belongs to the pots.",
        ],
      },
      {
        type: "para",
        content: [
          "People think a pottery studio is a quiet place. Mine is not. There is the river, the gulls, a neighbour who sings badly and early, and the wheel, which has its own voice. I like all of it. Silence would make me self-conscious. I want the room loud enough that I forget I am being watched — even by myself.",
        ],
      },
      { type: "subhead", text: "A wheel from a bicycle" },
      {
        type: "para",
        content: [
          "I learned to throw in my mother's yard in Lagos. My uncle was a welder, and the year I turned nine he built me a wheel out of an old bicycle — the back frame, the chain, a flywheel he balanced by eye and a kick-bar worn smooth by his thumb. It wobbled from the first day. It still wobbles. When I moved to Lisbon I packed almost nothing, but I crated that wheel and paid more to ship it than it would cost to buy three new ones.",
        ],
      },
      {
        type: "para",
        content: [
          "People ask why I don't buy a proper wheel now. I tell them the wobble is in my hands by now; a perfectly true wheel would feel like shaking a stranger's hand. Everything I make carries a little of that bicycle — a faint rhythm in the wall of a pot that a machine would iron flat. My mother sold food at the market, and she used to say you can tell a person by what they keep and what they let go of. I keep the wheel. I have let go of almost everything else — matching sets, perfect rims, the idea that two things should ever be the same.",
        ],
      },
      {
        type: "pull",
        feature: true,
        text: "No two pieces match, because no two mornings do. That is not a flaw I tolerate. It is the whole reason I make.",
      },
      {
        type: "figure",
        image: "/media/clay-shape.jpg",
        alt: "A potter's hands drawing up the wall of a vessel on a spinning wheel.",
        caption: "Raising the wall in three slow pulls, a little after six.",
        span: "wide",
      },
      { type: "subhead", text: "Centre, and then let go" },
      {
        type: "para",
        content: [
          "Every pot begins with a fight. You throw the clay down and you make it sit dead in the centre of the wheel, and if you get that wrong nothing that follows can be saved. It is the least romantic part and the most important. My teacher in Lagos used to hold my wrists until they stopped shaking. Now I hold my own. Centring is not strength — it is the opposite. The harder you grip, the more the clay fights you. You have to be firm and completely calm at the same time, which is a thing I am still learning off the wheel as well as on it.",
        ],
      },
      {
        type: "para",
        content: [
          "Then the walls come up, three slow pulls, and somewhere in the second pull the form decides what it wants to be. I have opinions. The clay has more. The ",
          { productId: "tumblers", label: "Morning Tumblers" },
          " started as a bowl I could not make behave — it kept drawing itself narrow and tall until I stopped arguing and let it become a cup you hold in two hands. That is how most of my work arrives. I am less the author than the first person to agree with it.",
        ],
      },
      { type: "subhead", text: "Weather, written on a pot" },
      {
        type: "para",
        content: [
          "I bisque, I glaze, and then I salt-fire — sea salt thrown into the kiln at the very peak of the heat. The salt turns to vapour and the vapour writes the surface: an orange-peel skin, a blush where two pots stood close, a run of colour I could never paint on by hand. I only get a vote. The ",
          { productId: "carafe", label: "Salt-Fired Carafe" },
          " comes out of that fire different every single time, so the one you see on the shelf is the one you will hold. I stopped trying to control the kiln years ago, and my work got better the same week I did.",
        ],
      },
      {
        type: "pull",
        text: "The kiln is a weather system I built and cannot command. I load it like a prayer and open it like a letter.",
      },
      {
        type: "figure",
        image: "/media/clay-drying.jpg",
        alt: "Rows of freshly fired stoneware pots cooling on a wooden studio shelf.",
        caption: "Just out of the salt kiln — the glaze still warm to the hand.",
        span: "full",
      },
      { type: "subhead", text: "Made to be used, made to be dropped" },
      {
        type: "para",
        content: [
          "I do not make things for a cabinet. I make plates you eat off every day. The ",
          { productId: "plates", label: "Everyday Plates" },
          " come four to a set and no two are the same size — people ask me to fix that, and I never will. A family is not a factory line. Glaze them for real life, I tell the kiln: chip them, stack them, run them through the dishwasher, love them until they crack. Then send them back to me and I will mend them. I offer repairs for life because a pot that gets used is a pot that eventually breaks, and I would rather it break in your kitchen than sit safe on a shelf, untouched, being nothing.",
        ],
      },
      {
        type: "para",
        content: [
          "There is a Japanese idea for all of this that people love to quote at me, and it is beautiful, but I did not learn it from a book. I learned it from my mother's kitchen, where every good thing had a chip in it because every good thing got used. A perfect object is an object nobody trusts. I want you to trust mine enough to be careless with them.",
        ],
      },
      {
        type: "para",
        content: [
          "So this is the morning. The shutter, the wait for the light, the wobbling wheel, the fight to centre, the three pulls, the salt, the fire I do not control. By nine the sun is high and the pots are drying on the shelf, each one holding the exact shape of the hand that raised it. If one of them ends up on your table and stays there for thirty years — chipped, mended, poured from every morning — then I have done my job. That is the only measure I keep.",
        ],
      },
    ],
    colophon: {
      words: "Lena Okafor, as told to KOL",
      fieldNotes: "KOL Editorial",
      stills: "Demo footage — real maker film coming soon",
      typeset: "Bricolage Grotesque · Young Serif · Hanken Grotesk",
      issue: "Issue 07 · Summer 2026",
    },
  },
};

/** All published story slugs — drives generateStaticParams for /journal/[slug]. */
export const STORY_SLUGS: string[] = Object.keys(STORIES);

export function getStory(slug: string): JournalStory | undefined {
  return STORIES[slug];
}

/** Every entry that resolves to a real built story (for index → story links). */
export function isPublished(slug: string): boolean {
  return slug in STORIES;
}
