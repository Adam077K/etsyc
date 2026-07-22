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
import type { StoreConfig } from "@/lib/store-config/types";
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

/* --- 0002 additions: notifications, collections, community ---------- */

/** `notifications` (B16, migration 0002). Read-own; RLS-scoped. */
const notificationRowSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor_maker_id: z.string().nullable(),
  subject_type: z.string(),
  subject_id: z.string(),
  body_key: z.string(),
  body_vars: z.unknown().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

/** `collection_items` (B17, migration 0002). */
const collectionItemRowSchema = z.object({
  subject_type: z.enum(["product", "maker", "video"]),
  subject_id: z.string(),
  position: z.number().int(),
});

/** `collections` (B17, migration 0002) + its embedded items. */
const collectionRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  visibility: z.enum(["private", "public"]),
  slug: z.string(),
  collection_items: z.array(collectionItemRowSchema).optional(),
});

/** `communities` record (B15/D17, migration 0002). Content is RLS-gated. */
const communityRowSchema = z.object({
  id: z.string(),
  maker_id: z.string(),
  mode: z.enum(["broadcast", "private"]),
  name: z.string(),
  description: z.string().nullable(),
});

/** `community_posts` (migration 0002). */
const communityPostRowSchema = z.object({
  id: z.string(),
  community_id: z.string(),
  author_id: z.string(),
  body: z.string().nullable(),
  pinned: z.boolean(),
  hidden_at: z.string().nullable(),
  created_at: z.string(),
});

/** `post_comments` (migration 0002). Single-level — no parent_comment_id. */
const postCommentRowSchema = z.object({
  id: z.string(),
  post_id: z.string(),
  author_id: z.string(),
  body: z.string(),
  hidden_at: z.string().nullable(),
  created_at: z.string(),
});

/**
 * A `videos` row (group 03) joined to its store and one-to-one `video_profiles`
 * — the raw material the discovery feed is DERIVED from. There is no feed table.
 */
const videoFeedRowSchema = z.object({
  id: z.string(),
  poster: z.string().nullable(),
  created_at: z.string(),
  stores: z.unknown(),
  video_profiles: z.unknown().optional(),
});

/* ------------------------------------------------------------------ */
/* Adapter                                                             */
/* ------------------------------------------------------------------ */

const STORE_COLUMNS = "id, owner_id, handle, name, craft, bio, published, config";
const PRODUCT_COLUMNS =
  "id, store_id, title, description, materials, price_amount, currency, " +
  "inventory_status, inventory_qty, product_specs(*), product_provenance(*)";
const COLLECTION_COLUMNS =
  "id, title, visibility, slug, collection_items(subject_type, subject_id, position)";
const COMMUNITY_POST_COLUMNS =
  "id, community_id, author_id, body, pinned, hidden_at, created_at";

/**
 * `size` and `aspect` are feed-card PRESENTATION tokens with no column in
 * `videos`/`video_profiles`. Until a curation pass owns them, they cycle so the
 * masonry stays visually varied rather than collapsing to one shape.
 */
const FEED_SIZES: FeedItem["size"][] = ["a", "b", "c", "d", "e", "f"];
const FEED_ASPECTS: FeedItem["aspect"][] = ["tall", "square", "wide", "portrait"];

/**
 * `notification_type` (0002 enum) → the domain's coarse six-way bucket. The
 * schema is finer-grained than `MockNotification["type"]`, so this projection
 * is intentionally lossy (draft/version/follower events all read as a generic
 * maker update). Unknown values fall back to "maker-update".
 */
const NOTIFICATION_TYPE: Record<string, Notification["type"]> = {
  maker_new_product: "release",
  maker_new_store_version: "maker-update",
  commission_message_reply: "reply",
  commission_draft_new_version: "commission-milestone",
  order_status_paid: "order",
  order_status_fulfilled: "order",
  order_status_cancelled: "order",
  order_status_refunded: "order",
  question_answered: "reply",
  new_follower: "maker-update",
  community_new_post: "community",
};

