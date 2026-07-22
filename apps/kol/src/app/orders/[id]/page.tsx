"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";
import type { Maker, Order, Product } from "@/lib/data";
// Pure formatters/labels only — no data reads from the mock layer.
import { formatPrice, orderStages } from "@/lib/mock/db";

/**
 * Order detail (B9) + thank-you moment (B8).
 * Hard AC (D10): the thank-you film + message are maker-authored or neutral —
 * never AI-fabricated. No synthetic voice or face, ever.
 * With ?placed=1 the thank-you leads the page; otherwise it closes it, quietly.
 *
 * Live data (getData → Supabase when env is present, mock otherwise). The order
 * is read async inside a browser-only effect (see src/app/page.tsx for the same
 * seam).
 *
 * ── Timeline degradation ────────────────────────────────────────────────────
 * The mock carried a 5-step, maker-authored production timeline in
 * `order.updates`. ADR-0001 has NO `order_updates` table and no production
 * `stage` column (only a payment/fulfilment `status` enum), so the Supabase
 * adapter returns `updates: []` and `advanceOrder()` throws `NotInSchemaError`.
 * This page therefore NEVER calls `advanceOrder`, and it degrades the timeline
 * gracefully: when there are no maker-posted updates it shows a single honest
 * status line derived from `order.stage`, and only renders the rich per-step
 * timeline when real `updates` exist. No fabricated tracking numbers, no
 * invented "approved" theatre.
 */

