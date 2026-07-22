"use client";

/**
 * Discover feed (B1) — route `/`, KOL chrome (D15a).
 * Mirrors docs/10-page-mockups/discover.html: editorial opener, mixed-size
 * magazine feed (never a uniform grid), full-bleed statement block, voice
 * card, in-situ skeleton, reshuffle. Tap → GROWN (B2); the film itself lives
 * in HeroPlayer (root layout) so it survives the hop to WORLD_OPEN at
 * /m/[slug] without ever remounting (P4).
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FeedItem, Maker } from "@/lib/data";
import { Film } from "@/components/chrome/Film";
import { useHeroPlayer } from "@/components/chrome/HeroPlayer";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";

/** Magazine spans per mockup `.m-a…f` — mixed sizes, full width below md. */
const SPAN: Record<FeedItem["size"], string> = {
  a: "md:col-span-3",
  b: "md:col-span-2",
  c: "md:col-span-4",
  d: "md:col-span-2",
  e: "md:col-span-3",
  f: "md:col-span-6",
};

/** Deterministic Fisher–Yates: seed 0 = authored order (hydration-safe). */
function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  if (seed === 0) return out;
  let s = (seed * 2654435761) >>> 0 || 1;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = out[i];
    const b = out[j];
    if (a !== undefined && b !== undefined) {
      out[i] = b;
      out[j] = a;
    }
  }
  return out;
}

function NoorVoiceCard() {
  return (
    <div className="mt-2 rounded-md border border-line bg-surface p-4 shadow-subtle">
      <span className="inline-block rounded-pill border border-line bg-ground px-2.5 py-0.5 text-caption text-ink">
        ✓ Real Maker
      </span>
      <p className="mt-2 max-w-measure text-body text-ink">
        “The vat tells you when it’s ready. You can smell it before you see it.”
      </p>
      {/* decorative — voice playback arrives with real footage (D12, Phase 7) */}
      <button
        type="button"
        aria-disabled="true"
        title="Voice playback arrives with real maker footage"
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-pill border border-dashed border-accent px-4 text-caption text-accent transition-colors duration-state ease-kol hover:bg-accent/10"
      >
        <span aria-hidden className="flex items-end gap-[3px]">
          {[6, 12, 8, 14, 5].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-pill bg-accent"
              style={{ height: `${h}px` }}
            />
          ))}
        </span>
        Hear Noor say it
      </button>
    </div>
  );
}

function FeedTile({
  item,
  maker,
  index,
  onGrow,
}: {
  item: FeedItem;
  maker: Maker;
  index: number;
  onGrow: (makerSlug: string) => void;
}) {
  return (
    <Reveal delayMs={(index % 4) * STAGGER_MS} className={SPAN[item.size]}>
      <Link
        href={`/m/${maker.slug}`}
        onClick={(e) => {
          // GROWN (B2): first tap grows the persistent film in place — the
          // world is the *second* step, opened from the player itself.
          e.preventDefault();
          onGrow(maker.slug);
        }}
        className="group block"
        aria-label={`Play — ${item.title}`}
      >
        <Film
          variant={maker.filmClass}
          aspect={item.aspect}
          craft={`${maker.craft} · ${maker.location}`}
          title={item.title}
          className="transition-transform duration-state ease-kol group-hover:scale-[1.01]"
        />
      </Link>
      {item.id === "f2" ? <NoorVoiceCard /> : null}
    </Reveal>
  );
}

/** Full-bleed terracotta statement block — brave colour at ground scale. */
function StatementBlock() {
  return (
    <Reveal className="md:col-span-6">
      <div className="rounded-lg bg-block-a px-8 py-10 text-on-block-a md:px-12 md:py-16">
        <p className="text-caption uppercase opacity-80">Why you can believe this</p>
        <h2 className="mt-2 max-w-[16ch] font-display text-display [text-wrap:balance]">
          You hear the voice before you see the price.
        </h2>
        <p className="mt-4 max-w-measure text-body-lg opacity-90">
          Every maker on KOL is anchored to their own recorded voice. Not a logo, not a
          badge we sell — a person you can listen to.
        </p>
        <Link
          href="/m/noor/p/shibori-throw"
          className="mt-6 inline-block rounded-pill border border-current px-5 py-2 text-body transition-colors duration-state ease-kol hover:bg-on-block-a/10"
        >
          See how trust works
        </Link>
      </div>
    </Reveal>
  );
}

