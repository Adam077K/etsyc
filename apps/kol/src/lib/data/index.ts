/**
 * KOL — the data seam.
 *
 *   const data = getData();
 *   const maker = await data.getMaker("sena");
 *
 * Supabase when `hasSupabase()` (URL + anon key both set), mock otherwise.
 * Callers never branch on this; that is the entire point.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase } from "@/lib/supabase/config";
import { createMockAdapter } from "./mock-adapter";
import { createSupabaseAdapter } from "./supabase-adapter";
import type { KolDataSource } from "./types";

export * from "./types";

let cached: KolDataSource | null = null;
let announced = false;

/**
 * The browser client for this (client-reachable) data seam.
 *
 * This module is imported by `"use client"` pages, so it must NEVER pull in
 * the server client — that one imports `next/headers`, which is illegal in a
 * client component even during SSR (a client component can render without a
 * request). The `typeof window` trick doesn't help: SSR of a client component
 * also has no `window`, so it would wrongly take the server branch and drag
 * `next/headers` into the client graph.
 *
 * Client pages read with the anon key and fetch inside `useEffect` (browser
 * only), so the browser client is always the right one here. Server Components
 * or route handlers that need the cookie-bound session use
 * `@/lib/supabase/server` directly — never through this entry point.
 */
async function resolveClient(): Promise<SupabaseClient> {
  const { getBrowserClient } = await import("@/lib/supabase/client");
  return getBrowserClient();
}

/** One line, once per process, so it is never ambiguous which source is live. */
function announce(kind: KolDataSource["kind"]): void {
  if (announced) return;
  announced = true;
  console.info(
    kind === "supabase"
      ? "[kol/data] source: supabase (NEXT_PUBLIC_SUPABASE_URL + anon key present)"
      : "[kol/data] source: mock (no Supabase env — set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to go live)",
  );
}

/** The data source for this process. Memoised; safe to call per render. */
export function getData(): KolDataSource {
  if (cached) return cached;
  cached = hasSupabase() ? createSupabaseAdapter(resolveClient) : createMockAdapter();
  announce(cached.kind);
  return cached;
}

/** Test seam: force an adapter, or clear the memo. */
export function __setData(source: KolDataSource | null): void {
  cached = source;
  announced = false;
}
