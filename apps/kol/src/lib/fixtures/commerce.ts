/**
 * Commerce fixtures for Arc 2 (product / checkout / thank-you). SCREENS-ONLY,
 * all synthetic demo content. Prices are demo store figures; the card form is a
 * visibly-fake mock (no real payment, no real brand). Stock imagery reused from
 * the maker worlds (see public/media/CREDITS.md).
 */

import { WORLDS } from "./worlds";
import { getMaker, type Maker } from "./makers";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  author: string;
  place: string;
  /** verified-purchase — a trust cue, never a star rating (no deal-grid clutter) */
  verified: boolean;
  /** the review as a short story, in the buyer's own words */
  body: string;
  /** confirms the piece matched what was promised (D16-5 expectation-accuracy) */
  asExpected: boolean;
}

export interface ProductDetail {
  id: string;
  worldSlug: string;
  name: string;
  price: string;
  priceValue: number;
  note?: string;
  /** the docked film's contextual narration clip for THIS product (journey 5) */
  clipLabel: string;
  clipDuration: string;
  /**
   * Optional real contextual clip at /media/video/product-<id>.mp4 for the
   * docked PiP. Set once the file exists; falls back to the still otherwise.
   * See public/media/video/README.md.
   */
  filmSrc?: string;
  gallery: string[];
  /** description in the maker's voice */
  description: string[];
  /** "Exactly what to expect" — the required structured info standard (D16-4) */
  specs: ProductSpec[];
  reviews: Review[];
}

