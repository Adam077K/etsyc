---
date: 2026-07-22
role: qa-lead
task: gate1-recheck (KOL Wave 3, Gate 1 fix cycle 1)
tier: full
qa_verdict: PASS
baseline: main @ fa3942b
branches: feat/film-layer @ b0dd1ed · feat/w2-wire-engine @ 9356a4f
---

# QA-Lead — Gate 1 re-review (fix cycle 1 of 2)

**Overall: PASS — Gate 1 CLEARED.** Per-branch: FILM-LAYER **PASS** · W2-WIRE **PASS**.
MIG-TS (E4) verified merged + applied + proven. Scope: new diffs only, per the re-review contract.
All verification below performed by QA-Lead directly (diffs read at cited commits; suites, tsc,
eslint re-run first-hand — not taken from worker reports).

## Verified first-hand
- **FILM-LAYER** (`70d6623` fix, `81aa9ab` tests): 615/615 green (my run), tsc 0, eslint clean.
  - Fix 1 CLOSED, and atomicity is complete on EVERY path, not only the tested ones:
    `useFilmSlot.claim()` measures inside the claim; HeroStage register + stage-transition paths
    pass rect via `FilmClaimOptions.rect` (incl. the element-less dock slot — `stageSlotSpec` is
    one source of truth); `publishRect` defers via `flightRef`/`maintenanceDirtyRef` while a FLIP
    is in flight and lands on transitionend (+120ms fallback); `positionToSlot` supersede path
    disposes stale flights while the record map stays fresh. Defense in depth: a future consumer
    that still publishes-then-claims degrades to identity-gate settle — no motion AND no false
    `data-film-edge` record. The observable-record lie is dead architecture-wide.
  - Fix 2 CLOSED: three-band contract in globals.css tokens (bed 30 < chrome 35 < film 40),
    `.kol-hero-stage` lifts to chrome band (z-index on flex item — correct per spec),
    `[data-film-docked]` flips planes at claim time; claimed slot is a transparent window;
    contract test pins token order AND wiring. DECISIONS.md breadcrumb landed via C-suite (fa3942b).
  - Fix 3 CLOSED: `swapClip(clip)` object-typed; `clipObjectPosition` on both A/B buffers, layer
    poster underlay, and FilmSlotFrame poster; production-path test mounts FilmLayerProvider +
    StoreWorld and asserts the FRONT buffer.
  - Fix 4 CLOSED: (4a) `fadeRef` gate + latest-wins `deferredSwapRef`; rear release single-sited in
    `beginBufferFade` with fire-time re-check (never front, never pending buffer); (4b) release
    delay from COMPUTED transition duration (`bufferFadeMs`, unit-tested incl. comma lists +
    token fallback); (4c) visibilitychange resumes claimed fronts only, veto-safe, parked stays
    parked — and FilmControls exposes no user pause, so force-resume fights nothing.
  - Fold-in: same-source guard single-sited in `runSwap`, now mutation-pinned (G1-F4 CLOSED).
- **W2-WIRE** (`0406910`, `eec2e3d`, `4d333bf`): 588/588 green (my run, live suites ran against
  staging), tsc 0, eslint clean.
  - Fix 5 CLOSED: client construction moved to `beforeAll`; module scope reads env only; the
    injected test secret is 36 bytes (passes the new floor). Skipped suites never run beforeAll —
    keyless checkouts skip by construction.
  - Fix 6 CLOSED: `engine-deps-wiring.test.ts` mocks ONLY the two supabase factories; the
    `fromLog` path assertion (`anon:video_profiles` / `admin:buyer_signals`) catches the full
    crossover mutant that spy counts alone would miss.
  - Fold-ins verified: `import "server-only"` in eligible.ts; `EngineSecretTooShortError` with
    byte-length (TextEncoder) floor at 32; `.env.example` entry; composition.test.ts zero-vi.mock
    pledge intact (grep: 0).
- **MIG-TS** (b28f929 + f8cda2b + 5aaf8c7 on main): migration matches must-fix 7 verbatim — 11
  tables, one function, BEFORE INSERT OR UPDATE, `auth.role()='service_role'` bypass (never
  uid-null), `search_path=''`, EXECUTE revoked, rollback documented. Audit trail: 5/5 acceptance,
  SEED-W3 idempotence (12× INSERT 0 0, identical md5), 36/36 pre-existing live suites. E4 SATISFIED.
- Both branches merge clean into main @ fa3942b (merge-tree: 0 conflicts).

## Ruling — verifications.created_at INSERT gap
**Follow-up, NOT a T1 blocker** (Wave-2 precedent: the harm needs a read side). Verified in
`20260721000008_trust.sql:134-140`: `verifications_owner_request` pins status/verified_at only;
no client UPDATE path exists; no buyer surface or engine path keys on verifications.created_at.
Impact today is queue-order forgery against a queue no surface reads. Filed **G1-F12**: 12th
trigger via its own Founder-signed micro-migration (worker was right not to expand a signed scope
unilaterally). REQUIRED before any surface orders or displays verification requests by created_at
— i.e., before the verification-resolution/ops flow ships. The updated_at exclusion is ACCEPTED
as reasoned (no consuming read path; write-semantics change; own signed migration when needed —
recorded in the migration header).

## Merge order (conditions binding)
1. `feat/w2-wire-engine` @ 9356a4f → main.
2. `feat/film-layer` @ b0dd1ed → main.
3. Full suite re-run on main after each merge (disjoint file sets; order is engine-before-consumer
   by convention, not necessity).
PASS is pinned to the cited SHAs — any commit added after them voids the PASS for that branch.

## T1 entry conditions — status
- **E1** FILM-LAYER re-certified: **SATISFIED** (this verdict).
- **E2** W2-WIRE re-certified: **SATISFIED** (this verdict).
- **E3** P3-EXT + SEED-W3 on main: SATISFIED (prior cycle).
- **E4** MIG-TS signed + applied + proof: **SATISFIED** (verified above).
- **E5** maker-name ruling (CPO + Design-Lead, DECISIONS.md): **STILL OPEN — holds B3 only.**
Once merges 1-2 land: B1a, B1b, B2, B4, B5, S8 may all dispatch. B2-B5/S8 were already free to
dispatch ahead of B1a on E1+E2; with E4 also satisfied the distinction is moot. B3 waits on E5.

## Follow-up ledger (updated)
- G1-F4 same-source guard mutation-unpinned — **CLOSED this cycle**.
- G1-F12 verifications.created_at INSERT forgery — **NEW** (above; database-engineer, Irreversible
  micro-migration, own Founder signature; due before verification-resolution flow).
- G1-F1 park-without-pause · G1-F3 registerFilm adopt path · G1-F5 createDefaultDeps doc+lint ·
  G1-F6 seed tag-divergence test · G1-F7 OQ-2 same-store ownership (before S1) · G1-F11 F12 sweep
  of 5 pre-existing suites (before CI wiring) — all UNCHANGED.
- **G1-F2 cross-aspect FLIP smear — NOT touched this cycle** (confirmed: `scale(sx, sy)`
  non-uniform invert remains; the identity gate does not address it). Stands as ruled: re-examined
  at Gate 2 with B2, **becomes P1 there if unaddressed**. B2's brief must carry it.

## Panel record
Fix-cycle re-review conducted solo per re-review contract (new diffs only; gate-1 panel findings
stand). Independent verification: diffs read line-by-line at cited commits; both suites, tsc,
eslint re-run by QA-Lead; RLS policy source read for the verifications ruling; merge-tree checked.
