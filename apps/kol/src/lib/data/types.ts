/**
 * KOL — the domain interface the app programs against.
 *
 * This is the SEAM. Pages call `getData()` (see `./index.ts`) and get an
 * implementation of `KolDataSource` — mock today, Supabase the moment the env
 * vars exist. Nothing above this file knows which one it got.
 *
 * The entity SHAPES are the mock types, re-exported verbatim. That is
 * deliberate: keeping `Maker = MockMaker` (rather than declaring a parallel
 * "real" type) means no page has to change when the source flips, and it makes
 * any future divergence a compile error rather than a runtime surprise.
 *
 * The METHOD SET is exactly today's read surface (`db.ts`) plus today's
 * mutations (`store.tsx`) — no more. Mutations the product does not perform
 * yet (sending a message, asking a question) are intentionally absent; adding
 * them here before they exist would let a page depend on behaviour the mock
 * cannot honestly provide.
 *
 * Money is always integer MINOR units (`*Minor`, `priceMinor`, `totalMinor`).
 * Never a float, never a formatted string.
 */

import type {
  MockCollection,
  MockCommunity,
  MockMaker,
  MockNotification,
  MockOrder,
  MockPost,
  MockProduct,
  MockQA,
  MockReview,
  MockThread,
  FeedItem as MockFeedItem,
} from "@/lib/mock/db";
import type { StoreOverride } from "@/lib/mock/store";

/* ------------------------------------------------------------------ */
/* Entity shapes — identical to the mock types, by design.             */
/* ------------------------------------------------------------------ */

export type Maker = MockMaker;
export type FeedItem = MockFeedItem;
export type Product = MockProduct;
export type Review = MockReview;
export type Question = MockQA;
export type Thread = MockThread;
export type Notification = MockNotification;
export type Order = MockOrder;
export type OrderStage = MockOrder["stage"];
export type Community = MockCommunity;
export type Post = MockPost;
export type Collection = MockCollection;
export type { StoreOverride };

/* ------------------------------------------------------------------ */
/* Write inputs                                                        */
/* ------------------------------------------------------------------ */

export interface NewOrderInput {
  makerSlug: string;
  items: { productId: string; qty: number; customization?: string }[];
  /**
   * Client-computed total, carried only so the mock can echo today's
   * behaviour. The Supabase adapter IGNORES it: under B0, `create_order`
   * re-reads every price from `products` server-side (ADR-0001 P1-1).
   */
  totalMinor: number;
}

/**
 * `id` and `verified` are absent on purpose. `reviews.verified` is a GENERATED
 * column (`order_item_id is not null`, ADR-0001 OQ-7) — a client cannot claim
 * it, and the mock must not let it either.
 */
export type NewReviewInput = Omit<Review, "id" | "verified">;

/* ------------------------------------------------------------------ */
/* The interface                                                       */
/* ------------------------------------------------------------------ */

/**
 * Every method is async even where the mock answers synchronously. That is the
 * whole point of the seam: a page written against this interface already
 * awaits, so swapping in the network-backed adapter changes nothing above.
 */
export interface KolDataSource {
  /** Which implementation is live. Surfaced for debug banners and tests. */
  readonly kind: "mock" | "supabase";

  /* --- discovery ------------------------------------------------- */
  listMakers(): Promise<Maker[]>;
  getMaker(slug: string): Promise<Maker | null>;
  listFeed(): Promise<FeedItem[]>;
  /** The "why you're seeing this" line for a feed item, if any. */
  forYouReason(feedItemId: string): Promise<string | null>;

  /* --- catalogue ------------------------------------------------- */
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  productsByMaker(slug: string): Promise<Product[]>;

  /* --- reviews --------------------------------------------------- */
  reviewsForProduct(productId: string): Promise<Review[]>;
  addReview(input: NewReviewInput): Promise<Review>;

  /* --- public Q&A (read-only today) ------------------------------ */
  questionsForProduct(productId: string): Promise<Question[]>;

  /* --- private threads (read-only today) ------------------------- */
  listThreads(): Promise<Thread[]>;
  getThread(id: string): Promise<Thread | null>;

  /* --- notifications (read-only; one-way by design, B16) --------- */
  listNotifications(): Promise<Notification[]>;

  /* --- orders ---------------------------------------------------- */
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Returns the new order id. */
  createOrder(input: NewOrderInput): Promise<string>;
  advanceOrder(id: string, stage: OrderStage): Promise<void>;

  /* --- community ------------------------------------------------- */
  getCommunity(makerSlug: string): Promise<Community | null>;
  postsFor(makerSlug: string): Promise<Post[]>;
  addPost(makerSlug: string, body: string, asMaker?: boolean): Promise<Post>;
  addComment(makerSlug: string, postId: string, body: string): Promise<void>;
  /** Hide-only moderation. `key` is caller-defined (post id or comment key). */
  toggleHidden(key: string): Promise<void>;
  listHidden(): Promise<string[]>;

  /* --- collections ----------------------------------------------- */
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;

  /* --- seller: store draft + publish gate ------------------------ */
  overrideFor(makerSlug: string): Promise<StoreOverride>;
  setOverride(makerSlug: string, patch: StoreOverride): Promise<void>;
  approveBlock(makerSlug: string, blockId: string): Promise<void>;
  markDirty(makerSlug: string, blockId: string): Promise<void>;
  publishStore(makerSlug: string): Promise<void>;

  /** Prototype-only escape hatch; a no-op against a real database. */
  reset(): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Errors                                                             */
/* ------------------------------------------------------------------ */

/**
 * Thrown by the Supabase adapter for a capability the mock has but ADR-0001
 * has NO table for. Making this loud and specific is the honest option:
 * inventing `notifications` / `collections` / `community_posts` tables would
 * put schema in code that the migration plan has never seen.
 */
export class NotInSchemaError extends Error {
  constructor(capability: string, detail: string) {
    super(
      `${capability} has no table in ADR-0001 (docs/03-system-design/adr/0001-kol-data-model.md). ${detail}`,
    );
    this.name = "NotInSchemaError";
  }
}

/** Thrown when a row is well-formed SQL but cannot map onto a domain shape. */
export class DomainMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainMappingError";
  }
}
