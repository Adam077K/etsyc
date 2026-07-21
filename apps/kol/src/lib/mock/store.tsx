"use client";

/**
 * KOL prototype — mutable application state.
 *
 * `db.ts` is the immutable SEED. This provider holds everything the
 * prototype can CHANGE, so the product's loops actually close:
 *
 *   buy      → checkout creates a real order from real cart lines
 *   review   → a submitted review appears on the product page
 *   community→ posts and comments are written, not just read
 *   sell     → editor mutates a draft world; publishing makes the
 *              buyer-facing world reflect it (the whole thesis)
 *
 * Persisted to localStorage. In the live build every mutation here is a
 * Supabase write behind RLS; the shapes intentionally mirror ADR-0001.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createPersistentStore } from "./persistent-store";
import {
  orders as seedOrders,
  reviews as seedReviews,
  communities as seedCommunities,
  products,
  type MockOrder,
  type MockReview,
  type MockPost,
} from "./db";

/* ---------------------------------------------------------------- */
/* Store overrides — the seller pipeline's output                     */
/* ---------------------------------------------------------------- */

export interface StoreOverride {
  /** block order by id */
  order?: string[];
  /** per-block approval, mirrors store_versions.approved_sections */
  approved?: string[];
  /** blocks edited since approval — critic must re-run */
  dirty?: string[];
  /** derived custom theme the maker tuned in the editor */
  theme?: { ground?: string; accent?: string; pairing?: string; motion?: string; radius?: string };
  /** live once the publish gate's four preconditions pass */
  published?: boolean;
  publishedAt?: string;
}

export interface AppState {
  orders: MockOrder[];
  reviews: MockReview[];
  posts: Record<string, MockPost[]>; // makerSlug → posts
  hidden: string[]; // hide-only moderation keys
  storeOverride: Record<string, StoreOverride>; // makerSlug → override
}

export interface AppStore extends AppState {
  /* orders */
  createOrder(input: {
    makerSlug: string;
    items: { productId: string; qty: number; customization?: string }[];
    totalMinor: number;
  }): string;
  getOrder(id: string): MockOrder | undefined;
  advanceOrder(id: string, stage: MockOrder["stage"]): void;

  /* reviews */
  addReview(r: Omit<MockReview, "id" | "verified">): void;
  reviewsFor(productId: string): MockReview[];

  /* community */
  postsFor(makerSlug: string): MockPost[];
  addPost(makerSlug: string, body: string, asMaker?: boolean): void;
  addComment(makerSlug: string, postId: string, body: string): void;
  toggleHidden(key: string): void;
  isHidden(key: string): boolean;

  /* seller */
  overrideFor(makerSlug: string): StoreOverride;
  setOverride(makerSlug: string, patch: StoreOverride): void;
  approveBlock(makerSlug: string, blockId: string): void;
  markDirty(makerSlug: string, blockId: string): void;
  publishStore(makerSlug: string): void;

  resetAll(): void;
}

const SEED: AppState = {
  orders: seedOrders,
  reviews: seedReviews,
  posts: Object.fromEntries(seedCommunities.map((c) => [c.makerSlug, c.posts])),
  hidden: [],
  storeOverride: {},
};

const KEY = "kol-prototype-state-v1";
const store = createPersistentStore<AppState>(KEY, SEED);
const Ctx = createContext<AppStore | null>(null);

/**
 * Collision-free local ids. `Date.now()` alone collides when several
 * records are created in the same tick — which multi-maker checkout does
 * by definition (one order per maker, synchronously).
 */
