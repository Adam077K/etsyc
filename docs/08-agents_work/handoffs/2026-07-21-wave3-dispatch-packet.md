---
title: KOL Wave-3 Dispatch Packet — Buyer Core Journey (B1–B8) + Product Provider
date: 2026-07-21
author: CTO (session `cto-wave3-packet`)
status: READY TO DISPATCH — GATED ON WAVE-2 MERGE
baseline: main @ 641ca6e (Waves 0 + 1 merged). Wave 2 is CODE-CERTIFIED but UNMERGED.
units: 15 (FILM-LAYER, P3-EXT, W2-WIRE, SEED-W3, B1a, B1b, B2, B3, B4, B5, S8, B6, B7a, B7b, B8)
amended: 2026-07-22 — AMENDMENT A (Film Layer) + AMENDMENT B (Design-Lead delivery). Read those FIRST.
new_migrations_required: 0
---

# Wave-3 Dispatch Packet

Paste-ready worker briefs for the KOL MVP Wave 3 — the wave where the buyer product goes live.
The CTO does not spawn workers and writes no source code; this packet is the entire engineering deliverable.

---

## AMENDMENT A — the Film Layer. **CTO ruling, 2026-07-22. Supersedes §2E and retiers B2/B3.**

Design-Lead is correct and my original §2E was wrong. I ruled against the shipped code, not the docs.

**What I got wrong.** §2E cited `HeroStage.tsx`'s doc comment — *"ready for the cross-route shared-element
morph when the feed (B1) arrives"* — as evidence the machinery was ready. It is a forward-looking author's
note, not a shipped capability, and I quoted it as if it were the latter.

**The evidence, on the code:**

1. `HeroStage` is rendered **inside** `StoreWorld`, which is scoped to exactly one `config`
   (`data-store={config.storeId}`). It is a child of a single store's tree.
2. Its persistence guarantee comes from `StoreWorld` holding an identical tree position while only
   `data-world-stage` flips and CSS fades `.kol-world-body`. `stages.ts` says so in its own comment:
   *"FEED/GROWN belong to the feed surface (B1) in the full app; the renderer carries them so the unfold
   can be simulated and transition-tested end-to-end before the feed exists."* Wave 0 simulates feed and
   grown **inside one world**, and labelled it as simulation.
3. `hero-persistence.test.tsx` proves persistence only within a single mounted `<StoreWorld config={senaStore}>`.
   Every assertion is a `container.querySelector` inside one store's tree. It never tests two stores. It cannot.
4. The real FEED is cross-maker — `eligible.ts` runs `newestPerStore(pool)` with no `storeScope`, so the feed
   is N sibling cards from N stores. Tapping card #7 must turn card #7's `<video>` into store #7's world hero.
   Different component trees. **React cannot relocate a host node across parents without unmounting it.**
   No primitive does this, and `layoutId` in framer-motion does not either — it cross-fades two nodes and
   animates the rect, which fails the invariant rather than satisfying it.
5. `view-transition-name` on `.kol-hero-stage` does not rescue this. The View Transitions API morphs
   **snapshots**: it captures old and new as images. A `<video>` under a view transition shows a static
   captured frame for the duration of the morph — which is precisely the frozen frame the invariant exists
   to forbid.
6. Design-Lead's second claim is also correct. `FilmFrame` renders `<video src={clip.src}>`. Changing `src`
   on a live `<video>` runs the media load algorithm: `readyState` resets, playback stops, poster or black
   flashes. **B4's original instruction in this packet — "change the `src`, never remount the `<video>`" —
   is not physically satisfiable.** A/B stacked buffers cross-fading over `--dur-swap` is the correct
   mechanism.

**The ruling.** The Film Layer is real, it is required, and it is the largest piece of Wave-3 frontend work.
It becomes **unit FILM-LAYER**, tier **Full**, group **T0a**, brief at the end of this packet. It gates
B1b, B2, B3, B4, B5.

**Retiering:**

| Unit | Was | Now | Why |
|---|---|---|---|
| **FILM-LAYER** | — | **Full** (new) | rewrites a QA-passed P4 invariant; est. 400–600 LOC; load-bearing for the whole buyer journey |
| **B2** grow | Lite, 180–260 | **Full**, 220–320 | owns the cross-tree FEED→GROWN edge — the one that broke the original architecture |
| **B3** unfold | Lite, 200–280 | **Full**, 300–420 | Design-Lead §3.3 is a 900 ms three-band choreography, materially larger than my estimate |
| **B4** browse | Lite, 180–260 | **Lite** (unchanged) | gets *simpler* — the clip swap becomes a FILM-LAYER API call instead of an impossible src mutation |
| **B5** dock | Lite, 150–220 | **Lite** (unchanged) | gets *simpler* — the dock FLIP moves into FILM-LAYER; B5 publishes a rect and owns the exclusion zone + fallback chain |
| **B1b** feed | Full | **Full** (unchanged) | under Focus Film only the focused card is a film; the rest are posters, which removes the N-concurrent-video problem |

**The AC wording changes with it.** CPO's reframing — *"the film frame never unmounts and never shows a
paused or black frame"* — is correct and stricter than the old phrasing in the right way: the old
"the `<video>` element never unmounts" technically permitted a black flash on src change. **Retire the
element-identity wording from B2 and B3.** A worker left with it will write a test asserting a single
`<video>` node, which A/B buffers deliberately violate — the test would fail the correct implementation.

**§2E is superseded** on the claim that B2–B5 "extend this machinery." They extend the **Film Layer**, which
FILM-LAYER builds. Everything §2E says about **not adding framer-motion still stands** — the mechanism is
still an imperative FLIP plus CSS, and an animation library would not have solved the cross-tree problem
anyway. That prohibition is unchanged in every brief.

---

## AMENDMENT B — Design-Lead's Wave-3 delivery. **New unit P3-EXT.**

`docs/06-design/` now holds the direction, per-screen specs (B1–B5), reference pass, and the AA fix.
Two of its gaps are contract changes upstream of SEED-W3, so they get their own unit.

**Unit P3-EXT** (`backend-engineer`, Fable 5, **Full**, T0a). Three items, all specified line-by-line by
Design-Lead so the worker invents nothing:

1. `ClipSchema.focalPoint {x, y}` — additive, defaulted `{0.5, 0.5}`, non-breaking. One clip is composed at
   four aspect ratios across the journey; without a focal point a centre crop decapitates makers in the 4:5
   feed card.
2. `HeroVideoBlockSchema.props.statement?: string`, max ~48 chars, maker-authored, D10 applies. Today `props`
   is `z.strictObject({ showCraftLine: boolean })` — `strictObject` **rejects** an unknown key, so there is
   currently no way for a maker to author the one big line over their film.
3. The AA ship-blocker. Design-Lead measured that the ticket named the wrong culprit: `sunbaked --muted`
   passes at 5.23:1. What fails is `EmptyPrompt`'s hint line, where `bg-surface/60` and `text-muted/80`
   compound to **3.63:1**, and the same un-audited alpha-modifier pattern fails in **8 of 10 palette-modes**.
   `EmptyPrompt` is the empty state of every Wave-3 screen. Includes the repo-wide guard test forbidding an
   opacity modifier on any ink token.

The **Wave-3 motion tokens** (`--dur-grow`, `--dur-ungrow`, `--dur-dock`, `--dur-swap`, `--return-ratio`)
are owned by **FILM-LAYER**, not P3-EXT — it is the layer that consumes them, and putting them there removes
a serial edge. They must not be authored by B2–B5, which would be a four-way conflict on `globals.css`.

`impact-stat` is recommended-not-blocking; deferred to Wave 6 as a `craft-story` sub-slot. Catalog stays at
11 blocks. No SEED change, no catalog reseed.

**Amend the five B1–B5 briefs before dispatch:** add `docs/06-design/KOL-wave3-screen-specs.md` and
`KOL-wave3-design-direction.md` to "Read ONLY these", and **replace each brief's "Design-Lead seam"
paragraph with a pointer to the relevant section.** Those paragraphs existed to prevent invention; the specs
now exist, so workers follow the specs, not my defaults. Add Design-Lead's handover checklist (§6) as the
completion bar, including its two hard prohibitions: no transition outside the edge table (§5.2), and no
seller-themed element in B1 or B2 (Invariant I7).

**Two open questions block dispatch and are not the CTO's to close:**
- **OQ-1 (Founder/CPO)** — the Focus Film model amends B1's written AC from plural autoplaying cards to one
  film at a time. **Blocks B1b.** Engineering read: adopt it. It is the only model that satisfies B2's edge
  without contortion — you cannot promote one of eighteen concurrently-playing elements into the Film Layer
  without first deciding which one is *the* film — and eighteen simultaneous videos is a performance problem
  independent of the design argument.
- **OQ-3 (Founder)** — the Lusion signature beat, open since 2026-07-20, blocking the `dimensional` preset.
  Engineering read: accept Design-Lead's `depth-3d` fallback and unblock B3 now. Reversible, Lite-tier
  visual decision.

OQ-2 (seller accent in feed) defers to Wave 6. OQ-4 (`distinct on (store_id)` returns 4 cards at N=4 seed
worlds, not 18) is folded into B1b via Design-Lead's N=1..4 spread patterns.

---

## AMENDED DISPATCH ORDER — supersedes §11

```
PRE   Wave-2 merge verified  ·  MIG-CHECK applied  ·  OQ-1 + OQ-3 signed
T0a   { FILM-LAYER , P3-EXT , W2-WIRE }    3-way parallel
T0b   SEED-W3                              after P3-EXT
GATE1 QA-Lead over all four  →  MERGE TO MAIN
T1    { B1a , B2 , B3 , B4 , B5 , S8 }     6-way parallel
T1.5  B1b                                  after B1a
GATE2 QA-Lead over the seven  →  MERGE TO MAIN
T2    B6            after S8 + B5
T3    B7a           after B6
T3.5  { B7b , B8 }  2-way parallel, both after B7a
GATE3 B7a Irreversible pipeline + Founder sign-off; full-spine Playwright E2E
```

New edges: `FILM-LAYER → {B1b, B2, B3, B4, B5}` · `P3-EXT → SEED-W3` · `P3-EXT → {B1b, B3}`.
FILM-LAYER, P3-EXT and W2-WIRE are genuinely independent — render layer, contract, engine.

---

## 0 · PRECONDITION — Wave 3 is not yet unblocked

**Nothing in this packet may be dispatched until Wave 2 is merged to `main`.** Wave 2 is code-certified
and sitting behind a QA gate on five branches (`feat/p7-video-profile-tagging`, `feat/p6a-eligible-rank`,
`feat/p6b-antirepetition`, `feat/seed-blocks-catalog`, `feat/w1-fastfollow`). Every Wave-3 worker branches
from `main` and every Wave-3 brief below restates this as a hard precondition in its own text.

Verify before dispatch:

```
git -C /Users/adamks/VibeCoding/etsyc log --oneline main | head -10
git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/eligible.ts | head -1
git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/tagging/schemas.ts | head -1
```

Both `show` commands must succeed. If either errors, Wave 2 has not landed and **no Wave-3 unit may start.**

Second precondition, narrower: **MIG-CHECK must be applied to staging before SEED-W3 writes any
`video_profiles` row.** MIG-CHECK is Founder-signed with apply pending; it adds 5 CHECK constraints
(enum vocabulary, thankyou-exclusive, `anti_repetition_key` format + 64-char cap). Seeding first and
applying second risks seed rows that fail the constraint apply.

Third: **`ANTHROPIC_API_KEY` must NOT be provisioned in any deployed environment.** P7 merges dark until
`tagging_accuracy` clears macro-F1 ≥ 0.80. No Wave-3 unit calls an LLM. Any worker that thinks it needs
one must return BLOCKED.

---

## 1 · Executive summary

| # | Unit | Worker type | Tier | Group | Blocking edge |
|---|---|---|---|---|---|
| 1 | **W2-WIRE** engine composition root + F3 query bound | `backend-engineer` | **Full** | T0 | gates B1a, B2, B3, B4, B5, B8 |
| 2 | **SEED-W3** 4 seed maker worlds (stores/configs/videos/profiles/products) | `database-engineer` | **Full** | T0 | gates B1a–B8 and S8 (needs MIG-CHECK applied) |
| 3 | **B1a** discovery-feed data layer + public-route enablement | `backend-engineer` | **Full** | T1 | after W2-WIRE + SEED-W3; gates B1b |
| 4 | **B1b** magazine layout + anti-grid invariant | `frontend-engineer` (Fable) | **Full** | T1.5 | after B1a |
| 5 | **B2** grow-interaction | `frontend-engineer` (Fable) | Lite | T1 | after W2-WIRE + SEED-W3 |
| 6 | **B3** world-unfold | `frontend-engineer` (Fable) | Lite | T1 | after W2-WIRE + SEED-W3 |
| 7 | **B4** store-scroll-interact | `frontend-engineer` (Fable) | Lite | T1 | after W2-WIRE + SEED-W3 |
| 8 | **B5** contextual-narration-shrink | `frontend-engineer` (Fable) | Lite | T1 | after W2-WIRE + SEED-W3 |
| 9 | **S8** product-management | `frontend-engineer` (Fable) | **Full** | T1 | after SEED-W3; gates B6 |
| 10 | **B6** product-page + cart module | `frontend-engineer` (Fable) | **Full** | T2 | after S8 + B5; gates B7a |
| 11 | **B7a** Stripe server integration + webhook | `backend-engineer` | **IRREVERSIBLE** | T3 | after B6; gates B7b |
| 12 | **B7b** checkout surface | `frontend-engineer` (Fable) | **Full** | T3.5 | after B7a |
| 13 | **B8** thank-you moment | `frontend-engineer` (Fable) | Lite | T4 | after B7a + W2-WIRE |

Every build worker runs on **Fable 5 (`claude-fable-5`)**, one unit each, isolated worktree from `main`.

---

## 2 · Blockers and asks — READ BEFORE DISPATCH

### A. `ENGINE_COOKIE_SECRET` is still not provisioned — HARD BLOCKER on B1 serving traffic

P6b architected around it (`createCookieKeyRing` takes `secret` as a required constructor argument, no
module-level env read), so Wave 2 was unaffected. Wave 3 is the point where the engine is actually served
and the secret becomes load-bearing: without it there is no anti-repetition ring, and a buyer re-sees the
same clips on every visit.

**Ask Adam at dispatch time:**
> Add `ENGINE_COOKIE_SECRET=<32+ random bytes, base64>` to `/Users/adamks/VibeCoding/etsyc/apps/kol/.env.local`.
> Generate with `openssl rand -base64 48`.

**Contingency:** W2-WIRE builds and tests the full wiring regardless (its unit tests inject a literal test
secret). If the var is still absent when B1a runs, B1a returns **PARTIAL** with
`resume_point: "wire ENGINE_COOKIE_SECRET into the feed route — needs the env var"`. B2–B5 are unaffected;
they consume a single-clip selection where the ring is a no-op if empty.

### B. Stripe test-mode keys are not provisioned — HARD BLOCKER on B7a's payment half

`apps/kol/.env.local` contains six variables, all Supabase. There is no Stripe key anywhere in the repo.

