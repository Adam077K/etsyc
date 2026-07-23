import type { Metadata } from "next";

import { FeedMagazine } from "@/components/feed/FeedMagazine";
import { FEED_CARD_ATTRIBUTE } from "@/components/grow/part-feed";
import { clipObjectPosition } from "@/components/media/focal-point";
import { PosterStill } from "@/components/media/PosterStill";
import type { FeedCard } from "@/lib/feed/select";

import { buildFixtureCards } from "./fixtures";

/**
 * /preview/feed — the layout gate's measurement surface and the
 * design-critic's screenshot rig for the magazine composition (W3-B1b).
 * Fixture-only: no engine, no DB — the composition is judged on geometry
 * and posture, not on the seed data (discovery-feed OQ-3 requires eyes-on
 * at BOTH N=4 and N=18, and staging only has 4 published worlds).
 *
 *   ?n=0..24   card count (default 18, the engine limit)
 *   ?grid=1    the NEGATIVE CONTROL — see below
 */

export const metadata: Metadata = { title: "Feed magazine harness — KOL preview" };

export default async function FeedPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; grid?: string }>;
}) {
  const { n, grid } = await searchParams;
  const parsed = Number.parseInt(n ?? "", 10);
  const count = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 24) : 18;
  const cards = buildFixtureCards(count);

  return (
    // px-0 below md, mirroring app/feed/page.tsx — the §1.6 mobile slots
    // own their own edges, so the harness must not add a page margin.
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-0 py-[var(--space-4)] md:px-[var(--space-6)]">
      {grid === "1" ? (
        <UniformGridControl cards={cards} />
      ) : (
        <FeedMagazine
          result={
            cards.length === 0
              ? { status: "empty", cards: [] }
              : { status: "success", cards }
          }
        />
      )}
    </main>
  );
}

/**
 * NEGATIVE CONTROL — deliberately the banned layout: a uniform equal-cell
 * product grid (the TikTok Shop register the product exists to reject).
 * It exists so e2e/feed-layout.spec.ts can prove its anti-grid detector
 * actually catches a grid (mutation-verification standard, DECISIONS
 * 2026-07-22): the same measurement that passes the magazine MUST fail
 * this. Never link it from product chrome; never reuse it as UI.
 */
function UniformGridControl({ cards }: { cards: FeedCard[] }) {
  return (
    <section
      aria-label="Uniform grid negative control"
      data-feed-grid-control=""
      className="grid grid-cols-3 gap-4"
    >
      {cards.map((card) => (
        <article
          key={card.videoId}
          // derived from B2's source constant — never re-typed (parting contract)
          {...{ [FEED_CARD_ATTRIBUTE]: "" }}
          data-feed-slot="GRID"
          className="min-w-0"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-ground">
            {card.poster !== null ? (
              <PosterStill
                src={card.poster}
                className="absolute inset-0 h-full w-full object-cover"
                objectPosition={clipObjectPosition({
                  focalPoint: card.focalPoint ?? undefined,
                })}
              />
            ) : null}
          </div>
          <h2 className="mt-2 font-display text-h3 font-medium">{card.makerName}</h2>
        </article>
      ))}
    </section>
  );
}
