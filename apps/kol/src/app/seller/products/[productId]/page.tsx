import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ProductForm,
  type ClipOption,
  type ProductFormData,
} from "@/components/products/ProductForm";
import { BUYER_LANDING, SIGN_IN_PATH } from "@/lib/auth/routes";
import {
  currencyExponent,
  minorToMajor,
  productIdSchema,
  SPEC_FIELDS,
  type SpecField,
} from "@/lib/products/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Product form page (spec S8) — create ("new") and edit share this route.
 * Seller-authoring surface in KOL chrome (I7), same role gate as /seller.
 * Reads are owner-scoped explicitly on top of RLS: the public-read policy
 * exposes published stores' products to everyone, but this authoring page
 * is owner-only.
 */

export const metadata: Metadata = { title: "Edit piece — KOL" };

export default async function ProductFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { productId } = await params;
  const { saved } = await searchParams;
  const isCreate = productId === "new";
  if (!isCreate && !productIdSchema.safeParse(productId).success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "seller") redirect(BUYER_LANDING);

  const { data: store } = await supabase
    .from("stores")
    .select("id, handle")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) redirect("/seller/products");

  let product: ProductFormData | null = null;
  let specs: Record<SpecField, string> = Object.fromEntries(
    SPEC_FIELDS.map((f) => [f, ""]),
  ) as Record<SpecField, string>;
  let clips: ClipOption[] = [];

  if (!isCreate) {
    const { data: row } = await supabase
      .from("products")
      .select(
        "id, title, description, materials, price_amount, currency, inventory_status, inventory_qty, badges, model3d_id",
      )
      .eq("id", productId)
      .eq("store_id", store.id)
      .maybeSingle();
    if (!row) notFound();

    product = {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      materials: row.materials ?? "",
      // the stored integer's meaning depends on the currency's exponent
      // (F4) — ¥4800 is 4800 minor units, not 480000
      priceMajor: minorToMajor(row.price_amount, currencyExponent(row.currency)),
      currency: row.currency,
      inventoryStatus: row.inventory_status,
      inventoryQty: row.inventory_qty === null ? "" : String(row.inventory_qty),
      badges: row.badges,
      model3dId: row.model3d_id ?? "",
    };

    const { data: specRow } = await supabase
      .from("product_specs")
      .select(
        "dimensions, materials, texture, handmade_variation, production_time, shipping, care, repairs, returns, customization_limits",
      )
      .eq("product_id", productId)
      .maybeSingle();
    if (specRow) {
      specs = Object.fromEntries(
        SPEC_FIELDS.map((f) => [f, specRow[f] ?? ""]),
      ) as Record<SpecField, string>;
    }

    // Narration linkage is canonically video_profiles.product_links, written
    // from the CLIP side by P7's tag editor — this page renders it read-only
    // and deep-links to /seller/clips/[videoId] (closed S8 write list).
    const { data: clipRows } = await supabase
      .from("videos")
      .select("id, poster, duration_ms, video_profiles(product_links)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    clips = (clipRows ?? []).map((clip) => {
      const clipProfile = Array.isArray(clip.video_profiles)
        ? clip.video_profiles[0]
        : clip.video_profiles;
      return {
        id: clip.id,
        poster: clip.poster,
        durationMs: clip.duration_ms,
        linked: (clipProfile?.product_links ?? []).includes(productId),
      };
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-4)] md:px-[var(--space-6)]">
      <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
        <Link
          href="/seller/products"
          className="rounded-sm outline-offset-4 transition-colors duration-state ease-kol hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          KOL · your pieces
        </Link>
        {" · "}
        {isCreate ? "new piece" : "edit"}
      </p>
      <h1 className="max-w-[16ch] font-display text-display-hero [text-wrap:balance]">
        {isCreate ? "Add a piece." : product?.title}
      </h1>

      {saved === "created" ? (
        <p role="status" className="max-w-measure text-body-lg text-muted">
          Saved — this piece is in your catalog. Once your world composition
          places it, buyers meet it in your showcase with its own page.
        </p>
      ) : null}
      {saved === "specs-failed" ? (
        <p role="status" className="max-w-measure text-body text-muted">
          The piece saved, but its &ldquo;exactly what to expect&rdquo; details
          didn&rsquo;t — check them below and save again.
        </p>
      ) : null}

      <ProductForm
        mode={isCreate ? "create" : "edit"}
        product={product}
        specs={specs}
        clips={clips}
        storeId={store.id}
      />
    </main>
  );
}