function ThankYouMoment({
  maker,
  order,
  prominent,
}: {
  maker: Maker;
  order: Order;
  prominent: boolean;
}) {
  // D10: with no maker-authored note yet we say so plainly. We never
  // synthesise a quote to fill the space.
  const hasNote = Boolean(order.thankYou);

  return (
    <Reveal as="section" className={prominent ? "" : "mt-[var(--space-8)]"}>
      {prominent ? (
        <p className="mb-[var(--space-2)] text-caption uppercase tracking-[0.08em] text-muted">
          {hasNote ? `Order placed · a note from ${maker.name}` : "Order placed"}
        </p>
      ) : (
        <p className="mb-[var(--space-2)] text-caption uppercase tracking-[0.04em] text-muted">
          {hasNote ? `The note ${maker.name} sent with this order` : "Your thank-you note"}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <Film
          variant={maker.filmClass}
          aspect="wide"
          rounded={false}
          craft={hasNote ? `A note from ${maker.name}` : `${maker.name} at the wheel`}
          title={prominent && hasNote ? "Thank you" : undefined}
        />
        <div className="p-[var(--space-3)]">
          {order.thankYou ? (
            <p className="max-w-measure text-body-lg text-ink">
              &ldquo;{order.thankYou}&rdquo;
              <span className="text-muted"> — {maker.name}</span>
            </p>
          ) : (
            <p className="max-w-measure text-body text-muted">
              {maker.name} will record your thank-you when this ships. Until then, this is the
              bench — and updates land here as the work moves.
            </p>
          )}
          <p className="mt-[var(--space-2)] text-caption text-muted">
            Maker-authored — never AI-generated
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/** Rich, maker-posted timeline — only rendered when real updates exist. */
function RichTimeline({ order, maker }: { order: Order; maker: Maker }) {
  return (
    <ol className="mt-[var(--space-3)]">
      {orderStages.map((label, i) => {
        const reached = i <= order.stage;
        const current = i === order.stage;
        const update = order.updates.find((u) => u.stage === i);
        const isLast = i === orderStages.length - 1;

        return (
          <li key={label} className={`relative pl-8 ${isLast ? "" : "pb-[var(--space-4)]"}`}>
            {isLast ? null : (
              <span
                aria-hidden
                className={`absolute bottom-0 left-[7px] top-5 w-px ${
                  i < order.stage ? "bg-accent" : "bg-line"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`absolute left-0 top-1 h-[15px] w-[15px] rounded-pill border ${
                reached ? "border-accent bg-accent" : "border-line bg-surface"
              }`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-body font-medium ${reached ? "text-ink" : "text-muted"}`}>
                {label}
              </p>
              {current ? (
                <span className="rounded-pill border border-line bg-ground px-2 py-0.5 text-caption text-muted">
                  now
                </span>
              ) : null}
            </div>

            {update ? (
              <div className="mt-1">
                <p className="text-caption text-muted">{update.when}</p>
                <p className="max-w-measure text-body text-ink">
                  &ldquo;{update.note}&rdquo;
                  <span className="text-muted"> — {maker.name}</span>
                </p>
              </div>
            ) : reached ? null : (
              <p className="mt-1 text-caption text-muted">
                {maker.name} posts here when the work reaches this step.
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Honest single-line status when no maker-posted timeline exists (live data). */
function SimpleStatus({ order, maker }: { order: Order; maker: Maker }) {
  const stageLabel = orderStages[order.stage] ?? "Accepted";
  const shipped = order.stage >= 4;
  return (
    <div className="mt-[var(--space-3)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink">
          {stageLabel}
        </span>
        <span className="text-caption text-muted">Current status</span>
      </div>
      <p className="mt-[var(--space-2)] max-w-measure text-body text-muted">
        {shipped
          ? `This order has shipped. ${maker.name} hasn't posted step-by-step updates for it.`
          : `${maker.name} is working on this. Step-by-step updates will appear here as the maker posts them.`}
      </p>
    </div>
  );
}

function OrderNotFound() {
  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      <div className="rounded-lg border border-dashed border-line bg-surface/60 px-[var(--space-6)] py-[var(--space-8)]">
        <p className="text-caption uppercase tracking-[0.04em] text-muted">Order not found</p>
        <p className="mt-[var(--space-1)] font-display text-h3 text-ink">
          We couldn&rsquo;t find that order.
        </p>
        <p className="mt-2 max-w-measure text-body text-muted">
          The link may be old, or the order belongs to another account. Your orders are all in
          one place.
        </p>
        <Link
          href="/orders"
          className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-6 py-2.5 text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
        >
          Back to your orders
        </Link>
      </div>
    </main>
  );
}

function OrderLoading() {
  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-3 h-8 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-[var(--space-4)]">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-4 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </div>
    </main>
  );
}

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; order: Order; maker: Maker; products: Map<string, Product> };

function OrderDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { getData } = await import("@/lib/data");
        const data = getData();
        const order = await data.getOrder(id);
        if (!active) return;
        if (!order) {
          setState({ status: "not-found" });
          return;
        }
        const [maker, productList] = await Promise.all([
          data.getMaker(order.makerSlug),
          data.listProducts(),
        ]);
        if (!active) return;
        if (!maker) {
          setState({ status: "not-found" });
          return;
        }
        setState({
          status: "ready",
          order,
          maker,
          products: new Map(productList.map((p) => [p.id, p])),
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status === "loading") return <OrderLoading />;
  if (state.status === "not-found") return <OrderNotFound />;
  if (state.status === "error") {
    return (
      <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
        <div className="rounded-lg border border-line bg-surface px-[var(--space-6)] py-[var(--space-8)]">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Couldn&rsquo;t load this order
          </p>
          <p className="mt-2 max-w-measure text-body text-ink">
            Something went wrong reaching this order. Refresh the page to try again.
          </p>
        </div>
      </main>
    );
  }

  const { order, maker, products } = state;
  const hasTimeline = order.updates.length > 0;
  const customizedItems = order.items.filter((it) => Boolean(it.customization));

  const itemsSummary = order.items
    .map((item) => {
      const product = products.get(item.productId);
      const title = product?.title ?? item.productId;
      return item.qty > 1 ? `${title} ×${item.qty}` : title;
    })
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* THANK-YOU MOMENT — leads the page right after purchase (B8) */}
      {justPlaced ? <ThankYouMoment maker={maker} order={order} prominent /> : null}

      <Reveal
        as="header"
        delayMs={justPlaced ? STAGGER_MS : 0}
        className={justPlaced ? "mt-[var(--space-6)]" : ""}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-caption uppercase tracking-[0.08em] text-muted">
              Order #{order.id} · placed {order.placed}
            </p>
            <h1 className="mt-[var(--space-1)] max-w-measure font-display text-h1 text-ink [text-wrap:balance]">
              {itemsSummary}
            </h1>
            <p className="mt-[var(--space-1)] text-body text-muted">
              {maker.name} · {maker.craft} · {maker.location}
            </p>
          </div>
          <span className="font-mono text-h3 text-ink">{formatPrice(order.totalMinor)}</span>
        </div>
      </Reveal>

      {/* PRODUCTION TIMELINE — maker-posted stages when they exist, else an
          honest single status line. Never a fabricated per-step narrative. */}
      <Reveal
        as="section"
        delayMs={STAGGER_MS * 2}
        className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
      >
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          How it&rsquo;s coming along
        </p>
        {hasTimeline ? (
          <RichTimeline order={order} maker={maker} />
        ) : (
          <SimpleStatus order={order} maker={maker} />
        )}
      </Reveal>

      {/* CUSTOMIZATION — shown only when the order actually carries a
          buyer-specified variation. No hardcoded "approved" theatre. */}
      {customizedItems.length > 0 ? (
        <Reveal
          as="section"
          delayMs={STAGGER_MS * 3}
          className="mt-[var(--space-4)] rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
        >
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Made to your spec
          </p>
          <ul className="mt-[var(--space-2)] flex flex-col gap-1">
            {customizedItems.map((it, idx) => {
              const product = products.get(it.productId);
              return (
                <li key={`${it.productId}-${idx}`} className="max-w-measure text-body text-ink">
                  {product?.title ?? it.productId}:{" "}
                  <span className="text-muted">{it.customization}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      ) : null}

      {/* quiet thank-you at the end on ordinary visits */}
      {justPlaced ? null : <ThankYouMoment maker={maker} order={order} prominent={false} />}
    </main>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16: route params arrive as a Promise, unwrapped with `use`.
  const { id } = use(params);
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<OrderLoading />}>
      <OrderDetail id={id} />
    </Suspense>
  );
}
