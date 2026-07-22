"use client";

/**
 * For You (B1 + P6+) — route `/for-you`, KOL chrome (D15a).
 * Mirrors docs/10-page-mockups/for-you.html: same magazine surface as
 * Discover, relationship-weighted. Ranking reads ONLY the buyer's own
 * signals (follows/saves here, live from the session store) — popularity
 * is never a term in the score. No signals → the empty state, not a feed.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeedItem, Maker } from "@/lib/data";
import { useKolSession, type KolSession } from "@/lib/mock/session";
import { Film } from "@/components/chrome/Film";
import { useHeroPlayer } from "@/components/chrome/HeroPlayer";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";

const SPAN: Record<FeedItem["size"], string> = {
  a: "md:col-span-3",
  b: "md:col-span-2",
  c: "md:col-span-4",
  d: "md:col-span-2",
  e: "md:col-span-3",
  f: "md:col-span-6",
};

/**
 * Reason caption for a tile: the engine's stored reason first, but never a
 * stale "Because you follow…" if the follow was undone this session; then a
 * live follow-based fallback; then honest fresh-discovery framing.
 */
function reasonFor(
  item: FeedItem,
  maker: Maker,
  session: KolSession,
  reasons: Record<string, string | null>,
): string {
  const mapped = reasons[item.id];
  if (mapped) {
    const staleFollow = mapped.startsWith("Because you follow") && !session.isFollowing(maker.slug);
    if (!staleFollow) return mapped;
  }
  if (session.isFollowing(maker.slug)) return `Because you follow ${maker.name}`;
  return "New to you · kept in so your feed doesn’t ossify";
}

function SignalChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-line bg-ground px-3 py-1 text-caption text-ink">
      {children}
    </span>
  );
}

type ForYouState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      feed: FeedItem[];
      makers: Map<string, Maker>;
      reasons: Record<string, string | null>;
    };

