---
title: KOL Wave-2 Dispatch Packet — Video Engine + Tagging
date: 2026-07-21
author: CTO (session `cto-wave2-packet`)
status: READY TO DISPATCH
baseline: main @ 641ca6e (Waves 0 + 1 merged, 31-table schema APPLIED to Supabase ref olwtcjzmohdhawdzlzqs)
units: 5 (P7, P6a, P6b, SEED, W1-FF)
risk_tiers: all Full
---

# Wave-2 Dispatch Packet

Paste-ready worker briefs for the KOL MVP Wave 2. The CEO dispatches these verbatim as `Task` calls.
The CTO does not spawn workers and writes no source code — this packet is the entire engineering deliverable.

---

## 0 · Executive summary

| # | Unit | Worker type | Tier | Parallel group | Blocking edge |
|---|---|---|---|---|---|
| 1 | **P7** video-profile tagging | `ai-engineer` | **Full** | T0 | blocks P6a/P6b |
| 2 | **P6a** eligibility + ranker + 8-state query map | `backend-engineer` | **Full** | T1 | after P7 step-1 commit |
| 3 | **P6b** anti-repetition ring + reshuffle + structural tests | `backend-engineer` | **Full** | T1 | after P7 step-1 commit |
| 4 | **SEED** blocks catalog seed | `database-engineer` | **Full** | T0 | none |
| 5 | **W1-FF** Wave-1 fast-follow queue | `backend-engineer` | **Full** | T0 | none |

Every build worker runs on **Fable 5 (`claude-fable-5`)**, one unit each, isolated worktree.

---

## 1 · Blockers and asks — READ BEFORE DISPATCH

### A. `ANTHROPIC_API_KEY` is NOT provisioned — hard blocker on P7's AI half

`apps/kol/.env.local` contains exactly six variables, all Supabase:
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.

There is no Anthropic key anywhere in the repo. P7's `TagSuggestion` call and the mandatory
`tagging_accuracy` eval (macro-F1 ≥ 0.80, thankyou-gate 100 %) **cannot execute live** without one.
Since "AI features ship with eval + cost-log or they do not ship," a missing key means QA-Lead
cannot PASS the AI half of P7.

**Ask Adam at dispatch time (parallel with T0, not a gate on the manual path):**
> Add `ANTHROPIC_API_KEY=sk-ant-...` to `/Users/adamks/VibeCoding/etsyc/apps/kol/.env.local`.

**Contingency baked into the P7 brief:** the manual tag-write path, UI, harness, prompt, golden set,
and cost-log all get built and committed regardless. If the key is still absent when the worker
reaches the eval step, it returns **PARTIAL** with
`resume_point: "run tagging_accuracy eval — needs ANTHROPIC_API_KEY"`, and the CEO resumes the same
agent via SendMessage the moment the key lands. P6a/P6b are unaffected — they never call an LLM.

### B. `@anthropic-ai/sdk` is not a dependency — PRE-APPROVED by CTO

`apps/kol/package.json` has no Anthropic SDK. The P7 brief carries explicit CTO approval to add
`@anthropic-ai/sdk` as a production dependency of `apps/kol` (`pnpm add @anthropic-ai/sdk` from
`apps/kol`). No other new dependency is approved for any Wave-2 unit.

### C. `ENGINE_COOKIE_SECRET` does not exist — architected around, still an ask

P6b's signed key ring needs an HMAC secret. **Resolved in the interface:** `createCookieKeyRing`
takes `secret` as a required constructor argument, so P6b has zero module-level env reads and is
fully unit-testable without any provisioning. The env var only becomes necessary at W2-WIRE / B1
time, when the engine is actually served. Ask Adam to add `ENGINE_COOKIE_SECRET` (32+ random bytes)
to `apps/kol/.env.local` before Wave 3.

### D. `categories` has no locked taxonomy — SEED must not invent one

Nothing in `docs/01-foundation/`, `docs/03-system-design/`, or the migrations defines a category
list. `categories` + `product_categories` exist to serve **B11 search-browse, whose scope Adam
explicitly DEFERRED** (build plan §4.7b). Seeding categories now would be inventing product data.
The SEED brief therefore seeds `blocks` only — which is the half Wave 3 actually needs — and returns
`categories` as a documented, deliberately-unbuilt sub-item that lands with B11 in Wave 5.

---

## 2 · Contract conflicts a Wave-2 worker will hit

| # | Conflict | Touches Wave 2? | Disposition |
|---|---|---|---|
| 1 | **`criticScore` null vs number.** `KOL-ai-pipeline-spec.md` §5.4 emits `meta.criticScore: null` at draft; `apps/kol/src/lib/store-config/schema.ts:450` declares `z.number().min(0).max(1)` — non-nullable. A draft config from the AI pipeline cannot validate. | **NO.** P7 writes `video_profiles` only and never emits, reads, or validates a store-config. P6 ignores the config mirror entirely (video-engine spec §0). | Confirmed still due **before S3** (Wave 4a). Not a Wave-2 gate. Do not let a Wave-2 worker "fix" it. |
| 2 | **Enum values are not DB-constrained.** `video_profiles.purpose`, `.page_eligibility`, `.mood` are bare `text[]`; the enum lists live only in a SQL comment (`supabase/migrations/20260721000003_media_videos.sql:89-92`). There is **no CHECK constraint and no Postgres enum type**. | **YES — P7 and P6a.** | The Zod layer P7 builds is the *only* thing preventing a garbage tag from reaching the engine. Stated as a hard requirement in the P7 brief. P6a's eligibility queries degrade safely on unknown strings (set intersection simply does not match) — no change needed, but P6a must not assume the DB validated anything. |
| 3 | **Shared contract file across two parallel branches.** P6a and P6b both need `apps/kol/src/lib/engine/types.ts` and both branch from `main`. | **YES — P6a + P6b.** | Both write it **byte-identically** from §4.1 of this packet. On merge git reports a both-added conflict whose two sides are identical — resolution is "take either side." Documented so QA-Lead does not treat it as a real conflict. |
| 4 | **W2-WIRE — the composition root has no owner.** `createDefaultDeps()` must import P6a's `createEligible`/`createRulesRanker` *and* P6b's `createCookieKeyRing`. Neither branch can hold it without breaking its own standalone `pnpm typecheck`. | **YES.** | Explicitly excluded from both briefs. Lands as a ~15-line post-merge task (§6, step 6) or folds into B1 in Wave 3. Called out so it is not silently dropped. |

### Applied-schema verification vs the P6/P7 specs — CLEAN

The specs predate the migration apply, so I diffed `KOL-video-engine-spec.md` §0 against the real
generated types in `apps/kol/src/lib/supabase/database.types.ts`:

- `videos` — 8 columns, exact match (`captions_src`, `duration_ms`, `poster` all nullable; `src`, `owner_id` not null; `store_id` nullable).
- `video_profiles` — exact match. `purpose`/`page_eligibility`/`mood`/`product_links` are `string[]` (non-null, default `'{}'`); `anti_repetition_key` is `string | null`; `video_id` is `isOneToOne: true`.
- `buyer_signals` — exact match; `signal_type`/`subject_type` ARE real Postgres enums here (`Database["public"]["Enums"]["signal_type"]` / `["signal_subject"]`), unlike the tag arrays.
- All four GIN indexes present; `anti_repetition_key` btree present.
- RLS `video_profiles_public_read_published` + `videos_public_read_published` are live, so **the FEED eligibility query works with the anon key** — only the `Relationship` term needs the service role.

**No contradictions found.** The P6/P7 specs are safe to build against as written.

---

## 3 · Risk-tier classification

Standing precedent: **≥300 LOC changed → Full tier regardless of surface.**
`.claude/qa-tier-floor.yml` floors: `*.sql`, auth, billing → Full/Irreversible minimum.

