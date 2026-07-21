"use client";

/**
 * Search & Shop (B11) — route `/search`, KOL chrome (D15a).
 * Mirrors docs/10-page-mockups/search.html. Hard AC: results open maker
 * worlds, NEVER a flat product grid — one card per maker, matching pieces
 * nested under it as a horizontal rail. 0 results suggests makers instead
 * of dead-ending. The delivery-requirements filter is rendered disabled:
 * it has no backing source field yet.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatPrice,
  getMaker,
  makers,
  productsByMaker,
  type MockMaker,
  type MockProduct,
} from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";

/* ------------------------------------------------------------------ */
/* Filter vocabulary — every option reads a real field in the mock db. */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { label: "Ceramics", craft: "Stoneware" },
  { label: "Textiles", craft: "Natural dye" },
  { label: "Wood", craft: "Green woodwork" },
  { label: "Metal", craft: "Copper" },
  { label: "Paper", craft: "Bookbinding" },
] as const;

const MATERIALS = [
  { label: "Stoneware", keyword: "stoneware" },
  { label: "Linen", keyword: "linen" },
  { label: "Wood", keyword: "wood" },
  { label: "Copper", keyword: "copper" },
  { label: "Paper", keyword: "paper" },
] as const;

const PRICE_RANGES = [
  { label: "Under $75", min: 0, max: 7500 },
  { label: "$75–250", min: 7500, max: 25000 },
  { label: "$250+", min: 25000, max: Number.POSITIVE_INFINITY },
] as const;

const SHIPS_FROM = ["US", "EU"] as const;
type Region = (typeof SHIPS_FROM)[number];
type Availability = "ready" | "made-to-order";

function regionOf(maker: MockMaker): Region {
  return maker.location.includes("Lisbon") ? "EU" : "US";
}

/** Everything searchable/matchable about a maker, lowercased once. */
function makerHaystack(maker: MockMaker): string {
  const productText = productsByMaker(maker.slug)
    .map((p) => `${p.title} ${p.provenance.materials}`)
    .join(" ");
  return `${maker.name} ${maker.craft} ${maker.craftLine} ${maker.location} ${productText}`.toLowerCase();
}

interface MakerResult {
  maker: MockMaker;
  /** pieces that survive query + product-level filters — shown in the rail */
  pieces: MockProduct[];
  makerMatched: boolean;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-pill border px-3 py-1 text-caption transition-colors duration-state ease-kol ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink hover:bg-ground"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption uppercase text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const SUGGESTED_SLUGS = ["noor", "sena", "mira"] as const;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null); // craft name
  const [material, setMaterial] = useState<string | null>(null); // keyword
  const [priceIdx, setPriceIdx] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [shipsFrom, setShipsFrom] = useState<Region | null>(null);

  const results: MakerResult[] = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (text: string) => terms.every((t) => text.includes(t));
    const priceRange = priceIdx !== null ? PRICE_RANGES[priceIdx] : undefined;
    const productFilterActive = priceRange !== undefined || availability !== null;

