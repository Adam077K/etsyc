/**
 * KOL — `KolDataSource` over the real ADR-0001 schema.
 *
 * Every table, column, RPC and enum referenced here exists in
 * `docs/03-system-design/adr/0001-kol-data-model.md` and its migration plan
 * (`docs/03-system-design/migrations-plan/01..13`). Nothing is invented: where
 * the mock has a capability the schema has no table for, the method throws
 * `NotInSchemaError` naming the gap, rather than guessing at a shape the
 * migration has never seen. The full gap list is in `./README.md`.
 *
 * ── The B0 rule ─────────────────────────────────────────────────────────────
 * RLS is the ONLY boundary in this stack — an authed user reaches PostgREST
 * directly with their JWT, so an app-layer allow-list is not a control. Any
 * write a client must not be trusted with therefore goes through a SECURITY
 * DEFINER RPC or the service role, never an anon/authed insert:
 *
 *   - order creation           → rpc('create_order')  — prices re-read from
 *                                `products` server-side, status forced
 *                                'pending' (ADR-0001 P1-1)
 *   - order status transitions → rpc('set_order_status') / rpc('cancel_order')
 *   - `orders.status = 'paid'` → Stripe webhook, service role only (P1-1)
 *   - `buyer_signals`          → service role only, weight CHECK 0–100 (P2-4)
 *   - `reviews.verified`       → GENERATED column, not writable at all (OQ-7)
 *   - `profiles.role`          → service role during seller onboarding (P2-1/2)
 *   - real-maker verification  → service role + trigger (P1-2)
 *
 * Reads are plain RLS-scoped selects; the anon key is enough for public data.
 */

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  DomainMappingError,
  NotInSchemaError,
  type Collection,
  type Community,
  type FeedItem,
  type KolDataSource,
  type Maker,
  type NewOrderInput,
  type NewReviewInput,
  type Notification,
  type Order,
  type OrderStage,
  type Post,
  type Product,
  type Question,
  type Review,
  type StoreOverride,
  type Thread,
} from "./types";

/** Resolves the right client for the current execution context. */
export type ClientProvider = () => Promise<SupabaseClient>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fail(context: string, error: PostgrestError): never {
  // Postgres error text is safe to surface; it never carries credentials.
  throw new Error(`${context}: ${error.message}`);
}

/** Zod-validates a network payload. Nothing untyped crosses the seam. */
function parse<T>(schema: z.ZodType<T>, value: unknown, context: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DomainMappingError(`${context} did not match the expected shape: ${result.error.message}`);
  }
  return result.data;
}

/**
 * PostgREST returns an embedded one-to-one resource as an object when it can
 * see the uniqueness constraint and as a single-element array otherwise.
 * Normalise both.
 */
function one<T>(embedded: T | T[] | null | undefined): T | null {
  if (embedded === null || embedded === undefined) return null;
  if (Array.isArray(embedded)) return embedded[0] ?? null;
  return embedded;
}

/**
 * ADR-0001 stores `currency` as char(3) with a 'GBP' default, while the mock
 * domain type pins `"USD"`. Widening `MockProduct["currency"]` lives in
 * `src/lib/mock/db.ts`, which this agent does not own — so until that lands,
 * a non-USD row is a loud mapping error rather than a silent lie about price.
 */
function toDomainCurrency(currency: string): "USD" {
  if (currency !== "USD") {
    throw new DomainMappingError(
      `product currency '${currency}' cannot be represented: the domain type pins "USD". ` +
        `Widen MockProduct["currency"] in src/lib/mock/db.ts to a 3-letter code.`,
    );
  }
  return "USD";
}

/**
 * `orders.status` is a payment/fulfilment enum
 * ('pending'|'paid'|'fulfilled'|'cancelled'|'refunded'), NOT the mock's 5-step
 * production timeline. There is no `stage` column and no `order_updates`
 * table in ADR-0001, so this projection is deliberately lossy and the timeline
 * comes back empty. See the gap list in ./README.md.
 */
