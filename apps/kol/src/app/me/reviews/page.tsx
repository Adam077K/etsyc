"use client";

/**
 * /me/reviews — the buyer's own reviews + submit form (B6+).
 * Mirrors docs/10-page-mockups/reviews.html (section B).
 *
 * Trust contract honoured in the UI:
 * - "Verified purchase" is automatic — derived from a matching paid order
 *   (a GENERATED column in the real build). It is never a claimable checkbox.
 * - Star rating and expectation-accuracy are SEPARATE axes: a 5★ piece can
 *   still be "a little different than described".
 * - The exact variation is locked from the order — read-only, never typed.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getMaker, getProduct, reviews as dbReviews } from "@/lib/mock/db";

interface DisplayReview {
  id: string;
  productTitle: string;
  productHref: string;
  makerName: string;
  stars: number;
  accuracyLabel: string;
  body: string;
  variation?: string;
  customization?: string;
  makerResponse?: string;
  when: string;
}

const ACCURACY_FROM_SCORE: Record<number, string> = {
  5: "Exactly as described",
  4: "Close — one small surprise",
  3: "A little different",
  2: "Noticeably different",
  1: "Not what I expected",
};

const ACCURACY_OPTIONS = [
  "Better than described",
  "Exactly as described",
  "A little different",
  "Not what I expected",
];

/* the delivered order item awaiting a review (order o-1041 in mock db) */
const AWAITING = {
  productId: "ridge-tumbler",
  orderId: "o-1041",
  delivered: "Jul 20",
  lockedVariation: "Ash glaze · pair (×2)",
};

function initialReviews(): DisplayReview[] {
  // The mock db's reviews stand in as "yours" for this prototype.
  return dbReviews.map((r) => {
    const p = getProduct(r.productId);
    const m = p ? getMaker(p.makerSlug) : undefined;
    return {
      id: r.id,
      productTitle: p?.title ?? r.productId,
      productHref: p ? `/m/${p.makerSlug}/p/${p.id}` : "/",
      makerName: m?.name ?? "",
      stars: r.stars,
      accuracyLabel: ACCURACY_FROM_SCORE[r.expectationAccuracy] ?? "As described",
      body: r.body,
      variation: r.variation,
      makerResponse: r.makerResponse,
      when: r.when,
    };
  });
}

const star = (filled: boolean) => (filled ? "★" : "☆");

