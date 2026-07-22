// SERVER-ONLY MODULE — this is the server-side PUBLIC-trust factory. Browser
// code already has client.ts; keeping this module out of client bundles stops
// it becoming a second, unaudited browser entry point.
import "server-only";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Server-side ANON Supabase client — queries at the public trust level.
 *
 * WHY THIS FILE EXISTS: the client layer previously exported exactly three
 * factories — server.ts (cookie-bound, RLS-scoped USER client), client.ts
 * (browser) and admin.ts (service role). There was NO server-side anon
 * factory, so server code that must read as "the public" (the video engine's
 * eligibility stage) had exactly one non-admin option available, and it was
 * the wrong one.
 *
 * WHAT LEAKS WITHOUT IT: run the engine's eligibility query on the
 * cookie-bound USER client and a signed-in seller's own UNPUBLISHED clips
 * satisfy the `videos_owner_all` / `video_profiles_owner_all` RLS policies,
 * enter the FEED candidate pool, and are then guaranteed a slot by the
 * newest-per-store reduction — one clip per store, and theirs is the only
 * one their store has. The seller sees their own draft footage in the public
 * feed as if it were live.
 *
 * This client carries NO cookie adapter, NO session and NO auth persistence:
 * `auth.uid()` is null and `auth.role()` is 'anon' on every query, so ONLY
 * the `*_public_read_published` policies apply — regardless of who is signed
 * in on the request that constructed it.
 */
export function createAnonClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
