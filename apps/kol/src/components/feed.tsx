"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowClockwise } from "@phosphor-icons/react";
import { MAKERS, CRAFTS, type Maker } from "@/lib/fixtures/makers";
import { CraftFilter, type Filter } from "./craft-filter";
import { MakerTile } from "./maker-tile";
import { QuoteSpread } from "./quote-spread";
import { StatSpread } from "./stat-spread";
import { FeedSkeleton } from "./feed-skeleton";
import { FeedEmpty } from "./feed-empty";
import { ExpandedVideo } from "./expanded-video";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

const craftLabel = (f: Filter) =>
  f === "all" ? "makers" : CRAFTS.find((c) => c.id === f)?.label ?? "makers";

export function Feed() {
  const [active, setActive] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [display, setDisplay] = useState<Maker[]>([]);
  const [nonce, setNonce] = useState(0);
  // expanded-video overlay: openedId is fixed for the morph frame; browseIndex
  // pages through films while open.
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [browseIndex, setBrowseIndex] = useState(0);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of MAKERS) c[m.craft] = (c[m.craft] ?? 0) + 1;
    return c;
  }, []);

  // Resolve the current filter after a beat. `loading` is already true on mount
  // and is flipped true by the handlers below on change, so the effect never
  // sets state synchronously — it only lands the (reshuffled) result. The feed
  // reshuffles each visit so a visitor sees different people (buyer journey 1).
  useEffect(() => {
    const t = setTimeout(() => {
      const pool = active === "all" ? MAKERS : MAKERS.filter((m) => m.craft === active);
      setDisplay(shuffle(pool));
      setLoading(false);
    }, 460);
    return () => clearTimeout(t);
  }, [active, nonce]);

  function selectFilter(f: Filter) {
    if (f === active) return;
    setLoading(true);
    setActive(f);
  }

  function reshuffle() {
    setLoading(true);
    setNonce((n) => n + 1);
  }

  function openAt(i: number) {
    const m = display[i];
    if (!m) return;
    setBrowseIndex(i);
    setOpenedId(m.id);
  }

  const isAll = active === "all";

  // Interleave the color-blocked spreads into the full issue (never a wall of
  // tiles): pull-quote after the opening spread, impact stat deeper in.
  const tiles = display.map((maker, i) => (
    <MakerTile key={maker.id} maker={maker} index={i} onOpen={() => openAt(i)} />
  ));
  const body: React.ReactNode[] = [];
  tiles.forEach((tile, i) => {
    body.push(tile);
    if (isAll && i === 3) body.push(<QuoteSpread key="quote-spread" />);
    if (isAll && i === 9) body.push(<StatSpread key="stat-spread" />);
  });

  return (
    <section id="feed" className="mx-auto max-w-issue px-5 pb-24 pt-20 sm:px-8">
      {/* Section head. */}
      <div className="mb-8 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="meta text-marigold">The issue</p>
          <h2
            className="mt-4 max-w-2xl font-display font-bold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            Mixed media, reshuffled every visit.
          </h2>
        </div>
        <p className="max-w-xs font-ui text-sm leading-relaxed text-bone/65">
          Not a grid — a curated spread of makers on film and in frame. Refresh
          and the room changes.
        </p>
      </div>

      {/* Sticky filter rail. */}
      <div className="sticky top-[68px] z-30 -mx-5 mb-8 bg-ink/85 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="mx-auto max-w-issue">
          <CraftFilter active={active} onChange={selectFilter} counts={counts} />
        </div>
      </div>

      {/* Body. */}
      {loading ? (
        <FeedSkeleton />
      ) : display.length === 0 ? (
        <FeedEmpty craftLabel={craftLabel(active)} onReset={() => selectFilter("all")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-12">
            {body}
          </div>

          <div className="mt-14 flex justify-center">
            <button
              onClick={reshuffle}
              className="group flex items-center gap-2.5 rounded-full border border-bone/25 px-7 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <ArrowClockwise
                size={19}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              Reshuffle the issue
            </button>
          </div>
        </>
      )}

      {/* expanded-video overlay (shared-element morph from the tapped tile). */}
      <AnimatePresence>
        {openedId && (
          <ExpandedVideo
            list={display}
            openedId={openedId}
            index={browseIndex}
            onIndex={setBrowseIndex}
            onClose={() => setOpenedId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
