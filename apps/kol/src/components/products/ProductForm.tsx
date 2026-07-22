"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { ImageUploader, ModelUploader } from "@/components/products/MediaUploader";
import { ErrorInline } from "@/components/states/ErrorInline";
import { Button } from "@/components/ui/button";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type DeleteProductState,
  type ProductField,
  type ProductFormState,
} from "@/lib/products/actions";
import { CURRENCY_CODES, SPEC_FIELDS, type SpecField } from "@/lib/products/schemas";
import { Constants } from "@/lib/supabase/database.types";
import { PRODUCT_BADGES } from "@/lib/store-config/schema";
import { cn } from "@/lib/utils";

/**
 * Product form (spec S8, all 4 states):
 *   empty   → create-mode guiding intro (empty ≠ blank — an invitation)
 *   loading → save-in-flight, submit disabled, scoped "Saving…"; the form
 *             stays fully usable throughout
 *   error   → inline per-field validation beneath each input; nothing is
 *             written until the whole object validates
 *   success → quiet "saved" confirmation (edit) or redirect banner (create)
 *
 * The form sends NO store_id, NO created_at, and price only as a major-unit
 * string that the schema converts to integer minor units exactly once (B0:
 * money is integer minor units + char(3) currency; RLS scopes the write to
 * the seller's own store either way).
 */

export type ProductFormData = {
  id: string;
  title: string;
  description: string;
  materials: string;
  priceMajor: string;
  currency: string;
  inventoryStatus: (typeof Constants.public.Enums.inventory_status)[number];
  inventoryQty: string;
  badges: string[];
  model3dId: string;
};

export type ClipOption = {
  id: string;
  poster: string | null;
  durationMs: number | null;
  linked: boolean;
};

const IDLE: ProductFormState = { status: "idle" };
const DELETE_IDLE: DeleteProductState = { status: "idle" };

const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const labelClass =
  "font-text text-caption uppercase tracking-[0.08em] text-muted";

const legendClass =
  "font-display text-h3 text-ink";

const INVENTORY_OPTIONS: {
  value: ProductFormData["inventoryStatus"];
  label: string;
  hint: string;
}[] = [
  { value: "in-stock", label: "In stock", hint: "Ready to ship as-is." },
  {
    value: "made-to-order",
    label: "Made to order",
    hint: "Each one is made when it's bought.",
  },
  {
    value: "sold-out",
    label: "Sold out",
    hint: "Stays visible in your world; buying is paused.",
  },
];

const SPEC_LABELS: Record<SpecField, string> = {
  dimensions: "Dimensions",
  materials: "Materials",
  texture: "Texture & finish",
  handmade_variation: "Handmade variation",
  production_time: "Production time",
  shipping: "Shipping",
  care: "Care",
  repairs: "Repairs",
  returns: "Returns",
  customization_limits: "Customisation limits",
};

