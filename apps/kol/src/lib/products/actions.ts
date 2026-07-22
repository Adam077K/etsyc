"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import { mediaRecordSchema, STORE_MEDIA_BUCKET } from "./media";
import {
  productIdSchema,
  productWriteSchema,
  SPEC_FIELDS,
  type SpecField,
} from "./schemas";

/**
 * Product server actions (spec S8). All inputs are Zod-validated at this
 * boundary. Every write runs on the anon-key session client — RLS-scoped by
 * `products_owner_all` / `product_specs_owner_all` (store ownership), which
 * is the actual trust boundary (B0). NOTHING here accepts a client store_id:
 * the target store is derived from ownership server-side. Price arrives as a
 * major-unit string and is converted to integer minor units exactly once, in
 * the schema — no float ever reaches Supabase.
 */

// Not exported: "use server" modules may only export async functions.
const PRODUCTS_PATH = "/seller/products";

export type ProductField =
  | "title"
  | "description"
  | "materials"
  | "price"
  | "currency"
  | "inventoryStatus"
  | "inventoryQty"
  | "badges"
  | "model3dId"
  | `spec_${SpecField}`;

export type ProductFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<ProductField, string>>;
    };

function fieldFromIssuePath(path: PropertyKey[]): ProductField | null {
  const [head, second] = path;
  if (head === "specs" && typeof second === "string") {
    return SPEC_FIELDS.includes(second as SpecField)
      ? (`spec_${second as SpecField}` as ProductField)
      : null;
  }
  const TOP: readonly ProductField[] = [
    "title",
    "description",
    "materials",
    "price",
    "currency",
    "inventoryStatus",
    "inventoryQty",
    "badges",
    "model3dId",
  ];
  return typeof head === "string" && TOP.includes(head as ProductField)
    ? (head as ProductField)
    : null;
}

function parseForm(formData: FormData) {
  const specs = Object.fromEntries(
    SPEC_FIELDS.map((f) => [f, String(formData.get(`spec_${f}`) ?? "")]),
  );
  return productWriteSchema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") ?? ""),
    materials: String(formData.get("materials") ?? ""),
    price: formData.get("price"),
    currency: String(formData.get("currency") ?? ""),
    inventoryStatus: formData.get("inventoryStatus"),
    inventoryQty: String(formData.get("inventoryQty") ?? ""),
    badges: formData.getAll("badges"),
    model3dId: String(formData.get("model3dId") ?? ""),
    specs,
  });
}