function statusToStage(status: string): OrderStage {
  switch (status) {
    case "fulfilled":
      return 4;
    case "paid":
      return 1;
    default:
      return 0;
  }
}

/* ------------------------------------------------------------------ */
/* Row schemas — column names are ADR-0001's, verbatim                 */
/* ------------------------------------------------------------------ */

/** `stores` (group 02) + the D4 jsonb config (store-config.schema.md §2.1). */
const storeConfigSchema = z
  .object({
    maker: z
      .object({
        displayName: z.string().optional(),
        craft: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
      })
      .optional(),
    blocks: z.array(z.object({ id: z.string() }).loose()).optional(),
    theme: z.record(z.string(), z.unknown()).optional(),
    meta: z
      .object({
        approvedSections: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .loose();

const storeRowSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  handle: z.string(),
  name: z.string(),
  craft: z.string().nullable(),
  bio: z.string().nullable(),
  published: z.boolean(),
  config: z.unknown(),
});

const productRowSchema = z.object({
  id: z.string(),
  store_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  materials: z.string().nullable(),
  price_amount: z.number().int(),
  currency: z.string(),
  inventory_status: z.enum(["in-stock", "made-to-order", "sold-out"]),
  inventory_qty: z.number().int().nullable(),
  product_specs: z.unknown().optional(),
  product_provenance: z.unknown().optional(),
});

const productSpecsSchema = z.object({
  dimensions: z.string().nullable(),
  materials: z.string().nullable(),
  texture: z.string().nullable(),
  handmade_variation: z.string().nullable(),
  production_time: z.string().nullable(),
  shipping: z.string().nullable(),
  care: z.string().nullable(),
  repairs: z.string().nullable(),
  returns: z.string().nullable(),
  customization_limits: z.string().nullable(),
});

const productProvenanceSchema = z.object({
  maker_role: z.string().nullable(),
  materials: z.string().nullable(),
  process: z.string().nullable(),
  production_location: z.string().nullable(),
  partners: z.string().nullable(),
});

const reviewRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  buyer_id: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().nullable(),
  variation: z.string().nullable(),
  expectation_accuracy: z.number().int().min(1).max(5).nullable(),
  verified: z.boolean(),
  maker_response: z.string().nullable(),
  created_at: z.string(),
  review_media: z.array(z.object({ id: z.string() })).optional(),
});

const questionRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  buyer_id: z.string(),
  body: z.string(),
  answers: z
    .array(
      z.object({
        kind: z.enum(["text", "audio", "video"]),
        body: z.string().nullable(),
      }),
    )
    .optional(),
});

const threadRowSchema = z.object({
  id: z.string(),
  buyer_id: z.string(),
  maker_id: z.string(),
  store_id: z.string().nullable(),
  commission_id: z.string().nullable(),
  subject: z.string().nullable(),
  messages: z
    .array(
      z.object({
        sender_id: z.string(),
        kind: z.enum(["text", "audio", "video"]),
        body: z.string().nullable(),
        created_at: z.string(),
      }),
    )
    .optional(),
});

const orderRowSchema = z.object({
  id: z.string(),
  store_id: z.string(),
  status: z.string(),
  subtotal_amount: z.number().int(),
  created_at: z.string(),
  order_items: z
    .array(
      z.object({
        product_id: z.string(),
        quantity: z.number().int(),
        variation: z.string().nullable(),
      }),
    )
    .optional(),
});

const storeVersionRowSchema = z.object({
  id: z.string(),
  store_id: z.string(),
  version: z.number().int(),
  status: z.enum(["draft", "in_review", "approved", "published"]),
  config: z.unknown(),
  approved_sections: z.unknown(),
  created_at: z.string(),
});

const publicProfileSchema = z.object({
  id: z.string(),
  display_name: z.string(),
});

/* ------------------------------------------------------------------ */
/* Adapter                                                             */
/* ------------------------------------------------------------------ */

const STORE_COLUMNS = "id, owner_id, handle, name, craft, bio, published, config";
const PRODUCT_COLUMNS =
  "id, store_id, title, description, materials, price_amount, currency, " +
  "inventory_status, inventory_qty, product_specs(*), product_provenance(*)";

