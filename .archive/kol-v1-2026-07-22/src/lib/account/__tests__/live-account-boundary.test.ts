import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE trust-boundary verification for P2 (Account & Profile) against the
 * applied staging DB. Auto-skips when apps/kol/.env.local is absent (CI has
 * no keys). Mirrors the P1 live suite's rig: service-role is used ONLY as
 * test fixture (create/inspect/cleanup); clients are built directly (in
 * beforeAll — skipped suites run no hooks) because server.ts/admin.ts are
 * `server-only` modules that cannot load under vitest.
 *
 * Verifies the DB-enforced boundary the account lib builds on (B0):
 *   1. a buyer updates OWN display_name/bio/avatar_url and reads it back
 *   2. cross-user base-table reads leak NO buyer PII (bio) — RLS
 *   3. get_public_profile(known_id) returns EXACTLY ONE row of exactly
 *      {id, display_name, avatar_url, role} — and no call shape enumerates
 *      (NEW-1 gate: unknown id → 0 rows; base table hides other buyers)
 *   4. buyer_signals: service-role INSERT works, buyer reads own-only,
 *      a client INSERT is denied, weight CHECK 0–100 holds
 *   5. a client role change is rejected (guard_profile_role) and role stays
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
const emailA = `kol-p2-live-${runStamp}-a@example.com`;
const emailB = `kol-p2-live-${runStamp}-b@example.com`;

