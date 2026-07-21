/**
 * KOL — `KolDataSource` over the existing mock layer.
 *
 * Reads come from the immutable seed (`mock/db.ts`); writes go through the
 * same localStorage-backed external store that `mock/store.tsx` uses, under
 * the SAME key and SAME seed, with the mutation logic reproduced exactly.
 * Behaviour here is what ships today — id format, timeline notes, "just now"
 * ageing, `verified` forced true on new reviews, the lot.
 *
 * ── Migration caveat (read before moving a page) ────────────────────────────
 * `createPersistentStore` keeps its state in module scope. This adapter and
 * the `KolStoreProvider` therefore hold TWO instances over one localStorage
 * key: each reads the persisted value at module init, but neither notifies the
 * other within a session. So migrate a LOOP AT A TIME (all of checkout, or all
 * of community), never half a loop — otherwise a write through `getData()` is
 * invisible to a sibling page still on `useKolStore()` until reload. This
 * disappears the moment the loop is fully on `getData()`, and does not exist
 * at all against Supabase. `store.tsx` is owned by another agent, so the seam
 * cannot be shared from here.
 */

import { createPersistentStore } from "@/lib/mock/persistent-store";
import {
  collections as seedCollections,
  communities as seedCommunities,
  feedItems,
  forYouReasons,
  getMaker as seedGetMaker,
  getProduct as seedGetProduct,
  makers,
  notifications as seedNotifications,
  orders as seedOrders,
  products,
  productsByMaker as seedProductsByMaker,
  questions,
  reviews as seedReviews,
  threads,
  type MockOrder,
  type MockPost,
  type MockReview,
} from "@/lib/mock/db";
import type {
  Collection,
  Community,
  FeedItem,
  KolDataSource,
  Maker,
  NewOrderInput,
  NewReviewInput,
  Notification,
  Order,
  OrderStage,
  Post,
  Product,
  Question,
  Review,
  StoreOverride,
  Thread,
} from "./types";

/* ------------------------------------------------------------------ */
/* Mutable state — mirrors mock/store.tsx exactly                      */
/* ------------------------------------------------------------------ */

interface AppState {
  orders: MockOrder[];
  reviews: MockReview[];
  posts: Record<string, MockPost[]>;
  hidden: string[];
  storeOverride: Record<string, StoreOverride>;
}

const SEED: AppState = {
  orders: seedOrders,
  reviews: seedReviews,
  posts: Object.fromEntries(seedCommunities.map((c) => [c.makerSlug, c.posts])),
  hidden: [],
  storeOverride: {},
};

/** Same key as `mock/store.tsx` — the two must not fork the persisted state. */
const KEY = "kol-prototype-state-v1";
const store = createPersistentStore<AppState>(KEY, SEED);

/**
 * Neutral, factual timeline copy. NOT attributed to the maker — D10 forbids
 * fabricating maker voice, so these read as status, not as something she said.
 */
const STAGE_NOTE: Record<OrderStage, string> = {
  0: "Order accepted.",
  1: "Materials pulled for this piece.",
  2: "In production now.",
  3: "Finishing — glazing, curing, final checks.",
  4: "Shipped. Tracking is attached to this order.",
};

