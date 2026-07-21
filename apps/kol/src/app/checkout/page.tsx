"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import {
  formatPrice,
  getMaker,
  getProduct,
  type MockMaker,
  type MockProduct,
} from "@/lib/mock/db";
import { useKolSession, type CartLine } from "@/lib/mock/session";

/**
 * Checkout (B7) — quiet, narrow column: where it goes, how you pay.
 * Hard AC: no urgency / countdown / scarcity / discount chrome.
 * Payment is Stripe TEST MODE only — no live capture in this variant.
 */

interface ResolvedLine {
  line: CartLine;
  product: MockProduct;
}

interface MakerGroup {
  maker: MockMaker;
  lines: ResolvedLine[];
}

function groupByMaker(cart: CartLine[]): MakerGroup[] {
  const groups: MakerGroup[] = [];
  for (const line of cart) {
    const product = getProduct(line.productId);
    if (!product) continue;
    const maker = getMaker(product.makerSlug);
    if (!maker) continue;
    const existing = groups.find((g) => g.maker.slug === maker.slug);
    if (existing) existing.lines.push({ line, product });
    else groups.push({ maker, lines: [{ line, product }] });
  }
  return groups;
}

const inputClass =
  "w-full rounded-md border border-line bg-ground/40 px-3 py-2.5 text-body text-ink placeholder:text-muted transition-colors duration-state ease-kol focus:border-accent focus:outline-none";

function CheckoutInner() {
  const { cart, clearCart } = useKolSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [placing, setPlacing] = useState(false);

  const placedParam = searchParams.get("placed");
  const groups = groupByMaker(cart);
  const total = groups.reduce(
    (sum, g) => sum + g.lines.reduce((s, { line, product }) => s + product.priceMinor * line.qty, 0),
    0,
  );

  const handlePlaceOrder = () => {
    // Mock-only shortcut: the seeded order o-1041 stands in for the created
    // one. In the live build `create_order` re-reads every price server-side
    // at charge time — the client never sets price, buyer_id, or status
    // (B7 hard AC), and the charge carries a Stripe idempotency key so a
    // refresh or double-tap can never bill twice.
    setPlacing(true);
    clearCart();
    router.push("/orders/o-1041?placed=1");
  };

  if (groups.length === 0 && !placedParam && !placing) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
        <div className="rounded-lg border border-dashed border-line bg-surface/60 px-[var(--space-6)] py-[var(--space-8)]">
          <p className="font-display text-h3 text-ink">Nothing to check out.</p>
          <p className="mt-2 max-w-measure text-body text-muted">
            Your cart is empty — head back and pick something a person made.
          </p>
          <Link
            href="/cart"
            className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-6 py-2.5 text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
          >
            Back to cart
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[640px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      <header>
        <p className="text-caption uppercase tracking-[0.08em] text-muted">
          Checkout · calm on purpose
        </p>
        <h1 className="mt-[var(--space-2)] max-w-measure font-display text-h1 text-ink [text-wrap:balance]">
          Two things to settle: where it goes, and how you pay.
        </h1>
        <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
          No timers. Handmade takes the time it takes.
        </p>
      </header>

      <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-4)]">
        {/* Order summary — condensed, grouped by maker */}
        <Reveal className="rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">Order summary</p>
          <div className="mt-[var(--space-2)] flex flex-col divide-y divide-line">
            {groups.map((g) => {
              const count = g.lines.reduce((n, { line }) => n + line.qty, 0);
              const sub = g.lines.reduce(
                (s, { line, product }) => s + product.priceMinor * line.qty,
                0,
              );
              return (
                <div key={g.maker.slug} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-body text-ink">
                    {g.maker.name} · {count} item{count === 1 ? "" : "s"}
                    <span className="ml-2 text-caption text-muted">{g.maker.craft}</span>
                  </span>
                  <span className="font-mono text-body text-ink">{formatPrice(sub)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-3 py-2 text-body text-muted">
              <span>
                Shipping · {groups.length} parcel{groups.length === 1 ? "" : "s"}
              </span>
              <span>added per parcel</span>
            </div>
          </div>
          <div className="mt-[var(--space-2)] flex items-center justify-between border-t border-line pt-[var(--space-2)]">
            <span className="font-display text-h3 text-ink">Due today</span>
            <span className="font-mono text-h3 text-ink">{formatPrice(total)}</span>
          </div>
        </Reveal>

        {/* Shipping — decorative in the mock variant */}
        <Reveal
          delayMs={STAGGER_MS}
          className="rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
        >
          <p className="text-caption uppercase tracking-[0.04em] text-muted">Ship to</p>
          <form className="mt-[var(--space-2)] flex flex-col gap-2" aria-label="Shipping address">
            <input className={inputClass} placeholder="Full name" aria-label="Full name" />
            <input className={inputClass} placeholder="Street address" aria-label="Street address" />
            <div className="flex flex-wrap gap-2">
              <input className={`${inputClass} min-w-[140px] flex-1`} placeholder="City" aria-label="City" />
              <input
                className={`${inputClass} min-w-[120px] flex-1`}
                placeholder="Postcode"
                aria-label="Postcode"
              />
            </div>
            <input className={inputClass} placeholder="Country" aria-label="Country" />
          </form>
        </Reveal>

        {/* Payment — clearly test mode, disabled-looking card row */}
        <Reveal
          delayMs={STAGGER_MS * 2}
          className="rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Payment</p>
            <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption text-muted">
              Stripe TEST MODE — no real money moves
            </span>
          </div>
          <div className="mt-[var(--space-2)] flex flex-col gap-2">
            <input
              className={`${inputClass} cursor-not-allowed font-mono opacity-60`}
              disabled
              value="4242 4242 4242 4242"
              aria-label="Card number (test mode)"
              readOnly
            />
            <div className="flex gap-2">
              <input
                className={`${inputClass} cursor-not-allowed font-mono opacity-60`}
                disabled
                value="12 / 34"
                aria-label="Expiry (test mode)"
                readOnly
              />
              <input
                className={`${inputClass} cursor-not-allowed font-mono opacity-60`}
                disabled
                value="424"
                aria-label="CVC (test mode)"
                readOnly
              />
            </div>
          </div>
          <p className="mt-[var(--space-2)] text-caption text-muted">
            No live charge. Prices are re-read on the server the moment you pay — this form
            can&rsquo;t set them.
          </p>
        </Reveal>

        <Reveal delayMs={STAGGER_MS * 3}>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-accent-cta px-6 py-2.5 font-semibold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98] disabled:opacity-60"
          >
            {placing ? "Placing order…" : "Place order"}
            <span className="ml-2 font-mono">{formatPrice(total)}</span>
          </button>
          <p className="mt-[var(--space-2)] text-center text-caption text-muted">
            One press, one charge. Refresh or double-tap can&rsquo;t bill you twice.
          </p>
        </Reveal>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  );
}
