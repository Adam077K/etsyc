/**
 * Server-side identity reader (P1).
 *
 * `getServerUser()` is the ONLY place a server component should learn who
 * it is talking to. It never trusts a client-supplied id: the id comes from
 * `supabase.auth.getUser()`, which re-validates the JWT against the auth
 * server rather than decoding the cookie locally.
 *
 * When Supabase is absent (`hasSupabase() === false`) this returns the
 * stable ANONYMOUS identity, which is exactly today's prototype behaviour —
 * no page has to branch.
 *
 * NOTE ON MODULE SPLIT: this file is server-safe (it reaches
 * `@/lib/supabase/server`, which uses `next/headers`). The client hook lives
 * in `./useAuth` behind its own `"use client"` boundary — importing both
 * from one module would drag `next/headers` into the browser bundle.
 */

import { hasSupabase } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import {
  ANONYMOUS,
  PROFILE_COLUMNS,
  type AuthState,
  type ProfileRow,
  toAuthProfile,
} from "./types";

export {
  ANONYMOUS,
  landingFor,
  safeRedirect,
  isValidEmail,
  type AuthProfile,
  type AuthRole,
  type AuthState,
  type AuthUser,
  type Role,
} from "./types";

/**
 * `{ user, profile, role, isAnonymous }` for the current request.
 *
 * Never throws. A Supabase outage degrades to anonymous rather than
 * 500-ing the buyer feed — the feed is public by design.
 */
export async function getServerUser(): Promise<AuthState> {
  if (!hasSupabase()) return ANONYMOUS;

  try {
    const supabase = await getServerClient();

    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;
    if (!user) return ANONYMOUS;

    const { data: row } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    // The profile row is seeded by the `handle_new_user` trigger. If we
    // raced it (first sign-in), treat the person as a signed-in buyer —
    // the trigger, not us, is the authority on role.
    const profile = row ? toAuthProfile(row) : null;

    return {
      user: { id: user.id, email: user.email ?? null },
      profile,
      role: profile?.role ?? "buyer",
      isAnonymous: false,
    };
  } catch {
    return ANONYMOUS;
  }
}

/** Convenience for server components that only need the role. */
export async function getServerRole(): Promise<AuthState["role"]> {
  return (await getServerUser()).role;
}
