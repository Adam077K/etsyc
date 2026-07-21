import { z } from "zod";

/**
 * Zod boundary schemas for the auth flow (spec P1). Every value that arrives
 * from a form or URL passes through one of these before it touches Supabase.
 *
 * Deliberately absent: role, handle. The client NEVER sends either — role is
 * FORCED 'buyer' by the handle_new_user DB trigger and guarded by
 * guard_profile_role (dispatch-packet B0). A schema that accepted them would
 * be the first step of the forbidden client-set-role path.
 */

export const emailSchema = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({ error: "That doesn't look like an email address." })
      .max(254, { error: "That email address is too long." }),
  );

/** Supabase email OTPs are 6 digits. */
export const otpCodeSchema = z
  .string({ error: "Enter the 6-digit code from your email." })
  .trim()
  .pipe(
    z.string().regex(/^\d{6}$/, {
      error: "The code is the 6 digits from your email.",
    }),
  );

/**
 * Open-redirect guard for the post-sign-in destination (?next=). Validation
 * is by PARSING, not string prefixes: browsers strip tab/newline per the
 * WHATWG URL spec, so `/\t//evil.com` (or `?next=/%09//evil.com`, which
 * arrives decoded) passes a startsWith("/") check yet resolves off-origin.
 * Every redirect target must pass through this one choke point.
 *
 * Returns the normalized same-origin path, or null for anything hostile.
 */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
// Percent-encoded control chars (%00–%1f, %7f) are never legitimate in our
// routes — reject them raw rather than letting them ride along in a path.
const ENCODED_CONTROL_CHARS = /%(?:[01][0-9a-f]|7f)/i;
const DUMMY_ORIGIN = "https://next-path.invalid";

export function parseSameOriginPath(raw: string): string | null {
  if (raw.length === 0 || raw.length > 2048) return null;
  if (CONTROL_CHARS.test(raw) || ENCODED_CONTROL_CHARS.test(raw)) return null;
  if (!raw.startsWith("/")) return null;
  let url: URL;
  try {
    // The URL parser applies the same slash/backslash and scheme handling a
    // browser will apply to the Location header. If the resolved origin moved
    // off the dummy base (`//evil.com`, `/\evil.com`, `https:…`), reject.
    url = new URL(raw, DUMMY_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== DUMMY_ORIGIN) return null;

  const result = url.pathname + url.search + url.hash;
  // Re-validate the OUTPUT, not just the input: normalization can launder an
  // off-origin value past the check above — "/..//evil.com" parses with the
  // dummy origin intact, but the dot-segment collapses the pathname to
  // "//evil.com", which is itself protocol-relative in a Location header.
  // Any output that doesn't resolve straight back to the dummy origin (or
  // still looks authority-relative) is rejected — this closes the whole
  // normalization class, not one payload.
  if (result.startsWith("//") || result.startsWith("/\\")) return null;
  try {
    if (new URL(result, DUMMY_ORIGIN).origin !== DUMMY_ORIGIN) return null;
  } catch {
    return null;
  }
  return result;
}

/** Strict form: invalid input is a Zod issue (for surfaces that must error). */
export const nextPathSchema = z
  .string()
  .max(2048)
  .transform((p, ctx) => {
    const safe = parseSameOriginPath(p);
    if (safe === null) {
      ctx.addIssue({ code: "custom", message: "not a same-origin path" });
      return z.NEVER;
    }
    return safe;
  });

/**
 * Lenient form for the hidden `next` field: a hostile value is DROPPED (the
 * caller falls back to the role landing) — an attacker-supplied ?next must
 * degrade the redirect, never break a legitimate sign-in with a form error.
 */
export const lenientNextPathSchema = z
  .string()
  .optional()
  .transform((p) =>
    p === undefined ? undefined : (parseSameOriginPath(p) ?? undefined),
  );

export const requestOtpSchema = z.object({ email: emailSchema });

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  next: lenientNextPathSchema,
});
