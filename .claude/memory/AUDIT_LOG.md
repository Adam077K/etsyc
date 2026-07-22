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

## 2026-07-22 — STAGING APPLY — MIG-CHECK video_profiles CHECK constraints (Irreversible, Founder-signed)

- Applied `20260721000015_video_profiles_check_constraints.sql` to `olwtcjzmohdhawdzlzqs` — psql/session-pooler, `ON_ERROR_STOP=1`, rc=0 (BEGIN/ALTER TABLE/COMMIT). Ledger row inserted (15 rows total).
- 5 CHECKs live, spec-verbatim names: purpose_enum, page_enum, mood_enum, thankyou_exclusive, antirep_key_format. Verified via pg_constraint post-apply.
- Pre-flight re-run immediately before apply: 0 rows, 0 nonconforming on all 5 predicates. No seller data touched.
- Acceptance proof (owner JWT via PostgREST, not app/Zod): INSERT `purpose=['thankyou'], page_eligibility=['feed']` → **SQLSTATE 23514** `video_profiles_thankyou_exclusive`; PATCH variant → same 23514; all-empty-array row inserts OK (untagged stays valid + invisible). Live suite 7/7 green.
- CHECKs bind the service role too (verified in suite) — the §B0 "app-side only" gap is closed; Zod and DB guards now parallel.
- Rollback: 5 `drop constraint` statements + ledger delete, documented in the migration header.
- Branch: feat/mig-check (rebased onto post-merge-train main). Session: docs/08-agents_work/sessions/2026-07-21-database-engineer-mig-check.md

