"use client";

/**
 * Seller-draft state — the seam that closes the SELLER → BUYER loop.
 *
 * `sellerBlocks` in db.ts is the immutable SEED (which blocks exist, their
 * measured AA ratio, their coherence score, and how they arrived from the
 * pipeline). Everything the maker CHANGES lives in the shared store as a
 * `StoreOverride`, so the editor, the publish gate and her public world at
 * /m/sena all read one truth instead of three private useStates.
 *
 * The seed is written into the override exactly once (first visit), so the
 * designed starting position survives — 4 approved, 1 edited-since-approval,
 * 1 unreviewed — while every later mutation is real.
 */

import { useEffect } from "react";
import { sellerBlocks } from "./db";
import { useKolStore } from "./store";

export const SELLER_SLUG = "sena";

/** Ink the maker's world sets its type in — the fixed side of the AA sum. */
export const WORLD_INK = "#2C2620";

export interface SellerTheme {
  ground: string;
  accent: string;
  pairing: string;
  motion: string;
  radius: string;
}

/** Matches senaStore's curated `sunbaked` world as it renders today. */
export const DEFAULT_THEME: SellerTheme = {
  ground: "#EFE7D8",
  accent: "#8F5A3A",
  pairing: "warm-serif",
  motion: "fluid",
  radius: "soft",
};

export const DEFAULT_ORDER: string[] = sellerBlocks.map((b) => b.id);
const SEED_APPROVED: string[] = sellerBlocks
  .filter((b) => b.approval === "approved")
  .map((b) => b.id);
const SEED_DIRTY: string[] = sellerBlocks.filter((b) => b.approval === "edited").map((b) => b.id);

export interface SellerDraft {
  order: string[];
  approved: string[];
  dirty: string[];
  theme: SellerTheme;
  published: boolean;
  publishedAt: string | undefined;
  /** every block signed off AND nothing edited since — publish precondition ② */
  allApproved: boolean;
  isApproved(blockId: string): boolean;
  isDirty(blockId: string): boolean;
  setOrder(order: string[]): void;
  setTheme(patch: Partial<SellerTheme>): void;
  approve(blockId: string): void;
  touch(blockId: string): void;
  publish(): void;
}

export function useSellerDraft(): SellerDraft {
  const store = useKolStore();
  const override = store.overrideFor(SELLER_SLUG);
  const { setOverride, approveBlock, markDirty, publishStore } = store;

  // one-time seed: the pipeline's arrival state becomes real, mutable state
  const unseeded = override.approved === undefined && override.dirty === undefined;
  useEffect(() => {
    if (unseeded) setOverride(SELLER_SLUG, { approved: SEED_APPROVED, dirty: SEED_DIRTY });
  }, [unseeded, setOverride]);

  const order = override.order ?? DEFAULT_ORDER;
  const approved = override.approved ?? SEED_APPROVED;
  const dirty = override.dirty ?? SEED_DIRTY;

  const theme: SellerTheme = { ...DEFAULT_THEME, ...(override.theme ?? {}) };

  const setOrder = (next: string[]) => setOverride(SELLER_SLUG, { order: next });

  const setTheme = (patch: Partial<SellerTheme>) =>
    setOverride(SELLER_SLUG, { theme: { ...theme, ...patch } });

  const allApproved =
    dirty.length === 0 && sellerBlocks.every((b) => approved.includes(b.id));

  return {
    order,
    approved,
    dirty,
    theme,
    published: override.published ?? false,
    publishedAt: override.publishedAt,
    allApproved,
    isApproved: (id) => approved.includes(id) && !dirty.includes(id),
    isDirty: (id) => dirty.includes(id),
    setOrder,
    setTheme,
    approve: (id) => approveBlock(SELLER_SLUG, id),
    touch: (id) => markDirty(SELLER_SLUG, id),
    publish: () => publishStore(SELLER_SLUG),
  };
}