    return makers.flatMap((maker) => {
      if (category !== null && maker.craft !== category) return [];
      if (shipsFrom !== null && regionOf(maker) !== shipsFrom) return [];
      const haystack = makerHaystack(maker);
      if (material !== null && !haystack.includes(material)) return [];

      const withinFilters = productsByMaker(maker.slug).filter((p) => {
        if (priceRange && (p.priceMinor < priceRange.min || p.priceMinor >= priceRange.max))
          return false;
        if (availability === "ready" && p.inventory.status !== "in-stock") return false;
        if (availability === "made-to-order" && p.inventory.status !== "made-to-order")
          return false;
        return true;
      });
      // Price/availability read product fields — a maker with no passing
      // piece honestly drops out while those filters are on.
      if (productFilterActive && withinFilters.length === 0) return [];

      const makerMatched = terms.length === 0 || hit(haystack);
      const queryPieces =
        terms.length === 0
          ? withinFilters
          : withinFilters.filter((p) =>
              hit(`${p.title} ${p.description} ${p.provenance.materials}`.toLowerCase()),
            );
      if (!makerMatched && queryPieces.length === 0) return [];

      return [
        {
          maker,
          pieces: makerMatched ? withinFilters : queryPieces,
          makerMatched,
        },
      ];
    });
  }, [query, category, material, priceIdx, availability, shipsFrom]);

  const suggested = SUGGESTED_SLUGS.map((s) => getMaker(s)).filter(
    (m): m is MockMaker => m !== undefined,
  );

  return (
    <>
      {/* ============ search header — a question, not a query bar ============ */}
      <header className="mx-auto w-full max-w-page px-6 pb-8 pt-12">
        <Reveal>
          <p className="text-caption uppercase text-muted">Search KOL</p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>
          <h1 className="mt-2 max-w-measure font-display text-display [text-wrap:balance]">
            Find the maker, not a wall of things.
          </h1>
        </Reveal>
        <Reveal delayMs={2 * STAGGER_MS}>
          <form
            className="mt-4 flex flex-wrap items-center gap-3"
            onSubmit={(e) => e.preventDefault()}
            role="search"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “stoneware”, “indigo”, “Sena”…"
              aria-label="Search makers and crafts"
              className="min-w-[260px] flex-1 rounded-md border border-line bg-surface px-4 py-3 text-body-lg text-ink placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-pill bg-accent-cta px-6 py-3 text-body font-semibold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
            >
              Search
            </button>
          </form>
        </Reveal>
        <Reveal delayMs={3 * STAGGER_MS}>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-caption uppercase text-muted">Browse</span>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.label}
                active={category === c.craft}
                onClick={() => setCategory(category === c.craft ? null : c.craft)}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </Reveal>
      </header>

      {/* ============ body: left rail of filters + maker-first results ============ */}
      <main className="mx-auto w-full max-w-page px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
          {/* left rail — filters, never applied to a grid */}
          <Reveal as="section" className="md:col-span-2">
            <aside className="flex flex-col gap-6 rounded-md border border-line bg-surface p-4 shadow-subtle">
              <FilterGroup label="Material">
                {MATERIALS.map((m) => (
                  <Chip
                    key={m.label}
                    active={material === m.keyword}
                    onClick={() => setMaterial(material === m.keyword ? null : m.keyword)}
                  >
                    {m.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Price range">
                {PRICE_RANGES.map((r, i) => (
                  <Chip
                    key={r.label}
                    active={priceIdx === i}
                    onClick={() => setPriceIdx(priceIdx === i ? null : i)}
                  >
                    <span className="font-mono">{r.label}</span>
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Made to order">
                <Chip
                  active={availability === "ready"}
                  onClick={() => setAvailability(availability === "ready" ? null : "ready")}
                >
                  Ready to ship
                </Chip>
                <Chip
                  active={availability === "made-to-order"}
                  onClick={() =>
                    setAvailability(availability === "made-to-order" ? null : "made-to-order")
                  }
                >
                  Made to order
                </Chip>
              </FilterGroup>

              <FilterGroup label="Ships from">
                {SHIPS_FROM.map((r) => (
                  <Chip
                    key={r}
                    active={shipsFrom === r}
                    onClick={() => setShipsFrom(shipsFrom === r ? null : r)}
                  >
                    {r}
                  </Chip>
                ))}
              </FilterGroup>

              {/* honest gap (B11 AC): no backing source field yet */}
              <div className="flex flex-col gap-2 border-t border-dashed border-line pt-4">
                <span className="text-caption uppercase text-muted">Delivery requirements</span>
                <button
                  type="button"
                  disabled
                  title="No backing data yet — this filter has no source field to read"
                  className="w-fit cursor-not-allowed rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink opacity-60"
                >
                  Coming soon
                </button>
                <p className="text-caption text-muted">
                  No backing data yet — this filter has no source field to read.
                </p>
              </div>
            </aside>
          </Reveal>

          {/* results column — makers on film, products nested under */}
          <Reveal as="section" delayMs={STAGGER_MS} className="md:col-span-4">
            {results.length > 0 ? (
              <>
                <p className="mb-3 text-caption uppercase text-muted">
                  {results.length} {results.length === 1 ? "maker matches" : "makers match"} ·
                  one card each, never a product grid
                </p>
                <div className="flex flex-col gap-8">
                  {results.map(({ maker, pieces, makerMatched }) => (
                    <article
                      key={maker.slug}
                      className="overflow-hidden rounded-md border border-line bg-surface shadow-card"
                    >
                      <Link href={`/m/${maker.slug}`} className="group block">
                        <Film
                          variant={maker.filmClass}
                          aspect="wide"
                          rounded={false}
                          craft={`${maker.craft} · ${maker.location}`}
                          title={`${maker.name} · ${maker.craftLine}`}
                          className="transition-transform duration-state ease-kol group-hover:scale-[1.005]"
                        />
                      </Link>
                      <div className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {maker.verified ? (
                            <span className="rounded-pill border border-line bg-ground px-2.5 py-0.5 text-caption text-ink">
                              ✓ Real Maker
                            </span>
                          ) : (
                            <span className="rounded-pill border border-dashed border-line px-2.5 py-0.5 text-caption text-muted">
                              Verification pending
                            </span>
                          )}
                          <Link
                            href={`/m/${maker.slug}`}
                            className="text-caption uppercase text-accent transition-colors duration-state ease-kol hover:text-ink"
                          >
                            Enter {maker.name}’s world →
                          </Link>
                        </div>

                        {pieces.length > 0 ? (
                          <>
                            <p className="mt-3 text-caption uppercase text-muted">
                              {pieces.length} {pieces.length === 1 ? "piece" : "pieces"} match
                            </p>
                            {/* horizontal rail — flex scroll, never a grid */}
                            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                              {pieces.map((p) => (
                                <Link
                                  key={p.id}
                                  href={`/m/${maker.slug}/p/${p.id}`}
                                  className="flex min-w-[230px] shrink-0 items-center justify-between gap-4 rounded-sm border border-line bg-ground px-3 py-2.5 transition-colors duration-state ease-kol hover:bg-surface"
                                >
                                  <span className="flex flex-col">
                                    <span className="text-body text-ink">{p.title}</span>
                                    <span className="text-caption text-muted">
                                      {p.inventory.status === "made-to-order"
                                        ? `Made to order · ~${p.inventory.leadWeeks ?? "?"} wks`
                                        : p.inventory.status === "in-stock"
                                          ? "Ready to ship"
                                          : "Sold out"}
                                    </span>
                                  </span>
                                  <span className="font-mono text-body text-ink">
                                    {formatPrice(p.priceMinor, p.currency)}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-caption text-muted">
                            {makerMatched
                              ? "No listed pieces yet — the world is the way in."
                              : "Matched by craft — no individual piece matches."}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              /* ====== 0-results empty state — suggests makers, never dead-ends ====== */
              <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
                <p className="text-caption uppercase text-muted">
                  No match for “<span className="font-mono normal-case">{query.trim() || "these filters"}</span>”
                </p>
                <p className="mt-2 font-display text-h2 text-ink">No makers match yet.</p>
                <p className="mx-auto mt-3 max-w-measure text-body text-muted">
                  Nobody on KOL makes exactly that — but these makers work close by. An empty
                  search is never a dead end.
                </p>
                <div className="mt-8 flex justify-center gap-3 overflow-x-auto pb-1">
                  {suggested.map((m) => (
                    <Link
                      key={m.slug}
                      href={`/m/${m.slug}`}
                      className="w-[180px] shrink-0 text-left"
                    >
                      <Film
                        variant={m.filmClass}
                        aspect="portrait"
                        craft={m.craft}
                        title={m.name}
                      />
                    </Link>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/"
                    className="rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
                  >
                    Back to Discover
                  </Link>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </main>
    </>
  );
}