export default function MyReviewsPage() {
  const [myReviews, setMyReviews] = useState<DisplayReview[]>(initialReviews);
  const [stars, setStars] = useState(0);
  const [accuracy, setAccuracy] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [customization, setCustomization] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const product = getProduct(AWAITING.productId);
  const maker = product ? getMaker(product.makerSlug) : undefined;
  const canPost = stars > 0 && body.trim().length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setMyReviews((rs) => [
      {
        id: `local-${Date.now()}`,
        productTitle: product?.title ?? AWAITING.productId,
        productHref: product ? `/m/${product.makerSlug}/p/${product.id}` : "/",
        makerName: maker?.name ?? "",
        stars,
        accuracyLabel: accuracy ?? "Exactly as described",
        body: body.trim(),
        variation: AWAITING.lockedVariation,
        customization: customization.trim() || undefined,
        when: "just now",
      },
      ...rs,
    ]);
    setStars(0);
    setAccuracy(null);
    setBody("");
    setCustomization("");
    setConfirmation(
      `Posted — thank you. It's tied to order #${AWAITING.orderId} and now lives on the product page.`,
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-[var(--space-16)]">
      <header className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">
          Reviews · verified because you bought it, not because you clicked a box
        </p>
        <h1 className="mt-2 font-display text-h1 text-ink">Your reviews</h1>
        <p className="mt-2 max-w-measure text-body-lg text-muted">
          Private to you. Each review also appears as a block on the product it belongs to —
          there is no browsable &ldquo;all reviews&rdquo; feed anywhere on KOL.
        </p>
      </header>

      {/* ================= WRITE A REVIEW — delivered order item ================= */}
      <section aria-label="Write a review" className="pt-[var(--space-6)]">
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-ground px-4 py-3">
            <div>
              <p className="text-body-lg text-ink">
                {maker?.name} · {product?.title}
              </p>
              <p className="text-caption text-muted">
                Delivered {AWAITING.delivered} · #{AWAITING.orderId}
              </p>
            </div>
            <span className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink">
              ✓ Verified · you own this
            </span>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5 p-4 md:p-5">
            {/* star picker */}
            <div>
              <p className="text-caption uppercase text-muted">Your rating</p>
              <div className="mt-1 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setStars(n)}
                    className={`text-h3 transition-colors duration-tap ease-kol ${
                      n <= stars ? "text-accent" : "text-muted hover:text-ink"
                    }`}
                  >
                    {star(n <= stars)}
                  </button>
                ))}
                <span className="ml-2 text-caption text-muted">
                  {stars > 0 ? `${stars} of 5` : "Tap to set"}
                </span>
              </div>
            </div>

            {/* expectation accuracy — deliberately separate from stars */}
            <div>
              <p className="text-caption uppercase text-muted">
                Did it match what you were told to expect?
              </p>
              <p className="mt-0.5 text-caption text-muted">
                Separate from the stars above. This is about accuracy, not quality.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACCURACY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={accuracy === opt}
                    onClick={() => setAccuracy(opt)}
                    className={`rounded-pill border px-4 py-1.5 text-caption transition-colors duration-state ease-kol ${
                      accuracy === opt
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* variation — LOCKED to the purchased variation */}
            <div>
              <p className="text-caption uppercase text-muted">Exact variation you received</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-pill border border-line bg-ground px-4 py-1.5 text-caption text-ink">
                  {AWAITING.lockedVariation}
                </span>
                <span className="text-caption text-muted">from your order · not editable</span>
              </div>
            </div>

            {/* customization context */}
            <div>
              <label htmlFor="customization" className="text-caption uppercase text-muted">
                Customization on your piece (optional)
              </label>
              <input
                id="customization"
                value={customization}
                onChange={(e) => setCustomization(e.target.value)}
                placeholder="e.g. matched pair from the same firing — so readers know yours was made-to-request"
                className="mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* your words */}
            <div>
              <label htmlFor="review-body" className="text-caption uppercase text-muted">
                Your words
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What arrived? How does it feel in use? Anything the next buyer should know?"
                className="mt-1 min-h-28 w-full rounded-sm border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {/* photo / video dropzone — decorative in this prototype */}
            <div>
              <p className="text-caption uppercase text-muted">Photos or video</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-pill border border-dashed border-line bg-surface px-4 py-1.5 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink"
                >
                  ＋ Add photo
                </button>
                <button
                  type="button"
                  className="rounded-pill border border-dashed border-line bg-surface px-4 py-1.5 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink"
                >
                  ＋ Add video
                </button>
                <span className="text-caption text-muted">optional · yours, not the maker&rsquo;s</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canPost}
                className="rounded-pill bg-accent px-6 py-2.5 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Post review
              </button>
              {/* automatic — never claimable */}
              <span className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink">
                ✓ Verified purchase · added automatically
              </span>
            </div>
            <p className="text-caption text-muted">
              You can&rsquo;t tick &ldquo;verified&rdquo; yourself — it&rsquo;s set by the
              system from your order.
            </p>
            {confirmation && (
              <p className="text-caption text-ink" role="status">
                {confirmation}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* ================= REVIEWS YOU'VE LEFT ================= */}
      <section aria-label="Reviews you've left" className="pt-[var(--space-8)]">
        <h2 className="font-display text-h2 text-ink">Already posted</h2>
        <div className="mt-4 flex flex-col gap-4">
          {myReviews.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-line bg-surface p-4 shadow-subtle md:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-body-lg text-ink">
                    {r.makerName} · {r.productTitle}
                  </p>
                  <p className="text-caption text-muted">Posted {r.when}</p>
                </div>
                <span className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink">
                  ✓ Verified purchase
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink">
                  {"★".repeat(r.stars)}
                  {"☆".repeat(Math.max(0, 5 - r.stars))}
                </span>
                {r.variation && (
                  <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
                    Bought: <b className="text-ink">{r.variation}</b>
                  </span>
                )}
                <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
                  Matched expectation · <b className="text-ink">{r.accuracyLabel}</b>
                </span>
              </div>

              {r.customization && (
                <p className="mt-2 text-caption text-muted">
                  Customization: {r.customization}
                </p>
              )}

              <p className="mt-3 max-w-measure text-body text-ink">{r.body}</p>

              {r.makerResponse && (
                <div className="mt-4 rounded-md border border-accent/25 bg-accent/5 p-3">
                  <p className="text-caption uppercase text-muted">
                    Maker · {r.makerName} replied
                  </p>
                  <p className="mt-1 text-body text-ink">{r.makerResponse}</p>
                </div>
              )}

              <div className="mt-3">
                <Link
                  href={r.productHref}
                  className="text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                >
                  View on product ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
