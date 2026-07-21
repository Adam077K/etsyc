"use client";

import { useState } from "react";
import { Film } from "@/components/chrome/Film";
import {
  expectKeys,
  formatPrice,
  productsByMaker,
  type MockProduct,
} from "@/lib/mock/db";

/**
 * S8 — Products (/sell/products). KOL chrome (seller tools).
 * Product CRUD + P14 "exactly what to expect" (all 11 required fields,
 * completion meter, store CANNOT publish until every product is complete)
 * + P13 maker-declared provenance. Price is stored as minor units +
 * currency; the SERVER is the source of truth, and the field says so.
 * Stacked list, no urgency chrome, no uniform card grid.
 */

/** which P14 fields are still empty, per product (mock pipeline state) */
const MISSING_SPECS: Record<string, readonly string[]> = {
  "ridge-tumbler": [],
  "ash-bowl": ["Repairs", "Returns", "Customization limits"],
};

const INVENTORY_OPTIONS = ["in-stock", "made-to-order", "sold-out"] as const;

export default function SellProductsPage() {
  const senaProducts = productsByMaker("sena");
  const [selectedId, setSelectedId] = useState<string>("ash-bowl");
  const selected =
    senaProducts.find((p) => p.id === selectedId) ?? senaProducts[0];

  const anyBlocked = senaProducts.some((p) => (MISSING_SPECS[p.id] ?? []).length > 0);

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* ---- opener ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Seller tools · Products · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-2)] font-display text-display">Your pieces.</h1>
          <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
            Every product needs its full &ldquo;exactly what to expect&rdquo; specs before the
            store can go public. One piece is still short.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
        >
          New product
        </button>
      </header>

      <div className="mt-[var(--space-6)] grid grid-cols-1 items-start gap-[var(--space-4)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* ==== LEFT: stacked product list ==== */}
        <aside className="flex flex-col gap-[var(--space-3)]">
          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <div className="flex items-baseline justify-between p-[var(--space-3)]">
              <b>{senaProducts.length} products</b>
              <span className="font-mono text-caption text-muted">
                {senaProducts.filter((p) => (MISSING_SPECS[p.id] ?? []).length > 0).length} blocked
              </span>
            </div>
            <div className="border-t border-line">
              {senaProducts.map((p) => {
                const missing = MISSING_SPECS[p.id] ?? [];
                const isOpen = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center justify-between border-b border-line px-[var(--space-3)] py-[var(--space-2)] text-left last:border-b-0 transition-colors duration-state ease-kol ${
                      isOpen ? "bg-accent/10" : "hover:bg-ground"
                    }`}
                  >
                    <span className="flex items-center gap-[var(--space-2)]">
                      <Film
                        variant={p.filmClass}
                        aspect="square"
                        play={false}
                        rounded={false}
                        className="w-11 shrink-0 rounded-sm"
                      />
                      <span>
                        <b>{p.title}</b>
                        <span className="block text-caption text-muted">
                          {isOpen ? (
                            "Editing now"
                          ) : (
                            <>
                              <span className="font-mono text-ink">
                                {formatPrice(p.priceMinor, p.currency)}
                              </span>{" "}
                              · {p.inventory.status}
                            </>
                          )}
                        </span>
                      </span>
                    </span>
                    {missing.length > 0 ? (
                      <span className="rounded-pill border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-caption text-accent">
                        •
                      </span>
                    ) : (
                      <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-caption text-muted">
            Publish is all-or-nothing: <b>every</b> product must clear its specs before the store
            goes public.
          </p>
        </aside>

        {/* ==== RIGHT: the open product editor ==== */}
        {selected ? (
          <ProductEditor
            key={selected.id}
            product={selected}
            missing={MISSING_SPECS[selected.id] ?? []}
            anyBlocked={anyBlocked}
          />
        ) : null}
      </div>
    </main>
  );
}

function ProductEditor({
  product,
  missing,
  anyBlocked,
}: {
  product: MockProduct;
  missing: readonly string[];
  anyBlocked: boolean;
}) {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [priceMinor, setPriceMinor] = useState(product.priceMinor);
  const [inventoryStatus, setInventoryStatus] = useState<string>(product.inventory.status);
  const [qty, setQty] = useState(product.inventory.qty ?? 0);

  const complete = expectKeys.length - missing.length;
  const pct = Math.round((complete / expectKeys.length) * 100);
  const isBlocked = missing.length > 0;

  return (
    <section className="flex flex-col gap-[var(--space-4)]">
      {/* publish-block banner */}
      {isBlocked ? (
        <div className="rounded-md border border-accent/30 bg-accent/10 p-[var(--space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <span className="flex flex-wrap items-center gap-[var(--space-2)]">
              <span className="rounded-pill border border-accent/30 bg-accent/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                • Blocking publish
              </span>
              <b>
                &ldquo;{product.title}&rdquo; can&rsquo;t go live yet — {missing.length} required
                specs are empty.
              </b>
            </span>
            <button
              type="button"
              aria-disabled="true"
              className="cursor-not-allowed rounded-pill border border-line bg-surface px-5 py-2 text-body text-muted opacity-60"
            >
              Publish store
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-accent-2/30 bg-accent-2/10 p-[var(--space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <span className="flex items-center gap-[var(--space-2)]">
              <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ✓ Specs complete
              </span>
              <b>&ldquo;{product.title}&rdquo; has all 11 fields filled.</b>
            </span>
            <span className="text-caption text-muted">
              {anyBlocked ? "Another product still blocks the store." : "Nothing blocking here."}
            </span>
          </div>
        </div>
      )}

      {/* core fields */}
      <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-h3">The basics</h2>
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
            • Draft
          </span>
        </div>

        <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-3)]">
          <label className="block">
            <span className="text-caption uppercase tracking-[0.04em] text-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-[var(--space-1)] w-full rounded-md border border-line bg-ground px-[var(--space-2)] py-[var(--space-2)] text-body text-ink"
            />
          </label>

          <label className="block">
            <span className="text-caption uppercase tracking-[0.04em] text-muted">
              Description · your words
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-[var(--space-1)] w-full max-w-measure rounded-md border border-line bg-ground px-[var(--space-2)] py-[var(--space-2)] text-body text-ink"
            />
          </label>

          <div className="flex flex-wrap gap-[var(--space-3)]">
            <label className="min-w-[220px] flex-1">
              <span className="text-caption uppercase tracking-[0.04em] text-muted">
                Price · minor units, server is source of truth
              </span>
              <div className="mt-[var(--space-1)] flex items-center justify-between rounded-md border border-line bg-ground px-[var(--space-2)] py-[var(--space-2)]">
                <span className="font-mono text-ink">{formatPrice(priceMinor, product.currency)}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceMinor}
                    min={0}
                    onChange={(e) => setPriceMinor(Math.max(0, Number(e.target.value) || 0))}
                    aria-label="Price in minor units"
                    className="w-24 rounded-sm border border-line bg-surface px-2 py-1 text-right font-mono text-caption text-ink"
                  />
                  <span className="font-mono text-caption text-muted">{product.currency}</span>
                </span>
              </div>
              <span className="mt-1 block text-caption text-muted">
                Stored as <span className="font-mono">amount_minor {priceMinor}</span> +{" "}
                <span className="font-mono">currency {product.currency}</span>. The server, not
                this field, is authoritative.
              </span>
            </label>

            <label className="min-w-[220px] flex-1">
              <span className="text-caption uppercase tracking-[0.04em] text-muted">
                Inventory status
              </span>
              <select
                value={inventoryStatus}
                onChange={(e) => setInventoryStatus(e.target.value)}
                className="mt-[var(--space-1)] block w-full rounded-md border border-line bg-ground px-[var(--space-2)] py-[var(--space-2)] text-body text-ink"
              >
                {INVENTORY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span className="mt-[var(--space-1)] flex items-center justify-between rounded-md border border-line bg-ground px-[var(--space-2)] py-[var(--space-2)]">
                <span className="text-muted">Quantity on hand</span>
                <input
                  type="number"
                  value={qty}
                  min={0}
                  onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
                  aria-label="Quantity on hand"
                  className="w-16 rounded-sm border border-line bg-surface px-2 py-1 text-right font-mono text-caption text-ink"
                />
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* media */}
      <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
        <h2 className="font-display text-h3">Media</h2>
        <div className="mt-[var(--space-3)] grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
          <div>
            <div className="relative">
              <Film
                variant={product.filmClass}
                aspect="square"
                play={false}
                craft="Image 1 · focal point set"
                title="Rim, three-quarter"
              />
              <span
                aria-hidden
                className="absolute left-[44%] top-[38%] z-10 h-6 w-6 rounded-pill border-2 border-on-media shadow-raised"
              />
            </div>
            <p className="mt-[var(--space-1)] text-caption text-muted">
              Drag the ring to set the focal point — the crop follows it everywhere.
            </p>
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <div className="flex items-center justify-between rounded-md border border-line bg-ground p-[var(--space-2)]">
              <span className="flex items-center gap-[var(--space-1)]">
                <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">3D</span>
                Optional 3D model
              </span>
              <span className="text-caption text-muted">
                none yet · gallery view is the fallback — never required
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-line bg-ground p-[var(--space-2)]">
              <span>Linked narration clip</span>
              {product.voiceoverLine ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-1.5 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink"
                >
                  <span aria-hidden className="flex items-end gap-0.5">
                    {[6, 12, 8, 14].map((h, i) => (
                      <span key={i} style={{ height: `${h}px` }} className="w-0.5 rounded-pill bg-accent" />
                    ))}
                  </span>
                  <span className="font-mono">0:19</span>
                </button>
              ) : (
                <span className="text-caption text-muted">none · record one in Voice (optional)</span>
              )}
            </div>
            {product.voiceoverLine ? (
              <p className="max-w-measure text-caption text-muted">
                &ldquo;{product.voiceoverLine}&rdquo; — your voice, on this piece.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ===== P14 — exactly what to expect (11 required fields) ===== */}
      <div className={`rounded-md border bg-surface p-[var(--space-3)] ${isBlocked ? "border-accent" : "border-line"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-[var(--space-2)]">
            <span className="rounded-pill bg-accent px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-ink">
              P14 · Required
            </span>
            <h2 className="font-display text-h3">Exactly what to expect</h2>
          </span>
          <span className="font-mono text-caption text-muted">
            {complete} / {expectKeys.length} complete
          </span>
        </div>

        {/* completion meter */}
        <div className="mt-[var(--space-2)] h-2.5 overflow-hidden rounded-sm bg-ink/10">
          <div
            className={`h-full rounded-sm ${isBlocked ? "bg-accent" : "bg-accent-2"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {isBlocked ? (
          <div className="mt-[var(--space-2)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-2)]">
            <p className="max-w-measure text-body text-accent">
              <b>This store cannot publish</b> until every product&rsquo;s specs are complete —
              all 11 fields, on every product. This is what lets a buyer know precisely what will
              arrive. No surprises, no fine print.
            </p>
          </div>
        ) : null}

        <div className="mt-[var(--space-2)] border-t border-line">
          {expectKeys.map((key, i) => {
            const isMissing = missing.includes(key);
            const value = product.expect[key];
            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-[var(--space-2)] border-b border-line py-[var(--space-2)] last:border-b-0 ${
                  isMissing ? "bg-accent/5" : ""
                }`}
              >
                <span className="flex items-center gap-[var(--space-2)]">
                  {isMissing ? (
                    <span className="rounded-pill border border-accent/30 bg-accent/15 px-2.5 py-0.5 text-caption text-accent">
                      ✕
                    </span>
                  ) : (
                    <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">
                      ✓
                    </span>
                  )}
                  <span>
                    {i + 1} · {key}
                  </span>
                </span>
                {isMissing ? (
                  <button
                    type="button"
                    className="text-caption uppercase tracking-[0.04em] text-accent"
                  >
                    Add — required →
                  </button>
                ) : (
                  <span className="max-w-[46%] truncate text-right text-caption text-muted">
                    {value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== P13 — proof of product (maker-declared provenance) ===== */}
      <fieldset className="rounded-md border border-line bg-surface p-[var(--space-3)]">
        <legend className="sr-only">Proof of product — maker-declared provenance</legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="rounded-pill border border-accent-2/30 bg-accent-2/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
            ◆ P13 · Maker-declared
          </span>
          <h2 className="font-display text-h3">Proof of product</h2>
        </div>
        <p className="mt-[var(--space-1)] text-caption text-muted">
          Provenance in your own words. <b>Maker-declared, not third-party verified</b> — KOL
          shows exactly that to buyers, so claim only what&rsquo;s true.
        </p>
        <div className="mt-[var(--space-2)] border-t border-line">
          {(
            [
              ["Exact role", product.provenance.role],
              ["Materials", product.provenance.materials],
              ["Process", product.provenance.process],
              ["Production location", product.provenance.location],
              ["Partners", product.provenance.partners],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-[var(--space-2)] border-b border-line py-[var(--space-2)] last:border-b-0"
            >
              <span>{label}</span>
              <span className="max-w-[55%] text-right text-muted">{value}</span>
            </div>
          ))}
        </div>
      </fieldset>

      {/* footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
        <p className="max-w-measure text-caption text-muted">
          Saved to draft automatically. Publish stays locked until all 11 P14 fields are filled
          here and on every other product.
        </p>
        <div className="flex gap-[var(--space-2)]">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-pill px-5 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
          >
            Save draft
          </button>
          <button
            type="button"
            aria-disabled={isBlocked}
            className={`inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body ${
              isBlocked ? "cursor-not-allowed text-muted opacity-60" : "text-ink hover:bg-ground"
            }`}
          >
            Ready to publish
          </button>
        </div>
      </div>
    </section>
  );
}
