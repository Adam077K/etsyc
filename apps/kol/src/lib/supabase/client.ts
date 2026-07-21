"use client";

/**
 * KOL — browser Supabase client (anon key, RLS-enforced).
 *
 * Everything this client can do is bounded by the ADR-0001 RLS policies: it
 * reads public data (published stores, products, reviews, public Q&A) and
 * writes only what a buyer is allowed to write directly. Anything under the
 * B0 rule — order creation, buyer_signals, notifications, review `verified` —
 * does NOT go through here; see `src/lib/data/README.md`.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "./config";

let cached: SupabaseClient | null = null;

/**
 * Singleton browser client. One instance per tab keeps a single auth-state
 * subscription and one token refresh timer; creating a client per call leaks
 * both.
 */
export function getBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const { url, anonKey } = requirePublicEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}

/**
 * Canonical name used by the auth layer (`src/lib/auth/**`). Same singleton —
 * `createClient()` in the browser, `await createClient()` on the server, so
 * the two modules read symmetrically at call sites.
 */
export const createClient = getBrowserClient;
