## 2026-07-21 — QA-Lead PASS — KOL P3 store-config v1.3 Zod validator (cycle 2)

- Branch: feat/kol-p3-store-config-validator @ afce354
- Tier: Full
- Reviewers: security-engineer, code-reviewer, qa-engineer (all PASS)
- Tests: 93/93 green, tsc clean
- Cycle-1 BLOCK items resolved: F1 (assetUrl scalar on 5 fields), F2 (fontFamilyName scalar on 2 fields)
- Deferred P3/informational: backslash-nit, block-catalog "c", currency allowlist, __proto__ convention, per-field max, postcss CVE
- Session: docs/08-agents_work/sessions/2026-07-21-qa-lead-kol-p3-final.md

## 2026-07-21 — QA-Lead PASS — KOL P5 block library (cycle 2, Final)

- Branch: feat/kol-p5-block-library @ f5c6830 (rebased onto P3 final afce354)
- Tier: Full
- Reviewers: qa-p5 (re-gate), adv-p5 (Full security — first run), builder fe-p5-blocks
- P1 CLOSED: groundStyle --muted no longer uses color-mix; now resolves to full var(--on-block-*) ink at shared.tsx:84. axe color_contrast_on_grounds = 0 on both fixtures. sunbaked-a: was 3.32:1, now 4.87:1.
- Full-tier security: adv-p5 PASS. Nil HTML-injection, 5 URL sinks non-executable, CSS template interpolation safe. Two low follow-ups owned by P3 (in-block URL re-check, array .max() caps).
- Merge-order: P5 rebased onto P3 final afce354 — constraint satisfied.
- P2-a (sunbaked page-level muted 3.62:1, EmptyPrompt/ErrorInline, 6 sena nodes): FIX-BEFORE-WAVE-0-SHIP → P8/design-system owner → Wave-0 ship-blocker ticket required. Not a P5 defect.
- P2-b (/preview matrix harness 1.09:1 dark-on-dark): DEFERRED — harness-only, blocks do NOT render incorrect ink on real surfaces. P5 follow-up ticket.
- Suite: 212/212 green, tsc+lint clean.
- Session: docs/08-agents_work/sessions/2026-07-21-qa-lead-kol-p5-final.md

## 2026-07-23 13:45 UTC | deploy | kol-demo | Wave-3 Track C | N/A (no QA gate — deploy only, no source change) | staging: https://kol-demo-q021yfrve-adam419067-gmailcoms-projects.vercel.app | prod-alias: https://kol-demo.vercel.app | health: 10/10 routes 200

- Vercel project: kol-demo (adam419067-gmailcoms-projects) — new project created from apps/kol
- Source: origin/main @ f7e69df (detached worktree, no source modification)
- Build: 32 pages SSG — compiled clean locally + on Vercel
- Smoke: /, /m/odd-clay, /m/grain-groove, /m/odd-clay/p/carafe, /checkout, /thank-you, /sell, /journal, /how, /browse — all 200
- Promote command: `vercel --prod` from apps/kol worktree (or Vercel dashboard promotion)

## 2026-07-22 — STAGING APPLY — MIG-CHECK video_profiles CHECK constraints (Irreversible, Founder-signed)

- Applied `20260721000015_video_profiles_check_constraints.sql` to `olwtcjzmohdhawdzlzqs` — psql/session-pooler, `ON_ERROR_STOP=1`, rc=0 (BEGIN/ALTER TABLE/COMMIT). Ledger row inserted (15 rows total).
- 5 CHECKs live, spec-verbatim names: purpose_enum, page_enum, mood_enum, thankyou_exclusive, antirep_key_format. Verified via pg_constraint post-apply.
- Pre-flight re-run immediately before apply: 0 rows, 0 nonconforming on all 5 predicates. No seller data touched.
- Acceptance proof (owner JWT via PostgREST, not app/Zod): INSERT `purpose=['thankyou'], page_eligibility=['feed']` → **SQLSTATE 23514** `video_profiles_thankyou_exclusive`; PATCH variant → same 23514; all-empty-array row inserts OK (untagged stays valid + invisible). Live suite 7/7 green.
- CHECKs bind the service role too (verified in suite) — the §B0 "app-side only" gap is closed; Zod and DB guards now parallel.
- Rollback: 5 `drop constraint` statements + ledger delete, documented in the migration header.
- Branch: feat/mig-check (rebased onto post-merge-train main). Session: docs/08-agents_work/sessions/2026-07-21-database-engineer-mig-check.md

