import Link from "next/link";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { formatPrice, getMaker, getProduct, orders, orderStages } from "@/lib/mock/db";

/**
 * Orders index (B9) — the order stays a relationship, not a receipt.
 * Stage is a plain chip; no progress-bar theatre, no urgency chrome.
 */

export const metadata = { title: "Orders — KOL" };

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      <header>
        <p className="text-caption uppercase tracking-[0.08em] text-muted">
          Your orders · someone is making these by hand
        </p>
        <h1 className="mt-[var(--space-2)] max-w-measure font-display text-h1 text-ink [text-wrap:balance]">
          Not a status bar. A person, mid-work.
        </h1>
      </header>

      {orders.length === 0 ? (
        <div className="mt-[var(--space-6)] rounded-lg border border-dashed border-line bg-surface/60 px-[var(--space-6)] py-[var(--space-8)]">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            No orders yet — meet some makers first
          </p>
          <p className="mt-[var(--space-1)] font-display text-h3 text-ink">
            Nothing on the bench yet.
          </p>
          <p className="mt-2 max-w-measure text-body text-muted">
            When you buy, this is where you&rsquo;ll watch it get made — updates and photos from
            the maker, not just a tracking number.
          </p>
          <Link
            href="/"
            className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill bg-accent px-6 py-2.5 font-medium text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
          >
            Find a maker
          </Link>
        </div>
      ) : (
        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
          {orders.map((order, i) => {
            const maker = getMaker(order.makerSlug);
            const stageLabel = orderStages[order.stage] ?? "Accepted";
            const itemsSummary = order.items
              .map((item) => {
                const product = getProduct(item.productId);
                const title = product?.title ?? item.productId;
                return item.qty > 1 ? `${title} ×${item.qty}` : title;
              })
              .join(" · ");

            return (
              <Reveal key={order.id} delayMs={i * STAGGER_MS}>
                <Link
                  href={`/orders/${order.id}`}
                  className="block rounded-lg border border-line bg-surface p-[var(--space-3)] shadow-subtle transition-colors duration-state ease-kol hover:border-accent"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {maker ? (
                      <Film
                        variant={maker.filmClass}
                        aspect="square"
                        play={false}
                        rounded={false}
                        className="w-11 shrink-0 rounded-pill"
                      />
                    ) : null}
                    <div className="min-w-[200px] flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-display text-h3 text-ink">
                          {maker?.name ?? order.makerSlug} · {itemsSummary}
                        </p>
                        <span className="text-caption text-muted">#{order.id}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-pill border border-line bg-ground px-3 py-0.5 text-caption text-ink">
                          {stageLabel}
                        </span>
                        {maker ? (
                          <span className="text-caption text-muted">{maker.craft}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-[var(--space-2)] flex items-center justify-between border-t border-line pt-[var(--space-2)]">
                    <span className="text-body text-muted">Placed {order.placed}</span>
                    <span className="font-mono text-body text-ink">
                      {formatPrice(order.totalMinor)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </main>
  );
}
