# KOL Phase-6 Wave-0 — Dispatch Packet

*CTO · session `cto-wave0-packet` · color blue · 2026-07-20. Paste-ready. The CEO spawns the five workers below; each reads ONLY its `context_files` + its cited spec section. No source code here — this is orchestration.*

> **Scope:** Phase-6 Wave 0 (Render Spine, mock-fixture only, ZERO DB) + the Irreversible-track **migration 9-point validation** unit. Wave 0 **hardens the existing `apps/kol` scaffold to spec** — extend, never fork. Source contracts are LOCKED: store-config **v1.3** (`docs/03-system-design/store-config.schema.md`), design-system v2 (`docs/03-system-design/KOL-design-system.md`), ADR-0001 (data model), ADR-0003 (video engine). Cite, do not redesign.

---

## 0. Migration SQL status + scaffold facts (read once)

- **Migration SQL EXISTS.** 13 FK-ordered files at `docs/03-system-design/migrations-plan/` — `01_auth_profiles · 02_stores · 03_media_videos · 04_products · 05_blocks_voiceovers · 06_commerce · 07_reviews · 08_trust · 09_interviews · 10_messaging · 11_qa · 12_relationship · 13_search`. Each is wrapped `BEGIN;…COMMIT;` (atomic re-apply, P2-7), types `DO … IF NOT EXISTS`, functions/triggers `CREATE OR REPLACE`. **MIG-VAL does NOT author SQL — it applies + validates the existing bundle.**
- **No `supabase/` directory exists yet.** The SQL lives only under `docs/`. MIG-VAL must scaffold a local Supabase project (`supabase init`) and place the 13 files into `supabase/migrations/` in FK order (or apply them directly via `psql` against the `supabase start` DB) before running the 9-point validation.
- **Scaffold is real** (`apps/kol/`, Next 16 / React 19 / strict TS / Tailwind): 11 block components at `src/components/blocks/<type>/index.tsx` + `registry.ts` + `BlockBoundary.tsx`; `renderStore` at `src/lib/renderer/render-store.tsx` (handles both `theme.kind`, sorts by `order`, wraps blocks in `BlockBoundary`); theme layer `src/lib/theme/{apply-theme,curated,custom,tokens}.ts`; compile-time contract `src/lib/store-config/types.ts`; fixtures `src/lib/store-config/fixtures/{sena,custom,preview-blocks}.ts`; state primitives `src/components/states/*`; motion `src/components/motion/Reveal.tsx`; media `src/components/media/*`; `/preview` route; eval harness dir `src/lib/agents/evals/`.

---

## 1. Sequencing & the P3 publish artifact

**P3 leads by half a step; P4/P5/P8 then run 3-way parallel; MIG-VAL runs fully parallel to all four.**

1. **P3 lands the frozen schema shape FIRST.** Its load-bearing published artifact is:
   - `apps/kol/src/lib/store-config/schema.ts` — the runtime Zod schema: top-level `discriminatedUnion('kind',[Curated,Custom])` on `theme`, per-block `props` `discriminatedUnion('type', …)`, and `z.infer` exports.
   - a **reconciled `apps/kol/src/lib/store-config/types.ts` at v1.3** (see mismatch M1 — the file currently self-labels v1.2). After P3, `types.ts` either re-exports `z.infer<typeof storeConfigSchema>` or is proven field-for-field identical to the Zod schema. **This is the single frozen contract all three render workers bind to.**
2. **P4/P5/P8 branch FROM P3's branch tip** (`feat/kol-p3-store-config-validator`), **not from `main`**, after P3's first commit publishing `schema.ts` + the reconciled `types.ts`. This guarantees one frozen shape across all four worktrees and avoids per-branch type drift. If P3 slips, the render workers may start against the existing `types.ts` (compile-time contract already present) but MUST rebase onto P3's frozen `types.ts` before their QA submit.
3. **MIG-VAL** shares nothing with the render workers (different files, throwaway DB) — dispatch it in the same parallel batch immediately.

**Dispatch order for the CEO:** spawn **P3 + MIG-VAL** first (same message). When P3 returns its first commit with `schema.ts`, spawn **P4 + P5 + P8** in one message off P3's branch.

---

## 2. Worker briefs

### UNIT MIG-VAL — Migration apply + 9-point validation (database-engineer)

