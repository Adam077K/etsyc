"use client";

/**
 * Discover feed (B1) — route `/`, KOL chrome (D15a).
 * Mirrors docs/10-page-mockups/discover.html: editorial opener, mixed-size
 * magazine feed (never a uniform grid), full-bleed statement block, voice
 * card, in-situ skeleton, reshuffle. Tap → GROWN (B2) overlay; second tap →
 * WORLD_OPEN at /m/[slug].
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  feedItems,
  getMaker,
  type FeedItem,
  type FeedSize,
  type MockMaker,
} from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";

/** Magazine spans per mockup `.m-a…f` — mixed sizes, full width below md. */
const SPAN: Record<FeedSize, string> = {
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
        className="mt-3 inline-flex items-center gap-2 rounded-pill border border-dashed border-accent px-4 py-1.5 text-caption text-accent transition-colors duration-state ease-kol hover:bg-accent/10"
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
  maker: MockMaker;
  index: number;
  onGrow: (item: FeedItem) => void;
}) {
  return (
    <Reveal delayMs={(index % 4) * STAGGER_MS} className={SPAN[item.size]}>
      <Link
        href={`/m/${maker.slug}`}
        onClick={(e) => {
          // GROWN (B2): first tap expands in place; the overlay link opens the world.
          e.preventDefault();
          onGrow(item);
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

export default function DiscoverPage() {
  const [seed, setSeed] = useState(0);
  const [grown, setGrown] = useState<FeedItem | null>(null);

  const items = useMemo(() => seededShuffle(feedItems, seed), [seed]);
  const grownMaker = grown ? getMaker(grown.makerSlug) : undefined;

  // Esc returns from GROWN to the feed.
  useEffect(() => {
    if (!grown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGrown(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grown]);

  const tiles = items.flatMap((item, i) => {
    const maker = getMaker(item.makerSlug);
    if (!maker) return [];
    return [<FeedTile key={item.id} item={item} maker={maker} index={i} onGrow={setGrown} />];
  });

  return (
    <>
      {/* ============ editorial opener: a face, not a filter bar ============ */}
      <header className="mx-auto w-full max-w-page px-6 pb-10 pt-12">
        <Reveal>
          <p className="text-caption uppercase text-muted">Today on KOL · 41 makers filming</p>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {tiles.slice(0, 3)}
          <StatementBlock />
          {tiles.slice(3)}

          {/* loading state — shown in situ, skeletons match the layout */}
          <Reveal delayMs={STAGGER_MS} className="md:col-span-3">
            <div className="flex h-full flex-col justify-center rounded-md border border-line bg-surface p-4">
              <p className="text-caption uppercase text-muted">Loading state — shown in situ</p>
              <Skeleton className="mt-2 h-44 rounded-md" />
              <Skeleton className="mt-2 h-3.5 w-3/5" />
              <Skeleton className="mt-1 h-3.5 w-2/5" />
              <p className="mt-2 text-body text-muted">
                Skeletons match the real layout. Never a spinner.
              </p>
            </div>
          </Reveal>
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
      </main>

      {/* ============ GROWN (B2): tap → expand in place; tap again → world ============ */}
      {grown && grownMaker ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={grown.title}
          className="fixed inset-0 z-[60] grid place-items-center p-4 md:p-10"
        >
          <button
            type="button"
            aria-label="Back to the feed"
            onClick={() => setGrown(null)}
            className="absolute inset-0 cursor-zoom-out bg-ink/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-4xl">
            <Link
              href={`/m/${grownMaker.slug}`}
              className="block shadow-overlay transition-transform duration-enter ease-cinematic hover:scale-[1.005]"
              aria-label={`Enter ${grownMaker.name}’s world`}
            >
              <Film
                variant={grownMaker.filmClass}
                aspect="wide"
                craft={`${grownMaker.craft} · ${grownMaker.location}`}
                title={grown.title}
              >
                <p className="mt-1 text-caption text-on-media/85">
                  Playing · tap the film again to enter {grownMaker.name}’s world
                </p>
              </Film>
            </Link>
            <p className="mt-3 text-center text-caption text-on-media/80">
              Esc or tap outside to return to the feed
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
