/**
 * Signed-cookie key ring — the CANONICAL anti-repetition store (video-engine
 * §3.1, confirmed P3-2). Vercel runs the engine across many stateless
 * instances, so a per-instance in-memory set would not be shared between
 * requests hitting different lambdas; the cookie carries the ring WITH the
 * buyer, so anti-repetition holds regardless of which instance serves next.
 *
 * The cookie is a tamper surface: a forged ring is client-controlled input to
 * selection. `verifyRing` FAILS CLOSED — `null` (never a partial ring) on a bad
 * signature, malformed payload, or oversized value — and `read()` then yields
 * an empty ring. It must degrade to "no memory", never throw.
 *
 * `secret` is a required constructor argument (dispatch packet §1C): zero
 * module-level env reads, no default, no insecure fallback. The caller
 * (W2-WIRE) supplies `ENGINE_COOKIE_SECRET`.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { KEY_RING_MAX, type KeyRing, type KeyRingStore } from "./types";

/** Hard cap on the raw cookie value before any decode work — never trust the
 *  cookie's length. Real rings (≤50 uuid-sized keys) sit well under 4 KB. */
const MAX_VALUE_LENGTH = 8_192;
/** Keys are video ids (uuids) or seller-chosen anti_repetition_keys; anything
 *  longer than this is hostile input, not a key. */
const MAX_KEY_LENGTH = 256;

function hmac(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

/** Serialise + sign: `base64url(json-array) + "." + base64url(hmac-sha256)`. */
export function signRing(ring: KeyRing, secret: string): string {
  const payload = JSON.stringify(ring);
  const mac = hmac(payload, secret);
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${mac.toString("base64url")}`;
}

/**
 * Verify + parse a cookie value. Returns the ring, or `null` on ANY defect —
 * tamper, bad signature, malformed payload, oversized value or ring. Never
 * throws; only authenticated bytes are ever JSON-parsed.
 */
export function verifyRing(value: string, secret: string): KeyRing | null {
  try {
    if (typeof value !== "string" || value.length === 0 || value.length > MAX_VALUE_LENGTH) {
      return null;
    }
    const [payloadB64, macB64, ...rest] = value.split(".");
    if (rest.length > 0 || !payloadB64 || !macB64) return null;

    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = hmac(payload, secret);
    const given = Buffer.from(macB64, "base64url");
    // timingSafeEqual requires equal lengths; a wrong-length mac is invalid anyway.
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

    // Signature verified — now (and only now) parse, and still distrust shape.
    const parsed: unknown = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.length > KEY_RING_MAX) return null;
    const ring: string[] = [];
    for (const key of parsed) {
      if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY_LENGTH) return null;
      ring.push(key);
    }
    return ring;
  } catch {
    return null; // fail closed on ANY decode/parse error — no partial rings
  }
}

export function createCookieKeyRing(opts: {
  secret: string;
  read: () => string | undefined;
  write: (value: string) => void;
}): KeyRingStore {
  const { secret, read, write } = opts;
  // Required, no default, no insecure fallback (§1C). Misconfiguration fails
  // loudly at construction time — never silently at request time.
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("createCookieKeyRing: `secret` is required and must be non-empty");
  }
  return {
    async read(): Promise<KeyRing> {
      const raw = read();
      if (raw === undefined) return []; // missing cookie → empty ring, never a throw
      return verifyRing(raw, secret) ?? []; // tampered/invalid → "no memory"
    },
    async write(ring: KeyRing): Promise<void> {
      // Defence in depth: re-bound before signing. The ring is newest-first,
      // so keeping the head is newest-wins.
      write(signRing(ring.slice(0, KEY_RING_MAX), secret));
    },
  };
}
