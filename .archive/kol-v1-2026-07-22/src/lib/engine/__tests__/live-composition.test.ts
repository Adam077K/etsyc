import { fileURLToPath } from "node:url";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { createEngineDeps, selectVideos } from "../index";
import type { EngineContext, EngineDeps } from "../types";

/**
 * LIVE end-to-end composition (W2-WIRE STEP 5) against the applied staging
 * DB, through createEngineDeps — the exact wiring application code will
 * call, including the internally-constructed ANON client for eligibility
 * and the service-role client for buyer_signals. Mirrors the Wave-1 live
 * rig (live-account-boundary.test.ts / live-eligibility.test.ts):
 * service-role is used ONLY as test fixture (seed/cleanup); the pipeline
 * itself reads at the anon trust level. Auto-skips when apps/kol/.env.local
 * is absent (CI has no keys).
 */

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
} catch {
  // no .env.local — the suite below skips
}

// ENGINE_COOKIE_SECRET is not yet provisioned (packet §5A). This suite must
// RUN regardless — inject a literal test secret rather than skip. Test-file
// value only: production has no fallback (createEngineDeps throws).
process.env.ENGINE_COOKIE_SECRET ??= "w2-wire-live-composition-test-secret";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasKeys = Boolean(url && anonKey && serviceRoleKey);

const runStamp = Date.now();
const sellerEmail = `kol-w2wire-live-${runStamp}@example.com`;

