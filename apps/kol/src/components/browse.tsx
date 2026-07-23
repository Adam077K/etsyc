"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MagnifyingGlass, X, Compass, ArrowLeft } from "@phosphor-icons/react";
import { ALL_MAKERS, CRAFTS, type Maker } from "@/lib/fixtures/makers";
import { CraftFilter, type Filter } from "./craft-filter";
import { MakerTile } from "./maker-tile";
import { FeedSkeleton } from "./feed-skeleton";
import { ExpandedVideo } from "./expanded-video";
import { rise, calm } from "@/lib/motion";

/** The searchable haystack for a maker — humans and their craft, never SKUs. */
function haystack(m: Maker): string {
  const craft = CRAFTS.find((c) => c.id === m.craft)?.label ?? m.craft;
  return [
    m.name,
    m.studio,
    m.place,
    m.discipline,
    craft,
    m.blurb,
    ...m.values,
  ]
    .join(" ")
    .toLowerCase();
}

const craftLabel = (f: Filter) =>
  f === "all" ? "makers" : CRAFTS.find((c) => c.id === f)?.label ?? "makers";

/**
 * Browse — maker-FIRST results (D16-1): a search returns people and their
 * craft, laid out as an editorial spread (the feed's own masonry), never a
 * uniform SKU grid. Text search + craft rail filter the same roster live, with
 * a designed no-results register in the magazine's voice.
 */
export function Browse() {
  const params = useSearchParams();
  const shouldFocus = params.get("focus") !== null;
  const reduce = useReducedMotion();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  // Tapping a result opens the film overlay (buyer journey step 2), exactly as
  // the feed does — the shared interaction, and dead-link-safe for makers whose
  // world isn't filmed yet (the overlay shows "world coming soon").
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [browseIndex, setBrowseIndex] = useState(0);

  // Brief warm-skeleton beat on first paint (matches the feed's rhythm).
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (shouldFocus && !loading) inputRef.current?.focus();
  }, [shouldFocus, loading]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of ALL_MAKERS) c[m.craft] = (c[m.craft] ?? 0) + 1;
    return c;
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    return ALL_MAKERS.filter((m) => {
      if (active !== "all" && m.craft !== active) return false;
      if (q && !haystack(m).includes(q)) return false;
      return true;
    }).map((m) =>
      // The cover maker's full-bleed hero footprint is the feed's cover beat;
      // in results it reads as a balanced editorial spread, not one giant tile.
      m.span === "hero" ? { ...m, span: "wide" as const } : m,
    );
  }, [q, active]);

  const summary = q
    ? `${results.length} ${results.length === 1 ? "maker" : "makers"} matching “${query.trim()}”`
    : active === "all"
      ? `The full roster · ${results.length} makers in this issue`
      : `${results.length} ${craftLabel(active)} ${results.length === 1 ? "maker" : "makers"}`;

  return (
    <>
      {/* Search header. */}
      <section className="mx-auto max-w-issue px-5 pb-8 pt-28 sm:px-8 sm:pt-32">
        <p className="meta text-marigold">Search the issue</p>
        <h1
          className="mt-4 max-w-3xl font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
        >
          Meet the makers.
        </h1>
        <p className="mt-4 max-w-xl font-serif text-lg italic leading-snug text-bone/70">
          Search a name, a craft, a place, or a way of working. You&rsquo;ll
          always find a person first &mdash; never a shelf of products.
        </p>

        <div className="mt-8 flex w-full max-w-2xl items-center gap-3 rounded-full border border-bone/25 bg-ink-soft px-5 py-4 transition-colors focus-within:border-marigold/70 focus-within:ring-2 focus-within:ring-marigold/40">
          <MagnifyingGlass size={22} className="shrink-0 text-bone/50" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try &ldquo;indigo&rdquo;, &ldquo;Kyoto&rdquo;, or &ldquo;ceramics&rdquo;"
            aria-label="Search makers by name, craft, or place"
            suppressHydrationWarning
            className="w-full bg-transparent font-ui text-base text-bone placeholder:text-bone/40 focus:outline-none sm:text-lg [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-bone/60 transition-colors hover:bg-bone/10 hover:text-bone"
            >
              <X size={18} weight="bold" />
            </button>
          )}
        </div>
      </section>

      {/* Sticky craft rail. */}
      <div className="sticky top-[var(--header-h)] z-30 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto max-w-issue px-5 py-3 sm:px-8">
          <CraftFilter active={active} onChange={setActive} counts={counts} />
        </div>
      </div>

      <section className="mx-auto max-w-issue px-5 pb-24 pt-8 sm:px-8">
        <p className="meta mb-8 text-bone-dim" aria-live="polite">
          {loading ? "Turning the pages…" : summary}
        </p>

        {loading ? (
          <FeedSkeleton />
        ) : results.length === 0 ? (
          <BrowseEmpty
            query={query.trim()}
            craftLabel={craftLabel(active)}
            reduce={!!reduce}
            onReset={() => {
              setQuery("");
              setActive("all");
              inputRef.current?.focus();
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-6 lg:grid-cols-12 max-sm:[&>*]:!col-span-1">
            {results.map((maker, i) => (
              <MakerTile
                key={maker.id}
                maker={maker}
                index={i}
                onOpen={() => {
                  setBrowseIndex(i);
                  setOpenedId(maker.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {openedId && (
          <ExpandedVideo
            list={results}
            openedId={openedId}
            index={browseIndex}
            onIndex={setBrowseIndex}
            onClose={() => setOpenedId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** No-results — composed, in the magazine voice, always a way back. */
function BrowseEmpty({
  query,
  craftLabel,
  reduce,
  onReset,
}: {
  query: string;
  craftLabel: string;
  reduce: boolean;
  onReset: () => void;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.7)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-24 text-center"
    >
      <span className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-ink-raise text-marigold">
        <Compass size={30} />
      </span>
      <p className="meta text-bone-dim">
        {query ? `No maker for “${query}”` : `No ${craftLabel} yet`}
      </p>
      <h2
        className="mt-4 max-w-xl font-display font-bold leading-tight text-bone"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
      >
        We haven&rsquo;t filmed that one.
      </h2>
      <p className="mt-4 max-w-md font-ui text-base leading-relaxed text-bone/70">
        Every maker here was met and filmed by hand, so the roster grows slowly.
        Try a broader craft, or browse the whole issue &mdash; there&rsquo;s a
        good chance you&rsquo;ll meet someone you weren&rsquo;t looking for.
      </p>
      <button
        onClick={onReset}
        className="group mt-8 flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright"
      >
        <ArrowLeft
          size={18}
          weight="bold"
          className="transition-transform group-hover:-translate-x-1"
        />
        Browse every maker
      </button>
    </motion.div>
  );
}
