"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { videoIdSchema, videoProfileWriteSchema } from "./schemas";

/**
 * Tagging server actions (spec P7). All inputs are Zod-validated at this
 * boundary — see the TRUST BOUNDARY note in schemas.ts: the tag columns are
 * bare text[] with no CHECK constraint, so an unparsed write here would put
 * garbage straight into the engine's selection signals.
 *
 * The write runs on the anon-key session client (RLS-scoped USER client,
 * never the service client): `video_profiles_owner_all` enforces ownership
 * via the parent video in both USING and WITH CHECK, so a caller can only
 * ever tag their own footage — DB-enforced, not app-side (B0).
 */

export type TagField =
  | "purpose"
  | "page_eligibility"
  | "product_links"
  | "mood"
  | "anti_repetition_key";

export type SaveVideoProfileResult =
  | { status: "saved"; savedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<TagField, string>>;
    };

const TAG_FIELDS: readonly TagField[] = [
  "purpose",
  "page_eligibility",
  "product_links",
  "mood",
  "anti_repetition_key",
];

function isTagField(key: unknown): key is TagField {
  return TAG_FIELDS.includes(key as TagField);
}

/**
 * Upserts the clip's `video_profiles` row (unique on video_id — the table is
 * 1:1 with videos). Returns a typed result, never throws to the client.
 * Both tagging modes land here: manual saves AND seller-confirmed AI
 * suggestions — a suggestion is a draft until this action runs.
 */
export async function saveVideoProfile(
  videoId: string,
  input: unknown,
): Promise<SaveVideoProfileResult> {
  const parsedId = videoIdSchema.safeParse(videoId);
  if (!parsedId.success) {
    return { status: "error", message: "That clip reference is not valid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "error",
      message: "Your session has ended — sign in again to save tags.",
    };
  }

  const parsed = videoProfileWriteSchema.safeParse(input);
  if (!parsed.success) {
    // Zod rejected the whole object — no partial write happened or will.
    const fieldErrors: Partial<Record<TagField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (isTagField(field) && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: "A couple of tags need a look before we can save.",
      fieldErrors,
    };
  }

  // Parsed payload IS the snake_case row shape (schemas.ts). RLS decides
  // ownership; a non-owner write comes back as an error, never a row.
  const { error } = await supabase
    .from("video_profiles")
    .upsert(
      { video_id: parsedId.data, ...parsed.data },
      { onConflict: "video_id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[tagging] video_profile_save_failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "We couldn't save just now — try again in a moment.",
    };
  }

  revalidatePath(`/seller/clips/${parsedId.data}`);
  return { status: "saved", savedAt: Date.now() };
}