| Unit | Tier | Trigger |
|---|---|---|
| **P7** | **Full** | Writes a DB table (`video_profiles`) + ships an LLM feature requiring eval + cost-log + est. 600–900 LOC. Not Irreversible: no migration, no billing, no workflow, no agent definition. |
| **P6a** | **Full** | Reads `buyer_signals` via **service role** (the RLS-private trust boundary, video-engine §5.4) + est. 400–550 LOC + owns the FEED positive-predicate that makes the thankyou exclusion structural. |
| **P6b** | **Full** | HMAC-signed cookie (secret handling / tamper surface — a forged ring is a client-controlled input to selection) + est. 350–500 LOC + owns the load-bearing structural test. |
| **SEED** | **Full** | Service-role write against the **live shared staging DB**. Build plan §1 Wave-1 tail already assigns "Full (seed step)". Not Irreversible — creates no schema object, is additive and idempotent, and is reversible with a scoped `delete from public.blocks where (type,variant) in (...)`. |
| **W1-FF** | **Full** | Touches `apps/kol/src/lib/auth/routes.ts` (auth path → Full floor by surface, not size) and the RLS-backed profile write path. Est. ~220 LOC — under the 300 threshold, but the floor is set by surface. |

QA-Lead may upgrade any of these. The CTO and CEO may not downgrade them.

---

## 4 · The P6a ↔ P6b interface (LOCKED — neither worker may deviate)

P6a and P6b never talk to each other. This section is the entire contract between them, and it is
reproduced verbatim inside both briefs.

### 4.1 `apps/kol/src/lib/engine/types.ts` — SHARED, byte-identical on both branches

```ts
/**
 * Video engine — shared type contract (P6, ADR-0003 / KOL-video-engine-spec.md).
 * SHARED FILE: authored byte-identically by P6a and P6b on parallel branches.
 * Do not edit without a CTO contract change — both halves compile against it.
 */

export type BuyerState =
  | "FEED" | "GROWN" | "WORLD_OPEN" | "WORLD_BROWSE"
  | "NARRATE_SHRINK" | "PRODUCT_PAGE" | "CHECKOUT" | "THANK_YOU";

export type Purpose =
  | "intro" | "craft-story" | "process" | "product-narration" | "thankyou" | "atmosphere";
export type PageEligibility =
  | "feed" | "grown" | "world" | "product" | "checkout" | "thankyou";
export type Mood = "calm" | "warm" | "energetic" | "intimate";

export interface EngineContext {
  state: BuyerState;
  buyerId: string | null;   // null = anonymous → Relationship term is 0
  sessionId: string;        // seeded-jitter + anti-repetition scope
  storeScope: string | null;
  productId: string | null;
  moodHint: Mood[] | null;
  limit: number;
}

/** Mirrors public.video_profiles Row (database.types.ts) — snake_case, arrays never null. */
export interface VideoProfileRow {
  id: string;
  video_id: string;
  purpose: string[];
  page_eligibility: string[];
  product_links: string[];
  mood: string[];
  anti_repetition_key: string | null;
  created_at: string;
}

/** Mirrors public.videos Row. */
export interface VideoRow {
  id: string;
  owner_id: string;
  store_id: string | null;
  src: string;
  poster: string | null;
  duration_ms: number | null;
  captions_src: string | null;
  created_at: string;
}

export interface ScoreFeatures {
  business: number;
  situation: number;
  freshness: number;
  relationship: number;
}

export interface ScoringWeights {
  business: number;
  situation: number;
  freshness: number;
  relationship: number;
}

export interface Candidate {
  videoId: string;
  video: VideoRow;
  profile: VideoProfileRow;
  storeId: string | null;
  ownerId: string;
  features: ScoreFeatures | null;  // null until rank() has run
  score: number | null;            // null until rank() has run
}

export interface ScoreTrace {
  videoId: string;
  features: ScoreFeatures;
  weights: ScoringWeights;
  jitter: number;
  score: number;
}

export interface SelectedClip {
  videoId: string;
  storeId: string | null;
  ownerId: string;
  src: string;
  poster: string | null;
  durationMs: number | null;
  captionsSrc: string | null;
  antiRepetitionKey: string;   // resolved: profile.anti_repetition_key ?? videoId
}

export interface Selection {
  clips: SelectedClip[];
  debug?: ScoreTrace[];
}

/** Stage-2 seam (video-engine §4.1). Reorders/trims only — never re-queries eligibility. */
export interface Ranker {
  readonly name: string;
  rank(candidates: Candidate[], ctx: EngineContext): Promise<Candidate[]>;
}

/** Anti-repetition key ring — bounded, newest-wins (video-engine §3.1). */
export const KEY_RING_MAX = 50;
export type KeyRing = readonly string[];

export interface KeyRingStore {
  read(): Promise<KeyRing>;
  write(ring: KeyRing): Promise<void>;
}

/** Composition seam: selectVideos takes its stages as deps so the halves stay independent. */
export interface EngineDeps {
  eligible: (ctx: EngineContext) => Promise<Candidate[]>;
  ranker: Ranker;
  ring: KeyRingStore;
}

/** Dedupe key resolution — anti_repetition_key, falling back to videoId (video-engine §3.1). */
export function resolveAntiRepetitionKey(candidate: Candidate): string {
  return candidate.profile.anti_repetition_key ?? candidate.videoId;
}
```

### 4.2 Exclusive file ownership

| File | Owner | Exported surface |
|---|---|---|
| `engine/types.ts` | **BOTH** (byte-identical) | above |
| `engine/eligible.ts` | **P6a** | `createEligible(db: SupabaseClient<Database>): (ctx: EngineContext) => Promise<Candidate[]>` |
| `engine/rank.ts` | **P6a** | `SCORING_WEIGHTS: Record<BuyerState, ScoringWeights>` · `seededJitter(sessionId: string, videoId: string, epsilon?: number): number` · `createRulesRanker(deps: { serviceDb: SupabaseClient<Database> }): Ranker` |
| `engine/__tests__/eligible.test.ts`, `rank.test.ts` | **P6a** | — |
| `engine/anti-repetition.ts` | **P6b** | `antiRepetition(candidates: Candidate[], ring: KeyRing, limit: number): { clips: SelectedClip[]; ring: KeyRing }` |
| `engine/cookie-ring.ts` | **P6b** | `createCookieKeyRing(opts: { secret: string; read: () => string \| undefined; write: (value: string) => void }): KeyRingStore` · `signRing(ring: KeyRing, secret: string): string` · `verifyRing(value: string, secret: string): KeyRing \| null` |
| `engine/select-videos.ts` | **P6b** | `selectVideos(ctx: EngineContext, deps: EngineDeps): Promise<Selection>` |
| `engine/__tests__/anti-repetition.test.ts`, `cookie-ring.test.ts`, `select-videos.structural.test.ts` | **P6b** | — |
| `engine/index.ts` (`createDefaultDeps`) | **NEITHER — W2-WIRE, post-merge** | — |

Any file not listed against your name is out of scope. Do not create it, do not stub it, do not import it.

### 4.3 Behavioural contract both halves must honour

- `selectVideos(ctx, deps) = antiRepetition(deps.ranker.rank(deps.eligible(ctx)), ring, ctx.limit)` — three pure, ordered stages. Stage 3 always runs after stage 2, so no ranker can defeat dedupe.
- `eligible()` returns `Candidate[]` with `features: null` and `score: null`. `rank()` fills both and returns the array reordered. `antiRepetition()` reads `resolveAntiRepetitionKey()`, drops candidates whose key is already in the ring, dedupes *within* the batch, truncates to `ctx.limit`, and returns the new ring (newest-wins, bounded `KEY_RING_MAX = 50`).
- **No `Math.random` anywhere in the engine.** Jitter is `seededJitter(sessionId, videoId)` only.

---

## 5 · §B0 — global contract rules (verbatim in every DB-backed brief)