export default function ForYouPage() {
  const session = useKolSession();
  // Same handoff as Discover: a tap grows the persistent film (B2), it does
  // not jump straight to the world.
  const { setHero } = useHeroPlayer();

  // Live data (getData → Supabase when env is present). The buyer's own signals
  // (follows/saves) still come from the session store — only the maker/feed
  // catalogue moved to the seam. Ranking never reads popularity, as before.
  const [state, setState] = useState<ForYouState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        // Lazy import keeps the data seam out of this client component's SSR
        // graph (useEffect is browser-only → the browser Supabase client).
        const { getData } = await import("@/lib/data");
        const data = getData();
        const [feed, makerList] = await Promise.all([data.listFeed(), data.listMakers()]);
        const reasonPairs = await Promise.all(
          feed.map(async (item) => [item.id, await data.forYouReason(item.id)] as const),
        );
        if (!active) return;
        setState({
          status: "ready",
          feed,
          makers: new Map(makerList.map((m) => [m.slug, m])),
          reasons: Object.fromEntries(reasonPairs),
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const makerCount = state.status === "ready" ? state.makers.size : 0;
  const followedNames =
    state.status === "ready"
      ? session.follows
          .map((slug) => state.makers.get(slug)?.name)
          .filter((n): n is string => typeof n === "string")
      : [];
  const hasSignals = session.follows.length > 0 || session.saves.length > 0;
  const unknownCount = Math.max(0, makerCount - session.follows.length);

  // Relationship-first ordering: followed makers' clips lead; stable sort
  // keeps the authored magazine rhythm within each group.
  const ordered =
    state.status === "ready"
      ? [...state.feed].sort(
          (a, b) =>
            Number(session.isFollowing(b.makerSlug)) - Number(session.isFollowing(a.makerSlug)),
        )
      : [];

  const tiles =
    state.status === "ready"
      ? ordered.flatMap((item, i) => {
          const maker = state.makers.get(item.makerSlug);
          if (!maker) return [];
          return [
            <Reveal key={item.id} delayMs={(i % 4) * STAGGER_MS} className={SPAN[item.size]}>
              <Link
                href={`/m/${maker.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  setHero({ stage: "grown", makerSlug: maker.slug });
                }}
                aria-label={`Play — ${item.title}`}
                className="group block"
              >
                <Film
                  variant={maker.filmClass}
                  aspect={item.aspect}
                  craft={`${maker.craft} · ${maker.location}`}
                  title={item.title}
                  className="transition-transform duration-state ease-kol group-hover:scale-[1.01]"
                />
              </Link>
              <p className="mt-1.5 inline-block rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">
                {reasonFor(item, maker, session, state.reasons)}
              </p>
            </Reveal>,
          ];
        })
      : [];

  const noMakers = state.status === "ready" && makerCount === 0;

  return (
    <>
      {/* ============ tabs: one surface, two feeds ============ */}
      <div className="mx-auto w-full max-w-page px-6 pt-6">
        <div role="tablist" aria-label="Feed" className="flex gap-2">
          <Link
            role="tab"
            aria-selected={false}
            href="/"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink"
          >
            Discover
          </Link>
          <Link
            role="tab"
            aria-selected={true}
            href="/for-you"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-4 text-caption font-semibold text-accent-ink"
          >
            For You
          </Link>
        </div>
      </div>

      {/* ============ editorial opener ============ */}
      <header className="mx-auto w-full max-w-page px-6 pb-8 pt-8">
        <Reveal>
          <p className="text-caption uppercase text-muted">
            Your feed · {session.follows.length}{" "}
            {session.follows.length === 1 ? "maker" : "makers"} you know
            {state.status === "ready" ? `, ${unknownCount} you don’t yet` : ""}
          </p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>
          <h1 className="mt-2 max-w-measure font-display text-display [text-wrap:balance]">
            The people you keep coming back to.
          </h1>
        </Reveal>
        <Reveal delayMs={2 * STAGGER_MS}>
          <p className="mt-3 max-w-measure text-body-lg text-muted">
            This is not what’s popular. Nothing here ranks because a crowd liked it — it
            ranks because <em>you</em> followed, asked, saved or bought. A maker everyone
            loves gets no boost in your feed until you meet them.
          </p>
        </Reveal>
      </header>

      {state.status === "loading" ? (
        /* ============ loading — skeletons matched to the feed layout ============ */
        <main className="mx-auto w-full max-w-page px-6 pb-24">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6" aria-hidden="true">
            {["md:col-span-3", "md:col-span-2", "md:col-span-4", "md:col-span-3"].map(
              (span, i) => (
                <div key={i} className={span}>
                  <Skeleton className="h-44 rounded-md" />
                  <Skeleton className="mt-2 h-3.5 w-2/5 rounded-pill" />
                </div>
              ),
            )}
          </div>
        </main>
      ) : state.status === "error" ? (
        /* ============ error — inline, calm ============ */
        <main className="mx-auto w-full max-w-page px-6 pb-24">
          <div className="rounded-md border border-line bg-surface px-6 py-12 text-center">
            <p className="text-caption uppercase text-muted">Couldn’t load your feed</p>
            <p className="mx-auto mt-2 max-w-measure text-body text-ink">
              Something went wrong reaching the makers. Refresh the page to try again.
            </p>
          </div>
        </main>
      ) : noMakers ? (
        /* ============ empty database — no makers on KOL yet ============ */
        <main className="mx-auto w-full max-w-page px-6 pb-24">
          <Reveal>
            <div className="rounded-lg border border-dashed border-line bg-surface/60 px-8 py-16 text-center">
              <p className="text-caption uppercase text-muted">Nothing filmed yet</p>
              <p className="mt-2 font-display text-h2 text-ink">No makers yet.</p>
              <p className="mx-auto mt-3 max-w-measure text-body text-muted">
                There are no makers on KOL yet, so there is nothing to rank. Once the first
                workshop films, follow them and your feed starts here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
                >
                  Browse Discover
                </Link>
              </div>
            </div>
          </Reveal>
        </main>
      ) : !hasSignals ? (
        /* ============ empty state — signed out or brand new ============ */
        <main className="mx-auto w-full max-w-page px-6 pb-24">
          <Reveal>
            <div className="rounded-lg border border-dashed border-line bg-surface/60 px-8 py-16 text-center">
              <p className="text-caption uppercase text-muted">
                Empty state — signed out or brand new
              </p>
              <p className="mt-2 font-display text-h2 text-ink">Nothing to read yet.</p>
              <p className="mx-auto mt-3 max-w-measure text-body text-muted">
                For You needs a relationship to rank by. Anonymous visitors score zero — so
                we show you Discover instead until you follow someone.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
                >
                  Browse Discover
                </Link>
                <Link
                  href="/welcome"
                  className="rounded-pill bg-accent-cta px-6 py-2.5 text-body font-semibold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </Reveal>
        </main>
      ) : (
        <>
          {/* ============ your signals strip — live session state ============ */}
          <section className="mx-auto w-full max-w-page px-6 pb-8">
            <Reveal>
              <div className="overflow-hidden rounded-md border border-line bg-surface shadow-subtle">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-caption uppercase text-muted">Driving your feed</span>
                    <SignalChip>
                      Follows <b className="font-mono">{session.follows.length}</b>
                      {followedNames.length > 0 ? (
                        <span className="text-muted">· {followedNames.join(", ")}</span>
                      ) : null}
                    </SignalChip>
                    <SignalChip>
                      Saves <b className="font-mono">{session.saves.length}</b>
                    </SignalChip>
                  </div>
                  <Link
                    href="/settings"
                    className="inline-flex min-h-11 items-center rounded-pill border border-line px-4 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                  >
                    Tune in Settings
                  </Link>
                </div>
                <div className="border-t border-line px-4 py-3">
                  <p className="text-body text-muted">
                    Signals fade. Something you saved last week counts far more than something
                    you saved in spring — roughly a 30-day half-life, so your feed keeps
                    moving.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ============ the magazine feed — personalised, attributed ============ */}
          <main className="mx-auto w-full max-w-page px-6 pb-24">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {tiles.slice(0, 3)}

              {/* the ranking promise, stated plainly */}
              <Reveal className="md:col-span-6">
                <div className="rounded-lg bg-block-c px-8 py-10 text-on-block-c md:px-12 md:py-16">
                  <p className="text-caption uppercase opacity-80">How this feed is ordered</p>
                  <h2 className="mt-2 max-w-[18ch] font-display text-display [text-wrap:balance]">
                    Relationship, not popularity.
                  </h2>
                  <p className="mt-4 max-w-measure text-body-lg opacity-90">
                    KOL never counts how many strangers liked something. Your feed reads only
                    your own history with a maker — and nobody else’s. Sign out and it resets
                    to zero, because there is nothing to read.
                  </p>
                  <Link
                    href="/settings"
                    className="mt-6 inline-block rounded-pill border border-current px-5 py-2 text-body transition-colors duration-state ease-kol hover:bg-on-block-c/10"
                  >
                    See and edit your signals
                  </Link>
                </div>
              </Reveal>

              {tiles.slice(3)}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                href="/"
                className="rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
              >
                Show me someone new
              </Link>
            </div>
            <p className="mt-3 text-center text-caption text-muted">
              Fresh discovery is always mixed in · your favourites never take the whole feed
            </p>
          </main>
        </>
      )}
    </>
  );
}
