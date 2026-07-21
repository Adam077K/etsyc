/**
 * KOL — Supabase environment switch.
 *
 * `hasSupabase()` is the ONE predicate the whole app reads to decide whether
 * it is talking to a real database or to the mock layer. It is deliberately
 * boring: URL + anon key present → live; anything else → mock.
 *
 * No key value is ever logged, returned in an error message, or exposed on a
 * thrown object. Only presence is observable.
 *
 * See DECISIONS.md D18 (move to a real database) and ADR-0001 for the schema
 * the live path targets.
 */

/*
 * These MUST be read as literal `process.env.NEXT_PUBLIC_*` member expressions
 * so the Next bundler can statically inline them into the client bundle.
 * Destructuring or dynamic indexing silently yields `undefined` in the browser.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function present(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** True only when BOTH the project URL and the anon key are configured. */
export function hasSupabase(): boolean {
  return present(SUPABASE_URL) && present(SUPABASE_ANON_KEY);
}

export interface PublicSupabaseEnv {
  url: string;
  anonKey: string;
}

/**
 * Public (browser-safe) credentials. Throws rather than returning a partial
 * config, so a half-configured deploy fails at the seam instead of producing
 * confusing 401s deep inside a query. The message names the missing variable
 * but never its value.
 */
export function requirePublicEnv(): PublicSupabaseEnv {
  if (!present(SUPABASE_URL)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!present(SUPABASE_ANON_KEY)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

/**
 * Service-role credentials. Server-only by construction: the key is read from
 * a NON-`NEXT_PUBLIC_` variable, so it is never inlined into a client bundle.
 * Guarded again at the call site in `admin.ts`.
 */
export function requireServiceEnv(): PublicSupabaseEnv {
  const { url } = requirePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!present(serviceKey)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return { url, anonKey: serviceKey };
}
