/**
 * BESPOKE deep-world data for Two Dots (/m/two-dots only).
 *
 * The other five maker worlds share the MakerWorld template (story → process →
 * wall? → products → studio → voice). Sharon's world breaks that rhythm: it is
 * authored section-by-section here so her room reads as unmistakably HERS — a
 * child's-idea→costume arc, a full-bleed film interlude, an expanded wall, and a
 * made-to-measure commissions beat, with the corner-docked film narrating a new
 * contextual label per section as you go deeper.
 *
 * GOVERNANCE: every asset is Founder-provided and CREDITS-cleared, faceless
 * framing only (backs, hands, products, materials). No identifiable child face;
 * workshop.jpg is held in internal-assets/ and never referenced here. NEW section
 * copy is authored under the honesty bar — no invented facts, no fabricated
 * quotes; it draws only on Sharon's real practice already recorded in the build
 * (made-to-measure, sewn to fit, resized as they grow, parent-and-child sessions).
 */

export interface DeepStep {
  kicker: string;
  title: string;
  body: string;
  image: string;
  /** optional real clip, played muted/looped (MakerFilm) */
  filmSrc?: string;
  alt: string;
  /** contextual label the corner film narrates while this beat is in view */
  filmLabel: string;
}

export interface DeepWallItem {
  src: string;
  filmSrc?: string;
  alt: string;
  ratio: "square" | "portrait" | "tall" | "landscape" | "video";
  caption?: string;
}

export interface TwoDotsDeep {
  /** opening beat under the hero — the idea that starts every costume */
  ideaKicker: string;
  ideaTitle: string;
  ideaBody: string[];
  ideaImage: string;
  ideaImageAlt: string;
  /** the authored make arc (4 beats vs the template's 3) */
  arcKicker: string;
  arcTitle: string;
  arc: DeepStep[];
  /** full-bleed film interlude — her hero clip blooms back to full-bleed */
  interludeQuote: string;
  interludeAttribution: string;
  interludeFilmLabel: string;
  /** expanded gallery wall */
  wallKicker: string;
  wallTitle: string;
  wall: DeepWallItem[];
  /** made-to-measure commissions beat */
  commissionsKicker: string;
  commissionsTitle: string;
  commissionsLead: string;
  commissions: { title: string; body: string }[];
  commissionsFilmLabel: string;
  /** contextual labels for the corner film on the shared beats */
  productsFilmLabel: string;
}

export const TWODOTS_DEEP: TwoDotsDeep = {
  ideaKicker: "It starts with an idea",
  ideaTitle: "Always a very specific animal.",
  ideaBody: [
    "No child ever asks to be a generic dragon. They ask to be a specific dragon — the one already finished in their head, down to the colour of the wings. The shops sell the nearest thing on the shelf. Sharon sews the exact one.",
    "So every costume begins the same way: a child with a very firm opinion, and a small room in Israel that is always covered in felt.",
  ],
  ideaImage: "/media/twodots/felt.jpg",
  ideaImageAlt:
    "A flat-lay of finished felt characters — butterfly, cactus, panda and more — the shapes ideas turn into",
  arcKicker: "How a costume happens",
  arcTitle: "From a pile of nothing to a whole other person.",
  arc: [
    {
      kicker: "01",
      title: "The idea",
      body: "A child names the exact thing they want to be this month. It never survives contact with a shelf — only with a maker who will build that specific one.",
      image: "/media/twodots/felt.jpg",
      alt: "Felt characters laid out — the vocabulary of ideas a child chooses from",
      filmLabel: "It starts with an idea",
    },
    {
      kicker: "02",
      title: "A pile of nothing",
      body: "Offcuts, felt, beads, a tape measure. Everything a costume needs before it is anything at all, laid out on the table.",
      image: "/media/twodots/materials.jpg",
      alt: "Sewing materials — beads, denim, fabric, scissors and yarn — laid out ready to cut",
      filmLabel: "A pile of nothing",
    },
    {
      kicker: "03",
      title: "Cut and sewn by hand",
      body: "Real seams, real hems, stitched to fit one specific child — built to be run in, sat in, and slept in if it comes to that.",
      image: "/media/twodots/quilt.jpg",
      alt: "A patchwork detail — eyelet lace, tartan and floral cotton, hand-stitched with a dusty-rose binding",
      filmLabel: "Cut and sewn by hand",
    },
    {
      kicker: "04",
      title: "They disappear into it",
      body: "The last step isn't Sharon's. It's the five seconds after it goes on, when the shy kid is gone and the butterfly is standing there instead.",
      image: "/media/twodots/butterfly-back.jpg",
      filmSrc: "/media/video/product-butterfly-wings.mp4",
      alt: "A child seen from behind, curly hair showing, spinning to lift handmade felt butterfly wings",
      filmLabel: "…and become it",
    },
  ],
  interludeQuote:
    "I care most about the five seconds after they put it on, when they stop being shy and start being the thing.",
  interludeAttribution: "Sharon · Two Dots",
  interludeFilmLabel: "In the studio",
  wallKicker: "The whole room",
  wallTitle: "This is the studio — pinned to the wall.",
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
      alt: "A child, seen from behind, spinning to lift handmade felt butterfly wings",
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
    {
      src: "/media/twodots/hero-poster.jpg",
      alt: "Hands holding a handmade 'MY CAT' matchbox craft",
      ratio: "square",
      caption: "A tiny matchbox cat",
    },
  ],
  commissionsKicker: "Made to yours",
  commissionsTitle: "Sewn to one specific child.",
  commissionsLead:
    "Nothing here is one-size. Sharon measures, sews to fit, and builds in room to grow — the way a costume for a real, specific child has to be made.",
  commissions: [
    {
      title: "Tell her who they want to be",
      body: "The exact animal, the colour of the wings, the one detail that matters. That firm four-year-old opinion is the brief.",
    },
    {
      title: "She measures and sews to fit",
      body: "Measured to your child, cut and stitched by hand in the studio, ready in one to two weeks. Real seams, no scratchy elastic.",
    },
    {
      title: "Resized as they grow",
      body: "If they shoot up before the party, she resizes it free within the season. A costume you keep, not one you replace.",
    },
  ],
  commissionsFilmLabel: "Made to measure",
  productsFilmLabel: "A few to become",
};
