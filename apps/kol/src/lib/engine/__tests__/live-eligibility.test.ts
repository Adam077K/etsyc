import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { createEligible } from "../eligible";
import type { BuyerState, Candidate, EngineContext } from "../types";

/**
 * LIVE 8-state eligibility verification for P6a against the applied staging
 * DB. Auto-skips when apps/kol/.env.local is absent (CI has no keys).
 * Mirrors the Wave-1 live-suite rig (live-account-boundary.test.ts):
 * service-role is used ONLY as test fixture (seed/inspect/cleanup); the
 * engine itself is exercised through the ANON key — the exact trust level
 * the public feed runs at (video_profiles_public_read_published RLS).
 *
 * Verifies, on the real GIN-indexed arrays:
 *   1. FEED is a POSITIVE predicate — a thankyou clip can never appear
 *   2. FEED picks each store's newest eligible clip (distinct on store_id)
 *   3. unpublished stores are invisible to the anon engine (RLS boundary)
 *   4. every state of the §2 map returns exactly its tagged set
 *   5. dangling product_links degrade to the documented fallback, no throw
 *   6. untagged footage (empty arrays) is invisible in all 8 states
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
const sellerEmail = `kol-p6a-live-${runStamp}@example.com`;
const productId = randomUUID();

describe.skipIf(!hasKeys)("P6a live 8-state eligibility (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  const admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Bare anon client — the feed engine's trust level for eligibility.
  const asAnon = createSupabaseClient<Database>(url ?? "", anonKey ?? "", {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const eligible = createEligible(asAnon);

  let ownerId = "";
  let storeId = "";
  let unpubStoreId = "";
  const clip: Record<string, string> = {};

  function ctx(overrides: Partial<EngineContext>): EngineContext {
    return {
      state: "FEED",
      buyerId: null,
      sessionId: `p6a-live-${runStamp}`,
      storeScope: null,
      productId: null,
      moodHint: null,
      limit: 12,
      ...overrides,
    };
  }

  const ids = (candidates: Candidate[]) => candidates.map((c) => c.videoId);
  const ours = (candidates: Candidate[]) =>
    candidates.filter((c) => c.ownerId === ownerId);

  beforeAll(async () => {
    const seller = await admin.auth.admin.createUser({
      email: sellerEmail,
      email_confirm: true,
      user_metadata: { display_name: "P6a Live Seller" },
    });
    if (seller.error) throw new Error(`createUser failed: ${seller.error.message}`);
    ownerId = seller.data.user.id;

    const stores = await admin
      .from("stores")
      .insert([
        { owner_id: ownerId, handle: `kol-p6a-live-${runStamp}`, name: "P6a Live", published: true },
        { owner_id: ownerId, handle: `kol-p6a-live-${runStamp}-unpub`, name: "P6a Unpub", published: false },
      ])
      .select("id, handle");
    if (stores.error) throw new Error(`seed stores failed: ${stores.error.message}`);
    storeId = stores.data.find((s) => !s.handle.endsWith("-unpub"))?.id ?? "";
    unpubStoreId = stores.data.find((s) => s.handle.endsWith("-unpub"))?.id ?? "";

    // One clip per state of the §2 map, plus the adversarial cases. Tags are
    // the frozen constants (packet §7); the thankyou clip is ['thankyou']
    // ONLY on both arrays (the locked write-time invariant).
    const seed: Array<{
      slug: string;
      store: string;
      createdAt: string;
      purpose: string[];
      page: string[];
      productLinks?: string[];
      mood?: string[];
    }> = [
      { slug: "feed-old", store: storeId, createdAt: "2026-01-01T00:00:00Z", purpose: ["intro"], page: ["feed"] },
      { slug: "feed-new", store: storeId, createdAt: "2026-07-01T00:00:00Z", purpose: ["craft-story"], page: ["feed"] },
      { slug: "thankyou", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["thankyou"], page: ["thankyou"] },
      { slug: "grown", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["intro"], page: ["grown"] },
      { slug: "world-intro", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["intro"], page: ["world"] },
      { slug: "world-process", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["process"], page: ["world"] },
      { slug: "narration", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["product-narration"], page: ["product"], productLinks: [productId], mood: ["intimate"] },
      { slug: "checkout", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: ["atmosphere"], page: ["checkout"], mood: ["calm"] },
      { slug: "untagged", store: storeId, createdAt: "2026-06-01T00:00:00Z", purpose: [], page: [] },
      { slug: "unpub-feed", store: unpubStoreId, createdAt: "2026-06-01T00:00:00Z", purpose: ["intro"], page: ["feed"] },
    ];

    const videos = await admin
      .from("videos")
      .insert(
        seed.map((s) => ({
          owner_id: ownerId,
          store_id: s.store,
          src: `https://cdn.example/p6a-live/${runStamp}/${s.slug}.mp4`,
          duration_ms: 20_000,
          created_at: s.createdAt,
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
          product_links: s.productLinks ?? [],
          mood: s.mood ?? [],
        };
      }),
    );
    if (profiles.error) throw new Error(`seed profiles failed: ${profiles.error.message}`);
  });

  afterAll(async () => {
    // Deleting videos cascades video_profiles; then stores; then the user
    // (cascades the profile). Verify nothing is left behind.
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

  it("FEED never returns a thankyou clip", async () => {
    const result = await eligible(ctx({ state: "FEED" }));

    // The load-bearing invariant of the whole engine: the FEED predicate is
    // POSITIVE (page_eligibility @> {feed}); a thankyou clip is tagged
    // ['thankyou'] only, so there is no code path that puts it in the feed.
    expect(ids(result)).toContain(clip["feed-new"]);
    expect(ids(result)).not.toContain(clip["thankyou"]);
    for (const candidate of result) {
      expect(candidate.profile.page_eligibility).toContain("feed");
      expect(candidate.profile.page_eligibility).not.toContain("thankyou");
    }
  });

  it("FEED picks each store's newest eligible clip (distinct on store_id)", async () => {
    const result = await eligible(ctx({ state: "FEED" }));
    const mine = ours(result);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.videoId).toBe(clip["feed-new"]);
    expect(mine[0]?.features).toBeNull();
    expect(mine[0]?.score).toBeNull();
  });

  it("unpublished stores are invisible to the anon feed engine (RLS boundary)", async () => {
    const result = await eligible(ctx({ state: "FEED" }));
    expect(ids(result)).not.toContain(clip["unpub-feed"]);
    expect(result.some((c) => c.storeId === unpubStoreId)).toBe(false);
  });

  it("GROWN returns the store's grown-tagged clip only", async () => {
    const result = await eligible(ctx({ state: "GROWN", storeScope: storeId }));
    expect(ids(result)).toEqual([clip["grown"]]);
  });

  it("WORLD_OPEN and WORLD_BROWSE discriminate on purpose within the world pool", async () => {
    const open = await eligible(ctx({ state: "WORLD_OPEN", storeScope: storeId }));
    expect(ids(open)).toEqual([clip["world-intro"]]);

    const browse = await eligible(ctx({ state: "WORLD_BROWSE", storeScope: storeId }));
    expect(ids(browse)).toEqual([clip["world-process"]]);
  });

  it("NARRATE_SHRINK returns the clip linked to THIS product (product_links @> {productId})", async () => {
    const result = await eligible(
      ctx({ state: "NARRATE_SHRINK", storeScope: storeId, productId }),
    );
    expect(ids(result)).toEqual([clip["narration"]]);
  });

  it("a dangling product link degrades to the store-narration fallback, never a throw", async () => {
    const result = await eligible(
      ctx({ state: "NARRATE_SHRINK", storeScope: storeId, productId: randomUUID() }),
    );
    expect(ids(result)).toEqual([clip["narration"]]);
  });

  it("PRODUCT_PAGE finds the narration clip for the product on screen", async () => {
    const result = await eligible(
      ctx({ state: "PRODUCT_PAGE", storeScope: storeId, productId }),
    );
    expect(ids(result)).toEqual([clip["narration"]]);
  });

  it("CHECKOUT and THANK_YOU return exactly their tagged clip", async () => {
    const checkout = await eligible(ctx({ state: "CHECKOUT", storeScope: storeId }));
    expect(ids(checkout)).toEqual([clip["checkout"]]);

    const thankYou = await eligible(ctx({ state: "THANK_YOU", storeScope: storeId }));
    expect(ids(thankYou)).toEqual([clip["thankyou"]]);
  });

  it("untagged footage (empty arrays) is invisible in every one of the 8 states", async () => {
    const states: Array<Partial<EngineContext> & { state: BuyerState }> = [
      { state: "FEED" },
      { state: "GROWN", storeScope: storeId },
      { state: "WORLD_OPEN", storeScope: storeId },
      { state: "WORLD_BROWSE", storeScope: storeId },
      { state: "NARRATE_SHRINK", storeScope: storeId, productId },
      { state: "PRODUCT_PAGE", storeScope: storeId, productId },
      { state: "CHECKOUT", storeScope: storeId },
      { state: "THANK_YOU", storeScope: storeId },
    ];
    for (const stateCtx of states) {
      const result = await eligible(ctx(stateCtx));
      expect(ids(result)).not.toContain(clip["untagged"]);
    }
  });
});