describe.skipIf(!hasKeys)("P2 live account boundary (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  // vitest executes this describe BODY at collection even under skipIf(true)
  // — only hooks and tests are skipped. Constructing the clients here throws
  // `supabaseUrl is required` on a keyless checkout, turning the documented
  // auto-skip into a hard FAIL. beforeAll never runs for a skipped suite, so
  // the clients are built there and nothing at describe scope may touch the
  // network or env.
  let admin: SupabaseClient<Database>;
  // Holds buyer A's session for the RLS/guard checks.
  let asUserA: SupabaseClient<Database>;
  // Bare anon client — NO session. get_public_profile is granted to anon.
  let asAnon: SupabaseClient<Database>;

  let userAId = "";
  let userBId = "";

  beforeAll(async () => {
    admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    asUserA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    asAnon = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: emailA,
      email_confirm: true,
      user_metadata: { display_name: "P2 Live Test A" },
    });
    if (a.error) throw new Error(`createUser A failed: ${a.error.message}`);
    userAId = a.data.user.id;

    const b = await admin.auth.admin.createUser({
      email: emailB,
      email_confirm: true,
      user_metadata: { display_name: "P2 Live Test B" },
    });
    if (b.error) throw new Error(`createUser B failed: ${b.error.message}`);
    userBId = b.data.user.id;

    // Buyer B gets PII that must never leak cross-user.
    const seed = await admin
      .from("profiles")
      .update({ bio: "B-PRIVATE-BIO — must never leak cross-user" })
      .eq("id", userBId)
      .select("id")
      .single();
    if (seed.error) throw new Error(`seed B bio failed: ${seed.error.message}`);

    // Session for A via the magiclink token-hash rig (as in the P1 suite).
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email: emailA });
    if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);
    const { error: verifyError } = await asUserA.auth.verifyOtp({
      type: "email",
      token_hash: link.properties?.hashed_token ?? "",
    });
    if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
  });

  afterAll(async () => {
    // Disposable users; profiles AND buyer_signals cascade from auth.users.
    for (const id of [userAId, userBId]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
    const ids = [userAId, userBId].filter(Boolean);
    const { data: leftoverProfiles } = await admin
      .from("profiles")
      .select("id")
      .in("id", ids);
    expect(leftoverProfiles ?? []).toHaveLength(0);
    const { data: leftoverSignals } = await admin
      .from("buyer_signals")
      .select("id")
      .in("buyer_id", ids);
    expect(leftoverSignals ?? []).toHaveLength(0);
  });

  it("buyer A updates OWN display_name/bio/avatar_url and the read reflects it", async () => {
    const { error } = await asUserA
      .from("profiles")
      .update({
        display_name: "Ada (edited)",
        bio: "I collect teapots.",
        avatar_url: "https://cdn.example/ada.png",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userAId)
      .select("id")
      .single();
    expect(error).toBeNull();

    const readBack = await asUserA
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("id", userAId)
      .single();
    expect(readBack.error).toBeNull();
    expect(readBack.data).toEqual({
      display_name: "Ada (edited)",
      bio: "I collect teapots.",
      avatar_url: "https://cdn.example/ada.png",
    });
  });

  it("cross-user bio is blocked by RLS: A cannot read buyer B's row at all", async () => {
    const direct = await asUserA
      .from("profiles")
      .select("bio")
      .eq("id", userBId);
    expect(direct.error).toBeNull();
    expect(direct.data).toHaveLength(0); // row invisible, not just column

    // Unfiltered scan: every visible row is A's own or a seller's — no other
    // buyer's bio can ride along in any select shape.
    const scan = await asUserA.from("profiles").select("id, role, bio");
    expect(scan.error).toBeNull();
    for (const row of scan.data ?? []) {
      expect(row.id === userAId || row.role === "seller").toBe(true);
      expect(row.bio ?? "").not.toContain("B-PRIVATE-BIO");
    }
  });

  it("get_public_profile(known_id) returns EXACTLY ONE row of the 4 public fields — even for anon", async () => {
    for (const client of [asAnon, asUserA]) {
      const { data, error } = await client.rpc("get_public_profile", {
        p_id: userBId,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1); // one row, never a set
      const row = data?.[0];
      expect(row?.id).toBe(userBId);
      expect(row?.display_name).toBe("P2 Live Test B");
      expect(row?.role).toBe("buyer");
      // exactly the 4 buyer-safe fields — bio is NOT in the shape
      expect(Object.keys(row ?? {}).sort()).toEqual([
        "avatar_url",
        "display_name",
        "id",
        "role",
      ]);
    }
  });

  it("NEW-1 enumeration gate: unknown id → 0 rows, and anon sees no buyer rows on the base table", async () => {
    const unknown = await asAnon.rpc("get_public_profile", {
      p_id: randomUUID(),
    });
    expect(unknown.error).toBeNull();
    expect(unknown.data).toHaveLength(0);

    // The base table offers anon no buyer-listing call shape (sellers only).
    const scan = await asAnon.from("profiles").select("id, role");
    expect(scan.error).toBeNull();
    for (const row of scan.data ?? []) {
      expect(row.role).toBe("seller");
    }
  });

  it("buyer_signals: service-role INSERT lands and buyer A reads OWN rows only", async () => {
    const insertA = await admin
      .from("buyer_signals")
      .insert({
        buyer_id: userAId,
        subject_type: "store",
        subject_id: randomUUID(),
        signal_type: "visit",
        weight: 1,
      })
      .select("id")
      .single();
    expect(insertA.error).toBeNull();

    const insertB = await admin.from("buyer_signals").insert({
      buyer_id: userBId,
      subject_type: "product",
      subject_id: randomUUID(),
      signal_type: "save",
      weight: 5,
    });
    expect(insertB.error).toBeNull();

    // A's unfiltered read surfaces ONLY A's rows (RLS read-own).
    const { data, error } = await asUserA
      .from("buyer_signals")
      .select("buyer_id, signal_type");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(1);
    for (const row of data ?? []) {
      expect(row.buyer_id).toBe(userAId);
    }
  });

  it("a client INSERT into buyer_signals is denied (no user write policy)", async () => {
    const { error } = await asUserA.from("buyer_signals").insert({
      buyer_id: userAId, // even self-scoped — clients may not self-report signals
      subject_type: "store",
      subject_id: randomUUID(),
      signal_type: "purchase",
      weight: 100,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501"); // RLS violation
  });

  it("weight CHECK 0–100 is defence-in-depth even against the service role", async () => {
    const { error } = await admin.from("buyer_signals").insert({
      buyer_id: userAId,
      subject_type: "store",
      subject_id: randomUUID(),
      signal_type: "visit",
      weight: 150,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514"); // check_violation
  });

  it("a client role change is rejected by guard_profile_role and role stays 'buyer'", async () => {
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
});
