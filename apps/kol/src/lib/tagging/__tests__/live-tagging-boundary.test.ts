import { fileURLToPath } from "node:url";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE trust-boundary verification for P7 (video-profile tagging) against
 * the applied staging DB. Auto-skips when apps/kol/.env.local is absent (CI
 * has no keys). Mirrors the P2 live suite's rig: service-role is used ONLY
 * as test fixture (create/inspect/cleanup); clients are built directly (in
 * beforeAll — skipped suites run no hooks) because server.ts/admin.ts are
 * `server-only` modules.
 *
 * Verifies the DB-enforced boundary the tagging lib builds on (B0) — the
 * tag COLUMNS have no CHECK constraint (Zod is that boundary, unit-tested
 * in ../schemas.test.ts); the ROW boundary is RLS and is verified here:
 *   1. the owner CAN write their own clip's video_profiles row
 *   2. a different authenticated user CANNOT (insert denied, update no-ops)
 *   3. anon CANNOT write
 *   4. anon CAN read profiles of a PUBLISHED store's clips and CANNOT read
 *      an unpublished store's
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
const emailA = `kol-p7-live-${runStamp}-a@example.com`;
const emailB = `kol-p7-live-${runStamp}-b@example.com`;

const OWNER_TAGS = {
  purpose: ["process"],
  page_eligibility: ["feed", "world"],
  product_links: [],
  mood: ["calm"],
  anti_repetition_key: `p7-live-${runStamp}`,
};