let idSeq = 0;
function localId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}${idSeq.toString(36)}`;
}

/**
 * Module-scoped mutator. Every writer below goes through the external store,
 * which persists to localStorage and notifies subscribers — so the provider
 * never has to setState from an effect.
 */
const mutate = store.set;

export function KolStoreProvider({ children }: { children: React.ReactNode }) {
  // Seeds render on the server and during hydration; the persisted state
  // lands on the first re-render after hydration commits.
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  /* ----- orders ----- */
  const createOrder = useCallback<AppStore["createOrder"]>((input) => {
    const id = localId("o");
    const order: MockOrder = {
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
    mutate((s) => ({ ...s, orders: [order, ...s.orders] }));
    return id;
  }, []);

  const advanceOrder = useCallback<AppStore["advanceOrder"]>((id, stage) => {
    mutate((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, stage } : o)),
    }));
  }, []);

  /* ----- reviews ----- */
  const addReview = useCallback<AppStore["addReview"]>((r) => {
    mutate((s) => ({
      ...s,
      // `verified` is derived, never client-claimed (GENERATED column in the live build)
      reviews: [{ ...r, id: localId("r"), verified: true }, ...s.reviews],
    }));
  }, []);

  /* ----- community ----- */
  const addPost = useCallback<AppStore["addPost"]>((makerSlug, body, asMaker = false) => {
    mutate((s) => {
      const post: MockPost = {
        id: localId("p"),
        author: asMaker ? makerSlug.charAt(0).toUpperCase() + makerSlug.slice(1) : "You",
        isMaker: asMaker,
        body,
        when: "just now",
        comments: [],
      };
      return { ...s, posts: { ...s.posts, [makerSlug]: [post, ...(s.posts[makerSlug] ?? [])] } };
    });
  }, []);

  const addComment = useCallback<AppStore["addComment"]>((makerSlug, postId, body) => {
    mutate((s) => ({
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
  }, []);

  const toggleHidden = useCallback((key: string) => {
    mutate((s) => ({
      ...s,
      hidden: s.hidden.includes(key) ? s.hidden.filter((k) => k !== key) : [...s.hidden, key],
    }));
  }, []);

  /* ----- seller ----- */
  const setOverride = useCallback<AppStore["setOverride"]>((makerSlug, patch) => {
    mutate((s) => ({
      ...s,
      storeOverride: {
        ...s.storeOverride,
        [makerSlug]: { ...(s.storeOverride[makerSlug] ?? {}), ...patch },
      },
    }));
  }, []);

  const approveBlock = useCallback<AppStore["approveBlock"]>((makerSlug, blockId) => {
    mutate((s) => {
      const cur = s.storeOverride[makerSlug] ?? {};
      const approved = Array.from(new Set([...(cur.approved ?? []), blockId]));
      const dirty = (cur.dirty ?? []).filter((d) => d !== blockId);
      return { ...s, storeOverride: { ...s.storeOverride, [makerSlug]: { ...cur, approved, dirty } } };
    });
  }, []);

  const markDirty = useCallback<AppStore["markDirty"]>((makerSlug, blockId) => {
    mutate((s) => {
      const cur = s.storeOverride[makerSlug] ?? {};
      // editing removes the block from approved_sections — the critic must re-run
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
  }, []);

  const publishStore = useCallback<AppStore["publishStore"]>((makerSlug) => {
    mutate((s) => {
      const cur = s.storeOverride[makerSlug] ?? {};
      return {
        ...s,
        storeOverride: {
          ...s.storeOverride,
          [makerSlug]: { ...cur, published: true, publishedAt: new Date().toISOString() },
        },
      };
    });
  }, []);

  const resetAll = useCallback(() => store.reset(), []);

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      createOrder,
      getOrder: (id) => state.orders.find((o) => o.id === id),
      advanceOrder,
      addReview,
      reviewsFor: (pid) => state.reviews.filter((r) => r.productId === pid),
      postsFor: (slug) => state.posts[slug] ?? [],
      addPost,
      addComment,
      toggleHidden,
      isHidden: (k) => state.hidden.includes(k),
      overrideFor: (slug) => state.storeOverride[slug] ?? {},
      setOverride,
      approveBlock,
      markDirty,
      publishStore,
      resetAll,
    }),
    [state, createOrder, advanceOrder, addReview, addPost, addComment, toggleHidden, setOverride, approveBlock, markDirty, publishStore, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKolStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKolStore must be used inside KolStoreProvider");
  return ctx;
}

/** Cart total helper shared by cart + checkout so the number never drifts. */
export function cartTotalMinor(lines: { productId: string; qty: number }[]): number {
  return lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId);
    return sum + (p ? p.priceMinor * l.qty : 0);
  }, 0);
}