```yaml
agent: database-engineer
unit: MIG-VAL
goal: >
  Apply the existing 13-group migration bundle to a LOCAL throwaway Supabase
  (supabase start — NOT shared staging) and run the full ADR-0001 9-point
  pre-apply validation, producing a PASS report (or the first failing item) for
  Founder sign-off. Founder has approved THIS validation run today (2026-07-20);
  the shared-staging apply remains Founder-gated and is OUT of scope.
risk_tier: Irreversible (validation track — throwaway DB only; no shared env touched)
context_files:
  - docs/03-system-design/adr/0001-kol-data-model.md   # §"Pre-apply staging validation" = the 9 points; §"Security hardening" = what each point asserts
  - docs/03-system-design/migrations-plan/            # the 13 SQL files, groups 01→13, apply in order
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md  # Part B §B0 global RLS/contract rules
constraints:
  - B0 RESTATED (verbatim, this unit is DB-backed): RLS is the ONLY boundary;
    10 SECURITY DEFINER fns all SET search_path='' + schema-qualified;
    service-role hatch tests auth.role()='service_role' NEVER auth.uid() IS NULL (N1);
    money = integer minor units + char(3) currency; get_public_profile is the
    only anon-granted definer fn.
  - Apply to a LOCAL `supabase start` DB or a throwaway branch ONLY. NEVER touch
    shared staging. No `supabase db push` to a linked remote.
  - Apply groups strictly in FK order 01→13. Do not reorder, do not edit the SQL
    to make it pass — if a group fails, STOP and report the failing group + error
    (the bundle is a reviewed Irreversible artifact; edits require Full re-review).
  - This unit APPLIES existing SQL; it does NOT author migrations.
success_criteria:
  - All 13 groups apply clean in order on the throwaway DB (catches search_path=''
    typos, DDL/ordering errors, create-or-replace / do-guard issues).
  - 9-point validation executed, each point PASS/FAIL with evidence:
      1. full-bundle apply 01→13 clean
      2. pg_proc audit — every SECURITY DEFINER fn has proconfig search_path=(empty),
         no EXECUTE to public/anon except get_public_profile (anon+authenticated)
      3. anon key → every definer WRITE rpc (create_order/cancel_order/set_order_status)
         returns permission denied
      4. anon key → get_public_profile(known_id) returns only that row; NO call shape
         returns a never-posted buyer (NEW-1 enumeration gate)
      5. buyer JWT → create_order: client price ignored (amount from products),
         buyer_id bound to caller; unpublished-store / cross-store item / quantity<=0 rejected
      6. buyer JWT → self-mint badge, self-set review.verified, mutate another user's order all FAIL
      7. seller JWT → set_order_status succeeds only for own store + whitelisted targets
      8. triggers fire on correct events (insert vs update; role/transition guards raise)
      9. definer-function owner is a non-superuser role
  - Report explicitly notes any point that a LOCAL `supabase start` env cannot fully
    assert (esp. point 9: on local you are superuser — structurally reason it, flag
    that full verification happens at the Founder's staging apply).
skills_to_load: [supabase-rls-conventions, postgresql, database-design]
worktree:
  slug: kol-mig-val
  branch: feat/kol-mig-val
  create: git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/kol-mig-val -b feat/kol-mig-val
return_contract: >
  JSON { status, branch, worktree, files_changed (supabase/ scaffold + a
  validation report md under docs/08-agents_work/), commits, summary,
  nine_point_results: [{point, verdict, evidence}], deviations, blockers }
```

**Irreversible pipeline notes (what the 9-point PASS report must contain for Founder sign-off):** a per-point PASS/FAIL table with the exact query/command and its output for each of the 9; the applied-group list with row/object counts; explicit call-out of any point only structurally-reasoned on local (point 9, and any RLS assertion that needs a real JWT harness); and a one-line go/no-go recommendation. QA-Lead runs the **Irreversible** pipeline on this: Full reviewers + security-engineer + adversary-engineer + 2-of-3 multi-judge, then **Founder sign-off** gates the shared-staging apply (NOT this unit). This unit's PASS unblocks nothing to merge by itself — it is the evidence package for the Founder's Wave-1 go-signal.

---

### UNIT P3 — Store-config Zod validator (backend-engineer) — RISK: FULL

