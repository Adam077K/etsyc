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
 *
 * Data seam: this reads the LIVE data layer (getData → Supabase when env is
 * present, mock otherwise) inside a browser-only effect (see src/app/page.tsx).
 * The reviewable item is derived from a DELIVERED order — there is no seeded,
 * fabricated "awaiting review" row. On an empty database there are no delivered
 * orders, so the form shows an honest "nothing to review yet" state.
 *
 * `getData().addReview` is the only write. Against Supabase a buyer INSERT
 * needs an authenticated session under RLS, so the submit is guarded: a failure
 * (e.g. no session) surfaces an honest message rather than crashing the page.
 * There is no "list my reviews" endpoint in the data layer yet, so the "already
 * posted" list echoes reviews submitted in THIS session — starting empty.
 */

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Skeleton } from "@/components/states/Skeleton";
import type { Maker, Order, Product, Review } from "@/lib/data";

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
  hasPhoto: boolean;
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

/** Label ↔ score, so the picker writes the same axis the product page reads. */
const ACCURACY_OPTIONS: { label: string; score: Review["expectationAccuracy"] }[] = [
  { label: "Better than described", score: 5 },
  { label: "Exactly as described", score: 5 },
  { label: "A little different", score: 3 },
  { label: "Not what I expected", score: 1 },
];

/** The delivered order item awaiting a review, derived from live orders. */
interface Awaiting {
  product: Product;
  maker: Maker;
  orderId: string;
  delivered: string;
  lockedVariation: string;
}

const star = (filled: boolean) => (filled ? "★" : "☆");

type ReviewsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; awaiting: Awaiting | null };

/** Resolve the first delivered (stage 4) order item into a reviewable target. */
function deriveAwaiting(
  orders: Order[],
  makers: Map<string, Maker>,
  products: Map<string, Product>,
): Awaiting | null {
  for (const order of orders) {
    if (order.stage < 4) continue; // only delivered/shipped orders are reviewable
    const maker = makers.get(order.makerSlug);
    if (!maker) continue;
    for (const item of order.items) {
      const product = products.get(item.productId);
      if (!product) continue;
      const qtySuffix = item.qty > 1 ? ` (×${item.qty})` : "";
      return {
        product,
        maker,
        orderId: order.id,
        delivered: order.placed,
        lockedVariation: `${item.customization ?? "As pictured"}${qtySuffix}`,
      };
    }
  }
  return null;
}