> - **RLS is the ONLY boundary.** Any authed user hits PostgREST directly with their JWT. No restriction may be "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set `buyer_id`, client-set `role`, or client-set order `status`.
> - **10 SECURITY DEFINER fns:** `create_order`, `cancel_order`, `set_order_status`, `get_public_profile`, `handle_new_user`, `guard_profile_role`, `enforce_review_seller_scope`, `enforce_real_maker_badge`, `guard_thread`, `guard_commission`. All `SET search_path=''`, schema-qualified. Writes `REVOKE EXECUTE FROM public` + `GRANT EXECUTE TO authenticated`; `get_public_profile` also `GRANT ... TO anon`.
> - **6 triggers:** `on_auth_user_created`→`handle_new_user`; `profiles_role_guard`→`guard_profile_role`; `reviews_seller_scope_guard`→`enforce_review_seller_scope`; `badges_real_maker_guard`→`enforce_real_maker_badge`; `threads_guard`→`guard_thread`; `commissions_guard`→`guard_commission`.
> - **Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`** (anon is also null uid; N1). Privileged flows on service key: `orders.status='paid'` (Stripe webhook), verification resolution, role→`seller`, `buyer_signals` inserts (engine).
> - **Money = integer minor units + `char(3) currency` (default GBP).** No floats.
> - **camelCase (store-config) ↔ snake_case (tables)** are the same fields at the sync boundary; engine queries snake_case tables.
> - **Video config↔table sync (OQ-2):** `videos`/`video_profiles` are the CANONICAL queryable source. `stores.config.media.clips[].id` MUST equal a `videos.id` owned by the same store — enforced by the P3 Zod validator at write time (DB can't enforce ids in jsonb). Config persist + `videos`/`video_profiles` upsert in ONE transaction.

**Wave-1 conventions that carry forward (learned the hard way):**
- Supabase default privileges grant **no implicit `anon` EXECUTE** — an anon-callable RPC needs its own explicit `grant execute ... to anon` (the `get_public_profile` pattern).
- `revoke ... from public` does **not** cover the anon pre-grant — a write RPC needs an explicit `revoke execute ... from anon`.
- **Do not weaken `parseSameOriginPath`** (`apps/kol/src/lib/auth/routes.ts`). It re-validates its own output and closes two open-redirect vectors QA caught: control-char `/%09//` and dot-segment `/..//`.

---

## 6 · Dispatch order — the numbered plan the CEO executes

0. **Commit this packet to `main` first.** The workers branch from `main`, so `docs/08-agents_work/handoffs/2026-07-21-wave2-dispatch-packet.md` must exist there before T1 or P6a/P6b cannot read the §4.1 type contract. `git add docs/08-agents_work/ && git commit -m "docs(wave2): CTO dispatch packet"` and merge to `main`.
1. **T0 — dispatch three Task calls in ONE message** (they are fully independent):
   **P7** (`ai-engineer`) · **SEED** (`database-engineer`) · **W1-FF** (`backend-engineer`).
   In the same turn, ask Adam for `ANTHROPIC_API_KEY` (§1A) and `ENGINE_COOKIE_SECRET` (§1C).
2. **Gate on P7 step 1 only.** P7 commits its tag-write contract (`lib/tagging/schemas.ts` + `lib/tagging/actions.ts`) as its **first atomic commit**. Verify with
   `git -C /Users/adamks/VibeCoding/etsyc log --oneline feat/p7-video-profile-tagging` — look for `feat(tagging): video_profiles write contract`.
   This is the locked **P7 → P6** serial edge. Do not wait for P7's full return; the tag constants are already frozen in §7 of this packet, so drift risk is nil.
3. **T1 — dispatch two Task calls in ONE message:** **P6a** and **P6b** (`backend-engineer` ×2). They run 2-way parallel and never import each other.
4. **Collect returns.** Verify every branch exists and has commits:
   `git -C /Users/adamks/VibeCoding/etsyc branch --list 'feat/*'` and `git log --oneline feat/<slug> | head -5`.
   On `PARTIAL`, **resume the SAME agent via SendMessage** using its `resume_point` — never re-dispatch a fresh worker.
5. **Spawn QA-Lead once, on all five branches.** Tier **Full** on every unit. Focus files: `apps/kol/src/lib/engine/`, `apps/kol/src/lib/tagging/`, `apps/kol/src/lib/agents/`, `apps/kol/src/lib/auth/routes.ts`, `supabase/seed/`. Tell QA-Lead about the intentional byte-identical `engine/types.ts` (§2 conflict 3) so it is not scored as a defect.
6. **W2-WIRE (post-merge, after QA-Lead PASS).** ~15 lines: `apps/kol/src/lib/engine/index.ts` exporting `createDefaultDeps({ db, serviceDb, secret, cookies })` composing `createEligible` + `createRulesRanker` + `createCookieKeyRing`. Assign to the P6a agent via SendMessage, or fold into B1 at the head of Wave 3. **Do not let this drop.**

**Parallel vs serial at a glance:** T0 = 3-way parallel · P7 step-1 commit = the one serial edge ·
T1 = 2-way parallel · QA-Lead = single gate over all five · W2-WIRE = post-merge tail.

---

## 7 · Frozen tag constants (P7 writes them, P6a reads them — single source of truth)

Reproduced identically in the P7 and P6a briefs so the two halves cannot drift.

```ts
export const PURPOSE = ["intro","craft-story","process","product-narration","thankyou","atmosphere"] as const;
export const PAGE_ELIGIBILITY = ["feed","grown","world","product","checkout","thankyou"] as const;
export const MOOD = ["calm","warm","energetic","intimate"] as const;
```