export const PRODUCT_DETAILS: Record<string, ProductDetail> = {
  carafe: {
    id: "carafe",
    worldSlug: "odd-clay",
    name: "Salt-Fired Carafe",
    price: "£52",
    priceValue: 52,
    note: "1 of a kind",
    clipLabel: "Lena on the salt-firing",
    clipDuration: "0:24",
    gallery: ["/media/salt-ceramics.jpg", "/media/clay-shape.jpg", "/media/clay-shelf.jpg"],
    description: [
      "This is the carafe I reach for first. One litre, thrown in a single pull, with a thumb-rest worn in exactly where my hand sat raising it.",
      "The surface is written by the kiln — sea salt thrown in at peak heat vaporises and settles as an orange-peel glaze. No two are alike, so the one you see is the one you get.",
    ],
    specs: [
      { label: "Holds", value: "1 litre" },
      { label: "Dimensions", value: "22cm tall · 11cm base" },
      { label: "Material", value: "Salt-fired stoneware, food-safe glaze" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Hand-wash; not for the dishwasher" },
      { label: "Returns", value: "30 days · repairs offered for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Marianne T.",
        place: "Porto",
        verified: true,
        asExpected: true,
        body: "It arrived wrapped in newspaper with a handwritten note. The glaze is even more alive in person — it catches the morning light on my table. I use it every single day.",
      },
      {
        id: "r2",
        author: "Devin O.",
        place: "Brooklyn",
        verified: true,
        asExpected: true,
        body: "Bought it after watching Lena's film. Knowing whose hands made it changes how it feels to pour from. Heavier and more solid than I expected, in the best way.",
      },
    ],
  },
  plates: {
    id: "plates",
    worldSlug: "odd-clay",
    name: "Everyday Plates",
    price: "£96",
    priceValue: 96,
    note: "Set of 4",
    clipLabel: "Lena on daily-use glaze",
    clipDuration: "0:19",
    gallery: ["/media/plates.jpg", "/media/clay-drying.jpg", "/media/clay-shelf.jpg"],
    description: [
      "A set of four, no two the same size — that is deliberate. Plates should feel like a family, not a factory line.",
      "Glazed for real life: chip them, stack them, run them through the dishwasher. They only look better with a few honest marks.",
    ],
    specs: [
      { label: "Set", value: "4 plates, 21–23cm" },
      { label: "Material", value: "Stoneware, reactive glaze" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Dishwasher-safe" },
      { label: "Variation", value: "Sizes and tone vary by piece" },
      { label: "Returns", value: "30 days · repairs for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Sofia L.",
        place: "Lisbon",
        verified: true,
        asExpected: true,
        body: "We use these for everything now. The slight differences between each plate are the whole charm — dinner feels a little more considered.",
      },
    ],
  },
  tumblers: {
    id: "tumblers",
    worldSlug: "odd-clay",
    name: "Morning Tumblers",
    price: "£64",
    priceValue: 64,
    note: "Set of 4",
    clipLabel: "Lena on the speckle",
    clipDuration: "0:16",
    gallery: ["/media/mono-ceramics.jpg", "/media/clay-wheel.jpg", "/media/clay-shelf.jpg"],
    description: [
      "Sized for the first coffee of the day — small enough to cup in two hands, heavy enough to feel like it means it.",
      "Speckled porcelain with a raw clay foot, so it grips the saucer and warms slowly. Four to a set, because mornings are better shared.",
    ],
    specs: [
      { label: "Set", value: "4 tumblers, 8cm" },
      { label: "Holds", value: "200ml" },
      { label: "Material", value: "Speckled porcelain" },
      { label: "Made to order", value: "Ships in 2–3 weeks" },
      { label: "Care", value: "Dishwasher-safe" },
      { label: "Returns", value: "30 days · repairs for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Aiko M.",
        place: "Kyoto",
        verified: true,
        asExpected: true,
        body: "The weight is perfect. My morning ritual feels different holding one of these instead of a mug from a shop.",
      },
    ],
  },
  length: {
    id: "length",
    worldSlug: "indigo-ash",
    name: "Indigo Length · 2m",
    price: "£120",
    priceValue: 120,
    note: "Dye-lot unique",
    clipLabel: "Sabine on reading the vat",
    clipDuration: "0:28",
    gallery: ["/media/textile-fold.jpg", "/media/indigo-dye.jpg", "/media/textile-machine.jpg"],
    description: [
      "Two metres of hand-dipped cotton, for the tailor or maker who already knows what they want it to become.",
      "The depth of blue is a record of how many times I chose to go back into the vat. This lot went in nine times. The next will be its own colour entirely.",
    ],
    specs: [
      { label: "Length", value: "2m × 1.1m wide" },
      { label: "Material", value: "100% cotton, natural indigo" },
      { label: "Dye", value: "Hand-dipped, 9 immersions" },
      { label: "Made to order", value: "Ships in 1–2 weeks" },
      { label: "Care", value: "Cold hand-wash; will soften, holds the blue" },
      { label: "Returns", value: "14 days on uncut lengths" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Amara K.",
        place: "London",
        verified: true,
        asExpected: true,
        body: "I made a jacket from this and it's the most complimented thing I own. The blue is so much deeper than any dyed fabric I've bought before.",
      },
      {
        id: "r2",
        author: "Ren P.",
        place: "Amsterdam",
        verified: true,
        asExpected: true,
        body: "Sabine messaged to ask what I was making before she cut the lot. That never happens. The cloth is beautiful and the care is the real luxury.",
      },
    ],
  },
  wrap: {
    id: "wrap",
    worldSlug: "indigo-ash",
    name: "The Everyday Wrap",
    price: "£85",
    priceValue: 85,
    note: "Made to order",
    clipLabel: "Sabine on the everyday wrap",
    clipDuration: "0:21",
    gallery: ["/media/textile-scarf.jpg", "/media/textiles-rack.jpg", "/media/indigo-dye.jpg"],
    description: [
      "Light enough for a Dakar afternoon, deep enough for a London winter. The one piece I told myself I'd keep, and then made again.",
      "Finished by hand on a machine older than me. It softens with every wash and never lets go of the blue.",
    ],
    specs: [
      { label: "Dimensions", value: "180cm × 65cm" },
      { label: "Material", value: "Hand-dyed cotton-linen" },
      { label: "Made to order", value: "Ships in 1–2 weeks" },
      { label: "Care", value: "Cold wash, line dry" },
      { label: "Variation", value: "Each dye-lot is unique" },
      { label: "Returns", value: "30 days" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Nadia B.",
        place: "Paris",
        verified: true,
        asExpected: true,
        body: "I wear it three seasons out of four. It arrived softer than I imagined and the colour has only got better with washing.",
      },
    ],
  },
  "field-stool": {
    id: "field-stool",
    worldSlug: "grain-groove",
    name: "The Field Stool",
    price: "£145",
    priceValue: 145,
    note: "Made to order",
    clipLabel: "Tomás on wedging the legs",
    clipDuration: "0:22",
    gallery: ["/media/wood-stool.jpg", "/media/wood-joint.jpg"],
    description: [
      "The stool I make first when someone new comes to the shop, because it hides nothing. Three legs, each one wedged through the seat by hand — you can see the joint, and the joint is the whole guarantee.",
      "Reclaimed timber, so the grain already has a history before you ever sit down. It darkens where your hands land and lightens where the sun does. That is the stool doing its job.",
    ],
    specs: [
      { label: "Seat height", value: "45cm · 30cm across" },
      { label: "Material", value: "Reclaimed hardwood, hand-wedged tenons" },
      { label: "Holds", value: "140kg — tested on me" },
      { label: "Finish", value: "Rubbed beeswax, no lacquer" },
      { label: "Made to order", value: "Ships in 3–4 weeks" },
      { label: "Returns", value: "30 days · re-wedged free for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Bruno M.",
        place: "Antwerp",
        verified: true,
        asExpected: true,
        body: "It arrived with the maker's initials burned into the underside and a note that just said 'stand on it.' So I did. Solid as a rock, and better looking than the photos.",
      },
      {
        id: "r2",
        author: "Céline D.",
        place: "Lyon",
        verified: true,
        asExpected: true,
        body: "I asked Tomás if it could take a taller seat and he simply re-cut it. Who does that? It's the only stool my whole family fights over.",
      },
    ],
  },
  "butterfly-board": {
    id: "butterfly-board",
    worldSlug: "grain-groove",
    name: "Butterfly Board",
    price: "£68",
    priceValue: 68,
    note: "1 of a kind",
    clipLabel: "Tomás on the butterfly key",
    clipDuration: "0:18",
    gallery: ["/media/woodwork.jpg", "/media/wood-joint.jpg"],
    description: [
      "A crack in a good board isn't a flaw to me — it's an invitation. I stitch it back together with a walnut butterfly key, so the repair becomes the most deliberate thing in the room.",
      "Each one is cut from a single offcut too stubborn to throw away. Oil it now and then and it will outlast every plastic board you were ever told to buy.",
    ],
    specs: [
      { label: "Size", value: "38cm × 22cm × 3cm" },
      { label: "Material", value: "Reclaimed hardwood, walnut keys" },
      { label: "Food-safe", value: "Rubbed with flax oil + beeswax" },
      { label: "Each is unique", value: "Grain and keys vary by board" },
      { label: "Care", value: "Hand-wash, re-oil monthly" },
      { label: "Returns", value: "30 days · re-oiled free for life" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Hana Ł.",
        place: "Kraków",
        verified: true,
        asExpected: true,
        body: "The butterfly joint is even prettier in person. Three people have tried to buy it off my counter. Not a chance.",
      },
      {
        id: "r2",
        author: "Theo R.",
        place: "Bristol",
        verified: true,
        asExpected: true,
        body: "Bought it as a wedding present and nearly kept it. You can feel that a person, not a factory, decided where every cut went.",
      },
    ],
  },
  "neroli-cedar": {
    id: "neroli-cedar",
    worldSlug: "ember-rue",
    name: "Neroli & Cedar Oil",
    price: "£46",
    priceValue: 46,
    note: "Distilled to order",
    clipLabel: "Noor on the neroli harvest",
    clipDuration: "0:20",
    gallery: ["/media/apothecary.jpg", "/media/salt-ceramics.jpg"],
    description: [
      "The oil I reach for when I can't decide what I want to smell like. Bitter-orange blossom picked at dawn, when the scent is greenest, cut with Atlas cedar for a base that holds all day.",
      "It moves as you wear it — bright and almost sharp at noon, then by evening the cedar takes over and it reads warm, low, a little smoky. One bottle is a whole day in three drops.",
    ],
    specs: [
      { label: "Volume", value: "15ml roller · glazed stoneware" },
      { label: "Notes", value: "Neroli, petitgrain, Atlas cedar" },
      { label: "Base", value: "Cold-pressed jojoba, nothing synthetic" },
      { label: "Distilled to order", value: "Ships in 1–2 weeks" },
      { label: "Care", value: "Keep sealed, out of the sun" },
      { label: "Returns", value: "30 days on unopened bottles" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Yasmin R.",
        place: "Casablanca",
        verified: true,
        asExpected: true,
        body: "I've worn French perfume my whole life and stopped the week this arrived. Three people asked what it was before I'd left the house. It smells like an actual place, not a marketing meeting.",
      },
      {
        id: "r2",
        author: "Lukas H.",
        place: "Vienna",
        verified: true,
        asExpected: true,
        body: "Noor asked what I usually wear before she blended it and nudged the cedar up. It shifts through the day exactly like she said it would. Nothing off a shop shelf does that.",
      },
    ],
  },
  "rose-absolute": {
    id: "rose-absolute",
    worldSlug: "ember-rue",
    name: "Sealed Vessel · Rose Absolute",
    price: "£58",
    priceValue: 58,
    note: "1 of a batch",
    clipLabel: "Noor on sealing the stoneware",
    clipDuration: "0:17",
    gallery: ["/media/salt-ceramics.jpg", "/media/apothecary.jpg"],
    description: [
      "Damask rose is the most honest material I work with and the least forgiving. Too warm a still and it turns to jam; too fast and you lose the green edge that makes it rose and not candy.",
      "I keep it in glazed stoneware, sealed with wax and dated by hand. Light is rose's enemy — stone gives it the dark, still cellar it wants, so the last drop smells like the first.",
    ],
    specs: [
      { label: "Volume", value: "10ml · glazed stoneware, waxed" },
      { label: "Notes", value: "Damask rose absolute, a breath of geranium" },
      { label: "Base", value: "Fractionated coconut, unscented" },
      { label: "Batch", value: "Sealed and dated by hand" },
      { label: "Care", value: "Store sealed and cool; it keeps for years" },
      { label: "Returns", value: "30 days on unopened vessels" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Priya N.",
        place: "London",
        verified: true,
        asExpected: true,
        body: "It arrived sealed with actual wax and the batch date written on the base. It smells like a real garden after rain, not the rose of a cheap candle. I ration it.",
      },
      {
        id: "r2",
        author: "Sonia M.",
        place: "Lisbon",
        verified: true,
        asExpected: true,
        body: "I was nervous ordering scent online. Then Noor sent a note about the exact batch it came from. It's the one thing on my shelf people always stop to smell.",
      },
    ],
  },
  "overprint-07": {
    id: "overprint-07",
    worldSlug: "risograph-room",
    name: "Overprint Study · No. 07",
    price: "£34",
    priceValue: 34,
    note: "Edition of 40",
    clipLabel: "Juno on the two-colour overlap",
    clipDuration: "0:19",
    gallery: ["/media/riso-overprint.jpg", "/media/riso-ink.jpg"],
    description: [
      "The seventh print in a series I keep swearing I'll finish. Fluoro pink laid down first, then a translucent blue on top — and where they cross, a third colour appears that I can't mix in the tin and can't quite predict.",
      "Printed two passes by hand on cotton paper, so every sheet in the edition is a fraction off from the last. That drift is signed into it. Hang it in daylight and the fluoro practically hums.",
    ],
    specs: [
      { label: "Size", value: "A3 · 297 × 420mm" },
      { label: "Paper", value: "300gsm cotton, deckle edge" },
      { label: "Inks", value: "Riso fluoro pink + blue, 2 passes" },
      { label: "Edition", value: "40, signed and numbered" },
      { label: "Ships", value: "Flat-packed, 3–5 days" },
      { label: "Returns", value: "30 days, unframed" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Marco V.",
        place: "Milan",
        verified: true,
        asExpected: true,
        body: "The photos don't catch the fluoro at all — in person it glows. You can see the two passes don't line up perfectly, and that's exactly why I bought it over a poster.",
      },
      {
        id: "r2",
        author: "Dahye K.",
        place: "Seoul",
        verified: true,
        asExpected: true,
        body: "I visited the studio after buying online and Juno showed me the exact drum it came off. Number 12 of 40, and it's the best thing on my wall.",
      },
    ],
  },
  "ink-field": {
    id: "ink-field",
    worldSlug: "risograph-room",
    name: "Ink Field · Riso Print",
    price: "£30",
    priceValue: 30,
    note: "Edition of 30",
    clipLabel: "Juno on a single-ink wash",
    clipDuration: "0:15",
    gallery: ["/media/riso-ink.jpg", "/media/riso-overprint.jpg"],
    description: [
      "Sometimes one ink is the whole idea. A single flood of riso blue, run through the drum until the roller texture and the paper grain start arguing — and that argument is the image.",
      "No second colour, no type, nowhere to hide. Just the ink doing what riso ink does: sitting proud on the cotton, catching the light, never quite flat. The quietest thing I make and my own favourite.",
    ],
    specs: [
      { label: "Size", value: "A4 · 210 × 297mm" },
      { label: "Paper", value: "270gsm cotton" },
      { label: "Ink", value: "Riso federal blue, single pass" },
      { label: "Edition", value: "30, signed and numbered" },
      { label: "Ships", value: "Flat-packed, 3–5 days" },
      { label: "Returns", value: "30 days, unframed" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Elif D.",
        place: "Istanbul",
        verified: true,
        asExpected: true,
        body: "It's just blue and it's perfect. The texture is unreal up close — my phone camera can't even focus on it properly. It feels like an object, not a poster.",
      },
      {
        id: "r2",
        author: "Ravi S.",
        place: "Toronto",
        verified: true,
        asExpected: true,
        body: "Bought two, gave one away, regretted it, bought another. Juno wrapped it in newsprint with a hand-stamped thank-you. Small thing, big difference.",
      },
    ],
  },
  "butterfly-wings": {
    id: "butterfly-wings",
    worldSlug: "two-dots",
    name: "Butterfly Wings",
    price: "£58",
    priceValue: 58,
    note: "Made to measure",
    clipLabel: "Sharon on wings that spin",
    clipDuration: "0:11",
    filmSrc: "/media/video/product-butterfly-wings.mp4",
    gallery: ["/media/twodots/butterfly-back.jpg", "/media/twodots/felt.jpg"],
    description: [
      "The wings I've made most, because every few weeks another small person decides they're a butterfly. Cut from felt, wired along the top edge so they hold their shape and lift when she turns.",
      "They sit on a soft hidden harness — no scratchy elastic, nothing to dig in — so it can be worn for a whole afternoon and forgotten about, which is exactly the point.",
    ],
    specs: [
      { label: "Fits", value: "Ages 3–8, made to your child's measurements" },
      { label: "Material", value: "Wool-blend felt, wired edge, cotton harness" },
      { label: "Made to measure", value: "Sewn to order, ready in 1–2 weeks" },
      { label: "Care", value: "Spot-clean; the wings keep their shape" },
      { label: "Safety", value: "No small parts, no sharp edges" },
      { label: "Returns", value: "Resized free if they grow before the party" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Michal R.",
        place: "Haifa",
        verified: true,
        asExpected: true,
        body: "My daughter has not taken these off in four days. Sharon measured her over a video call and they fit perfectly. She spins until she's dizzy just to watch them lift.",
      },
      {
        id: "r2",
        author: "Daniel K.",
        place: "Tel Aviv",
        verified: true,
        asExpected: true,
        body: "We made a version of these at the workshop, then ordered the finished pair for a birthday. The care that goes into them is obvious the second you hold them.",
      },
    ],
  },
  "little-devil": {
    id: "little-devil",
    worldSlug: "two-dots",
    name: "The Little Devil",
    price: "£64",
    priceValue: 64,
    note: "Made to measure",
    clipLabel: "Sharon on soft horns",
    clipDuration: "0:14",
    gallery: ["/media/twodots/devil-back.jpg", "/media/twodots/materials.jpg"],
    description: [
      "All the mischief, none of the menace. Soft felt horns on a comfortable band, a red tulle skirt with real body to it, and a trident that's cut from foam so the only thing it can poke is the sofa.",
      "I make this one for the kids who want to be a little bit naughty for a night. It photographs like trouble and feels like a pyjama.",
    ],
    specs: [
      { label: "Fits", value: "Ages 3–9, made to measure" },
      { label: "Includes", value: "Horns, tulle skirt, foam trident" },
      { label: "Material", value: "Felt, tulle, soft foam" },
      { label: "Made to measure", value: "Sewn to order, ready in 1–2 weeks" },
      { label: "Safety", value: "Foam trident, no hard points" },
      { label: "Returns", value: "Resized free within the season" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Noa B.",
        place: "Jerusalem",
        verified: true,
        asExpected: true,
        body: "The trident being soft foam is the detail that sold me — one less thing to worry about at a party full of five-year-olds. Beautifully made and the tulle is properly full.",
      },
      {
        id: "r2",
        author: "Yael T.",
        place: "Ramat Gan",
        verified: true,
        asExpected: true,
        body: "Shy kid, loud costume. She turned into someone else the moment it went on. That's exactly what Sharon promised.",
      },
    ],
  },
  "cat-tote": {
    id: "cat-tote",
    worldSlug: "two-dots",
    name: "The Cat Tote",
    price: "£18",
    priceValue: 18,
    note: "Studio-printed",
    clipLabel: "Sharon on the cat stamp",
    clipDuration: "0:09",
    gallery: ["/media/twodots/tote.jpg", "/media/twodots/felt.jpg"],
    description: [
      "A plain cotton drawstring bag that the kids in the studio cover in cat faces, one hand-cut stamp at a time. Every cat has a different expression because every child stamps differently.",
      "It's the thing they carry their costume home in — and then their swimming kit, and then everything else, for years.",
    ],
    specs: [
      { label: "Size", value: "35 × 42cm drawstring bag" },
      { label: "Material", value: "Natural cotton, water-based ink" },
      { label: "Each is unique", value: "Hand-stamped in the studio — no two match" },
      { label: "Care", value: "Cold machine wash, inside out" },
      { label: "Ships", value: "In stock, 3–5 days" },
      { label: "Returns", value: "30 days if unused" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Tamar L.",
        place: "Modiin",
        verified: true,
        asExpected: true,
        body: "The little cat faces are all slightly wonky and that's the whole charm. My son insists the sad one is his favourite. Sturdier than it looks, too.",
      },
      {
        id: "r2",
        author: "Efrat S.",
        place: "Herzliya",
        verified: true,
        asExpected: true,
        body: "Bought it almost as an afterthought and it's become the bag that goes everywhere. Lovely to know a kid actually printed it.",
      },
    ],
  },
  "costume-workshop": {
    id: "costume-workshop",
    worldSlug: "two-dots",
    name: "Parent & Child Workshop",
    price: "£45",
    priceValue: 45,
    note: "Per pair · booked by date",
    clipLabel: "Inside a Two Dots session",
    clipDuration: "0:45",
    filmSrc: "/media/video/two-dots.mp4",
    gallery: ["/media/twodots/materials.jpg", "/media/twodots/workshop.jpg"],
    description: [
      "Two hours, one grown-up, one child, and one costume you build together and walk out wearing. I set up the machines and the felt; you two supply the idea and the arguing about which animal.",
      "You don't need to know how to sew. That's my job. Your job is to be there, elbow to elbow, making the thing your kid will remember longer than any toy.",
    ],
    specs: [
      { label: "Length", value: "2 hours, one parent + one child" },
      { label: "For", value: "Children 4–11 with a grown-up" },
      { label: "You make", value: "One costume, finished and worn home" },
      { label: "Included", value: "All materials, machines, and guidance" },
      { label: "No experience", value: "Needed — first-timers welcome" },
      { label: "Booking", value: "By date; demo scheduling only in this build" },
    ],
    reviews: [
      {
        id: "r1",
        author: "Gili M.",
        place: "Tel Aviv",
        verified: true,
        asExpected: true,
        body: "I cannot sew a button. We left with a full fox costume and my daughter telling everyone SHE made it. Sharon makes that possible without ever taking over.",
      },
      {
        id: "r2",
        author: "Roi A.",
        place: "Givatayim",
        verified: true,
        asExpected: true,
        body: "Two hours off our phones, making something together. Worth ten toys. We've already booked the next one.",
      },
    ],
  },
};

export function getProduct(slug: string, productId: string): ProductDetail | undefined {
  const p = PRODUCT_DETAILS[productId];
  return p && p.worldSlug === slug ? p : undefined;
}

/** All (slug, product) pairs for generateStaticParams. */
export function allProductParams(): { slug: string; product: string }[] {
  return Object.values(PRODUCT_DETAILS).map((p) => ({
    slug: p.worldSlug,
    product: p.id,
  }));
}

/** Trust badge (D7) — two honest layers, personalised per maker. */
export function trustLayers(maker: Maker) {
  return {
    realMaker: {
      title: "Verified real maker",
      body: `${maker.name} is a real person — identity confirmed and anchored by their own voice on film.`,
    },
    aiTransparency: {
      title: "Honest about AI",
      body: "AI helped draft this shop's layout and tidy the copy. The object, the film, and the voice are the maker's own.",
    },
  };
}

/* ---- Mock bag + order (checkout / thank-you) ---- */

export interface BagLine {
  productId: string;
  qty: number;
}

export const MOCK_BAG: BagLine[] = [
  { productId: "carafe", qty: 1 },
  { productId: "wrap", qty: 1 },
];

export interface ResolvedLine {
  product: ProductDetail;
  maker: Maker;
  qty: number;
  lineTotal: number;
}

export function resolveBag(bag: BagLine[] = MOCK_BAG): ResolvedLine[] {
  const lines: ResolvedLine[] = [];
  for (const { productId, qty } of bag) {
    const product = PRODUCT_DETAILS[productId];
    if (!product) continue;
    const maker = getMaker(product.worldSlug);
    if (!maker) continue;
    lines.push({ product, maker, qty, lineTotal: product.priceValue * qty });
  }
  return lines;
}

// Free UK shipping — matches the product-page promise (a mocked UI must not
// contradict itself). Rendered as "Free · UK" in the summary.
export const SHIPPING = 0;

export function bagTotals(lines: ResolvedLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { subtotal, shipping: SHIPPING, total: subtotal + SHIPPING };
}

export const gbp = (n: number) => `£${n.toFixed(2)}`;

export const MOCK_ORDER = {
  number: "KOL-2607-4413",
  date: "23 July 2026",
  email: "you@example.com",
  deliveryEstimate: "Arrives 6–10 August",
};

/**
 * Personal thank-you note per maker, in their own voice (journey step 8).
 * `filmSrc` (optional) points at /media/video/thankyou-<slug>.mp4 for the
 * thank-you hero clip — set once the file exists; falls back to the still.
 */
export const THANK_YOU_NOTES: Record<
  string,
  { line: string; clip: string; filmSrc?: string }
> = {
  "odd-clay": {
    line: "Thank you — truly. Your carafe is on the drying shelf now; I'll pack it the morning it's ready and slip a note in the box.",
    clip: "0:22",
  },
  "indigo-ash": {
    line: "Merci. Your wrap goes into the vat this week. I'll send word the moment the blue is deep enough to cut.",
    clip: "0:18",
  },
  "grain-groove": {
    line: "Cheers. It's on the bench, first job Monday — I'll burn my mark in the underside and post it once the joint's had a day to settle. No screws, promise.",
    clip: "0:19",
  },
  "ember-rue": {
    line: "Thank you. This batch is resting on the still now; I'll bottle yours the hour it turns right and seal the date on the base before it ships.",
    clip: "0:16",
  },
  "risograph-room": {
    line: "Yes! Going on the drum this week — I'll pull your sheets by hand, sign the good ones, and slip a spare misprint in the tube because the mistakes are half the fun.",
    clip: "0:17",
  },
  "two-dots": {
    line: "Thank you! I'll cut it this week and sew it to fit. Send me their height and their favourite thing about being a butterfly — I build the second one in.",
    clip: "0:20",
  },
};

export function thankYouFor(worldSlug: string) {
  return THANK_YOU_NOTES[worldSlug];
}
