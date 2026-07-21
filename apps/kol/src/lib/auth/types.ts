/**
 * Shared auth shapes (P1 Auth · P2 Account & Profile).
 *
 * Deliberately framework-free so both the client hook and the server
 * reader can import this without dragging `next/headers` or the browser
 * Supabase client into the wrong graph.
 *
 * SECURITY: `role` is read-only here. It is seeded `'buyer'` by the
 * `handle_new_user` signup trigger and can only ever be raised to
 * `'seller'` by the service-role onboarding step — `guard_profile_role`
 * rejects any client-driven change (ADR-0001 P2-1/2, N1). Nothing in
 * this directory writes `profiles.role`, ever.
 */

export type Role = "buyer" | "seller";

/** Role as the UI sees it — anonymous browsing is a first-class state. */
export type AuthRole = Role | "anonymous";

/** The minimum we ever expose about the signed-in user to a component. */
export interface AuthUser {
  id: string;
  email: string | null;
}

/**
 * Own-row profile projection. `bio` is RLS-gated PII and is only ever
 * present for the buyer's OWN row — cross-user reads must go through
 * `get_public_profile(uuid)` (ADR-0001 NEW-1), never through here.
 */
export interface AuthProfile {
  id: string;
  role: Role;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  role: AuthRole;
  isAnonymous: boolean;
}

/**
 * The stable anonymous identity. Returned whenever Supabase is absent
 * (prototype mode) or present-but-signed-out. Every existing page renders
 * against this without a single null check.
 */
export const ANONYMOUS: AuthState = {
  user: null,
  profile: null,
  role: "anonymous",
  isAnonymous: true,
};

/** Row shape as it comes back from PostgREST (snake_case at the boundary). */
export interface ProfileRow {
  id: string;
  role: Role;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function toAuthProfile(row: ProfileRow): AuthProfile {
  return {
    id: row.id,
    role: row.role,
    handle: row.handle,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
  };
}

/** Columns we select for an own-row profile read. Never `*`. */
export const PROFILE_COLUMNS = "id, role, handle, display_name, avatar_url, bio";

/** Where a signed-in person lands, by role (P1 UX flow step 4). */
export function landingFor(role: AuthRole): string {
  return role === "seller" ? "/sell" : "/for-you";
}

/**
 * Only same-origin, absolute-path redirects are honoured. Anything else
 * (protocol-relative `//evil.com`, absolute URLs, backslash tricks) falls
 * back to the role landing — an open redirect on the auth callback is the
 * classic way a magic-link flow leaks its code.
 */
export function safeRedirect(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}