- All values are **lowercase kebab-case**, stored exactly as written. No casing normalisation on read.
- `anti_repetition_key`: nullable; when present it is a lowercase kebab slug matching `/^[a-z0-9]+(-[a-z0-9]+)*$/`, max 64 chars (e.g. `sena-wheel`).
- `product_links`: `uuid[]`, app-validated only — **no element-level FK**. A dangling id yields zero rows and the documented fallback runs. The engine never errors on a dangling link.
- **Thankyou-only invariant (write-time, belt-and-braces on P6's structural exclusion):** if `purpose` contains `"thankyou"` OR `page_eligibility` contains `"thankyou"`, then `purpose` MUST equal exactly `["thankyou"]` AND `page_eligibility` MUST equal exactly `["thankyou"]`. Anything else is a validation error at write time.
- Untagged = **invisible**. Empty arrays match no eligibility query. Safe by default.

---

## 8 · The five briefs

The paste-ready briefs follow in the CTO's return message and are the authoritative text.
Each one carries: worktree protocol, live-DB access rule, §B0 verbatim (DB-backed units),
Fable 5, exact skills, exact success criteria, and the structured-JSON return contract.

---

*CTO · session `cto-wave2-packet` · 2026-07-21. No code written; five briefs produced; no workers spawned (nested Task blocked by design in this session).*

---

# BRIEF 1 — P7 · Video-profile tagging pipeline

```
subagent_type: ai-engineer
model: fable            # Fable 5 — claude-fable-5
name: ai-engineer-p7-tagging
isolation: worktree
---
You are the ai-engineer for KOL Wave 2, unit P7 — the video-profile tagging pipeline.
Risk tier: FULL. Model: Fable 5 (claude-fable-5). ONE unit. Do not touch anything outside your scope.

## Goal
Give footage the `video_profiles` row the video engine (P6) selects on: a manual tagging path
(checkboxes + product picker + anti_repetition_key) and an AI-assisted Haiku `TagSuggestion` the
seller must confirm before publish. Seller/authoring surface only — no buyer-facing UI.
Untagged footage is INVISIBLE to the engine; you are the gate to the entire video experience.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/p7-video-profile-tagging -b feat/p7-video-profile-tagging main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/p7-video-profile-tagging/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase project ref olwtcjzmohdhawdzlzqs,
31 tables applied, RLS live on all 31, real generated types at apps/kol/src/lib/supabase/database.types.ts.

## Read ONLY these (do not re-derive anything else)
1. docs/04-features/specs/store-engine-spine.md — §P7 starts line 911. Your section. Do NOT read §P6.
2. docs/03-system-design/KOL-video-engine-spec.md — §6 (tagging pipeline) and §7 (shared eval harness). Your binding contract.
3. docs/03-system-design/KOL-ai-pipeline-spec.md — §10.1 cost-log schema, §10.2 error handling.
4. supabase/migrations/20260721000003_media_videos.sql — the applied `video_profiles` table + its RLS.
5. apps/kol/src/lib/supabase/database.types.ts — the real Row/Insert types.
6. apps/kol/src/lib/account/ — the Wave-1 precedent for schemas.ts / actions.ts / live boundary tests. Match its idiom exactly.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also null uid).
- camelCase (store-config) ↔ snake_case (tables) are the same fields; you write the snake_case table.
- Video config↔table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
  `stores.config.media.clips[].id` MUST equal a `videos.id` owned by the same store.
- Supabase grants no implicit `anon` EXECUTE; `revoke ... from public` does NOT cover the anon pre-grant.
  You add no RPC in this unit — if you think you need one, return BLOCKED instead.
Tables you touch: `video_profiles` (write), `videos` (read), `products` (read, for the picker), `stores` (read).
RLS already in force: `video_profiles_owner_all` (owner via parent video) and
`video_profiles_public_read_published`. You add no policy and no migration.

## CRITICAL finding you must design around
`video_profiles.purpose`, `.page_eligibility`, `.mood` are bare `text[]`. The enum lists exist ONLY in a
SQL comment — there is NO CHECK constraint and NO Postgres enum type. Your Zod layer is therefore the
ONLY thing preventing a garbage tag from reaching the engine. Treat it as a trust boundary, validate on
every write path (manual AND AI-confirmed), and say so in the code comments.

## Frozen tag constants — the contract P6 reads. Do not alter these values.
export const PURPOSE = ["intro","craft-story","process","product-narration","thankyou","atmosphere"] as const;
export const PAGE_ELIGIBILITY = ["feed","grown","world","product","checkout","thankyou"] as const;
export const MOOD = ["calm","warm","energetic","intimate"] as const;
- Lowercase kebab-case, stored exactly as written. No casing normalisation on read.
- `anti_repetition_key`: nullable; when present a lowercase kebab slug /^[a-z0-9]+(-[a-z0-9]+)*$/, max 64 chars.
- `product_links`: uuid[], app-validated only (no element FK).
- THANKYOU-ONLY INVARIANT (write-time, belt-and-braces on P6's structural feed exclusion):
  if `purpose` contains "thankyou" OR `page_eligibility` contains "thankyou", then `purpose` MUST equal
  exactly ["thankyou"] AND `page_eligibility` MUST equal exactly ["thankyou"]. Anything else is a
  validation error at write time. This is non-negotiable and must have a dedicated test.

## Build order — commit in EXACTLY this order. Step 1 is a hard gate for another team.
STEP 1 (do this FIRST, commit alone, message `feat(tagging): video_profiles write contract`):
  - apps/kol/src/lib/tagging/schemas.ts — the constants above + `tagSuggestionSchema` +
    `videoProfileWriteSchema` (Zod, TypeScript strict), including the thankyou-only refinement and the
    anti_repetition_key slug rule.
  - apps/kol/src/lib/tagging/actions.ts — server action `saveVideoProfile(videoId, input)`: validates with
    Zod, writes `video_profiles` via the RLS-scoped USER client (never the service client), upserts on
    `video_id`. Returns a typed result, never throws to the client.
  - apps/kol/src/lib/tagging/schemas.test.ts — unit tests incl. the thankyou-only invariant both ways.
  Another team is blocked on this commit landing. Do not batch it with anything else.
STEP 2 (commit `feat(tagging): seller tagging surface`):
  - apps/kol/src/components/tagging/TagEditor.tsx — checkboxes for purpose/page_eligibility/mood, a product
    picker reading `products` for the clip's store (RLS-scoped user client), a free-text
    anti_repetition_key field, an "AI suggest" button, and a confirm-before-save flow.
    ALL 4 STATES: empty = untagged clip with a "tag this clip — untagged clips won't appear" hint;
    loading = suggestion in flight; error = inline, quiet, recoverable, falls back to manual;
    success = confirmed tags saved and the clip is engine-eligible. Zero placeholder UI, zero TODOs.
  - apps/kol/src/app/seller/clips/[videoId]/page.tsx — seller-only route. Reuse the EXISTING role gate
    (apps/kol/src/lib/auth/routes.ts + the pattern in apps/kol/src/app/seller/page.tsx). Do not invent a new gate.
STEP 3 (commit `feat(agents): shared LLM runner + cost log`):
  - CTO PRE-APPROVAL: you MAY add `@anthropic-ai/sdk` as a production dependency of apps/kol
    (`pnpm add @anthropic-ai/sdk` from apps/kol). No other new dependency is approved — if you need one,
    return BLOCKED.
  - apps/kol/src/lib/agents/cost-log.ts — `logLlmCall()` emitting ONE JSON line per call, exactly the
    ai-pipeline §10.1 required core: { event:"llm_call", feature, model, input_tokens, output_tokens,
    cost_usd, latency_ms, ts }. Optional additive fields allowed: cached_tokens, outcome.
  - apps/kol/src/lib/agents/llm.ts — thin Anthropic client wrapper, `import "server-only"`, reads
    ANTHROPIC_API_KEY from env, never from the client. Error handling per §10.2:
    429 → exponential backoff (250ms·2^n, jitter, max 3 retries), log outcome:"retry";
    529 → graceful fallback, log outcome:"fallback", the caller degrades to manual tagging;
    other 4xx/5xx → typed error, NO silent failure, log outcome:"error".
  - apps/kol/src/lib/tagging/suggest.ts — the `TagSuggestion` call on `claude-haiku-4-5`.
    Input: the clip's captions_src (WebVTT) + duration_ms + store/brand context. Output: Zod-validated
    TagSuggestion { purpose, page_eligibility, product_links, mood, anti_repetition_key, confidence }.
    System prompt carries the enum definitions, the THANKYOU-ONLY constraint stated explicitly, and
    few-shot examples (one intro, one process, one product-narration, one thankyou). Put the stable
    enum-defs + few-shot block behind `cache_control: { type: "ephemeral" }`.
    A suggestion is ALWAYS a draft. It is NEVER written to video_profiles without an explicit seller confirm.
STEP 4 (commit `test(tagging): tagging_accuracy eval + golden set`):
  - apps/kol/src/lib/agents/evals/harness.ts — the SHARED harness per video-engine §7. Exact shape:
    `GoldenExample = { id; input; expected; description; tags? }`;
    `Metric<I,O> = (out: O, expected: O, input: I) => { score: number; pass: boolean; detail?: string; breakdown?: Record<string,number> }`;
    `runEval(feature, examples, metric, threshold) => { passed, failed, meanScore, perExample[], eval_cost_usd }`.
    CI-fails if meanScore < threshold OR any adversarial example regresses. Do NOT fork this — Workstream B
    extends the same file later. Delete the placeholder README's stale "cases/*.json, run.ts, rubrics/" text
    and replace it with what you actually built.
  - apps/kol/src/lib/agents/evals/golden/tagging-clips.ts — ≥12 golden clips covering: one per purpose
    value (6), a multi-purpose clip, a THANKYOU clip (the critical adversarial case), an ambiguous
    product reference, a no-transcript clip (empty captions → must degrade, not hallucinate), and a
    foreign-language caption.
  - apps/kol/src/lib/agents/evals/tagging-accuracy.eval.ts — metric `tagging_accuracy`: per-field set-F1
    over purpose/page_eligibility/mood/product_links, macro-F1 threshold ≥ 0.80, PLUS a hard gate:
    proposing "feed" on a thankyou clip is an automatic FAIL regardless of F1. Report macro-F1,
    thankyou-gate pass/fail, and eval_cost_usd.
STEP 5 (commit `test(tagging): live RLS boundary suite`):
  - apps/kol/src/lib/tagging/__tests__/live-tagging-boundary.test.ts — follow the Wave-1 precedent in
    apps/kol/src/lib/account/__tests__/live-account-boundary.test.ts exactly. Service-role seeds a store +
    video, then asserts against the LIVE staging DB: (a) the owner CAN write its own video_profiles row,
    (b) a different authenticated user CANNOT, (c) anon CANNOT write, (d) anon CAN read profiles of a
    PUBLISHED store's clips and CANNOT read an unpublished store's. Clean up every row you create.

## Known blocker — handle it, do not stall on it
There is currently NO `ANTHROPIC_API_KEY` in apps/kol/.env.local. Check for it before STEP 3.
- If present: build and run everything, report real eval numbers.
- If absent: still build STEPS 1, 2, 3 and the STEP 4 harness + golden set + metric in full (they are pure
  code and must be committed), then return status PARTIAL with
  resume_point: "STEP 4 — execute tagging_accuracy eval; needs ANTHROPIC_API_KEY in apps/kol/.env.local"
  and eval_results: null. Do NOT fake, mock, or estimate eval numbers. Do NOT hardcode a key.

## Constraints
- TypeScript strict. Zod on every input. Extend the apps/kol scaffold — never fork it.
- store-config v1.3 + design-system v2 are source of truth. Use existing tokens/components from
  apps/kol/src/components/ui and the theme layer — do not invent new design primitives.
- Zero placeholder UI, zero TODOs, all 4 states on every UI surface.
- No new migration, no new RPC, no schema change. If you believe you need one, return BLOCKED.
- Do NOT build the deferred hardening gaps N2/N3/N4/NEW-3.
- Auto-fix type errors and missing imports (Deviation Rules 1–3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint` from apps/kol.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
llm-app-patterns · prompt-engineering-patterns · llm-evaluation

## Turn budget
There is a ~19-tool-use turn cap. If you approach it, COMMIT what is done and return PARTIAL with a
precise resume_point naming the exact STEP and file. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "eval_results": { "macro_f1": 0, "thankyou_gate": "pass|fail", "eval_cost_usd": 0 } | null,
  "cost_log_path": "", "summary", "decisions_made": [], "blockers": [], "resume_point": "" }
