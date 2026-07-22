import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

/**
 * LIVE feed-selection boundary verification (W3-B1a) against the applied
 * staging DB with SEED-W3's four maker worlds. Auto-skips when
 * apps/kol/.env.local is absent (CI has no keys). Follows the P2 precedent
 * (lib/account/__tests__/live-account-boundary.test.ts): service-role is
 * used ONLY as test fixture (create/inspect/cleanup).
 *
 * Unlike the P2 suite this one exercises the REAL app path —
 * getFeedSelection → createEngineDeps → selectVideos — because the
 * anon-vs-user client wiring is exactly what is under test. next/headers is
 * mocked with an in-memory jar (vitest has no request scope), and
 * "server-only" is defused by the vitest.config alias.
 *
 * Verifies:
 *   1. an anonymous call returns one card per published seed store
 *   2. no thankyou (or non-feed-eligible) clip ever appears — structural
 *   3. same sessionId → same order; different sessionId → reshuffle
 *   4. an UNPUBLISHED store's feed-tagged clip never appears, even when the
 *      call carries the owning seller's buyerId (the engine reads
 *      eligibility as ANON regardless of who is signed in)
 */

try {
  process.loadEnvFile(
    fileURLToPath(new URL("../../../../.env.local", import.meta.url)),
  );
} catch {
  // no .env.local — the suite below skips
}

// Test-scoped ring-cookie secret: the signed ring lives only in this
// process's mocked jar. This is a test FIXTURE, not a production default —
// the app deliberately throws EngineSecretMissingError when unprovisioned.
process.env.ENGINE_COOKIE_SECRET ??= randomBytes(48).toString("base64");

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    getAll: () =>
      [...jar.entries()].map(([name, value]) => ({ name, value })),
  }),
}));

// Static import AFTER the mock declaration (vi.mock hoists above imports).
import { getFeedSelection } from "@/lib/feed/select";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasKeys = Boolean(url && anonKey && serviceRoleKey);

const runStamp = Date.now();
const sellerEmail = `kol-b1a-live-${runStamp}-seller@example.com`;

const SEED_HANDLES = [
  "hollowgrain",
  "isoldeglass",
  "maraleather",
  "ferreirapress",
] as const;

/** Fresh jar per engine call: the ring must start empty so repeated calls
 * compare seeded-jitter order, not ring exclusion. */
async function callFeed(opts: {
  buyerId: string | null;
  sessionId: string;
}) {
  jar.clear();
  return getFeedSelection(opts);
}