```yaml
agent: backend-engineer
unit: P3
goal: >
  Author the runtime Zod validator for store-config v1.3 — a theme
  discriminatedUnion on kind, per-block props discriminatedUnion on type, the
  structural invariants, and the OQ-2 referential-integrity pass — as the frozen
  contract every render worker binds to. Pure TS + Zod; ZERO DB (validates
  in-memory fixtures).
risk_tier: Full  # load-bearing contract; treat the referential + AA invariants as multi-judge even though pure TS
context_files:
  - docs/03-system-design/store-config.schema.md            # v1.3-LOCKED — the whole shape is law
  - docs/04-features/specs/store-engine-spine.md            # ## P3 section only (ACs + invariants)
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md  # Part B §B0.7 / OQ-2 sync contract, §B1 P3 row
  - apps/kol/src/lib/store-config/types.ts                  # existing compile-time contract to reconcile to v1.3
  - apps/kol/src/lib/store-config/fixtures/sena.ts          # a valid config to validate green
  - apps/kol/src/lib/store-config/fixtures/custom.ts        # the theme.kind:"custom" path
constraints:
  - store-config v1.3 is the source of truth. Do NOT invent keys/columns. Top-level
    keys exactly: schemaVersion·storeId·maker·theme·media·products·voiceovers·blocks·meta.
  - theme = z.discriminatedUnion('kind',[Curated, Custom]). Curated: paletteId /
    fontPairingId / motionPreset / radiusIdentity / density must be enum members
    (design-system v2 ids). Custom (D15): the curated-enum invariant does NOT apply —
    guarantee is AA gate + critic, not the enum. Never palette-cap a custom theme.
  - Per-block props = z.discriminatedUnion('type', …) matching the 11 block interfaces
    in types.ts / KOL-block-catalog.md.
  - OQ-2 referential integrity (validator-OWNED; DB can't check ids in jsonb):
    every media.clips[].id resolves; every product_links / productIds resolves to a
    real products[] id; blocks[].bindings.* resolve. In Wave 0 (no DB) the referential
    set is the config's own media.clips[] / products[] — validate WITHIN the object
    (a clip binding must point at a clip present in media.clips[]; the videos.id-owned
    check is the same-object mirror here, DB-cross-check lands in Wave 1).
  - Structural invariants: EXACTLY ONE hero-video block; blocks order-significant with
    stable unique ids.
  - Custom-theme gate: theme.kind:"custom" may not have meta.status leave 'draft'
    without a passing meta.criticScore.
  - AA block-ground constraint (pairs with P5): blockGround on body-copy blocks
    (craft-story, contact-cta) may be "a"|"b"|null only — midtone --block-c ("c") is
    REJECTED on body copy; valid on display blocks (voice-quote, atmosphere).
  - strict TS, no `any`. Errors must name the exact failing key/id (callers surface them).
success_criteria:
  - schema.ts validates sena.ts + custom.ts fixtures GREEN; publishes z.infer exports.
  - Every invalid class REJECTS with a precise error: non-enum curated value; zero or
    >1 hero-video; dangling clip/product reference; midtone --block-c on body copy;
    custom leaving draft without criticScore.
  - types.ts reconciled to v1.3 (re-exports z.infer OR proven field-identical) — mismatch
    M1 resolved and reported.
  - Unit tests per invariant (one green fixture + one red fixture each).
skills_to_load: [supabase-rls-conventions, api-design-principles, unit-testing-test-generate]
worktree:
  slug: kol-p3-store-config-validator
  branch: feat/kol-p3-store-config-validator
  create: git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/kol-p3-store-config-validator -b feat/kol-p3-store-config-validator
return_contract: >
  JSON { status, branch, worktree, files_changed, commits, summary,
  published_artifact: "apps/kol/src/lib/store-config/schema.ts + reconciled types.ts",
  deviations, blockers }
```

---

### UNIT P5 — Block-library-as-code (frontend-engineer / Fable Design-Build) — RISK: LITE

