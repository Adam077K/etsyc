"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ACCOUNT_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

import { updateProfileSchema } from "./schemas";

/**
 * Profile server actions (spec P2). All inputs are Zod-validated at this
 * boundary. The actions run on the anon-key session client — the update is
 * RLS-scoped to the caller's own row (profiles_self_update), and NOTHING here
 * sends role or handle to Supabase (B0: role changes are the
 * guard_profile_role trigger's to reject; the app never even attempts one).
 */

export type ProfileField = "displayName" | "bio" | "avatarUrl";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<ProfileField, string>>;
    };

const PROFILE_FIELDS: readonly ProfileField[] = [
  "displayName",
  "bio",
  "avatarUrl",
];

function isProfileField(key: unknown): key is ProfileField {
  return PROFILE_FIELDS.includes(key as ProfileField);
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${SIGN_IN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`);
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    // Zod rejected the whole object — no partial write happened or will.
    const fieldErrors: Partial<Record<ProfileField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (isProfileField(field) && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      status: "error",
      message: "A couple of fields need a look before we can save.",
      fieldErrors,
    };
  }

  // profiles has no moddatetime trigger yet (deferred — a future Irreversible
  // migration), so the save path sets updated_at explicitly.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("[account] profile_update_failed", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "We couldn't save just now — try again in a moment.",
    };
  }

  revalidatePath(ACCOUNT_PATH);
  return { status: "saved", savedAt: Date.now() };
}
