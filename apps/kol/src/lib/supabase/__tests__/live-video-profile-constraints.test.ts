import { fileURLToPath } from "node:url";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE regression proof for MIG-CHECK (20260721000015) against the applied
 * staging DB. Auto-skips when apps/kol/.env.local is absent (CI has no keys).
 * Mirrors the P1/P2 live rigs: service-role is used ONLY as test fixture
 * (create/inspect/cleanup); clients are built directly because server.ts /
 * admin.ts are `server-only` modules that cannot load under vitest.
 *
 * What this proves (B0 — "no restriction may be app-side only"):
 *   1. THE adversary vector: an owner JWT via PostgREST (not the app, not
 *      Zod) writing purpose=['thankyou'], page_eligibility=['feed'] fails
 *      with SQLSTATE 23514 (video_profiles_thankyou_exclusive) — a
 *      thank-you clip can never enter the public discovery feed
 *   2. the PATCH variant of the same vector is equally closed (UPDATE)
 *   3. out-of-vocabulary purpose/page/mood values → 23514 (enum CHECKs)
 *   4. anti_repetition_key format + 64-char cap → 23514 (was Zod-only;
 *      overlong keys overflow the signed cookie ring past 4096 bytes)
 *   5. empty arrays still insert — untagged footage stays VALID (and
 *      invisible: empty arrays match no eligibility query)
 *   6. the CHECKs bind the SERVICE ROLE too — unlike RLS, a privileged
 *      writer cannot bypass them
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
const emailA = `kol-migcheck-live-${runStamp}-a@example.com`;

const CHECK_VIOLATION = "23514";

