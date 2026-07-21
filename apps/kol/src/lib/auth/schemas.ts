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
 * Post-sign-in destination carried through the flow (?next=). Same-origin
 * paths only — anything absolute or protocol-relative is dropped, never
 * errored (an attacker-supplied ?next must not break sign-in).
 */
export const nextPathSchema = z
  .string()
  .max(2048)
  .refine(
    (p) => p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\"),
    { error: "not a same-origin path" },
  );

export const requestOtpSchema = z.object({ email: emailSchema });

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  next: z.string().optional(),
});
