import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import { publicProfileIdSchema } from "./schemas";

/**
 * Cross-user profile display read (spec P2 / NEW-1). The ONLY sanctioned way
 * for the app to show another user's identity: the id-keyed SECURITY DEFINER
 * get_public_profile(uuid) RPC, which returns exactly {id, display_name,
 * avatar_url, role} for ONE known id and never a set — a caller cannot
 * enumerate membership, and base-table PII (bio) stays behind profiles RLS.
 *
 * Do NOT add a list/search variant of this helper, and do NOT read another
 * user's row from `profiles` directly (the removed public_profiles view that
 * allowed enumeration must not be reintroduced app-side).
 */

export type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: Database["public"]["Enums"]["user_role"];
};

/** Returns the one public row for a KNOWN id, or null (unknown id / bad input). */
export async function getPublicProfile(
  id: string,
): Promise<PublicProfile | null> {
  const parsed = publicProfileIdSchema.safeParse(id);
  if (!parsed.success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_profile", {
    p_id: parsed.data,
  });

  if (error) {
    console.error("[account] get_public_profile_failed", {
      code: error.code,
      message: error.message,
    });
    return null;
  }

  const row = data?.[0];
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  };
}
