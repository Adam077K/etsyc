/**
 * Mock data for the Discovery Feed. SCREENS-ONLY pass — every maker below is
 * SYNTHETIC demo material (names, studios, blurbs authored for the mock), paired
 * with real Unsplash/Pexels stock of real people making real things (see
 * public/media/CREDITS.md). Nothing here is a real business; prices, review
 * counts and sales figures are deliberately absent (never fabricated).
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
  | "glass";

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
    span: "square",
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
    span: "product",
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
