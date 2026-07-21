import { fileURLToPath } from "node:url";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE trust-boundary verification (spec P1 security ACs) against the applied
 * staging DB. Auto-skips when apps/kol/.env.local is absent (CI has no keys).
 *
 * Verifies the DB-enforced boundary the app builds on (B0 — RLS is the ONLY
 * boundary; triggers already applied by MIG-APPLY, NOT reimplemented here):
 *   1. handle_new_user forces role='buyer' + null handle, ignoring client
 *      metadata role/handle at signup
 *   2. the email-OTP verify path issues a session (token_hash variant)
 *   3. guard_profile_role rejects a client role change (no-op, role stays)
 *   4. RLS anchor: an authed user reads their own row, not another buyer's
 *
 * Service-role is used ONLY as test rig (create/inspect/cleanup) via a
 * test-local client — the app runtime has no admin-client consumer. Clients
 * are built directly (not from @/lib/supabase/*) because server.ts/admin.ts
 * are `server-only` modules that cannot load under vitest.
 */

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
} catch {
  // no .env.local — the suite below skips
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasKeys = Boolean(url && anonKey && serviceRoleKey);

const runStamp = Date.now();
const emailA = `kol-p1-live-${runStamp}-a@example.com`;
const emailB = `kol-p1-live-${runStamp}-b@example.com`;

describe.skipIf(!hasKeys)("P1 live trust boundary (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  const admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Anon client that will hold user A's session for the RLS/guard checks.
  const asUserA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userAId = "";
  let userBId = "";

  beforeAll(async () => {
    // Signup attempting the forbidden client-set role/handle via metadata.
    const a = await admin.auth.admin.createUser({
      email: emailA,
      email_confirm: true,
      user_metadata: {
        role: "seller",
        handle: "forged-handle",
        display_name: "P1 Live Test A",
      },
    });
    if (a.error) throw new Error(`createUser A failed: ${a.error.message}`);
    userAId = a.data.user.id;

    const b = await admin.auth.admin.createUser({
      email: emailB,
      email_confirm: true,
      user_metadata: { display_name: "P1 Live Test B" },
    });
    if (b.error) throw new Error(`createUser B failed: ${b.error.message}`);
    userBId = b.data.user.id;
  });

  afterAll(async () => {
    // Always clean up the disposable users (profiles cascade from auth.users).
    for (const id of [userAId, userBId]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
    const { data: leftovers } = await admin
      .from("profiles")
      .select("id")
      .in("id", [userAId, userBId].filter(Boolean));
    expect(leftovers ?? []).toHaveLength(0);
  });

  it("handle_new_user seeds role='buyer' + null handle despite client metadata role='seller'", async () => {
    const { data: profile, error } = await admin
      .from("profiles")
      .select("role, handle, display_name")
      .eq("id", userAId)
      .single();
    expect(error).toBeNull();
    expect(profile?.role).toBe("buyer"); // metadata 'seller' ignored
    expect(profile?.handle).toBeNull(); // metadata handle ignored
    expect(profile?.display_name).toBe("P1 Live Test A"); // only display_name honored
  });

  it("email-OTP verification issues a session for the right user", async () => {
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email: emailA });
    expect(linkError).toBeNull();
    const tokenHash = link?.properties?.hashed_token;
    expect(tokenHash).toBeTruthy();

    const { data, error } = await asUserA.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash ?? "",
    });
    expect(error).toBeNull();
    expect(data.session).toBeTruthy();
    expect(data.user?.id).toBe(userAId);
  });

  it("a client attempt to set role='seller' is rejected by guard_profile_role and role stays 'buyer'", async () => {
    const { error } = await asUserA
      .from("profiles")
      .update({ role: "seller" })
      .eq("id", userAId);
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/role may not be changed/i);

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userAId)
      .single();
    expect(profile?.role).toBe("buyer");
  });

  it("a client CAN update own non-role profile fields (guard blocks only role)", async () => {
    const { data, error } = await asUserA
      .from("profiles")
      .update({ display_name: "P1 Live Test A (edited)" })
      .eq("id", userAId)
      .select("display_name")
      .single();
    expect(error).toBeNull();
    expect(data?.display_name).toBe("P1 Live Test A (edited)");
  });

  it("RLS anchor: user A reads their own row but not buyer B's", async () => {
    const own = await asUserA
      .from("profiles")
      .select("id")
      .eq("id", userAId);
    expect(own.error).toBeNull();
    expect(own.data).toHaveLength(1);

    const other = await asUserA
      .from("profiles")
      .select("id")
      .eq("id", userBId);
    expect(other.error).toBeNull();
    expect(other.data).toHaveLength(0); // buyer B's row is invisible to A

    // And an unfiltered scan leaks no other buyer rows (only own + sellers).
    const all = await asUserA.from("profiles").select("id, role");
    expect(all.error).toBeNull();
    for (const row of all.data ?? []) {
      expect(row.id === userAId || row.role === "seller").toBe(true);
    }
  });
});
