---
date: 2026-07-22
role: qa-lead
task: wave2-recheck (fix cycle 1 of 2)
tier: full
qa_verdict: PASS
baseline: prior BLOCK at docs/08-agents_work/sessions/2026-07-21-qa-lead-wave2.md (main @ bc36260)
---

# QA-Lead — Wave 2 re-check, fix cycle 1

**Overall: PASS — merge train cleared.** Per-branch: P7 **PASS** (dark) · SEED **PASS** · MAIN-T1 **PASS** ·
AA **PASS** · MIG-CHECK **HOLD** (written-not-applied; converted from merge gate to Wave-3 entry gate, see ruling).
Scope: new diffs only; certified code not re-litigated. All claims below verified directly, not from reports.

## Verification record
- **P7** (`5d970d9`,`87b6bd5`,`348c05a`): `actions.ts` byte-identical to certified `9dcd96b` (empty diff, re-run
  myself); `safeParse` gate present. New `actions.test.ts` meets P7-T1 spec: all 4 required cases + null-input +
  upsert-error mapping, mock-only, zero-call-count assertions, ""→null transform makes verbatim assertion
  mutation-sensitive. Mutation claim (3/6 red on gate deletion) verified by inspection — exactly 3 tests are
  safeParse-sensitive — not re-executed. vitest include narrowed to `src/**/*.test.{ts,tsx}`; eval split via spread
  (correct: mergeConfig concatenates include arrays). **Ran myself: 464/464 in 3.6s (no LLM calls), tsc + eslint clean.**
- **SEED** (`7bef090`): `scripts/seed-blocks.sh` gone (git show errors); seed SQL body untouched (header comments
  only); runbook genuinely least-privilege (psql -W / PGPASSFILE, no argv secrets, no set -a); DECISIONS.md policy
  entry present incl. the psql-not-installed gap.
- **MAIN-T1** (`8959c61`,`7fe50db`): exactly the specified 1-line `?? ""` fix + session file.
- **AA** (`0e4da36`..`bb4b452`, Lite): production diff minimal — sunbaked light `--muted` #6F6153→#645648 in
  tokens.ts + globals.css (consistency test-locked), two alpha-drops with type-scale hierarchy, comment-only
  tailwind change. `no-ink-alpha.test.ts` guard is self-testing (banned + legal fixtures incl. `text-body/80`
  line-height false-positive). aa-audit locks 5.5:1 headroom on ground AND surface. **Ran myself: theme suite
  86/86, full suite 403/403 tests, tsc + eslint clean.** Engineer not chasing spec's 5.16 vs measured 5.33 (both
  pass) is correct — measurement wins.
- **MIG-CHECK** (`bacd411`,`1382794`,`2e59b43`): all 5 predicates semantically identical to my spec; acceptance
  suite covers every specified vector incl. PATCH smuggle + service-role binding; pre-flight 0 rows recorded.
  NOT applied; 23514 proof NOT run — apply is Founder-permission-gated (by design at Irreversible tier).
- P6a `00d9457` / P6b `2e1f040` / W1-FF `b13a9b7` unmoved since certification (all tips predate verdict commit).

## Ruling — serial defences vs the merge train
**P7 clears on the app-layer test alone. The train merges ahead of the migration.** Reasoning:
1. The P1 was an *untested, single* defence. It is now a mutation-pinned defence plus a written, Founder-gated
   second layer. Half the finding is closed with teeth.
2. DB exposure is independent of the merge: `video_profiles` + owner RLS are already live on staging (group 03).
   The PostgREST smuggle vector exists today whether or not P7 merges — merging changes exposure by zero.
   Holding four clean branches on a human permission grant reduces no risk and accrues drift risk.
3. The harm needs a read side: thankyou×feed only leaks when the feed serves it (W2-WIRE/B1, Wave 3). And the
   apply runbook's zero-nonconforming-rows pre-check self-audits the window — rows smuggled before apply surface
   at apply time.
**MIG-CHECK therefore converts from merge gate to HARD Wave-3 entry gate** (condition C1 below).

## Binding conditions on this PASS
- **C1:** 23514 acceptance proof green on staging BEFORE any W2-WIRE/B1 dispatch. QA BLOCKS Wave-3 intake without
  the proof artifact.
- **C2:** `feat/mig-check` merges only AFTER apply + proof (main never carries a phantom un-applied migration
  under the manual-ledger runbook). Proof runs from the branch worktree (needs staging keys there).
- **C3:** ANTHROPIC_API_KEY provisioning gate unchanged — macro-F1 ≥ 0.80 + thankyou-gate 100% + F7/F8 first.
- **C4:** P7 merges DARK (no key in any deployed env), per prior verdict.

## Merge order
1. `fix/live-account-null-bio` → 2. `fix/aa-muted-alpha` → 3. `feat/seed-blocks-catalog` →
4. `feat/p6a-eligible-rank` → 5. `feat/p6b-antirepetition` (identical add/add `engine/types.ts` auto-resolves) →
6. `feat/p7-video-profile-tagging` → 7. `feat/w1-fastfollow` → HOLD `feat/mig-check` (merges last, post-apply).

## Follow-up ledger
F1–F11 unchanged. F2 + F5 remain Wave-3 gates; F7/F8 remain pre-key gates (now also in C3).
**NEW F12** (test-engineer): live suites construct Supabase clients at module scope — collection throws before
`describe.skipIf(!hasKeys)` on keyless checkouts (`live-account-boundary.test.ts:47`,
`live-trust-boundary.test.ts:46`; audit all live suites). Pre-existing on main, surfaced in the keyless aa-fix
worktree. Required before CI wiring — a keyless runner shows red from environment, not code.
**P3 notes (no ticket):** no-ink-alpha guard covers `text-*` utilities only (placeholder-/decoration-/fill- ink
alphas would slip) — fold into F10 batch. MIG-CHECK constraint names differ from verdict spec text
(`_enum`/`_format` vs `_allowed`/`_shape`) — internally consistent with rollback; Founder signs the file itself.
