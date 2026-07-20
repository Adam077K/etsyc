# Store-Engine Spine — Spec Pack (P1–P8, P12)

*Batch 1 of the Phase-5 spec dispatch. ONE pack file covering nine load-bearing features as nine `## P#` sections. Rationale (CEO packet §A1): all nine bind to the D4 (store) + D5 (video) spines and share the store-config v1.3 contract; splitting them fragments the contract. Each `## P#` section fills `_TEMPLATE.md` top-to-bottom and carries its own Acceptance Criteria, all-4-states, and risk tier. Engine/schema contracts are LOCKED — cited, never redesigned.*

---

## File-level Metadata

| Field | Value |
|---|---|
| **Pack Name** | Store-Engine Spine (P1 Auth · P2 Account & Profile · P3 Store-config schema+validator · P4 Store renderer · P5 Section/block library · P6 Video engine · P7 Video-profile tagging · P8 Curated design rails · P12 Voiceover engine) |
| **Pack Slug** | `store-engine-spine` |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker W1) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 6 — Build |
| **Surface** | Mostly KOL platform (curated `theme.kind:"curated"` chrome) + the shared render/engine layer. The renderer (P4) and block library (P5) additionally serve **custom** seller shops (`theme.kind:"custom"`, D15). Called out per-section. |
| **Source contracts** | `docs/03-system-design/store-config.schema.md` (v1.3-LOCKED) · `docs/03-system-design/KOL-video-engine-spec.md` (ADR-0003) · `docs/03-system-design/KOL-ai-pipeline-spec.md` (ADR-0002) · `docs/04-features/KOL-block-catalog.md` · `docs/01-foundation/KOL-v2-concept-lock.md` (D1–D16) · dispatch packet Part B §B0/§B1 |

> **Grounding note (packet §A GAP).** `.claude/memory/USER-INSIGHTS.md` is empty. This is an internal, team-seeded MVP (D12: 4 teammate worlds — Adam, Shaian, Thea, Megan — are the real makers/buyers). Problem statements are therefore grounded in the **concept-lock buyer/seller journeys** and the founder **NARRATIVE**, quoted verbatim. No customer quotes are fabricated. Real-user "customer language" is backfilled at D13 (real-user opening).

---

## Global Contract Rules (Part B §B0 — apply verbatim to all nine sections)

These CTO data-contract rules govern every section below. Each section's Technical Requirements bind to them and add only what §B1 authorizes — no invented tables, columns, RPCs, or D#s.

