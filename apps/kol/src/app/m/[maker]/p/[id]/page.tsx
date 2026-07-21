"use client";

/**
 * /m/[maker]/p/[id] — the product page (B6 decision layout + P13 Proof of
 * Product + P14 Exactly What to Expect + P11 trust badges + B12 Ask the
 * Maker + B6+ reviews), per docs/10-page-mockups/product.html.
 *
 * Surface B: still inside the maker's world (D15b) — for makers with a
 * store-config fixture the fixture's theme vars are applied at this page's
 * root so the same semantic utilities paint the maker's palette. The
 * page declares the NARRATE_SHRINK stage via useHeroStage; the persistent
 * film itself lives in HeroPlayer (root layout) and docks bottom-right
 * still playing, having never remounted since the feed (P4).
 *
 * Client page pattern: React 19 `use(params)` unwraps the Next 16 params
 * Promise so cart state lives in the same file.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";
import { Film } from "@/components/chrome/Film";
import { useHeroStage } from "@/components/chrome/HeroPlayer";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import {
  expectKeys,
  formatPrice,
  getMaker,
  getProduct,
  questions,
  type MockMaker,
  type MockProduct,
  type MockQA,
  type MockReview,
} from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";
import { useKolStore } from "@/lib/mock/store";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { themeStyle } from "@/lib/theme/apply-theme";
import { cn } from "@/lib/utils";

export default function ProductPage({
  params,
}: {
  params: Promise<{ maker: string; id: string }>;
}) {
  const { maker: makerSlug, id } = use(params);
  // Reviews come from the mutable store, so a review written in /me/reviews
  // lands here. Everything else on this page still reads the immutable seed.
  const store = useKolStore();
  const maker = getMaker(makerSlug);
  const product = getProduct(id);
  // NARRATE_SHRINK: the same film that grew on the feed moves to the corner
  // and starts narrating this piece. HeroPlayer owns the element; this only
  // declares the stage. Kept above the notFound guard so hooks stay ordered.
  useHeroStage("narrate", maker?.slug ?? null, product?.title ?? null);
  if (!maker || !product || product.makerSlug !== maker.slug) notFound();

  // Maker-world theming (D15b): fixture worlds carry their palette onto the
  // product page; stub makers fall back to app chrome (no products exist for
  // them today, but the guard keeps this route honest).
  const worldTheme =
    maker.slug === "sena"
      ? senaStore.theme
      : maker.slug === "noor"
        ? customStore.theme
        : null;

  const productQuestions = questions.filter((q) => q.productId === product.id);
  const productReviews = store.reviewsFor(product.id);

  return (
    <div
      style={worldTheme ? themeStyle(worldTheme) : undefined}
      className="min-h-screen bg-ground pb-[var(--space-16)] font-text text-body text-ink"
    >
      {/* ---- decision layout: gallery left · decision column right ---- */}
      <main className="mx-auto w-full max-w-page px-[var(--space-2)] py-[var(--space-6)] md:px-[var(--space-6)]">
        <div className="grid items-start gap-[var(--space-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          {/* gallery column */}
          <div>
            <Reveal>
              <Film
                variant={product.filmClass}
                aspect="tall"
                craft={`${product.title} · main view`}
              />
            </Reveal>
            <Reveal delayMs={STAGGER_MS} className="mt-[var(--space-2)] flex gap-[var(--space-2)]">
              <Film
                variant={product.filmClass}
                aspect="square"
                play={false}
                className="w-24 shrink-0"
              />
              <Film
                variant={maker.filmClass}
                aspect="square"
                play={false}
                className="w-24 shrink-0"
              />
            </Reveal>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              3D view falls back to this gallery when no model is present.
            </p>
          </div>

          {/* decision column */}
          <DecisionColumn maker={maker} product={product} />
        </div>
      </main>

      {/* ---- P13 · Proof of Product ---- */}
      <Section>
        <div className="mb-[var(--space-2)] flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-h2">Proof of Product</h2>
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
            Maker-declared — not third-party verified
          </span>
        </div>
        <div className="divide-y divide-line rounded-md border border-line bg-surface px-[var(--space-3)]">
          <ProvenanceRow label={`${maker.name}'s exact role`} value={product.provenance.role} />
          <ProvenanceRow label="Materials" value={product.provenance.materials} />
          <ProvenanceRow label="Process" value={product.provenance.process} />
          <ProvenanceRow label="Production location" value={product.provenance.location} />
          <ProvenanceRow label="Partners" value={product.provenance.partners} />
        </div>
      </Section>

      {/* ---- P14 · Exactly what to expect (all 11 rows, always) ---- */}
      <Section>
        <h2 className="mb-[var(--space-2)] font-display text-h2">Exactly what to expect</h2>
        <dl className="divide-y divide-line rounded-md border border-line bg-surface">
          {expectKeys.map((key) => (
            <div
              key={key}
              className="flex flex-wrap items-baseline justify-between gap-x-[var(--space-4)] gap-y-1 px-[var(--space-3)] py-[var(--space-2)]"
            >
              <dt className="text-caption uppercase tracking-[0.08em] text-muted">{key}</dt>
              <dd className="max-w-measure text-right text-body">
                {product.expect[key] ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-[var(--space-2)] text-caption text-muted">
          All 11 fields present — no &ldquo;contact for details&rdquo; gaps.
        </p>
      </Section>

      {/* ---- P11 · trust badges, honest states only ---- */}
      <Section>
        <h2 className="mb-[var(--space-2)] font-display text-h2">
          Why you can trust this listing
        </h2>
        <div className="grid gap-[var(--space-3)] md:grid-cols-2">
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            {maker.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ground px-3 py-1 text-caption text-ink">
                ✓ Real Maker · voice-anchored
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ground px-3 py-1 text-caption text-muted">
                Real-Maker verification pending
              </span>
            )}
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              {maker.verified
                ? "Voice-anchored. The verification voice matches the voice in every clip on this page."
                : `${maker.name}'s filmed verification is under review. Until it clears, this badge stays pending — it never pretends.`}
            </p>
          </div>
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ground px-3 py-1 text-caption text-ink">
              ◇ AI-Transparency
            </span>
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              AI captioned the process clips and tidied this description from {maker.name}
              &rsquo;s interview. It assisted with words, not the making — and never voiced
              anything.
            </p>
          </div>
        </div>
        <p className="mt-[var(--space-2)] text-caption text-muted">
          Badges only ever show honest states — verified, AI-assisted, or pending. Never a sold
          count.
        </p>
      </Section>

      {/* ---- B12 · Ask the Maker (public, product-scoped) ---- */}
      <Section>
        <h2 className="mb-[var(--space-3)] font-display text-h2">Ask the maker</h2>
        {productQuestions.length > 0 ? (
          <div className="flex flex-col gap-[var(--space-3)]">
            {productQuestions.map((q) => (
              <QuestionCard key={q.id} q={q} makerName={maker.name} />
            ))}
          </div>
        ) : (
          <p className="max-w-measure text-body text-muted">
            No questions on this piece yet — yours would be the first. {maker.name} answers
            publicly, in text or voice.
          </p>
        )}
        <button
          type="button"
          className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
        >
          Ask a public question
        </button>
      </Section>

      {/* ---- B6+ · Reviews ---- */}
      <Section>
        <h2 className="mb-[var(--space-3)] font-display text-h2">Reviews</h2>
        {productReviews.length > 0 ? (
          <div className="flex flex-col gap-[var(--space-3)]">
            {productReviews.map((review) => (
              <ReviewCard key={review.id} review={review} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="max-w-measure text-body text-muted">
              No reviews yet — be the first. Every review here carries a verified-purchase check
              and a separate expectation-accuracy score, so &ldquo;arrived as described&rdquo; is
              measured, not assumed.
            </p>
          </div>
        )}
      </Section>

      {/* NARRATE_SHRINK dock is rendered by HeroPlayer (root layout) — the
          film is one element across feed → world → product, never remounted. */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decision column                                                     */
/* ------------------------------------------------------------------ */

function DecisionColumn({ maker, product }: { maker: MockMaker; product: MockProduct }) {
  const session = useKolSession();
  const [added, setAdded] = useState(false);
  const soldOut = product.inventory.status === "sold-out";

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div>
        <Link
          href={`/m/${maker.slug}`}
          className="text-caption uppercase tracking-[0.08em] text-muted transition-colors duration-state ease-kol hover:text-ink"
        >
          {maker.name} · {maker.craft}
        </Link>
        <h1 className="mt-1 font-display text-h1">{product.title}</h1>
      </div>

      <div className="flex flex-col gap-[var(--space-2)] rounded-md border border-line bg-surface p-[var(--space-3)]">
        {/* Price is display-only — checkout re-reads the price server-side in the live build. */}
        <span className="font-mono text-h2 text-ink">
          {formatPrice(product.priceMinor, product.currency)}
        </span>
        <p className="max-w-measure text-body">
          <InventoryTruth product={product} />
        </p>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            session.addToCart({ productId: product.id, qty: 1 });
            setAdded(true);
          }}
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-center rounded-pill px-6 text-body-lg transition-transform duration-tap ease-kol",
            soldOut
              ? "cursor-not-allowed border border-line bg-surface text-muted"
              : "bg-accent-cta text-accent-ink hover:bg-accent-cta/90 active:scale-[0.98]",
          )}
        >
          {soldOut
            ? "Sold out"
            : product.inventory.status === "made-to-order"
              ? "Add to cart · made to order"
              : "Add to cart"}
        </button>
        {added ? (
          <p className="text-body text-muted">
            Added —{" "}
            <Link
              href="/cart"
              className="text-ink underline underline-offset-4 transition-colors duration-state ease-kol hover:text-accent"
            >
              view cart →
            </Link>
          </p>
        ) : null}
      </div>

      {product.voiceoverLine ? (
        <button
          type="button"
          className="flex items-center gap-3 rounded-pill border border-dashed border-accent px-5 py-3 text-left transition-colors duration-state ease-kol hover:bg-accent/10 active:scale-[0.98]"
        >
          <Waveform />
          <span className="text-body text-ink">
            &ldquo;{product.voiceoverLine}&rdquo;
            <span className="block text-caption text-muted">
              Tap to hear {maker.name} say it
            </span>
          </span>
        </button>
      ) : null}

      <p className="max-w-measure text-body-lg">{product.description}</p>
    </div>
  );
}

function InventoryTruth({ product }: { product: MockProduct }) {
  switch (product.inventory.status) {
    case "in-stock":
      return (
        <>
          <strong>In stock</strong>
          {product.inventory.qty !== undefined ? (
            <> — {product.inventory.qty} made and ready. When they&rsquo;re gone, the wheel turns again.</>
          ) : (
            <> — made and ready.</>
          )}
        </>
      );
    case "made-to-order":
      return (
        <>
          <strong>Made to order.</strong> Each one is made after you order —
          {product.inventory.leadWeeks !== undefined ? (
            <>
              {" "}
              about <strong>{product.inventory.leadWeeks} weeks</strong> before it ships.
            </>
          ) : (
            <> the maker will confirm timing.</>
          )}{" "}
          Nothing sits in a warehouse.
        </>
      );
    case "sold-out":
      return (
        <>
          <strong>Sold out.</strong> Follow the maker to hear when the next batch lands.
        </>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Q&A + reviews                                                       */
/* ------------------------------------------------------------------ */

function QuestionCard({ q, makerName }: { q: MockQA; makerName: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
      <p className="max-w-measure text-body">
        <strong>Q.</strong> {q.question}
      </p>
      {q.answer ? (
        <>
          <p className="mt-[var(--space-1)] max-w-measure text-body">
            <strong>{makerName}:</strong> {q.answer}
          </p>
          {q.answerKind === "audio" ? (
            <button
              type="button"
              className="mt-[var(--space-2)] inline-flex items-center gap-3 rounded-pill border border-dashed border-accent px-4 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-accent/10 active:scale-[0.98]"
            >
              <Waveform />
              Hear {makerName}&rsquo;s answer{q.audioLen ? <> · {q.audioLen}</> : null}
            </button>
          ) : null}
          <p className="mt-[var(--space-2)] text-caption uppercase tracking-[0.08em] text-muted">
            Answered{q.answerKind === "audio" ? " with audio" : ""} · asked by {q.asker}
          </p>
        </>
      ) : (
        <p className="mt-[var(--space-2)] text-caption uppercase tracking-[0.08em] text-muted">
          Awaiting answer · asked by {q.asker}
        </p>
      )}
    </div>
  );
}

function ReviewCard({ review, product }: { review: MockReview; product: MockProduct }) {
  const maker = getMaker(product.makerSlug);
  return (
    <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {review.verified ? (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ground px-3 py-1 text-caption text-ink">
            ✓ Verified purchase
          </span>
        ) : null}
        <Stars value={review.stars} />
      </div>
      <p className="mt-[var(--space-1)] text-caption text-muted">
        Expectation accuracy · {review.expectationAccuracy}/5
        {review.expectationAccuracy >= 4 ? " — arrived as described" : ""}
      </p>
      <div className="mt-[var(--space-2)] flex flex-wrap items-start gap-[var(--space-3)]">
        {review.hasPhoto ? (
          <Film
            variant={product.filmClass}
            aspect="square"
            play={false}
            className="w-28 shrink-0"
            craft="Buyer photo"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="max-w-measure text-body">{review.body}</p>
          <p className="mt-1 text-caption text-muted">
            {review.buyer}
            {review.variation ? <> · {review.variation}</> : null} · {review.when}
          </p>
          {review.customization ? (
            <p className="mt-1 text-caption text-muted">
              Made differently for them: <b>{review.customization}</b>
            </p>
          ) : null}
          {review.makerResponse ? (
            <div className="mt-[var(--space-2)] rounded-md bg-accent/10 p-[var(--space-2)]">
              <p className="text-caption uppercase tracking-[0.08em] text-muted">
                {maker ? maker.name : "Maker"} replied
              </p>
              <p className="mt-1 max-w-measure text-body">{review.makerResponse}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5 stars`} className="text-body">
      <span aria-hidden className="text-accent">
        {"★".repeat(value)}
      </span>
      <span aria-hidden className="text-muted">
        {"★".repeat(Math.max(0, 5 - value))}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Section({ children }: { children: React.ReactNode }) {
  return (
    <Reveal as="section" className="mx-auto w-full max-w-3xl px-[var(--space-2)] py-[var(--space-6)] md:px-[var(--space-6)]">
      {children}
    </Reveal>
  );
}

function ProvenanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-[var(--space-2)]">
      <p className="text-caption uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-0.5 max-w-measure text-body">{value}</p>
    </div>
  );
}

/** Decorative audio waveform — bars only, no fake playback state. */
function Waveform() {
  return (
    <span aria-hidden className="flex shrink-0 items-end gap-0.5">
      {[6, 12, 8, 14, 5].map((h, i) => (
        <span
          key={i}
          className="w-0.5 rounded-pill bg-accent"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}
