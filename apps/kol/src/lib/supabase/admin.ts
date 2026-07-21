/**
 * KOL — service-role Supabase client. SERVER ONLY. RLS DOES NOT APPLY.
 *
 * ADR-0001 §"Security hardening" reserves a small set of flows for the service
 * role, and nothing else may use this client:
 *
 *   - Stripe webhook setting `orders.status = 'paid'`            (P1-1)
 *   - resolving `verifications.status` and minting `real-maker`  (P1-2)
 *   - upgrading `profiles.role` to 'seller' during onboarding    (P2-1/2)
 *   - emitting weighted `buyer_signals` rows                     (P2-4)
 *
 * Two independent protections keep the key out of the browser:
 *   1. it is read from `SUPABASE_SERVICE_ROLE_KEY` — no `NEXT_PUBLIC_` prefix,
 *      so Next never inlines it into a client bundle;
 *   2. the hard runtime guard below throws if this module is ever evaluated
 *      in a browser, so an accidental client import fails loudly at the seam
 *      instead of shipping a key.
 *
 * Never log the client, its options, or the key.
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireServiceEnv } from "./config";

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "supabase/admin.ts was imported into a client bundle. The service-role " +
        "key must never reach the browser — move this call to a Route Handler " +
        "or Server Action.",
    );
  }
}

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses every RLS policy — treat each call site as a
 * security review item and keep it behind a server route.
 */
export function getAdminClient(): SupabaseClient {
  assertServerOnly();
  if (cached) return cached;
  const { url, anonKey: serviceRoleKey } = requireServiceEnv();
  cached = createClient(url, serviceRoleKey, {
    auth: {
      // A service-role client has no user session: nothing to persist, nothing
      // to refresh, and no URL to parse for a callback fragment.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