Also write a session file at docs/08-agents_work/sessions/2026-07-21-ai-engineer-p7-tagging.md (≤10 lines).
```

---

# BRIEF 2 — P6a · Eligibility + ranker + 8-state query map

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-p6a-eligibility-ranker
isolation: worktree
---
You are the backend-engineer for KOL Wave 2, unit P6a — stages 1 and 2 of the video engine.
Risk tier: FULL. Model: Fable 5 (claude-fable-5). ONE unit.

A second worker (P6b) is building stages 3 and the composition root ON A PARALLEL BRANCH AT THE SAME TIME.
You will never talk to it. Section "THE LOCKED INTERFACE" below is the entire contract between you.
Deviating from it silently breaks the other half. Do not deviate.

## Goal
Ship stage 1 (eligibility — one SQL query per buyer state over the GIN-indexed video_profiles arrays) and
stage 2 (the RulesRanker — weighted-sum scoring with SEEDED jitter and the per-buyer Relationship term).

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/p6a-eligibility-ranker -b feat/p6a-eligibility-ranker main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/p6a-eligibility-ranker/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase ref olwtcjzmohdhawdzlzqs, 31 tables
applied, RLS live, real generated types at apps/kol/src/lib/supabase/database.types.ts.

## Read ONLY these
1. docs/03-system-design/KOL-video-engine-spec.md — §1 (pipeline), §2 + §2.1 + §2.2 + §2.3 (the 8-state query
   map — YOUR binding contract), §3.2 (scoring formula + weights), §3.3 (seeded jitter), §4 (Ranker seam),
   §5 (Relationship term). SKIP §3.1 and §6 — those belong to other workers.
2. docs/03-system-design/adr/0003-video-engine.md
3. docs/04-features/specs/store-engine-spine.md — §P6 starts line 766. Do NOT read §P7.
4. supabase/migrations/20260721000003_media_videos.sql + 20260721000012_relationship.sql — the applied tables + RLS.
5. apps/kol/src/lib/supabase/ — the existing client layer. Reuse it; do not create a new client factory.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also null uid).
- camelCase (store-config) ↔ snake_case (tables) are the same fields; the engine queries the snake_case tables.
- Video config↔table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
Tables you READ: `videos`, `video_profiles` (both RLS-public-readable for PUBLISHED stores — the anon key
is sufficient for eligibility), `buyer_signals` (RLS-PRIVATE — service role only, server-side only).
You write NOTHING. You add no migration, no RPC, no policy. The engine adds no columns (ADR-0003).

## THE LOCKED INTERFACE — reproduce apps/kol/src/lib/engine/types.ts BYTE-IDENTICALLY
This exact file is also authored by P6b on its branch. Any difference in whitespace, ordering, or naming
causes a real merge conflict. Copy it character-for-character:

Read `docs/08-agents_work/handoffs/2026-07-21-wave2-dispatch-packet.md` §4.1 and reproduce its
`apps/kol/src/lib/engine/types.ts` source block BYTE-FOR-BYTE — no reformatting, no reordering, no renaming,
no added or removed comments. Both halves read the same bytes from the same file, which is what makes the
two branches merge cleanly. If you think a type is missing, return BLOCKED — do not add one.

## Files you own — create these and NOTHING else
- apps/kol/src/lib/engine/types.ts               (shared, byte-identical, above)
- apps/kol/src/lib/engine/eligible.ts
- apps/kol/src/lib/engine/rank.ts
- apps/kol/src/lib/engine/__tests__/eligible.test.ts
- apps/kol/src/lib/engine/__tests__/rank.test.ts
- apps/kol/src/lib/engine/__tests__/live-eligibility.test.ts
Files owned by P6b — DO NOT create, stub, or import them: anti-repetition.ts, cookie-ring.ts,
select-videos.ts, and their tests. `index.ts` / `createDefaultDeps` is a post-merge task owned by NEITHER
of you — do not write it.

## Exact exports you must ship
eligible.ts:
  export function createEligible(db: SupabaseClient<Database>): (ctx: EngineContext) => Promise<Candidate[]>
  Returns Candidate[] with features: null and score: null (rank fills them).
rank.ts:
  export const SCORING_WEIGHTS: Record<BuyerState, ScoringWeights>
  export function seededJitter(sessionId: string, videoId: string, epsilon?: number): number
  export function createRulesRanker(deps: { serviceDb: SupabaseClient<Database> }): Ranker

## Behaviour that is load-bearing
- The 8-state query map is video-engine §2's table, implemented literally. `&&` is array-overlap,
  `@>` is array-contains — both GIN-index-served.
- FEED uses the POSITIVE predicate `page_eligibility @> array['feed']`, plus
  `purpose && array['intro','craft-story','atmosphere']`, plus `distinct on (v.store_id)` ordered
  `by v.store_id, v.created_at desc` (one newest eligible clip per store, magazine variety).
  Because a thankyou clip is tagged `['thankyou']` ONLY, the exclusion is STRUCTURAL — there is no code
  path that adds a thank-you clip to the feed. Never implement it as a blocklist.
- NARRATE_SHRINK / PRODUCT_PAGE: `product_links @> array[$productId::uuid]`. `product_links` has no
  element-level FK, so a dangling id yields ZERO ROWS — the documented fallback runs (drop the
  product_links predicate → any product-narration clip in the store; still empty → empty selection).
  The engine must NEVER throw on a dangling product link.
- RulesRanker: score = w_business·Business + w_situation·Situation + w_freshness·Freshness +
  w_relation·Relationship, each term normalised to [0,1] before weighting. Launch weights are §3.2's table
  verbatim (FEED .30/.15/.25/.30; GROWN+WORLD_* .45/.30/.15/.10; NARRATE_SHRINK+PRODUCT_PAGE .60/.30/.10/.00;
  CHECKOUT+THANK_YOU .70/.30/.00/.00) in a single SCORING_WEIGHTS const keyed by BuyerState.
- NO `Math.random` ANYWHERE. Freshness jitter is `seededJitter(sessionId, videoId)` — a deterministic hash
  into [0, ε], ε default 0.05. Same sessionId → identical order (reproducible/testable);
  new sessionId → new order (the "reshuffles per visit" requirement). You own the determinism tests.
- Relationship term (video-engine §5): query `buyer_signals` ALWAYS `where buyer_id = ctx.buyerId`, via the
  SERVICE ROLE, server-side only (`import "server-only"` at the top of rank.ts). NEVER a global count,
  NEVER a cross-buyer aggregate, NEVER `count(*)` across buyers — that is popularity, which is the exact
  flattening this product exists to fight. buyerId === null → Relationship = 0 (cold-start).
  Signal weights: commission 5.0, purchase 4.0, follow 3.0, question 2.0, save 1.5, review 1.5, visit 1.0.
  Guards: recencyDecay = exp(-age_days / 30); `visit` capped at 3 effective visits; the whole rawAffinity
  passed through a saturating squash x/(x+k) so relationship biases but can never monopolise the feed.
- The ranker NEVER re-queries eligibility. It only reorders/trims what stage 1 already deemed eligible.
- The engine must NOT read `blocks` or `stores.config`. It queries the canonical tables only.

## Enum values are NOT DB-constrained
`purpose`/`page_eligibility`/`mood` are bare `text[]`; the enum list exists only in a SQL comment. There is
no CHECK constraint. Your queries must degrade safely on an unknown string (set intersection simply does
not match) — never assume the DB validated the array contents.

## Build + commit order (each an atomic commit)
1. `feat(engine): shared engine type contract` — types.ts exactly as given.
2. `feat(engine): 8-state eligibility queries` — eligible.ts + eligible.test.ts.
3. `feat(engine): rules ranker with seeded jitter and relationship term` — rank.ts + rank.test.ts.
4. `test(engine): live 8-state eligibility verification` — live-eligibility.test.ts: service-role seeds a
   PUBLISHED store with tagged clips against the live staging DB, runs all 8 state queries, asserts the
   returned sets, and cleans up every row. It MUST include a test named exactly
   `"FEED never returns a thankyou clip"` — seed one store with one `['feed']` clip and one `['thankyou']`
   clip, assert FEED returns the feed clip and never the thankyou clip. This is the load-bearing invariant
   of the whole engine and QA-Lead will grep for that test name.
   Follow the Wave-1 live-test precedent at apps/kol/src/lib/account/__tests__/live-account-boundary.test.ts.

## Constraints
- TypeScript strict. Extend the apps/kol scaffold — never fork it. No new dependency (return BLOCKED if you
  think you need one). No migration, no RPC, no schema change, no new column.
- Do NOT build the deferred hardening gaps N2/N3/N4/NEW-3. Do NOT build the P6+ relationship aggregation
  extension (Wave 5) — you provide the term, not the full Batch-2b math.
- Auto-fix type errors and missing imports (Deviation Rules 1–3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint` from apps/kol.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
supabase-rls-conventions · postgresql · nodejs-backend-patterns

