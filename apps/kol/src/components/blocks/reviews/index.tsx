"use client";

import { Star } from "lucide-react";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { ErrorInline } from "@/components/states/ErrorInline";
import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { BlockSection, Eyebrow, type BlockProps } from "../shared";

/**
 * Review data is LIVE (reviews table, P4 backend) — not part of store-config
 * (catalog §7). The renderer will inject it; this is the wire shape the
 * component consumes until then.
 */
export interface ReviewEntry {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  body: string;
}

/**
 * Block 7 · reviews — social proof without the shopping-channel register.
 * Empty is a warm invitation; error serves cached entries when available and
 * never collapses the block jarringly.
 */
export function ReviewsBlock({
  block,
  state = "success",
  entries = [],
}: BlockProps<"reviews"> & { entries?: ReviewEntry[] }) {
  const layout = block.props.layout ?? block.variant;

  if (state === "loading") {
    return (
      <BlockSection>
        <div aria-busy="true" className="space-y-[var(--space-4)]">
          <Skeleton className="h-7 w-32" />
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-pill" />
              <SkeletonLines lines={2} className="w-full max-w-md" />
            </div>
          ))}
        </div>
      </BlockSection>
    );
  }

  if (state === "error" && entries.length === 0) {
    return (
      <BlockSection>
        <ErrorInline message="Reviews are taking a moment" onRetry={() => window.location.reload()} />
      </BlockSection>
    );
  }

  // Empty-as-invitation — a warm first-review prompt, not a void.
  if (state === "empty" || entries.length === 0) {
    return (
      <BlockSection>
        <div className="rounded-lg border border-line bg-surface px-6 py-8">
          <p className="font-display text-h3">Be the first to review</p>
          <p className="mt-1 max-w-measure text-body text-muted">
            Bought something here? Tell the next person what it&rsquo;s like to live with.
          </p>
        </div>
      </BlockSection>
    );
  }

  const average = entries.reduce((sum, r) => sum + r.rating, 0) / entries.length;

  if (layout === "featured-quote") {
    const featured = entries.reduce((a, b) => (b.rating > a.rating ? b : a), entries[0]!);
    return (
      <BlockSection>
        <figure className="mx-auto max-w-[36ch] space-y-[var(--space-3)] text-center">
          <Reveal>
            <blockquote className="font-display text-h1 [text-wrap:balance]">
              &ldquo;{featured.body}&rdquo;
            </blockquote>
          </Reveal>
          <Reveal delayMs={STAGGER_MS}>
            <figcaption className="text-caption uppercase tracking-[0.08em] text-muted">
              — {featured.author}
            </figcaption>
          </Reveal>
        </figure>
      </BlockSection>
    );
  }

  if (layout === "rating-summary") {
    return (
      <BlockSection>
        <Reveal className="flex items-baseline gap-4">
          <span className="font-mono text-display tabular-nums">{average.toFixed(1)}</span>
          <div>
            <Stars rating={Math.round(average)} />
            <p className="mt-1 text-caption text-muted">
              <span className="font-mono tabular-nums">{entries.length}</span>{" "}
              {entries.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </Reveal>
      </BlockSection>
    );
  }

  // list — chronological, quiet
  return (
    <BlockSection>
      <Eyebrow className="mb-[var(--space-4)]">
        Reviews · <span className="font-mono tabular-nums">{entries.length}</span>
      </Eyebrow>
      <ul className="divide-y divide-line">
        {entries.map((review, i) => (
          <Reveal as="li" key={review.id} delayMs={STAGGER_MS * i} className="py-[var(--space-3)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-ink">{review.author}</p>
              <Stars rating={review.rating} />
            </div>
            <p className="mt-1 text-caption text-muted">{review.date}</p>
            <p className="mt-2 max-w-measure text-body text-muted">{review.body}</p>
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "h-4 w-4",
            n <= rating ? "fill-accent text-accent" : "fill-transparent text-line",
          )}
        />
      ))}
    </span>
  );
}
