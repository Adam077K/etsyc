import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";

/**
 * Zod boundary schemas for account & profile (spec P2). Every value that
 * arrives from a form or caller passes through one of these before it touches
 * Supabase.
 *
 * Deliberately absent from the profile update: role, handle. The client NEVER
 * sends either — role changes are blocked by the guard_profile_role trigger
 * (B0: role→'seller' is a service-role onboarding step), and handle assignment
 * is not part of P2. A schema that accepted them would be the first step of
 * the forbidden client-set-role path.
 */

export const displayNameSchema = z
  .string({ error: "Add a display name." })
  .trim()
  .min(1, { error: "Add a display name — it's how makers will know you." })
  .max(80, { error: "Keep your display name under 80 characters." });

/** Empty bio is stored as null, not "" — absence, not a blank string. */
export const bioSchema = z
  .string()
  .trim()
  .max(500, { error: "Keep your bio under 500 characters." })
  .transform((v) => (v === "" ? null : v));

/**
 * Avatar is an https URL for now (media upload pipeline is a later unit).
 * Parse-validated — anything that isn't a well-formed https URL is rejected
 * rather than stored and later rendered.
 */
export const avatarUrlSchema = z
  .string()
  .trim()
  .max(2048, { error: "That avatar URL is too long." })
  .transform((v, ctx) => {
    if (v === "") return null;
    let url: URL;
    try {
      url = new URL(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a URL." });
      return z.NEVER;
    }
    if (url.protocol !== "https:") {
      ctx.addIssue({ code: "custom", message: "Avatar URLs must be https." });
      return z.NEVER;
    }
    return url.toString();
  });

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  avatarUrl: avatarUrlSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** get_public_profile is id-keyed — the only valid argument is a uuid. */
export const publicProfileIdSchema = z.uuid({
  error: "not a profile id",
});

/**
 * buyer_signals insert contract (OQ-4) — consumed by the engine/service-role
 * write path ONLY (P6+ relationship ranking, B13 follow/save). Enum values
 * come from the generated DB types so the schema can never drift from the
 * signal_subject / signal_type Postgres enums. weight mirrors the DB CHECK
 * (0–100) — the CHECK stays as defence-in-depth.
 */
export const buyerSignalInsertSchema = z.object({
  buyerId: z.uuid(),
  subjectType: z.enum(Constants.public.Enums.signal_subject),
  subjectId: z.uuid(),
  signalType: z.enum(Constants.public.Enums.signal_type),
  weight: z.number().min(0).max(100).default(1),
});

export type BuyerSignalInsert = z.input<typeof buyerSignalInsertSchema>;