## Turn budget
~19-tool-use cap. If you approach it, COMMIT what is done and return PARTIAL with a precise resume_point
naming the exact commit step and file. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "eval_results": null, "cost_log_path": null, "summary", "decisions_made": [],
  "blockers": [], "resume_point": "" }
Also write a session file at docs/08-agents_work/sessions/2026-07-21-backend-engineer-p6a-eligibility-ranker.md (≤10 lines).
```

---

# BRIEF 3 — P6b · Anti-repetition ring + composition + structural tests

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-p6b-antirepetition
isolation: worktree
---
You are the backend-engineer for KOL Wave 2, unit P6b — stage 3 of the video engine plus the composition
root and the pipeline-level structural suite.
Risk tier: FULL. Model: Fable 5 (claude-fable-5). ONE unit.

A second worker (P6a) is building stages 1 and 2 ON A PARALLEL BRANCH AT THE SAME TIME. You will never
talk to it. Section "THE LOCKED INTERFACE" below is the entire contract between you. Deviating from it
silently breaks the other half. Do not deviate.

## Goal
Ship stage 3 (anti-repetition over a signed-cookie key ring, N=50, newest-wins) and `selectVideos`, the
three-stage composition. Your half must compile, run, and be fully tested WITHOUT P6a's files — the
`EngineDeps` seam exists precisely so you can inject fakes.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/p6b-antirepetition -b feat/p6b-antirepetition main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/p6b-antirepetition/apps/kol
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. (Your unit is pure TypeScript — you likely need
no DB at all. Copy it only if a test genuinely requires it.)

## Read ONLY these
1. docs/03-system-design/KOL-video-engine-spec.md — §1 (pipeline shape), §3.1 (session + anti-repetition +
   the signed-cookie key ring — YOUR binding contract), §4.3 (why the seam sits where it does).
   SKIP §2, §3.2, §5, §6 — those belong to other workers.
2. docs/03-system-design/adr/0003-video-engine.md
3. docs/04-features/specs/store-engine-spine.md — §P6 starts line 766. Do NOT read §P7.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
- Video config↔table sync (OQ-2): `videos`/`video_profiles` are the CANONICAL queryable source.
Tables you touch: NONE directly. The key ring is session-scoped and ephemeral — it is explicitly NOT a new
table and NOT a schema change (video-engine §3.1, OQ-V4). If you find yourself wanting a table, return BLOCKED.

## THE LOCKED INTERFACE — reproduce apps/kol/src/lib/engine/types.ts BYTE-IDENTICALLY
This exact file is also authored by P6a on its branch. Any difference in whitespace, ordering, or naming
causes a real merge conflict. Copy it character-for-character:

Read `docs/08-agents_work/handoffs/2026-07-21-wave2-dispatch-packet.md` §4.1 and reproduce its
`apps/kol/src/lib/engine/types.ts` source block BYTE-FOR-BYTE — no reformatting, no reordering, no renaming,
no added or removed comments. Both halves read the same bytes from the same file, which is what makes the
two branches merge cleanly. If you think a type is missing, return BLOCKED — do not add one.

## Files you own — create these and NOTHING else
- apps/kol/src/lib/engine/types.ts                (shared, byte-identical, above)
- apps/kol/src/lib/engine/anti-repetition.ts
- apps/kol/src/lib/engine/cookie-ring.ts
- apps/kol/src/lib/engine/select-videos.ts
- apps/kol/src/lib/engine/__tests__/anti-repetition.test.ts
- apps/kol/src/lib/engine/__tests__/cookie-ring.test.ts
- apps/kol/src/lib/engine/__tests__/select-videos.structural.test.ts
Files owned by P6a — DO NOT create, stub, or import them: eligible.ts, rank.ts, and their tests.
`index.ts` / `createDefaultDeps` is a post-merge task owned by NEITHER of you — do not write it.

## Exact exports you must ship
anti-repetition.ts:
  export function antiRepetition(candidates: Candidate[], ring: KeyRing, limit: number): { clips: SelectedClip[]; ring: KeyRing }
cookie-ring.ts:
  export function createCookieKeyRing(opts: { secret: string; read: () => string | undefined; write: (value: string) => void }): KeyRingStore
  export function signRing(ring: KeyRing, secret: string): string
  export function verifyRing(value: string, secret: string): KeyRing | null
select-videos.ts:
  export async function selectVideos(ctx: EngineContext, deps: EngineDeps): Promise<Selection>

## Behaviour that is load-bearing
- `selectVideos(ctx, deps)` = `antiRepetition(await deps.ranker.rank(await deps.eligible(ctx), ctx), await deps.ring.read(), ctx.limit)`,
  then `await deps.ring.write(result.ring)`. THREE PURE ORDERED STAGES. Stage 3 always runs AFTER stage 2 so
  no ranker can defeat dedupe. Never reorder, never short-circuit, never re-query.
- Dedupe key is `resolveAntiRepetitionKey(candidate)` from types.ts — `anti_repetition_key`, falling back to
  `videoId` when null. Sellers tag near-duplicate takes with the same key so three angles of the same shot
  count as one thing.
- Drop any candidate whose key is already in the ring. ALSO dedupe WITHIN the batch — no two clips in a
  single FEED selection may share a key. Then truncate to `ctx.limit`.
- Ring is bounded `KEY_RING_MAX = 50` with NEWEST-WINS eviction. Return the updated ring; the caller
  writes it back. This is the CANONICAL store, not an optimisation: Vercel runs the engine across many
  stateless instances, so a per-instance in-memory Set would NOT be shared between requests hitting
  different lambdas and a buyer would re-see clips as they bounce. NEVER use module-level or per-instance
  memory as the source of truth. NEVER use Redis or any new infrastructure.
- Signed cookie: HMAC-SHA256 over the serialised ring using Node's `crypto`, constant-time comparison for
  verification (`crypto.timingSafeEqual`). `verifyRing` returns `null` on ANY tamper, bad signature,
  malformed payload, or over-length ring — and `read()` then yields an EMPTY ring. A forged cookie is a
  client-controlled input to selection: it must degrade to "no memory," never throw, never crash a request,
  and never be trusted unverified.
- `secret` is a REQUIRED constructor argument. Do NOT read `process.env` at module scope, do NOT provide a
  default, and do NOT fall back to an insecure value when it is missing. The caller supplies it. This keeps
  your unit fully testable and env-free.
- Empty candidate set → an empty Selection, gracefully. The caller handles the empty case (e.g.
  NARRATE_SHRINK keeps the persistent clip playing). The engine never throws on empty.
- NO `Math.random` ANYWHERE. Your half is fully deterministic; jitter belongs to P6a.

## Tests you own
- cookie-ring.test.ts: round-trip sign/verify; N=50 bound with newest-wins eviction; tampered payload →
  null → empty ring; tampered signature → null; truncated/garbage cookie → null; oversized ring rejected;
  a missing cookie → empty ring, no throw.
- anti-repetition.test.ts: key-in-ring is dropped; within-batch duplicate keys collapse; null
  anti_repetition_key falls back to videoId; limit truncation; ring grows newest-first and evicts oldest.
- select-videos.structural.test.ts — the PIPELINE-LEVEL structural suite. Two named tests are mandatory and
  QA-Lead will grep for these exact names:
    "selection is always a subset of the eligible set"  — with an adversarial fake Ranker that tries to
      inject a clip absent from `eligible()`'s output, assert the injected clip NEVER reaches the Selection.
      A ranker can make the feed better; it can never make it wrong.
    "a thankyou-tagged clip never survives a FEED selection"  — with a fake `eligible` implementing the real
      FEED predicate over a fixture containing one `['feed']` clip and one `['thankyou']` clip, assert the
      output contains the feed clip and never the thankyou clip, across many sessionIds and both
      buyerId=null and buyerId=<uuid>.
  Also assert: a clip selected in visit 1 is suppressed in visit 2 when the ring persists across the two
  calls (the ring's contribution to visit-to-visit variety), and that anti-repetition holds when the two
  calls are served by two separate `selectVideos` invocations sharing only the cookie (the stateless-
  instance guarantee). Use injected fakes for `eligible` and `ranker` — never import P6a's files.

## Constraints
- TypeScript strict. Extend the apps/kol scaffold — never fork it. No new dependency (Node's built-in
  `crypto` only; return BLOCKED if you think you need one). No migration, no RPC, no table, no new column.
- Do NOT build the deferred hardening gaps N2/N3/N4/NEW-3. Cross-session anti-repetition is explicitly out
  of scope for MVP — session-scoped only.
- Auto-fix type errors and missing imports (Deviation Rules 1–3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint` from apps/kol.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nodejs-backend-patterns · error-handling-patterns · testing-patterns