let idSeq = 0;
/** Collision-free local ids: `Date.now()` alone collides within one tick. */
function localId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}${idSeq.toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Adapter                                                             */
/* ------------------------------------------------------------------ */

export function createMockAdapter(): KolDataSource {
  const state = (): AppState => store.getSnapshot();

  return {
    kind: "mock",

    /* --- discovery ------------------------------------------------ */
    async listMakers(): Promise<Maker[]> {
      return makers;
    },
    async getMaker(slug: string): Promise<Maker | null> {
      return seedGetMaker(slug) ?? null;
    },
    async listFeed(): Promise<FeedItem[]> {
      return feedItems;
    },
    async forYouReason(feedItemId: string): Promise<string | null> {
      return forYouReasons[feedItemId] ?? null;
    },

    /* --- catalogue ------------------------------------------------ */
    async listProducts(): Promise<Product[]> {
      return products;
    },
    async getProduct(id: string): Promise<Product | null> {
      return seedGetProduct(id) ?? null;
    },
    async productsByMaker(slug: string): Promise<Product[]> {
      return seedProductsByMaker(slug);
    },

    /* --- reviews -------------------------------------------------- */
    async reviewsForProduct(productId: string): Promise<Review[]> {
      return state().reviews.filter((r) => r.productId === productId);
    },
    async addReview(input: NewReviewInput): Promise<Review> {
      // `verified` is derived, never client-claimed (GENERATED column live).
      const review: Review = { ...input, id: localId("r"), verified: true };
      store.set((s) => ({ ...s, reviews: [review, ...s.reviews] }));
      return review;
    },

    /* --- public Q&A ----------------------------------------------- */
    async questionsForProduct(productId: string): Promise<Question[]> {
      return questions.filter((q) => q.productId === productId);
    },

    /* --- private threads ------------------------------------------ */
    async listThreads(): Promise<Thread[]> {
      return threads;
    },
    async getThread(id: string): Promise<Thread | null> {
      return threads.find((t) => t.id === id) ?? null;
    },

    /* --- notifications -------------------------------------------- */
    async listNotifications(): Promise<Notification[]> {
      return seedNotifications;
    },

    /* --- orders --------------------------------------------------- */
    async listOrders(): Promise<Order[]> {
      return state().orders;
    },
    async getOrder(id: string): Promise<Order | null> {
      return state().orders.find((o) => o.id === id) ?? null;
    },
    async createOrder(input: NewOrderInput): Promise<string> {
      const id = localId("o");
      const order: Order = {
        id,
        makerSlug: input.makerSlug,
        items: input.items,
        totalMinor: input.totalMinor,
        placed: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        stage: 0,
        updates: [
          {
            stage: 0,
            note: "Order in — thank you. I'll start on this and post updates here as it moves.",
            when: "just now",
          },
        ],
      };
      store.set((s) => ({ ...s, orders: [order, ...s.orders] }));
      return id;
    },
    async advanceOrder(id: string, stage: OrderStage): Promise<void> {
      store.set((s) => ({
        ...s,
        orders: s.orders.map((o) => {
          if (o.id !== id || o.stage === stage) return o;
          // Moving an order is an EVENT the buyer should see, so it posts a
          // timeline entry; older entries stop reading "just now".
          const aged = o.updates.map((u) =>
            u.when === "just now" ? { ...u, when: "earlier" } : u,
          );
          return {
            ...o,
            stage,
            updates: [...aged, { stage, note: STAGE_NOTE[stage], when: "just now" }],
          };
        }),
      }));
    },

    /* --- community ------------------------------------------------ */
    async getCommunity(makerSlug: string): Promise<Community | null> {
      const community = seedCommunities.find((c) => c.makerSlug === makerSlug);
      if (!community) return null;
      // Posts are mutable; the rest of the community record is seed.
      return { ...community, posts: state().posts[makerSlug] ?? [] };
    },
    async postsFor(makerSlug: string): Promise<Post[]> {
      return state().posts[makerSlug] ?? [];
    },
    async addPost(makerSlug: string, body: string, asMaker = false): Promise<Post> {
      const post: Post = {
        id: localId("p"),
        author: asMaker ? makerSlug.charAt(0).toUpperCase() + makerSlug.slice(1) : "You",
        isMaker: asMaker,
        body,
        when: "just now",
        comments: [],
      };
      store.set((s) => ({
        ...s,
        posts: { ...s.posts, [makerSlug]: [post, ...(s.posts[makerSlug] ?? [])] },
      }));
      return post;
    },
    async addComment(makerSlug: string, postId: string, body: string): Promise<void> {
      store.set((s) => ({
        ...s,
        posts: {
          ...s.posts,
          [makerSlug]: (s.posts[makerSlug] ?? []).map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, { author: "You", body, when: "just now" }] }
              : p,
          ),
        },
      }));
    },
    async toggleHidden(key: string): Promise<void> {
      store.set((s) => ({
        ...s,
        hidden: s.hidden.includes(key) ? s.hidden.filter((k) => k !== key) : [...s.hidden, key],
      }));
    },
    async listHidden(): Promise<string[]> {
      return state().hidden;
    },

    /* --- collections ---------------------------------------------- */
    async listCollections(): Promise<Collection[]> {
      return seedCollections;
    },
    async getCollection(slug: string): Promise<Collection | null> {
      return seedCollections.find((c) => c.slug === slug) ?? null;
    },

    /* --- seller --------------------------------------------------- */
    async overrideFor(makerSlug: string): Promise<StoreOverride> {
      return state().storeOverride[makerSlug] ?? {};
    },
    async setOverride(makerSlug: string, patch: StoreOverride): Promise<void> {
      store.set((s) => ({
        ...s,
        storeOverride: {
          ...s.storeOverride,
          [makerSlug]: { ...(s.storeOverride[makerSlug] ?? {}), ...patch },
        },
      }));
    },
    async approveBlock(makerSlug: string, blockId: string): Promise<void> {
      store.set((s) => {
        const cur = s.storeOverride[makerSlug] ?? {};
        return {
          ...s,
          storeOverride: {
            ...s.storeOverride,
            [makerSlug]: {
              ...cur,
              approved: Array.from(new Set([...(cur.approved ?? []), blockId])),
              dirty: (cur.dirty ?? []).filter((d) => d !== blockId),
            },
          },
        };
      });
    },
    async markDirty(makerSlug: string, blockId: string): Promise<void> {
      store.set((s) => {
        const cur = s.storeOverride[makerSlug] ?? {};
        // Editing removes the block from approved_sections — critic must re-run.
        return {
          ...s,
          storeOverride: {
            ...s.storeOverride,
            [makerSlug]: {
              ...cur,
              dirty: Array.from(new Set([...(cur.dirty ?? []), blockId])),
              approved: (cur.approved ?? []).filter((a) => a !== blockId),
            },
          },
        };
      });
    },
    async publishStore(makerSlug: string): Promise<void> {
      store.set((s) => {
        const cur = s.storeOverride[makerSlug] ?? {};
        return {
          ...s,
          storeOverride: {
            ...s.storeOverride,
            [makerSlug]: { ...cur, published: true, publishedAt: new Date().toISOString() },
          },
        };
      });
    },

    async reset(): Promise<void> {
      store.reset();
    },
  };
}