export default function MyReviewsPage() {
  const [state, setState] = useState<ReviewsState>({ status: "loading" });
  const [stars, setStars] = useState<0 | Review["stars"]>(0);
  const [accuracy, setAccuracy] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [customization, setCustomization] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // No "list my reviews" endpoint yet — echo this session's submits, from empty.
  const [myReviews, setMyReviews] = useState<DisplayReview[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { getData } = await import("@/lib/data");
        const data = getData();
        const [orders, makerList, productList] = await Promise.all([
          data.listOrders(),
          data.listMakers(),
          data.listProducts(),
        ]);
        if (!active) return;
        const makers = new Map(makerList.map((m) => [m.slug, m]));
        const products = new Map(productList.map((p) => [p.id, p]));
        setState({ status: "ready", awaiting: deriveAwaiting(orders, makers, products) });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const awaiting = state.status === "ready" ? state.awaiting : null;
  const canPost = stars > 0 && body.trim().length > 0 && !submitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!awaiting || stars === 0 || body.trim().length === 0) return;
    const picked = ACCURACY_OPTIONS.find((o) => o.label === accuracy);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { getData } = await import("@/lib/data");
      const review = await getData().addReview({
        productId: awaiting.product.id,
        buyer: "You",
        // `verified` is never passed — it is derived server-side from the order.
        stars,
        expectationAccuracy: picked?.score ?? 5,
        body: body.trim(),
        variation: awaiting.lockedVariation, // locked from the order, never typed
        ...(customization.trim() ? { customization: customization.trim() } : {}),
        hasPhoto,
        when: "just now",
      });
      // Echo the returned review into the "already posted" list.
      setMyReviews((prev) => [
        {
          id: review.id,
          productTitle: awaiting.product.title,
          productHref: `/m/${awaiting.product.makerSlug}/p/${awaiting.product.id}`,
          makerName: awaiting.maker.name,
          stars: review.stars,
          accuracyLabel: ACCURACY_FROM_SCORE[review.expectationAccuracy] ?? "As described",
          body: review.body,
          ...(review.variation ? { variation: review.variation } : {}),
          ...(review.customization ? { customization: review.customization } : {}),
          hasPhoto: review.hasPhoto,
          ...(review.makerResponse ? { makerResponse: review.makerResponse } : {}),
          when: review.when,
        },
        ...prev,
      ]);
      setStars(0);
      setAccuracy(null);
      setBody("");
      setHasPhoto(false);
      setCustomization("");
      setConfirmation(
        `Posted — thank you. It's tied to order #${awaiting.orderId} and now lives on the product page.`,
      );
    } catch {
      // RLS rejects an unauthenticated insert — say so plainly, never crash.
      setErrorMsg(
        "Couldn't post your review. Posting a verified review needs you to be signed in to the account that placed the order.",
      );
    } finally {
      setSubmitting(false);
    }
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

      {/* ================= WRITE A REVIEW — from a delivered order item ================= */}
      <section aria-label="Write a review" className="pt-[var(--space-6)]">
        {state.status === "loading" ? (
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-4 h-10 w-1/2" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
        ) : state.status === "error" ? (
          <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <p className="text-caption uppercase text-muted">Couldn&rsquo;t load your orders</p>
            <p className="mt-2 max-w-measure text-body text-ink">
              We couldn&rsquo;t reach your orders to find what&rsquo;s ready to review. Refresh
              the page to try again.
            </p>
          </div>
        ) : !awaiting ? (
          <div className="rounded-lg border border-dashed border-line bg-surface p-6">
            <p className="font-display text-h3 text-ink">Nothing to review yet</p>
            <p className="mt-2 max-w-measure text-body text-muted">
              A review is tied to a delivered order — that&rsquo;s what makes it verified. When
              something you bought arrives, it shows up here, ready for your words.
            </p>
            <Link
              href="/orders"
              className="mt-4 inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 text-caption uppercase text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              See your orders →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-ground px-4 py-3">
              <div>
                <p className="text-body-lg text-ink">
                  {awaiting.maker.name} · {awaiting.product.title}
                </p>
                <p className="text-caption text-muted">
                  Delivered {awaiting.delivered} · #{awaiting.orderId}
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
                <div
                  className="mt-1 flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Star rating"
                >
                  {([1, 2, 3, 4, 5] as Review["stars"][]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setStars(n)}
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center text-h3 transition-colors duration-tap ease-kol ${
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
                      key={opt.label}
                      type="button"
                      aria-pressed={accuracy === opt.label}
                      onClick={() => setAccuracy(opt.label)}
                      className={`inline-flex min-h-11 items-center rounded-pill border px-4 text-caption transition-colors duration-state ease-kol ${
                        accuracy === opt.label
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-line bg-surface text-muted hover:text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* variation — LOCKED to the purchased variation */}
              <div>
                <p className="text-caption uppercase text-muted">Exact variation you received</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-pill border border-line bg-ground px-4 py-1.5 text-caption text-ink">
                    {awaiting.lockedVariation}
                  </span>
                  <span className="text-caption text-muted">from your order · not editable</span>
                </div>
              </div>

              {/* customization context (B6+) — optional, buyer-authored */}
              <div>
                <label
                  htmlFor="review-customization"
                  className="text-caption uppercase text-muted"
                >
                  Anything made differently for you?
                </label>
                <input
                  id="review-customization"
                  value={customization}
                  onChange={(e) => setCustomization(e.target.value)}
                  placeholder="e.g. sized up, matched to a set, custom glaze depth"
                  className="mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted"
                />
                <p className="mt-1 text-caption text-muted">
                  Optional. Helps the next buyer read your rating in context.
                </p>
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
                  {/* dropzone stays decorative — it only records that media rode along */}
                  <button
                    type="button"
                    aria-pressed={hasPhoto}
                    onClick={() => setHasPhoto((v) => !v)}
                    className={`inline-flex min-h-11 items-center rounded-pill border border-dashed px-4 text-caption transition-colors duration-state ease-kol ${
                      hasPhoto
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {hasPhoto ? "✓ Photo attached" : "＋ Add photo"}
                  </button>
                  <button
                    type="button"
                    aria-pressed={hasPhoto}
                    onClick={() => setHasPhoto(true)}
                    className={`inline-flex min-h-11 items-center rounded-pill border border-dashed px-4 text-caption transition-colors duration-state ease-kol ${
                      hasPhoto
                        ? "border-accent bg-accent/10 text-ink"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    ＋ Add video
                  </button>
                  <span className="text-caption text-muted">
                    optional · yours, not the maker&rsquo;s
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!canPost}
                  className="inline-flex min-h-11 items-center rounded-pill bg-accent px-6 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Posting…" : "Post review"}
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
              {errorMsg && (
                <p className="text-caption text-accent" role="alert">
                  {errorMsg}
                </p>
              )}
            </form>
          </div>
        )}
      </section>

      {/* ================= REVIEWS YOU'VE LEFT ================= */}
      <section aria-label="Reviews you've left" className="pt-[var(--space-8)]">
        <h2 className="font-display text-h2 text-ink">Already posted</h2>
        {myReviews.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-line bg-surface p-6">
            <p className="font-display text-h3 text-ink">No reviews yet</p>
            <p className="mt-2 max-w-measure text-body text-muted">
              Reviews you post appear here and on the product page. Once you review a delivered
              order, it lands right here.
            </p>
          </div>
        ) : (
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
                  {r.customization && (
                    <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
                      Made for you: <b className="text-ink">{r.customization}</b>
                    </span>
                  )}
                </div>

                {r.hasPhoto && (
                  <p className="mt-2 text-caption text-muted">Your photo is attached</p>
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
                    className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                  >
                    View on product ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