## Turn budget
~19-tool-use cap. If you approach it, COMMIT what is done and return PARTIAL with a precise resume_point
naming the exact file. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "eval_results": null, "cost_log_path": null, "summary", "decisions_made": [],
  "blockers": [], "resume_point": "" }
Also write a session file at docs/08-agents_work/sessions/2026-07-21-backend-engineer-p6b-antirepetition.md (≤10 lines).
```

---

# BRIEF 4 — SEED · P5/P8 blocks catalog seed data

```
subagent_type: database-engineer
model: fable            # Fable 5 — claude-fable-5
name: database-engineer-seed-blocks-catalog
isolation: worktree
---
You are the database-engineer for KOL Wave 2, unit SEED — the platform block-catalog seed.
Risk tier: FULL (service-role write against the LIVE shared staging DB; build plan §1 Wave-1 tail assigns
"Full (seed step)"). It is NOT Irreversible: it creates no schema object, is additive and idempotent, and
is reversible with a scoped delete. Model: Fable 5 (claude-fable-5). ONE unit.

## Goal
Populate `public.blocks` — the platform's static catalog of block TYPES and VARIANTS — on the live staging
Supabase. The 31-table migration created the table but not the rows; Wave 3's renderer and editor need the
catalog present. This is a create-only-migration gap being closed with a data seed, not a schema change.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/seed-blocks-catalog -b feat/seed-blocks-catalog main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/seed-blocks-catalog
Conventional commits. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents. Supabase project ref olwtcjzmohdhawdzlzqs.
Use SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_DB_PASSWORD via psql) — `blocks` is public-read with NO client
write policy, so a service-role write is the only path. Do not add a write policy.

## Read ONLY these
1. apps/kol/src/lib/store-config/schema.ts — the SHIPPED Zod discriminated union. Lines ~324–429 hold the
   11 exported block schemas and their `variant` enums. THIS IS THE SOURCE OF TRUTH for the catalog; P5
   landed and merged it. Derive the rows from it — do not invent, do not read a stale doc for the values.
2. supabase/migrations/20260721000005_blocks_voiceovers.sql — the applied `blocks` table, its
   `unique (type, variant)` constraint, its `allowed_states` default, and its RLS.
3. apps/kol/src/lib/supabase/database.types.ts — the real Insert type for `blocks`.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL` (anon is also null uid).
- Supabase grants no implicit `anon` EXECUTE; `revoke ... from public` does NOT cover the anon pre-grant.
Tables you touch: `public.blocks` (INSERT/upsert only). You add no policy, no RPC, no column, no index.
`blocks` is platform reference data: public-read, service-role write. Per-store block INSTANCES live in
`stores.config.blocks[]` (jsonb) — there is NO `store_blocks` table (OQ-1). Do not create one.

## What to build
1. supabase/seed/001_blocks_catalog.sql — an IDEMPOTENT seed. Use
   `insert into public.blocks (type, variant, allowed_states, prop_schema_ref) values (...)
    on conflict (type, variant) do update set allowed_states = excluded.allowed_states,
    prop_schema_ref = excluded.prop_schema_ref;`
   Running it twice must leave the table identical. Put it in `supabase/seed/`, NOT in
   `supabase/migrations/` — those are create-only and already applied to staging; adding a file there
   would corrupt the applied-migration ledger.
   Header comment must state: purpose, that it is service-role-only, that it is idempotent, and the exact
   rollback statement (`delete from public.blocks where (type, variant) in (...);`).
2. Column values:
   - `type` + `variant` — every (type, variant) pair in the shipped discriminated union.
     Expected: 11 types. Working count is 31 pairs (hero-video 3, craft-story 3, product-showcase 3,
     product-detail 3, voice-quote 3, process-reel 2, reviews 3, trust-badge 2, thank-you 2,
     atmosphere 4, contact-cta 3). VERIFY this against schema.ts yourself. If your derivation yields a
     different count, re-derive and REPORT the delta in decisions_made — do not force the number to match.
   - `allowed_states` — `{empty,loading,error,success}` for all rows. The shipped P5 suite
     (apps/kol/src/components/blocks/states.test.ts) asserts all 4 states for every block, so no block has
     a restricted state set. Confirm this before you commit.
   - `prop_schema_ref` — the pointer to the Zod prop schema, e.g.
     `store-config/schema.ts#HeroVideoBlockSchema`, using the real exported names from schema.ts.
