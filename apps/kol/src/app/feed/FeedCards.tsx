import Link from "next/link";

import { clipObjectPosition } from "@/components/media/focal-point";
import { PosterStill } from "@/components/media/PosterStill";
import type {
  FeedCard,
  FeedCardAspect,
  FeedResult,
} from "@/lib/feed/select";

/**
 * Data-layer presentational shell (W3-B1a). Renders every FeedResult state
 * with real content — success (one card per maker, engine order), empty
 * (warm invitation, discovery-feed AC) and error (quiet retry, never
 * blank). B1b REPLACES this file with the magazine composition; the seam is
 * the FeedResult contract in lib/feed/select.ts, which stays.
 *
 * Deliberately NOT here (B1b's unit): the mixed-size span pattern, the
 * Focus Film layer, ambient loops, grow-to-GROWN. Building any of it here
 * creates a merge conflict with B1b.
 */

const ASPECT_CLASS: Record<FeedCardAspect, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "16:9": "aspect-video",
};

export function FeedCards({ result }: { result: FeedResult }) {
  if (result.status === "error") {
    return (
      <section
        aria-label="Feed unavailable"
        className="flex flex-col gap-[var(--space-2)]"
      >
        <h1 className="max-w-[16ch] font-display text-display-hero [text-wrap:balance]">
          The feed couldn&rsquo;t load.
        </h1>
        <p className="max-w-measure text-body-lg text-muted">
          Something went wrong on our side — the makers are still here.
        </p>
        <Link
          href="/feed"
          className="font-text text-caption uppercase tracking-[0.04em] text-muted underline-offset-4 hover:underline"
        >
          Try again
        </Link>
      </section>
    );
  }

  if (result.status === "empty" || result.cards.length === 0) {
    return (
      <section
        aria-label="No makers yet"
        className="flex flex-col gap-[var(--space-2)]"
      >
        <h1 className="max-w-[16ch] font-display text-display-hero [text-wrap:balance]">
          The makers are on their way.
        </h1>
        <p className="max-w-measure text-body-lg text-muted">
          KOL is meeting its first makers now. Come back soon to meet people
          who make things — on film, in their own words.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Makers on film" className="flex flex-col gap-[var(--space-4)]">
      {/* Honest live count (discovery-feed AC: never a fabricated number). */}
      <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
        {result.cards.length} people who make things
      </p>
      <ul className="flex list-none flex-col gap-[var(--space-4)] p-0">
        {result.cards.map((card) => (
          <li key={card.videoId}>
            <FeedCardItem card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeedCardItem({ card }: { card: FeedCard }) {
  const detailLine = [card.craft, card.place].filter(Boolean).join(" · ");
  return (
    <article className="overflow-hidden rounded-md border border-line bg-surface">
      <div
        className={`relative w-full overflow-hidden bg-ground ${ASPECT_CLASS[card.aspect]}`}
      >
        {card.poster !== null && (
          <PosterStill
            src={card.poster}
            className="absolute inset-0 h-full w-full object-cover"
            objectPosition={clipObjectPosition({
              focalPoint: card.focalPoint ?? undefined,
            })}
          />
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        {card.avatarUrl !== null && (
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-pill bg-ground">
            <PosterStill
              src={card.avatarUrl}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </span>
        )}
        <div className="flex flex-col">
          <h2 className="font-display text-title">{card.makerName}</h2>
          {detailLine !== "" && (
            <p className="font-text text-caption uppercase tracking-[0.04em] text-muted">
              {detailLine}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
