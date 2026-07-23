import { fileURLToPath } from "node:url";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE regression proof for MIG-TS (20260721000016) against the applied
 * staging DB. Auto-skips when apps/kol/.env.local is absent (CI has no keys).
 * Mirrors the MIG-CHECK live rig: service-role is used as test fixture
 * (create/inspect/cleanup) AND as the §B0 escape-hatch subject; clients are
 * built directly (in beforeAll — skipped suites run no hooks) because
 * server.ts / admin.ts are `server-only` modules that cannot load under
 * vitest.
 *
 * What this proves (B0 — "no restriction may be app-side only"):
 *   1. THE adversary vector: an owner JWT via PostgREST inserting
 *      created_at = '2099-01-01' on videos / video_profiles gets ≈now()
 *      stored, NOT 2099 — the FEED_CANDIDATE_CAP=300 recency window can no
 *      longer be permanently squatted, and rank.ts's ageDays=0 clamp cannot
 *      be pinned by a future date
 *   2. the PATCH variant is closed: an authenticated UPDATE touching
 *      created_at succeeds but the stored value is unchanged (immutable)
 *   3. the service_role escape hatch holds: explicit timestamps on
 *      service-role writes are PRESERVED — SEED-W3's deterministic re-apply
 *      and operator backfills keep full control (auth.role()='service_role',
 *      never `auth.uid() is null` — anon is also null uid)
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
const emailA = `kol-migts-live-${runStamp}-a@example.com`;

const FORGED_FUTURE = "2099-01-01T00:00:00.000Z";
const EXPLICIT_PAST = "2020-03-04T05:06:07.000Z";
/** Generous clock-skew allowance between this machine and the DB. */
const SKEW_MS = 5 * 60_000;

const isServerNow = (stored: string) =>
  Math.abs(Date.parse(stored) - Date.now()) < SKEW_MS;