3. scripts/seed-blocks.sh (or .ts, match the repo's existing script idiom in /scripts) — applies the seed
   using the service role / DB password from apps/kol/.env.local. It must NEVER print the credential.
4. APPLY IT to the live staging DB, then VERIFY with a read-back query:
   - row count matches your derived count,
   - `select count(distinct type) from public.blocks` = 11,
   - re-running the seed changes nothing (idempotence proven, not assumed),
   - the anon key CAN read `blocks` and CANNOT write to it.
   Report the actual numbers in your return JSON. Do not report a number you did not observe.

## DELIBERATELY OUT OF SCOPE — `categories`
Do NOT seed `public.categories` or `public.product_categories`. No locked taxonomy exists anywhere in
docs/01-foundation/ or docs/03-system-design/, and those tables serve B11 search-browse, whose scope Adam
explicitly DEFERRED. Seeding them would mean inventing product data, which is forbidden. Note this in
decisions_made as a documented, deliberate omission that lands with B11 in Wave 5. Do NOT return BLOCKED
for it — the `blocks` half is the piece Wave 3 needs and it stands alone.

## Constraints
- NEVER drop a column, NEVER drop a table, NEVER alter a schema object. This unit is INSERT-only.
- No new migration file. No new dependency. No RLS policy change.
- Do NOT build the deferred hardening gaps N2/N3/N4/NEW-3.
- Auto-fix type errors and missing imports (Deviation Rules 1–3). Return BLOCKED rather than making an
  architectural decision on your own.
- If `pnpm typecheck` / `pnpm test` / `pnpm lint` are affected by anything you touched under apps/kol,
  they must be green before you finish.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
postgresql · supabase-rls-conventions · database-design

## Turn budget
~19-tool-use cap. If you approach it, COMMIT what is done and return PARTIAL with a precise resume_point.
Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "eval_results": null, "cost_log_path": null, "summary", "decisions_made": [],
  "blockers": [], "resume_point": "" }
Include the OBSERVED row count, distinct-type count, and idempotence result in `summary`.
Also write a session file at docs/08-agents_work/sessions/2026-07-21-database-engineer-seed-blocks-catalog.md (≤10 lines).
```

---

# BRIEF 5 — W1-FF · Wave-1 fast-follow queue

```
subagent_type: backend-engineer
model: fable            # Fable 5 — claude-fable-5
name: backend-engineer-w1-fastfollow
isolation: worktree
---
You are the backend-engineer for KOL Wave 2, unit W1-FF — the Wave-1 fast-follow fix queue.
Risk tier: FULL (touches apps/kol/src/lib/auth/routes.ts — auth surface sets the tier floor regardless of
diff size — plus the RLS-backed profile write path). Estimated ~220 LOC. Model: Fable 5 (claude-fable-5).
ONE unit, six fixes, strict priority order.

Scoped as ONE unit because five of the six items are server-side (lib/auth, lib/account, an RSC) and the
sixth is a three-line component change; splitting would cost more in re-established context than it saves.

## Worktree protocol (create from the MAIN REPO ROOT — never from inside a worktree)
git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/w1-fastfollow -b feat/w1-fastfollow main
cd /Users/adamks/VibeCoding/etsyc/.worktrees/w1-fastfollow/apps/kol
Conventional commits, ONE COMMIT PER FIX. Never commit to `main`. Never merge.

## Live DB access
cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local
NEVER commit it, NEVER print it, NEVER echo its contents.

## §B0 — global contract rules (restate these in your PR description, verbatim)
- RLS is the ONLY boundary. Any authed user hits PostgREST directly with their JWT. No restriction may be
  "app-side only." Column allow-lists, price-binding, status transitions, role escalation are ALL DB-enforced
  (SECURITY DEFINER RPC / BEFORE trigger / service-role). Never propose a client-set price, client-set
  `buyer_id`, client-set `role`, or client-set order `status`.
- Service-role escape hatch tests `auth.role()='service_role'` — never `auth.uid() IS NULL`.
Tables you touch: `profiles` (read + update, own row only, RLS-scoped user client). No migration, no RPC,
no policy change.

## HARD PROHIBITION
Do NOT weaken `parseSameOriginPath` in apps/kol/src/lib/auth/routes.ts. It deliberately re-validates its
own OUTPUT and that closes two open-redirect vectors QA caught: the control-character `/%09//` case and the
dot-segment `/..//` case. Every change you make there must ADD a constraint, never relax one. Any existing
test in routes.test.ts that passes today must still pass.

## The six fixes, in strict priority order — commit each separately
FIX 1 (HIGHEST — a real data-loss bug). apps/kol/src/app/account/page.tsx.
  The own-profile read logs its error and then falls straight through to render `ProfileForm` with
  `profile?.display_name ?? ""`, `bio ?? null`, `avatar_url ?? null`. On a transient DB read error,
  `profile` is null, so the user is shown the EMPTY-state form pre-filled with blanks — and if they submit,
  the save OVERWRITES a real stored profile with empty values. Repro: transient read error at load + user
  submits.
  Fix it by distinguishing "read failed" from "no profile yet". On a read error the page must render a
  recoverable ERROR state — quiet, inline, with a retry — and must NOT render an editable form that can
  submit blanks. The empty state (a genuinely new profile, no error) keeps today's behaviour. All 4 states
  must be correct on this screen after your change: empty (new profile prompts), loading, error (new),
  success. Zero placeholder UI.
  Add a test proving a read error does not produce a submittable blank form.
FIX 2. apps/kol/src/lib/account/schemas.ts — `avatarUrlSchema` applies `.max(2048)` BEFORE the transform
  that parses and normalises the URL (`new URL(v).toString()`). Normalisation can lengthen the string, so
  a value that passes the check can be stored over the bound. Move the length check to AFTER normalisation
  so the 2048 limit applies to what is actually persisted. Keep the existing user-facing error message
  text. Keep the https-only rule and the empty-string → null behaviour exactly as they are. Add tests for
  the boundary: a URL that is under 2048 before normalisation and over it after must now be rejected.
FIX 3. apps/kol/src/lib/auth/routes.ts — the `?next=` parameter has no length bound. Add a maximum length
  to `safeNextPath` / `parseSameOriginPath` and reject anything longer, returning the same null the other
  rejection paths return (callers already handle null by falling back to the default landing). Choose a
  bound that is comfortably above any real internal path and state your reasoning in decisions_made.
  This is an ADDITIONAL constraint — it must not change the outcome for any currently-accepted path.
FIX 4. apps/kol/src/lib/auth/routes.ts — the route classifier is case-sensitive, so `/Account` does not
  classify as the account route. It is currently mitigated by the page's own re-check and by RLS, so this
  is correctness/UX hardening, not a hole. Make classification case-insensitive in a way that cannot
  introduce a new bypass, and add tests for mixed-case variants of every classified route.
FIX 5. apps/kol/src/components/auth/AccountBar.tsx line 28 — the Profile link is a plain `<a href={ACCOUNT_PATH}>`,
  which forces a full document navigation. Convert it to `next/link`. Keep the className and the label.
FIX 6 (LOWEST). The two P1 redirect UX edges from the Wave-1 QA report: after a rejected `next` param the
  user should land on the role-correct default landing with no flash of the wrong surface, and the
  post-sign-in redirect should not leave a stale `?next=` in the URL. Fix both, add tests.

## Constraints
- TypeScript strict. Zod on every input. Extend the apps/kol scaffold — never fork it. No new dependency.
- No migration, no RPC, no schema change. Zero placeholder UI, zero TODOs.
- Do NOT build the deferred hardening gaps N2/N3/N4/NEW-3. Do NOT refactor beyond these six fixes —
  scope creep here delays a wave.
- Auto-fix type errors and missing imports (Deviation Rules 1–3). Return BLOCKED rather than making an
  architectural decision on your own.
- Green before you finish: `pnpm typecheck`, `pnpm test`, `pnpm lint` from apps/kol. Every pre-existing
  test must still pass — especially apps/kol/src/lib/auth/routes.test.ts.

## Skills — load exactly these 3, nothing more (read .claude/skills/<name>/SKILL.md)
nextjs-app-router-patterns · error-handling-patterns · web-security-testing

## Turn budget
~19-tool-use cap, and six fixes is a lot. Work in the given priority order and COMMIT AFTER EACH FIX. If
you approach the cap, return PARTIAL with resume_point naming the next unstarted FIX number. FIX 1 is the
one that matters most — never leave it unlanded. Never truncate silently. Never leave the tree dirty.

## Return contract — structured JSON, exactly these keys
{ "status": "COMPLETE|PARTIAL|BLOCKED", "branch", "worktree", "files_changed": [], "tests_added": [],
  "loc_changed": 0, "eval_results": null, "cost_log_path": null, "summary", "decisions_made": [],
  "blockers": [], "resume_point": "" }
List which FIX numbers landed in `summary`.
Also write a session file at docs/08-agents_work/sessions/2026-07-21-backend-engineer-w1-fastfollow.md (≤10 lines).
```