function errorState(
  issues: { path: PropertyKey[]; message: string }[],
): ProductFormState {
  const fieldErrors: Partial<Record<ProductField, string>> = {};
  for (const issue of issues) {
    const field = fieldFromIssuePath(issue.path);
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return {
    status: "error",
    message: "A couple of fields need a look before we can save.",
    fieldErrors,
  };
}

/**
 * Resolves the caller's own store — the ONLY store any product write can
 * target. Returns null when the session has no store (RLS would reject the
 * write anyway; this just makes the error humane).
 */
async function ownStore(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${SIGN_IN_PATH}?next=${encodeURIComponent(PRODUCTS_PATH)}`);

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { user, store };
}

/**
 * A client-supplied model3d_id must resolve to a `model3d` media row the
 * caller OWNS — the products FK only proves existence, and the public-read
 * policy would otherwise let a forged id point at another maker's asset.
 * (App-side check; the residual DB-level gap is cited in the S8 session
 * notes, not papered over — closing it needs a migration.)
 */
async function verifyOwnModel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  model3dId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("media")
    .select("id")
    .eq("id", model3dId)
    .eq("owner_id", userId)
    .eq("kind", "model3d")
    .maybeSingle();
  return Boolean(data);
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const { user, store } = await ownStore(supabase);
  if (!store) {
    return {
      status: "error",
      message: "Your store isn't set up yet — pieces live inside a store.",
    };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) return errorState(parsed.error.issues);

  if (
    parsed.data.model3dId &&
    !(await verifyOwnModel(supabase, user.id, parsed.data.model3dId))
  ) {
    return {
      status: "error",
      message: "A couple of fields need a look before we can save.",
      fieldErrors: { model3dId: "That 3D file isn't in your library." },
    };
  }

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      title: parsed.data.title,
      description: parsed.data.description,
      materials: parsed.data.materials,
      price_amount: parsed.data.price,
      currency: parsed.data.currency,
      inventory_status: parsed.data.inventoryStatus,
      inventory_qty: parsed.data.inventoryQty,
      badges: parsed.data.badges,
      model3d_id: parsed.data.model3dId,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[products] create_failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      status: "error",
      message: "We couldn't save just now — try again in a moment.",
    };
  }

  // P14 capture: the 1:1 specs row is written alongside every product.
  const { error: specsError } = await supabase.from("product_specs").insert({
    product_id: created.id,
    ...parsed.data.specs,
  });
  if (specsError) {
    console.error("[products] specs_create_failed", {
      code: specsError.code,
      message: specsError.message,
    });
  }

  revalidatePath(PRODUCTS_PATH);
  redirect(
    `${PRODUCTS_PATH}/${created.id}?saved=${specsError ? "specs-failed" : "created"}`,
  );
}

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const { user, store } = await ownStore(supabase);
  if (!store) {
    return {
      status: "error",
      message: "Your store isn't set up yet — pieces live inside a store.",
    };
  }

  const parsedId = productIdSchema.safeParse(formData.get("productId"));
  if (!parsedId.success) {
    return { status: "error", message: "That piece can't be found." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) return errorState(parsed.error.issues);

  if (
    parsed.data.model3dId &&
    !(await verifyOwnModel(supabase, user.id, parsed.data.model3dId))
  ) {
    return {
      status: "error",
      message: "A couple of fields need a look before we can save.",
      fieldErrors: { model3dId: "That 3D file isn't in your library." },
    };
  }

  // Own-store scope is explicit AND RLS-enforced; created_at is immutable
  // server-side (MIG-TS), updated_at is app-set (no moddatetime trigger yet
  // — same deferred note as the account lib).
  const { data: updated, error } = await supabase
    .from("products")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      materials: parsed.data.materials,
      price_amount: parsed.data.price,
      currency: parsed.data.currency,
      inventory_status: parsed.data.inventoryStatus,
      inventory_qty: parsed.data.inventoryQty,
      badges: parsed.data.badges,
      model3d_id: parsed.data.model3dId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsedId.data)
    .eq("store_id", store.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    if (error) {
      console.error("[products] update_failed", {
        code: error.code,
        message: error.message,
      });
    }
    return {
      status: "error",
      message: error
        ? "We couldn't save just now — try again in a moment."
        : "That piece can't be found in your store.",
    };
  }

  const { error: specsError } = await supabase.from("product_specs").upsert(
    {
      product_id: parsedId.data,
      ...parsed.data.specs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );
  if (specsError) {
    console.error("[products] specs_upsert_failed", {
      code: specsError.code,
      message: specsError.message,
    });
    return {
      status: "error",
      message:
        "The piece saved, but its details didn't — check the fields and save again.",
    };
  }

  revalidatePath(PRODUCTS_PATH);
  revalidatePath(`${PRODUCTS_PATH}/${parsedId.data}`);
  return { status: "saved", savedAt: Date.now() };
}

export type DeleteProductState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function deleteProduct(
  _prev: DeleteProductState,
  formData: FormData,
): Promise<DeleteProductState> {
  const supabase = await createClient();
  const { store } = await ownStore(supabase);
  if (!store) {
    return { status: "error", message: "Your store isn't set up yet." };
  }

  const parsedId = productIdSchema.safeParse(formData.get("productId"));
  if (!parsedId.success) {
    return { status: "error", message: "That piece can't be found." };
  }

  const { data: deleted, error } = await supabase
    .from("products")
    .delete()
    .eq("id", parsedId.data)
    .eq("store_id", store.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[products] delete_failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message:
        error.code === "23503"
          ? "This piece has orders against it, so it can't be deleted — mark it sold-out instead."
          : "We couldn't delete just now — try again in a moment.",
    };
  }
  if (!deleted) {
    return { status: "error", message: "That piece can't be found in your store." };
  }

  revalidatePath(PRODUCTS_PATH);
  redirect(`${PRODUCTS_PATH}?deleted=1`);
}

export type MediaRecordResult =
  | { status: "ok"; mediaId: string; src: string }
  | { status: "error"; message: string };

/**
 * Registers an uploaded storage object as a `media` row (spec S8, STEP 3).
 * The file itself goes browser → `store-media` bucket on the anon-key
 * client; this action only writes the row — owner-scoped by RLS
 * (`media_owner_all` + the P1-5 cross-store WITH CHECK), with the storage
 * path verified to sit under the caller's OWN store prefix so a forged path
 * can't claim another store's folder.
 */
export async function createMediaRecord(
  input: unknown,
): Promise<MediaRecordResult> {
  const supabase = await createClient();
  const { user, store } = await ownStore(supabase);
  if (!store) {
    return { status: "error", message: "Your store isn't set up yet." };
  }

  const parsed = mediaRecordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "That upload can't be saved.",
    };
  }

  if (!parsed.data.path.startsWith(`${store.id}/`)) {
    return {
      status: "error",
      message: "That upload isn't in your store's space.",
    };
  }

  const { data: publicUrl } = supabase.storage
    .from(STORE_MEDIA_BUCKET)
    .getPublicUrl(parsed.data.path);

  const { data: created, error } = await supabase
    .from("media")
    .insert({
      owner_id: user.id,
      store_id: store.id,
      kind: parsed.data.kind,
      src: publicUrl.publicUrl,
      alt: parsed.data.kind === "image" ? parsed.data.alt : null,
      aspect: parsed.data.kind === "image" ? parsed.data.aspect : null,
      focal_point: parsed.data.kind === "image" ? parsed.data.focalPoint : null,
      mime: parsed.data.mime,
    })
    .select("id, src")
    .single();

  if (error || !created) {
    console.error("[products] media_record_failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      status: "error",
      message: "The upload finished but couldn't be saved — try again.",
    };
  }

  return { status: "ok", mediaId: created.id, src: created.src };
}