```yaml
agent: frontend-engineer
unit: P5
goal: >
  Harden the 11 block primitives to catalog spec — each rendering all 4 states,
  each with a per-type props Zod schema (pairs with P3's discriminatedUnion), and
  the block-ground a|b|c|null AA constraint on the 4 eligible blocks. Code-only,
  ZERO DB (renders from fixtures via /preview).
risk_tier: Lite
context_files:
  - docs/04-features/KOL-block-catalog.md                   # 11 entries verbatim = the contract (variants + 4 states per block)
  - docs/04-features/specs/store-engine-spine.md            # ## P5 section only
  - apps/kol/src/components/blocks/                         # existing 11 blocks + registry.ts + shared.tsx + BlockBoundary.tsx to EXTEND
  - apps/kol/src/components/states/                         # EmptyPrompt / ErrorInline / Skeleton primitives to reuse
  - apps/kol/src/lib/store-config/fixtures/preview-blocks.ts # the /preview 4-state matrix source
  - apps/kol/src/lib/store-config/types.ts                  # block interfaces (rebase to P3's frozen v1.3 before QA)
constraints:
  - Extend the existing scaffold blocks — do NOT rewrite from zero. Registry pattern stays.
  - All 11 primitives (hero-video·craft-story·product-showcase·product-detail·voice-quote·
    process-reel·reviews·trust-badge·thank-you·atmosphere·contact-cta) render ALL 4 states
    (empty·loading·error·success). empty ≠ blank (live omits truly-empty optional blocks;
    preview shows a guiding prompt). loading = skeleton matched to real layout, never a
    centered spinner. error = quiet/inline/recoverable per block-catalog. A success-only
    block is NOT shippable.
  - Per-block props Zod = discriminatedUnion on `type`; import P3's schema — do NOT
    author a parallel/competing schema.
  - block-ground prop a|b|c|null on the 4 eligible blocks (craft-story, voice-quote,
    atmosphere, contact-cta) with the AA constraint: body-copy (craft-story, contact-cta)
    color-blocks only on a DARK ground clearing AA body 4.5:1; midtone --block-c is
    display-only (valid on voice-quote/atmosphere, rejected on the body-copy pair).
  - Reveal on the single --ease-kol curve (reuse components/motion/Reveal.tsx),
    reduced-motion → instant fade. No block chrome competes with the film.
  - The `blocks` reference-data table + its 11-row seed are a Wave-1 DB concern —
    OUT of scope here (code-only in Wave 0). Note it, do not build it.
  - strict TS, no placeholder UI.
success_criteria:
  - Each of the 11 blocks renders all 4 states in /preview for BOTH theme.kind paths.
  - Wrong-shape props for a type are rejected by the props schema.
  - Body-copy block with --block-c ground is rejected; display block with any of a|b|c passes.
  - AA contrast holds on every block-ground (axe-core clean).
skills_to_load: [react-patterns, tailwind-design-system, wcag-audit-patterns]
worktree:
  slug: kol-p5-block-library
  branch: feat/kol-p5-block-library
  create: git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/kol-p5-block-library -b feat/kol-p5-block-library
return_contract: >
  JSON { status, branch, worktree, files_changed, commits, summary, deviations, blockers }
```

---

### UNIT P4 — Store renderer hardening (frontend-engineer / Fable Design-Build) — RISK: LITE