describe.skipIf(!hasKeys)("W2-WIRE live composition (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  // F12 (QA-Lead gate-1 must-fix 5): vitest executes this describe BODY at
  // collection even under skipIf(true) — only hooks and tests are skipped.
  // Constructing the client here throws `supabaseUrl is required` on a
  // keyless checkout, turning the documented auto-skip into a hard FAIL.
  // beforeAll never runs for a skipped suite, so the fixture client is
  // built there and nothing at describe scope may touch the network or env.
  let admin: SupabaseClient<Database>;

  let ownerId = "";
  let storeId = "";
  let unpubStoreId = "";
  const clip: Record<string, string> = {};

  /** Fresh cookie jar + deps per test so rings never bleed between tests. */
  function engineWithJar(): { deps: EngineDeps; jar: { value: string | undefined } } {
    const jar: { value: string | undefined } = { value: undefined };
    const deps = createEngineDeps({
      read: () => jar.value,
      write: (next: string) => {
        jar.value = next;
      },
    });
    return { deps, jar };
  }

  function ctx(overrides: Partial<EngineContext>): EngineContext {
    return {
      state: "FEED",
      buyerId: null,
      sessionId: `w2wire-live-${runStamp}`,
      storeScope: null,
      productId: null,
      moodHint: null,
      limit: 50,
      ...overrides,
    };
  }

  beforeAll(async () => {
    admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const seller = await admin.auth.admin.createUser({
      email: sellerEmail,
      email_confirm: true,
      user_metadata: { display_name: "W2-WIRE Live Seller" },
    });
    if (seller.error) throw new Error(`createUser failed: ${seller.error.message}`);
    ownerId = seller.data.user.id;

    const stores = await admin
      .from("stores")
      .insert([
        { owner_id: ownerId, handle: `kol-w2wire-live-${runStamp}`, name: "W2 Live", published: true },
        { owner_id: ownerId, handle: `kol-w2wire-live-${runStamp}-unpub`, name: "W2 Unpub", published: false },
      ])
      .select("id, handle");
    if (stores.error) throw new Error(`seed stores failed: ${stores.error.message}`);
    storeId = stores.data.find((s) => !s.handle.endsWith("-unpub"))?.id ?? "";
    unpubStoreId = stores.data.find((s) => s.handle.endsWith("-unpub"))?.id ?? "";

    // One ['feed'] clip + one ['thankyou'] clip on the PUBLISHED store, and
    // one ['feed']-tagged clip on the UNPUBLISHED store (the regression
    // fixture for the anon-client defect). Tags are the frozen constants;
    // the thankyou clip is ['thankyou'] ONLY on both arrays (MIG-CHECK).
    const nowIso = new Date(runStamp).toISOString();
    const seed = [
      { slug: "feed", store: storeId, purpose: ["intro"], page: ["feed"] },
      { slug: "thankyou", store: storeId, purpose: ["thankyou"], page: ["thankyou"] },
      { slug: "unpub-feed", store: unpubStoreId, purpose: ["intro"], page: ["feed"] },
    ];

    const videos = await admin
      .from("videos")
      .insert(
        seed.map((s) => ({
          owner_id: ownerId,
          store_id: s.store,
          src: `https://cdn.example/w2wire-live/${runStamp}/${s.slug}.mp4`,
          duration_ms: 20_000,
          created_at: nowIso,
        })),
      )
      .select("id, src");
    if (videos.error) throw new Error(`seed videos failed: ${videos.error.message}`);
    for (const s of seed) {
      const match = videos.data.find((v) => v.src.endsWith(`/${s.slug}.mp4`));
      if (!match) throw new Error(`seeded video missing: ${s.slug}`);
      clip[s.slug] = match.id;
    }

    const profiles = await admin.from("video_profiles").insert(
      seed.map((s) => {
        const videoId = clip[s.slug];
        if (!videoId) throw new Error(`seeded video missing: ${s.slug}`);
        return {
          video_id: videoId,
          purpose: s.purpose,
          page_eligibility: s.page,
          product_links: [],
          mood: [],
        };
      }),
    );
    if (profiles.error) throw new Error(`seed profiles failed: ${profiles.error.message}`);
  });

  afterAll(async () => {
    // Deleting videos cascades video_profiles; then stores; then the user
    // (cascades the profile). Verify cleanup left NOTHING behind.
    const videoIds = Object.values(clip);
    if (videoIds.length > 0) {
      await admin.from("videos").delete().in("id", videoIds);
    }
    const storeIds = [storeId, unpubStoreId].filter(Boolean);
    if (storeIds.length > 0) {
      await admin.from("stores").delete().in("id", storeIds);
    }
    if (ownerId) await admin.auth.admin.deleteUser(ownerId);

    const leftoverProfiles = await admin
      .from("video_profiles")
      .select("id")
      .in("video_id", videoIds);
    expect(leftoverProfiles.data ?? []).toHaveLength(0);
    const leftoverVideos = await admin.from("videos").select("id").in("id", videoIds);
    expect(leftoverVideos.data ?? []).toHaveLength(0);
    const leftoverStores = await admin.from("stores").select("id").in("id", storeIds);
    expect(leftoverStores.data ?? []).toHaveLength(0);
  });

  it("live real pipeline: the seeded feed clip is served and the thankyou clip never is", async () => {
    const { deps, jar } = engineWithJar();

    const selection = await selectVideos(ctx({ state: "FEED" }), deps);

    const mine = selection.clips.filter((c) => c.ownerId === ownerId);
    expect(mine.map((c) => c.videoId)).toContain(clip["feed"]);
    expect(selection.clips.map((c) => c.videoId)).not.toContain(clip["thankyou"]);
    // The REAL ring wrote a signed cookie through createEngineDeps' wiring.
    expect(jar.value).toBeTruthy();
    expect(jar.value).toContain(".");
  });

  it("anon client cannot see an unpublished store's clips", async () => {
    // The regression test for the defect W2-WIRE closes: through
    // createEngineDeps the eligibility read runs on the internally-built
    // ANON client, so an unpublished store's ['feed']-tagged clip is
    // invisible under *_public_read_published RLS — it can never enter the
    // pool, and newestPerStore can never hand it a slot.
    const { deps } = engineWithJar();

    const selection = await selectVideos(ctx({ state: "FEED" }), deps);

    expect(selection.clips.map((c) => c.videoId)).not.toContain(clip["unpub-feed"]);
    expect(selection.clips.some((c) => c.storeId === unpubStoreId)).toBe(false);
  });

  it("live real pipeline: THANK_YOU serves the thankyou clip through the same wiring", async () => {
    const { deps } = engineWithJar();

    const selection = await selectVideos(
      ctx({ state: "THANK_YOU", storeScope: storeId, limit: 1 }),
      deps,
    );

    expect(selection.clips.map((c) => c.videoId)).toEqual([clip["thankyou"]]);
  });
});
