import { SealCheck, Check } from "@phosphor-icons/react/dist/ssr";
import type { Review } from "@/lib/fixtures/commerce";

/**
 * A review told as a short story, not a star rating (concept-lock: reject the
 * deal-grid's star clutter — D16-5 trustworthy reviews). Trust reads through a
 * verified-purchase seal and an "as described" accuracy cue, both provable.
 */
export function ReviewStory({ review }: { review: Review }) {
  return (
    <figure className="flex flex-col rounded-3xl border border-line bg-ink-soft p-7 sm:p-8">
      <blockquote className="font-serif text-xl leading-snug text-bone/90 sm:text-2xl">
        &ldquo;{review.body}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-5">
        <span className="font-ui text-sm font-semibold text-bone">
          {review.author}
        </span>
        <span aria-hidden className="text-bone-dim">
          ·
        </span>
        <span className="font-ui text-sm text-bone-dim">{review.place}</span>
        {review.verified && (
          <span className="ml-auto flex items-center gap-1.5 font-ui text-xs font-medium text-marigold">
            <SealCheck size={15} weight="fill" />
            Verified purchase
          </span>
        )}
      </figcaption>
      {review.asExpected && (
        <p className="mt-3 flex items-center gap-1.5 font-ui text-xs text-bone-dim">
          <Check size={14} weight="bold" className="text-marigold" />
          Matched the description
        </p>
      )}
    </figure>
  );
}