```yaml
agent: frontend-engineer
unit: P4
goal: >
  Harden renderStore to the D4 spec — the hero-video persistence invariant
  (layoutId="hero-video" never unmounts/pauses across FEED→GROWN→WORLD_OPEN→
  WORLD_BROWSE→NARRATE_SHRINK transitions), both theme.kind paths, --ease-kol
  reveal, and per-block + renderer-level 4 states. Read-only render from
  fixtures, ZERO DB.
risk_tier: Lite
context_files:
  - docs/04-features/specs/store-engine-spine.md            # ## P4 section only (hero persistence = hardest invariant)
  - docs/03-system-design/store-config.schema.md            # §3 render contract / block order
  - apps/kol/src/lib/renderer/render-store.tsx              # the renderer to HARDEN (currently one `state` for all blocks, no hero-persistence)
  - apps/kol/src/lib/theme/apply-theme.ts                   # both theme.kind → CSS vars convergence
  - apps/kol/src/components/media/FilmFrame.tsx             # hero video frame component
  - apps/kol/src/lib/store-config/fixtures/sena.ts          # curated world; custom.ts = custom world
constraints:
  - Extend renderStore — do NOT fork it. Keep the registry dispatch + BlockBoundary
    per-block degrade already present.
  - Hero-video persistence invariant is the load-bearing deliverable: exactly one
    hero-video mounts as a shared element (layoutId="hero-video"); it NEVER unmounts
    and NEVER pauses on a state transition. The video engine (P6, later wave) chooses
    WHICH clip fills the slot — P4 only holds the persistent slot alive.
  - Both theme.kind: curated → token lookup (P8 enums); custom → customPalette.roles /
    customPairing applied directly as CSS custom properties (NO enum coercion, D15).
  - Blocks reveal on the single --ease-kol choreography (70ms stagger, media-leads-text,
    once per element); reduced-motion → instant fade, hero still persists.
  - 4 states at renderer level AND per block: empty = unpublished-store guard (renderer);
    loading = progressive per-block skeletons + hero poster immediately (never a centered
    spinner); error = a failed block degrades locally, world stays usable; success = full
    interactive world. The current renderer applies ONE state to all blocks — replace with
    per-block state control (see mismatch M4).
  - No block chrome/color/motion pulls focus from the film. Read-only: renderer never
    queries videos/video_profiles (OQ-1 — no store_blocks table; instances live in
    stores.config.blocks[]).
  - strict TS, no placeholder UI.
success_criteria:
  - Across every simulated transition, the hero video element persists (no remount,
    no pause) — an explicit transition test asserts this.
  - Both sena (curated) and custom (custom) fixtures render fully interactive in /preview.
  - A deliberately-broken block degrades locally; the rest of the world stays usable.
  - reduced-motion → instant fade; hero persists; no layout shift when data resolves.
skills_to_load: [vercel-react-view-transitions, emilkowal-animations, react-patterns]
worktree:
  slug: kol-p4-store-renderer
  branch: feat/kol-p4-store-renderer
  create: git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/kol-p4-store-renderer -b feat/kol-p4-store-renderer
return_contract: >
  JSON { status, branch, worktree, files_changed, commits, summary, deviations, blockers }
```

---

### UNIT P8 — Curated design rails (frontend-engineer / Fable Design-Build) — RISK: LITE

```yaml
agent: frontend-engineer
unit: P8
goal: >
  Complete + lock the curated design rails — 5 palettes / 4 pairings / 4 motion
  presets / radius / density as enums BOUND TO config (NOT a table) — fixed for
  KOL's own UI and offered as seller STARTING POINTS, explicitly NOT a cap on
  custom shops (D9→D15). Mostly scaffolded; complete and lock it. ZERO DB.
risk_tier: Lite
context_files:
  - docs/04-features/specs/store-engine-spine.md            # ## P8 section only (the D9→D15 reframe is the single most-misread decision)
  - docs/03-system-design/KOL-design-system.md             # design-system v2 token definitions
  - apps/kol/src/lib/theme/curated.ts                       # curated enum → token map to complete/lock
  - apps/kol/src/lib/theme/tokens.ts                        # CSS custom-property vocabulary
  - apps/kol/src/lib/theme/apply-theme.ts                   # curated lookup path
constraints:
  - Enums are the contract, NOT a table. NO design_tokens table — tokens live in
    stores.config.theme (jsonb) / store_versions.config. Reject any table proposal.
  - Exact enum members (design-system v2): palette ∈ {sunbaked·market-plum·cuberto-noir·
    orchard·bazaar}; pairing ∈ {statement-grotesk·warm-serif·modern-mono-grotesk·
    character-maximal}; motion ∈ {hushed·fluid·liquid·dimensional}; radiusIdentity ∈
    {sharp·soft·round}; density ∈ {airy·standard}.
  - THE REFRAME, stated loudly: these rails are FIXED for KOL's own product UI + hand-built
    curated worlds, and STARTING POINTS for sellers — NOT a cap. Palette-capping a
    custom shop (theme.kind:"custom") is FORBIDDEN (D15); the shop anti-slop guarantee is
    the AA gate + critic (P9) + approval (P10), not the enum.
  - Every curated palette must meet AA in its intended pairing (contrast audit the set).
  - CSS props consumed downstream: --block-{a|b|c}/--on-block-{a|b|c}, --ease-kol,
    --space-*, --fs-*, --radius-*, --shadow-*. Keep them the single vocabulary P4/P5 read.
  - strict TS. Extend the existing theme layer — do not rewrite.
success_criteria:
  - All 5 palettes / 4 pairings / 4 motion / 3 radius / 2 density resolve to complete
    token sets consumed by the curated render path.
  - A curated theme with a non-enum value is rejectable (aligns with P3's curated union).
  - A custom theme is NOT enum-capped (D15 canary: 0 capped shops).
  - Curated set passes an AA contrast audit.
skills_to_load: [tailwind-design-system, frontend-design, wcag-audit-patterns]
worktree:
  slug: kol-p8-design-rails
  branch: feat/kol-p8-design-rails
  create: git -C /Users/adamks/VibeCoding/etsyc worktree add /Users/adamks/VibeCoding/etsyc/.worktrees/kol-p8-design-rails -b feat/kol-p8-design-rails
return_contract: >
  JSON { status, branch, worktree, files_changed, commits, summary, deviations, blockers }
```

