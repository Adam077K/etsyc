import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE trust-boundary verification for S8 (Product Management) against the
 * applied staging DB. Auto-skips when apps/kol/.env.local is absent (CI has
 * no keys). Mirrors the P2 live suite's rig: service-role is used ONLY as
 * test fixture (create/inspect/cleanup); clients are built directly because
 * server.ts/admin.ts are `server-only` modules that cannot load under vitest.
 *
 * Verifies the DB-enforced boundary the products lib builds on (B0):
 *   1. the owning seller CAN write products in their own store
 *   2. a DIFFERENT authenticated seller CANNOT (insert denied, update 0 rows)
 *   3. anon CANNOT write
 *   4. anon CAN read a PUBLISHED store's products, NOT an unpublished one's
 *   5. THE PRICE CONTRACT: price_amount is integer minor units (float and
 *      negative writes are rejected by the DB), and `create_order` reads the
 *      price server-side — a price smuggled into the items payload is
 *      structurally ignored
 *   6. media rows are owner-scoped with the P1-5 cross-store WITH CHECK
 *   7. created_at is server-stamped (MIG-TS) — a client-set value is ignored
 *   8. (conditional) the store-media bucket accepts an owner-prefixed upload
 */

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
} catch {
  // no .env.local — the suite below skips
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasKeys = Boolean(url && anonKey && serviceRoleKey);

const runStamp = Date.now();
const emailA = `kol-s8-live-${runStamp}-a@example.com`; // seller, owns the stores
const emailB = `kol-s8-live-${runStamp}-b@example.com`; // different seller
const emailC = `kol-s8-live-${runStamp}-c@example.com`; // buyer (create_order)

const PRICE_MINOR = 4850; // £48.50 — integer minor units, the only price anywhere

describe.skipIf(!hasKeys)("S8 live products boundary (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 90_000 });

  const admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const asSellerA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const asSellerB = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const asBuyerC = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Bare anon client — NO session.
  const asAnon = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let sellerAId = "";
  let sellerBId = "";
  let buyerCId = "";
  let publishedStoreId = "";
  let unpublishedStoreId = "";
  let productId = ""; // seller A's product in the published store
  let hasBucket = false;

  async function createUser(email: string, displayName: string) {
    const res = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (res.error) throw new Error(`createUser failed: ${res.error.message}`);
    return res.data.user.id;
  }

  async function signIn(
    client: typeof asSellerA,
    email: string,
  ): Promise<void> {
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);
    const { error: verifyError } = await client.auth.verifyOtp({
      type: "email",
      token_hash: link.properties?.hashed_token ?? "",
    });
    if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
  }

  beforeAll(async () => {
    sellerAId = await createUser(emailA, "S8 Live Seller A");
    sellerBId = await createUser(emailB, "S8 Live Seller B");
    buyerCId = await createUser(emailC, "S8 Live Buyer C");

    // role→seller is the service-role onboarding step (B0) — fixture only.
    for (const id of [sellerAId, sellerBId]) {
      const { error } = await admin
        .from("profiles")
        .update({ role: "seller" })
        .eq("id", id);
      if (error) throw new Error(`role fixture failed: ${error.message}`);
    }

    const published = await admin
      .from("stores")
      .insert({
        owner_id: sellerAId,
        handle: `kol-s8-live-${runStamp}-pub`,
        name: "S8 Live Published Store",
        published: true,
      })
      .select("id")
      .single();
    if (published.error) throw new Error(published.error.message);
    publishedStoreId = published.data.id;

    const unpublished = await admin
      .from("stores")
      .insert({
        owner_id: sellerAId,
        handle: `kol-s8-live-${runStamp}-draft`,
        name: "S8 Live Draft Store",
        published: false,
      })
      .select("id")
      .single();
    if (unpublished.error) throw new Error(unpublished.error.message);
    unpublishedStoreId = unpublished.data.id;

    // A product in the UNPUBLISHED store (fixture — read-boundary test).
    const draftProduct = await admin.from("products").insert({
      store_id: unpublishedStoreId,
      title: "S8 draft-store piece",
      price_amount: 1230,
    });
    if (draftProduct.error) throw new Error(draftProduct.error.message);

    await signIn(asSellerA, emailA);
    await signIn(asSellerB, emailB);
    await signIn(asBuyerC, emailC);

    const { data: buckets } = await admin.storage.listBuckets();
    hasBucket = (buckets ?? []).some((b) => b.name === "store-media");
  });

  afterAll(async () => {
    // Orders first (they reference store + products), then stores (products
    // and media cascade), then the disposable users (profiles cascade).
    if (buyerCId) {
      await admin.from("orders").delete().eq("buyer_id", buyerCId);
    }
    const storeIds = [publishedStoreId, unpublishedStoreId].filter(Boolean);
    if (storeIds.length > 0) {
      await admin.from("stores").delete().in("id", storeIds);
    }
    for (const id of [sellerAId, sellerBId, buyerCId]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }

    const { data: leftoverProducts } = await admin
      .from("products")
      .select("id")
      .in("store_id", storeIds.length > 0 ? storeIds : [randomUUID()]);
    expect(leftoverProducts ?? []).toHaveLength(0);
    const { data: leftoverStores } = await admin
      .from("stores")
      .select("id")
      .in("id", storeIds.length > 0 ? storeIds : [randomUUID()]);
    expect(leftoverStores ?? []).toHaveLength(0);
  });

  it("the owning seller CAN write a product in their own store — integer minor units land exactly", async () => {
    const { data, error } = await asSellerA
      .from("products")
      .insert({
        store_id: publishedStoreId,
        title: "S8 live boundary piece",
        description: "Live-suite artefact — cleaned up by afterAll.",
        materials: "walnut, tung oil",
        price_amount: PRICE_MINOR,
        currency: "GBP",
        inventory_status: "in-stock",
        inventory_qty: 3,
        badges: ["one-of-a-kind"],
      })
      .select("id, price_amount, currency, created_at")
      .single();
    expect(error).toBeNull();
    expect(data?.price_amount).toBe(PRICE_MINOR);
    expect(Number.isInteger(data?.price_amount)).toBe(true);
    expect(data?.currency).toBe("GBP");
    productId = data?.id ?? "";

    // …and can update it (own-store UPDATE path).
    const { data: updated, error: updateError } = await asSellerA
      .from("products")
      .update({ inventory_qty: 2, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .select("inventory_qty")
      .single();
    expect(updateError).toBeNull();
    expect(updated?.inventory_qty).toBe(2);
  });

  it("the DB rejects a float price — money is integer minor units, no floats ever", async () => {
    const { error } = await asSellerA.from("products").insert({
      store_id: publishedStoreId,
      title: "S8 float price attempt",
      price_amount: 48.5,
    });
    expect(error).not.toBeNull();
  });

  it("the DB rejects a negative price (CHECK constraint, defence-in-depth)", async () => {
    const { error } = await asSellerA.from("products").insert({
      store_id: publishedStoreId,
      title: "S8 negative price attempt",
      price_amount: -1,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514"); // check_violation
  });

  it("a DIFFERENT authenticated seller CANNOT insert into A's store", async () => {
    const { error } = await asSellerB.from("products").insert({
      store_id: publishedStoreId,
      title: "S8 cross-store hijack attempt",
      price_amount: 1,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501"); // RLS violation
  });

  it("a DIFFERENT authenticated seller CANNOT tamper with A's price — update hits 0 rows", async () => {
    const { data, error } = await asSellerB
      .from("products")
      .update({ price_amount: 1 })
      .eq("id", productId)
      .select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(0); // row invisible to B's UPDATE

    const { data: verify } = await admin
      .from("products")
      .select("price_amount")
      .eq("id", productId)
      .single();
    expect(verify?.price_amount).toBe(PRICE_MINOR); // unchanged
  });

  it("anon CANNOT write products", async () => {
    const { error } = await asAnon.from("products").insert({
      store_id: publishedStoreId,
      title: "S8 anon write attempt",
      price_amount: 1,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("anon CAN read a PUBLISHED store's products and CANNOT read an unpublished store's", async () => {
    const pub = await asAnon
      .from("products")
      .select("id, title, price_amount")
      .eq("store_id", publishedStoreId);
    expect(pub.error).toBeNull();
    expect((pub.data ?? []).some((p) => p.id === productId)).toBe(true);

    const draft = await asAnon
      .from("products")
      .select("id")
      .eq("store_id", unpublishedStoreId);
    expect(draft.error).toBeNull();
    expect(draft.data).toHaveLength(0);
  });

  it("PRICE CONTRACT: create_order reads the price server-side — a smuggled client price is ignored", async () => {
    // The items payload has NO price parameter in the contract. Smuggle three
    // price-shaped keys in anyway: the RPC must charge the catalog price.
    const { data: orderId, error } = await asBuyerC.rpc("create_order", {
      p_store_id: publishedStoreId,
      p_items: [
        {
          product_id: productId,
          quantity: 2,
          price: 1,
          price_amount: 1,
          unit_price_amount: 1,
        },
      ],
    });
    expect(error).toBeNull();
    expect(orderId).toBeTruthy();

    const { data: items } = await admin
      .from("order_items")
      .select("unit_price_amount, currency, quantity")
      .eq("order_id", orderId ?? "");
    expect(items).toHaveLength(1);
    expect(items?.[0]?.unit_price_amount).toBe(PRICE_MINOR); // server truth
    expect(items?.[0]?.currency).toBe("GBP");

    const { data: order } = await admin
      .from("orders")
      .select("subtotal_amount, currency")
      .eq("id", orderId ?? "")
      .single();
    expect(order?.subtotal_amount).toBe(PRICE_MINOR * 2); // integer math end to end
  });

  it("media: the owner writes an own-store row; another seller's cross-store attach is denied (P1-5)", async () => {
    const { data, error } = await asSellerA
      .from("media")
      .insert({
        owner_id: sellerAId,
        store_id: publishedStoreId,
        kind: "image",
        src: "https://cdn.example/kol-s8-live.jpg",
        alt: "Live-suite artefact image",
        aspect: "4:5",
        focal_point: { x: 0.5, y: 0.4 },
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();

    const { error: crossError } = await asSellerB.from("media").insert({
      owner_id: sellerBId, // own owner_id…
      store_id: publishedStoreId, // …but A's store: WITH CHECK must reject
      kind: "image",
      src: "https://cdn.example/kol-s8-hijack.jpg",
      alt: "cross-store brand hijack attempt",
    });
    expect(crossError).not.toBeNull();
    expect(crossError?.code).toBe("42501");
  });

  it("created_at is server-stamped (MIG-TS): a client-set value is overridden", async () => {
    const forged = "2001-01-01T00:00:00.000Z";
    const { data, error } = await asSellerA
      .from("products")
      .insert({
        store_id: publishedStoreId,
        title: "S8 created_at forge attempt",
        price_amount: 100,
        created_at: forged,
      })
      .select("id, created_at")
      .single();
    expect(error).toBeNull();
    expect(data?.created_at).not.toBe(forged);
    expect(new Date(data?.created_at ?? 0).getFullYear()).toBeGreaterThan(2020);
  });

  it("documents store-media bucket presence (S8 STEP 3 smoke precondition)", () => {
    console.info(`[s8-live] store-media bucket present: ${hasBucket}`);
    expect(typeof hasBucket).toBe("boolean");
  });

  it.skipIf(!hasBucket)(
    "store-media upload smoke: owner-prefixed object uploads and is removable",
    async () => {
      // 1×1 transparent PNG.
      const png = Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        ),
        (c) => c.charCodeAt(0),
      );
      const path = `${publishedStoreId}/image/${randomUUID()}.png`;
      const { error } = await asSellerA.storage
        .from("store-media")
        .upload(path, png, { contentType: "image/png" });
      expect(error).toBeNull();
      await admin.storage.from("store-media").remove([path]);
    },
  );
});
