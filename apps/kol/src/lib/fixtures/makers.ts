/**
 * Mock data for the Discovery Feed. SCREENS-ONLY pass — every maker below is
 * SYNTHETIC demo material (names, studios, blurbs authored for the mock), paired
 * with real Unsplash/Pexels stock of real people making real things (see
 * apps/kol/CREDITS.md). Nothing here is a real business; prices, review
 * counts and sales figures are deliberately absent (never fabricated).
 * Exception: Two Dots is a REAL business (real Founder-provided assets, synthetic
 * commerce data) — see apps/kol/CREDITS.md.
 */

export type CraftId =
  | "ceramics"
  | "wood"
  | "textiles"
  | "apothecary"
  | "jewelry"
  | "food"
  | "print"
  | "leather"
  | "metal"
  | "glass"
  | "costume";

export interface Craft {
  id: CraftId;
  label: string;
}

/** Colored grounds a tile or spread can be printed on (see DESIGN.md). */
export type Ground = "ink" | "plum" | "olive" | "clay" | "sky" | "bone";

/** Editorial footprint in the 12-col field — deliberately not uniform. */
export type Span = "hero" | "wide" | "tall" | "portrait" | "square" | "product";

export interface Maker {
  id: string;
  name: string;
  studio: string;
  place: string;
  craft: CraftId;
  /** The one-line craft descriptor shown under the name. */
  discipline: string;
  /** A short editorial line — the maker's voice, not marketing. */
  blurb: string;
  image: string;
  /** film tiles carry a duration + play affordance; photo tiles are stills. */
  kind: "film" | "photo";
  duration?: string;
  span: Span;
  /** Drives scrim + text color: dark imagery takes light type and vice-versa. */
  tone: "dark" | "light";
  values: string[];
  /** Optional colored backing for product stills that sit on a field. */
  ground?: Ground;
  /**
   * Optional real clip at /media/video/<id>.mp4. Set this ONLY once the file
   * exists in public/media/video/ — <MakerFilm> then autoplays it (muted, loop)
   * and falls back to the Ken-Burns still when it's absent, reduced-motion, or
   * errors. Presence is detected from this field, never a runtime fetch. See
   * public/media/video/README.md for the filename → surface map.
   */
  filmSrc?: string;
  /**
   * Playhead (seconds) to seed the hero clip on its first/cold mount, so a
   * portrait clip whose action sits low in frame doesn't open on the empty
   * centre band a full-bleed landscape hero crops to. Only applied once on the
   * persistent film node's first mount (via <MakerFilm initialTime>), so it
   * never fights the feed→world currentTime carry. Omit to open at 0:00.
   */
  filmSeed?: number;
}

export const CRAFTS: Craft[] = [
  { id: "ceramics", label: "Ceramics" },
  { id: "textiles", label: "Textiles" },
  { id: "wood", label: "Wood" },
  { id: "apothecary", label: "Apothecary" },
  { id: "jewelry", label: "Jewellery" },
  { id: "food", label: "Slow Food" },
  { id: "print", label: "Print" },
  { id: "leather", label: "Leather" },
  { id: "metal", label: "Metal" },
  { id: "glass", label: "Glass" },
  { id: "costume", label: "Costumes" },
];

/** The hero — the issue's cover maker, on film. */
export const COVER_MAKER: Maker = {
  id: "odd-clay",
  name: "Lena Okafor",
  studio: "Odd Clay Studio",
  place: "Lagos → Lisbon",
  craft: "ceramics",
  discipline: "Wheel-thrown stoneware",
  blurb:
    "Every pot keeps the pull of the hand that raised it. I throw in the mornings, when the light is still low.",
  image: "/media/clay-wheel.jpg",
  kind: "film",
  duration: "1:12",
  span: "hero",
  tone: "dark",
  values: ["Handmade", "Woman-owned"],
  // LIVE — proof clip (a local Ken-Burns render of the still, stands in until
  // Lena's real footage is dropped at the same path). Drives the cover hero,
  // and the /m/odd-clay world hero + docked PiP.
  filmSrc: "/media/video/odd-clay.mp4",
};