describe.skipIf(!hasKeys)(
  "MIG-CHECK live video_profiles constraints (staging DB)",
  () => {
    vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

    const admin = createSupabaseClient<Database>(
      url ?? "",
      serviceRoleKey ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    // Holds owner A's session — every adversary write goes through PostgREST
    // with this JWT, exactly like a direct PATCH bypassing the app layer.
    const asOwnerA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userAId = "";
    let videoAId = "";
    let videoBId = "";
    let profileAId = "";

    beforeAll(async () => {
      const a = await admin.auth.admin.createUser({
        email: emailA,
        email_confirm: true,
        user_metadata: { display_name: "MIG-CHECK Live A" },
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

      // Owner A creates two parent clips through PostgREST (RLS owner path;
      // store_id null = account-level, video_profiles is 1:1 with videos).
      for (const slot of ["a", "b"] as const) {
        const { data, error } = await asOwnerA
          .from("videos")
          .insert({
            owner_id: userAId,
            src: `https://cdn.example/migcheck-${runStamp}-${slot}.mp4`,
          })
          .select("id")
          .single();
        if (error) throw new Error(`seed video ${slot} failed: ${error.message}`);
        if (slot === "a") videoAId = data.id;
        else videoBId = data.id;
      }
    });

    afterAll(async () => {
      // Disposable user; videos cascade from auth.users -> profiles, and
      // video_profiles cascade from videos.
      if (userAId) await admin.auth.admin.deleteUser(userAId);
      const { data: leftoverVideos } = await admin
        .from("videos")
        .select("id")
        .in("id", [videoAId, videoBId].filter(Boolean));
      expect(leftoverVideos ?? []).toHaveLength(0);
      const { data: leftoverProfiles } = await admin
        .from("video_profiles")
        .select("id")
        .in("video_id", [videoAId, videoBId].filter(Boolean));
      expect(leftoverProfiles ?? []).toHaveLength(0);
    });

    it("ACCEPTANCE: owner JWT via PostgREST cannot INSERT purpose=['thankyou'] with page_eligibility=['feed'] — 23514", async () => {
      const { error } = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        purpose: ["thankyou"],
        page_eligibility: ["feed"],
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe(CHECK_VIOLATION);
      expect(error?.message).toContain("video_profiles_thankyou_exclusive");
    });

    it("mixed-array smuggle is closed too: purpose=['intro','thankyou'] + page=['feed','thankyou'] — 23514", async () => {
      const { error } = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        purpose: ["intro", "thankyou"],
        page_eligibility: ["feed", "thankyou"],
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe(CHECK_VIOLATION);
      expect(error?.message).toContain("video_profiles_thankyou_exclusive");
    });

    it("out-of-vocabulary purpose / page_eligibility / mood values are rejected — 23514 each", async () => {
      const badPurpose = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        purpose: ["space-laser"],
      });
      expect(badPurpose.error?.code).toBe(CHECK_VIOLATION);
      expect(badPurpose.error?.message).toContain("video_profiles_purpose_enum");

      const badPage = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        page_eligibility: ["homepage"],
      });
      expect(badPage.error?.code).toBe(CHECK_VIOLATION);
      expect(badPage.error?.message).toContain("video_profiles_page_enum");

      const badMood = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        mood: ["angry"],
      });
      expect(badMood.error?.code).toBe(CHECK_VIOLATION);
      expect(badMood.error?.message).toContain("video_profiles_mood_enum");
    });

    it("anti_repetition_key: non-kebab format and >64 chars are rejected — 23514", async () => {
      const badFormat = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        anti_repetition_key: "Sena_Wheel!",
      });
      expect(badFormat.error?.code).toBe(CHECK_VIOLATION);
      expect(badFormat.error?.message).toContain(
        "video_profiles_antirep_key_format",
      );

      const tooLong = await asOwnerA.from("video_profiles").insert({
        video_id: videoAId,
        anti_repetition_key: "a".repeat(65), // lowercase, format-valid, 65 > 64
      });
      expect(tooLong.error?.code).toBe(CHECK_VIOLATION);
      expect(tooLong.error?.message).toContain(
        "video_profiles_antirep_key_format",
      );
    });

    it("empty arrays still INSERT: untagged footage stays valid (and invisible to eligibility)", async () => {
      const { data, error } = await asOwnerA
        .from("video_profiles")
        .insert({
          video_id: videoAId,
          purpose: [],
          page_eligibility: [],
          mood: [],
          anti_repetition_key: null,
        })
        .select("id, purpose, page_eligibility, mood")
        .single();
      expect(error).toBeNull();
      expect(data?.purpose).toEqual([]);
      expect(data?.page_eligibility).toEqual([]);
      expect(data?.mood).toEqual([]);
      profileAId = data?.id ?? "";
    });

    it("the PATCH vector is closed: owner UPDATE to thankyou×feed — 23514; the pure thankyou state is accepted", async () => {
      // The adversary's original vector was a PATCH on an existing row.
      const smuggle = await asOwnerA
        .from("video_profiles")
        .update({
          purpose: ["thankyou"],
          page_eligibility: ["feed", "thankyou"],
        })
        .eq("id", profileAId);
      expect(smuggle.error).not.toBeNull();
      expect(smuggle.error?.code).toBe(CHECK_VIOLATION);
      expect(smuggle.error?.message).toContain(
        "video_profiles_thankyou_exclusive",
      );

      // The one legal thankyou shape still works.
      const legal = await asOwnerA
        .from("video_profiles")
        .update({ purpose: ["thankyou"], page_eligibility: ["thankyou"] })
        .eq("id", profileAId)
        .select("purpose, page_eligibility")
        .single();
      expect(legal.error).toBeNull();
      expect(legal.data).toEqual({
        purpose: ["thankyou"],
        page_eligibility: ["thankyou"],
      });
    });

    it("CHECKs bind the SERVICE ROLE too — the privileged writer cannot smuggle either", async () => {
      const { error } = await admin.from("video_profiles").insert({
        video_id: videoBId,
        purpose: ["thankyou"],
        page_eligibility: ["feed"],
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe(CHECK_VIOLATION);
      expect(error?.message).toContain("video_profiles_thankyou_exclusive");

      // And a fully-conforming row (vocab + kebab key) is accepted.
      const ok = await admin
        .from("video_profiles")
        .insert({
          video_id: videoBId,
          purpose: ["intro"],
          page_eligibility: ["feed"],
          mood: ["warm"],
          anti_repetition_key: "sena-wheel",
        })
        .select("id")
        .single();
      expect(ok.error).toBeNull();
    });
  },
);
