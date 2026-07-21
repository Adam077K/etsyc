"use client";

import Link from "next/link";
import { Film } from "@/components/chrome/Film";
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
 * Cart (B7) — quiet, unpressured, grouped by the maker who makes it.
 * Hard AC: no urgency / countdown / scarcity / discount chrome anywhere.
 * Lead times are production truth, stated as plain fact.
 */

interface ResolvedLine {
  line: CartLine;
  product: MockProduct;
}

interface MakerGroup {
  maker: MockMaker;
  lines: ResolvedLine[];
}

/** Deposit/balance split applies to made-to-order lines at or above $500. */
const DEPOSIT_THRESHOLD_MINOR = 50_000;
const DEPOSIT_RATE = 0.4;

function groupByMaker(cart: CartLine[]): MakerGroup[] {
  const groups: MakerGroup[] = [];
  for (const line of cart) {
    const product = getProduct(line.productId);
    if (!product) continue; // stale line — product no longer listed
    const maker = getMaker(product.makerSlug);
    if (!maker) continue;
    const existing = groups.find((g) => g.maker.slug === maker.slug);
    if (existing) existing.lines.push({ line, product });
    else groups.push({ maker, lines: [{ line, product }] });
  }
  return groups;
}

function productionTruth(product: MockProduct): string {
  if (product.inventory.status === "made-to-order") {
    const weeks = product.inventory.leadWeeks;
    return weeks
      ? `Made for you — about ${weeks} week${weeks === 1 ? "" : "s"}`
      : "Made for you after you buy";
  }
  if (product.inventory.status === "sold-out") return "Sold out";
  // plain fact — qty stated without pressure
  const qty = product.inventory.qty;
  return qty !== undefined
    ? `In stock (${qty} on the shelf) — ships in 2–3 days`
    : "In stock — ships in 2–3 days";
}