---

## 3. QA plan per unit

| Unit | Tier | Pipeline QA-Lead spawns |
|------|------|--------------------------|
| **MIG-VAL** | Irreversible | Full reviewers + security-engineer + adversary-engineer + 2-of-3 multi-judge → **Founder sign-off** gates the shared-staging apply (not this unit). PASS = the 9-point evidence package (per-point table with query + output; group apply counts; local-env caveats flagged; go/no-go line). |
| **P3** | Full | code-reviewer + qa-engineer + **security-engineer** (focus: OQ-2 referential integrity — no config validates with an unresolved clip/product id; the single-hero invariant; the AA block-ground rejection; the custom-theme critic gate). |
| **P4** | Lite | code-reviewer + qa-engineer + **Playwright snapshot of /preview for BOTH theme.kind** + a hero-persistence transition test (no remount/no pause). |
| **P5** | Lite | code-reviewer + qa-engineer + **Playwright snapshot of /preview** (all 11 blocks × 4 states, both theme.kind) + axe-core on block-grounds. |
| **P8** | Lite | code-reviewer + qa-engineer + AA contrast audit of the curated set. |

QA-Lead may **upgrade** any tier (never downgrade). No merge without QA-Lead PASS. CEO/CTO cannot override a BLOCK. Max 2 QA cycles/ticket.

---

## 4. Spec / scaffold mismatches (reported, NOT fixed)

- **M1 — store-config version drift.** `apps/kol/src/lib/store-config/types.ts` self-labels **"Store-config v1.2 — TYPES ONLY"**, but the locked contract is store-config.schema.md **v1.3-LOCKED** and every spec/packet cites v1.3. P3 owns the reconciliation: diff `types.ts` against schema.md v1.3, resolve any field-shape drift, and freeze `types.ts` at v1.3 (re-export `z.infer` or prove field-identical). If v1.2→v1.3 changed a shape, P3 reports the diff — the render workers must rebase onto the frozen result before QA.
- **M2 — no `supabase/` directory.** Migration SQL exists only under `docs/03-system-design/migrations-plan/`; there is no project-level `supabase/` dir or config. MIG-VAL must `supabase init` and stage the 13 files into `supabase/migrations/` (FK order) — or apply via `psql` — before `supabase start` validation. Flagged so this setup cost is expected, not a surprise.
- **M3 — 9-point validation vs local env.** ADR-0001 point 9 (definer-function owner is a **non-superuser** role) and the JWT-matrix points (3–7) are only fully assertable against a properly-roled Supabase. On a local `supabase start` the operator is superuser; MIG-VAL must structurally reason point 9 and flag that full verification lands at the Founder's staging apply. Report, don't force-pass.
- **M4 — renderer state granularity.** `renderStore` currently threads a single `options.state` to ALL blocks and has NO hero-persistence mechanism (it maps blocks through the registry with no shared-element/layoutId). P4's hardening replaces the single-state thread with per-block state control and introduces the `layoutId="hero-video"` shared element. This is the expected P4 build, called out so the reviewer knows the starting point.
- **M5 — `blocks` seed is a Wave-1 concern.** P5's spec flags the `blocks` reference table needs an 11-row seed outside create-only migrations. In Wave 0 (zero DB) P5 is code-only; the table + seed belong to Wave 1. Noted so P5 does not attempt DB work.

---

*End of Wave-0 dispatch packet. Five units: MIG-VAL (Irreversible validation, fully parallel) + P3 (Full, leads) → P4/P5/P8 (Lite, 3-way parallel off P3's frozen contract). All render units harden the existing apps/kol scaffold against store-config v1.3 + design-system v2 — extend, never fork.*