describe.skipIf(!hasKeys)(
  "MIG-TS live server-enforced timestamps (staging DB)",
  () => {
    vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

    // vitest executes this describe BODY at collection even under
    // skipIf(true) — only hooks and tests are skipped. Constructing the
    // clients here throws `supabaseUrl is required` on a keyless checkout,
    // turning the documented auto-skip into a hard FAIL. beforeAll never
    // runs for a skipped suite, so the clients are built there and nothing
    // at describe scope may touch the network or env.
    let admin: SupabaseClient<Database>;
    // Holds owner A's session — every adversary write goes through PostgREST
    // with this JWT, exactly like a direct POST/PATCH bypassing the app layer.
    let asOwnerA: SupabaseClient<Database>;

    let userAId = "";
    let videoAId = "";
    let videoSvcId = "";
    let profileAId = "";
    let profileACreatedAt = "";

    beforeAll(async () => {
      admin = createSupabaseClient<Database>(
        url ?? "",
        serviceRoleKey ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      asOwnerA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const a = await admin.auth.admin.createUser({
        email: emailA,
        email_confirm: true,
        user_metadata: { display_name: "MIG-TS Live A" },
      });
      if (a.error) throw new Error(`createUser A failed: ${a.error.message}`);
      userAId = a.data.user.id;

      // Session for A via the magiclink token-hash rig (as in the P1 suite).
      const { data: link, error: linkError } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email: emailA,
        });
      if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);
      const { error: verifyError } = await asOwnerA.auth.verifyOtp({
        type: "email",
        token_hash: link.properties?.hashed_token ?? "",
      });
      if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
    });

    afterAll(async () => {
      // Disposable user; videos cascade from auth.users -> profiles, and
      // video_profiles cascade from videos.
      if (userAId) await admin.auth.admin.deleteUser(userAId);
      const { data: leftoverVideos } = await admin
        .from("videos")
        .select("id")
        .in("id", [videoAId, videoSvcId].filter(Boolean));
      expect(leftoverVideos ?? []).toHaveLength(0);
    });

    it("ACCEPTANCE 1a: owner JWT INSERT videos with created_at='2099-01-01' → stored ≈ now(), not 2099", async () => {
      const { data, error } = await asOwnerA
        .from("videos")
        .insert({
          owner_id: userAId,
          src: `https://cdn.example/migts-${runStamp}-a.mp4`,
          created_at: FORGED_FUTURE,
        })
        .select("id, created_at")
        .single();
      expect(error).toBeNull();
      videoAId = data?.id ?? "";
      expect(data?.created_at).not.toBe(FORGED_FUTURE);
      expect(Date.parse(data?.created_at ?? "")).toBeLessThan(
        Date.parse("2027-01-01T00:00:00Z"),
      );
      expect(isServerNow(data?.created_at ?? "")).toBe(true);
    });

    it("ACCEPTANCE 1b: owner JWT INSERT video_profiles with created_at='2099-01-01' → stored ≈ now() — the feed-eviction vector is dead", async () => {
      const { data, error } = await asOwnerA
        .from("video_profiles")
        .insert({
          video_id: videoAId,
          purpose: ["intro"],
          page_eligibility: ["feed"],
          mood: ["warm"],
          created_at: FORGED_FUTURE,
        })
        .select("id, created_at")
        .single();
      expect(error).toBeNull();
      profileAId = data?.id ?? "";
      profileACreatedAt = data?.created_at ?? "";
      expect(data?.created_at).not.toBe(FORGED_FUTURE);
      expect(Date.parse(data?.created_at ?? "")).toBeLessThan(
        Date.parse("2027-01-01T00:00:00Z"),
      );
      expect(isServerNow(data?.created_at ?? "")).toBe(true);
    });

    it("ACCEPTANCE 2: owner JWT UPDATE touching created_at succeeds but the value is UNCHANGED (immutable)", async () => {
      // The PATCH is accepted (trigger, not grant-revoke: benign echo-back
      // upserts must not start failing) — but created_at silently keeps its
      // server-assigned value.
      const { data, error } = await asOwnerA
        .from("video_profiles")
        .update({ created_at: FORGED_FUTURE, mood: ["calm"] })
        .eq("id", profileAId)
        .select("created_at, mood")
        .single();
      expect(error).toBeNull();
      expect(data?.mood).toEqual(["calm"]); // the write itself landed
      expect(Date.parse(data?.created_at ?? "")).toBe(
        Date.parse(profileACreatedAt), // ...but the timestamp did not move
      );

      // Same on the parent clip.
      const video = await asOwnerA
        .from("videos")
        .update({ created_at: FORGED_FUTURE })
        .eq("id", videoAId)
        .select("created_at")
        .single();
      expect(video.error).toBeNull();
      expect(isServerNow(video.data?.created_at ?? "")).toBe(true);
      expect(video.data?.created_at).not.toBe(FORGED_FUTURE);
    });

    it("ACCEPTANCE 3: service-role INSERT with an explicit timestamp is PRESERVED (§B0 escape hatch — SEED idempotence depends on it)", async () => {
      const { data, error } = await admin
        .from("videos")
        .insert({
          owner_id: userAId,
          src: `https://cdn.example/migts-${runStamp}-svc.mp4`,
          created_at: EXPLICIT_PAST,
        })
        .select("id, created_at")
        .single();
      expect(error).toBeNull();
      videoSvcId = data?.id ?? "";
      expect(Date.parse(data?.created_at ?? "")).toBe(Date.parse(EXPLICIT_PAST));
    });

    it("service-role UPDATE keeps explicit control too: created_at moves when the privileged writer says so", async () => {
      const { data, error } = await admin
        .from("videos")
        .update({ created_at: "2019-06-15T12:00:00.000Z" })
        .eq("id", videoSvcId)
        .select("created_at")
        .single();
      expect(error).toBeNull();
      expect(Date.parse(data?.created_at ?? "")).toBe(
        Date.parse("2019-06-15T12:00:00.000Z"),
      );
    });
  },
);
