// SERVER-ONLY MODULE — the `server-only` import makes any attempt to pull this
// into a "use client" bundle a build-time error. Do not remove it, and do not
// re-export this module from any client-imported barrel.
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseUrl } from "./env";
import { getSupabaseServiceRoleKey } from "./env.server";

/**
 * Service-role Supabase client factory — BYPASSES RLS ENTIRELY.
 *
 * Reserved for the privileged server flows named in ADR-0001 / dispatch-packet B0:
 * Stripe webhook → orders.status='paid', verification resolution, role→'seller'
 * onboarding, buyer_signals engine inserts. Never use it in a user-facing data
 * path — those go through the session client (server.ts) so RLS applies.
 *
 * In SQL, the service-role escape hatch is tested as auth.role()='service_role',
 * never `auth.uid() IS NULL` (anon also has a null uid).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