describe.skipIf(!hasKeys)("P7 live tagging boundary (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  // vitest executes this describe BODY at collection even under skipIf(true)
  // — only hooks and tests are skipped. Constructing the clients here throws
  // `supabaseUrl is required` on a keyless checkout, turning the documented
  // auto-skip into a hard FAIL. beforeAll never runs for a skipped suite, so
  // the clients are built there and nothing at describe scope may touch the
  // network or env.
  let admin: SupabaseClient<Database>;
  // Seller A (the owner) and buyer B each hold a session for the RLS checks.
  let asUserA: SupabaseClient<Database>;
  let asUserB: SupabaseClient<Database>;
  // Bare anon client — NO session.
  let asAnon: SupabaseClient<Database>;

  let userAId = "";
  let userBId = "";
  let publishedStoreId = "";
  let draftStoreId = "";
  let publishedClipId = "";
  let draftClipId = "";
  // A row-less clip: B's denied INSERT must target a clip with NO existing
  // video_profiles row, or the unique(video_id) constraint could fire
  // before RLS and muddy the 42501 assertion.
  let untaggedClipId = "";

  async function signIn(
    client: typeof asUserA,
    email: string,
  ): Promise<void> {
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);
    const { error: verifyError } = await client.auth.verifyOtp({
      type: "email",
      token_hash: link.properties?.hashed_token ?? "",
    });
    if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
  }

  beforeAll(async () => {
    admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    asUserA = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    asUserB = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    asAnon = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: emailA,
      email_confirm: true,
      user_metadata: { display_name: "P7 Live Maker A" },
    });
    if (a.error) throw new Error(`createUser A failed: ${a.error.message}`);
    userAId = a.data.user.id;

    const b = await admin.auth.admin.createUser({
      email: emailB,
      email_confirm: true,
      user_metadata: { display_name: "P7 Live Buyer B" },
    });
    if (b.error) throw new Error(`createUser B failed: ${b.error.message}`);
    userBId = b.data.user.id;

    // role→seller is the service-role onboarding step (B0) — fixture only.
    // bio is set non-null because seller rows are publicly visible and the
    // P2 live suite's unfiltered scan asserts on every visible bio — a
    // null here would crash its toContain when both suites run in parallel
    // against the same staging DB.
    const promote = await admin
      .from("profiles")
      .update({ role: "seller", bio: "P7 live fixture seller." })
      .eq("id", userAId)
      .select("id")
      .single();
    if (promote.error) {
      throw new Error(`promote A failed: ${promote.error.message}`);
    }

    // A published store and an unpublished one, each with one clip.
    const stores = await admin
      .from("stores")
      .insert([
        {
          owner_id: userAId,
          handle: `kol-p7-live-${runStamp}-pub`,
          name: "P7 Live Published Store",
          published: true,
        },
        {
          owner_id: userAId,
          handle: `kol-p7-live-${runStamp}-draft`,
          name: "P7 Live Draft Store",
          published: false,
        },
      ])
      .select("id, published");
    if (stores.error) throw new Error(`seed stores failed: ${stores.error.message}`);
    publishedStoreId = stores.data.find((s) => s.published)?.id ?? "";
    draftStoreId = stores.data.find((s) => !s.published)?.id ?? "";

    const videos = await admin
      .from("videos")
      .insert([
        {
          owner_id: userAId,
          store_id: publishedStoreId,
          src: "https://cdn.example/p7-live-published.mp4",
          duration_ms: 30_000,
        },
        {
          owner_id: userAId,
          store_id: draftStoreId,
          src: "https://cdn.example/p7-live-draft.mp4",
          duration_ms: 30_000,
        },
        {
          owner_id: userAId,
          store_id: publishedStoreId,
          src: "https://cdn.example/p7-live-untagged.mp4",
        },
      ])
      .select("id, store_id, src");
    if (videos.error) throw new Error(`seed videos failed: ${videos.error.message}`);
    publishedClipId =
      videos.data.find((v) => v.src.includes("published"))?.id ?? "";
    draftClipId = videos.data.find((v) => v.src.includes("draft"))?.id ?? "";
    untaggedClipId =
      videos.data.find((v) => v.src.includes("untagged"))?.id ?? "";

    // Fixture profile on the DRAFT clip so test 4 proves anon can't see it.
    const draftProfile = await admin.from("video_profiles").insert({
      video_id: draftClipId,
      purpose: ["atmosphere"],
      page_eligibility: ["world"],
      mood: ["calm"],
    });
    if (draftProfile.error) {
      throw new Error(`seed draft profile failed: ${draftProfile.error.message}`);
    }

    await signIn(asUserA, emailA);
    await signIn(asUserB, emailB);
  });

  afterAll(async () => {
    // Disposable users; stores/videos/video_profiles cascade from profiles.
    for (const id of [userAId, userBId]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
    const storeIds = [publishedStoreId, draftStoreId].filter(Boolean);
    const { data: leftoverStores } = await admin
      .from("stores")
      .select("id")
      .in("id", storeIds);
    expect(leftoverStores ?? []).toHaveLength(0);
    const clipIds = [publishedClipId, draftClipId].filter(Boolean);
    const { data: leftoverProfiles } = await admin
      .from("video_profiles")
      .select("id")
      .in("video_id", clipIds);
    expect(leftoverProfiles ?? []).toHaveLength(0);
  });

  it("owner A CAN upsert their own clip's video_profiles row and read it back", async () => {
    const { error } = await asUserA
      .from("video_profiles")
      .upsert(
        { video_id: publishedClipId, ...OWNER_TAGS },
        { onConflict: "video_id" },
      )
      .select("id")
      .single();
    expect(error).toBeNull();

    const readBack = await asUserA
      .from("video_profiles")
      .select("purpose, page_eligibility, product_links, mood, anti_repetition_key")
      .eq("video_id", publishedClipId)
      .single();
    expect(readBack.error).toBeNull();
    expect(readBack.data).toEqual(OWNER_TAGS);
  });

  it("a different authenticated user CANNOT insert a profile for A's clip", async () => {
    const { error } = await asUserB.from("video_profiles").insert({
      video_id: untaggedClipId,
      purpose: ["intro"],
      page_eligibility: ["feed"],
      mood: ["warm"],
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501"); // RLS violation
  });

  it("a different authenticated user's UPDATE on A's row silently affects nothing", async () => {
    const attempt = await asUserB
      .from("video_profiles")
      .update({ page_eligibility: ["feed", "checkout"] })
      .eq("video_id", publishedClipId)
      .select("id");
    expect(attempt.error).toBeNull();
    expect(attempt.data).toHaveLength(0); // row invisible to B — no write

    const { data: untouched } = await admin
      .from("video_profiles")
      .select("page_eligibility")
      .eq("video_id", publishedClipId)
      .single();
    expect(untouched?.page_eligibility).toEqual(OWNER_TAGS.page_eligibility);
  });

  it("anon CANNOT write video_profiles at all", async () => {
    const { error } = await asAnon.from("video_profiles").insert({
      video_id: publishedClipId,
      purpose: ["intro"],
      page_eligibility: ["feed"],
      mood: ["warm"],
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("anon CAN read a PUBLISHED store's clip profile (the engine's read path)", async () => {
    const { data, error } = await asAnon
      .from("video_profiles")
      .select("video_id, purpose, page_eligibility")
      .eq("video_id", publishedClipId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.purpose).toEqual(OWNER_TAGS.purpose);
  });

  it("anon CANNOT read an UNPUBLISHED store's clip profile", async () => {
    const { data, error } = await asAnon
      .from("video_profiles")
      .select("video_id")
      .eq("video_id", draftClipId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0); // row invisible, not an error
  });
});