describe.skipIf(!hasKeys)("B1a live feed selection boundary (staging DB)", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

  // vitest executes this describe BODY at collection even under skipIf(true)
  // — only hooks and tests are skipped. Constructing the clients here throws
  // `supabaseUrl is required` on a keyless checkout, turning the documented
  // auto-skip into a hard FAIL (the live-suite-collection-fix pattern; this
  // suite was written on a branch cut before that fix landed). beforeAll
  // never runs for a skipped suite, so the clients are built there.
  let admin: SupabaseClient<Database>;
  // Holds the seller's session — proves an authed session exists while the
  // feed still reads as anon.
  let asSeller: SupabaseClient<Database>;

  let sellerId = "";
  let unpubStoreId = "";
  let unpubVideoId = "";
  let seedStoreIds: string[] = [];

  beforeAll(async () => {
    const clientOptions = {
      auth: { autoRefreshToken: false, persistSession: false },
    };
    admin = createSupabaseClient<Database>(url ?? "", serviceRoleKey ?? "", clientOptions);
    asSeller = createSupabaseClient<Database>(url ?? "", anonKey ?? "", clientOptions);

    // Seed worlds must be live (SEED-W3 merged + applied).
    const seeds = await admin
      .from("stores")
      .select("id, handle, published")
      .in("handle", [...SEED_HANDLES]);
    if (seeds.error) throw new Error(`seed lookup failed: ${seeds.error.message}`);
    if ((seeds.data ?? []).length !== SEED_HANDLES.length) {
      throw new Error(
        `expected ${SEED_HANDLES.length} seed stores, found ${seeds.data?.length ?? 0}`,
      );
    }
    for (const store of seeds.data ?? []) {
      if (!store.published) throw new Error(`seed store ${store.handle} unpublished`);
    }
    seedStoreIds = (seeds.data ?? []).map((store) => store.id);

    // Fixture: a seller with an UNPUBLISHED store whose clip is tagged
    // feed-eligible — the exact shape that would leak if the engine ever
    // read eligibility through a cookie-bound user client.
    const created = await admin.auth.admin.createUser({
      email: sellerEmail,
      email_confirm: true,
      user_metadata: { display_name: "B1a Live Seller" },
    });
    if (created.error) throw new Error(`createUser failed: ${created.error.message}`);
    sellerId = created.data.user.id;

    // role→seller is the documented service-role privileged flow (§B0).
    const promoted = await admin
      .from("profiles")
      .update({ role: "seller" })
      .eq("id", sellerId)
      .select("id")
      .single();
    if (promoted.error) throw new Error(`promote failed: ${promoted.error.message}`);

    const store = await admin
      .from("stores")
      .insert({
        owner_id: sellerId,
        handle: `kol-b1a-unpub-${runStamp}`,
        name: "B1a Unpublished Works",
        published: false,
      })
      .select("id")
      .single();
    if (store.error) throw new Error(`store insert failed: ${store.error.message}`);
    unpubStoreId = store.data.id;

    const video = await admin
      .from("videos")
      .insert({
        owner_id: sellerId,
        store_id: unpubStoreId,
        src: "/seed/test/b1a-unpub.mp4",
        poster: null,
      })
      .select("id")
      .single();
    if (video.error) throw new Error(`video insert failed: ${video.error.message}`);
    unpubVideoId = video.data.id;

    const profile = await admin.from("video_profiles").insert({
      video_id: unpubVideoId,
      purpose: ["intro"],
      page_eligibility: ["feed"],
      mood: ["calm"],
      product_links: [],
      anti_repetition_key: `kol-b1a-unpub-${runStamp}`,
    });
    if (profile.error) throw new Error(`profile insert failed: ${profile.error.message}`);

    // Real signed-in seller session via the magiclink token-hash rig.
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({ type: "magiclink", email: sellerEmail });
    if (linkError) throw new Error(`generateLink failed: ${linkError.message}`);
    const { error: verifyError } = await asSeller.auth.verifyOtp({
      type: "email",
      token_hash: link.properties?.hashed_token ?? "",
    });
    if (verifyError) throw new Error(`verifyOtp failed: ${verifyError.message}`);
  });

  afterAll(async () => {
    // Explicit reverse-order cleanup, then prove nothing is left behind.
    if (unpubVideoId) {
      await admin.from("video_profiles").delete().eq("video_id", unpubVideoId);
      await admin.from("videos").delete().eq("id", unpubVideoId);
    }
    if (unpubStoreId) await admin.from("stores").delete().eq("id", unpubStoreId);
    if (sellerId) await admin.auth.admin.deleteUser(sellerId);

    const leftoverStores = await admin
      .from("stores")
      .select("id")
      .eq("id", unpubStoreId);
    expect(leftoverStores.data ?? []).toHaveLength(0);
    const leftoverVideos = await admin
      .from("videos")
      .select("id")
      .eq("id", unpubVideoId);
    expect(leftoverVideos.data ?? []).toHaveLength(0);
    const leftoverProfiles = await admin
      .from("profiles")
      .select("id")
      .eq("id", sellerId);
    expect(leftoverProfiles.data ?? []).toHaveLength(0);
  });

  it("an anonymous call returns one card per published seed store, maker joined", async () => {
    const result = await callFeed({ buyerId: null, sessionId: randomUUID() });

    expect(result.status).toBe("success");
    expect(result.cards.length).toBeGreaterThanOrEqual(SEED_HANDLES.length);

    // One card per store — newest-per-store reduction, no duplicates.
    const storeIds = result.cards.map((card) => card.storeId);
    expect(new Set(storeIds).size).toBe(storeIds.length);

    // Every seed world is present, and its card carries real maker identity
    // from the anon-client stores join.
    for (const seedId of seedStoreIds) {
      const card = result.cards.find((c) => c.storeId === seedId);
      expect(card).toBeDefined();
      expect(SEED_HANDLES).toContain(card?.storeSlugOrId);
      expect(card?.makerName.length).toBeGreaterThan(0);
      expect(card?.src.length).toBeGreaterThan(0);
    }
  });

  it("no thankyou (or non-feed-eligible) clip ever appears — structural exclusion", async () => {
    // Scoped to the SEED worlds: the staging pool is shared and mutable —
    // parallel live suites (live-eligibility, live-composition) plant
    // PUBLISHED feed-eligible fixtures and delete them in afterAll, so a
    // profile lookup racing that delete loses rows and fails the count
    // below spuriously. The invariant is PER-CARD, so proving it over the
    // stable seed subset proves the mechanism — and the seeds carry the
    // full purpose spectrum (every seed store has a thankyou-tagged clip),
    // so the exclusion stays load-bearing, not trivially true.
    const videoIds = new Set<string>();
    for (let i = 0; i < 3; i += 1) {
      const result = await callFeed({ buyerId: null, sessionId: randomUUID() });
      for (const card of result.cards) {
        if (seedStoreIds.includes(card.storeId)) videoIds.add(card.videoId);
      }
    }
    // anti-triviality guard: every call carries one card per seed store
    // (test 1's invariant), so the scope can never filter the set empty
    expect(videoIds.size).toBeGreaterThanOrEqual(SEED_HANDLES.length);

    const { data, error } = await admin
      .from("video_profiles")
      .select("video_id, purpose, page_eligibility")
      .in("video_id", [...videoIds]);
    expect(error).toBeNull();
    expect(data?.length).toBe(videoIds.size);
    for (const row of data ?? []) {
      expect(row.purpose).not.toContain("thankyou");
      expect(row.page_eligibility).toContain("feed");
      expect(row.page_eligibility).not.toContain("thankyou");
    }
  });

  it("the SAME sessionId returns the same order; a different sessionId reshuffles", async () => {
    // Order equality is asserted over the SEED-card subsequence, not the
    // whole pool: pool MEMBERSHIP is shared mutable state (a parallel
    // suite inserting/deleting its published fixture between the two calls
    // changes the full array), while per-card determinism is the actual
    // invariant — scoring is per-card (rank.ts: seededJitter is keyed
    // sessionId:videoId, the final sort compares each card's own score),
    // so the seed subsequence's relative order is invariant to churn
    // elsewhere in the pool. Same strength, no race.
    const seedCards = (cards: Awaited<ReturnType<typeof callFeed>>["cards"]) =>
      cards
        .filter((card) => seedStoreIds.includes(card.storeId))
        .map((card) => card.videoId);
    const sessionId = randomUUID();
    const first = await callFeed({ buyerId: null, sessionId });
    const second = await callFeed({ buyerId: null, sessionId });
    const firstSeeds = seedCards(first.cards);
    // anti-triviality guard: all four seed worlds are present, so the
    // compared subsequence is never shorter than the seed pool
    expect(firstSeeds.length).toBeGreaterThanOrEqual(SEED_HANDLES.length);
    expect(seedCards(second.cards)).toEqual(firstSeeds);

    // Seeded jitter: a new session reorders. With N cards there are N!
    // orders, so allow a few attempts to dodge the coincidence case.
    const baseline = firstSeeds.join(",");
    let reshuffled = false;
    for (let i = 0; i < 8 && !reshuffled; i += 1) {
      const other = await callFeed({ buyerId: null, sessionId: randomUUID() });
      reshuffled = seedCards(other.cards).join(",") !== baseline;
    }
    expect(reshuffled).toBe(true);
  });

  it("an UNPUBLISHED store's feed-tagged clip never appears — even for its own signed-in seller", async () => {
    // The seller session is real and CAN see the draft clip (owner RLS) —
    // this is exactly what would leak if eligibility ran on the user client.
    const ownRead = await asSeller
      .from("video_profiles")
      .select("video_id")
      .eq("video_id", unpubVideoId);
    expect(ownRead.error).toBeNull();
    expect(ownRead.data).toHaveLength(1);

    // The feed call carries the seller's buyerId (signed-in visitor path),
    // yet eligibility reads as ANON: the draft stays invisible.
    const result = await callFeed({
      buyerId: sellerId,
      sessionId: randomUUID(),
    });
    expect(result.status).toBe("success");
    expect(result.cards.map((card) => card.videoId)).not.toContain(unpubVideoId);
    expect(result.cards.map((card) => card.storeId)).not.toContain(unpubStoreId);
  });
});
