import { z } from "zod";

/**
 * Feed session identity (W3-B1a, discovery-feed spec §AC: "same order within
 * a session, new order on a new session"). A first-party cookie scopes the
 * engine's seeded jitter and anti-repetition ring. It is NOT the auth
 * session — it exists precisely so ANONYMOUS visitors get a stable in-session
 * feed order (`buyerId: null` cold start).
 *
 * Minted by the proxy middleware (updateSession) because Server Components
 * cannot set cookies; resolveFeedSessionId provides the render-time fallback
 * for the first-ever request (ephemeral id — the response of that same
 * request carries the persistent one).
 */

export const FEED_SESSION_COOKIE = "kol_sid";

/**
 * The first-party cookie WRITE-ATTRIBUTE canon — the single declaration
 * for BOTH first-party cookies: kol_sid (minted by the proxy middleware
 * below in the request path) and kol_ring (written by the feed/grow/
 * browse/narration boundaries; lib/feed/select.ts re-exports this as
 * `ringCookieOptions`). It lives HERE because this module is
 * middleware-safe (edge runtime, zod-only graph) while select.ts is
 * server-only + the engine graph. A FUNCTION, not a const: `secure` must
 * resolve NODE_ENV at write time, never freeze at import (gate-2 F2).
 * Diverging attributes make browsers fork a cookie by scope — cookie
 * identity is (name, domain, path); `Secure` is not part of the key, so
 * one diverged writer silently REPLACES the canonical cookie for all.
 */
export function firstPartyCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  } as const;
}

/** External input (a client-supplied cookie value) — never trusted unparsed. */
const feedSessionIdSchema = z.uuid();

export function isFeedSessionId(value: string | undefined): value is string {
  return feedSessionIdSchema.safeParse(value).success;
}

/**
 * Resolve the session id for a render: the validated cookie value, or a
 * fresh UUID when the cookie is absent or tampered (either way the proxy
 * re-mints on the response, so at most one render reshuffles).
 * crypto.randomUUID — never Math.random (discovery-feed AC).
 */
export function resolveFeedSessionId(raw: string | undefined): string {
  return isFeedSessionId(raw) ? raw : crypto.randomUUID();
}
