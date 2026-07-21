"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, getProduct, orders, productsByMaker } from "@/lib/mock/db";

/**
 * S7 — Maker dashboard (/sell/dashboard). KOL chrome (seller tools).
 * Hygiene surface, no mission load: route Sena to the screens that carry
 * the design effort. Figures are honest and non-vanity — plain counts,
 * no deltas, no streaks, no "you're on fire". Order status changes are
 * whitelisted to the four real fulfilment stages. No urgency chrome.
 */

const STATUS_OPTIONS = ["accepted", "in-production", "finishing", "shipped"] as const;
type OrderStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: "Accepted",
  "in-production": "In production",
  finishing: "Finishing",
  shipped: "Shipped",
};

/** map the db 0–4 stage onto the whitelisted select values */
function stageToStatus(stage: number): OrderStatus {
  if (stage >= 4) return "shipped";
  if (stage === 3) return "finishing";
  if (stage >= 1) return "in-production";
  return "accepted";
}

export default function SellDashboardPage() {
  const senaOrders = orders.filter((o) => o.makerSlug === "sena");
  const senaProducts = productsByMaker("sena");

  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>(() =>
    Object.fromEntries(senaOrders.map((o) => [o.id, stageToStatus(o.stage)])),
  );

  const setStatus = (id: string, value: string) => {
    // whitelist only — anything else is dropped, never stored
    const match = STATUS_OPTIONS.find((s) => s === value);
    if (!match) return;
    setStatuses((s) => ({ ...s, [id]: match }));
  };

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* ---- opener: a workshop desk, not a KPI wall ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Your store · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-2)] font-display text-display">Morning, Sena.</h1>
          <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
            One thread wants a reply and one order is on its way. Everything else can wait until
            you&rsquo;re off the wheel.
          </p>
        </div>
        <div className="flex gap-[var(--space-2)]">
          <Link
            href="/sell/products"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Products
          </Link>
          <Link
            href="/sell/products"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
          >
            New product
          </Link>
        </div>
      </header>

      <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ==== LEFT: the things that need a human ==== */}
        <div className="flex flex-col gap-[var(--space-4)]">
          {/* store status */}
          <section className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-[var(--space-2)]">
                <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  • Draft — not public yet
                </span>
                <h2 className="font-display text-h3">Store status</h2>
              </span>
              <Link
                href="/sell/publish"
                className="rounded-pill px-4 py-1.5 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
              >
                Open the publish gate →
              </Link>
            </div>
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              Your store is private. Two blocks still need your sign-off before the publish gate
              opens — nothing goes live until you press the button yourself.
            </p>
            <div className="mt-[var(--space-2)] border-t border-line">
              <div className="flex items-center justify-between py-[var(--space-2)]">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">•</span>
                  <span>2 blocks awaiting your approval</span>
                </span>
                <Link href="/sell/publish" className="text-caption uppercase tracking-[0.04em] text-accent">
                  Review blocks →
                </Link>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-2)]">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">•</span>
                  <span>1 product missing required specs</span>
                </span>
                <Link href="/sell/products" className="text-caption uppercase tracking-[0.04em] text-accent">
                  Fix specs →
                </Link>
              </div>
            </div>
          </section>

          {/* orders received */}
          <section className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-h3">Orders received</h2>
              <span className="font-mono text-caption text-muted">{senaOrders.length} open</span>
            </div>

            <div className="mt-[var(--space-2)] border-t border-line">
              {senaOrders.map((o) => {
                const status = statuses[o.id] ?? stageToStatus(o.stage);
                const firstItem = o.items[0];
                return (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-[var(--space-2)] border-b border-line py-[var(--space-3)] last:border-b-0"
                  >
                    <div>
                      <b>
                        {firstItem ? getProduct(firstItem.productId)?.title ?? firstItem.productId : "Order"}{" "}
                        ×{firstItem?.qty ?? 1}
                      </b>
                      <p className="mt-0.5 text-caption text-muted">
                        Order <span className="font-mono">{o.id}</span> · placed {o.placed} ·{" "}
                        <span className="font-mono text-ink">{formatPrice(o.totalMinor)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-[var(--space-2)]">
                      <span
                        className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                          status === "shipped"
                            ? "bg-accent-2/15 text-accent-2"
                            : "border border-line bg-surface text-muted"
                        }`}
                      >
                        {status === "shipped" ? "✓ " : "• "}
                        {STATUS_LABELS[status]}
                      </span>
                      <label className="sr-only" htmlFor={`status-${o.id}`}>
                        Set status for order {o.id}
                      </label>
                      <select
                        id={`status-${o.id}`}
                        value={status}
                        onChange={(e) => setStatus(o.id, e.target.value)}
                        className="rounded-pill border border-line bg-ground px-3 py-1.5 text-caption text-ink"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              Status changes go straight to the buyer&rsquo;s order page, in your voice — no
              automated fluff added.
            </p>
          </section>

          {/* needs a reply */}
          <section className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-h3">Needs a reply</h2>
              <span className="font-mono text-caption text-muted">1 waiting</span>
            </div>
            <div className="mt-[var(--space-2)] border-t border-line">
              <Link
                href="/inbox"
                className="flex flex-wrap items-center justify-between gap-2 py-[var(--space-3)]"
              >
                <div>
                  <span className="flex items-center gap-[var(--space-2)]">
                    <span className="rounded-pill border border-accent-2/30 bg-accent-2/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                      ◆ Commission
                    </span>
                    <b>A pair of tumblers, wet-slate</b>
                  </span>
                  <p className="mt-0.5 text-caption text-muted">
                    Daniel R. · asked 6h ago · &ldquo;could they land by Sept 2?&rdquo;
                  </p>
                </div>
                <span className="rounded-pill px-4 py-1.5 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink">
                  Reply
                </span>
              </Link>
            </div>
          </section>

          {/* empty state specimen */}
          <section className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Empty state · what a new maker sees
            </p>
            <div className="mt-[var(--space-2)] rounded-md border border-dashed border-line p-[var(--space-4)] text-center">
              <b className="font-display text-h3">No orders yet.</b>
              <p className="mx-auto mt-[var(--space-1)] max-w-measure text-body text-muted">
                When someone buys, it lands here with its status control. Until then, the best
                thing you can do is film another piece.
              </p>
              <Link
                href="/sell/products"
                className="mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
              >
                Add a product
              </Link>
            </div>
          </section>
        </div>

        {/* ==== RIGHT: status glances + honest figures ==== */}
        <aside className="flex flex-col gap-[var(--space-3)]">
          {/* verification */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Verification</p>
            <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
              <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ✓ Verified
              </span>
              <span className="text-muted">Real-Maker voice anchor resolved</span>
            </div>
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              A founder checked your clip by hand. Your Real-Maker badge shows on your store and
              on every clip.
            </p>
            <Link
              href="/sell/verify"
              className="mt-[var(--space-2)] inline-flex rounded-pill px-4 py-1.5 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
            >
              View verification
            </Link>
          </div>

          {/* products summary */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Products</p>
            <div className="mt-[var(--space-2)] border-t border-line">
              <div className="flex items-center justify-between py-[var(--space-1)]">
                <span>Listed</span>
                <span className="font-mono">{senaProducts.length}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-1)]">
                <span className="flex items-center gap-[var(--space-1)]">
                  <span className="rounded-pill border border-line bg-surface px-2 py-0.5 text-caption text-muted">•</span>
                  Blocking publish
                </span>
                <span className="font-mono">1</span>
              </div>
            </div>
            <Link
              href="/sell/products"
              className="mt-[var(--space-2)] inline-flex rounded-pill px-4 py-1.5 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
            >
              Manage products
            </Link>
          </div>

          {/* honest figures — plain counts, no deltas */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">This week · plainly</p>
            <div className="mt-[var(--space-2)] border-t border-line">
              <div className="flex items-center justify-between py-[var(--space-2)]">
                <span>People who opened your world</span>
                <span className="font-mono">312</span>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-2)]">
                <span>Follows</span>
                <span className="font-mono">214</span>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-2)]">
                <span>Saves</span>
                <span className="font-mono">89</span>
              </div>
            </div>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              Counts, not scores. No streaks, no &ldquo;you&rsquo;re on fire&rdquo; — just what
              happened. Nothing here changes what a buyer sees.
            </p>
          </div>

          {/* designer's note */}
          <div className="rounded-md border border-line bg-ground p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Designer&rsquo;s note
            </p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              This surface carries <b>no mission load</b>. It&rsquo;s honest plumbing: route the
              maker to the interview, editor, and publish screens where the real design effort
              lives. Dashboard polish never steals budget from those.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