function formatDuration(ms: number | null): string | null {
  if (ms === null || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function fieldError(
  state: ProductFormState,
  field: ProductField,
): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

export function ProductForm({
  mode,
  product,
  specs,
  clips,
  storeId,
}: {
  mode: "create" | "edit";
  product: ProductFormData | null;
  specs: Record<SpecField, string>;
  clips: ClipOption[];
  storeId: string;
}) {
  const [state, action, pending] = useActionState(
    mode === "create" ? createProduct : updateProduct,
    IDLE,
  );
  const [model3dId, setModel3dId] = useState(product?.model3dId ?? "");

  const titleError = fieldError(state, "title");
  const descriptionError = fieldError(state, "description");
  const materialsError = fieldError(state, "materials");
  const priceError = fieldError(state, "price");
  const currencyError = fieldError(state, "currency");
  const qtyError = fieldError(state, "inventoryQty");
  const model3dError = fieldError(state, "model3dId");

  const linkedClips = clips.filter((c) => c.linked);
  const unlinkedClips = clips.filter((c) => !c.linked);

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-[var(--space-4)]">
      {mode === "create" ? (
        // ── Empty state: a guiding invitation, not a blank form ──
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line bg-surface/60 px-6 py-6">
          <p className="font-display text-h3 text-ink">
            One piece, told properly
          </p>
          <p className="max-w-measure text-body text-muted">
            A title, its story, and an honest price. Your world does the
            rest — the showcase and the piece&rsquo;s own page render from
            what you write here.
          </p>
        </div>
      ) : null}

      <form action={action} className="flex flex-col gap-[var(--space-4)]">
        {mode === "edit" && product ? (
          <input type="hidden" name="productId" value={product.id} />
        ) : null}

        {/* ── The piece ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-piece">
          <h2 id="section-piece" className={legendClass}>
            The piece
          </h2>

          <div className="flex flex-col gap-2">
            <label htmlFor="product-title" className={labelClass}>
              Title
            </label>
            <input
              id="product-title"
              name="title"
              type="text"
              required
              maxLength={140}
              defaultValue={product?.title ?? ""}
              placeholder="What is it called?"
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? "product-title-error" : undefined}
              className={inputClass}
            />
            {titleError ? (
              <div id="product-title-error">
                <ErrorInline message={titleError} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="product-description" className={labelClass}>
              Description{" "}
              <span className="normal-case tracking-normal">(your own words)</span>
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={6}
              maxLength={4000}
              defaultValue={product?.description ?? ""}
              placeholder="Where it began, how it's made, who it's for."
              aria-invalid={descriptionError ? true : undefined}
              aria-describedby={
                descriptionError ? "product-description-error" : undefined
              }
              className={`${inputClass} min-h-36 resize-y`}
            />
            {descriptionError ? (
              <div id="product-description-error">
                <ErrorInline message={descriptionError} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="product-materials" className={labelClass}>
              Materials <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="product-materials"
              name="materials"
              type="text"
              maxLength={500}
              defaultValue={product?.materials ?? ""}
              placeholder="walnut, tung oil"
              aria-invalid={materialsError ? true : undefined}
              aria-describedby={
                materialsError ? "product-materials-error" : undefined
              }
              className={inputClass}
            />
            {materialsError ? (
              <div id="product-materials-error">
                <ErrorInline message={materialsError} />
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Imagery ───────────────────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-imagery">
          <h2 id="section-imagery" className={legendClass}>
            Imagery
          </h2>
          <ImageUploader storeId={storeId} />
        </section>

        {/* ── In the round ──────────────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-model">
          <h2 id="section-model" className={legendClass}>
            In the round
          </h2>
          <ModelUploader
            storeId={storeId}
            value={model3dId}
            onChange={setModel3dId}
          />
        </section>

        {/* ── Price ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-price">
          <h2 id="section-price" className={legendClass}>
            Price
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex w-full flex-col gap-2 sm:w-32">
              <label htmlFor="product-currency" className={labelClass}>
                Currency
              </label>
              {/* a SELECT over the supported set (F4): the stored integer's
                  meaning depends on the currency's minor-unit exponent, so
                  free-typed codes we have no exponent for can't be offered.
                  The schema still gates forged payloads to the same set. */}
              <select
                id="product-currency"
                name="currency"
                defaultValue={product?.currency ?? "GBP"}
                aria-invalid={currencyError ? true : undefined}
                aria-describedby={
                  currencyError ? "product-currency-error" : "product-price-help"
                }
                className={cn(inputClass, "font-mono uppercase tabular-nums")}
              >
                {CURRENCY_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="product-price" className={labelClass}>
                Amount
              </label>
              <input
                id="product-price"
                name="price"
                type="text"
                required
                inputMode="decimal"
                defaultValue={product?.priceMajor ?? ""}
                placeholder="48.50"
                spellCheck={false}
                aria-invalid={priceError ? true : undefined}
                aria-describedby={
                  priceError ? "product-price-error" : "product-price-help"
                }
                className={cn(inputClass, "font-mono tabular-nums")}
              />
            </div>
          </div>
          <p id="product-price-help" className="text-caption text-muted">
            Stored exactly as entered, in the currency&rsquo;s own precision —
            48.50 (GBP), 4800 (JPY, whole amounts), 12.345 (KWD). Checkout
            reads this price from your catalog; it can never be set anywhere
            else.
          </p>
          {currencyError ? (
            <div id="product-currency-error">
              <ErrorInline message={currencyError} />
            </div>
          ) : null}
          {priceError ? (
            <div id="product-price-error">
              <ErrorInline message={priceError} />
            </div>
          ) : null}
        </section>

        {/* ── Availability ──────────────────────────────────────── */}
        <fieldset className="flex flex-col gap-5">
          <legend className={cn(legendClass, "mb-5")}>Availability</legend>
          <div className="flex flex-col gap-3">
            {INVENTORY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-line bg-surface px-4 py-3 transition-colors duration-state ease-kol hover:bg-ground has-[:checked]:border-accent"
              >
                <input
                  type="radio"
                  name="inventoryStatus"
                  value={option.value}
                  defaultChecked={
                    (product?.inventoryStatus ?? "in-stock") === option.value
                  }
                  className="mt-1 h-4 w-4 accent-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-body text-ink">{option.label}</span>
                  <span className="text-caption text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="product-qty" className={labelClass}>
              Quantity <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="product-qty"
              name="inventoryQty"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              defaultValue={product?.inventoryQty ?? ""}
              placeholder="How many exist?"
              aria-invalid={qtyError ? true : undefined}
              aria-describedby={qtyError ? "product-qty-error" : undefined}
              className={cn(inputClass, "sm:w-48 font-mono tabular-nums")}
            />
            {qtyError ? (
              <div id="product-qty-error">
                <ErrorInline message={qtyError} />
              </div>
            ) : null}
          </div>
        </fieldset>

        {/* ── Badges ────────────────────────────────────────────── */}
        <fieldset className="flex flex-col gap-5">
          <legend className={cn(legendClass, "mb-5")}>Badges</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {PRODUCT_BADGES.map((badge) => (
              <label
                key={badge}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground has-[:checked]:border-accent"
              >
                <input
                  type="checkbox"
                  name="badges"
                  value={badge}
                  defaultChecked={product?.badges.includes(badge) ?? false}
                  className="h-4 w-4 accent-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                {badge}
              </label>
            ))}
          </div>
          <p className="text-caption text-muted">
            Honest claims only — these render beside the piece in your world.
          </p>
        </fieldset>

        {/* ── Narration ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-narration">
          <h2 id="section-narration" className={legendClass}>
            Narration
          </h2>
          {mode === "create" ? (
            <p className="max-w-measure text-body text-muted">
              Save this piece first — then tag one of your clips to it from
              the clip&rsquo;s own page, and it narrates the piece wherever it
              appears.
            </p>
          ) : clips.length === 0 ? (
            <p className="max-w-measure text-body text-muted">
              No clips in your library yet. Once your films are in, tag one to
              this piece and it narrates the piece wherever it appears.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {linkedClips.map((clip) => (
                <ClipRow key={clip.id} clip={clip} />
              ))}
              {unlinkedClips.map((clip) => (
                <ClipRow key={clip.id} clip={clip} />
              ))}
            </ul>
          )}
        </section>

        {/* ── Exactly what to expect ────────────────────────────── */}
        <section className="flex flex-col gap-5" aria-labelledby="section-specs">
          <h2 id="section-specs" className={legendClass}>
            Exactly what to expect
          </h2>
          <p className="max-w-measure text-body text-muted">
            The honest details buyers rely on. Optional while you draft —
            publishing will ask for them.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {SPEC_FIELDS.map((field) => {
              const error = fieldError(state, `spec_${field}`);
              return (
                <div key={field} className="flex flex-col gap-2">
                  <label htmlFor={`product-spec-${field}`} className={labelClass}>
                    {SPEC_LABELS[field]}
                  </label>
                  <textarea
                    id={`product-spec-${field}`}
                    name={`spec_${field}`}
                    rows={2}
                    maxLength={2000}
                    defaultValue={specs[field]}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={
                      error ? `product-spec-${field}-error` : undefined
                    }
                    className={`${inputClass} min-h-20 resize-y`}
                  />
                  {error ? (
                    <div id={`product-spec-${field}-error`}>
                      <ErrorInline message={error} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* model3d binding — populated by the "In the round" upload path. */}
        <input type="hidden" name="model3dId" value={model3dId} />
        {model3dError ? <ErrorInline message={model3dError} /> : null}

        {state.status === "error" ? (
          <ErrorInline message={state.message} />
        ) : null}

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-[var(--space-3)]">
          <Button type="submit" variant="accent" disabled={pending}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Add this piece"
                : "Save piece"}
          </Button>
          {state.status === "saved" && !pending ? (
            <p className="text-body text-muted" role="status">
              Saved — your world reflects it.
            </p>
          ) : null}
          {pending ? (
            <p className="sr-only" role="status">
              Saving piece
            </p>
          ) : null}
        </div>
      </form>

      {mode === "edit" && product ? <DeletePiece productId={product.id} /> : null}
    </div>
  );
}

function ClipRow({ clip }: { clip: ClipOption }) {
  const duration = formatDuration(clip.durationMs);
  return (
    <li className="flex min-h-11 items-center gap-4 rounded-md border border-line bg-surface px-4 py-3">
      {clip.poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN poster srcs; next/image domains are a P5 config concern
        <img
          src={clip.poster}
          alt=""
          aria-hidden="true"
          className="h-12 w-12 rounded-sm object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-sm bg-ground text-caption text-muted"
        >
          film
        </span>
      )}
      <span className="flex-1 text-body text-ink">
        {duration ? `${duration} clip` : "Clip"}
        {clip.linked ? (
          <span className="mt-0.5 block text-caption uppercase tracking-[0.04em] text-muted">
            narrates this piece
          </span>
        ) : null}
      </span>
      <Link
        href={`/seller/clips/${clip.id}`}
        className="inline-flex min-h-11 items-center rounded-pill px-4 text-caption uppercase tracking-[0.04em] text-ink outline-offset-2 transition-colors duration-state ease-kol hover:bg-ground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {clip.linked ? "Retag" : "Tag it to this piece"}
      </Link>
    </li>
  );
}

/**
 * Two-step inline delete — no browser confirm dialog, fully keyboard
 * reachable, and the destructive action is never one accidental tap away.
 */
function DeletePiece({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(deleteProduct, DELETE_IDLE);

  return (
    <details className="group border-t border-line pt-[var(--space-3)]">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-pill px-4 text-caption uppercase tracking-[0.04em] text-muted outline-offset-2 transition-colors duration-state ease-kol hover:bg-ground hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        Delete this piece
      </summary>
      <div className="mt-4 flex flex-col items-start gap-4 rounded-md border border-line bg-surface px-5 py-4">
        <p className="max-w-measure text-body text-muted">
          This removes the piece from your world for good. Pieces with orders
          against them can&rsquo;t be deleted — mark those sold-out instead.
        </p>
        {state.status === "error" ? (
          <ErrorInline message={state.message} />
        ) : null}
        <form action={action} className="flex items-center gap-3">
          <input type="hidden" name="productId" value={productId} />
          <Button type="submit" variant="quiet" disabled={pending}>
            {pending ? "Deleting…" : "Delete it"}
          </Button>
        </form>
      </div>
    </details>
  );
}