export const MAKERS: Maker[] = [
  {
    id: "grain-groove",
    name: "Tomás Reyes",
    studio: "Grain & Groove",
    place: "Oaxaca, Mexico",
    craft: "wood",
    discipline: "Hand-cut joinery",
    blurb: "No screws, no shortcuts — the wood tells you where it wants to bend.",
    image: "/media/woodwork.jpg",
    kind: "film",
    duration: "0:48",
    span: "wide",
    tone: "dark",
    values: ["Family-run", "Reclaimed timber"],
  },
  {
    id: "marigold-loom",
    name: "Amara Devi",
    studio: "Marigold Loom",
    place: "Jaipur, India",
    craft: "textiles",
    discipline: "Block-print & handloom",
    blurb: "The dye lot is never twice the same. That is the point of it.",
    image: "/media/amara.jpg",
    kind: "photo",
    span: "portrait",
    tone: "dark",
    values: ["Woman-owned", "Natural dye"],
  },
  {
    id: "salt-kiln",
    name: "Íris Halla",
    studio: "Salt Kiln",
    place: "Reykjavík, Iceland",
    craft: "ceramics",
    discipline: "Salt-fired vessels",
    blurb: "Fired with sea salt thrown into the kiln at peak heat — the glaze is weather.",
    image: "/media/salt-ceramics.jpg",
    kind: "photo",
    span: "tall",
    tone: "light",
    values: ["Small-batch"],
    ground: "bone",
  },
  {
    id: "ember-rue",
    name: "Noor Haddad",
    studio: "Ember & Rue",
    place: "Marrakesh, Morocco",
    craft: "apothecary",
    discipline: "Botanical oils",
    blurb: "Distilled in copper, bottled by hand, scented with what grows down the road.",
    image: "/media/apothecary.jpg",
    kind: "film",
    duration: "0:36",
    span: "tall",
    tone: "dark",
    values: ["Plastic-free", "Woman-owned"],
  },
  {
    id: "riverstone-forge",
    name: "Kaito Mori",
    studio: "Riverstone Forge",
    place: "Kyoto, Japan",
    craft: "metal",
    discipline: "Hand-forged kitchen steel",
    blurb: "A knife should outlive the person who buys it. I forge for grandchildren.",
    image: "/media/forge-kaito.jpg",
    kind: "photo",
    span: "portrait",
    tone: "dark",
    values: ["One-of-a-kind"],
  },
  {
    id: "fold",
    name: "Wren Castellano",
    studio: "Fold",
    place: "London, UK",
    craft: "jewelry",
    discipline: "Lost-wax fine jewellery",
    blurb: "Each band is carved in wax first, so it carries a thumbprint before it carries a stone.",
    image: "/media/jewelry.jpg",
    kind: "photo",
    span: "square",
    tone: "dark",
    values: ["Recycled gold"],
    ground: "ink",
  },
  {
    id: "studio-bast",
    name: "Søren Bast",
    studio: "Studio Bast",
    place: "Copenhagen, Denmark",
    craft: "wood",
    discipline: "Steam-bent seating",
    blurb: "I make stools I would trust my grandmother to stand on.",
    image: "/media/stool-blue.jpg",
    kind: "photo",
    span: "product",
    tone: "light",
    values: ["Made-to-order"],
    ground: "sky",
  },
  {
    id: "indigo-ash",
    name: "Sabine Touré",
    studio: "Indigo & Ash",
    place: "Dakar, Senegal",
    craft: "textiles",
    discipline: "Indigo-dyed cloth",
    blurb: "The vat is alive — you feed it, you read its mood, and it dyes back.",
    image: "/media/textiles-rack.jpg",
    kind: "photo",
    span: "wide",
    tone: "dark",
    values: ["Natural dye", "Fair wage"],
  },
  {
    id: "mesa-marin",
    name: "Rosa Marín",
    studio: "Mesa Marín",
    place: "Mexico City, Mexico",
    craft: "food",
    discipline: "Small-batch conservas",
    blurb: "My grandmother's recipes, my market's harvest. Nothing travels far to reach the jar.",
    image: "/media/mesa-rosa.jpg",
    kind: "film",
    duration: "0:52",
    span: "portrait",
    tone: "light",
    values: ["Woman-owned", "Seasonal"],
  },
  {
    id: "risograph-room",
    name: "Juno Park",
    studio: "Risograph Room",
    place: "Seoul, South Korea",
    craft: "print",
    discipline: "Riso & letterpress",
    blurb: "Ink you can feel with a fingertip. Two colours, endless overprint.",
    image: "/media/prints-wall.jpg",
    kind: "photo",
    span: "wide",
    tone: "light",
    values: ["Studio-printed"],
  },
  {
    id: "grainfield",
    name: "Elias Vold",
    studio: "Grainfield",
    place: "Oslo, Norway",
    craft: "print",
    discipline: "Darkroom photography",
    blurb: "Shot on film, printed by hand in the dark. The grain is the whole argument.",
    image: "/media/film-elias.jpg",
    kind: "photo",
    span: "portrait",
    tone: "dark",
    values: ["Archival"],
  },
  {
    id: "fieldnote",
    name: "Jonah Field",
    studio: "Fieldnote Leather",
    place: "Portland, USA",
    craft: "leather",
    discipline: "Vegetable-tanned goods",
    blurb: "Stitched one seat at a time on a machine older than me. It only gets better wet.",
    image: "/media/maker-jonah.jpg",
    kind: "photo",
    span: "square",
    tone: "dark",
    values: ["Repairs for life"],
  },
  {
    id: "nordlys",
    name: "Elin Sæther",
    studio: "Nordlys",
    place: "Tromsø, Norway",
    craft: "apothecary",
    discipline: "Poured tallow candles",
    blurb: "Made through the polar night, for the polar night. Warmth is a craft up here.",
    image: "/media/maker-elin.jpg",
    kind: "photo",
    span: "product",
    tone: "dark",
    values: ["Woman-owned", "Small-batch"],
  },
  {
    id: "table-tide",
    name: "Petra Lund",
    studio: "Table & Tide",
    place: "Bornholm, Denmark",
    craft: "ceramics",
    discipline: "Everyday tableware",
    blurb: "Plates meant to be dropped, chipped, loved, and used every single day.",
    image: "/media/plates.jpg",
    kind: "photo",
    span: "wide",
    tone: "light",
    values: ["Dishwasher-safe", "Made-to-order"],
    ground: "bone",
  },
  {
    id: "mono-ceramics",
    name: "Anaïs Roche",
    studio: "Mono",
    place: "Lyon, France",
    craft: "ceramics",
    discipline: "Matte porcelain",
    blurb: "One shape, refined for six years. Restraint is the hardest thing to throw.",
    image: "/media/mono-ceramics.jpg",
    kind: "photo",
    span: "square",
    tone: "light",
    values: ["Small-batch"],
    ground: "bone",
  },
  {
    // Two Dots — the FIRST real-maker world (real video + photography, Founder-
    // provided). Sharon's children's-costume studio. Name/place are placeholders
    // pending Founder confirmation (real business; do not fabricate specifics).
    id: "two-dots",
    name: "Sharon",
    studio: "Two Dots",
    place: "Israel",
    craft: "costume",
    discipline: "Hand-sewn children's costumes",
    blurb: "A costume isn't clothes — it's permission. For one afternoon they get to be the whole story.",
    image: "/media/twodots/feed-poster.jpg",
    kind: "film",
    duration: "0:24",
    // Portrait (tall) footprint — she is the issue's FEATURED maker, pinned first
    // (see Feed). Her discovery film is a 9:16 talking-head; a portrait tile frames
    // her face head-to-shoulders (a full-width 16/9 hero tile crops a portrait clip
    // to a tight forehead-cut band). Still prominent as the lead, and col-span-5
    // leaves 7 cols so a neighbour tile packs beside it (no orphaned gutter).
    span: "tall",
    tone: "light",
    values: ["Hand-sewn", "Parent & child"],
    // Sharon's talking-head intro (Founder-provided promo, compliant faceless cut
    // — child-face b-roll excluded; see CREDITS). This is the DISCOVERY film: it
    // plays in the feed tile AND carries via the FilmStage into her world, where
    // it docks to the corner as you scroll (Founder: "Sharon video in discovery,
    // shown in the side of the store when scrolling"). The atmospheric hands-on-
    // felt clip (two-dots.mp4) still leads the world wall's "In the studio" tile.
    filmSrc: "/media/video/two-dots-feed.mp4",
    // Seed to 0:06 to match feed-poster.jpg, so the still→video handoff is seamless
    // and the tile opens on her mid-expression rather than a between-words frame.
    filmSeed: 6,
  },
];

/** The color-drenched pull-quote spread (Faire-style founder voice). */
export const FEATURED_QUOTE = {
  quote:
    "People don't want a faceless brand. They want to know whose hands made the thing on their table.",
  attribution: "Amara Devi",
  studio: "Marigold Loom · Jaipur",
  image: "/media/quote-portrait.jpg",
};

/** The Kotn-style impact statement. Counts describe the mock issue only. */
export const ISSUE_STATS = {
  makers: 312,
  countries: 41,
  line: "Every piece in this issue was made by a real human hand — and filmed in the room where it happened.",
};

export const ALL_MAKERS: Maker[] = [COVER_MAKER, ...MAKERS];

/** Look up a maker by id (id doubles as the /m/[slug] route slug). */
export function getMaker(id: string): Maker | undefined {
  return ALL_MAKERS.find((m) => m.id === id);
}
