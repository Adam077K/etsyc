/**
 * KOL — server Supabase client for the App Router (anon key + user session).
 *
 * Uses `@supabase/ssr` cookie handling so the caller's JWT rides along and
 * ADR-0001 RLS applies to the CALLER, not to the server. This is the client
 * that Route Handlers and Server Actions should use for anything acting "as
 * the user" — including the B0 write RPCs (`create_order`, `cancel_order`,
 * `set_order_status`), which are SECURITY DEFINER but read `auth.uid()`.
 *
 * It is NOT the service-role client. See `admin.ts` for that.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "./config";

/**
 * Per-request client. Never cache this across requests — it closes over one
 * request's cookie jar, and reusing it would leak one user's session to
 * another.
 */
export async function getServerClient(): Promise<SupabaseClient> {
  return buildServerClient();
}

/** Canonical name used by the auth layer (`src/lib/auth/**`). */
export const createClient = getServerClient;

async function buildServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            // The session cookie must never be readable from JS — an XSS on
            // any page would otherwise hand over the token. Forced here
            // rather than inherited, so the invariant can't drift with a
            // library default. sameSite=lax keeps the OTP callback working.
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: options?.sameSite ?? "lax",
              secure: process.env.NODE_ENV === "production",
              path: options?.path ?? "/",
            });
          }
        } catch {
          // Server Components cannot set cookies. Refresh is then handled by
          // middleware or by the next Route Handler / Server Action; swallowing
          // here is the documented @supabase/ssr pattern, not a silent bug.
        }
      },
    },
  });
}