function CartLineRow({ line, product }: ResolvedLine) {
  const { removeFromCart } = useKolSession();
  const lineTotal = product.priceMinor * line.qty;
  const splitDeposit =
    product.inventory.status === "made-to-order" && lineTotal >= DEPOSIT_THRESHOLD_MINOR;
  const depositMinor = Math.round(lineTotal * DEPOSIT_RATE);

  return (
    <li className="flex flex-wrap gap-[var(--space-3)] p-[var(--space-3)]">
      <Film
        variant={product.filmClass}
        aspect="square"
        play={false}
        className="w-24 shrink-0 self-start"
      />
      <div className="min-w-[200px] flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {/* a real heading, not a styled <p> — the cart needs a traversable
              structure for screen readers, and each line is a section of it */}
          <h3 className="font-display text-h3 text-ink">{product.title}</h3>
          <p className="font-mono text-body text-ink">{formatPrice(lineTotal)}</p>
        </div>
        <p className="mt-1 text-caption text-muted">{productionTruth(product)}</p>

        {line.customization ? (
          <div className="mt-2 rounded-md border border-line bg-ground/60 p-[var(--space-2)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Your customization
            </p>
            <p className="mt-1 text-body text-ink">{line.customization}</p>
          </div>
        ) : null}

        {splitDeposit ? (
          <div className="mt-2 rounded-md border border-line bg-ground/60 p-[var(--space-2)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Deposit &amp; balance
            </p>
            <div className="mt-1 flex items-center justify-between gap-3 text-body text-ink">
              <span>Deposit today (40%)</span>
              <span className="font-mono">{formatPrice(depositMinor)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-body text-muted">
              <span>Balance before ship</span>
              <span className="font-mono">{formatPrice(lineTotal - depositMinor)}</span>
            </div>
            <p className="mt-1 text-caption text-muted">
              The balance is charged only when the piece is finished — not before.
            </p>
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-3">
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
            Qty <span className="font-mono text-ink">{line.qty}</span>
          </span>
          <button
            type="button"
            onClick={() => removeFromCart(product.id)}
            className="text-caption text-muted underline-offset-4 transition-colors duration-state ease-kol hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function MakerGroupCard({ group, delayMs }: { group: MakerGroup; delayMs: number }) {
  const subtotal = group.lines.reduce(
    (sum, { line, product }) => sum + product.priceMinor * line.qty,
    0,
  );

  return (
    <Reveal
      as="section"
      delayMs={delayMs}
      className="overflow-hidden rounded-lg border border-line bg-surface shadow-subtle"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ground/60 px-[var(--space-3)] py-[var(--space-2)]">
        <div className="flex items-center gap-3">
          <Film
            variant={group.maker.filmClass}
            aspect="square"
            play={false}
            rounded={false}
            className="w-11 shrink-0 rounded-pill"
          />
          <div>
            <p className="font-display text-body-lg font-semibold text-ink">{group.maker.name}</p>
            <p className="text-caption text-muted">
              {group.maker.craft} · {group.maker.location}
            </p>
          </div>
        </div>
        {group.maker.verified ? (
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
            ✓ Real Maker
          </span>
        ) : null}
      </div>

      <ul className="divide-y divide-line">
        {group.lines.map((rl) => (
          <CartLineRow key={rl.line.productId} {...rl} />
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-line px-[var(--space-3)] py-[var(--space-2)]">
        <span className="text-caption uppercase tracking-[0.04em] text-muted">
          Subtotal · {group.maker.name}
        </span>
        <span className="font-mono text-body text-ink">{formatPrice(subtotal)}</span>
      </div>
    </Reveal>
  );
}

export default function CartPage() {
  const { cart } = useKolSession();
  const groups = groupByMaker(cart);
  const itemCount = groups.reduce(
    (n, g) => n + g.lines.reduce((m, { line }) => m + line.qty, 0),
    0,
  );
  const subtotal = groups.reduce(
    (sum, g) => sum + g.lines.reduce((s, { line, product }) => s + product.priceMinor * line.qty, 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      <header>
        <p className="text-caption uppercase tracking-[0.08em] text-muted">
          Cart · calm on purpose
        </p>
        <h1 className="mt-[var(--space-2)] max-w-measure font-display text-h1 text-ink [text-wrap:balance]">
          Your cart
        </h1>
        <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
          No timers, no &ldquo;someone else is looking&rdquo;. Handmade takes the time it takes.
          Everything below is grouped by the maker who makes it.
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="mt-[var(--space-6)] rounded-lg border border-dashed border-line bg-surface/60 px-[var(--space-6)] py-[var(--space-8)]">
          <p className="font-display text-h3 text-ink">Your cart is quiet.</p>
          <p className="mt-2 max-w-measure text-body text-muted">
            Nothing in here yet — the makers are still at their benches.
          </p>
          <Link
            href="/"
            className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill bg-accent px-6 py-2.5 font-medium text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
          >
            Back to Discover
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-[var(--space-4)] text-caption text-muted">
            {itemCount} item{itemCount === 1 ? "" : "s"} · {groups.length} maker
            {groups.length === 1 ? "" : "s"}
          </p>

          <div className="mt-[var(--space-2)] flex flex-col gap-[var(--space-4)]">
            {groups.map((group, i) => (
              <MakerGroupCard key={group.maker.slug} group={group} delayMs={i * STAGGER_MS} />
            ))}
          </div>

          <Reveal
            as="section"
            delayMs={groups.length * STAGGER_MS}
            className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
          >
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Summary</p>
            <div className="mt-[var(--space-2)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-body text-ink">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-body text-muted">
                <span>Shipping</span>
                <span>calculated at checkout</span>
              </div>
            </div>
            <div className="mt-[var(--space-2)] flex items-center justify-between border-t border-line pt-[var(--space-2)]">
              <span className="font-display text-h3 text-ink">Total</span>
              <span className="font-mono text-h3 text-ink">{formatPrice(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-[var(--space-3)] inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-accent-cta px-6 py-2.5 font-semibold text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
            >
              Continue to checkout
            </Link>
            <p className="mt-[var(--space-2)] text-center text-caption text-muted">
              Each maker ships their own parcel — nothing waits on the slowest piece.
            </p>
          </Reveal>
        </>
      )}
    </main>
  );
}
