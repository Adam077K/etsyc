/**
 * /etsy route — ADDITIVE fixture helper (concept-demo only).
 *
 * Flattens KOL's OWN product + maker fixtures into a flat "marketplace listing"
 * shape so the concept /etsy page can present the SAME real products in the old
 * grid format — the pitch's "grid villain". No scraping, no Etsy-owned data: this
 * reads exclusively from our commerce + makers fixtures and CREDITS-cleared
 * imagery. Star ratings are derived honestly from the fixture reviews (every
 * review carries `asExpected: true`, so the visible rating is 5.0 and the count
 * is the true number of testimonial entries — never a fabricated aggregate).
 *
 * This file backs the /etsy route ONLY and is deliberately OUTSIDE the KOL design
 * contract (DESIGN.md). It is never imported by a KOL buyer/seller surface.
 */

import { PRODUCT_DETAILS } from "./fixtures/commerce";
import { getMaker } from "./fixtures/makers";

export interface EtsyListing {
  id: string;
  /** KOL world slug — not linked from /etsy (one-way entry), kept for keys. */
  slug: string;
  title: string;
  shopName: string;
  makerName: string;
  place: string;
  price: string;
  image: string;
  /** grey secondary line, Etsy-style (e.g. "Set of 4", "1 of a kind") */
  note?: string;
  /** honest count of testimonial entries in the fixture */
  reviewCount: number;
  /** all fixture reviews are `asExpected` → a truthful 5.0 visual rating */
  rating: number;
  freeShipping: boolean;
  /** a couple of maker values, shown as tiny tags */
  tags: string[];
  /** demo-star-seller flag stays FALSE — we do not invent Etsy programme badges */
  bestseller: boolean;
}

/**
 * Curated display order — interleaves makers/crafts so the grid reads varied
 * (ceramics, textiles, wood, print, apothecary, costume) rather than clustered
 * by shop, exactly as a real marketplace category page would shuffle them.
 */
const ORDER = [
  "carafe",
  "length",
  "field-stool",
  "overprint-07",
  "butterfly-wings",
  "neroli-cedar",
  "plates",
  "wrap",
  "butterfly-board",
  "ink-field",
  "little-devil",
  "rose-absolute",
  "tumblers",
  "cat-tote",
  "costume-workshop",
];

export const ETSY_LISTINGS: EtsyListing[] = ORDER.flatMap((id) => {
  const p = PRODUCT_DETAILS[id];
  if (!p) return [];
  const maker = getMaker(p.worldSlug);
  const reviewCount = p.reviews.length;
  return [
    {
      id: p.id,
      slug: p.worldSlug,
      title: p.name,
      shopName: maker?.studio ?? "Maker",
      makerName: maker?.name ?? "",
      place: maker?.place.split(" → ").at(-1) ?? maker?.place ?? "",
      price: p.price,
      image: p.gallery[0] ?? "/media/clay-shelf.jpg",
      note: p.note,
      reviewCount,
      rating: 5,
      freeShipping: true, // matches SHIPPING = 0 in the commerce fixture
      tags: (maker?.values ?? []).slice(0, 2),
      bestseller: false,
    },
  ];
});

/** Etsy-style category chips — labels only, non-navigating on this concept page. */
export const ETSY_CATEGORIES = [
  "Home Favourites",
  "Jewellery & Accessories",
  "Clothing & Shoes",
  "Home & Living",
  "Wedding & Party",
  "Toys & Entertainment",
  "Art & Collectibles",
  "Craft Supplies",
];