## 2026-07-22 — STAGING APPLY — MIG-TS server-enforced timestamps (Irreversible, Founder-signed)

- Applied `20260721000016_server_timestamps.sql` to `olwtcjzmohdhawdzlzqs` — psql/session-pooler, `ON_ERROR_STOP=1`, rc=0 (CREATE FUNCTION / REVOKE / 11× CREATE TRIGGER / COMMIT). Ledger row inserted (16 rows total).
- `public.enforce_server_timestamps()` (security definer, `search_path=''`, §B0 `auth.role()='service_role'` escape hatch) live as BEFORE INSERT OR UPDATE on all 11 exposed tables: videos, video_profiles, stores, store_versions, products, reviews, media, profiles, carts, commissions, threads. Verified via information_schema.triggers post-apply.
- Closes the CEO-verified feed-eviction vector: forged `created_at='2099-01-01'` can no longer squat the FEED_CANDIDATE_CAP=300 recency window nor pin rank.ts's ageDays=0 clamp.
- Acceptance proof (live suite 5/5 green): owner-JWT INSERT with `created_at=2099-01-01` on videos AND video_profiles → stored ≈ now(); owner UPDATE touching created_at → write lands, timestamp unchanged (immutable); service-role INSERT `2020-03-04T05:06:07Z` → preserved exactly; service-role UPDATE moves it at will.
- SEED-W3 idempotence re-verified post-apply: full re-run = 12× `INSERT 0 0`, per-table md5 checksums identical before/after on all 7 seeded tables.
- All 5 pre-existing live suites re-run post-apply: 36/36 green. No types regen needed (trigger functions never appear in generated types).
- updated_at (8 of 11 tables) deliberately left client-writable — no read path keys on it; reasoning in migration header + session file. Follow-up finding: `verifications.created_at` is client-settable via its INSERT policy (outside signed scope).
- Rollback: 11 `drop trigger` + `drop function` + ledger delete, documented in the migration header.
- Branch: feat/mig-ts. Session: docs/08-agents_work/sessions/2026-07-22-database-engineer-mig-ts.md


## 2026-07-22 — QA GATE — Gate 1 re-review PASS (fix cycle 1): FILM-LAYER + W2-WIRE certified, Gate 1 CLEARED

- QA-Lead re-review of new diffs only: feat/film-layer @ b0dd1ed (fix 70d6623, tests 81aa9ab), feat/w2-wire-engine @ 9356a4f (0406910, eec2e3d, 4d333bf). Both PASS; PASS pinned to these SHAs.
- Independently re-run by QA-Lead: film-layer 615/615, w2-wire 588/588 (live vs staging), tsc 0 + eslint clean on both, merge-tree vs main fa3942b: 0 conflicts both branches.
- All four FILM-LAYER P1s closed in code, not tested-around: atomic claim on every path (incl. element-less dock slot + deferred rect maintenance), three-band stacking contract (bed 30 < chrome 35 < film 40) with C-suite DECISIONS breadcrumb, focalPoint on both buffers + posters via swapClip(clip), fade-gated swaps with fire-time pause re-check + computed-duration release + veto-safe visibility resume. G1-F4 closed.
- W2-WIRE: F12 keyless-fail fixed by construction (beforeAll), keyless wiring guard catches the full-crossover mutant via path assertions, server-only + 32-byte secret floor + .env.example landed; composition.test.ts zero-mock pledge intact.
- MIG-TS verified merged/applied/proven on main (E4 satisfied). Ruling: verifications.created_at INSERT gap = follow-up G1-F12 (no read side today), NOT a T1 blocker; needs its own Founder-signed micro-migration before the verification-resolution flow.
- Merge order: w2-wire → film-layer → full suite on main after each. T1: E1/E2/E3/E4 satisfied; E5 (maker-name ruling) still holds B3 only. G1-F2 untouched — becomes P1 at Gate 2 if B2 ships without it.
- Session: docs/08-agents_work/sessions/2026-07-22-qa-lead-gate1-recheck.md

## 2026-07-22 — QA-Lead Gate-2 PASS — integ/wave3-dryrun