export function createSupabaseAdapter(getClient: ClientProvider): KolDataSource {
  /* --- shared plumbing ------------------------------------------- */

  /** maker slug → `stores.handle`. Returns the row or null. */
  async function storeByHandle(handle: string) {
    const db = await getClient();
    const { data, error } = await db
      .from("stores")
      .select(STORE_COLUMNS)
      .eq("handle", handle)
      .maybeSingle();
    if (error) fail(`stores by handle '${handle}'`, error);
    if (!data) return null;
    return parse(storeRowSchema, data, "stores row");
  }

  /**
   * Display names for a set of buyer ids. `profiles` PII is gated by RLS, so
   * this goes through `get_public_profile(uuid)` — the id-keyed SECURITY
   * DEFINER read that ADR-0001 NEW-1 introduced specifically to stop anon
   * enumeration of every user.
   */
  async function displayNames(ids: string[]): Promise<Map<string, string>> {
    const db = await getClient();
    const unique = Array.from(new Set(ids));
    const out = new Map<string, string>();
    await Promise.all(
      unique.map(async (id) => {
        const { data, error } = await db.rpc("get_public_profile", { p_id: id });
        if (error) fail(`get_public_profile(${id})`, error);
        const row = one(data as unknown);
        if (!row) return;
        out.set(id, parse(publicProfileSchema, row, "public profile").display_name);
      }),
    );
    return out;
  }

  /* --- mappers ---------------------------------------------------- */

  function toMaker(
    row: z.infer<typeof storeRowSchema>,
    opts: { verified: boolean; followers: number },
  ): Maker {
    const config = parse(storeConfigSchema, row.config ?? {}, "stores.config");
    const maker = config.maker ?? {};
    return {
      slug: row.handle,
      name: maker.displayName ?? row.name,
      craft: row.craft ?? maker.craft ?? "",
      // `location` and `craftLine` have no column: they are D4 config identity
      // fields (store-config.schema.md §2.1), so they come from the blob.
      location: maker.location ?? "",
      craftLine: maker.craft ?? row.craft ?? "",
      // `filmClass` is a mock presentation token with no schema equivalent —
      // a live world takes its look from `config.theme`, not from this enum.
      filmClass: "v1",
      verified: opts.verified,
      hasWorld: row.published && (config.blocks?.length ?? 0) > 0,
      followers: opts.followers,
      bio: row.bio ?? maker.bio ?? "",
    };
  }

  function toProduct(row: z.infer<typeof productRowSchema>, makerSlug: string): Product {
    const specsRow = one(row.product_specs);
    const provenanceRow = one(row.product_provenance);
    const specs = specsRow ? parse(productSpecsSchema, specsRow, "product_specs row") : null;
    const provenance = provenanceRow
      ? parse(productProvenanceSchema, provenanceRow, "product_provenance row")
      : null;

    const expect: Record<string, string> = {};
    const put = (label: string, value: string | null | undefined): void => {
      if (value) expect[label] = value;
    };
    // Ten of the eleven P14 labels have a `product_specs` column. "First use"
    // does NOT — the table has no `first_use` column, so that field is simply
    // absent here rather than fabricated. Flagged in ./README.md.
    put("Dimensions", specs?.dimensions);
    put("Materials", specs?.materials);
    put("Texture", specs?.texture);
    put("Handmade variation", specs?.handmade_variation);
    put("Production time", specs?.production_time);
    put("Shipping", specs?.shipping);
    put("Care", specs?.care);
    put("Repairs", specs?.repairs);
    put("Returns", specs?.returns);
    put("Customization limits", specs?.customization_limits);

    return {
      id: row.id,
      makerSlug,
      title: row.title,
      // Money stays an integer in minor units end to end (ADR-0001 rationale 4).
      priceMinor: row.price_amount,
      currency: toDomainCurrency(row.currency),
      description: row.description ?? "",
      inventory: {
        status: row.inventory_status,
        ...(row.inventory_qty === null ? {} : { qty: row.inventory_qty }),
      },
      filmClass: "v1",
      provenance: {
        role: provenance?.maker_role ?? "",
        materials: provenance?.materials ?? row.materials ?? "",
        process: provenance?.process ?? "",
        location: provenance?.production_location ?? "",
        partners: provenance?.partners ?? "",
      },
      expect,
    };
  }

  /* --- interface -------------------------------------------------- */

  return {
    kind: "supabase",

    /* --- discovery ------------------------------------------------ */
    async listMakers(): Promise<Maker[]> {
      const db = await getClient();
      const { data, error } = await db.from("stores").select(STORE_COLUMNS).eq("published", true);
      if (error) fail("stores select", error);
      const rows = (data ?? []).map((row) => parse(storeRowSchema, row, "stores row"));
      if (rows.length === 0) return [];

      const storeIds = rows.map((r) => r.id);
      const ownerIds = rows.map((r) => r.owner_id);

      // Real-Maker verification is a `badges` row, mintable only when a
      // `verifications` row resolved (ADR-0001 P1-2) — never self-claimed.
      const { data: badgeRows, error: badgeError } = await db
        .from("badges")
        .select("store_id, kind")
        .eq("kind", "real-maker")
        .in("store_id", storeIds);
      if (badgeError) fail("badges select", badgeError);
      const verifiedStores = new Set(
        (badgeRows ?? []).map((b) => String((b as { store_id: unknown }).store_id)),
      );

      // Follower counts: `follows` is buyer→maker (OQ-7), keyed on the store
      // OWNER's profile id, not on the store.
      const { data: followRows, error: followError } = await db
        .from("follows")
        .select("maker_id")
        .in("maker_id", ownerIds);
      if (followError) fail("follows select", followError);
      const followers = new Map<string, number>();
      for (const row of followRows ?? []) {
        const id = String((row as { maker_id: unknown }).maker_id);
        followers.set(id, (followers.get(id) ?? 0) + 1);
      }

      return rows.map((row) =>
        toMaker(row, {
          verified: verifiedStores.has(row.id),
          followers: followers.get(row.owner_id) ?? 0,
        }),
      );
    },

    async getMaker(slug: string): Promise<Maker | null> {
      const db = await getClient();
      const row = await storeByHandle(slug);
      if (!row) return null;

      const [{ data: badgeRows, error: badgeError }, { data: followRows, error: followError }] =
        await Promise.all([
          db.from("badges").select("id").eq("kind", "real-maker").eq("store_id", row.id),
          db.from("follows").select("id").eq("maker_id", row.owner_id),
        ]);
      if (badgeError) fail("badges select", badgeError);
      if (followError) fail("follows select", followError);

      return toMaker(row, {
        verified: (badgeRows ?? []).length > 0,
        followers: (followRows ?? []).length,
      });
    },

    async listFeed(): Promise<FeedItem[]> {
      throw new NotInSchemaError(
        "The discovery feed",
        "`videos` + `video_profiles` (OQ-2) are the canonical, GIN-indexed clip " +
          "source, but they carry no feed-card presentation fields — no title, " +
          "no `size`, no `aspect` — and no ranking. Implement this against the " +
          "D5 selection engine route once it exists, not as a raw table read.",
      );
    },

    async forYouReason(): Promise<string | null> {
      // Ranking explanations are produced by the engine from `buyer_signals`
      // (OQ-4), which is service-role read/write. Nothing to read client-side.
      return null;
    },

    /* --- catalogue ------------------------------------------------ */
    async listProducts(): Promise<Product[]> {
      const db = await getClient();
      const { data, error } = await db
        .from("products")
        .select(`${PRODUCT_COLUMNS}, stores!inner(handle)`)
        .eq("stores.published", true);
      if (error) fail("products select", error);
      return (data ?? []).map((raw) => {
        const row = parse(productRowSchema, raw, "products row");
        const store = one((raw as { stores?: unknown }).stores);
        const handle = parse(z.object({ handle: z.string() }), store, "embedded store").handle;
        return toProduct(row, handle);
      });
    },

    async getProduct(id: string): Promise<Product | null> {
      const db = await getClient();
      const { data, error } = await db
        .from("products")
        .select(`${PRODUCT_COLUMNS}, stores(handle)`)
        .eq("id", id)
        .maybeSingle();
      if (error) fail(`products by id '${id}'`, error);
      if (!data) return null;
      const row = parse(productRowSchema, data, "products row");
      const store = one((data as { stores?: unknown }).stores);
      const handle = parse(z.object({ handle: z.string() }), store, "embedded store").handle;
      return toProduct(row, handle);
    },

    async productsByMaker(slug: string): Promise<Product[]> {
      const db = await getClient();
      const store = await storeByHandle(slug);
      if (!store) return [];
      const { data, error } = await db
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("store_id", store.id);
      if (error) fail(`products for store '${slug}'`, error);
      return (data ?? []).map((raw) =>
        toProduct(parse(productRowSchema, raw, "products row"), slug),
      );
    },

    /* --- reviews -------------------------------------------------- */
    async reviewsForProduct(productId: string): Promise<Review[]> {
      const db = await getClient();
      const { data, error } = await db
        .from("reviews")
        .select(
          "id, product_id, buyer_id, rating, body, variation, expectation_accuracy, " +
            "verified, maker_response, created_at, review_media(id)",
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) fail(`reviews for product '${productId}'`, error);

      const rows = (data ?? []).map((raw) => parse(reviewRowSchema, raw, "reviews row"));
      const names = await displayNames(rows.map((r) => r.buyer_id));

      return rows.map((row) => {
        const stars = row.rating as Review["stars"];
        return {
          id: row.id,
          productId: row.product_id,
          buyer: names.get(row.buyer_id) ?? "A buyer",
          // GENERATED column (`order_item_id is not null`, OQ-7) — read only.
          verified: row.verified,
          stars,
          expectationAccuracy: (row.expectation_accuracy ?? row.rating) as Review["stars"],
          body: row.body ?? "",
          ...(row.variation === null ? {} : { variation: row.variation }),
          hasPhoto: (row.review_media ?? []).length > 0,
          ...(row.maker_response === null ? {} : { makerResponse: row.maker_response }),
          when: row.created_at,
        };
      });
    },

    async addReview(input: NewReviewInput): Promise<Review> {
      const db = await getClient();
      // A buyer INSERT is allowed directly by RLS — it does NOT need a server
      // route, because the field a client must not control (`verified`) is a
      // GENERATED column, and the P1-3 WITH CHECK already requires that any
      // bound `order_item_id` belongs to the buyer AND matches the product.
      //
      // `NewReviewInput` carries no order item id, so this insert lands with
      // `order_item_id = null` and `verified` computes to FALSE. Earning the
      // verified badge requires threading the buyer's order item through the
      // review form — tracked in ./README.md.
      const { data, error } = await db
        .from("reviews")
        .insert({
          product_id: input.productId,
          rating: input.stars,
          body: input.body,
          variation: input.variation ?? null,
          expectation_accuracy: input.expectationAccuracy,
        })
        .select(
          "id, product_id, buyer_id, rating, body, variation, expectation_accuracy, " +
            "verified, maker_response, created_at",
        )
        .single();
      if (error) fail("reviews insert", error);

      const row = parse(reviewRowSchema, data, "reviews row");
      const names = await displayNames([row.buyer_id]);
      return {
        id: row.id,
        productId: row.product_id,
        buyer: names.get(row.buyer_id) ?? "You",
        verified: row.verified,
        stars: row.rating as Review["stars"],
        expectationAccuracy: (row.expectation_accuracy ?? row.rating) as Review["stars"],
        body: row.body ?? "",
        ...(row.variation === null ? {} : { variation: row.variation }),
        hasPhoto: false,
        when: row.created_at,
      };
    },

    /* --- public Q&A ----------------------------------------------- */
    async questionsForProduct(productId: string): Promise<Question[]> {
      const db = await getClient();
      // `questions`/`answers` are public-read and deliberately separate from
      // the private `threads`/`messages` pair (OQ-5).
      const { data, error } = await db
        .from("questions")
        .select("id, product_id, buyer_id, body, answers(kind, body)")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) fail(`questions for product '${productId}'`, error);

      const rows = (data ?? []).map((raw) => parse(questionRowSchema, raw, "questions row"));
      const names = await displayNames(rows.map((r) => r.buyer_id));

      return rows.map((row) => {
        const answer = (row.answers ?? [])[0];
        return {
          id: row.id,
          productId: row.product_id,
          asker: names.get(row.buyer_id) ?? "A buyer",
          question: row.body,
          ...(answer
            ? {
                answer: answer.body ?? "",
                // Domain knows text|audio; the schema also has 'video', which
                // maps onto 'audio' rather than being dropped silently.
                answerKind: answer.kind === "text" ? ("text" as const) : ("audio" as const),
              }
            : {}),
        };
      });
    },

    /* --- private threads ------------------------------------------ */
    async listThreads(): Promise<Thread[]> {
      const db = await getClient();
      // RLS scopes this to threads where the caller is buyer or maker.
      const { data, error } = await db
        .from("threads")
        .select(
          "id, buyer_id, maker_id, store_id, commission_id, subject, " +
            "messages(sender_id, kind, body, created_at)",
        )
        .order("updated_at", { ascending: false });
      if (error) fail("threads select", error);

      const rows = (data ?? []).map((raw) => parse(threadRowSchema, raw, "threads row"));
      if (rows.length === 0) return [];

      const db2 = await getClient();
      const { data: storeRows, error: storeError } = await db2
        .from("stores")
        .select("id, handle")
        .in(
          "id",
          rows.flatMap((r) => (r.store_id === null ? [] : [r.store_id])),
        );
      if (storeError) fail("stores select", storeError);
      const handles = new Map(
        (storeRows ?? []).map((s) => [
          String((s as { id: unknown }).id),
          String((s as { handle: unknown }).handle),
        ]),
      );

      const { data: userData } = await db.auth.getUser();
      const myId = userData.user?.id ?? null;

      return rows.map((row) => ({
        id: row.id,
        makerSlug: row.store_id === null ? "" : (handles.get(row.store_id) ?? ""),
        // Thread type is derived: a commission link makes it a commission, an
        // attached order makes it an order thread. There is no `threads.type`
        // column, and inventing one would fork the migration plan.
        type: row.commission_id === null ? "question" : "commission",
        subject: row.subject ?? "",
        messages: (row.messages ?? []).map((m) => ({
          from: m.sender_id === myId ? ("you" as const) : ("maker" as const),
          kind: m.kind === "text" ? ("text" as const) : ("audio" as const),
          body: m.body ?? "",
          when: m.created_at,
        })),
        // No read-receipt column exists in ADR-0001; unread is not derivable.
        unread: false,
      }));
    },

    async getThread(id: string): Promise<Thread | null> {
      const all = await this.listThreads();
      return all.find((t) => t.id === id) ?? null;
    },

    /* --- notifications -------------------------------------------- */
    async listNotifications(): Promise<Notification[]> {
      throw new NotInSchemaError(
        "Notifications",
        "ADR-0001 has no `notifications` table. B16 notifications are one-way, " +
          "maker-attributed copy that must be WRITTEN server-side on real " +
          "events (ship, reply, draft posted) — a service-role emitter beside " +
          "`buyer_signals` (P2-4), not a client insert. Needs a migration group.",
      );
    },

    /* --- orders --------------------------------------------------- */
    async listOrders(): Promise<Order[]> {
      const db = await getClient();
      // `orders`/`order_items` are SELECT-only under RLS (P1-1).
      const { data, error } = await db
        .from("orders")
        .select(
          "id, store_id, status, subtotal_amount, created_at, " +
            "order_items(product_id, quantity, variation)",
        )
        .order("created_at", { ascending: false });
      if (error) fail("orders select", error);

      const rows = (data ?? []).map((raw) => parse(orderRowSchema, raw, "orders row"));
      if (rows.length === 0) return [];

      const { data: storeRows, error: storeError } = await db
        .from("stores")
        .select("id, handle")
        .in("id", rows.map((r) => r.store_id));
      if (storeError) fail("stores select", storeError);
      const handles = new Map(
        (storeRows ?? []).map((s) => [
          String((s as { id: unknown }).id),
          String((s as { handle: unknown }).handle),
        ]),
      );

      return rows.map((row) => ({
        id: row.id,
        makerSlug: handles.get(row.store_id) ?? "",
        items: (row.order_items ?? []).map((item) => ({
          productId: item.product_id,
          qty: item.quantity,
          ...(item.variation === null ? {} : { customization: item.variation }),
        })),
        totalMinor: row.subtotal_amount,
        placed: row.created_at,
        stage: statusToStage(row.status),
        // No `order_updates` table exists — the maker-authored timeline and the
        // thank-you note (B8/D10) have no storage yet. Empty, never invented.
        updates: [],
      }));
    },

    async getOrder(id: string): Promise<Order | null> {
      const all = await this.listOrders();
      return all.find((o) => o.id === id) ?? null;
    },

    async createOrder(input: NewOrderInput): Promise<string> {
      const db = await getClient();
      const store = await storeByHandle(input.makerSlug);
      if (!store) throw new Error(`no store with handle '${input.makerSlug}'`);

      // B0: order creation NEVER inserts. `create_order` is SECURITY DEFINER —
      // it re-reads every price from `products`, binds `buyer_id` to
      // `auth.uid()`, forces status 'pending', and rejects cross-store items
      // and non-positive quantities (ADR-0001 P1-1). `input.totalMinor` is
      // therefore deliberately IGNORED: a client-supplied total is untrusted.
      const { data, error } = await db.rpc("create_order", {
        p_store_id: store.id,
        p_items: input.items.map((item) => ({
          product_id: item.productId,
          quantity: item.qty,
          variation: item.customization ?? null,
        })),
      });
      if (error) fail("rpc create_order", error);
      return parse(z.string(), data, "create_order result");
    },

    async advanceOrder(): Promise<void> {
      throw new NotInSchemaError(
        "The 5-step order production timeline",
        "`orders.status` is a payment/fulfilment enum (pending|paid|fulfilled|" +
          "cancelled|refunded) with no production `stage` column and no " +
          "`order_updates` table. The seller-side transition that DOES exist is " +
          "`rpc('set_order_status')` (P1-1, whitelisted targets, seller's own " +
          "store only) — call that directly from a server route once the " +
          "timeline has a table.",
      );
    },

    /* --- community ------------------------------------------------ */
    async getCommunity(): Promise<Community | null> {
      throw communityGap();
    },
    async postsFor(): Promise<Post[]> {
      throw communityGap();
    },
    async addPost(): Promise<Post> {
      throw communityGap();
    },
    async addComment(): Promise<void> {
      throw communityGap();
    },
    async toggleHidden(): Promise<void> {
      throw communityGap();
    },
    async listHidden(): Promise<string[]> {
      throw communityGap();
    },

    /* --- collections ---------------------------------------------- */
    async listCollections(): Promise<Collection[]> {
      throw collectionsGap();
    },
    async getCollection(): Promise<Collection | null> {
      throw collectionsGap();
    },

    /* --- seller: store draft + publish gate ------------------------ */
    async overrideFor(makerSlug: string): Promise<StoreOverride> {
      const db = await getClient();
      const store = await storeByHandle(makerSlug);
      if (!store) return {};

      // The draft world lives in `store_versions` (config snapshot +
      // approved_sections, the P10 human gate); `stores.published` is the
      // live flag.
      const { data, error } = await db
        .from("store_versions")
        .select("id, store_id, version, status, config, approved_sections, created_at")
        .eq("store_id", store.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) fail(`store_versions for '${makerSlug}'`, error);

      const override: StoreOverride = { published: store.published };
      if (!data) return override;

      const version = parse(storeVersionRowSchema, data, "store_versions row");
      const config = parse(storeConfigSchema, version.config ?? {}, "store_versions.config");
      const approved = parse(
        z.array(z.string()).catch([]),
        version.approved_sections,
        "approved_sections",
      );

      return {
        ...override,
        order: (config.blocks ?? []).map((b) => b.id),
        approved,
        // `dirty` (edited-since-approval) has no column; it is a client-side
        // editor concern until a migration adds it. Absent, not guessed.
        ...(config.theme === undefined ? {} : { theme: config.theme as StoreOverride["theme"] }),
        ...(version.status === "published" ? { publishedAt: version.created_at } : {}),
      };
    },

    async setOverride(makerSlug: string, patch: StoreOverride): Promise<void> {
      const db = await getClient();
      const store = await storeByHandle(makerSlug);
      if (!store) throw new Error(`no store with handle '${makerSlug}'`);

      // Owner-scoped write: `store_versions` RLS already restricts writes to
      // stores the caller owns, so no B0 route is needed here. The config blob
      // stays jsonb by D4 — it is never normalised into columns.
      const { data, error } = await db
        .from("store_versions")
        .select("id, store_id, version, status, config, approved_sections, created_at")
        .eq("store_id", store.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) fail(`store_versions for '${makerSlug}'`, error);
      if (!data) throw new Error(`store '${makerSlug}' has no version to patch`);

      const version = parse(storeVersionRowSchema, data, "store_versions row");
      const config = parse(z.record(z.string(), z.unknown()).catch({}), version.config, "config");
      const nextConfig: Record<string, unknown> = { ...config };
      if (patch.theme !== undefined) nextConfig.theme = patch.theme;

      const update: Record<string, unknown> = { config: nextConfig };
      if (patch.approved !== undefined) update.approved_sections = patch.approved;

      const { error: updateError } = await db
        .from("store_versions")
        .update(update)
        .eq("id", version.id);
      if (updateError) fail("store_versions update", updateError);

      if (patch.published !== undefined) {
        const { error: publishError } = await db
          .from("stores")
          .update({ published: patch.published })
          .eq("id", store.id);
        if (publishError) fail("stores update", publishError);
      }
    },

    async approveBlock(makerSlug: string, blockId: string): Promise<void> {
      const current = await this.overrideFor(makerSlug);
      const approved = Array.from(new Set([...(current.approved ?? []), blockId]));
      await this.setOverride(makerSlug, { approved });
    },

    async markDirty(makerSlug: string, blockId: string): Promise<void> {
      // Editing pulls the block out of approved_sections so the P9 critic and
      // the P10 human gate must both run again before publish.
      const current = await this.overrideFor(makerSlug);
      const approved = (current.approved ?? []).filter((id) => id !== blockId);
      await this.setOverride(makerSlug, { approved });
    },

    async publishStore(makerSlug: string): Promise<void> {
      await this.setOverride(makerSlug, { published: true });
    },

    async reset(): Promise<void> {
      // Never destructive against a real database.
    },
  };
}

/* ------------------------------------------------------------------ */
/* Documented schema gaps                                              */
/* ------------------------------------------------------------------ */

function communityGap(): NotInSchemaError {
  return new NotInSchemaError(
    "Maker communities",
    "ADR-0001 has no `communities`, `posts`, `post_comments` or moderation " +
      "table. B15 community (single-level comments, hide-only moderation, " +
      "membership = follows) was folded into the product after the schema was " +
      "authored and needs its own migration group with RLS keyed on `follows`.",
  );
}

function collectionsGap(): NotInSchemaError {
  return new NotInSchemaError(
    "Collections",
    "ADR-0001 has `saves` (polymorphic product|store, OQ-7) but no " +
      "`collections` / `collection_items` table, and no public-board " +
      "visibility flag. B17 needs a migration group before this can be real.",
  );
}
