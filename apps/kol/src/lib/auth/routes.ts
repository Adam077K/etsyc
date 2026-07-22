import type { Database } from "@/lib/supabase/database.types";

import { parseSameOriginPath } from "./schemas";

/**
 * Route policy for role-gated routing (spec P1 — success state = role-correct
 * landing; buyer/seller routes must not leak across the boundary).
 *
 * Pure module: consumed by the middleware updateSession helper and the auth
 * server actions, unit-tested directly. Routing here is UX only — the actual
 * trust boundary is RLS (B0); a buyer who somehow reached a seller URL would
 * still read zero seller-owned rows.
 */

export type UserRole = Database["public"]["Enums"]["user_role"];

export type RouteClass = "public" | "auth-entry" | "buyer" | "seller" | "account";

export const SIGN_IN_PATH = "/sign-in";
export const BUYER_LANDING = "/feed";
export const SELLER_LANDING = "/seller";
export const ACCOUNT_PATH = "/account";

function inPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Everything not explicitly claimed below is public (/, /preview, store
 * worlds later). Protected surfaces are opt-in by prefix so a new public
 * route can never accidentally require auth.
 */
export function classifyRoute(pathname: string): RouteClass {
  // Case-insensitive (W1-FF fix 4): /Account must class as account, /SELLER
  // as seller. Lowercasing the INPUT only ever widens the protected classes
  // — an odd Unicode lowercasing fails closed (an extra auth gate on a
  // public path), it can never reclassify a canonical protected path as
  // public, so no new bypass is possible.
  const path = pathname.toLowerCase();
  if (inPrefix(path, SIGN_IN_PATH)) return "auth-entry";
  if (inPrefix(path, SELLER_LANDING)) return "seller";
  if (inPrefix(path, BUYER_LANDING)) return "buyer";
  // Profile/settings (spec P2): requires a session but is role-neutral —
  // buyers AND sellers both own a profiles row.
  if (inPrefix(path, ACCOUNT_PATH)) return "account";
  return "public";
}

/** buyer → discovery feed; seller → seller dashboard (spec P1 UX flow #4). */
export function landingPathFor(role: UserRole): string {
  return role === "seller" ? SELLER_LANDING : BUYER_LANDING;
}

/**
 * Open-redirect guard for ?next= — the single choke point every redirect
 * target passes through. Delegates to the parse-based validator in
 * schemas.ts (prefix checks are bypassable via control chars the browser
 * strips); returns the normalized same-origin path or null (caller falls
 * back to the role landing).
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  return parseSameOriginPath(next);
}