/**
 * Best-effort route from a notification's polymorphic (subject_type, subject_id)
 * pair. A fuller resolver (product → /m/[slug]/p/[id]) needs joins this one-way
 * surface does not fetch; these are the safe, non-throwing fallbacks.
 */
function notificationDeepLink(
  subjectType: string,
  subjectId: string,
  makerSlug: string,
): string {
  switch (subjectType) {
    case "order":
      return `/orders/${subjectId}`;
    case "thread":
    case "commission":
      return `/inbox/${subjectId}`;
    case "community_post":
      return makerSlug ? `/m/${makerSlug}/community` : "/notifications";
    default:
      return makerSlug ? `/m/${makerSlug}` : "/notifications";
  }
}

/** `collections` row → domain `Collection`. Pure; safe at module scope. */
function toCollection(row: z.infer<typeof collectionRowSchema>): Collection {
  const items = (row.collection_items ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    // Domain item `kind` is only 'product' | 'maker'. A 'video' item (0002
    // permits it) has no domain representation, so it is DROPPED rather than
    // mis-cast. Widening MockCollection item kind to include 'video' would
    // carry these through — flagged in the return message.
    .filter((it) => it.subject_type !== "video")
    .map((it) => ({
      kind: it.subject_type === "maker" ? ("maker" as const) : ("product" as const),
      // `ref` is the raw subject uuid. For 'product' this is `products.id` (what
      // getProduct expects). For 'maker' it is the maker's profile/store uuid,
      // NOT a handle — a later pass resolves it to a slug for /m/[slug].
      ref: it.subject_id,
    }));
  return { slug: row.slug, title: row.title, visibility: row.visibility, items };
}

/** `community_posts` row + its comments → domain `Post`. Pure. */
function toPost(
  row: z.infer<typeof communityPostRowSchema>,
  makerId: string,
  comments: z.infer<typeof postCommentRowSchema>[],
  names: Map<string, string>,
): Post {
  return {
    id: row.id,
    author: names.get(row.author_id) ?? "A member",
    // isMaker is DERIVED from authorship, never a stored flag: the owning maker
    // is `communities.maker_id`.
    isMaker: row.author_id === makerId,
    body: row.body ?? "",
    when: row.created_at,
    ...(row.pinned ? { pinned: true } : {}),
    comments: comments.map((c) => ({
      author: names.get(c.author_id) ?? "A member",
      body: c.body,
      when: c.created_at,
      ...(c.hidden_at === null ? {} : { hidden: true }),
    })),
  };
}

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

  /** maker slug → its `communities` row (or null). Record is public-read. */
  async function communityByMakerSlug(makerSlug: string) {
    const store = await storeByHandle(makerSlug);
    if (!store) return null;
    const db = await getClient();
    // `communities.maker_id` is the store OWNER's profile id (one per maker).
    const { data, error } = await db
      .from("communities")
      .select("id, maker_id, mode, name, description")
      .eq("maker_id", store.owner_id)
      .maybeSingle();
    if (error) fail(`communities for '${makerSlug}'`, error);
    if (!data) return null;
    return parse(communityRowSchema, data, "communities row");
  }

  /**
   * Posts (with single-level comments) for a community. RLS
   * (`community_posts_read`) already scopes visibility — broadcast → any authed,
   * private → members only, hidden → author/owner only — so this trusts the gate
   * and never re-checks membership client-side.
   */
  async function loadPosts(community: z.infer<typeof communityRowSchema>): Promise<Post[]> {
    const db = await getClient();
    const { data: postData, error: postErr } = await db
      .from("community_posts")
      .select(COMMUNITY_POST_COLUMNS)
      .eq("community_id", community.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (postErr) fail("community_posts select", postErr);
    const posts = (postData ?? []).map((raw) =>
      parse(communityPostRowSchema, raw, "community_posts row"),
    );
    if (posts.length === 0) return [];

    const { data: commentData, error: commentErr } = await db
      .from("post_comments")
      .select("id, post_id, author_id, body, hidden_at, created_at")
      .in(
        "post_id",
        posts.map((p) => p.id),
      )
      .order("created_at", { ascending: true });
    if (commentErr) fail("post_comments select", commentErr);
    const comments = (commentData ?? []).map((raw) =>
      parse(postCommentRowSchema, raw, "post_comments row"),
    );

    const names = await displayNames([
      ...posts.map((p) => p.author_id),
      ...comments.map((c) => c.author_id),
    ]);

    const commentsByPost = new Map<string, z.infer<typeof postCommentRowSchema>[]>();
    for (const c of comments) {
      const list = commentsByPost.get(c.post_id) ?? [];
      list.push(c);
      commentsByPost.set(c.post_id, list);
    }

    return posts.map((p) => toPost(p, community.maker_id, commentsByPost.get(p.id) ?? [], names));
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

    async getStoreConfig(slug: string): Promise<StoreConfig | null> {
      // The full renderable config lives in stores.config (jsonb). Same parse
      // the mappers use — a malformed/absent blob yields null, not a crash.
      const row = await storeByHandle(slug);
      if (!row) return null;
      // stores.config holds the full StoreConfig authored by the seller
      // pipeline (P3 Zod-validates it at WRITE time). The renderer degrades
      // gracefully on any malformed block, so we hand it the raw config and
      // return null only when there is no world to render yet.
      const config = row.config as StoreConfig | null;
      if (!config || !Array.isArray(config.blocks) || config.blocks.length === 0) return null;
      return config;
    },

    async listFeed(): Promise<FeedItem[]> {
      const db = await getClient();
      // No dedicated feed table BY DESIGN (OQ-2). The feed is DERIVED from the
      // canonical clip source — `videos` joined to its published `stores`, plus
      // the one-to-one `video_profiles` that carries `purpose`. RLS already
      // restricts both to published stores. An empty DB yields an empty feed.
      const { data, error } = await db
        .from("videos")
        .select("id, poster, created_at, stores!inner(handle, name, published), video_profiles(purpose)")
        .eq("stores.published", true)
        .order("created_at", { ascending: false });
      if (error) fail("videos feed select", error);

      const items: FeedItem[] = [];
      let i = 0;
      for (const raw of data ?? []) {
        const row = parse(videoFeedRowSchema, raw, "feed video row");
        const profile = one(row.video_profiles as unknown) as { purpose?: unknown } | null;
        const purpose = Array.isArray(profile?.purpose) ? (profile.purpose as string[]) : [];
        // HARD RULE: a thank-you clip can NEVER appear in discovery.
        if (purpose.includes("thankyou")) continue;

        const store = parse(
          z.object({ handle: z.string(), name: z.string() }),
          one(row.stores),
          "feed store",
        );
        // `title`/`size`/`aspect` have no clip-level column (see FEED_SIZES).
        // A later ranking pass adds: real per-clip titles, engine `reason`
        // strings (from buyer_signals, OQ-4), and a size/aspect learned from the
        // poster's true dimensions. Title falls back to the store name today.
        items.push({
          id: row.id,
          makerSlug: store.handle,
          title: store.name || store.handle,
          kind: "video",
          size: FEED_SIZES[i % FEED_SIZES.length] ?? "a",
          aspect: FEED_ASPECTS[i % FEED_ASPECTS.length] ?? "square",
        });
        i += 1;
      }
      return items;
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
      const db = await getClient();
      // Read-own (0002 `notifications_recipient_read`): rows are scoped to
      // `recipient_id = auth.uid()`. Anon → [] (no throw). Emission stays
      // service-role only; there is no client write path.
      const { data, error } = await db
        .from("notifications")
        .select(
          "id, type, actor_maker_id, subject_type, subject_id, body_key, body_vars, read_at, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) fail("notifications select", error);
      const rows = (data ?? []).map((raw) => parse(notificationRowSchema, raw, "notifications row"));
      if (rows.length === 0) return [];

      // `actor_maker_id` is a maker PROFILE id; the domain wants the maker slug
      // (store handle). Resolve the set in one query.
      const actorIds = Array.from(
        new Set(rows.flatMap((r) => (r.actor_maker_id === null ? [] : [r.actor_maker_id]))),
      );
      const handles = new Map<string, string>();
      if (actorIds.length > 0) {
        const { data: storeRows, error: storeErr } = await db
          .from("stores")
          .select("owner_id, handle")
          .in("owner_id", actorIds);
        if (storeErr) fail("stores for notification actors", storeErr);
        for (const s of storeRows ?? []) {
          handles.set(
            String((s as { owner_id: unknown }).owner_id),
            String((s as { handle: unknown }).handle),
          );
        }
      }

      return rows.map((row) => {
        const makerSlug = row.actor_maker_id === null ? "" : (handles.get(row.actor_maker_id) ?? "");
        return {
          id: row.id,
          type: NOTIFICATION_TYPE[row.type] ?? "maker-update",
          makerSlug,
          // `line` is the copy-template KEY, not rendered prose. 0002 stores
          // `body_key` + `body_vars` precisely so no write path can put arbitrary
          // text before a buyer under a maker's name (D10). Rendering the
          // maker-voiced line from (body_key, body_vars) is a presentation-layer
          // concern with a copy catalog this adapter does not own.
          line: row.body_key,
          deepLink: notificationDeepLink(row.subject_type, row.subject_id, makerSlug),
          when: row.created_at,
        };
      });
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
    async getCommunity(makerSlug: string): Promise<Community | null> {
      const community = await communityByMakerSlug(makerSlug);
      if (!community) return null;
      const db = await getClient();
      // Member count is itself RLS-gated (a non-member sees only their own row),
      // so this is best-effort — 0 for a viewer who cannot see the roster.
      const { count, error } = await db
        .from("community_members")
        .select("id", { count: "exact", head: true })
        .eq("community_id", community.id);
      if (error) fail("community_members count", error);

      return {
        makerSlug,
        visibility: community.mode === "private" ? "private" : "public",
        members: count ?? 0,
        posts: await loadPosts(community),
        // `exclusives` (member perks) has NO column in 0002 — `communities`
        // carries only name/description/mode. Empty until a perks table exists,
        // never faked.
        exclusives: [],
      };
    },

    async postsFor(makerSlug: string): Promise<Post[]> {
      const community = await communityByMakerSlug(makerSlug);
      if (!community) return [];
      return loadPosts(community);
    },

    async addPost(makerSlug: string, body: string, asMaker = false): Promise<Post> {
      const community = await communityByMakerSlug(makerSlug);
      if (!community) throw new Error(`no community for maker '${makerSlug}'`);
      const db = await getClient();
      const { data: userData } = await db.auth.getUser();
      const myId = userData.user?.id;
      if (!myId) throw new Error("posting to a community requires an authenticated session");

      // B0: `author_id` is set to the caller's OWN id — the `community_posts_write`
      // WITH CHECK requires `author_id = auth.uid()`, and RLS decides whether this
      // caller may post at all (broadcast → owner only; private → owner or member).
      // `asMaker` is NOT a client-settable flag: maker authorship is derived from
      // `author_id === communities.maker_id`, so the arg is deliberately unused for
      // attribution here (kept for interface parity with the mock).
      void asMaker;
      const { data, error } = await db
        .from("community_posts")
        .insert({ community_id: community.id, author_id: myId, body, kind: "text" })
        .select(COMMUNITY_POST_COLUMNS)
        .single();
      if (error) fail("community_posts insert", error);
      const row = parse(communityPostRowSchema, data, "community_posts row");
      const names = await displayNames([row.author_id]);
      return toPost(row, community.maker_id, [], names);
    },

    async addComment(makerSlug: string, postId: string, body: string): Promise<void> {
      void makerSlug; // read path resolves the post; slug is not needed server-side.
      const db = await getClient();
      const { data: userData } = await db.auth.getUser();
      const myId = userData.user?.id;
      if (!myId) throw new Error("commenting requires an authenticated session");
      // Single-level only: `post_comments` has no parent_comment_id by
      // construction. The read gate IS the write gate (0002) — if you can read
      // the post you may comment; RLS enforces it. `author_id` is the caller's id.
      const { error } = await db
        .from("post_comments")
        .insert({ post_id: postId, author_id: myId, body });
      if (error) fail("post_comments insert", error);
    },

    async toggleHidden(key: string): Promise<void> {
      const db = await getClient();
      // Hide-only moderation (0002): flip `community_posts.hidden_at` (never a
      // hard delete). `key` is a post id. RLS lets only the post's author or the
      // owning maker see a hidden row and update it, so an unauthorised caller
      // reads nothing and this is a no-op. Comment-level hiding is not addressable
      // here: the domain `MockPost.comments[]` carry no id to target.
      const { data, error } = await db
        .from("community_posts")
        .select("id, hidden_at")
        .eq("id", key)
        .maybeSingle();
      if (error) fail("community_posts hidden lookup", error);
      if (!data) return;
      const row = parse(
        z.object({ id: z.string(), hidden_at: z.string().nullable() }),
        data,
        "community_posts hidden row",
      );
      const next = row.hidden_at === null ? new Date().toISOString() : null;
      const { error: updateErr } = await db
        .from("community_posts")
        .update({ hidden_at: next })
        .eq("id", key);
      if (updateErr) fail("community_posts hide update", updateErr);
    },

    async listHidden(): Promise<string[]> {
      const db = await getClient();
      // Ids of hidden posts the caller can still see — per `community_posts_read`,
      // only those they authored or moderate as the owning maker. Anon → []; never
      // throws on a permissionless read.
      const { data, error } = await db
        .from("community_posts")
        .select("id")
        .not("hidden_at", "is", null);
      if (error) fail("community_posts hidden list", error);
      return (data ?? []).map((r) => parse(z.object({ id: z.string() }), r, "hidden id row").id);
    },

    /* --- collections ---------------------------------------------- */
    async listCollections(): Promise<Collection[]> {
      const db = await getClient();
      // RLS returns only boards the caller may see: their own (any visibility)
      // plus every `visibility = 'public'` board. Anon → public boards only.
      const { data, error } = await db.from("collections").select(COLLECTION_COLUMNS);
      if (error) fail("collections select", error);
      return (data ?? []).map((raw) =>
        toCollection(parse(collectionRowSchema, raw, "collections row")),
      );
    },

    async getCollection(slug: string): Promise<Collection | null> {
      const db = await getClient();
      // A private or missing slug returns NO row under RLS — so this yields null
      // (a 404 upstream), never a throw and never a 403 that would leak existence.
      const { data, error } = await db
        .from("collections")
        .select(COLLECTION_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) fail(`collections by slug '${slug}'`, error);
      if (!data) return null;
      return toCollection(parse(collectionRowSchema, data, "collections row"));
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
/* Remaining documented schema gap                                     */
/* ------------------------------------------------------------------ */
//
// The community, collections and notifications gaps were CLOSED by migration
// 0002. The only capability still without a backing table is the 5-step order
// PRODUCTION TIMELINE (`advanceOrder`): `orders.status` is a payment/fulfilment
// enum with no `stage` column and no `order_updates` table in either migration,
// so that method still throws `NotInSchemaError` (see its body above).
