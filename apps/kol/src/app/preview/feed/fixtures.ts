import type { FeedCard } from "@/lib/feed/select";

/**
 * Deterministic fixture cards for the feed-magazine harness (W3-B1b).
 * Realistic maker identities and the shipped preview posters — the layout
 * gate measures real rendered boxes off these, and the design-critic
 * screenshots N=4 / N=18 from them (discovery-feed OQ-3). Clip srcs point
 * at fixture paths that do not exist: ambient loops fall back to their
 * posters, which is the designed quiet-failure path.
 */

/**
 * 18 DISTINCT makers — one per card at the full engine limit. The gate-2
 * critic ruled the N=18 capture unevidenced because 12 makers cycled
 * (`MAKERS[i % MAKERS.length]`) and 6 appeared twice; the engine itself
 * never repeats a store (`distinct on (store_id)`), so the fixture pool
 * must be at least as distinct as the data it stands in for.
 */
const MAKERS: ReadonlyArray<{ name: string; craft: string; place: string }> = [
  { name: "Sena Okafor", craft: "Ceramicist", place: "Lisbon" },
  { name: "Noor Haddad", craft: "Natural dyer", place: "Amman" },
  { name: "Marta Ferreira", craft: "Letterpress printer", place: "Porto" },
  { name: "Isolde Brandt", craft: "Glassblower", place: "Copenhagen" },
  { name: "Mara Iversen", craft: "Leatherworker", place: "Bergen" },
  { name: "Tomás Aguilar", craft: "Woodturner", place: "Oaxaca" },
  { name: "Ayşe Demir", craft: "Weaver", place: "Izmir" },
  { name: "Elio Marchetti", craft: "Bookbinder", place: "Bologna" },
  { name: "Wren Gallagher", craft: "Knifemaker", place: "Cork" },
  { name: "Priya Raghavan", craft: "Block printer", place: "Jaipur" },
  { name: "Anouk Visser", craft: "Basket weaver", place: "Utrecht" },
  { name: "Kofi Mensah", craft: "Kente weaver", place: "Kumasi" },
  { name: "Hana Yoshida", craft: "Indigo dyer", place: "Tokushima" },
  { name: "Lars Eklund", craft: "Chairmaker", place: "Malmö" },
  { name: "Beatriz Solano", craft: "Silversmith", place: "Taxco" },
  { name: "Femi Adeyemi", craft: "Adire dyer", place: "Abeokuta" },
  { name: "Greta Kalniņa", craft: "Willow weaver", place: "Riga" },
  { name: "Omar Benali", craft: "Zellige cutter", place: "Fez" },
];

/**
 * 18 DISTINCT poster stills — one per card at the engine limit, for the
 * same reason as the 18 makers: the N=18 evidence is judged on visible
 * repetition, and 8 images cycling under 18 names imposes its own visual
 * rhythm on the page (it can mask grid-ness or manufacture it). Ordered
 * so adjacent cards never share a palette family.
 */
const POSTERS: readonly string[] = [
  "/media/ashwork/intro-poster.svg",
  "/media/tinctura/vat-poster.svg",
  "/seed/hollowgrain/storm-oak-bowl.svg",
  "/seed/isoldeglass/sea-smoke-tumblers.svg",
  "/media/ashwork/wheel-poster.svg",
  "/seed/maraleather/oxblood-sleeve.svg",
  "/seed/ferreirapress/press-room.svg",
  "/media/tinctura/shibori-throw.svg",
  "/seed/hollowgrain/spalted-vessel.svg",
  "/media/ashwork/sena-portrait.svg",
  "/seed/isoldeglass/amber-swell-vase.svg",
  "/seed/maraleather/ninefold-belt.svg",
  "/media/tinctura/noor-portrait.svg",
  "/seed/ferreirapress/broadside-12.svg",
  "/media/ashwork/ash-bowl.svg",
  "/seed/hollowgrain/walnut-boards.svg",
  "/seed/isoldeglass/tide-line-carafe.svg",
  "/media/ashwork/ridge-tumbler.svg",
];

const FOCAL_POINTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.5, y: 0.32 },
  { x: 0.34, y: 0.4 },
  { x: 0.62, y: 0.3 },
  { x: 0.5, y: 0.5 },
];

export function buildFixtureCards(count: number): FeedCard[] {
  return Array.from({ length: count }, (_, i) => {
    const maker = MAKERS[i % MAKERS.length] ?? MAKERS[0]!;
    return {
      videoId: `fixture-video-${i}`,
      storeId: `fixture-store-${i}`,
      storeSlugOrId: `fixture-store-${i}`,
      makerName: maker.name,
      craft: maker.craft,
      place: maker.place,
      avatarUrl: null,
      src: `/media/fixtures/clip-${i}.mp4`,
      poster: POSTERS[i % POSTERS.length] ?? null,
      durationMs: 9000,
      captionsSrc: null,
      aspect: "4:5",
      focalPoint: FOCAL_POINTS[i % FOCAL_POINTS.length] ?? null,
    };
  });
}
