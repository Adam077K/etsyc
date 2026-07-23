"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowClockwise } from "@phosphor-icons/react";
import { MAKERS, CRAFTS, type Maker } from "@/lib/fixtures/makers";
import { stagger, rise, calm, inView } from "@/lib/motion";
import { CraftFilter, type Filter } from "./craft-filter";
import { MakerTile } from "./maker-tile";
import { QuoteSpread } from "./quote-spread";
import { StatSpread } from "./stat-spread";
import { ValuesSpread } from "./values-spread";
import { FeedSkeleton } from "./feed-skeleton";
import { FeedEmpty } from "./feed-empty";
import { ExpandedVideo } from "./expanded-video";

// Small deterministic PRNG so a shuffle is reproducible from a seed — the feed
// reshuffle is HONEST: a returning visitor gets a genuinely different-but-stable
// arrangement (seeded by an incrementing per-session visit count), not a coin
// flip that might land the same deck twice.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

// A stable numeric hash for the active filter so each craft/value pins a
// distinct base arrangement within a single visit.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const craftLabel = (f: Filter) =>
  f === "all" ? "makers" : CRAFTS.find((c) => c.id === f)?.label ?? "makers";

// The featured maker of this issue — pinned to the front of the UNFILTERED feed
// so the demo reliably opens by meeting her (she still reshuffles among her peers
// inside a craft/value filter, where a fixed pin would be dishonest). Editorial
// pinning, not a broken shuffle: magazines lead with a featured spread.
const FEATURED_ID = "two-dots";

function pinFeatured(list: Maker[]): Maker[] {
  const i = list.findIndex((m) => m.id === FEATURED_ID);
  if (i <= 0) return list;
  const featured = list[i]!;
  return [featured, ...list.slice(0, i), ...list.slice(i + 1)];
}

export function Feed() {
  const [active, setActive] = useState<Filter>("all");
  const [valueFilter, setValueFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [display, setDisplay] = useState<Maker[]>([]);
  const [nonce, setNonce] = useState(0);
  // Which visit this is (0 = first paint this session). Drives the honest
  // reshuffle seed AND the "re-deal" revisit choreography. Resolved once per
  // mount inside the load effect so SSR never touches sessionStorage.
  const [visit, setVisit] = useState(0);
  const visitRef = useRef<number | null>(null);
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
  // reshuffles each visit so a visitor sees different people (buyer journey 1):
  // the seed folds in the per-session visit count so back-nav genuinely changes
  // the room instead of coin-flipping the same deck.
  useEffect(() => {
    const t = setTimeout(() => {
      if (visitRef.current === null) {
        let v = 0;
        try {
          v = parseInt(sessionStorage.getItem("kol-feed-visit") ?? "0", 10) || 0;
          sessionStorage.setItem("kol-feed-visit", String(v + 1));
        } catch {
          /* private mode / SSR guard — fall back to a first-visit seed */
        }
        visitRef.current = v;
        setVisit(v);
      }
      const pool = valueFilter
        ? MAKERS.filter((m) => m.values.includes(valueFilter))
        : active === "all"
          ? MAKERS
          : MAKERS.filter((m) => m.craft === active);
      const seed =
        (visitRef.current + 1) * 9301 +
        nonce * 49297 +
        hashStr(valueFilter ?? active);
      const shuffled = seededShuffle(pool, seed);
      // Unfiltered issue → lead with the featured maker; filtered views keep the
      // honest reshuffle (no pin) so a craft/value filter is never gamed.
      const unfiltered = active === "all" && !valueFilter;
      setDisplay(unfiltered ? pinFeatured(shuffled) : shuffled);
      setLoading(false);
    }, 460);
    return () => clearTimeout(t);
  }, [active, valueFilter, nonce]);

  function selectFilter(f: Filter) {
    if (f === active && !valueFilter) return;
    setLoading(true);
    setValueFilter(null);
    setActive(f);
  }

  // Toggle a value filter from the ValuesSpread. Selecting a value drops any
  // craft filter (values cut across crafts); selecting the active value clears.
  function selectValue(v: string) {
    setLoading(true);
    setValueFilter((prev) => (prev === v ? null : v));
    setActive("all");
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

  const reduce = useReducedMotion();
  const isAll = active === "all" && !valueFilter;
  const revisit = visit > 0;

  // Interleave the color-blocked spreads into the full issue (never a wall of
  // tiles): pull-quote after the opening spread, the values index mid-issue, the
  // impact stat deeper in. The values spread also shows while filtering BY a
  // value so the visitor can switch or clear without scrolling back.
  const showValues = isAll || Boolean(valueFilter);
  const tiles = display.map((maker, i) => (
    <MakerTile
      key={maker.id}
      maker={maker}
      index={i}
      onOpen={() => openAt(i)}
      revisit={revisit}
    />
  ));
  const body: React.ReactNode[] = [];
  tiles.forEach((tile, i) => {
    body.push(tile);
    if (isAll && i === 3) body.push(<QuoteSpread key="quote-spread" />);
    if (showValues && i === 6)
      body.push(
        <ValuesSpread key="values-spread" active={valueFilter} onSelect={selectValue} />,
      );
    if (isAll && i === 9) body.push(<StatSpread key="stat-spread" />);
  });
  // When a value filter yields a short list, still surface the spread so the
  // control is reachable.
  if (showValues && valueFilter && display.length > 0 && display.length <= 6) {
    body.push(
      <ValuesSpread
        key="values-spread-tail"
        active={valueFilter}
        onSelect={selectValue}
      />,
    );
  }

  return (
    <section id="feed" className="mx-auto max-w-issue px-5 pb-24 pt-20 sm:px-8">
      {/* Section head — inks in on a stagger as the feed is reached, so it opens
          as an authored spread rather than snapping in cold. Copy is caption-
          level: the tiles are the content, this is the invitation. */}
      <motion.div
        variants={reduce ? calm : stagger(0.05, 0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="mb-8 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between"
      >
        <motion.h2
          variants={reduce ? calm : rise(24, 0.8)}
          className="max-w-2xl font-display font-bold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          Meet the people who make it.
        </motion.h2>
        <motion.p
          variants={reduce ? calm : rise(16, 0.7)}
          className="max-w-xs font-ui text-sm leading-relaxed text-bone/65"
        >
          Tap anyone to watch them work.
        </motion.p>
      </motion.div>

      {/* Sticky filter rail. */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-5 mb-8 bg-ink/85 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
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
              className="press group flex items-center gap-2.5 rounded-full border border-bone/25 px-7 py-3.5 font-ui text-base font-medium text-bone hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <ArrowClockwise
                size={19}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              See other makers
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