**Ask Adam before T3:**
> Add to `apps/kol/.env.local`, all **test mode**:
> `STRIPE_SECRET_KEY=sk_test_...`
> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
> `STRIPE_WEBHOOK_SECRET=whsec_...` (from `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

A `sk_live_`/`pk_live_` prefix is a hard failure — B7a's brief requires a startup guard that throws on any
non-`_test_` key. **Contingency:** B7a builds the PaymentIntent path, the webhook route, the idempotency
guard, and the security tests in full and returns PARTIAL on the live-Stripe integration test only.

### C. No Supabase Storage bucket exists for S8 media upload

The `media` table is applied with RLS (`media_owner_all`, `media_public_read_published`), but buckets are
Supabase-side configuration and no migration creates one. S8 uploads product images and optional GLB models.

**Ask Adam before T1:**
> Create a Supabase Storage bucket named `store-media` on project `olwtcjzmohdhawdzlzqs`, public read,
> authenticated write, with an owner-scoped write policy.

**Contingency:** S8 builds the full upload path against the bucket name `store-media` and returns PARTIAL
with `resume_point: "upload smoke test — needs the store-media bucket"` if it is absent. The `products`
CRUD half — which is what B6/B7 actually need — stands alone and must land regardless.

### D. No seed footage exists for the 4 seed worlds

`videos.src` needs playable URLs. D12 calls for 4 seed maker worlds; nothing has been shot or uploaded.

**Ask Adam before T0:**
> Either supply 4 makers' clip URLs (intro / craft-story / process / product-narration / thankyou per
> world), or approve shipping public-domain placeholder film so the buyer journey is demonstrable end-to-end.

**Contingency baked into SEED-W3:** it seeds against Adam-supplied URLs if present; otherwise against
committed public-domain placeholder clips under `apps/kol/public/seed/`, flagged in `decisions_made` as
placeholder **content** (not placeholder UI — the zero-placeholder rule governs interface, not fixture
media) and queued for swap when real footage lands.

### E. New dependencies — CTO decision

| Dependency | Unit | Status |
|---|---|---|
| `stripe` (server SDK) | B7a | **PRE-APPROVED** |
| `@stripe/stripe-js` + `@stripe/react-stripe-js` | B7b | **PRE-APPROVED** |
| anything else | any | **NOT approved — return BLOCKED** |

**Explicitly NOT approved: `framer-motion` / `motion`.** A Fable worker building B2/B3/B4/B5 will reach for
it by reflex. It is not needed and would fight the shipped renderer. P4 already implemented hero
persistence without any animation library:

- `apps/kol/src/lib/renderer/HeroStage.tsx` — the ONE shared element, imperative FLIP on `--ease-cinematic`,
  `view-transition-name` on `.kol-hero-stage` in `globals.css`, explicitly documented as *"ready for the
  cross-route shared-element morph when the feed (B1) arrives."*
- `apps/kol/src/lib/renderer/stages.ts` — `WORLD_STAGES = ["feed","grown","world-open","world-browse","narrate-shrink"]`,
  `isWorldUnfolded()`. The buyer state machine is already modelled.
- `apps/kol/src/lib/renderer/hero-persistence.ts` — `HeroPersistenceContext`, read by `FilmFrame` to
  suppress scroll-gated pausing inside the hero slot.
- `apps/kol/src/components/motion/Reveal.tsx` — the `--ease-kol` 70ms-stagger reveal.

B2–B5 **extend this machinery**. Any worker that adds an animation dependency is rewriting a QA-passed
invariant and must return BLOCKED instead.

---

## 3 · NEW MIGRATIONS REQUIRED: **ZERO** — stated early, because migrations are the long pole

I diffed all four Wave-3 commerce/catalog specs against the applied schema. Everything Wave 3 writes
already exists on staging:

| Wave-3 need | Applied artifact | Verified at |
|---|---|---|
| S8 product CRUD | `public.products` (`price_amount` integer minor units, `currency char(3)` default GBP, `inventory_status` enum, `inventory_qty`, `model3d_id`, `badges text[]`) + `products_owner_all` / `products_public_read_published` | `supabase/migrations/20260721000004_products.sql:45-112` |
| S8 media | `public.media` + `media_owner_all` / `media_public_read_published` | `20260721000003_media_videos.sql:53,112-124` |
| B6 cart | `public.carts` (+ `carts_one_active_per_buyer` partial unique index) + `carts_buyer_all` | `20260721000006_commerce.sql:69-80,244-247` |
| B7 order write | `public.create_order(uuid, jsonb)` SECURITY DEFINER, `search_path=''`, revoked from `public` and `anon`, granted to `authenticated` | `20260721000006_commerce.sql:120-188,231-236`; `20260721000014_grants_hardening.sql:50` |
| B7 order tables | `public.orders` (`subtotal_amount`, `currency`, `status order_status`, `stripe_payment_intent_id`, `commission_id`) + `public.order_items` (`unit_price_amount` snapshot) | `20260721000006_commerce.sql:83-113` |
| B7/B8 order read | `orders_buyer_read`, `order_items_buyer_read` — SELECT-only, no INSERT/UPDATE policy for buyers | `20260721000006_commerce.sql:252-268` |
| B6/B8 specs & provenance | `product_specs`, `product_provenance` + published-read policies | `20260721000004_products.sql:65-98,114-142` |

**`create_order` reads prices server-side already** — verified line by line at `20260721000006_commerce.sql:159-165`:
it selects `p.price_amount, p.currency from public.products p where p.id = v_pid and p.store_id = p_store_id`,
binds `v_buyer := auth.uid()`, inserts with `status 'pending'` hard-coded, rejects an unpublished store
(`:143`), a cross-store item (`:163`), `quantity <= 0` (`:155`), and mixed currencies (`:168`). A
client-supplied price is structurally unreachable — there is no price parameter.

**The only pending DDL in the system is MIG-CHECK**, already Founder-signed. Wave 3 adds none. If any
worker believes it needs a migration, it returns BLOCKED and the CTO re-scopes — a new migration is
Irreversible, database-engineer-first, and Founder-gated, and would cost the wave several days.

---

## 4 · Risk-tier classification

Standing precedent: **≥300 LOC changed → Full regardless of surface.**
`.claude/qa-tier-floor.yml` floors (first match wins): `**/api/webhooks/**` → **irreversible**;
`**/api/billing/**`, `**/api/payments/**` → irreversible; `**/supabase/migrations/**` → irreversible;
`**/api/**` → full. Auth surface → Full floor by Wave-1/Wave-2 precedent.

| Unit | Tier | Trigger |
|---|---|---|
| **W2-WIRE** | **Full** | Owns the anon-vs-user-vs-service client boundary for the whole engine. A wrong client here leaks unpublished seller clips into the public feed — a specifically-identified defect path, not a hypothetical. Small diff (~180 LOC with tests); the tier is set by surface, not size. |
| **SEED-W3** | **Full** | Service-role write against the live shared staging DB, creating the data every Wave-3 surface renders. Not Irreversible: creates no schema object, is idempotent and additive, reversible with a scoped delete on a `seed_` id prefix. |
| **B1a** | **Full** | Changes route classification in `apps/kol/src/lib/auth/routes.ts` + the middleware policy that consumes it (auth surface → Full floor), and integrates the engine's service-role `buyer_signals` read path. |
| **B1b** | **Full** | Est. 350–500 LOC feed surface. ≥300 precedent. Also owns the anti-grid layout invariant, a hard AC gate. |
| **B2 / B3 / B4 / B5** | **Lite** | Frontend transition + one engine read each; no DB write, no auth surface, each est. 150–280 LOC. Per-spec Technical Requirements. QA-Lead may upgrade any of them — in particular B3, which touches the P4 renderer's hardest invariant. |
| **S8** | **Full** | Writes `products` + `media` under RLS, seller role gate, and owns the price contract that B7 depends on. Est. 450–600 LOC. Both triggers fire. |
| **B6** | **Full** | Est. 350–450 LOC, and it owns `lib/cart/` — a DB write path against `carts`. ≥300 precedent + DB surface. |
| **B7a** | **IRREVERSIBLE** | `apps/kol/src/app/api/webhooks/stripe/route.ts` matches `**/api/webhooks/**` → tier-floor `irreversible`, reason "External webhook handlers — idempotency-critical". It is also a billing flow (CLAUDE.md §Risk-Tiered QA Gate: "billing flow" → Irreversible). **Requires Full pipeline + 2-of-3 multi-judge + Founder sign-off.** This is the highest-risk unit in the wave and it is classified accordingly. |
| **B7b** | **Full** | Payment UI in the checkout flow. Not Irreversible on its own — it holds no secret, writes no order, and calls B7a's server actions — but billing-adjacent surface holds it at Full minimum. |
| **B8** | **Lite** | Reads `orders` (RLS read-own) + one engine call; est. 200–260 LOC; no write. Consumes P7's thankyou-only invariant but does not implement it. |

QA-Lead may upgrade any of these. The CTO and CEO may not downgrade them, and **no one may downgrade B7a**.

---

## 5 · The two binding QA-Lead conditions, and how this packet satisfies them

### Condition 1 — W2-WIRE must land first, and must not drop

It is unit #1 of the wave and it gates six of the other twelve. It is not folded into B1 (the Wave-2
packet's fallback option) because folding it into a frontend unit would put the anon/service-client trust
boundary inside a screen brief, which is exactly how the defect path stays open. It gets its own worker,
its own branch, and its own QA gate before anything consumes it.

### Condition 2 — `createEligible` gets the ANON client, never the USER client

**Root cause, found in the shipped code:** `apps/kol/src/lib/supabase/` exports exactly three factories —
`server.ts createClient()` (cookie-bound RLS-scoped USER client), `client.ts createClient()` (browser),
and `admin.ts createAdminClient()` (service role). **There is no server-side anon-key factory.** A worker
wiring the engine on the server has only one non-admin option available, and it is the wrong one.

Wiring the user client means a signed-in seller's own unpublished clips satisfy `videos_owner_all` /
`video_profiles_owner_all`, enter the FEED candidate pool, and are then *guaranteed a slot* by the
newest-per-store reduction in `eligible.ts` — one clip per store, and theirs is the only one their store
has. A seller browsing the feed would see their own draft footage published to them as if live.

**W2-WIRE therefore ships the missing factory.** `apps/kol/src/lib/supabase/anon.ts` → `createAnonClient()`:
anon key, **no cookie adapter**, so `auth.uid()` is null and only `*_public_read_published` policies apply.
`createDefaultDeps` keeps the locked signature (it is the testable seam), and `index.ts` additionally
exports `createEngineDeps(cookies)` — constructing the anon client internally — which is the **only** entry
point app code may call. B1a's brief forbids assembling `EngineDeps` by hand.

### Condition 3 — one real-composition test, no cross-half mocks

Today's 68 engine tests are the union of two per-half suites, each mocking the other half. Nothing has ever
executed the real pipeline end to end. W2-WIRE owns two new suites, both importing the real modules:

- `engine/__tests__/composition.test.ts` — real `createEligible` + real `createRulesRanker` + real
  `createCookieKeyRing` + real `antiRepetition` + real `selectVideos`. The ONLY substitution permitted is
  the Supabase client at the outermost boundary. No `vi.mock` of any `lib/engine/*` module.
- `engine/__tests__/live-composition.test.ts` — the same pipeline against the live staging DB via
  `createEngineDeps`, seeded service-role and cleaned up.

---

## 6 · F3 — the unbounded FEED query, now on the critical path

`eligible.ts` (branch `feat/p6a-eligible-rank`) builds the FEED pool as:

```ts
const pool = await run(
  profiles()
    .contains("page_eligibility", ["feed"])
    .overlaps("purpose", ["intro", "craft-story", "atmosphere"]),
  ctx.state,
);
return newestPerStore(pool);
```

No `.order()`, no `.limit()`. Ordering happens in JS (`byNewestFirst`), and `newestPerStore` relies on that
JS sort for its correctness — it takes the first clip seen per store. At real data volume this fetches
every published store's profiles on every feed request, and Supabase's `db-max-rows` truncation would
silently drop rows *before* the sort, breaking the newest-per-store guarantee with no error.

**Decision (CTO):** bound the window server-side, keep the exact semantics inside it. Fold into W2-WIRE.

- Add `.order("created_at", { ascending: false })` on `video_profiles` and `.limit(FEED_CANDIDATE_CAP)`
  with `FEED_CANDIDATE_CAP = 300`, exported as a named const.
- Keep the existing JS `byNewestFirst` sort by `video.created_at` and `newestPerStore` reduction **inside**
  that window, so the reduction's semantics are unchanged.
- The semantic shift is explicit and must be documented in the module comment: the guarantee becomes
  "one newest eligible clip per store, among the 300 most recently *tagged* clips." For a magazine feed
  that biases toward freshness, which is the desired behaviour, and it is bounded rather than silently
  truncated.
- Apply the same `.limit()` to the store-scoped states (cap 100) — a single store's clip count is naturally
  small, but an unbounded query is a defect regardless of current data.

**Rejected alternative:** a `distinct on (store_id)` Postgres view with `security_invoker = true` would
preserve exact semantics at any volume. It is the right long-term answer and it is **a migration** —
Irreversible, database-engineer-first, Founder sign-off, days of latency on a wave that otherwise needs
none. Queued as **F3-VIEW**, a Wave-4 or post-MVP item, to be built when real store count justifies it.

---

## 7 · Contract conflicts a Wave-3 worker will hit

| # | Conflict | Reaches Wave 3? | Disposition |
|---|---|---|---|
| 1 | **`criticScore` null vs number.** `KOL-ai-pipeline-spec.md` §5.4 emits `meta.criticScore: null` at draft; `apps/kol/src/lib/store-config/schema.ts:450` declares `z.number().min(0).max(1)`, non-nullable. | **NO — confirmed.** The conflict only fires when an *AI-generated* draft config is validated, and the only producer is S3 (Wave 4a). Every Wave-3 config is hand-authored by SEED-W3, which sets a numeric `criticScore`. B3/B4 read `stores.config` but never author one. | Still due **before S3**. SEED-W3's brief mandates a numeric `criticScore` and `status: "published"` so no Wave-3 renderer trips it. Do not let a Wave-3 worker "fix" the schema. |
| 2 | **`/feed` is auth-gated, but B1 must serve anonymous buyers.** `apps/kol/src/app/feed/page.tsx` redirects to `/sign-in` when there is no user, and `classifyRoute` (`lib/auth/routes.ts:20,34-39`) treats `BUYER_LANDING = "/feed"` as protected. But the engine takes `buyerId: string \| null` with "null = anonymous → Relationship term is 0", and the discovery-feed spec §Technical states the anon key is sufficient because RLS `video_profiles_public_read_published` is live. | **YES — day one of B1a.** | **CTO decision: `/feed` becomes anon-accessible.** The front door of a marketplace cannot demand sign-up; the engine and the B1 spec both design for cold-start. `/account` and `/seller` stay protected, `BUYER_LANDING` stays `/feed`, and `parseSameOriginPath` must not be weakened. B1a owns this change, which is why B1a is Full tier and split from B1b. |
| 3 | **`create_order` has no idempotency guard.** Calling it twice creates two `pending` orders; `orders.stripe_payment_intent_id` has no unique index. | **YES — B7a**, and the "no double-charge" AC depends on it. | Resolved app-side, no migration: `create_order` is called **exactly once per checkout attempt**, at PaymentIntent creation. The returned order id is both the Stripe `idempotencyKey` and the linkage stored in `stripe_payment_intent_id`. A retry after decline re-confirms the **same** PaymentIntent against the **same** pending order. The webhook's `paid` transition is guarded by `... where id = $1 and status = 'pending'` — a second delivery updates zero rows and is a no-op. Spec OQ-1 (webhook idempotency strategy, owner CTO, due pre-build) is hereby answered. |
| 4 | **`orders` has no buyer UPDATE policy** (`20260721000006_commerce.sql:250-251` — SELECT-only by design). Stamping `stripe_payment_intent_id` onto the order is a write the buyer cannot perform. | **YES — B7a.** | The stamp happens server-side via `createAdminClient()` in the same server action that creates the PaymentIntent, never from the client. This is correct, not a workaround: the service role is the documented escape hatch for privileged commerce flows (§B0). |
| 5 | **No store, video, `video_profiles`, or product rows exist on staging.** SEED (Wave 2) seeded the `blocks` catalog only — the platform's static type/variant table, not content. There is no store-creation UI until S1 (Wave 4a). | **YES — B1 through B8 have nothing to render.** | **SEED-W3** is a new unit in this packet, in T0, and it is the real long pole of the wave — not a migration. |
| 6 | **`create_order` has no inventory check (known-deferred N3).** A `sold-out` product can be ordered. | **YES, cosmetically.** | Stays deferred, per checkout spec §Out of Scope and product-management spec OQ-2. S8 stores and B6 displays inventory truth; add-to-cart is disabled when unavailable. **Do NOT add the check** — it is a new migration = Irreversible. Cite it, don't build it. Answering S8 OQ-2: display-only inventory is accepted for MVP. |
| 7 | **F3 unbounded FEED query.** | **YES — before B1 serves traffic.** | Folded into W2-WIRE. See §6. |
| 8 | **Multi-store cart.** `create_order(p_store_id, p_items)` is per-store and rejects cross-store items (`:163`). | **YES — B6 cart design.** | **CTO decision: the cart is store-scoped for MVP.** One active cart per buyer (`carts_one_active_per_buyer`), all items from one store; adding an item from a different store prompts to start a new cart. Checkout spec OQ-2 (owner CPO + CTO, due pre-build) is hereby answered. |

---

## 8 · The Design-Lead seam — flag, do not invent

Design-Lead is running B1–B5 visual direction **in parallel with this packet**. The following decisions are
theirs, not a worker's. Each brief names its own seam and tells the worker what to do if the direction has
not landed: use the spec-stated default, record the assumption in `decisions_made`, and never invent a new
design primitive.

| Seam | Owner | What Wave 3 needs |
|---|---|---|
| **B1 magazine composition** — card span pattern, size ratios, per-viewport card count, and the exact feed limit inside the spec's 12–24 range | Design-Lead | B1 spec OQ-2 marks this "due pre-build". B1b defaults to limit 18 and a 3-size span pattern if unresolved. |
| **B1 anti-grid assertion threshold** — what "not a uniform grid" means as a machine check | Design-Lead + CTO | The layout test must encode Design-Lead's composition rule. Default assertion in B1b's brief: ≥3 distinct rendered card widths and no single repeating cell size across the viewport. |
| **B2 grow choreography** — the FLIP path from feed card to `center-column`, duration beyond `--ease-kol` | Design-Lead | B2 defaults to the existing `--ease-cinematic` FLIP already used by `HeroStage`'s dock transition. |
| **B3 unfold envelope** — block reveal order, and whether `liquid`/`dimensional` motion presets drive the unfold itself or only per-block reveal | Design-Lead | B3 defaults to the shipped `Reveal.tsx` 70ms media-leads-text stagger. |
| **B5 corner-dock placement** — which corner, safe-area insets, and the CTA-collision rule | Design-Lead | Size is spec-locked (`320×180`, `--radius-md`, `--shadow-raised`) and `HeroStage`'s `kol-hero-docked` class already implements the dock. Placement is Design-Lead's. |

Workers use existing tokens and components from `apps/kol/src/components/ui`, `components/media`,
`components/states`, `components/motion`, and the theme layer. No new design primitives.

---

## 9 · §B0 — global contract rules (verbatim in every DB-backed brief)

> - **RLS is the ONLY boundary.** Any authed user hits PostgREST directly with their JWT. No restriction may be "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set `buyer_id`, client-set `role`, or client-set order `status`.
> - **10 SECURITY DEFINER fns:** `create_order`, `cancel_order`, `set_order_status`, `get_public_profile`, `handle_new_user`, `guard_profile_role`, `enforce_review_seller_scope`, `enforce_real_maker_badge`, `guard_thread`, `guard_commission`. All `SET search_path=''`, schema-qualified. Writes `REVOKE EXECUTE FROM public` + `GRANT EXECUTE TO authenticated`; `get_public_profile` also `GRANT ... TO anon`.
> - **6 triggers:** `on_auth_user_created`→`handle_new_user`; `profiles_role_guard`→`guard_profile_role`; `reviews_seller_scope_guard`→`enforce_review_seller_scope`; `badges_real_maker_guard`→`enforce_real_maker_badge`; `threads_guard`→`guard_thread`; `commissions_guard`→`guard_commission`.
> - **Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`** (anon is also null uid; N1). Privileged flows on service key: `orders.status='paid'` (Stripe webhook), verification resolution, role→`seller`, `buyer_signals` inserts (engine).
> - **Money = integer minor units + `char(3) currency` (default GBP).** No floats.
> - **camelCase (store-config) ↔ snake_case (tables)** are the same fields at the sync boundary; engine and commerce query snake_case tables.
> - **Video config↔table sync (OQ-2):** `videos`/`video_profiles` are the CANONICAL queryable source. `stores.config.media.clips[].id` MUST equal a `videos.id` owned by the same store — enforced by the P3 Zod validator at write time (DB can't enforce ids in jsonb). Config persist + `videos`/`video_profiles` upsert in ONE transaction.
> - Supabase default privileges grant **no implicit `anon` EXECUTE** — an anon-callable RPC needs its own explicit `grant execute ... to anon` (the `get_public_profile` pattern). `revoke ... from public` does **not** cover the anon pre-grant.
> - **Do not weaken `parseSameOriginPath`** (`apps/kol/src/lib/auth/routes.ts`). It re-validates its own output and closes two open-redirect vectors QA caught: control-char `/%09//` and dot-segment `/..//`.

---

## 10 · Frozen tag vocabulary (P7 wrote it, Wave 3 reads it — single source of truth)

```ts
export const PURPOSE = ["intro","craft-story","process","product-narration","thankyou","atmosphere"] as const;
export const PAGE_ELIGIBILITY = ["feed","grown","world","product","checkout","thankyou"] as const;
export const MOOD = ["calm","warm","energetic","intimate"] as const;
```

- Lowercase kebab-case, stored exactly as written. No casing normalisation on read.
- `anti_repetition_key`: nullable; when present a lowercase kebab slug `/^[a-z0-9]+(-[a-z0-9]+)*$/`, max 64 chars.
- `product_links`: `uuid[]`, app-validated only — no element-level FK. A dangling id yields zero rows and the documented fallback runs. The engine never errors on a dangling link.
- **Thankyou-only invariant:** if `purpose` contains `"thankyou"` OR `page_eligibility` contains `"thankyou"`, then `purpose` MUST equal exactly `["thankyou"]` AND `page_eligibility` MUST equal exactly `["thankyou"]`. Enforced by P7's Zod at write time and by MIG-CHECK at the DB. This is what makes B1's feed exclusion and B8's thankyou-only eligibility **structural** rather than a blocklist.
- Untagged = **invisible**. Empty arrays match no eligibility query.

---

## 11 · Dispatch order — the numbered plan the CEO executes

0. **Verify the Wave-2 merge** (§0). Then **commit this packet to `main`** — workers branch from `main` and
   several briefs reference this file by path.
1. **Apply MIG-CHECK to staging** (Founder-signed, apply pending). Blocks SEED-W3 only.
2. **T0 — dispatch two Task calls in ONE message:** **W2-WIRE** (`backend-engineer`) · **SEED-W3**
   (`database-engineer`). In the same turn, ask Adam for `ENGINE_COOKIE_SECRET` (§2A), the `store-media`
   bucket (§2C), and the seed footage decision (§2D).
3. **QA-Lead gate #1** over `feat/w2-wire-engine` + `feat/seed-w3-worlds`. Tier Full on both. Focus:
   `apps/kol/src/lib/supabase/anon.ts`, `apps/kol/src/lib/engine/index.ts`, `eligible.ts`'s bounded query,
   and the composition tests. **Merge to `main` on PASS** — six downstream units need `createEngineDeps`
   and the seed data on `main`.
4. **T1 — dispatch six Task calls in ONE message:** **B1a** (`backend-engineer`) · **B2** · **B3** · **B4** ·
   **B5** · **S8** (`frontend-engineer` ×5). Fully parallel; no shared files.
5. **T1.5 — dispatch one Task call: B1b** (`frontend-engineer`), after B1a's branch is verified. B1b imports
   B1a's `lib/feed/` data layer, so it branches from `main` and cherry-picks or rebases onto B1a — the CEO
   passes B1a's branch name in B1b's brief.
6. **QA-Lead gate #2** over B1a, B1b, B2, B3, B4, B5, S8. Tiers: Full on B1a/B1b/S8, Lite on B2–B5.
   Focus: `lib/auth/routes.ts` + middleware policy (B1a), the anti-grid layout test (B1b), hero-element
   identity across GROWN→WORLD_OPEN→NARRATE_SHRINK (B2/B3/B5), the price contract (S8). Ask Adam for the
   Stripe test keys (§2B) in this same turn so they are present before T3.
7. **T2 — dispatch B6** (`frontend-engineer`), after S8 and B5 merge. B6 owns `lib/cart/`.
8. **T3 — dispatch B7a** (`backend-engineer`), after B6 merges. **Irreversible.**
9. **T3.5 — dispatch B7b** (`frontend-engineer`), after B7a's branch is verified.
10. **T4 — dispatch B8** (`frontend-engineer`), after B7a's branch is verified (B8 needs the order-read
    shape, not the UI).
11. **QA-Lead gate #3** over B6, B7a, B7b, B8. **B7a carries the Irreversible pipeline: Full reviewers +
    security-engineer + adversary-engineer + Codex second opinion + 2-of-3 multi-judge + FOUNDER SIGN-OFF.**
    Then Playwright E2E over the full spine: FEED → GROWN → WORLD_OPEN → WORLD_BROWSE → NARRATE_SHRINK →
    PRODUCT_PAGE → CHECKOUT → THANK_YOU.

**Parallel vs serial at a glance:** T0 = 2-way parallel · T1 = 6-way parallel · B1a→B1b and
S8→B6→B7a→B7b are serial edges · B8 hangs off B7a · three QA gates, two merges before the tail.

**Every serial edge, explicitly:**
`Wave-2 merge → {W2-WIRE, SEED-W3}` · `MIG-CHECK apply → SEED-W3` · `W2-WIRE → {B1a, B2, B3, B4, B5, B8}` ·
`SEED-W3 → {B1a, B2, B3, B4, B5, S8}` · `B1a → B1b` · `S8 → B6` · `B5 → B6` · `B6 → B7a` · `B7a → B7b` ·
`B7a → B8`.

---

## 12 · The thirteen briefs

The paste-ready briefs follow. Each carries: the Wave-2-merge precondition, worktree protocol, live-DB
access rule, §B0 verbatim where DB-backed, Fable 5, exact skills, exact success criteria, and the
structured-JSON return contract.

---

# BRIEF 1 — W2-WIRE · Engine composition root, anon-client boundary, bounded FEED query

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-w2-wire
isolation: worktree
---
You are the backend-engineer for KOL Wave 3, unit W2-WIRE — the video engine's composition root.
Risk tier: FULL. Model: Fable 5 (claude-fable-5). ONE unit.

This unit gates SIX other workers. It is small in lines and large in consequence.

## HARD PRECONDITION — verify before you touch anything
Wave 2 must already be merged to `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/eligible.ts | head -1
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/select-videos.ts | head -1
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/cookie-ring.ts | head -1
If ANY of those errors, STOP and return BLOCKED with blocker "Wave 2 not merged to main".

## Goal
Compose P6a's stages 1-2 with P6b's stage 3 into one callable engine, close the anon-client defect path,
prove the real pipeline end to end with no cross-half mocks, and bound the FEED query.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/w2-wire-engine -b feat/w2-wire-engine main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/w2-wire-engine/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase project ref olwtcjzmohdhawdzlzqs.

## Read ONLY these
1. apps/kol/src/lib/engine/ (on main, post-merge) — eligible.ts, rank.ts, anti-repetition.ts,
   cookie-ring.ts, select-videos.ts, types.ts. These are your inputs; you change ONE of them (eligible.ts).
2. apps/kol/src/lib/supabase/ — server.ts, client.ts, admin.ts, env.ts, env.server.ts. The existing client
   layer. You ADD one factory; you do not refactor the others.
3. docs/03-system-design/KOL-video-engine-spec.md §1 (pipeline) and §5.4 (the buyer_signals trust boundary).
4. docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md §5 and §6 — your binding contract.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also null uid).
- Video config↔table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
Tables you READ: `videos`, `video_profiles` (anon-readable for PUBLISHED stores),
`buyer_signals` (RLS-PRIVATE — service role only, server-side only).
You WRITE nothing. No migration, no RPC, no policy, no new column.

## THE DEFECT YOU EXIST TO CLOSE — read this twice
`apps/kol/src/lib/supabase/` currently exports exactly three factories:
  server.ts  createClient()      -> cookie-bound, RLS-scoped USER client
  client.ts  createClient()      -> browser client
  admin.ts   createAdminClient() -> service role
There is NO server-side ANON factory. A developer wiring the engine on the server has only one non-admin
option available and it is the WRONG one.

If `createEligible` receives the USER client, a signed-in seller's OWN UNPUBLISHED clips satisfy
`videos_owner_all` / `video_profiles_owner_all`, enter the FEED candidate pool, and are then GUARANTEED a
slot by `newestPerStore()` — one clip per store, and theirs is the only one their store has. The seller
sees their own draft footage in the public feed as if it were live. This is a known, specifically
identified defect path. Your job is to make it structurally impossible.

## Build order — commit in EXACTLY this order
STEP 1 (commit `feat(supabase): server-side anon client factory`):
  - apps/kol/src/lib/supabase/anon.ts — export function createAnonClient(): SupabaseClient<Database>.
    Uses getSupabaseUrl() + getSupabaseAnonKey() from ./env. NO cookie adapter, NO session, NO auth
    persistence — so `auth.uid()` is null on every query and ONLY the `*_public_read_published` policies
    apply. Module comment must state, in plain words, why this file exists and what leaks without it.
  - apps/kol/src/lib/supabase/__tests__/anon.test.ts — assert the factory is constructed with the ANON key
    and never the service-role key, and that it carries no cookie/session adapter.

STEP 2 (commit `feat(engine): composition root`):
  - apps/kol/src/lib/engine/index.ts. Export BOTH:
      export function createDefaultDeps(opts: {
        db: SupabaseClient<Database>;          // ANON client — public read only
        serviceDb: SupabaseClient<Database>;   // service role — buyer_signals ONLY
        secret: string;                        // ENGINE_COOKIE_SECRET
        cookies: { read: () => string | undefined; write: (value: string) => void };
      }): EngineDeps
      composing createEligible(db) + createRulesRanker({ serviceDb }) + createCookieKeyRing({ secret, ...cookies }).
      This is the LOCKED signature QA-Lead named. Do not change it — it is the testable seam.
      Its doc comment must say, verbatim in substance: "`db` MUST be the anon client (createAnonClient).
      Passing the cookie-bound user client leaks a signed-in seller's own unpublished clips into the
      public feed."
      export function createEngineDeps(cookies: {...}): EngineDeps
      — constructs the anon client via createAnonClient() and the service client via createAdminClient()
      INTERNALLY, reads ENGINE_COOKIE_SECRET from the server env, and is the ONLY entry point application
      code is permitted to call. `import "server-only"` at the top of index.ts.
      If ENGINE_COOKIE_SECRET is missing, throw a clear typed error at call time — NEVER default it,
      NEVER fall back to an insecure value, NEVER read it at module scope.
  - Also re-export `selectVideos` and the public types from index.ts so callers have one import site.

STEP 3 (commit `fix(engine): bound the FEED candidate window`) — follow-up F3, on the critical path:
  - apps/kol/src/lib/engine/eligible.ts. The FEED query today has NO `.order()` and NO `.limit()`: it
    fetches every published store's profiles and sorts in JS. At volume that is unbounded transfer, and
    Supabase `db-max-rows` truncation would drop rows BEFORE the JS sort — silently breaking the
    newest-per-store guarantee with no error.
    Add `.order("created_at", { ascending: false })` on video_profiles and `.limit(FEED_CANDIDATE_CAP)`,
    `export const FEED_CANDIDATE_CAP = 300`. Apply `.limit(SCOPED_CANDIDATE_CAP)` = 100 to the
    store-scoped and product-scoped queries too.
    KEEP the existing byNewestFirst JS sort (by video.created_at) and newestPerStore reduction INSIDE
    that window — their semantics must not change.
    Update the module comment to state the new guarantee explicitly: "one newest eligible clip per store,
    among the 300 most recently tagged clips." Do NOT change the POSITIVE feed predicate. Do NOT introduce
    a blocklist. Do NOT create a view or a migration — if you think you need one, return BLOCKED.
  - Extend apps/kol/src/lib/engine/__tests__/eligible.test.ts: assert the FEED builder receives both an
    order and a limit, and that the newest-per-store reduction still holds within a capped window.

STEP 4 (commit `test(engine): real-composition suite, no cross-half mocks`):
  - apps/kol/src/lib/engine/__tests__/composition.test.ts.
    Today's 68 engine tests are the union of two per-half suites, each MOCKING the other half. The real
    pipeline has never executed. This suite fixes that.
    Import the REAL createEligible, REAL createRulesRanker, REAL createCookieKeyRing, REAL antiRepetition,
    REAL selectVideos. The ONLY substitution permitted is the Supabase client at the outermost boundary
    (a hand-written fake exposing from/select/contains/overlaps/eq/order/limit and a thenable result).
    NO `vi.mock` of any module under lib/engine/. QA-Lead will grep for `vi.mock` in this file and BLOCK
    if it finds one pointing at lib/engine.
    Mandatory named tests (QA-Lead greps for these exact strings):
      "real pipeline: FEED selection never contains a thankyou clip"
      "real pipeline: selection is a subset of the eligible set"
      "real pipeline: the ring suppresses a visit-1 clip on visit 2"
      "real pipeline: same sessionId yields the same order, a new sessionId reshuffles"
STEP 5 (commit `test(engine): live end-to-end composition against staging`):
  - apps/kol/src/lib/engine/__tests__/live-composition.test.ts — the same pipeline via createEngineDeps
    against the LIVE staging DB. Service-role seeds a PUBLISHED store with one ['feed'] clip and one
    ['thankyou'] clip, runs the real selection, asserts the feed clip is returned and the thankyou clip
    never is, then cleans up EVERY row it created. Follow the precedent at
    apps/kol/src/lib/account/__tests__/live-account-boundary.test.ts.
  - MANDATORY named test: "anon client cannot see an unpublished store's clips" — service-role seeds an
    UNPUBLISHED store with a ['feed']-tagged clip, runs the real FEED selection through createEngineDeps,
    and asserts that clip NEVER appears. This is the regression test for the defect above.
  - If ENGINE_COOKIE_SECRET is absent from apps/kol/.env.local, this suite must inject a literal test
    secret rather than skip. Do NOT hardcode a secret anywhere outside a test file.

## Constraints
- TypeScript strict. No new dependency (return BLOCKED if you think you need one). No migration, no RPC,
  no schema change, no new column, no Postgres view.
- Do NOT refactor server.ts / client.ts / admin.ts. You ADD anon.ts; you do not touch the others.
- Do NOT change any file under lib/engine/ except eligible.ts, its test, and the new index.ts + new tests.
- No `Math.random` anywhere. Zero TODOs.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint` from apps/kol. All 68 existing
  engine tests must still pass.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nodejs-backend-patterns · testing-patterns · supabase-rls-conventions

## Turn budget
~19-tool-use cap. If you approach it, COMMIT what is done and return PARTIAL with a precise resume_point
naming the exact STEP. STEP 1 and STEP 2 are the ones six other workers are blocked on — never leave them
unlanded. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
State in `summary` whether ENGINE_COOKIE_SECRET was present.
Session file: docs/08-agents_work/sessions/2026-07-21-backend-engineer-w2-wire.md (≤10 lines).
```

---

# BRIEF 2 — SEED-W3 · Four seed maker worlds

```
subagent_type: database-engineer
model: fable            # Fable 5 — claude-fable-5
name: database-engineer-seed-w3-worlds
isolation: worktree
---
You are the database-engineer for KOL Wave 3, unit SEED-W3 — the seed content every buyer surface renders.
Risk tier: FULL (service-role write against the LIVE shared staging DB). NOT Irreversible: creates no
schema object, is idempotent and additive, and is fully reversible with a scoped delete.
Model: Fable 5 (claude-fable-5). ONE unit.

## HARD PRECONDITIONS — verify both before you touch anything
1. Wave 2 must be merged to `main`:
   git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/tagging/schemas.ts | head -1
   If it errors, STOP and return BLOCKED with "Wave 2 not merged to main".
2. MIG-CHECK must be APPLIED to staging. It adds 5 CHECK constraints on `video_profiles` (enum vocabulary,
   thankyou-exclusive, anti_repetition_key format + 64-char cap). Verify the constraints exist before you
   insert a single profile row — seeding first and applying second risks rows that fail the apply.
   If they are absent, STOP and return BLOCKED with "MIG-CHECK not applied".

## Goal
Wave 2 seeded `blocks` — the platform's static catalog of block TYPES and VARIANTS. That is not content.
There is no store, no video, no video_profile, and no product on staging, and no store-creation UI exists
until S1 in Wave 4. Every one of B1-B8 therefore has NOTHING to render. You are the fix.

Seed 4 published maker worlds: profiles (seller role), stores with schema-valid v1.3 configs, videos,
tagged video_profiles, and products with real prices.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/seed-w3-worlds -b feat/seed-w3-worlds main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/seed-w3-worlds
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase project ref olwtcjzmohdhawdzlzqs.
Use SUPABASE_SERVICE_ROLE_KEY. Sellers cannot self-create these rows yet, so service-role is the only path.
Do NOT add a write policy to make it easier.

## Read ONLY these
1. apps/kol/src/lib/store-config/schema.ts — the SHIPPED v1.3 Zod contract. THE source of truth for every
   config you author. Your configs MUST pass `StoreConfigSchema.parse()`.
2. docs/03-system-design/store-config.schema.md v1.3 — the prose contract for the same shape.
3. supabase/migrations/20260721000002_stores.sql, ...0003_media_videos.sql, ...0004_products.sql — the
   applied tables, their RLS, and their columns.
4. apps/kol/src/lib/supabase/database.types.ts — the real Insert types.
5. supabase/seed/001_blocks_catalog.sql — the Wave-2 seed. Match its idiom, header-comment style, and
   idempotence pattern exactly.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
- Money = integer MINOR units + char(3) currency (default GBP). No floats.
- camelCase (store-config) <-> snake_case (tables) are the same fields at the sync boundary.
- Video config<->table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
  `stores.config.media.clips[].id` MUST equal a `videos.id` owned by the SAME store. This is the invariant
  your seed most easily breaks — get it right and prove it.
Tables you WRITE: `profiles`, `stores`, `videos`, `video_profiles`, `media`, `products`, `product_specs`.
You add no policy, no RPC, no column, no index, no migration.

## Frozen tag vocabulary — the contract the engine reads. Do not invent values.
export const PURPOSE = ["intro","craft-story","process","product-narration","thankyou","atmosphere"] as const;
export const PAGE_ELIGIBILITY = ["feed","grown","world","product","checkout","thankyou"] as const;
export const MOOD = ["calm","warm","energetic","intimate"] as const;
- Lowercase kebab-case, stored exactly as written.
- anti_repetition_key: lowercase kebab slug /^[a-z0-9]+(-[a-z0-9]+)*$/, max 64 chars (e.g. `sena-wheel`).
- THANKYOU-ONLY INVARIANT: if `purpose` contains "thankyou" OR `page_eligibility` contains "thankyou",
  then `purpose` MUST equal exactly ["thankyou"] AND `page_eligibility` MUST equal exactly ["thankyou"].
  MIG-CHECK enforces this at the DB — a violating insert will be REJECTED, not silently accepted.

## What to build
1. supabase/seed/002_w3_seed_worlds.sql — IDEMPOTENT. Every id is a DETERMINISTIC, hardcoded uuid so
   re-running is a no-op (`on conflict (id) do update`). Header comment states: purpose, service-role-only,
   idempotent, and the EXACT rollback statement.
2. FOUR published maker worlds. Each one gets:
   - a `profiles` row with `role = 'seller'` (role is trigger-guarded — if `guard_profile_role` blocks a
     direct role write, set it via the service role and document exactly how in decisions_made);
   - a `stores` row with `published = true` and a `config` jsonb that PASSES StoreConfigSchema.parse();
   - 5 `videos` + 5 `video_profiles`, tagged so the world exercises the whole state machine:
       intro        -> page_eligibility ['feed','grown','world'], purpose ['intro']
       craft-story  -> ['grown','world'],                          ['craft-story']
       process      -> ['world'],                                  ['process']
       product-narration -> ['product'], ['product-narration'], product_links = [that world's product id]
       thankyou     -> ['thankyou'],                               ['thankyou']   (ONLY these, nothing else)
   - 2-3 `products` with integer minor-unit prices and currency 'GBP', varied `inventory_status`
     (include at least one 'sold-out' so B6 can prove disabled add-to-cart);
   - a `product_specs` row per product with all 11 fields populated (P14's standard; B6 renders it).
3. CONFIG AUTHORING RULES — these are where a seed most often goes wrong:
   - `schemaVersion: "1.3"`, `meta.status: "published"`, and `meta.criticScore` a NUMBER in [0,1]
     (use 0.9). It is `z.number().min(0).max(1)` and NON-nullable. Do NOT write null — a null here is the
     known `criticScore` contract conflict, and it must not reach Wave 3.
   - EXACTLY ONE `hero-video` block per store (P3 invariant).
   - Every `media.clips[].id` MUST equal a real `videos.id` owned by that same store (OQ-2).
   - Every `product_links` uuid must be a real `products.id` in that same store.
   - Vary the worlds deliberately: at least one `theme.kind: "curated"` and at least one
     `theme.kind: "custom"`, different palettes, pairings, motion presets, block orders and block counts.
     D15 "no flattening" is an acceptance criterion of B3 — if all four worlds look alike, B3 cannot pass.
   - Respect the block-ground AA constraint: `craft-story` and `contact-cta` accept only dark grounds that
     clear AA body 4.5:1; the midtone `--block-c` grounds are display-only there. The shipped Zod
     (`bodyBlockGroundSchema` vs `displayBlockGroundSchema`) already encodes this — let it validate you.
4. VIDEO SOURCES. Check with the CEO whether Adam supplied real clip URLs.
   - If supplied: use them.
   - If not: commit public-domain placeholder clips under apps/kol/public/seed/ and point `videos.src` at
     them. Record this in decisions_made as placeholder CONTENT queued for swap when real footage lands —
     it is not placeholder UI, and the buyer journey must be demonstrable end to end either way.
   - Every video needs a real `poster` and a real `duration_ms`. B1's loading state renders the poster
     before the film resolves; a null poster makes that state untestable.
5. scripts/seed-w3-worlds.sh — applies the seed using the service role / DB password from
   apps/kol/.env.local. It must NEVER print the credential. Match the idiom of the existing script in
   /scripts from the Wave-2 blocks seed.
6. APPLY IT to live staging, then VERIFY with read-back queries and REPORT THE OBSERVED NUMBERS:
   - 4 stores with published = true;
   - 20 videos and 20 video_profiles;
   - the FEED predicate (`page_eligibility @> '{feed}'` AND `purpose && '{intro,craft-story,atmosphere}'`)
     returns exactly 4 rows, one per store;
   - the same predicate returns ZERO thankyou clips;
   - every store's config passes StoreConfigSchema.parse() — run it, do not assume it;
   - the ANON key CAN read all four stores' videos/video_profiles/products, and CANNOT write to any of them;
   - re-running the seed changes nothing (prove idempotence, do not assume it).
   Do not report a number you did not observe.

## Constraints
- NEVER drop a column, table, or policy. INSERT/upsert only.
- No new migration file. Put the seed in supabase/seed/, NOT supabase/migrations/ — migrations are
  create-only and already applied; adding a file there corrupts the applied-migration ledger.
- No new dependency. No RLS policy change.
- Do NOT seed `categories` / `product_categories` — no locked taxonomy exists and B11's scope is deferred.
- Do NOT seed orders, carts, reviews, or badges. Those are written by their own features.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- If anything you touched under apps/kol affects them, `pnpm typecheck`, `pnpm test`, `pnpm lint` must be green.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
postgresql · supabase-rls-conventions · database-design

## Turn budget
~19-tool-use cap, and four worlds is a lot of authoring. Build world 1 END TO END and commit it, then
worlds 2-4. If you approach the cap, return PARTIAL with resume_point naming the next unseeded world.
ONE fully correct world beats four broken ones. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Put the OBSERVED counts, the config-validation result, and the idempotence result in `summary`.
Session file: docs/08-agents_work/sessions/2026-07-21-database-engineer-seed-w3-worlds.md (≤10 lines).
```

---

# BRIEF 3 — B1a · Discovery-feed data layer + public-route enablement

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-b1a-feed-data
isolation: worktree
---
You are the backend-engineer for KOL Wave 3, unit B1a — the server half of the discovery feed.
Risk tier: FULL (changes route classification in lib/auth/routes.ts and the middleware policy that
consumes it — auth surface sets the floor regardless of diff size). Model: Fable 5. ONE unit.

B1 is split into B1a (you: data layer + route policy) and B1b (a Fable design worker: magazine layout).
B1b imports what you export. Ship the seam clean and do not build any layout.

## HARD PRECONDITIONS
Wave 2 merged AND W2-WIRE merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
  git -C /Users/adamks/VibeCoding/etsyc show main:supabase/seed/002_w3_seed_worlds.sql | head -1
If either errors, STOP and return BLOCKED naming which one.

## Goal
Serve the FEED state to ANY visitor — signed in or not — through the real engine, and open `/feed` to
anonymous buyers without weakening any auth boundary.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b1a-feed-data -b feat/b1a-feed-data main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b1a-feed-data/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/discovery-feed.md — your spec. Sections: Acceptance Criteria, Technical Requirements.
2. apps/kol/src/lib/engine/index.ts (post-W2-WIRE) — `createEngineDeps`. Your ONLY engine entry point.
3. apps/kol/src/lib/auth/routes.ts + routes.test.ts + apps/kol/src/lib/supabase/middleware.ts — the P1
   route policy you are changing. Read all three before you change one line.
4. apps/kol/src/app/feed/page.tsx — the current authed placeholder you are replacing.
5. docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md §7 conflict 2 — the CTO decision you
   are implementing.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also null uid).
- Video config<->table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
Tables you READ (all via the engine, never directly): `videos`, `video_profiles`, `buyer_signals`
(service-role, engine-internal). You WRITE nothing. No migration, no RPC, no policy.

## HARD PROHIBITIONS
- Do NOT weaken `parseSameOriginPath` in lib/auth/routes.ts. It re-validates its own OUTPUT and closes two
  open-redirect vectors QA caught: control-char `/%09//` and dot-segment `/..//`. Every change you make in
  that file must ADD a constraint or reclassify a route — never relax a validation.
- Do NOT assemble `EngineDeps` by hand. Call `createEngineDeps` and nothing else. Passing the cookie-bound
  user client to `createEligible` leaks a signed-in seller's own unpublished clips into the public feed.
- Do NOT read `buyer_signals` anywhere outside the engine. It never reaches the browser.
- `/account` and `/seller` stay protected. Only `/feed` changes.

## Build order — commit in EXACTLY this order
STEP 1 (commit `feat(auth): open the discovery feed to anonymous visitors`):
  - lib/auth/routes.ts — reclassify `/feed` from a protected buyer route to a PUBLIC route. `BUYER_LANDING`
    stays `/feed` (a signed-in buyer still lands there). Keep `/account` and `/seller` protected and keep
    `/sign-in`'s signed-in redirect behaviour unchanged.
  - lib/supabase/middleware.ts — the policy consuming the classification. An anonymous request to `/feed`
    must pass through with 200, no redirect, and the auth-cookie refresh path must still run.
  - Extend lib/auth/routes.test.ts (do not rewrite it — EVERY existing test must still pass) with: anon
    `/feed` is public; anon `/account` still redirects to `/sign-in?next=/account`; anon `/seller` still
    redirects; a buyer signing in with no `next` still lands on `/feed`; `?next=/feed` still round-trips.
  - Rationale comment on the reclassification: the marketplace front door cannot demand sign-up, and the
    engine is designed for `buyerId: null` cold-start (Relationship term = 0).
STEP 2 (commit `feat(feed): engine-backed FEED selection`):
  - apps/kol/src/lib/feed/select.ts — `import "server-only"`. Export
      export async function getFeedSelection(opts: { buyerId: string | null; sessionId: string; limit?: number }): Promise<FeedResult>
    It builds the EngineContext ({ state: "FEED", storeScope: null, productId: null, moodHint: null,
    buyerId, sessionId, limit }), calls `createEngineDeps` + `selectVideos`, and returns a
    view-model — NOT raw engine types. B1b renders `FeedResult`, so define and export it here:
      export type FeedCard = { videoId; storeId; storeSlugOrId; makerName; src; poster; durationMs; captionsSrc; aspect }
      export type FeedResult = { status: "success"|"empty"|"error"; cards: FeedCard[] }
    Resolve maker name / store identity with ONE additional anon-client read joined on the returned
    store ids — do not make the engine do it and do not N+1.
    `limit` default 18 (inside the spec's 12-24 band). Export it as a named const so B1b and Design-Lead
    can move it in one place.
  - Session identity: derive `sessionId` from a first-party cookie, generating one on first visit
    (crypto.randomUUID). It is NOT the auth session and must work for anonymous visitors. Same sessionId ->
    same order within a session; new sessionId -> reshuffle. Never `Math.random`.
  - An engine or DB error returns `{ status: "error", cards: [] }` — it NEVER throws into the render tree.
    An empty pool returns `{ status: "empty", cards: [] }`. B1b renders both.
STEP 3 (commit `feat(feed): public feed route shell`):
  - apps/kol/src/app/feed/page.tsx — an RSC that reads the optional user (anon-safe: no redirect when
    `user` is null), calls `getFeedSelection`, and passes `FeedResult` to a placeholder-free presentational
    component that B1b will replace. Keep `AccountBar` for signed-in visitors and render a quiet sign-in
    affordance for anonymous ones. Do NOT build the magazine layout — that is B1b's unit and building it
    here creates a merge conflict.
STEP 4 (commit `test(feed): live feed selection boundary`):
  - apps/kol/src/lib/feed/__tests__/live-feed.test.ts against the LIVE staging DB (SEED-W3's worlds are
    there). Assert: an anonymous call returns one card per published seed store; no thankyou clip ever
    appears; a repeated call with the SAME sessionId returns the same order; a different sessionId
    reshuffles; and an UNPUBLISHED store's clip never appears even when a seller user session exists.
    Clean up anything you create. Follow the precedent at
    apps/kol/src/lib/account/__tests__/live-account-boundary.test.ts.

## Design-Lead seam
The feed LIMIT (spec band 12-24) and per-viewport card count are Design-Lead's call, in flight now. Export
the limit as a named const with the default 18 and note the assumption in decisions_made. Do not decide
any visual question — you build no layout.

## Constraints
- TypeScript strict. Zod on any external input. No new dependency. No migration, no RPC, no schema change.
- Zero placeholder UI, zero TODOs. Every state your shell can reach must render something real.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`. Every pre-existing test must still
  pass — especially apps/kol/src/lib/auth/routes.test.ts.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nextjs-app-router-patterns · supabase-rls-conventions · nodejs-backend-patterns

## Turn budget
~19-tool-use cap. COMMIT AFTER EACH STEP. On approach, return PARTIAL with resume_point naming the STEP.
STEP 1 and STEP 2 are what B1b is blocked on. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-backend-engineer-b1a-feed-data.md (≤10 lines).
```

---

# BRIEF 4 — B1b · Magazine layout + the anti-grid invariant

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5 (this is the build plan's "Fable Design-Build" role)
name: frontend-engineer-b1b-feed-magazine
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B1b — the discovery feed's magazine layout.
Risk tier: FULL (est. 350-500 LOC; >=300 sets the floor, and you own a hard-gate AC). Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2, W2-WIRE, SEED-W3, and **B1a** must all be on `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/feed/select.ts | head -1
If it errors, STOP and return BLOCKED with "B1a not merged".

## Goal
Render B1a's `FeedResult` as a magazine composition of makers on film — mixed-size, asymmetric,
media-forward. The single most identity-defining screen in the product. It must never read as a grid.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b1b-feed-magazine -b feat/b1b-feed-magazine main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b1b-feed-magazine/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/discovery-feed.md — your spec. The "Layout identity (hard gate)" AC is the one
   that decides whether you pass.
2. apps/kol/src/lib/feed/select.ts — B1a's `FeedResult` / `FeedCard` view model. Your only data input.
3. apps/kol/src/components/blocks/hero-video/index.tsx — the shipped hero-video block and its
   `full-bleed | center-column | corner-shrunk` variants.
4. apps/kol/src/components/media/ (FilmFrame, PosterStill, SmartImage), components/states/ (EmptyPrompt,
   ErrorInline, Skeleton), components/motion/Reveal.tsx — the shipped primitives you compose. Use them.
5. apps/kol/src/lib/renderer/HeroStage.tsx + stages.ts — the persistent hero slot and the WorldStage model.
   B2 will carry a tapped card into `grown`; your card must be a clean handoff point for that.

## THE HARD GATE — the AC that forbids a uniform grid
"the layout MUST be a mixed-size magazine composition (asymmetric, varied card sizes, media-forward) and
MUST NOT be a uniform equal-cell product grid. An automated layout test MUST assert that rendered feed
cards do not all share identical dimensions / a single repeating cell size."

You own that test: apps/kol/src/app/feed/__tests__/feed-layout.test.tsx (or a Playwright spec under e2e/
if measuring real rendered boxes needs a browser — your call, but the assertion must be on REAL measured
dimensions, not on class names).
Default assertion, unless Design-Lead has landed a different composition rule: across a rendered feed of
>=6 cards at a desktop viewport, there must be >=3 DISTINCT card widths and no single repeating cell size
covering all cards. State whichever rule you implement in decisions_made.

The product reason, so you build toward it rather than to the letter of the test: a uniform grid flattens
every maker into interchangeable inventory. That is the exact failure KOL exists to reject. TikTok Shop and
Complex are the named anti-patterns — "dense grids of tiny product cards, zero human story." Few large,
human-forward pieces; story first; no urgency chyrons, no discount badges, no star clutter.

## What to build
- apps/kol/src/components/feed/FeedMagazine.tsx — the composition. Mixed-size cards in an asymmetric
  arrangement (CSS grid with varied spans, or columns with varied aspect — your craft call). Real human
  faces lead each frame; the film is the content and the chrome never competes with it.
- apps/kol/src/components/feed/FeedCard.tsx — one maker card. Poster still paints IMMEDIATELY; video
  autoplays MUTED over it (sound off until opt-in — the hard tone line); captions available. Keyboard
  navigable, real focus states.
- Replace B1a's placeholder presentational component in apps/kol/src/app/feed/page.tsx with FeedMagazine.
  Do NOT change B1a's data layer, the route policy, or lib/auth/routes.ts.
- ALL 4 STATES, no placeholders, no TODOs:
    empty   — `status: "empty"` -> a warm "no makers yet" INVITATION. Never a blank void, never a bare grid.
    loading — poster stills + skeletons MATCHED to the magazine card layout. No centered spinner. No CLS:
              the skeleton occupies the card's final box.
    error   — `status: "error"` -> serve the last cached feed with a quiet inline retry. Never blank.
    success — live mixed-size film across cards.
- Tap a video card -> transition toward `GROWN`. B2 owns that transition; you expose the handoff (the
  tapped card's video element must be the one B2 promotes — do not remount it on tap).
- Reveal on `--ease-kol`, 70ms stagger, media-leads-text, via the shipped Reveal component.
  `prefers-reduced-motion` -> instant fade.
- Curated KOL chrome ONLY. The feed never adopts a seller's theme — `theme.kind:"curated"` chrome.

## Design-Lead seam — flag, do not invent
Design-Lead is deciding the card span pattern, size ratios, per-viewport card count, and the exact feed
limit (spec band 12-24) RIGHT NOW, in parallel. If that direction has not landed when you need it: use
B1a's exported default limit, implement a 3-size span pattern, record the assumption in decisions_made,
and do NOT invent a new design primitive. Use existing tokens and components from components/ui and the
theme layer only.

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. The renderer already
  does shared-element continuity with an imperative FLIP on `--ease-cinematic` plus `view-transition-name`
  (see HeroStage.tsx). Adding an animation library would rewrite a QA-passed invariant. If you believe you
  need one, return BLOCKED.
- No migration, no RPC, no schema change, no direct DB query — everything through B1a's `getFeedSelection`.
- Zero placeholder UI, zero TODOs, all 4 states.
- Accessibility: axe-core clean; every card's media has a poster and captions; autoplay muted; cards
  keyboard-reachable with visible focus.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
high-end-visual-design · tailwind-design-system · react-ui-patterns

## Turn budget
~19-tool-use cap. Commit in this order: (1) FeedCard + its states, (2) FeedMagazine + page wiring,
(3) the anti-grid layout test. On approach, return PARTIAL with resume_point naming which of the three.
The layout test is the hard gate — never leave it unlanded. Never truncate silently.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
State the exact anti-grid assertion you implemented in `summary`.
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b1b-feed-magazine.md (≤10 lines).
```

---

# BRIEF 5 — B2 · Grow interaction

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b2-grow
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B2 — the grow interaction (`GROWN` state).
Risk tier: LITE (frontend transition + one engine read; no DB write, no auth surface, est. 180-260 LOC).
QA-Lead may upgrade. Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2 merged AND W2-WIRE merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
If it errors, STOP and return BLOCKED with "W2-WIRE not merged".

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b2-grow -b feat/b2-grow main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b2-grow/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/grow-interaction.md — your spec.
2. apps/kol/src/lib/renderer/HeroStage.tsx, hero-persistence.ts, hero-persistence.test.tsx, stages.ts —
   the shipped persistence machinery. This is the single most important thing you read.
3. apps/kol/src/components/blocks/hero-video/index.tsx — the `center-column` variant you promote into.
4. apps/kol/src/lib/engine/index.ts — `createEngineDeps`. Your only engine entry point.
5. apps/kol/src/lib/feed/select.ts — B1a's view model, if the tapped card comes from the feed.

## Goal
Tapping a feed video grows it to a center column that KEEPS PLAYING while the feed scrolls around it.
Tapping an image grows it into a "meet the person" moment. A second tap advances to `WORLD_OPEN` (B3).

## THE LOAD-BEARING INVARIANT — this is what you are actually being asked to protect
"the `hero-video` element MUST NOT pause, unmount, or reload — playback is continuous across the
transition." A cut, pause, or reload here breaks the felt continuity that makes B3's unfold read as one
physical motion. The whole product identity rests on it.

>>> AMENDMENT A SUPERSEDES THE PARAGRAPH BELOW. The binding AC is now CPO's reframing: "the film frame
>>> never unmounts and never shows a paused or black frame." FEED -> GROWN is a CROSS-TREE handoff (N feed
>>> cards from N stores), which React cannot do by moving a DOM node. FILM-LAYER builds the mechanism; you
>>> publish the feed-card rect and the centre-column rect and call the `grow` edge from the edge table
>>> (design-direction §5.2, `--dur-grow`, `--ease-kol`). DO NOT write a test asserting a single `<video>`
>>> node — A/B buffers use two, and such a test would fail a correct implementation. Tier is now FULL.

You own an automated test asserting BOTH: the video element IDENTITY persists across FEED -> GROWN
(same DOM node, not an equivalent one), and `paused` never flips true during the transition.
`apps/kol/src/lib/renderer/hero-persistence.test.tsx` is the shipped precedent for how to assert this —
extend that idiom, do not invent a new one.

## What to build
- The grow transition promoting the tapped card's `hero-video` into the `center-column` variant inside
  `HeroStage`. PROMOTED, NEVER REMOUNTED. Reuse `HeroStage`'s imperative FLIP pattern (measure first rect,
  flip the class, measure last, invert, release on `--ease-cinematic`) — it already solves exactly this
  problem for the narrate-shrink dock.
- Extend the stage model in lib/renderer/stages.ts usage — `"grown"` already exists in WORLD_STAGES; wire
  the real feed surface to it. Do NOT redefine WORLD_STAGES.
- The feed continues scrolling around the centered video.
- The image-card path: grows into a "meet the person" view (not a video-narration state).
- Engine: call `selectVideos` with `state: "GROWN"`, `storeScope = the tapped clip's store_id`. The engine
  returns the grown clip (usually the same feed intro clip promoted) plus that store's peers.
- States: loading (poster + skeleton shimmer over it — chrome never waits on the video, no spinner);
  error (fall back to the clip `poster` with a quiet inline retry, state stays usable); success (centered,
  playing, feed scrolling around it). EMPTY IS N/A — GROWN is only reachable from a real tapped clip.
  Put that one-line reason in a code comment rather than fabricating an empty state.
- Second tap on the grown video -> advance toward `WORLD_OPEN`. B3 owns that transition; expose the handoff
  without remounting the element.
- `--ease-kol` for reveal choreography; `prefers-reduced-motion` -> instant fade, and the video STILL
  persists and plays. Muted autoplay; sound off until opt-in.

## Design-Lead seam
The grow choreography (FLIP path from feed card to center column, duration beyond `--ease-kol`) is
Design-Lead's, in flight now. Default to the `--ease-cinematic` FLIP `HeroStage` already uses for its dock
transition, and record the assumption in decisions_made. Do not invent a new motion token.

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. `HeroStage` does
  shared-element continuity with an imperative FLIP plus `view-transition-name`; an animation library would
  rewrite a QA-passed invariant. If you believe you need one, return BLOCKED.
- Do NOT modify lib/renderer/HeroStage.tsx's existing dock behaviour or hero-persistence.ts. Extend around
  them. Every existing renderer test must still pass.
- No migration, no RPC, no schema change, no DB write. Engine reads only via `createEngineDeps`.
- Zero placeholder UI, zero TODOs.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
vercel-react-view-transitions · react-patterns · emilkowal-animations

## Turn budget
~19-tool-use cap. Commit: (1) the grow transition + center-column promotion, (2) the engine GROWN call +
states, (3) the persistence test. On approach return PARTIAL naming which. The persistence test is
load-bearing — never leave it unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b2-grow.md (≤10 lines).
```

---

# BRIEF 6 — B3 · World unfold

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b3-world-unfold
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B3 — world unfold (`WORLD_OPEN`).
Risk tier: LITE (frontend render + transition + one engine read; no DB write, est. 200-280 LOC).
QA-Lead may upgrade — you touch the renderer's hardest invariant. Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2 merged AND W2-WIRE merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
  git -C /Users/adamks/VibeCoding/etsyc show main:supabase/seed/002_w3_seed_worlds.sql | head -1
If either errors, STOP and return BLOCKED naming which.

## Goal
On the second tap, the maker's ENTIRE branded world animates open AROUND the still-playing video. This is
the signature moment of the product — the one thing the concept-lock summary names. If the world opened as
a new page (a cut, a reload, a paused video) the magic collapses into ordinary navigation.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b3-world-unfold -b feat/b3-world-unfold main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b3-world-unfold/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/world-unfold.md — your spec.
2. apps/kol/src/lib/renderer/ — render-store.tsx, StoreWorld.tsx, HeroStage.tsx, hero-persistence.ts,
   stages.ts, render-block.tsx, and the two shipped test files. The P4 renderer is your foundation;
   you compose it, you do not rewrite it.
3. apps/kol/src/lib/theme/ — both `theme.kind` paths (curated token lookup, custom CSS-prop apply).
4. apps/kol/src/lib/engine/index.ts — `createEngineDeps`.
5. apps/kol/src/components/motion/Reveal.tsx — the shipped `--ease-kol` 70ms stagger.

## THE LOAD-BEARING INVARIANT
"the `hero-video` element MUST NOT unmount or pause — it is the SAME shared element carried from B2."
This is the hardest renderer invariant in the product and P4 already implemented the machinery for it:
`HeroStage` keeps an identical tree position across every stage so React never remounts the `<video>`;
stages change classes and transforms only, never layout. Your unfold must live INSIDE that guarantee.

>>> AMENDMENT A SUPERSEDES THE PARAGRAPH BELOW. Binding AC: "the film frame never unmounts and never shows
>>> a paused or black frame." Assert against the Film Layer, not a `<video>` node. Your unfold choreography
>>> is design-direction §3.3 — a 900 ms HARD CAP on `--ease-cinematic` in three timed bands (0-280 ground
>>> wash + feed fade-out · 140-620 blocks rise in staggered waves, nearest-to-film first, 70 ms ·
>>> 340-900 atmosphere and secondary media). Tier is now FULL, est. 300-420 LOC.

You own an automated test asserting element identity persists and playback is continuous across
GROWN -> WORLD_OPEN. Extend the idiom in apps/kol/src/lib/renderer/hero-persistence.test.tsx.

## What to build
- The unfold: the P4 renderer's ordered `blocks[]` composing around the persistent hero, under the maker's
  own theme. `isWorldUnfolded(stage)` in stages.ts already models which stages carry the world body — use it.
- Progressive block reveal via the shipped Reveal component: media leads, then heading, then body,
  70ms stagger, `--ease-kol`, once per element.
- Both `theme.kind` paths: curated -> token lookup; custom -> apply `customPalette.roles` / `customPairing`
  as CSS props. Atmosphere and the motion preset apply per-maker.
- Engine: `selectVideos` with `state: "WORLD_OPEN"`, `storeScope = store_id`, `limit: 1`. It keeps the
  store's signature clip in the persistent single-clip slot — usually the same clip promoted from the feed,
  which is what makes the transition seamless.
- **The engine NEVER reads `blocks` or `stores.config`.** The engine and the renderer meet only at
  `videos.id`. The renderer reads config; the engine reads the canonical tables. Do not blur this.
- NO FLATTENING (an AC): two different makers' worlds must render with genuinely different layout, tokens,
  atmosphere, and motion. SEED-W3 seeded four deliberately different worlds, including at least one
  curated and one custom theme — verify against at least two of them and say which in your summary.
- Reduced motion: `prefers-reduced-motion` -> the animated unfold is replaced by an INSTANT FADE (no
  spatial or liquid motion), while the video still persists and plays.
- States: loading (progressive reveal with skeletons matched to each block's real layout — no spinner, no
  layout shift); error (ONE block failing degrades quietly and inline; the world still opens and stays
  usable — a single failed block never blocks the unfold; `BlockBoundary.tsx` is the shipped mechanism);
  success (full per-maker world around the still-playing film). EMPTY IS N/A at world level — a published
  world always has >=1 block (the hero-video); empty optional blocks are simply omitted. Comment the reason.
- Scrolling advances toward `WORLD_BROWSE` (B4) — expose the handoff, do not build B4's behaviour.

## Design-Lead seam
The unfold envelope — block reveal order, and whether the `liquid`/`dimensional` motion presets drive the
unfold itself or only per-block reveal — is Design-Lead's, in flight now. Default to the shipped Reveal
70ms media-leads-text stagger and record the assumption in decisions_made. Do not invent a motion primitive.

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. If you believe you need
  one, return BLOCKED.
- Do NOT modify HeroStage.tsx's dock behaviour, hero-persistence.ts, or stages.ts' WORLD_STAGES. Compose
  around them. Every existing renderer test must still pass.
- No migration, no RPC, no schema change, no DB write.
- Zero placeholder UI, zero TODOs.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
emilkowal-animations · vercel-react-view-transitions · react-patterns

## Turn budget
~19-tool-use cap. Commit: (1) the unfold composition + theme paths, (2) progressive reveal + reduced-motion
+ per-block error degradation, (3) the hero-persistence test across GROWN->WORLD_OPEN. On approach return
PARTIAL naming which. The persistence test is load-bearing.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Name the two seed worlds you verified no-flattening against in `summary`.
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b3-world-unfold.md (≤10 lines).
```

---

# BRIEF 7 — B4 · Store scroll & interact

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b4-store-scroll
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B4 — store scroll & interact (`WORLD_BROWSE`).
Risk tier: LITE (frontend interactivity + engine reads; no DB write, est. 180-260 LOC). Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2 merged AND W2-WIRE merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
If it errors, STOP and return BLOCKED with "W2-WIRE not merged".

## Goal
The open world is fully interactive as the buyer scrolls, and the persistent film keeps playing — swapping
contextually to `process` / `atmosphere` clips so the world feels alive rather than a single loop.
If interacting paused the film, the shopkeeper would go silent every time the buyer touched something.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b4-store-scroll -b feat/b4-store-scroll main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b4-store-scroll/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/store-scroll-interact.md — your spec.
2. apps/kol/src/components/blocks/ — the 11 shipped block primitives and registry.ts. You make them
   interactive in the live world; you do not redesign them.
3. apps/kol/src/lib/renderer/StoreWorld.tsx, HeroStage.tsx, hero-persistence.ts, stages.ts.
4. apps/kol/src/lib/engine/index.ts — `createEngineDeps`.
5. apps/kol/src/components/media/FilmFrame.tsx — note how it reads `HeroPersistenceContext` to suppress
   scroll-gated pausing inside the hero slot. That is exactly the behaviour you must not break.

## What to build
- Every block interacts live during scroll: `product-showcase` (rail / masonry / featured-single),
  `craft-story`, `process-reel` (autoplays muted on scroll-in, pauses on scroll-out), `atmosphere` (the ONLY
  block permitted ambient motion), `contact-cta`, `voice-quote`, `reviews`, `trust-badge`.
- Engine clip swaps: `selectVideos` with `state: "WORLD_BROWSE"`, `storeScope = store_id`. The persistent
  player may swap to a `process` / `atmosphere` clip as the buyer scrolls.
- **SWAPS ARE SCORING-DRIVEN, NEVER RANDOM** (an AC). The choice comes from the engine's weighted-sum
  scoring; anti-repetition (stage 3) always runs after scoring so nothing loops within the session.
  There must be NO `Math.random` anywhere in your diff. QA-Lead will grep for it.
- AMENDMENT A CORRECTS THE NEXT LINE. Changing `src` on a live `<video>` runs the media load algorithm:
  readyState resets, playback stops, poster or black flashes. It is not physically satisfiable. Call
  FILM-LAYER's `swapClip(src, poster)` instead — it loads the INACTIVE buffer, waits for `canplay`, and
  cross-fades over `--dur-swap` (120 ms). Your unit gets SIMPLER, not harder; you own no film mechanism.
- The element persists across swaps: change the `src`, never remount the `<video>`. Any block interaction
  must NOT pause or unmount the persistent film — assert this in a test.
- No eligible `process`/`atmosphere` clip to swap to -> the player simply keeps the current clip. Graceful,
  never an error.
- Click a product -> advance toward `NARRATE_SHRINK` (B5). Expose the handoff; B5 owns the shrink.
- Per-block 4 states: loading (layout-matched skeleton, no spinner); error (degrades quietly and inline via
  `BlockBoundary.tsx`, the rest of the world stays usable); empty (an optional block with no content is
  OMITTED — empty != blank); success (fully interactive).
- `--ease-kol` reveal; `prefers-reduced-motion` -> instant fade, and `process-reel` + `atmosphere` go static.
  Sound off until opt-in.
- The world wears the MAKER's theme, not KOL curated chrome. No block chrome pulls focus from the film.

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. Return BLOCKED if you
  think you need one.
- Do NOT modify HeroStage.tsx's dock behaviour or hero-persistence.ts. Every existing renderer and block
  test must still pass.
- No migration, no RPC, no schema change, no DB write. Engine reads only via `createEngineDeps`.
- Zero placeholder UI, zero TODOs.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
react-ui-patterns · vercel-react-view-transitions · web-design-guidelines

## Turn budget
~19-tool-use cap. Commit: (1) live block interactivity, (2) engine-driven clip swap without remount,
(3) the no-pause-on-interaction test + per-block states. On approach return PARTIAL naming which.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b4-store-scroll.md (≤10 lines).
```

---

# BRIEF 8 — B5 · Contextual narration shrink

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b5-narrate-shrink
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B5 — contextual narration shrink
(`NARRATE_SHRINK`). Risk tier: LITE (frontend shrink transition + one engine read with a fallback chain;
no DB write, est. 150-220 LOC). Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2 merged AND W2-WIRE merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
If it errors, STOP and return BLOCKED with "W2-WIRE not merged".

## Goal
When the buyer goes deeper into a product, the persistent film shrinks to a corner dock (320x180) and the
engine plays the RIGHT narration clip for that product. This is the moment the shopkeeper leans in.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b5-narrate-shrink -b feat/b5-narrate-shrink main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b5-narrate-shrink/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/contextual-narration-shrink.md — your spec.
2. apps/kol/src/lib/renderer/HeroStage.tsx — READ THE DOCK CODE CLOSELY. `stage === "narrate-shrink"`
   already triggers a FLIP dock via the `kol-hero-docked` class, pinning the shell's in-flow height first
   so the world never shifts. AMENDMENT A: that FLIP MOVES INTO FILM-LAYER as the `dock` edge
   (`--dur-dock` 440 ms on `--spring-video`, design-direction §5.2). You publish a corner rect via
   `useFilmSlot` and own the EXCLUSION ZONE (screen-specs §5.3, which closes your open question and the
   "dock covers the CTA" risk) plus the fallback chain. You do NOT reimplement the FLIP. Tier stays LITE.
   The line below described the pre-amendment state. You wire the real product surface to
   it and own the engine selection; you do not reimplement the FLIP.
3. apps/kol/src/lib/engine/eligible.ts — the `productScoped` function. It already implements your entire
   fallback chain. Read it so you match its behaviour rather than duplicating it in the UI.
4. apps/kol/src/lib/engine/index.ts — `createEngineDeps`.
5. apps/kol/src/components/blocks/hero-video/index.tsx — the `corner-shrunk` variant.

## THE LOAD-BEARING GOTCHA — graceful fallback, never an error
`product_links` is `uuid[]` with NO element-level FK. A stale, dangling, or absent id yields ZERO ROWS —
never a database error. The engine's documented fallback then runs, and `eligible.ts` already implements it:
  1. the clip tied to THIS product (`product_links @> {productId}`);
  2. if empty -> drop the product_links predicate -> any product-narration clip in the store;
  3. if still empty -> keep the CURRENTLY-PLAYING persistent world clip in the dock.
The buyer NEVER sees an error, a broken state, or a gap. And there is NEVER buyer-time generation — the
engine SELECTS from already-tagged real footage only.
You own a test proving step 3: a product with no matching narration keeps the persistent clip playing in
the dock and renders no error.

## What to build
- Wire the real product surface to `stage: "narrate-shrink"` so `HeroStage`'s existing dock FLIP runs.
  Spec-locked dock geometry: `320x180`, `--radius-md`, `--shadow-raised`, `corner-shrunk` variant.
  The element persists — no remount.
- Engine: `selectVideos` with `state: "NARRATE_SHRINK"`, `storeScope = store_id`, `productId = clicked`,
  `limit: 1`. The engine owns the fallback chain — do NOT reimplement it in the component; consume its
  result and handle the empty case by keeping the persistent clip.
- States: loading (dock poster + shimmer immediately; the product content NEVER waits on the dock video);
  error (clip 404s or decode-fails -> fall back to the clip `poster`, or keep the persistent clip, with a
  quiet inline retry — never a blocking error); no-match (persistent clip continues, narration simply
  absent); success (the corner clip narrates the product).
- The dock stays OUT of the reading path: it must not trap focus and must not cover the product CTA.
- `--ease-kol`; `prefers-reduced-motion` -> instant fade, video still persists. Sound off until opt-in.
  Captions on the dock clip.
- Landing on the product surface advances toward `PRODUCT_PAGE` (B6) — expose the handoff only.

## Design-Lead seam
Dock SIZE is spec-locked and already implemented. Dock PLACEMENT (which corner, safe-area insets, and the
CTA-collision rule) is Design-Lead's, in flight now. Default to whatever `kol-hero-docked` in globals.css
already does, record the assumption in decisions_made, and do not invent a new placement token.

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. The dock FLIP exists.
  Return BLOCKED if you think you need a library.
- Do NOT modify HeroStage.tsx's FLIP implementation or hero-persistence.ts. Every existing renderer test
  must still pass.
- No migration, no RPC, no schema change, no DB write.
- Zero placeholder UI, zero TODOs.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
emilkowal-animations · react-patterns · wcag-audit-patterns

## Turn budget
~19-tool-use cap. Commit: (1) dock wiring + engine NARRATE_SHRINK call, (2) the fallback chain handling +
4 states, (3) the no-match-keeps-persistent-clip test. On approach return PARTIAL naming which.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b5-narrate-shrink.md (≤10 lines).
```

---

# BRIEF 9 — S8 · Product management

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-s8-product-management
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit S8 — seller product management.
Risk tier: FULL (writes `products` + `media` under RLS, seller role gate, and owns the price contract B7
depends on; est. 450-600 LOC — both the surface and the size trigger fire). Model: Fable 5. ONE unit.

S8 is PULLED FORWARD ahead of B6/B7 because the locked order is S8 -> B6 -> B7. Two units are blocked on you.

## HARD PRECONDITIONS
Wave 2 merged AND SEED-W3 merged. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:supabase/seed/002_w3_seed_worlds.sql | head -1
If it errors, STOP and return BLOCKED with "SEED-W3 not merged" — you need a seller with a store to edit.

## Goal
The seller surface for adding and editing products: title, description, ordered images, optional 3D model,
price (integer MINOR UNITS + explicit currency), linked narration clips, inventory, badges.
Without this there is nothing to buy.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/s8-product-management -b feat/s8-product-management main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/s8-product-management/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase project ref olwtcjzmohdhawdzlzqs.

## Read ONLY these
1. docs/04-features/specs/product-management.md — your spec.
2. supabase/migrations/20260721000004_products.sql — the APPLIED `products` table, `product_specs`, and
   the `products_owner_all` / `products_public_read_published` policies. Your binding shape.
3. apps/kol/src/lib/supabase/database.types.ts — the real Row/Insert types.
4. apps/kol/src/lib/account/ — the Wave-1 precedent for schemas.ts / actions.ts / live boundary tests.
   Match its idiom EXACTLY: Zod schema module, server-action module, typed results that never throw to
   the client, a live RLS boundary test.
5. apps/kol/src/app/seller/page.tsx + apps/kol/src/lib/auth/routes.ts — the EXISTING seller role gate.
   Reuse it. Do not invent a new gate.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
- Money = integer MINOR units + char(3) currency (default GBP). No floats. Anywhere. Ever.
- camelCase (store-config) <-> snake_case (tables) are the same fields; you write the snake_case tables.
- Video config<->table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
Tables you WRITE: `products`, `media`, `product_specs` (all via the RLS-SCOPED USER CLIENT, own-store only —
`products_owner_all` scopes by store ownership). Tables you READ: `stores`, `videos` (for the narration-clip
picker). You add no migration, no RPC, no policy, no column.

## THE PRICE CONTRACT — the reason this unit is Full tier
Price lives in `products` and NOWHERE ELSE. `create_order` (already applied, `20260721000006_commerce.sql:159-165`)
reads `price_amount` and `currency` server-side straight from `products` — it has no price parameter, so a
client-supplied price is structurally unreachable. Your job is to keep that true:
- `price_amount` is an INTEGER in minor units. Never a float, never a formatted string in the DB.
- `currency` is `char(3)`, default GBP.
- The form takes a human-friendly major-unit input and converts to minor units EXACTLY ONCE, in a single
  tested pure function. Round-trip it in tests (12.34 -> 1234 -> "12.34"), including 0, and a value with
  trailing-zero minor units.
- NEVER store or transmit a price anywhere else — not in `stores.config`, not in a cart payload, not in a
  hidden form field consumed as authoritative.

## What to build
STEP 1 (commit `feat(products): product write contract`):
  - apps/kol/src/lib/products/schemas.ts — Zod: title (non-empty), description, materials, price
    (major-unit input -> integer minor units, with the conversion helper and its inverse), currency
    (3-letter, default GBP), inventory_status (`in-stock | made-to-order | sold-out`), inventory_qty
    (nullable, >= 0), badges (subset of `one-of-a-kind | made-to-order | limited`), model3d_id (nullable
    uuid), narration clip ids (uuid[]).
  - apps/kol/src/lib/products/actions.ts — server actions `createProduct`, `updateProduct`, `deleteProduct`.
    Validate with Zod, write via the RLS-SCOPED USER CLIENT (never the service client), own-store only.
    Return typed results; never throw to the client.
  - apps/kol/src/lib/products/schemas.test.ts — unit tests including the money round-trip and every
    rejection case.
STEP 2 (commit `feat(products): seller product management surface`):
  - apps/kol/src/app/seller/products/page.tsx (list) and .../products/[productId]/page.tsx (form).
    Seller-role-gated via the EXISTING gate. Own-store only.
  - The form: title, description, ordered image uploader (with `focalPoint`), optional 3D uploader, price
    (amount + currency), inventory, badges, narration-clip picker reading `videos` for the seller's store,
    and the `product_specs` fields (P14's 11 required fields — capture them here; publish-blocking
    enforcement is P14's own unit in Wave 4, not yours).
  - ALL 4 STATES, no placeholders, no TODOs:
      empty   — no products yet -> "add your first piece" with a clear CTA. Empty != blank.
      loading — save/upload progress MATCHED to the form (never a bare spinner); the form stays usable.
      error   — inline FIELD-LEVEL validation errors, nothing written until valid; on upload failure a
                quiet inline error + retry with PRIOR MEDIA RETAINED.
      success — product live, visible in `product-showcase`, with its own product-detail page.
  - Single-column form on mobile. Price rendered in mono/tabular figures. Image `alt` is REQUIRED and never
    empty (store-config §2.3). No generic 3-column card grid in the product list — the showcase uses
    rail / masonry / featured-single (NARRATIVE anti-grid).
STEP 3 (commit `feat(products): media upload path`):
  - Supabase Storage upload to a bucket named `store-media`, writing `media` rows owner-scoped.
  - KNOWN BLOCKER: the bucket may not exist yet — buckets are Supabase-side config and no migration creates
    one. Check for it. If present, build and smoke-test the upload. If ABSENT, still build the full upload
    path and return PARTIAL with
    resume_point: "STEP 3 — upload smoke test; needs the store-media Supabase Storage bucket".
    The `products` CRUD half is what B6/B7 need and it MUST land regardless. Do not stall on the bucket.
STEP 4 (commit `test(products): live RLS boundary suite`):
  - apps/kol/src/lib/products/__tests__/live-products-boundary.test.ts against the LIVE staging DB.
    Assert: the owning seller CAN write its own store's products; a DIFFERENT authenticated seller CANNOT;
    anon CANNOT write; anon CAN read products of a PUBLISHED store and CANNOT read an unpublished store's.
    Clean up every row you create. Follow apps/kol/src/lib/account/__tests__/live-account-boundary.test.ts.

## Known-deferred — cite, do NOT build
`create_order` has NO inventory check (N3). Do NOT add inventory enforcement at checkout — that is a new
migration and therefore Irreversible tier. S8 STORES and DISPLAYS inventory status/qty; B6 disables
add-to-cart when unavailable. Display-only inventory is the accepted MVP behaviour (answering spec OQ-2).
Also out of scope: P14 publish-blocking enforcement, P13 provenance, 3D model generation (upload only).
Multi-currency: default GBP with an explicit per-product currency is sufficient for MVP (answering OQ-3).

## Constraints
- TypeScript strict. Zod on every input. NO new dependency. No migration, no RPC, no schema change.
- Use existing tokens and components from apps/kol/src/components/ui and the theme layer. Seller-tool
  chrome is curated. Do not invent design primitives.
- Zero placeholder UI, zero TODOs, all 4 states.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nextjs-app-router-patterns · supabase-rls-conventions · form-cro

## Turn budget
~19-tool-use cap and this is a large unit — it is pre-split into 4 commits for exactly that reason.
COMMIT AFTER EACH STEP. On approach, return PARTIAL with resume_point naming the STEP.
STEP 1 is what B6 and B7 are blocked on — never leave it unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
State whether the `store-media` bucket existed in `summary`.
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-s8-product-management.md (≤10 lines).
```

---

# BRIEF 10 — B6 · Product page + cart module

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b6-product-page
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B6 — the product page and the cart module.
Risk tier: FULL (est. 350-450 LOC, and you own `lib/cart/`, a DB write path against `carts`).
Model: Fable 5. ONE unit. B7 is blocked on you.

## HARD PRECONDITIONS
Wave 2, W2-WIRE, SEED-W3, S8, and B5 must all be on `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/products/schemas.ts | head -1
If it errors, STOP and return BLOCKED with "S8 not merged".

## Goal
The deep single-product view — gallery, optional 3D, inline compact trust badge, reviews, mono price,
inventory truth, and the ONE high-emphasis add-to-cart button — rendered while the corner film narrates.
Plus `lib/cart/`, which B7 consumes.

## Ownership note — read this, it prevents a repeat of the W2-WIRE gap
The cart module has no other owner. The product-page spec says the cart is "owned by B7's flow" and the
checkout spec says add-to-cart comes from B6. **CTO decision: B6 owns `apps/kol/src/lib/cart/` — schemas
plus server actions writing `carts` under RLS. B7 consumes it and does not redefine it.** If you skip it,
nothing owns it and B7 stalls.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b6-product-page -b feat/b6-product-page main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b6-product-page/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/product-page.md — your spec.
2. supabase/migrations/20260721000006_commerce.sql — the APPLIED `carts` table, `carts_buyer_all` policy,
   and the `carts_one_active_per_buyer` PARTIAL UNIQUE INDEX (at most one active cart per buyer). That
   index is a constraint you must design around, not discover at runtime.
3. apps/kol/src/lib/products/ (post-S8) — schemas, actions, and the money conversion helper. REUSE the
   helper; do not write a second one.
4. apps/kol/src/components/blocks/product-detail/index.tsx, trust-badge/, reviews/ — the shipped blocks.
5. apps/kol/src/lib/account/ — the Wave-1 schemas/actions/live-test idiom to match.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
- Money = integer MINOR units + char(3) currency (default GBP). No floats.
Tables you WRITE: `carts` (RLS-scoped user client, `carts_buyer_all` — buyer owns fully; it is scratch
space and NO MONEY LIVES THERE). Tables you READ: `products`, `media`, `product_specs`,
`product_provenance`, `reviews`, `badges`. No migration, no RPC, no policy, no column.

## THE PRICE RULE
Price is DISPLAY-ONLY here. Read `price_amount` + `currency` from `products` and render them in mono /
tabular figures. The client MUST NOT set or pass an authoritative price. The cart stores product ids,
quantities, and variations — NEVER a price. B7's `create_order` re-reads every price server-side from
`products`; that is the only authoritative source. If you find yourself putting a number-of-money into a
cart row or a form field that the server later trusts, stop — that is the exact hole this design closes.

## What to build
STEP 1 (commit `feat(cart): store-scoped cart contract`):
  - apps/kol/src/lib/cart/schemas.ts + actions.ts — `addToCart`, `updateQuantity`, `removeFromCart`,
    `getActiveCart`. RLS-scoped user client. Cart items carry `{ product_id, quantity, variation }` and
    NEVER a price.
  - **CTO decision: the cart is STORE-SCOPED for MVP.** `create_order(p_store_id, p_items)` is per-store
    and rejects cross-store items. One active cart per buyer (the DB enforces it with a partial unique
    index). Adding an item from a DIFFERENT store prompts the buyer to start a new cart rather than
    silently failing or silently mixing. This answers checkout spec OQ-2.
  - Anonymous buyers: `carts.buyer_id` references `profiles` and is NOT NULL, so an anonymous visitor
    cannot persist a cart. Add-to-cart for an anonymous visitor routes to sign-in and preserves the intent
    across the round trip (`?next=` — and do not weaken `parseSameOriginPath` to do it).
  - cart schemas/actions tests including the cross-store rejection and the anonymous path.
STEP 2 (commit `feat(product): product detail surface`):
  - apps/kol/src/app/store/[storeId]/product/[productId]/page.tsx (match the routing idiom the world
    surface already uses; if B3/B4 established a different shape, follow theirs).
  - `product-detail` variants: `image-gallery` (default) with `focalPoint` crops; `3d-viewer` via
    `model3d_id`; `video-led`. **3D FALLBACK: `model3d_id` null + variant `3d-viewer` -> SILENTLY falls
    back to `image-gallery`. Never a broken 3D frame.**
  - Inline compact `trust-badge` (`inline-compact` variant — always an HONEST state, never a claim we
    cannot back) + the `reviews` block. Surface `product_specs` (P14) and `product_provenance` (P13) where
    present.
  - Add-to-cart: THE ONE high-emphasis accent button in the world. Tactile (`scale-[0.98]` on `:active`).
    DISABLED WITH A VISIBLE REASON when inventory is `sold-out` or unresolved. SEED-W3 seeded a sold-out
    product specifically so you can prove this.
  - ALL 4 STATES: empty is N/A by route guard (an invalid or missing product is route-guarded — put the
    one-line reason in a comment, do not fabricate an empty state); loading = gallery skeleton AT THE
    PRODUCT ASPECT with the price and CTA area RESERVED (zero CLS, no spinner); error = per-image
    placeholder with visible `alt` text, add-to-cart disabled with a reason if inventory is unresolved;
    success = full detail with a live add-to-cart.
  - The page renders inside the MAKER's world (their theme). The corner film from B5 supports and must not
    block the CTA. `--ease-kol` reveal; reduced-motion -> instant fade.
STEP 3 (commit `test(cart): live cart RLS boundary`):
  - Live staging test: a buyer can read and write their OWN cart; a different buyer CANNOT read or write it;
    anon CANNOT; the one-active-cart-per-buyer index behaves as expected. Clean up every row.

## Constraints
- TypeScript strict. Zod on every input. NO new dependency — Stripe belongs to B7, not you. Return BLOCKED
  if you think you need one.
- No migration, no RPC, no schema change, no column.
- Zero placeholder UI, zero TODOs.
- Accessibility: axe-core clean; gallery keyboard-navigable; 3D has a gallery fallback; the disabled CTA
  states its reason to a screen reader.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
react-ui-patterns · tailwind-design-system · wcag-audit-patterns

## Turn budget
~19-tool-use cap. COMMIT AFTER EACH STEP. On approach return PARTIAL naming the STEP.
STEP 1 is what B7 is blocked on — never leave it unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b6-product-page.md (≤10 lines).
```

---

# BRIEF 11 — B7a · Stripe server integration + webhook  ·  **IRREVERSIBLE**

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-b7a-stripe-server
isolation: worktree
---
You are the backend-engineer for KOL Wave 3, unit B7a — the payment server path.
Risk tier: **IRREVERSIBLE**. This is the highest-risk unit in the entire wave.
Model: Fable 5 (claude-fable-5). ONE unit.

WHY IRREVERSIBLE, so you calibrate accordingly: you create
apps/kol/src/app/api/webhooks/stripe/route.ts, which matches `**/api/webhooks/**` in
.claude/qa-tier-floor.yml -> tier `irreversible`, reason "External webhook handlers — idempotency-critical".
It is also a billing flow, which CLAUDE.md's risk table floors at Irreversible independently.
Your PR gets the Full pipeline + security-engineer + adversary-engineer + Codex second opinion +
2-of-3 multi-judge + **FOUNDER SIGN-OFF**. Nobody can downgrade that, including the CTO.

## HARD PRECONDITIONS
Wave 2, W2-WIRE, SEED-W3, S8, and B6 must all be on `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/cart/actions.ts | head -1
If it errors, STOP and return BLOCKED with "B6 not merged".

## Goal
Turn a cart into a real, account-tied order with a real Stripe payment — in TEST MODE, taking no real
money — with no double-charge and no client-controllable money.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b7a-stripe-server -b feat/b7a-stripe-server main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b7a-stripe-server/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/checkout.md — your spec.
2. supabase/migrations/20260721000006_commerce.sql — READ IT IN FULL, lines 82-270. `create_order`,
   `cancel_order`, `set_order_status`, the grants, and the RLS policies. It is already applied. It is your
   contract and it is more restrictive than you might assume.
3. supabase/migrations/20260721000014_grants_hardening.sql — the anon revocations.
4. apps/kol/src/lib/cart/ (post-B6) — the cart you convert to an order.
5. apps/kol/src/lib/supabase/admin.ts — the service-role factory. You need it, precisely twice.
6. docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md §7 conflicts 3 and 4 — the CTO
   decisions you are implementing.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). **Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.**
- 10 SECURITY DEFINER fns incl. `create_order`, `cancel_order`, `set_order_status` — all `SET search_path=''`,
  schema-qualified, REVOKE EXECUTE FROM public + anon, GRANT EXECUTE TO authenticated.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also
  null uid; N1). `orders.status='paid'` on the service key via the Stripe webhook is exactly this pattern.
- Money = integer MINOR units + char(3) currency (default GBP). No floats.
Tables: `orders` + `order_items` are written ONLY by `create_order` (SECURITY DEFINER) and by the service
role. Buyers have SELECT-only policies and NO INSERT/UPDATE policy at all. `carts` is buyer-owned.
You add NO migration, NO RPC, NO policy, NO column. If you think you need one, return BLOCKED — a
migration here is a multi-day Founder-gated detour.

## WHAT IS ALREADY TRUE — do not rebuild it, do not weaken it
`create_order(p_store_id uuid, p_items jsonb)` is applied and correct. Verified line by line:
- binds `v_buyer := auth.uid()` and raises if null (`:127,:137`);
- reads `p.price_amount, p.currency` SERVER-SIDE from `public.products` scoped to `p_store_id` (`:159-165`)
  — there is NO price parameter, so a client-supplied price is structurally unreachable;
- forces `status 'pending'` at insert (`:147-148`);
- rejects an unpublished store (`:143`), a cross-store item (`:163`), `quantity <= 0` (`:155`), and mixed
  currencies (`:168`);
- snapshots `unit_price_amount` per line item (`:172-175`).
`p_items` is `[{ "product_id": uuid, "quantity": int, "variation": text|null }, ...]`. **NO PRICE FIELD.**
Never add one, never send one, never read one from the client.

## THE THREE THINGS YOU MUST GET RIGHT

### 1. STRIPE TEST MODE — hard constraint, enforced in code
`apps/kol/src/lib/payments/stripe.ts` must assert at construction that `STRIPE_SECRET_KEY` starts with
`sk_test_` and that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_test_`, throwing a clear error
otherwise. A live key must be impossible to run with, not merely discouraged. Real orders, no real money.
Add a test that a `sk_live_` key throws.

### 2. NO DOUBLE-CHARGE — `create_order` has NO idempotency guard, and there is no unique index on
`orders.stripe_payment_intent_id`. Calling the RPC twice creates two pending orders. The CTO decision you
implement:
- `create_order` is called **EXACTLY ONCE per checkout attempt**, inside the PaymentIntent-creation server
  action — never from the client, never speculatively.
- The returned order id is BOTH the Stripe `idempotencyKey` on PaymentIntent creation AND the linkage
  stored back onto the order.
- A retry after a decline **re-confirms the SAME PaymentIntent against the SAME still-`pending` order**.
  It does NOT call `create_order` again. Look up the buyer's existing pending order for this cart first.
- The webhook's paid transition is guarded: `update public.orders set status='paid' ... where id = $1 and
  status = 'pending'`. A duplicate delivery updates ZERO rows and is a silent, correct no-op.
This answers checkout spec OQ-1 (webhook idempotency strategy, owner CTO, due pre-build).

### 3. `orders` HAS NO BUYER UPDATE POLICY (`:250-251`, SELECT-only by design). Stamping
`stripe_payment_intent_id` onto the order is a write no buyer can perform. It happens SERVER-SIDE via
`createAdminClient()` in the same server action that creates the PaymentIntent — never from the client,
never from a client-callable action that takes an order id from the request body without re-checking
ownership against `auth.uid()`.

## Build order — commit in EXACTLY this order
STEP 1 (commit `feat(payments): stripe test-mode client`):
  - CTO PRE-APPROVAL: you MAY add `stripe` (server SDK) as a production dependency of apps/kol
    (`pnpm add stripe` from apps/kol). No other dependency is approved for you — `@stripe/stripe-js` and
    `@stripe/react-stripe-js` belong to B7b. Return BLOCKED if you think you need anything else.
  - apps/kol/src/lib/payments/stripe.ts — `import "server-only"`. Lazy singleton, reads STRIPE_SECRET_KEY
    from env NEVER at module scope in a way that breaks the build when absent, and enforces the test-mode
    assertion above. + its test.
STEP 2 (commit `feat(checkout): order creation + payment intent`):
  - apps/kol/src/lib/checkout/actions.ts — `import "server-only"`. `beginCheckout(cartId)`:
    (a) load the buyer's ACTIVE cart via the RLS-scoped user client and re-derive items server-side —
        never trust an items array from the request body;
    (b) reuse an existing `pending` order for this buyer+store+cart if one exists, else call
        `create_order(store_id, items)` via the RLS-scoped user client (it is granted to `authenticated`);
    (c) create or retrieve the Stripe PaymentIntent with `idempotencyKey = order.id`, amount read from the
        ORDER's `subtotal_amount` (which the RPC computed from `products`) and currency from the order —
        never from the client;
    (d) stamp `stripe_payment_intent_id` onto the order via `createAdminClient()`;
    (e) return ONLY the client secret and the order id. Never return the secret key. Never log it.
STEP 3 (commit `feat(webhooks): stripe payment webhook`) — THE IRREVERSIBLE FILE:
  - apps/kol/src/app/api/webhooks/stripe/route.ts.
    - Verify the signature with `stripe.webhooks.constructEvent` and STRIPE_WEBHOOK_SECRET against the RAW
      body. An unverified or malformed event returns 400 and changes NOTHING. Never parse-then-verify.
    - `payment_intent.succeeded` -> set `orders.status='paid'` via the SERVICE ROLE, guarded by
      `where id = $1 and status = 'pending'`. This is the ONLY writer of `'paid'` in the entire system.
    - `payment_intent.payment_failed` -> leave the order `pending` and record nothing that implies payment.
    - Idempotent by construction: a replayed event updates zero rows and returns 200.
    - Never trust an amount, a buyer id, or a status from the event payload. Resolve the order by
      `stripe_payment_intent_id` and act only on your own stored state.
    - Structured JSON logging, one line per event, with NO secret, NO PII, and NO full payload.
STEP 4 (commit `test(checkout): payment security suite`) — this suite is what the Irreversible gate reads:
  - A client-supplied price is impossible: assert `create_order`'s signature has no price parameter and
    that `beginCheckout` derives the amount from the order row, not from its arguments.
  - A client cannot set `buyer_id`, `role`, or order `status`.
  - A buyer cannot UPDATE an order directly through PostgREST with their own JWT (live test).
  - A second identical `beginCheckout` does NOT create a second order (no double-charge).
  - A duplicated webhook delivery updates zero rows the second time.
  - A webhook with a bad signature changes nothing and returns 400.
  - A `sk_live_` key throws at construction.
  - A live end-to-end against Stripe TEST MODE: cart -> beginCheckout -> confirm the test PaymentIntent ->
    webhook -> order is `paid`. Clean up every row.

## Known blocker — handle it, do not stall on it
There is currently NO Stripe key in apps/kol/.env.local. Check before STEP 1.
- If present (and `sk_test_`/`pk_test_`): build and run everything, report real results.
- If absent: still build STEPS 1-4 in FULL — they are pure code and must be committed — then return
  PARTIAL with resume_point: "STEP 4 — live Stripe test-mode integration; needs STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET in apps/kol/.env.local".
  Do NOT fake a payment result. Do NOT hardcode a key. Do NOT skip the non-live security tests — those
  run without any key and they are the ones that matter most.

## Known-deferred — cite, do NOT build
- Inventory check at order time (N3). `create_order` has none. Adding it = new migration = Irreversible
  detour. Cite it; do not build it.
- Order status transition matrix (N2 / NEW-4) — `set_order_status` whitelists targets but has no
  from-state matrix. Owned by S7 in Wave 4. Cite it; do not build it.
- Refunds beyond `cancel_order` existing.

## Constraints
- TypeScript strict. Zod on every external input INCLUDING the webhook payload shape after signature
  verification. No migration, no RPC, no policy, no column.
- NEVER log, echo, or commit a secret. NEVER put a Stripe secret in a `NEXT_PUBLIC_` variable.
- Zero placeholder code, zero TODOs. No UI in this unit — that is B7b.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own. On an Irreversible unit, BLOCKED is the correct answer far more often
  than usual — use it.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
stripe-integration · payment-integration · web-security-testing

## Turn budget
~19-tool-use cap. COMMIT AFTER EACH STEP. On approach return PARTIAL naming the STEP.
STEP 4's non-live security tests are what the Irreversible gate reads — never leave them unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
State whether Stripe test keys were present, and confirm test-mode enforcement, in `summary`.
Session file: docs/08-agents_work/sessions/2026-07-21-backend-engineer-b7a-stripe-server.md (≤10 lines).
```

---

# BRIEF 12 — B7b · Checkout surface

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b7b-checkout-ui
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B7b — the checkout surface.
Risk tier: FULL (billing-adjacent surface holds it at Full minimum; you hold no secret and write no order).
Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2, S8, B6, and **B7a** must all be on `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/checkout/actions.ts | head -1
If it errors, STOP and return BLOCKED with "B7a not merged".

## Goal
Cart -> review -> pay, in curated KOL chrome, with the film minimized so focus is on price, reviews, and
paying. Real orders, Stripe TEST MODE, no real money.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b7b-checkout-ui -b feat/b7b-checkout-ui main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b7b-checkout-ui/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/checkout.md — your spec.
2. apps/kol/src/lib/checkout/actions.ts (post-B7a) — `beginCheckout`. Your ONLY path to a payment.
3. apps/kol/src/lib/cart/ (post-B6) — the cart you render.
4. apps/kol/src/components/blocks/product-showcase/ — the mini showcase for cart line items.
5. apps/kol/src/lib/renderer/HeroStage.tsx — how the film is minimized/paused for this state.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Never propose a client-set price, client-set `buyer_id`, client-set `role`, or
  client-set order `status`.
- Money = integer MINOR units + char(3) currency (default GBP). No floats.
Tables you touch: NONE directly. Everything goes through B7a's server actions and B6's cart actions.

## THE RULES THAT MATTER MOST HERE
- **You never send a price.** The cart holds product ids, quantities, and variations. `create_order` reads
  every price server-side from `products`. If your diff contains a money value being sent TO the server,
  it is wrong.
- **You never hold a Stripe secret.** Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and the client secret
  returned by `beginCheckout` ever reach the browser.
- **You never write an order status.** `'paid'` comes only from B7a's webhook. Your success state reflects
  what the server tells you; it never asserts payment on its own.
- **No double-charge.** Calling `beginCheckout` twice must not create two orders — B7a guarantees that
  server-side, and your UI must not fight it: disable the pay control while a request is in flight, and on
  a decline retry the SAME payment intent rather than restarting checkout.
- **Test mode is loud.** A visible, honest indicator that this is a test-mode payment taking no real money.
  It is a hard MVP constraint, not a footnote.

## What to build
- CTO PRE-APPROVAL: you MAY add `@stripe/stripe-js` + `@stripe/react-stripe-js` as production dependencies
  of apps/kol. No other new dependency is approved. Return BLOCKED if you think you need one.
- apps/kol/src/app/checkout/page.tsx — curated KOL chrome (NOT the maker's theme). The maker's world
  recedes; the film is minimized/paused.
- Cart review: mini `product-showcase` line items with mono/tabular prices, quantity, variation, and the
  subtotal — all rendered FROM the server-derived values, never recomputed in the browser as authoritative.
- Stripe Payment Element wired to the client secret from `beginCheckout`.
- ALL 4 STATES, no placeholders, no TODOs:
    empty   — empty cart -> "nothing here yet" with a path back to the world. Never a broken empty checkout.
    loading — a clear PROCESSING state during payment. Not a spinner-only screen; show real progress.
    error   — a declined or failed payment renders an inline, recoverable error with a retry, and NO
              double-charge and no duplicate paid order. The buyer must be able to retry without fear.
    success — advance to `THANK_YOU` (B8); the order is saved to the account.
- Back-transition: CHECKOUT -> PRODUCT_PAGE on cancel; the film re-expands.
- Low-urgency register: no countdowns, no deal-grid pressure, no scarcity chyrons. Reject the
  TikTok/Complex urgency vocabulary.
- Accessibility: the payment form is keyboard-navigable and labelled; errors are announced inline; no
  time-pressure UI.

## Constraints
- TypeScript strict. No migration, no RPC, no schema change, no direct DB write.
- Zero placeholder UI, zero TODOs, all 4 states.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nextjs-app-router-patterns · form-cro · error-handling-patterns

## Turn budget
~19-tool-use cap. Commit: (1) cart review surface + states, (2) Stripe Payment Element wiring,
(3) decline/retry handling + the no-double-charge UI guard. On approach return PARTIAL naming which.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b7b-checkout-ui.md (≤10 lines).
```

---

# BRIEF 13 — B8 · Thank-you moment

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-b8-thank-you
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit B8 — the thank-you moment (`THANK_YOU`).
Risk tier: LITE (frontend surface + one engine read + an RLS read-own order read; no write, est. 200-260 LOC).
Model: Fable 5. ONE unit.

## HARD PRECONDITIONS
Wave 2, W2-WIRE, SEED-W3, and **B7a** must all be on `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/checkout/actions.ts | head -1
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/index.ts | head -1
If either errors, STOP and return BLOCKED naming which.

## Goal
After a purchase, the maker's PERSONAL thank-you video plays. Not a receipt — the maker looking the buyer
in the eye. The order summary sits quietly below, secondary to the human moment.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/b8-thank-you -b feat/b8-thank-you main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/b8-thank-you/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## Read ONLY these
1. docs/04-features/specs/thank-you-moment.md — your spec.
2. apps/kol/src/components/blocks/thank-you/index.tsx — the shipped block with its `video-message` and
   `text+media` variants.
3. apps/kol/src/lib/store-config/schema.ts — `ThankYouBlockSchema`. Note `props.message` is
   `z.string().optional()` and its comment already states the contract: "v1.3 — OPTIONAL maker-authored
   thank-you words (D10: voice = the maker's OWN words, never AI-generated). Omitted -> the renderer falls
   back to neutral platform copy, never a fabricated quote."
4. apps/kol/src/lib/engine/index.ts — `createEngineDeps`.
5. supabase/migrations/20260721000006_commerce.sql — the `orders_buyer_read` / `order_items_buyer_read`
   SELECT-only policies. Your read path.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. Never propose a
  client-set price, client-set `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
Tables you READ: `orders` + `order_items` (RLS READ-OWN only — `orders_buyer_read`), `videos` (via engine).
You WRITE nothing, and you NEVER write an order status. `'paid'` comes only from B7a's webhook.
No migration, no RPC, no policy.

## THE TWO INVARIANTS YOU CONSUME AND MUST NOT BREAK

### 1. Thankyou-only eligibility — structural, inherited from P7
A `thankyou` clip is tagged `purpose: ['thankyou']` AND `page_eligibility: ['thankyou']` and NOTHING ELSE.
P7's Zod enforces it at write time; MIG-CHECK enforces it at the database; the engine's positive
`page_eligibility @> {thankyou}` predicate makes THANK_YOU the ONLY state where such a clip surfaces.
This is the exact mirror of B1's feed exclusion. **You consume that contract — you never re-implement it,
never add a blocklist, and never filter for `thankyou` yourself.** Just ask the engine for the THANK_YOU
state and render what it returns.

### 2. Message honesty (D10) — load-bearing, and it is a test
The `text+media` fallback shows the maker's OWN `props.message` if they authored one, and NEUTRAL PLATFORM
COPY if they did not. **`props.message` MUST be maker-authored only. It must NEVER be AI-generated and
never a fabricated maker quote.** You own a test asserting no fabricated maker quote is ever rendered:
with `props.message` absent, the rendered output must contain the neutral platform copy and must NOT
attribute any words to the maker.
Note: `ANTHROPIC_API_KEY` is deliberately unprovisioned and P7 is merged dark. There is no LLM available to
you and you must not add one. If you find yourself wanting to generate a message, that is the exact failure
this invariant exists to prevent — return BLOCKED.

## What to build
- apps/kol/src/app/thank-you/[orderId]/page.tsx (or match B7b's post-payment routing if it established one).
- Engine: `selectVideos` with `state: "THANK_YOU"`, `storeScope = the order's store_id`, `limit: 1`.
- `thank-you` block, `video-message` variant: the personal clip plays, SOUND OPT-IN (sound off until
  opt-in — the hard tone line), captions available.
- Order summary renders QUIETLY BELOW, secondary to the human moment, read from `orders` + `order_items`
  under RLS read-own. A quiet "view order" link toward order history (B9, Wave 5) — render the link; B9's
  destination is not your unit.
- ALL 4 STATES, no placeholders, no TODOs:
    empty   — no clip AND no authored message -> the neutral `text+media` fallback (warm neutral copy + a
              still). **NEVER a bare "Order confirmed" receipt.**
    loading — clip poster + shimmer, while the ORDER SUMMARY RENDERS IMMEDIATELY BELOW. The confirmation
              never waits on the video. Assert this: the summary must paint before the clip.
    error   — the clip fails -> fall back to `text+media`. The order confirmation is NEVER blocked by media.
    success — the personal video plays (sound opt-in), the order is saved, the "view order" link is live.
- `--ease-kol` reveal; `prefers-reduced-motion` -> instant fade. "View order" keyboard reachable.
- The maker's block renders in THEIR theme/voice; the order summary sits in curated chrome below. The human
  moment leads; the receipt recedes.

## Constraints
- TypeScript strict. NO new dependency — in particular no LLM client and no animation library. Return
  BLOCKED if you think you need one.
- No migration, no RPC, no schema change, no write of any kind.
- Zero placeholder UI, zero TODOs, all 4 states.
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
react-ui-patterns · nextjs-app-router-patterns · wcag-audit-patterns

## Turn budget
~19-tool-use cap. Commit: (1) the thank-you surface + engine THANK_YOU call, (2) the order summary +
summary-paints-first behaviour, (3) the fallback chain + the no-fabricated-quote test. On approach return
PARTIAL naming which. The honesty test is load-bearing — never leave it unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Session file: docs/08-agents_work/sessions/2026-07-21-frontend-engineer-b8-thank-you.md (≤10 lines).
```

---

# BRIEF 14 — FILM-LAYER · The persistent film layer (AMENDMENT A)

```
subagent_type: frontend-engineer
model: fable            # Fable 5 — claude-fable-5
name: frontend-engineer-film-layer
isolation: worktree
---
You are the Fable design-build worker for KOL Wave 3, unit FILM-LAYER — the persistent film architecture.
Risk tier: FULL (est. 400-600 LOC, and you REWRITE a QA-passed Wave-0 invariant). Model: Fable 5. ONE unit.

This is the single biggest piece of Wave-3 frontend work. Five units are blocked on you. Nothing else in
the buyer journey is buildable until this lands.

## HARD PRECONDITION
Wave 2 must be merged to `main`. Verify:
  git -C /Users/adamks/VibeCoding/etsyc show main:apps/kol/src/lib/engine/eligible.ts | head -1
If it errors, STOP and return BLOCKED with "Wave 2 not merged to main".

## Why you exist — read this before you touch code
Wave 0 shipped `HeroStage`, which keeps ONE `<video>` mounted at a stable tree position while the world
folds and unfolds around it. That works, it is tested, and it is CORRECT — for one world.

It cannot survive the real feed, for two independent reasons:

1. **Cross-tree.** `HeroStage` renders INSIDE `StoreWorld`, scoped to one `config` (`data-store={config.storeId}`).
   The real FEED is cross-maker — `eligible.ts` runs `newestPerStore(pool)` with no `storeScope`, so the feed
   is N sibling cards from N different stores. Tapping card #7 must turn THAT card's film into store #7's
   world hero. Those are different component trees, and React cannot relocate a host DOM node across parents
   without unmounting it. No React primitive does this. `layoutId` does not either — it cross-fades two
   nodes and animates the rect, which FAILS the invariant rather than satisfying it.
   `view-transition-name` on `.kol-hero-stage` does not rescue it: the View Transitions API morphs
   SNAPSHOTS — it captures old and new as images — so a `<video>` under a view transition shows a static
   frozen frame for the whole morph, which is exactly what the invariant forbids.
   `stages.ts` already admits this in its own comment: "FEED/GROWN belong to the feed surface (B1) in the
   full app; the renderer carries them so the unfold can be simulated." Wave 0 SIMULATES feed and grown
   inside one world.
2. **Src mutation pauses.** `FilmFrame` renders `<video src={clip.src}>`. Changing `src` on a live `<video>`
   runs the media load algorithm: `readyState` resets, playback stops, poster or black flashes. B4 needs the
   film to swap to process/atmosphere clips mid-browse WITHOUT pausing. A single video element cannot do it.

## Goal
One film, mounted once, at app root — fixed-position, FLIPping between rects that screens publish, with two
stacked video buffers cross-fading so a clip change never shows a paused or black frame.

## THE BINDING AC (CPO-reframed — this exact wording, not the old one)
"The film frame never unmounts and never shows a paused or black frame."
The OLD wording — "the `<video>` element never unmounts" — is RETIRED. Do not write a test asserting a
single `<video>` node; A/B buffers deliberately use two, and such a test would fail a correct implementation.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/film-layer -b feat/film-layer main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/film-layer/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Read ONLY these
1. docs/06-design/KOL-wave3-design-direction.md §5.1 (the tokens you own), §5.2 (the edge table — BINDING
   choreography), §5.3 (the complete reduced-motion contract), §6 (the Film Layer mechanism). Your spec.
2. apps/kol/src/lib/renderer/HeroStage.tsx, hero-persistence.ts, stages.ts, StoreWorld.tsx — what you are
   demoting and why. Read all four before changing one line.
3. apps/kol/src/lib/renderer/hero-persistence.test.tsx — the Wave-0 suite you must REWRITE, not delete.
4. apps/kol/src/components/media/FilmFrame.tsx — the shipped film primitive, its scroll gate, its poster-first
   behaviour, its mute/captions controls. The Film Layer inherits all of that behaviour.
5. apps/kol/src/app/globals.css lines ~186-230 (`.kol-hero-stage`, `.kol-hero-stage-inner`,
   `.kol-hero-docked`, the `[data-world-stage]` rules) — the CSS you are moving and generalising.

## Build order — commit in EXACTLY this order
STEP 1 (commit `feat(motion): wave-3 buyer-state transition tokens`):
  - globals.css `:root` — add EXACTLY the five tokens from design-direction §5.1:
      --dur-grow: var(--dur-reveal);  --dur-ungrow: 405ms;  --dur-dock: 440ms;
      --dur-swap: 120ms;  --return-ratio: 0.78;
    You OWN this block. B2-B5 consume it and must never add to it — that is why it is here and not in
    their briefs (four parallel branches editing globals.css is a guaranteed conflict).
STEP 2 (commit `feat(film): film layer with A/B buffers`):
  - apps/kol/src/components/film/FilmLayer.tsx — ONE player, mounted ONCE, from app/layout.tsx.
    `position: fixed`. Holds TWO stacked `<video>` buffers (A/B). Exposes, via context:
      publishRect(slotId, rect)  — a screen tells the layer where the film should be
      setActiveSlot(slotId)      — a screen claims the film; the layer FLIPs to that slot's rect
      swapClip(src, poster)      — loads into the INACTIVE buffer, waits for `canplay`, cross-fades
                                   over --dur-swap, then makes it active. NEVER a black frame, never a pause.
    Inherit FilmFrame's behaviour: poster-first, muted until opt-in (the hard tone line), captions toggle,
    quiet fallback to the poster on decode/404. Do NOT fork FilmFrame's controls — extract and share them.
  - apps/kol/src/components/film/useFilmSlot.ts — the hook a screen calls to register a slot, publish its
    rect on layout and on resize, and claim the film.
STEP 3 (commit `refactor(renderer): demote HeroStage to a slot registrar`):
  - HeroStage keeps `data-layout-id="hero-video"`, keeps pinning its in-flow height so the world never
    reflows, and now PUBLISHES ITS RECT instead of owning a `<video>`. It renders no film element.
  - Move the dock FLIP out of HeroStage and into the Film Layer as the `WORLD_BROWSE <-> NARRATE_SHRINK`
    edge. B5 will publish a corner rect; it will not reimplement the FLIP.
  - StoreWorld's hero-persistence guarantee is preserved in substance and relocated in mechanism. Its
    defensive "only the first hero-video mounts" behaviour must survive.
STEP 4 (commit `feat(film): the edge table`):
  - Implement design-direction §5.2 EXACTLY: grow (`--dur-grow`, `--ease-kol`), unfold (`--dur-unfold`,
    900ms hard cap, `--ease-cinematic`), dock (`--dur-dock`, `--spring-video`), undock and ungrow at
    `--return-ratio` x forward. WORLD_OPEN -> WORLD_BROWSE has NO transition — it is a scroll, not an event.
    Do not invent an edge that is not in that table.
  - Reduced motion, per §5.3, in full: transforms and parallax removed; the change becomes an opacity
    cross-fade at `--dur-state`; the layer SNAPS to the new rect; AND THE FILM KEEPS PLAYING. The FLIP must
    SKIP its invert step rather than run it at 0.01ms, which would produce a visible jump.
STEP 5 (commit `test(film): cross-tree persistence + buffer swap`):
  - REWRITE apps/kol/src/lib/renderer/hero-persistence.test.tsx against the Film Layer. Every existing
    behavioural guarantee must still be asserted; the mechanism it asserts against changes.
  - Add apps/kol/src/components/film/__tests__/film-layer.test.tsx. MANDATORY named tests — QA-Lead will
    grep for these exact strings:
      "the film survives a cross-tree handoff between two different store worlds"
        — render a feed of N>=2 cards from DIFFERENT store configs, claim the film from card A, then from
          card B, and assert the film frame never unmounted and playback never stopped. THIS IS THE CASE
          THE WAVE-0 SUITE COULD NOT TEST, and it is the whole reason this unit exists.
      "a clip swap never shows a paused or black frame"
        — swapClip cross-fades A to B; assert the outgoing buffer is still playing until the incoming one
          reports canplay, and that neither a poster flash nor a paused state is observable.
      "reduced motion snaps the rect and keeps the film playing"
      "every edge duration matches the edge table"

## Constraints
- TypeScript strict. NO new dependency — in particular NO framer-motion / motion. An animation library
  would not have solved the cross-tree problem either; the mechanism is an imperative FLIP plus CSS.
  Return BLOCKED if you think you need one.
- Do NOT delete the Wave-0 hero-persistence guarantees. You are relocating a QA-passed invariant, not
  dropping it. If a guarantee cannot be preserved, return BLOCKED and say which — do not quietly weaken it.
- No migration, no RPC, no schema change, no DB access of any kind. This unit is pure render layer.
- Zero placeholder UI, zero TODOs.
- Accessibility: axe-core clean; the fixed film layer must not trap focus and must not cover a CTA
  (B5 owns the exclusion-zone rule; you must not make it impossible).
- Auto-fix type errors and missing imports (Deviation Rules 1-3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint`. Every renderer and block test must
  still pass, or be rewritten with its guarantee intact and the rewrite justified in decisions_made.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
vercel-react-view-transitions · emilkowal-animations · react-patterns

## Turn budget
~19-tool-use cap and this is the largest unit in the wave — it is pre-split into 5 commits for exactly that
reason. COMMIT AFTER EACH STEP. On approach, return PARTIAL with resume_point naming the STEP.
STEPS 2 and 3 are what five other workers are blocked on. STEP 5's cross-tree test is the reason this unit
exists — never leave it unlanded.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
List in `decisions_made` every Wave-0 guarantee you relocated and how you preserved it.
Session file: docs/08-agents_work/sessions/2026-07-22-frontend-engineer-film-layer.md (≤10 lines).
```

---

*CTO · session `cto-wave3-packet` · 2026-07-21, amended 2026-07-22. No code written; fifteen briefs
produced; no workers spawned (nested Task blocked by design in this session). Wave 3 remains gated on the
Wave-2 merge, and now additionally on OQ-1 and OQ-3 sign-off.*