1. **RLS is the ONLY boundary.** Any authed user hits PostgREST directly with their JWT. No restriction may be "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set `buyer_id`, client-set `role`, or client-set order `status`.
2. **10 SECURITY DEFINER functions:** `create_order`, `cancel_order`, `set_order_status`, `get_public_profile`, `handle_new_user`, `guard_profile_role`, `enforce_review_seller_scope`, `enforce_real_maker_badge`, `guard_thread`, `guard_commission`. All `SET search_path=''`, schema-qualified. Writes `REVOKE EXECUTE FROM public` + `GRANT EXECUTE TO authenticated`; `get_public_profile` also `GRANT ... TO anon`.
3. **6 triggers:** `on_auth_user_created`→`handle_new_user`; `profiles_role_guard`→`guard_profile_role`; `reviews_seller_scope_guard`→`enforce_review_seller_scope`; `badges_real_maker_guard`→`enforce_real_maker_badge`; `threads_guard`→`guard_thread`; `commissions_guard`→`guard_commission`.
4. **Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`** (anon is also null uid; N1). Privileged flows on service key: `orders.status='paid'` (Stripe webhook), verification resolution, role→`seller`, `buyer_signals` inserts (engine).
5. **Money = integer minor units + `char(3)` currency (default GBP).** No floats.
6. **camelCase (store-config) ↔ snake_case (tables)** are the same fields at the sync boundary; the video engine queries snake_case tables.
7. **Video config↔table sync (OQ-2):** `videos`/`video_profiles` are the CANONICAL queryable source. `stores.config.media.clips[].id` MUST equal a `videos.id` owned by the same store — enforced by the **P3 Zod validator at write time** (the DB can't enforce ids inside jsonb). Config persist + `videos`/`video_profiles` upsert happen in ONE transaction.

**Risk-tier legend (CLAUDE.md 4-tier gate):** `Trivial` typo/1-line · `Lite` <300 LOC, no API/DB/auth · `Full` API/DB/auth/billing OR ≥300 LOC · `Irreversible` new DB migration / workflow / billing flow / agent-def. Per §A2.8, every "Data need" table = **Irreversible** (database-engineer runs before backend-engineer). Auth (P1) + checkout (B7, other batch) are Full minimum. Stripe is **test-mode** (real orders, no real money — D6).

---
---

## P1 — Auth (email/OTP sign-in + role identity)

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Auth — email/OTP sign-in and buyer/seller role identity |
| **Feature Slug** | `auth` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D2** (Auth in scope: Supabase Auth, buyers + sellers) |
| **Surface** | KOL platform — curated chrome (`theme.kind:"curated"`) |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 10 `(assumed — low confidence)` | Every buyer and seller across the 4 seed worlds + first cohort passes through auth. Reach assumption per §A2.7 = "4 seed worlds + first cohort". |
| **Impact** | 3 `(fact)` | Massive — auth is the RLS trust boundary; personalization (`buyer_signals`), orders, and shop ownership all hang off it (D2). |
| **Confidence** | 90% `(fact)` | Supabase Auth is a proven primitive on the locked stack; behavior is well understood. |
| **Effort** | `(ask CTO)` person-weeks | Includes `handle_new_user` trigger + `guard_profile_role` trigger + RLS anchor. Estimate deferred to CTO per §A2.7. |
| **RICE Score** | `(R×I×C)÷E` — pending Effort | Foundational; sequence first regardless of numeric score. |

**MoSCoW:** **Must Have** — nothing personalized, owned, or ordered works without it.

**Why this priority?** Auth is the anchor of the RLS trust boundary that gates the engine's `buyer_signals` reads (P6) and every own-row read across the pack. It must land before P2, P6, and any billing flow.

### Overview

Email/OTP sign-in via Supabase Auth (D2) that establishes a persistent identity and a `buyer | seller` role on `profiles`, so a buyer's profile/orders/personalization persist and a seller's shop is tied to them. It enables everything downstream: personalization signals, orders tied to accounts, and shop ownership. Reverses the earlier "skip auth" stance (D2).

### Problem

The concept-lock buyer journey (step 8) requires "order saved to account," and D2 locks auth *in* precisely to give buyers a "persistent buyer profile (real personalization signal) + orders tied to accounts." Without a known identity and a correct role flag, the product cannot personalize discovery (P6 relationship term reads per-buyer `buyer_signals`), cannot tie an order to a buyer, and cannot scope a seller to their own shop. The pain, in the product's own terms: shopping should feel like "a relationship" (concept-lock one-breath), and a relationship needs both parties to be *known*.

### Proposed Solution

**UX Flow:**

1. Visitor lands logged-out (curated chrome); chooses "Sign in / Join" and enters their email.
2. Supabase Auth emails a one-time code (OTP); the visitor enters it.
3. On first sign-in, `on_auth_user_created` fires `handle_new_user`, which seeds a `profiles` row with role **FORCED `'buyer'`** and a null handle — the client never sets role or handle at signup.
4. Session persists; the visitor lands role-correctly (buyer → discovery feed; seller → seller dashboard once their role has been elevated by the service-role onboarding step).
5. A buyer who later completes seller onboarding is elevated to role `'seller'` **only** by the service-role onboarding step — never by client metadata.

### User Stories

- As a **buyer**, I want email/OTP sign-in so that my profile, orders, and personalization persist across visits.
- As a **seller**, I want to be known as a seller so that my shop, products, and orders are tied to me.
- As **either role**, I want my session to persist so that I am not re-challenged on every visit.

### Acceptance Criteria

**Happy Path**
- Given a valid email, when the visitor requests a code and enters the correct OTP, then a session is created and they land on the role-correct destination (buyer→feed, seller→dashboard).
- Given a first-ever sign-in, when `on_auth_user_created` fires, then `handle_new_user` seeds `profiles` with `role='buyer'` and null handle, and no client-supplied role/handle is honored.

**Error State** *(error = quiet + inline + recoverable)*
- Given a wrong or expired OTP, when the visitor submits it, then an inline, non-blocking error appears with a "resend code" affordance; the rest of the screen stays usable.

**Edge Case / Security**
- Given a client attempts to set `role` (or `handle`) via auth metadata at signup, when the row is created, then `profiles_role_guard`→`guard_profile_role` blocks the client role change and role remains `'buyer'`.
- Given a role elevation to `'seller'`, when it is requested, then it succeeds **only** through the service-role onboarding step (the guard tests `auth.role()='service_role'` explicitly, never `auth.uid() IS NULL` — N1).
- Given an authed user queries any table, when RLS evaluates, then they read only their own rows (the RLS anchor that gates the engine's `buyer_signals` reads).

**All-4-states**
- *empty* = logged-out entry state; *loading* = "verifying code" while the OTP is checked; *error* = bad/expired code inline + resend; *success* = session established + role-correct landing.

### UX / UI Notes

**Key Interactions:** email entry → OTP entry → verifying → landing. Curated chrome only (this is KOL's own product UI, `theme.kind:"curated"`); no seller brand freedom on the auth surface.

**4 states:**
- **Empty:** logged-out sign-in/join screen (not a blank — a warm entry point).
- **Loading:** "verifying code" state with the submit control disabled; skeleton/spinner scoped to the verify action, never a full-page block.
- **Error:** bad/expired code → inline message beneath the field + "resend code"; recoverable.
- **Success:** session set; redirect to role-correct landing.

### Technical Requirements

**Backend / Auth**
- Supabase Auth email/OTP. No password store owned by us.
- Trigger `on_auth_user_created` → SECURITY DEFINER `handle_new_user`: seeds `profiles` with role FORCED `'buyer'`, null handle. `SET search_path=''`, schema-qualified.
- Trigger `profiles_role_guard` → SECURITY DEFINER `guard_profile_role`: blocks any client-driven role change; the guard tests `service_role` explicitly.
- Role→`'seller'` is a **service-role onboarding step only** (never client metadata).

**Frontend**
- Logged-out entry, OTP entry, verifying, and role-correct landing (curated chrome). Session persistence via Supabase client.

**Database (Data need — Irreversible; database-engineer before backend-engineer)**
- Tables: `auth.users`; `profiles(role user_role, handle, display_name, avatar_url, bio)`.
- App must NOT set `role` from client metadata or set `handle` at signup.
- RLS anchor: authed user reads only own rows — this is the boundary the engine's `buyer_signals` reads depend on (P6/§5.4).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Security** | Role/handle unforgeable from the client; guard tests `service_role` not null-uid; RLS own-row only | Guard unit test asserting a client role change is rejected; RLS policy test |
| **Performance** | OTP verify round-trip feels instant; verifying state ≤ perceptible threshold | Manual + auth latency check |
| **Accessibility** | OTP field + resend keyboard-navigable; inline error announced (ARIA live) | axe-core + screen-reader pass |
| **Reliability** | Expired/invalid code never dead-ends; resend always available | E2E of the error path |

### Dependencies

**Upstream:** Supabase Auth (external service; Done — on the locked stack). `profiles` table + guards migration (Irreversible; database-engineer).
**Downstream:** P2 (profile CRUD + `buyer_signals` write path), P6/§5 (relationship reads depend on the RLS anchor), B7 checkout (order tied to account), S7 seller dashboard (own-shop scope), B9/B13 (own-row reads).

### Out of Scope

- Password auth, social OAuth providers (email/OTP only for MVP).
- The seller-role elevation *UI/flow* (that is seller onboarding S1/S2, Batch 3) — P1 only provides the service-role elevation path and guard.
- Any client-set role/handle path (structurally forbidden).

### Risk Assessment — **Tier: Full / Irreversible** (RLS is the trust boundary for the engine's `buyer_signals` reads; introduces migration + triggers)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Client forges role/handle | M | H | `guard_profile_role` trigger (DB-enforced); `handle_new_user` forces `'buyer'` |
| Service-role check written as null-uid | M | H | Guard tests `auth.role()='service_role'` explicitly (N1); asserted in a guard test |
| OTP delivery failure blocks entry | L | M | Resend affordance; inline recoverable error |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Sign-in completion rate | N/A | ≥ 95% of OTP starts | Internal seed testing |
| Forged-role attempts succeeding | N/A | 0 | Continuous (guard test) |

### Rollout Plan

Internal seed testing with the 4 teammate worlds first; auth is not feature-flagged (foundational). **Rollback:** migration is additive; guards can be disabled only by a new migration (Irreversible). Rollback trigger = auth outage; decision maker = CTO. Data impact: none destructive.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate (person-weeks) for triggers + RLS anchor | CTO | Phase-5 review |
| 2 | Exact seller-role elevation trigger point in S1/S2 onboarding (cross-ref Batch 3) | CPO/CTO | Batch 3 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P2 — Account & Profile

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Account & Profile — persistent buyer profile + seller settings, and the `buyer_signals` write path |
| **Feature Slug** | `account-profile` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D2** |
| **Surface** | KOL platform — curated chrome |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 9 `(assumed — low confidence)` | Every signed-in buyer/seller has a profile; write path feeds P6+/B13 (4 seed worlds + first cohort). |
| **Impact** | 3 `(fact)` | The `buyer_signals` write path is the input to relationship ranking (D16-7); profile is the personalization anchor. |
| **Confidence** | 80% `(est.)` | Profile CRUD is routine; the signal write-path contract is the load-bearing, less-routine part. |
| **Effort** | `(ask CTO)` person-weeks | Includes `get_public_profile` RPC + `buyer_signals` insert path (service-role). |
| **RICE Score** | pending Effort | — |

**MoSCoW:** **Must Have** — the signal write path is a hard dependency for P6+ and B13.

**Why this priority?** Ships right after P1; the `buyer_signals` write path must exist before relationship ranking (P6+) or follow/save (B13) can produce anything to rank on.

### Overview

A persistent profile that personalizes discovery for buyers and ties settings to a shop for sellers (D2), plus the **write path for `buyer_signals`** that downstream relationship ranking (P6+) and follow/save (B13) depend on. Cross-user profile reads go through a single RPC that returns exactly one row for a known id.

### Problem

D2 locks auth in for a "persistent buyer profile (real personalization signal)." The concept-lock says shopping should be "a relationship" — and a relationship is built from remembered signals. The video-engine spec §5 defines `Relationship` as per-buyer affinity aggregated from `buyer_signals`; that log has to be *written* somewhere honest and RLS-safe. Without a profile and a correct signal write path, personalization has no substrate and cross-user profile reads risk leaking PII (`bio`).

### Proposed Solution

**UX Flow:**

1. A new signed-in buyer sees profile prompts (display name, avatar, optional bio) — empty-as-invitation, not a blank form.
2. The buyer edits and saves; validation is inline.
3. Cross-user profile views (e.g., a maker's public profile) read through `get_public_profile(uuid)` — never `SELECT *` on `profiles` (base-table `bio` is RLS-gated PII; the enumerable `public_profiles` view was removed, NEW-1).
4. Buyer interactions elsewhere (visit/save/follow/etc.) write `buyer_signals` rows via the service-role path; the buyer reads only their own signal rows.

### User Stories

- As a **buyer**, I want a persistent profile so that discovery is personalized to me over time.
- As a **seller**, I want profile/settings tied to my shop so that my identity is consistent.
- As a **buyer**, I want my personalization signals to be private so that only I (and the server engine) can see them.

### Acceptance Criteria

**Happy Path**
- Given a signed-in buyer, when they edit and save profile fields, then the row updates and the change is reflected on next read.
- Given a cross-user profile view for a known id, when `get_public_profile(uuid)` is called, then it returns **exactly one** row (never a set) and never exposes RLS-gated PII.

**Error State**
- Given invalid profile input, when the buyer saves, then inline validation errors show and no partial write occurs.

**Edge Case / Security**
- Given a client attempts `SELECT *` on `profiles` cross-user, when RLS evaluates, then PII (`bio`) is not returned — cross-user reads must use `get_public_profile`.
- Given a `buyer_signals` insert, when it is written, then it is written via the **service-role** path (buyer cannot self-insert arbitrary signals); the buyer can read only their own rows.

**All-4-states**
- *empty* = new-profile prompts; *loading* = save-in-flight; *error* = validation inline; *success* = saved and reflected.

### UX / UI Notes

**Key Interactions:** edit → save → reflected. Curated chrome.
**4 states:** empty = guiding prompts for a new profile (empty ≠ blank); loading = save-in-flight with disabled submit; error = inline field validation; success = saved confirmation.

### Technical Requirements

**Backend**
- SECURITY DEFINER `get_public_profile(uuid)` for cross-user reads; `GRANT EXECUTE TO authenticated` and `TO anon`; returns exactly one row for a known id.
- `buyer_signals` inserts via service-role (never client-set); reads own-only under RLS.

**Frontend**
- Profile CRUD screen (curated chrome), settings; seller settings tie to shop.

**Database (Data need — Irreversible)**
- Tables: `profiles`; `buyer_signals(subject_type signal_subject, subject_id, signal_type, weight)`.
- App must NOT `SELECT *` on `profiles` cross-user (base-table PII `bio` RLS-gated; `public_profiles` view removed, NEW-1).
- `buyer_signals`: read-own-only; inserts service-role.

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Security** | Cross-user reads via RPC only; `bio` never leaks; signals private + service-role write | RLS policy test; RPC returns single row |
| **Performance** | Profile save feels instant | Manual latency check |
| **Accessibility** | Form fields labeled, errors announced | axe-core + screen reader |
| **Privacy** | `buyer_signals` never sent to the browser | Server-only read assertion (P6/§5.4) |

### Dependencies

**Upstream:** P1 (auth + RLS anchor) — Done-after-P1.
**Downstream:** P6+ relationship ranking (reads `buyer_signals`), B13 follow/save (writes `buyer_signals`), video-engine §5.

### Out of Scope

- The follow/save UI that *emits* signals (B13, Batch 2b) — P2 only guarantees the write path and privacy contract.
- Relationship aggregation/scoring math (P6+ / video-engine §5).

### Risk Assessment — **Tier: Full** (DB + RPC + privacy boundary)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PII (`bio`) enumeration cross-user | M | H | `get_public_profile` RPC only; `public_profiles` view removed (NEW-1) |
| Client forges `buyer_signals` | M | H | Service-role insert path only; own-row read RLS |
| `get_public_profile` returns a set | L | M | RPC id-keyed, asserted to return exactly one row |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Profile completion (buyers) | 0% | ≥ 60% of signed-in buyers | 30 days post real-user open (D13) |
| Cross-user PII leaks | N/A | 0 | Continuous |

### Rollout Plan

Ships with P1. Not flagged. **Rollback:** additive migration; RPC/policies revertable only via new migration (Irreversible for schema). Rollback trigger = privacy defect; decision maker = CTO.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate incl. RPC + signal path | CTO | Phase-5 review |
| 2 | Which profile fields are seller-only vs shared | CPO | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P3 — Store-config schema + validator

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Store-config schema + Zod validator (the D4 spine contract) |
| **Feature Slug** | `store-config-validator` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D4** (section/block library + per-maker JSON config, one renderer) |
| **Surface** | Contract layer — serves both KOL curated worlds and custom seller shops |
| **Contract source** | `store-config.schema.md` (whole doc, v1.3-LOCKED); AI-pipeline §5.4 (emit shape it mirrors) |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 10 `(fact)` | Every world (hand-built and AI-drafted) *is* a validated config; every read/write passes the validator. |
| **Impact** | 3 `(fact)` | It is *the* contract — referential integrity, the curated-enum invariant, and OQ-2 sync all live here. |
| **Confidence** | 85% `(est.)` | The schema is v1.3-LOCKED; the validator's OQ-2 referential responsibility is the subtle part. |
| **Effort** | `(ask CTO)` person-weeks | Zod schema for all top-level keys + discriminated union + referential integrity pass. |
| **RICE Score** | pending Effort | Sequence before P4/P5 (they read validated config). |

**MoSCoW:** **Must Have** — the renderer, AI drafter, and every world depend on it.

**Why this priority?** It is the single JSON contract every world conforms to; nothing renders or drafts safely until it validates.

### Overview

One Zod-validated JSON contract (`stores.config jsonb`, versioned in `store_versions`) that every maker world — hand-built or AI-drafted — conforms to (D4). It enforces the store-config v1.3 shape exactly, owns **referential integrity** (the DB can't check ids inside jsonb), enforces the curated-enum invariant for `kind:"curated"` only, and requires custom themes to carry a passing critic score before leaving `draft`.

### Problem

D4 locks a store engine where "AI emits DATA not code" and "hand-built + AI worlds share one renderer." That only holds if there is one contract both sides satisfy and one validator that guarantees a config is safe to render. The schema doc states the invariants (exactly one `hero-video`, order-significant `blocks` with stable ids, every `bindings.*` resolves); §B0.7/OQ-2 states that `config.media.clips[].id` must equal an owned `videos.id` — and "the DB can't enforce ids in jsonb," so the validator owns it. Without this validator, a world can reference a clip/product that doesn't exist, or a seller shop can publish an uncritiqued custom theme — both break the "never slop / trust must be honest" guardrails.

### Proposed Solution

**UX Flow (developer/system-facing contract; no direct end-user UI):**

1. On every config read/write, the Zod schema validates the whole object against store-config v1.3 (all top-level keys: `schemaVersion·storeId·maker·theme·media·products·voiceovers·blocks·meta`).
2. `theme` validates as a **discriminated union on `kind`** (`Curated | Custom`). For `kind:"curated"`, `paletteId`/`fontPairingId`/`motionPreset` must be enum members; for `kind:"custom"` the curated-enum constraint does NOT apply (the guarantee is the AA gate + critic).
3. **Referential integrity (OQ-2, validator-owned):** every `blocks[].bindings.*` id and every `media.clips[].id` resolves; each `media.clips[].id` equals a `videos.id` owned by the same store; every `product_links` / `productIds` resolves to a real product.
4. Structural invariants: exactly one `hero-video` block; `blocks` order-significant with stable ids.
5. Custom-theme gate: a `kind:"custom"` config must carry a passing `meta.criticScore` before `meta.status` may leave `draft`.
6. Config persist + `videos`/`video_profiles` upsert commit in ONE transaction (§B0.7).

### User Stories

- As the **AI drafter (S3)**, I want a schema to emit against so that my output is guaranteed renderable.
- As a **hand-builder / co-editor (S4)**, I want writes validated so that I can't save a world that references missing media.
- As the **platform**, I want the custom-theme critic gate enforced so that a seller shop can't publish uncritiqued (D9→D15).

### Acceptance Criteria

**Happy Path**
- Given a config matching store-config v1.3, when it is validated, then it passes and persists (config + `videos`/`video_profiles` upsert in one transaction).
- Given `theme.kind:"curated"`, when `paletteId`∈{sunbaked·market-plum·cuberto-noir·orchard·bazaar} (and pairing/motion likewise), then it validates; a free value is rejected.

**Error State**
- Given a config whose `media.clips[].id` does not equal an owned `videos.id` (or a dangling `bindings.*`/`product_links`), when validated, then the write is rejected with a precise referential-integrity error (OQ-2). *empty-of-media is allowed where optional; a dangling reference is not.*
- Given `theme.kind:"custom"` with `meta.status` attempting to leave `draft` without a passing `meta.criticScore`, when validated, then the transition is rejected.

**Edge Case / Invariant**
- Given a config with zero or more-than-one `hero-video` block, when validated, then it is rejected (exactly one required).
- Given a `kind:"custom"` config, when validated, then the curated-enum invariant is NOT applied (no palette-capping — D15); AA gate + critic carry the guarantee instead.
- Given `blocks` are reordered but ids are stable, when re-validated, then approvals/critic scores still pin to the section by `id`, not position.

**All-4-states** *(contract/validator, not a UI surface)* — modeled as validation outcomes: *empty* = a minimal-but-valid config (optional blocks absent) passes; *loading* = validation-in-flight at the write boundary; *error* = precise rejection (enum / referential / invariant / critic-gate); *success* = validated + persisted in one transaction. *(A truly N/A visual "loading spinner" is omitted — reason: P3 is a contract/validator, its "states" are validation outcomes, surfaced by the callers P4/S3/S4.)*

### UX / UI Notes

No direct end-user UI. Validation errors surface in the callers: the S3 draft flow (structural retry, max 2), the S4 editor (save-fail inline), and the P4 renderer's unpublished/degraded guards. Error messages must name the exact failing key/id so a co-editor can act.

### Technical Requirements

**Backend / Validation**
- Zod schema matching store-config v1.3 exactly: top keys `schemaVersion·storeId·maker·theme·media·products·voiceovers·blocks·meta`.
- `theme` = Zod `discriminatedUnion('kind',[Curated,Custom])`.
- Referential integrity pass (validator-owned, OQ-2): resolve every `bindings.*`, `media.clips[].id`→owned `videos.id`, `product_links`→real products.
- Invariants: exactly one `hero-video`; `blocks` order-significant + stable ids.
- Custom-theme gate: `kind:"custom"` cannot leave `meta.status='draft'` without a passing `meta.criticScore`.
- Write path: config persist + `videos`/`video_profiles` upsert in ONE transaction (§B0.7).

**Database (Data need — Irreversible)**
- Tables: `stores(config jsonb)`; `store_versions(config jsonb, version)`.
- App must NOT accept `kind:"custom"` leaving `meta.status='draft'` without a passing `meta.criticScore`.
- **Curated-enum invariant applies ONLY to `kind:"curated"`;** for `custom`, the guarantee is the AA gate + critic (P9).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Correctness** | Rejects every invalid config class (enum, referential, single-hero, critic-gate) | Zod schema unit tests per invariant |
| **Integrity** | OQ-2: no config persists with a clip id not owned as a `videos.id` | Referential-integrity test with a dangling id |
| **Performance** | Validation adds negligible latency to read/write | Benchmark on the worked-example config |
| **Atomicity** | Config + tables upsert atomically | Transaction rollback test |

### Dependencies

**Upstream:** `stores`/`store_versions` tables (Irreversible; database-engineer). `videos`/`video_profiles` existence for referential checks (P6 tables). AI-pipeline §5.4 emit shape.
**Downstream:** P4 (renders only valid config), P5 (per-block `props` discriminated union), P6 (reads the canonical tables the validator keeps in sync), S3/S4 (emit/edit against it), P9 (critic score gate).

### Out of Scope

- Schema *evolution* beyond v1.3 (schema is v1.3-LOCKED; `schemaVersion` exists so it can tighten in review — do not propose new columns/keys without escalating).
- The auto-critic scoring itself (P9) — P3 only enforces the presence of a passing `meta.criticScore` for custom themes.
- Rendering behavior (P4).

### Risk Assessment — **Tier: Irreversible** (per §A2.8 — DB-contract/migration; database-engineer before backend-engineer)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Config references a missing clip/product (OQ-2) | M | H | Validator-owned referential integrity; one-transaction upsert |
| Custom theme published uncritiqued | M | H | `meta.status` gate on `meta.criticScore` for `kind:"custom"` |
| Curated-enum invariant wrongly applied to custom shops (flattening) | M | H | Discriminated union scopes enum check to `kind:"curated"` only (D15) |
| Multiple/zero `hero-video` breaks the persistent player | L | H | Single-hero invariant in schema |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Invalid configs reaching the renderer | N/A | 0 | Continuous |
| Dangling-reference writes accepted | N/A | 0 | Continuous |

### Rollout Plan

Ships before P4/P5. Not user-flagged. **Rollback:** schema/validator is a code + migration change; revert only via new migration (Irreversible). Rollback trigger = a validity gap admitting a slop/broken config; decision maker = CTO. Data impact: `schemaVersion` anchors any future migration.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate incl. referential-integrity pass + transactional upsert | CTO | Phase-5 review |
| 2 | Exact structural-retry contract shared with S3 (max 2) — where retry logic lives | CTO | Batch 3 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P4 — Store renderer

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Store renderer — one renderer for any valid config (hand-built or AI), curated or custom |
| **Feature Slug** | `store-renderer` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D4** |
| **Surface** | Shared render layer — renders KOL curated worlds AND custom seller shops (D15) |
| **Contract source** | `KOL-block-catalog.md`; `store-config.schema.md` §3; video-engine §2 (persistent player) |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 10 `(fact)` | Every buyer sees every world through this one renderer. |
| **Impact** | 3 `(fact)` | The signature product moment (world unfolds around a still-playing video) lives here; hero persistence is the hardest render invariant. |
| **Confidence** | 70% `(est.)` | The hero `layoutId` persistence across every transition is genuinely hard. |
| **Effort** | `(ask CTO)` person-weeks — likely the largest in the pack | 11 blocks × 4 states + shared-element persistence + curated/custom theme paths. |
| **RICE Score** | pending Effort | High priority; the whole buyer journey renders through it. |

**MoSCoW:** **Must Have.**

**Why this priority?** It is the one renderer D4 promises; hand-built and AI worlds are equally finished only if this exists and holds the hero-persistence invariant.

### Overview

A single renderer that turns any valid store-config into a live world — hand-built or AI-drafted equally finished (D4). It reads both `theme.kind` (curated → token lookup; custom → CSS custom properties direct), composes the ordered `blocks[]`, and holds the persistent single `hero-video` (`layoutId="hero-video"`) across every state transition so the film never unmounts or pauses. The film always wins.

### Problem

The concept-lock buyer journey is the product: "tap a video → grows → tap again → the maker's world unfolds *around the still-playing video* → scroll → click a product → the video shrinks to a corner." The NARRATIVE demands this feel "cinematic and physical — depth and fluidity, not flat fades," and the hard tone line is "the film always wins." All of that hinges on one renderer keeping a single hero video *alive and playing* through every transition. If the hero unmounts or pauses on a transition, the signature moment breaks and the world feels like a page reload, not a world unfolding.

### Proposed Solution

**UX Flow:**

1. Given a valid, published config, the renderer composes the ordered `blocks[]` top-to-bottom.
2. It reads `theme.kind`: `curated` → look up tokens by id (P8 enums); `custom` → apply `customPalette.roles` + `customPairing` directly as CSS custom properties.
3. It mounts exactly one `hero-video` block (`layoutId="hero-video"`) as a shared element that persists across FEED→GROWN→WORLD_OPEN→WORLD_BROWSE→NARRATE_SHRINK transitions — it never unmounts, never pauses on transition (the video engine P6 chooses *which* clip fills the slot per state).
4. Blocks reveal on the single `--ease-kol` choreography (70ms stagger, media-leads-text, once per element; reduced-motion → instant fade).
5. A failed block degrades locally; the rest of the world stays usable.

### User Stories

- As a **buyer**, I want the maker's world to unfold around a still-playing video so that the experience feels like meeting a person, not loading a page.
- As a **maker**, I want my world (hand-built or AI-drafted) to render equally finished so that the tech takes the design slack.
- As a **custom-shop seller**, I want my full-brand-freedom theme to render faithfully (D15) so that my world feels genuinely different.

### Acceptance Criteria

**Happy Path**
- Given any valid config, when it renders, then all present blocks compose in `order` and the world is fully interactive.
- Given `theme.kind:"curated"`, when it renders, then tokens are looked up by id; given `theme.kind:"custom"`, when it renders, then `customPalette.roles`/`customPairing` apply directly as CSS custom properties.
- Given a state transition (grow / unfold / scroll / shrink), when it occurs, then the single `hero-video` (`layoutId="hero-video"`) persists — never unmounts, never pauses on transition.

**Error State**
- Given a single block fails to render (e.g., media 404), when the world renders, then that block degrades locally (quiet inline fallback per block-catalog) and the rest of the world remains usable — the failure never blocks the world.

**Edge Case**
- Given an unpublished store, when a buyer reaches it, then a renderer-level guard prevents render (unpublished guard), not a broken shell.
- Given reduced-motion is set, when blocks reveal, then they use instant fade (no `--ease-kol` animation), and the hero still persists.

**All-4-states (renderer-level AND per-block)**
- *empty* = unpublished-store guard (renderer-level); per-block empty per block-catalog (live worlds omit truly-empty optional blocks; hero-video can't reach empty in a published world).
- *loading* = progressive skeletons matched to real layout (never a centered spinner); hero shows `poster` immediately.
- *error* = a failed block degrades, world stays usable.
- *success* = the full, interactive world with the persistent film.

### UX / UI Notes

**Key Interactions:** shared-element hero persistence across grow/unfold/scroll/shrink; `--ease-kol` reveal (media-leads-text, 70ms stagger); `--block-*`/`--on-block-*` grounds for the 4 block-ground-eligible blocks.
**4 states** (as above): empty = unpublished guard; loading = progressive per-block skeletons; error = per-block degrade; success = full world. The film always wins — no block chrome/motion/color pulls focus from the video.

### Technical Requirements

**Frontend (the bulk of this feature)**
- One renderer composing `stores.config.blocks[]` (ordered) — all 11 catalog block types, each with its 4 states.
- Theme paths: curated → token lookup (P8 enums); custom → CSS custom properties from `customPalette.roles`/`customPairing`.
- Persistent `hero-video` shared element (`layoutId="hero-video"`); reveal on `--ease-kol`; reduced-motion → instant fade.
- CSS props consumed: `--block-{a|b|c}`/`--on-block-{a|b|c}`, `--ease-kol`, `--space-*`, `--fs-*`, `--radius-*`, `--shadow-*`.

**Database (Data need — read-only)**
- Reads: `stores`, `store_versions`, `blocks(type, variant, allowed_states[], prop_schema_ref)`, `products`, `media`, `voiceovers`.
- `blocks` is a STATIC catalog of block *types*; **per-store block instances live in `stores.config.blocks[]` (jsonb) — there is NO `store_blocks` table (OQ-1).**
- The renderer never queries the video engine's canonical `videos`/`video_profiles` for selection — the engine (P6) owns which clip fills the hero/dock slot; they meet only at `videos.id`.

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Progressive block reveal; no layout shift when data resolves; cinematic transitions hold frame rate | Playwright/perf trace; CLS check |
| **Accessibility** | `--ease-kol` respects reduced-motion (instant fade); captions available; block `alt` text | axe-core + reduced-motion + screen-reader pass |
| **Resilience** | One failed block never blocks the world | Fault-injection E2E (kill one block's media) |
| **Fidelity** | Custom themes render without palette-capping (D15) | Visual check on a `kind:"custom"` config |

### Dependencies

**Upstream:** P3 (only valid configs reach the renderer), P5 (block primitives + props), P8 (curated token lookup), P6 (fills the hero/dock clip slot).
**Downstream:** the entire buyer journey (B1–B8, Batch 2) renders through P4; B3 world-unfold cites P4 hero persistence.

### Out of Scope

- Clip *selection* (P6 owns it) — P4 only holds the persistent slot and renders whatever clip the engine returns.
- A `store_blocks` table (does not exist — OQ-1; block instances live in `stores.config.blocks[]`).
- The block designs themselves (P5 / block-catalog) — P4 composes them.

### Risk Assessment — **Tier: Full** (hero persistence is the hardest invariant; read-only but ≥300 LOC and the signature product moment)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hero video unmounts/pauses on transition | H | H | Single `layoutId="hero-video"` shared element; explicit no-unmount/no-pause invariant + transition tests |
| A failed block blocks the whole world | M | H | Per-block local degrade (block-catalog error states) |
| Custom theme rendered with capped palette (flattening) | M | H | Direct CSS-prop application from `customPalette` (no enum coercion) |
| Cinematic motion breaks perf / reduced-motion | M | M | Reduced-motion instant fade; perf budget |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Transitions with hero-pause/unmount | N/A | 0 | Continuous (transition test) |
| Worlds rendered with a blocking block failure | N/A | 0 | Continuous |

### Rollout Plan

Internal seed testing across the 4 teammate worlds (each exercises different blocks/themes). **Rollback:** frontend change; feature-flag the renderer per environment if needed. Rollback trigger = hero-persistence regression or a blocking-failure defect; decision maker = CTO.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate (likely the largest in the pack) | CTO | Phase-5 review |
| 2 | Exact shared-element mechanism for hero persistence on the chosen frontend framework | CTO/frontend-engineer | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P5 — Section/block library (the 11 primitives)

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Section/block library — 11 constrained primitives (anti-slop layer 1) |
| **Feature Slug** | `block-library` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D4, D9** |
| **Surface** | Shared — primitives compose both curated worlds and custom seller shops (blocks stay catalog-bounded in both) |
| **Contract source** | `KOL-block-catalog.md` (11 entries verbatim = the contract) |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 10 `(fact)` | Every world is composed from these 11 primitives. |
| **Impact** | 3 `(fact)` | Anti-slop layer 1 (variety from composition, not freeform layout) + the 4-state discipline. |
| **Confidence** | 80% `(est.)` | The catalog is a locked Design-Lead spec; the per-block `props` discriminated union is the build work. |
| **Effort** | `(ask CTO)` person-weeks | 11 primitives × 4 states + per-type `props` schema + block-ground/AA constraint. |
| **RICE Score** | pending Effort | Ships with/after P4. |

**MoSCoW:** **Must Have.**

**Why this priority?** The renderer (P4) has nothing to compose without the primitives; anti-slop layer 1 is these constrained blocks.

### Overview

A fixed catalog of 11 constrained, art-directed primitives (`hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere · contact-cta`) from which every world is composed. Variety comes from *which* blocks, in *what* order, with *which* variant, under *which* theme — never freeform layout (D9 anti-slop layer 1). Each block implements all 4 states.

### Problem

D9 guarantees "quality structurally, not hoped for," and its layer 1 is "constrained primitives." The founder guardrail is "never slop" and "no flattening" — worlds must feel different without letting anyone hand-author broken layouts. The block-catalog states it directly: "Variety across worlds comes from which blocks, in what order, with which variant, under which theme — never from freeform layout." A world assembled from a fixed set of well-designed primitives is structurally incapable of the transactional-grid slop the NARRATIVE rejects (TikTok Shop/Complex).

### Proposed Solution

**UX Flow (authoring + render contract):**

1. Each of the 11 primitives is a pre-designed section with catalog variants (e.g., `hero-video`: `full-bleed | center-column | corner-shrunk`).
2. Each block's `props` validate as a Zod **discriminated union on `type`** (per-type shape from the catalog).
3. The 4 block-ground-eligible blocks (`craft-story`, `voice-quote`, `atmosphere`, `contact-cta`) expose `blockGround?: "a"|"b"|"c"|null` with the AA constraint: body-copy blocks may color-block only on a **dark** ground clearing AA body 4.5:1; the two midtone `--block-c` grounds are display-only (valid on `voice-quote`/`atmosphere`, rejected on body-copy `craft-story`/`contact-cta`).
4. Every block renders all 4 states (empty · loading · error · success), reveals on `--ease-kol`, and never lets its chrome compete with the film.

### User Stories

- As a **maker**, I want a set of beautiful section types so that my world looks company-grade without me designing from scratch.
- As the **AI drafter (S3)**, I want a fixed block vocabulary so that my emitted config is always composable and safe.
- As the **platform**, I want every block to render 4 states so that no world shows a broken/empty section.

### Acceptance Criteria

**Happy Path**
- Given a block of any of the 11 types with a valid variant, when it renders, then it matches the catalog spec for that variant.
- Given block `props`, when validated, then they pass as a discriminated union on `type` (wrong-shape props for a type are rejected).

**Error State**
- Given a block's media fails, when it renders, then it shows the catalog's error state for that block (quiet, inline, recoverable) — e.g., `craft-story` reflows to text-only, `product-showcase` keeps cached cards + retry.

**Edge Case / Anti-slop constraint**
- Given a body-copy block (`craft-story` or `contact-cta`) with `blockGround` set to a midtone `--block-c` ground, when validated/rendered, then it is rejected (midtone grounds are display-only; body copy requires a dark ground ≥ 4.5:1).
- Given `voice-quote` or `atmosphere` with any of the three grounds, when rendered, then all three are valid (display/large type or no type).

**All-4-states (mandatory per block — a success-only block is not shippable)**
- Each of the 11 blocks defines *empty* (empty ≠ blank: live omits truly-empty optional blocks; seller-preview shows a guiding prompt tied to its interview beat), *loading* (skeleton matched to real layout), *error* (quiet inline recoverable), *success* (designed happy state), per the block-catalog state tables.

### UX / UI Notes

**Key Interactions:** variant selection per block; block-ground color-blocking (the Faire "section-on-a-color-block" move) on the 4 eligible blocks; `--ease-kol` reveal.
**4 states:** governed per-block by the block-catalog (§1–§11). Cross-cutting: empty ≠ blank; loading = skeleton not spinner; error = quiet/inline; the film always wins.

### Technical Requirements

**Frontend**
- 11 primitives with their catalog variants, each rendering all 4 states.
- Block-ground prop (`a|b|c|null`) on `craft-story`, `voice-quote`, `atmosphere`, `contact-cta` with the AA constraint (body copy only on dark grounds ≥ 4.5:1; midtone `--block-c` display-only).

**Backend / Validation**
- Per-block `props` = Zod discriminated union on `type` (pairs with P3; the catalog holds the per-type shape).

**Database (Data need — Irreversible; also needs a seed step)**
- Table `blocks` = platform **reference data**: public-read, service-role write. Holds the 11 block *types* (catalog), not per-store instances.
- **`blocks` needs seeding — create-only migrations create the table, not the rows;** the 11 catalog rows are a separate seed step (flag below).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Accessibility** | Block-ground AA constraint enforced (4.5:1 body); reveal respects reduced-motion | axe-core contrast + reduced-motion pass |
| **Completeness** | Every block renders all 4 states | Per-block state snapshot tests |
| **Consistency** | Reveal uses the single `--ease-kol` curve only | Visual/motion review |

### Dependencies

**Upstream:** P3 (props discriminated union), P8 (grounds/tokens), block-catalog (the contract). `blocks` table (Irreversible) + seed step.
**Downstream:** P4 (composes the primitives), S3/S4 (draft/edit worlds from them), B1–B8 (buyer journey blocks).

### Out of Scope

- The renderer's composition/persistence logic (P4).
- A dedicated impact-stat primitive (P3-c, deferred — noted in the catalog; not one of the 11 in v1).
- Per-store block instances as a table (they live in `stores.config.blocks[]` — OQ-1, no `store_blocks` table).

### Risk Assessment — **Tier: Full** (schema + reference-data seeding; 11 primitives × 4 states is ≥300 LOC)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `blocks` table created but not seeded | M | M | Explicit seed step tracked separately from create-only migration (flagged) |
| A block ships success-only | M | H | 4-state requirement per block; per-block state tests |
| Body-copy block color-blocks on a non-AA ground | M | H | AA constraint in the block-ground prop validation |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Blocks shipping without all 4 states | N/A | 0 | Continuous |
| AA contrast failures on block-grounds | N/A | 0 | Continuous |

### Rollout Plan

Ships with P4. **Rollback:** frontend + reference-data change; the seed step is re-runnable. Rollback trigger = a slop/broken primitive; decision maker = CTO. Data impact: `blocks` reference rows are idempotently seedable.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Where the `blocks` seed step runs (outside create-only migrations) | CTO/database-engineer | Phase-5 review |
| 2 | Effort estimate for 11 primitives × 4 states | CTO | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P6 — Video engine (unified selection)

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Video engine — one unified rules+context selection engine (discovery + store + narration) |
| **Feature Slug** | `video-engine` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D5** (+ folds D16-7 relationship ranking; `Relationship` term detailed in P6+, Batch 2b) |
| **Surface** | Shared engine layer — serves the KOL feed + every world; reads canonical tables only |
| **Contract source** | `KOL-video-engine-spec.md` (whole doc, ADR-0003) — LOCKED, cite-as-is |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 10 `(fact)` | Every buyer state (feed, world, narration) calls this one engine. |
| **Impact** | 3 `(fact)` | "The right real clip plays wherever the buyer is" is core to the D5 experience. |
| **Confidence** | 80% `(est.)` | The pipeline is locked in ADR-0003; anti-repetition storage + seeded jitter are the subtle parts. |
| **Effort** | `(ask CTO)` person-weeks | 8-state query map + `RulesRanker` + anti-repetition cookie ring + relationship term. |
| **RICE Score** | pending Effort | High; the buyer journey's video-ness depends on it. |

**MoSCoW:** **Must Have.**

**Why this priority?** D5 is one of the two spines; the persistent player and contextual narration are the product.

### Overview

One unified engine that decides which real footage plays, when — serving the discovery feed (B1), the persistent in-store player (B3/B4), and contextual product narration (B5) from a single ordered pipeline: **eligibility filter → scoring → anti-repetition** (`antiRepetition(rank(eligible(ctx)))`). It selects; it never generates (D5). It reads the canonical `videos`/`video_profiles`/`buyer_signals` tables and ignores the config mirror.

### Problem

The concept-lock buyer journey depends on the *right* real clip appearing in each moment: a magazine feed that "reshuffles on refresh," a video that "keeps playing" as the world unfolds, and a clip that shrinks to a corner and "plays the *right* clip for what the buyer is now looking at (contextual narration)." D5 locks "one unified rules+context selection engine … no buyer-time generation." The NARRATIVE rejects the "transactional grid"; the feed must be a magazine of makers-on-film. And the locked constraint from the buyer state machine is that a thank-you/checkout clip must never surface in the feed. Without one engine enforcing eligibility, scoring, and anti-repetition, the feed goes stale, the wrong clip narrates, or a thank-you clip leaks into discovery.

### Proposed Solution

**UX Flow (engine behavior per buyer state):**

1. Each buyer state calls `selectVideos(ctx)` with a different `EngineContext` (state, buyer, session, store scope, product, mood, limit).
2. **Stage 1 eligibility** — one SQL query per state over the GIN-indexed `video_profiles` arrays (state→query map, video-engine §2 / packet §B2). FEED uses the **positive `page_eligibility @> {'feed'}`** predicate; `distinct on (store_id)` picks each store's newest eligible clip for magazine variety.
3. **Stage 2 scoring** — the `RulesRanker` (default, cost 0) applies a weighted sum of Business/Situation/Freshness/Relationship, with **seeded jitter** (`hash(sessionId, video_id)`, no `Math.random`) so a session is reproducible and each visit reshuffles.
4. **Stage 3 anti-repetition** — dedupe on `anti_repetition_key` (fallback `video_id`) against a per-session key ring stored in a **signed cookie, bounded N=50** (newest-wins), never per-instance memory.
5. The AI-ranker seam (`Ranker`) sits strictly between eligibility and anti-repetition — it can make the feed better but never wrong or repetitive.

### User Stories

- As a **buyer**, I want the feed to feel fresh each visit so that discovery never feels stale.
- As a **buyer**, I want the corner video to narrate the *right* clip for the product I'm viewing so that the maker feels like a real shopkeeper.
- As the **platform**, I want a thank-you clip to be structurally incapable of appearing in the feed so that trust is never broken.

### Acceptance Criteria

**Happy Path**
- Given a buyer in state S, when `selectVideos(ctx)` runs, then it returns clips satisfying state S's eligibility query (§B2 map), scored by `RulesRanker`, deduped by anti-repetition.
- Given the same `sessionId`, when the feed is selected twice, then the order is reproducible; given a new session, then the feed reshuffles (seeded jitter, no `Math.random`).

**Error State / Graceful degradation**
- Given no eligible clips for a state, when `selectVideos` runs, then it degrades gracefully (empty selection handled by the caller; e.g., NARRATE_SHRINK keeps the persistent clip).
- Given a dangling `product_links` id, when NARRATE_SHRINK queries, then zero rows → the documented fallback runs; the engine never errors on a dangling link.

**Edge Case / Load-bearing structural invariant**
- Given a store with one `feed` clip and one `thankyou` clip, when FEED selection runs for **any** buyer/seed, then the selection contains the feed clip and **never** the thankyou clip. **A structural test asserting this MUST exist in the suite** (the load-bearing invariant of the whole engine; FEED uses the positive `@> {'feed'}` predicate and a thankyou clip is tagged `['thankyou']` only).
- Given an anonymous buyer (`buyerId=null`), when scoring runs, then `Relationship=0` (cold-start; feed leans on Business + Freshness).
- Given the buyer bounces across serverless instances, when anti-repetition evaluates, then the signed-cookie key ring (N=50) travels with the buyer — never a per-instance in-memory set.

**All-4-states** *(engine, surfaced through the buyer-journey callers)* — *empty* = no eligible clips → graceful (caller shows poster/fallback, never an error); *loading* = selection-in-flight (caller shows poster/skeleton); *error* = dangling links / query failure → fallback clip, never a crash; *success* = the right clip(s) for the state. *(Truly-visual states are owned by the Batch-2 buyer specs; here they are the engine's behavioral contract.)*

### UX / UI Notes

The engine has no UI of its own; its states surface through B1–B8 (Batch 2). Cross-cutting: the feed is a magazine of makers (one clip per store), reshuffles per visit; the persistent player swaps are scoring-driven, not random; sound off until opt-in (owned by the `hero-video` block).

### Technical Requirements

**Backend / Engine**
- `selectVideos(ctx)` composing `antiRepetition(rank(eligible(ctx)))` — three pure, composable stages.
- Eligibility: one query per state per the §B2 map; **FEED uses the positive `@>{'feed'}` predicate** (`distinct on (store_id)`, newest per store).
- `RulesRanker` (default, cost 0) with `SCORING_WEIGHTS` const keyed by `BuyerState`; seeded jitter (no `Math.random`).
- Anti-repetition on `anti_repetition_key` (fallback `video_id`); canonical store = **signed-cookie key ring bounded N=50** (newest-wins), read in on request, written back in response — never per-instance memory.
- AI-ranker seam upstream of anti-repetition, downstream of eligibility; a non-default ranker must pass the offline `ranking_ndcg@k` eval before its flag flips.

**Database (Data need — read-only, service-role where noted)**
- Reads: `videos(owner_id, store_id, src, poster, duration_ms, captions_src)`, `video_profiles(purpose[], page_eligibility[], product_links uuid[], mood[], anti_repetition_key)`, `buyer_signals` (service-role — RLS-private).
- App must NOT read `blocks`/`stores.config` from the engine; must NOT use global popularity (relationship is per-buyer, `where buyer_id=ctx.buyerId`, anon→0).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Correctness** | Thankyou clip never in FEED, any seed/buyer | The mandatory structural test (§2.1) |
| **Determinism** | Same session reproducible; new session reshuffles | Seeded-jitter test |
| **Scale-safety** | Anti-repetition holds across stateless instances | Cookie-ring test (no in-memory reliance) |
| **Privacy** | `buyer_signals` read server-side (service role) only | Server-only read assertion (§5.4) |
| **Performance** | Eligibility queries GIN-index-served | Query plan check |

### Dependencies

**Upstream:** `videos`/`video_profiles`/`buyer_signals` tables (ADR-0001; Irreversible — not re-opened here). P7 (footage must be tagged to be eligible). P1/P2 (RLS anchor + signal write path for the relationship term).
**Downstream:** B1–B8 (each buyer state drives one query), P4 (fills the persistent hero/dock slot with the engine's chosen clip), P6+ (relationship term, Batch 2b).

### Out of Scope

- The `Relationship` scoring term's full aggregation math (P6+, Batch 2b) — P6 provides the term slot; P6+ details per-buyer aggregation, recency decay, visit cap.
- Buyer-time video generation (explicitly forbidden — the engine selects, never generates).
- Any new column/table (the engine adds none; ADR-0003).
- Cross-session anti-repetition (out of scope for MVP; session-scoped only).

### Risk Assessment — **Tier: Full** (engine reads DB via service role; ≥300 LOC; the trust-critical FEED invariant)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Thankyou clip leaks into FEED | L | H | Positive `@>{'feed'}` predicate makes exclusion structural; mandatory structural test |
| Anti-repetition fails across serverless instances | M | M | Signed-cookie key ring (N=50) is canonical, not in-memory |
| Engine drifts into global popularity | M | H | Per-buyer `where buyer_id=ctx.buyerId`; anon→0; no `count(*)` across buyers |
| `Math.random` breaks reproducibility | L | M | Seeded jitter only (`hash(sessionId, video_id)`) |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Thankyou-in-feed occurrences | N/A | 0 | Continuous (structural test) |
| Feed reshuffle across visits | N/A | Distinct order per new session | Internal testing |

### Rollout Plan

Internal seed testing across the 4 worlds; the AI-ranker seam ships behind a flag (default `RulesRanker`). **Rollback:** engine is code-only (no schema); revert the ranker flag or the engine version. Rollback trigger = feed-quality or invariant regression; decision maker = CTO.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Scoring weights (OQ-V3) — launch defaults, tuned post-launch on real interaction data | ai-engineer | Post-launch |
| 2 | Effort estimate incl. cookie-ring + relationship term wiring | CTO | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P7 — Video-profile tagging pipeline

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Video-profile tagging — footage tagged with purpose/eligibility/product-links/mood; AI suggests, maker confirms |
| **Feature Slug** | `video-profile-tagging` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D5** |
| **Surface** | Seller-facing (tagging in the S4 editor / draft flow); writes canonical tables |
| **Contract source** | `KOL-video-engine-spec.md` §6 (tagging pipeline) + §7 (shared eval harness) |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 8 `(assumed — low confidence)` | Every clip in every world (4 seed worlds + first cohort) must be tagged to be visible to the engine. |
| **Impact** | 3 `(fact)` | Untagged footage is invisible to the engine — tagging is the gate to the whole video experience. |
| **Confidence** | 75% `(est.)` | Manual tagging is routine; AI-assist accuracy + the thankyou-gate are the risk. |
| **Effort** | `(ask CTO)` person-weeks | Manual editor UI + Haiku `TagSuggestion` + eval harness + cost log. |
| **RICE Score** | pending Effort | Ships with/before P6 goes live (no tags → nothing to select). |

**MoSCoW:** **Must Have.**

**Why this priority?** The engine (P6) selects only on `video_profiles`; untagged footage is invisible. Tagging must exist for any clip to appear.

### Overview

The pipeline by which footage acquires the `video_profiles` row the engine selects on — `purpose`, `page_eligibility`, `product_links`, `mood`, `anti_repetition_key`. Two modes: manual (checkboxes + product picker + free-text key, in the S4 editor) and AI-assisted (a Haiku `TagSuggestion` from the clip transcript/context that the seller confirms before publish — never silent). It writes `video_profiles`.

### Problem

D5's engine "selects from the maker's real footage by video-profile tags." The video-engine spec is explicit: "Untagged footage = INVISIBLE to the engine" (empty arrays match no eligibility query). So the entire video experience hinges on footage being tagged correctly — and the founder guardrail "AI *with* the maker, never for them" means AI tag suggestions must be confirmed, not silently applied. The thankyou-only constraint (a thank-you clip must be `['thankyou']` only) must be honored at tag time as belt-and-braces on the structural feed exclusion.

### Proposed Solution

**UX Flow:**

1. In the co-edit editor (S4) or during draft (S2/S3), the seller sees a clip's tags: checkboxes for `purpose`/`page_eligibility`/`mood`, a product picker for `product_links`, and a free-text `anti_repetition_key`.
2. For AI-assist, a Haiku model proposes a `TagSuggestion` from the clip's `captions_src` (WebVTT) + duration + store/brand context; per-field low confidence is flagged.
3. The seller **confirms/edits before publish** — the suggestion is a draft, never auto-applied (D9 layer 3 / "AI with the maker").
4. A thank-you-message clip is proposed `page_eligibility:['thankyou']` + `purpose:['thankyou']` **only** (the thankyou-only guardrail is baked into the prompt).
5. On a 429/529 LLM error, the editor falls back to manual tagging; every call logs cost.

### User Stories

- As a **maker**, I want my footage tagged (with AI help) so that the right clips appear in the right moments.
- As a **maker**, I want to confirm AI tag suggestions so that I stay the author (never silent auto-apply).
- As the **platform**, I want the thankyou-only constraint enforced at tag time so that a thank-you clip can never be mis-tagged for the feed.

### Acceptance Criteria

**Happy Path**
- Given a clip, when the seller sets tags manually (or confirms an AI suggestion), then a `video_profiles` row is written with `purpose`/`page_eligibility`/`product_links`/`mood`/`anti_repetition_key`.
- Given an AI `TagSuggestion`, when it is produced, then it is presented for confirmation and is **never** applied silently before publish.

**Error State**
- Given a 429 (rate limit), when the tagging call runs, then it retries with backoff (≤3); given a 529 (overloaded), then it fails gracefully to manual tagging — a failed suggestion never blocks the seller and never writes bad data.

**Edge Case / Guardrail**
- Given a thank-you-message clip, when the AI proposes tags, then it proposes `page_eligibility:['thankyou']` and `purpose:['thankyou']` **only** (thankyou-gate); proposing `feed` on a thankyou clip is an automatic eval failure.
- Given an untagged clip, when the engine queries, then it is invisible (empty arrays match no eligibility) — safe-by-default, no wrong clip.

**All-4-states** *(tagging surface, in the editor)* — *empty* = an untagged clip shows a "tag this clip" prompt (with an "untagged — won't appear" hint); *loading* = AI suggestion in flight / STT processing; *error* = LLM 429/529 → manual fallback inline, recoverable; *success* = confirmed tags written and the clip becomes engine-eligible.

### UX / UI Notes

**Key Interactions:** tag checkboxes + product picker + `anti_repetition_key` field; AI-suggest button; per-field low-confidence flags; confirm-before-publish.
**4 states** as above. Editor must surface the "untagged — won't appear" hint (canonical untagged signal is the `video_profiles` table state; a `pendingTag` UI flag is a convenience mirror, not a second source of truth — OQ-V2).

### Technical Requirements

**Backend / AI**
- AI-assisted tagging: `claude-haiku-4-5`; input = `captions_src` + `duration_ms` + store/brand context (+ interview answers if available); output = Zod-validated `TagSuggestion` (`purpose`, `page_eligibility`, `product_links`, `mood`, `anti_repetition_key`, `confidence`).
- Thankyou-only guardrail in the system prompt; prompt-cache the enum defs + few-shot block (`cache_control: ephemeral`).
- Error handling: 429 → exp backoff retry ≤3; 529 → graceful fallback to manual. **Cost log per call** (shared cost-log schema §6.4: `event:'llm_call', feature:'video-profile-tagging', model, input_tokens, output_tokens, cost_usd, latency_ms, ts`).
- Eval `tagging_accuracy` on the shared harness (`apps/kol/src/lib/agents/evals/`): ≥12 golden clips, macro-F1 ≥ 0.80, thankyou-gate 100%.

**Frontend**
- Manual tagging UI in the S4 editor (checkboxes, product picker, key field); AI-suggest + confirm flow; low-confidence flags; "untagged — won't appear" hint.

**Database (Data need — Irreversible)**
- Writes: `video_profiles`. (Manual tagging also reachable from the S4 editor.)
- Untagged footage = INVISIBLE to the engine (canonical untagged signal = table state, OQ-V2).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Accuracy** | `tagging_accuracy` macro-F1 ≥ 0.80; thankyou-gate 100% | Eval on ≥12 golden clips |
| **Resilience** | LLM 429/529 never blocks the seller | Fault-injection on the tagging call |
| **Cost** | Every call logged; eval reports `eval_cost_usd` | Cost-log assertion |
| **Honesty** | AI tags never auto-applied before confirmation | Flow test (confirm-before-publish) |

### Dependencies

**Upstream:** `video_profiles` table (Irreversible). Shared eval harness (§7, converged with Workstream B). `videos` rows (footage uploaded). P6 (the consumer).
**Downstream:** P6 (reads only confirmed tags), S4 (manual tagging surface), S3 (draft-time tags on uploaded footage).

### Out of Scope

- The engine's selection logic (P6).
- Escalating the tagging model to Sonnet (only if the accuracy eval fails — a fallback, not the default).
- Buyer-facing surfaces (P7 is seller/authoring only).

### Risk Assessment — **Tier: Full** (writes DB; ships an LLM feature with eval + cost log)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Thankyou clip mis-tagged for feed | L | H | Prompt guardrail + thankyou-gate eval (100%) + structural feed exclusion (P6) |
| AI tags auto-applied silently | L | H | Confirm-before-publish; suggestion is a draft |
| LLM outage blocks tagging | M | M | 429/529 → manual fallback |
| Under-accurate suggestions erode trust | M | M | macro-F1 ≥ 0.80 gate; else manual-only + escalate to Sonnet |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Tagging macro-F1 | N/A | ≥ 0.80 | Pre-ship eval |
| Thankyou-gate pass rate | N/A | 100% | Pre-ship eval |
| Clips left untagged (invisible) | N/A | 0 in published worlds | Per-world publish check |

### Rollout Plan

AI-assist ships behind the accuracy gate (macro-F1 ≥ 0.80, thankyou-gate 100%); below threshold → manual-only until re-eval. **Rollback:** disable AI-assist (fall back to manual); `video_profiles` writes are additive. Rollback trigger = eval regression or cost overrun; decision maker = CTO.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate incl. eval harness + cost log | CTO | Phase-5 review |
| 2 | Schema-doc wording alignment: inline `videoProfile` mirror vs canonical `video_profiles` (flagged to schema owner, OQ-V2) | CTO/Design-Lead | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P8 — Curated design rails

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Curated design rails — 5 palettes / 4 pairings / 4 motion presets (FIXED for KOL UI; STARTING POINTS for sellers, NOT a cap) |
| **Feature Slug** | `curated-design-rails` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D9 → D15** (the reframe: rails are starting points, not limits) |
| **Surface** | KOL's own product UI (curated, FIXED) + the starting-point set offered to sellers |
| **Contract source** | `KOL-design-system.md`; NARRATIVE (braver color / bigger type / liquid+dimensional motion); D15 |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 9 `(fact)` | KOL's own UI uses the fixed system everywhere; hand-built worlds and seller starting points use the enums. |
| **Impact** | 2 `(est.)` | Consistency for KOL's brand + a fast start for sellers; the load-bearing quality guarantee for shops is elsewhere (P9). |
| **Confidence** | 85% `(fact)` | The enums are locked in store-config v1.3 / design-system v2. |
| **Effort** | `(ask CTO)` person-weeks | Enum tokens bound to `stores.config.theme`; no table. |
| **RICE Score** | pending Effort | Ships with P4/P5. |

**MoSCoW:** **Should Have** for the seller starting-point set; **Must Have** for KOL's own UI consistency.

**Why this priority?** KOL's chrome needs the fixed system to look consistent; sellers benefit from starting points — but the rails must never be mistaken for a cap on shops.

### Overview

The curated palettes/pairings/motion presets that are **FIXED for KOL's own product UI** (feed, nav, chrome, checkout, marketing) and offered as **STARTING POINTS for sellers — NOT a cap** (D9→D15). 5 palettes / 4 font pairings / 4 motion presets, expressed as enums in `stores.config.theme` (jsonb). For seller shops (`theme.kind:"custom"`, D15), the anti-slop guarantee is the AA gate + critic + approval, not these enums.

> **The D9→D15 reframe — stated loudly (this is the single most-misread decision in the pack):** these curated rails are **starting points for sellers, NOT a cap on seller shops.** Palette-capping a seller shop is *forbidden* — it is the flattening the whole product exists to fight (D15). The rails are FIXED only for **KOL's own product UI** and for hand-built curated worlds. A seller shop's quality guarantee is the deterministic WCAG-AA contrast gate + auto-critic (P9) + maker approval (P10) — **NOT** the enum.

### Problem

D9 originally leaned on "constrained primitives (1 of 5 palettes)" as anti-slop layer 1 for *everything*. D15 corrects this: "palette-capping seller shops = the flattening the whole product exists to fight." The NARRATIVE demands "warm but braver" color, "big confident statements," and "cinematic + fluid" motion (adding the `liquid`/`dimensional` cinematic-signature presets). So the rails must do two jobs: keep KOL's own UI consistent (our brand) *and* give sellers an excellent starting point — while explicitly not capping what a shop can become. Getting this wrong re-introduces the flattening the product exists to fight.

### Proposed Solution

**UX Flow (token contract):**

1. KOL's own product UI (feed, nav, chrome, checkout, marketing, dashboard) uses the FIXED curated system — `theme.kind:"curated"` enums only.
2. Hand-built worlds pick from the same enums.
3. Sellers are *offered* the 5 palettes / 4 pairings / 4 motion presets as **starting points**; the AI co-creation pipeline (S3) derives a coherent *custom* design system per shop from the seller's brand input — the rails are not a cap.
4. Tokens live in `stores.config.theme` (jsonb) / `store_versions.config` — **there is NO `design_tokens` table.**

### User Stories

- As the **platform**, I want KOL's own UI on a fixed system so that our brand is consistent.
- As a **maker**, I want great starting points so that I can begin fast — without being locked into them.
- As a **custom-shop seller**, I want full brand freedom so that my world feels genuinely mine (D15).

### Acceptance Criteria

**Happy Path**
- Given KOL's own product UI or a hand-built curated world, when it themes, then `paletteId`∈{sunbaked·market-plum·cuberto-noir·orchard·bazaar}, `fontPairingId`∈{statement-grotesk·warm-serif·modern-mono-grotesk·character-maximal}, `motionPreset`∈{hushed·fluid·liquid·dimensional}, `radiusIdentity`∈{sharp·soft·round}, `density`∈{airy·standard}.
- Given a seller starting from a curated palette, when they diverge into a custom theme, then divergence is allowed — the rails are a starting point, not a cap.

**Error State**
- Given `theme.kind:"curated"` with a free (non-enum) value, when validated (P3), then it is rejected.

**Edge Case / The reframe**
- Given a seller shop (`theme.kind:"custom"`), when it themes, then the curated-enum invariant does **NOT** apply — palette-capping is forbidden; the anti-slop guarantee is the AA gate + critic + approval (P9/P10), not the enum.
- Given anyone proposes a `design_tokens` table, then it is rejected — tokens live in `stores.config.theme` jsonb (no table).

**All-4-states — N/A (with reason).** P8 is a token/enum contract bound to config, not a UI surface with runtime states; the states of any surface *using* these tokens are owned by that surface (P4 renderer, P5 blocks, KOL chrome). *Reason for N/A: P8 defines design tokens, not an interactive component.*

### UX / UI Notes

The rails are the design-system vocabulary the renderer (P4) and blocks (P5) consume via CSS props (`--block-*`, `--ease-kol`, `--space-*`, `--fs-*`, `--radius-*`, `--shadow-*`). The NARRATIVE direction: braver color (color-blocked grounds), bigger statement type, and the `liquid`/`dimensional` cinematic motion presets. No runtime 4-state UI of its own.

### Technical Requirements

**Frontend / Design system**
- 5 palettes, 4 font pairings, 4 motion presets expressed as enums; consumed by KOL chrome + hand-built worlds + offered as seller starting points.
- **Explicitly NOT a cap on shops (D15):** the shop anti-slop guarantee is the AA gate + critic + approval, not the enum.

**Database (Data need)**
- **NO `design_tokens` table.** Tokens live in `stores.config.theme` (jsonb) / `store_versions.config`.
- Curated enums (v1.3): palette {sunbaked·market-plum·cuberto-noir·orchard·bazaar}; pairing {statement-grotesk·warm-serif·modern-mono-grotesk·character-maximal}; motion {hushed·fluid·liquid·dimensional}.
- **Bind to `config`, NOT a table.**

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Consistency** | KOL's own UI uses only curated enums | Lint/validation on chrome theme |
| **Freedom (D15)** | No enum cap applied to `kind:"custom"` shops | Validation test on a custom theme |
| **Accessibility** | Curated palettes meet AA in their intended pairings | Contrast audit of the curated set |

### Dependencies

**Upstream:** design-system v2 (`KOL-design-system.md`), store-config v1.3 (P3 discriminated union).
**Downstream:** P4 (curated token lookup), P5 (block-grounds use `--block-*`), S3 (uses palettes as starting points, then derives custom), P9 (carries the quality bar for custom shops).

### Out of Scope

- A `design_tokens` table (does not exist).
- Capping seller shops to the 5 palettes (forbidden — D15).
- The auto-critic / AA gate itself (P9) — P8 only supplies the curated enum vocabulary.

### Risk Assessment — **Tier: Lite / Full** (Lite as a config-bound token set; Full where it intersects the theme validator and chrome). No migration (no table).

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rails misread as a cap on shops (flattening) | **H** | **H** | State loudly + repeatedly: starting points, not a cap (D15); custom guarantee = AA gate + critic |
| Someone adds a `design_tokens` table | M | M | Contract states tokens live in `stores.config.theme` jsonb; no table |
| Curated palette fails AA in a pairing | L | M | Contrast audit of the curated set |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Seller shops capped to curated palettes | N/A | 0 (D15 canary) | Continuous |
| KOL-chrome non-enum theme values | N/A | 0 | Continuous |

### Rollout Plan

Ships with P4/P5. Not user-flagged. **Rollback:** design-system/config change; no data migration (no table). Rollback trigger = a rail that reads as a cap or fails AA; decision maker = CPO/Design-Lead.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | For `kind:"custom"`, `motionPreset` is kept as the nearest curated preset (open_q #1b in the schema) — confirm this is acceptable vs a fully custom motion spec | Design-Lead/CTO | Phase-5 review |
| 2 | Effort estimate for the curated token set + chrome binding | CTO | Phase-5 review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---
---

## P12 — Voiceover engine (record + tap-to-hear)

### Metadata

| Field | Value |
|---|---|
| **Feature Name** | Voiceover engine — seller records real voice per element; buyer taps to hear |
| **Feature Slug** | `voiceover-engine` |
| **Status** | Draft · **Author** CPO (Phase-5 spec worker) · **Reviewers** CPO + CTO |
| **Decision trace** | **D10, D11** (three independent voice layers; full voiceover scope in MVP) |
| **Surface** | Seller record (in the S4 editor) + buyer playback; the buyer surface is detailed in **B10** (Batch 2b — reference, don't re-spec) |
| **Contract source** | `KOL-block-catalog.md` §5 (`voice-quote`); `store-config.schema.md` §2.5; D10/D11 |

### Prioritization

**RICE**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 `(assumed — low confidence)` | Optional/suggested per element; not every element carries a voiceover, but every world may use it (4 seed worlds + first cohort). |
| **Impact** | 2 `(est.)` | The "hear her say it" honest voice moment (D10) — a personal-touch differentiator, but optional. |
| **Confidence** | 75% `(est.)` | Record-in-editor + tap-to-hear is scoped Full in MVP (D11); real-voice-only is a firm constraint. |
| **Effort** | `(ask CTO)` person-weeks | Record UI + `voiceovers[]` binding + playback + `voice-quote` block. |
| **RICE Score** | pending Effort | Ships alongside the editor (S4/S5) and the buyer world. |

**MoSCoW:** **Should Have** — a signature personal-touch layer, but optional per element.

**Why this priority?** D11 puts full voiceover in MVP (both sides real) for the personal-touch demo; it is independent of the other two voice layers and can ship after the render/engine spine.

### Overview

The engine for the third, independent voice layer (D10): a seller records their real voice per element (block / product / field) in the editor, writing `voiceovers[]` bound to an `elementRef`; a buyer taps to hear it. Real voice only — no cloning. It is strictly independent of `products.description` (text copy) and of clip narration (video) — the three voice layers never derive from each other (D10).

### Problem

D10 locks three *independent* voice layers to keep "hear her say it" honest without cloning: store video (shopkeeper narration), store text (own copy, ≠ transcript), and tap-to-hear voiceovers (optional, seller-recorded real voice per element). The founder guardrail: "Voice is one element, not the whole." The block-catalog `voice-quote` block is "the 'hear her say it' honest voice moment." Without a dedicated engine that keeps these layers independent, text could be auto-derived from a recording (or vice versa), breaking the honesty model — and cloning would break "real voice only." The concept-lock seller journey step 4 explicitly includes "add optional per-element voiceovers."

### Proposed Solution

**UX Flow:**

1. In the co-edit editor (S4/S5), the seller records their real voice against an element (`elementRef.kind` = `block | product | field`, with `element_id`/`element_field`).
2. The recording is stored as `media` and referenced in `voiceovers[]` (bound by `element_id`/`element_field`, resolved against the rendered config).
3. On the buyer side, where a voiceover is present, a tap-to-hear affordance appears (e.g., the `voice-quote` `audio-tap` variant); tapping plays the real voice.
4. Text never waits on audio: copy renders immediately; the waveform loads as a skeleton and playback is opt-in (sound off until opt-in).
5. If audio is absent or fails, the surface degrades silently to text-only — no error chrome.

### User Stories

- As a **maker**, I want to record my real voice on specific elements so that buyers can "hear me say it" honestly (no cloning).
- As a **buyer**, I want to tap to hear the maker's voice so that I feel a human connection.
- As the **platform**, I want the three voice layers independent so that text, video, and voiceover never derive from each other (D10 honesty).

### Acceptance Criteria

**Happy Path**
- Given a seller records against an element, when saved, then a `voiceovers[]` entry is written (real voice) bound to the `elementRef` (block|product|field), stored in `media`.
- Given a buyer on an element with a voiceover, when they tap the affordance, then the real voice plays (sound opt-in).

**Error State**
- Given the audio fetch fails, when the buyer views the element, then it degrades silently to text-only (tap affordance removed), no error chrome — the text is never blocked by audio.

**Edge Case / Independence**
- Given a voiceover exists, when text/video render, then the voiceover is independent of `products.description` and of clip narration — none derives from another (D10).
- Given no voiceover on an element, when it renders, then the tap affordance/`voice-quote` block is hidden (empty ≠ blank; never a blank quote frame).
- Given any recording, when stored, then it is the seller's real voice only — no cloning path exists.

**All-4-states**
- *empty* = no voiceover → block/affordance hidden; *loading* = waveform skeleton shimmer while audio loads (text shows immediately); *error* = silent degrade to text-only; *success* = tap plays the real voice, waveform animates on `--ease-kol`, label from `voiceovers[].label`.

### UX / UI Notes

**Key Interactions:** record-in-editor (seller); tap-to-hear (buyer) via `voice-quote` `audio-tap` (or `text+waveform`) variant; waveform fills as it plays; sound off until opt-in.
**4 states** as above. Buyer playback UX detail is owned by **B10** (Batch 2b) — reference it, don't re-spec.

### Technical Requirements

**Frontend**
- Record-in-editor UI (S4/S5 surface) writing `voiceovers[]`; buyer tap-to-hear via the `voice-quote` block (`audio-tap`/`text+waveform`).
- Waveform skeleton on load; text renders independent of audio; opt-in playback.

**Backend / Data model**
- `voiceovers[]` bound to an element by `element_id`/`element_field`, resolved against the rendered config; real voice only (no cloning).
- Independent of `products.description` and clip narration (three voice layers never derive from each other — D10).

**Database (Data need — Irreversible)**
- Table `voiceovers(store_id, element_kind voiceover_element_kind, element_id, element_field)` + `media`.
- Voiceovers bind to a block element by `element_id`/`element_field`; resolve against the rendered config (camelCase `elementRef` ↔ snake_case columns at the sync boundary, §B0.6).

### Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Honesty** | Real voice only; no cloning path; layers independent | Data-model + flow review |
| **Resilience** | Audio failure never blocks text | Fault-injection (kill audio) |
| **Accessibility** | Optional `transcript` for a11y; captions/label; keyboard-tappable | axe-core + screen-reader pass |
| **Tone** | Sound off until opt-in (no autoplay audio) | Playback-behavior test |

### Dependencies

**Upstream:** `voiceovers`/`media` tables (Irreversible). P3 (validates `voiceovers[]` binding). P4/P5 (`voice-quote` block renders it). S4/S5 (recording surface, Batch 3).
**Downstream:** B10 (buyer playback surface, Batch 2b).

### Out of Scope

- Voice cloning / AI voice generation (forbidden — real voice only, D10).
- Deriving text copy from the recording, or narration from it (independence, D10).
- The buyer-only playback UX detail (owned by B10 — this spec owns the engine/recording/data model).

### Risk Assessment — **Tier: Full** (seller record — DB write + media upload) / **Lite** (buyer playback)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Audio blocks text render | M | M | Text renders independent of audio; waveform skeleton; silent degrade |
| Voice layers cross-derive (breaks D10 honesty) | L | H | Data model keeps `voiceovers` independent of `description`/narration |
| Autoplay audio breaks tone | L | M | Sound off until opt-in (hard tone line) |

### Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Elements with a voiceover degrading loudly on audio failure | N/A | 0 | Continuous |
| Voiceovers using a cloned/non-real voice | N/A | 0 | Continuous |

### Rollout Plan

Ships with the editor (S4/S5) and the buyer world. Optional per element — no flag needed for the layer itself. **Rollback:** additive; disable the record affordance to fall back to text/video layers. Rollback trigger = audio reliability defect; decision maker = CTO.

### Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Effort estimate incl. record UI + media upload | CTO | Phase-5 review |
| 2 | Exact split of buyer-playback detail between P12 and B10 (avoid duplication) | CPO | Batch 2b review |

### Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

*End of Store-Engine Spine pack (P1–P8, P12). Nine features, nine template-complete sections, one shared contract layer. All Technical Requirements bind to dispatch-packet Part B §B1 rows and the LOCKED engine/schema contracts; no tables, columns, RPCs, or D#s were invented. Effort estimates are deferred to CTO per §A2.7. Last updated: 2026-07-20 · Author: CPO (Phase-5 spec worker W1).*
