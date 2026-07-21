"use client";

/**
 * KOL MVP variant — client session store.
 *
 * Stands in for Supabase auth + buyer_signals + carts until the
 * ADR-0001 migration is applied. Persisted to localStorage so the
 * prototype feels real across visits. Every write here maps to a
 * server action in the live build (buyer_signals is service-role
 * write; the client never writes it directly in production).
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

export interface CartLine {
  productId: string;
  qty: number;
  customization?: string;
}

export interface KolSession {
  follows: string[]; // maker slugs
  saves: string[]; // product ids
  cart: CartLine[];
  readNotifications: string[];
  onboarded: boolean;
  prefs: { vibes: string[]; budget?: string; location?: string };
  // derived helpers
  isFollowing(slug: string): boolean;
  isSaved(id: string): boolean;
  toggleFollow(slug: string): void;
  toggleSave(id: string): void;
  addToCart(line: CartLine): void;
  removeFromCart(productId: string): void;
  clearCart(): void;
  markRead(id: string): void;
  markAllRead(ids: string[]): void;
  completeOnboarding(prefs: KolSession["prefs"]): void;
}

interface Persisted {
  follows: string[];
  saves: string[];
  cart: CartLine[];
  readNotifications: string[];
  onboarded: boolean;
  prefs: KolSession["prefs"];
}

const DEFAULTS: Persisted = {
  follows: ["sena"], // seeded so For You has a signal on first run
  saves: ["shibori-throw"],
  cart: [],
  readNotifications: [],
  onboarded: false,
  prefs: { vibes: [] },
};

const KEY = "kol-mvp-session-v1";

const Ctx = createContext<KolSession | null>(null);

export function KolSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) });
    } catch {
      /* first run or blocked storage — defaults are fine */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable; the session still works in-memory */
    }
  }, [state, hydrated]);

  const toggleFollow = useCallback((slug: string) => {
    setState((s) => ({
      ...s,
      follows: s.follows.includes(slug)
        ? s.follows.filter((f) => f !== slug)
        : [...s.follows, slug],
    }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      saves: s.saves.includes(id) ? s.saves.filter((x) => x !== id) : [...s.saves, id],
    }));
  }, []);

  const addToCart = useCallback((line: CartLine) => {
    setState((s) => {
      const existing = s.cart.find((c) => c.productId === line.productId);
      const cart = existing
        ? s.cart.map((c) =>
            c.productId === line.productId ? { ...c, qty: c.qty + line.qty } : c,
          )
        : [...s.cart, line];
      return { ...s, cart };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((c) => c.productId !== productId) }));
  }, []);

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  const markRead = useCallback((id: string) => {
    setState((s) =>
      s.readNotifications.includes(id)
        ? s
        : { ...s, readNotifications: [...s.readNotifications, id] },
    );
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    setState((s) => ({
      ...s,
      readNotifications: Array.from(new Set([...s.readNotifications, ...ids])),
    }));
  }, []);

  const completeOnboarding = useCallback((prefs: KolSession["prefs"]) => {
    setState((s) => ({ ...s, onboarded: true, prefs }));
  }, []);

  const value = useMemo<KolSession>(
    () => ({
      ...state,
      isFollowing: (slug) => state.follows.includes(slug),
      isSaved: (id) => state.saves.includes(id),
      toggleFollow,
      toggleSave,
      addToCart,
      removeFromCart,
      clearCart,
      markRead,
      markAllRead,
      completeOnboarding,
    }),
    [state, toggleFollow, toggleSave, addToCart, removeFromCart, clearCart, markRead, markAllRead, completeOnboarding],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKolSession(): KolSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKolSession must be used inside KolSessionProvider");
  return ctx;
}