/** Loading — skeletons matched to the magazine layout, never a spinner. */
function FeedSkeletonGrid() {
  const spans = [
    "md:col-span-3",
    "md:col-span-2",
    "md:col-span-4",
    "md:col-span-2",
    "md:col-span-3",
    "md:col-span-6",
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6" aria-hidden="true">
      {spans.map((span, i) => (
        <div key={i} className={span}>
          <div className="flex h-full flex-col rounded-md border border-line bg-surface p-4">
            <Skeleton className="h-44 rounded-md" />
            <Skeleton className="mt-3 h-3.5 w-3/5" />
            <Skeleton className="mt-1 h-3.5 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty — a fresh, seedless database. The honest "nobody has filmed yet". */
function FeedEmpty() {
  return (
    <Reveal>
      <div className="rounded-lg border border-dashed border-line bg-surface/60 px-8 py-16 text-center">
        <p className="text-caption uppercase text-muted">Nothing filmed yet</p>
        <p className="mt-2 font-display text-h2 text-ink">No makers yet.</p>
        <p className="mx-auto mt-3 max-w-measure text-body text-muted">
          No maker has filmed for KOL yet. The moment the first workshop goes live, their
          film opens here — never a grid of stock photos in the meantime.
        </p>
      </div>
    </Reveal>
  );
}

/** Error — inline, calm, no error chrome. */
function FeedError() {
  return (
    <Reveal>
      <div className="rounded-md border border-line bg-surface px-6 py-12 text-center">
        <p className="text-caption uppercase text-muted">Couldn’t load the feed</p>
        <p className="mx-auto mt-2 max-w-measure text-body text-ink">
          Something went wrong reaching the makers. Refresh the page to try again.
        </p>
      </div>
    </Reveal>
  );
}

type FeedState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; feed: FeedItem[]; makers: Map<string, Maker> };

export default function DiscoverPage() {
  const [seed, setSeed] = useState(0);
  // The feed declares no stage of its own: the film is entered by tapping a
  // tile and left via the player's own dismiss, so nothing here can reset it.
  const { setHero } = useHeroPlayer();

  // Live data (getData → Supabase when env is present, mock otherwise). Same
  // FeedItem/Maker shapes as before, so only the source and the async wrapper
  // change; the magazine JSX below is untouched.
  const [state, setState] = useState<FeedState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        // Lazy import keeps the data seam (and its server-only Supabase branch)
        // out of this client component's SSR module graph — useEffect is
        // browser-only, so the module resolves to the browser client here.
        const { getData } = await import("@/lib/data");
        const data = getData();
        const [feed, makerList] = await Promise.all([data.listFeed(), data.listMakers()]);
        if (!active) return;
        setState({
          status: "ready",
          feed,
          makers: new Map(makerList.map((m) => [m.slug, m])),
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(
    () => seededShuffle(state.status === "ready" ? state.feed : [], seed),
    [state, seed],
  );

  const grow = (makerSlug: string) => setHero({ stage: "grown", makerSlug });

  const tiles =
    state.status === "ready"
      ? items.flatMap((item, i) => {
          const maker = state.makers.get(item.makerSlug);
          if (!maker) return [];
          return [<FeedTile key={item.id} item={item} maker={maker} index={i} onGrow={grow} />];
        })
      : [];

  const isEmpty = state.status === "ready" && tiles.length === 0;
  // Honest count: how many distinct makers are actually on film right now.
  const makerCount =
    state.status === "ready" ? new Set(items.map((it) => it.makerSlug)).size : 0;

  return (
    <>
      {/* ============ editorial opener: a face, not a filter bar ============ */}
      <header className="mx-auto w-full max-w-page px-6 pb-10 pt-12">
        <Reveal>
          <p className="text-caption uppercase text-muted">
            {tiles.length > 0
              ? `Today on KOL · ${makerCount} ${makerCount === 1 ? "maker" : "makers"} on film`
              : "Today on KOL"}
          </p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>
          <h1 className="mt-2 max-w-measure font-display text-display [text-wrap:balance]">
            Every maker, finally heard.
          </h1>
        </Reveal>
        <Reveal delayMs={2 * STAGGER_MS}>
          <p className="mt-3 max-w-measure text-body-lg text-muted">
            No grid. No thumbnails of things. Just the people who make them — on film, in
            their own workshops, in their own words.
          </p>
        </Reveal>
      </header>

      {/* ============ the magazine feed — mixed sizes, never uniform ============ */}
      <main className="mx-auto w-full max-w-page px-6 pb-24">
        {state.status === "loading" ? (
          <FeedSkeletonGrid />
        ) : state.status === "error" ? (
          <FeedError />
        ) : isEmpty ? (
          <FeedEmpty />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {tiles.slice(0, 3)}
              <StatementBlock />
              {tiles.slice(3)}
            </div>

            <div className="mt-16 flex justify-center">
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
              >
                Reshuffle the feed
              </button>
            </div>
            <p className="mt-3 text-center text-caption text-muted">
              Different people every visit · anti-repetition holds for 50 clips
            </p>
          </>
        )}
      </main>
      {/* GROWN (B2) and everything after it is rendered by HeroPlayer, which
          is mounted above the router so the film never restarts. */}
    </>
  );
}