- **Branch:** integ/wave3-dryrun @ be11a12 (17 merges off main @ 578a7ce)
- **Tier:** Full
- **Suite:** 872 passed / 60 skipped / 0 failed (48 test files passed / 9 skipped)
- **Auth paths reviewed:** middleware.ts (feed session cookie), auth/routes.ts (/feed → public)
- **P0/P1:** None
- **P2 (wave-close gate):** Film handoff /feed → /w/[handle] — unverified in execution, Playwright staging test required before Wave-3 T1 "COMPLETE"
- **P3:** Real footage gates design-critic findings; FeedCard.aspect dormant diversity axis
- **Session file:** docs/08-agents_work/sessions/2026-07-22-qa-lead-gate2.md

## 2026-07-22 — QA-Lead Gate-2 BLOCK (revised from PASS) — integ/wave3-dryrun

- **Verdict revision:** Initial PASS reversed to BLOCK on two addenda.
- **P1-A:** Playwright e2e (18 tests) never run on integrated tree — only per-branch. Load-bearing rendered-output gates (bounding-rect proof, anti-grid, scrim gate, focus-tap) unverified post-merge.
- **P1-B:** Font catalog defect in tree: ferreirapress renders in system font stack ("Space Grotesk", "Source Serif 4" not in fontCatalog). Fix dispatched, not landed.
- **Re-submission requirements:** (1) Playwright run on integrated tree, private port; (2) font fix landed + catalog validation test passing.
- **Session file:** docs/08-agents_work/sessions/2026-07-22-qa-lead-gate2.md

## 2026-07-22 — QA-Lead Gate-2 P1-A CLEARED — integ/wave3-dryrun

- Playwright 18/18 on integrated tree, MAIN-T1 rig: pristine detached worktree @ be11a12, port 51873 (verified free), 18.9s, 0 failed.
- All load-bearing gates confirmed: (d) bounding-rect proof, anti-grid negative control, focus-tap, scrim gate, sena curated world, noor custom world.
- P1-B (font catalog fix) still open — BLOCK persists.

## 2026-07-22 — QA-Lead Gate-2 P1-B CLEARED — integ/wave3-dryrun

- font-catalog.test.ts 3/3: ferreirapress re-faced to Fraunces/Satoshi; isoldeglass re-faced to General Sans (second instance found by guard). --accent-3 removed. custom-light --on-media pinned.
- Current integ tip: 1e8e6d7. Vitest: 934 passed / 1 skipped / 0 failed (58 files).
- Playwright run at be11a12 (18/18) carries forward — no layout-affecting changes in new commits.
- BLOCK persists: two items still folding (mobile slot-table fix, dock-geometry assertions). Merge terms stated.

## 2026-07-22 — QA-Lead Gate-2 progress update — integ/wave3-dryrun @ 07d64e0

- P1-A: CLEARED (18/18 Playwright @ be11a12)
- P1-B: CLEARED (font-catalog.test.ts 3/3; 07d64e0 diff verified clean — FilmLayer.tsx attribute-only, StoreWorld.tsx preview-rail layout only, no critical paths)
- P2-A: CLEARED empirically (film-handoff 1/1 @ 1e8e6d7; fold into integ before Wave-3 T1 COMPLETE)
- Dock-geometry: 4/4 accepted as stated
- BLOCK: persists on mobile slot-table fold (B1b). Playwright re-run required on final tip (e2e spec assertions change). 3 artifacts needed: diff stat, vitest 0 failed, Playwright full run.

## 2026-07-22 — QA-Lead Gate-2 PASS — integ/wave3-dryrun @ d7bf5d7

- **Final verdict: PASS — Full tier**
- Vitest: 875 passed / 60 skipped / 0 failed (58 files, pristine worktree, typecheck 0, lint clean)
- Playwright: 23/23 on final tip, port 47311, pristine worktree
  - 18 original (carried from be11a12) + 4 dock-geometry + 1 film-handoff
  - (e) LITERAL constraint PASS — was provably unsatisfiable before slot-table fix
- Critical paths: clean (auth, middleware, migrations, billing, webhooks — none touched; tokens.ts verified as design-token hexes only)
- FeedCard.tsx +4 verified: M-OFF-L inset class --space-16 → --space-14 (pixel-side of model↔pixel pair)
- Wave-close: P2-A cleared empirically (re-run post-merge); P2-B curated nameplate needs /preview fixture with statement off; film-handoff.spec.ts folded into final tip
- Session file: docs/08-agents_work/sessions/2026-07-22-qa-lead-gate2.md
