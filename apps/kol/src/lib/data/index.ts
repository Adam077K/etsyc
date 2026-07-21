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
 * Resolves the right Supabase client for wherever this is running. The server
 * client is imported dynamically because it pulls in `next/headers`, which
 * cannot exist in a client bundle.
 */
async function resolveClient(): Promise<SupabaseClient> {
  if (typeof window === "undefined") {
    const { getServerClient } = await import("@/lib/supabase/server");
    return getServerClient();
  }
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
