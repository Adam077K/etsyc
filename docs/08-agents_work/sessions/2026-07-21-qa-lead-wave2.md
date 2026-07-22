---
date: 2026-07-21
role: qa-lead
task: wave2-verdict
tier: full
qa_verdict: BLOCK
baseline: main @ bc36260
---

# QA-Lead — KOL Wave 2 consolidated verdict

**Overall: BLOCK.** Per-branch: P7 **BLOCK** · P6a **PASS** · P6b **PASS** · W1-FF **PASS** · SEED **BLOCK**.
PASS branches are code-certified but the merge train is held by the wave gate (MIG-CHECK below).
All findings verified by QA-Lead at the cited file:line before ruling. Max 2 fix cycles; re-review reads new diffs only.

## Adjudication — id-only intersection (select-videos.ts:31-35)
**P3 stands** (engine reviewer), adversary's P2 overruled. No attacker-controlled path reaches the
`Ranker` seam — rankers are first-party, composed server-side by W2-WIRE via static imports. The id
filter satisfies the documented "discard non-stage-1 candidates" guarantee literally; the residual
mutation gap is a robustness defect against buggy first-party code, not an integrity-boundary breach.
Hardening filed as follow-up F1 (rehydrate clip payload from stage-1 objects by id). CTO must ratify
the section-4.3 deviation in the contract doc — the locked formula has no filter step.

## MUST-FIX-BEFORE-MERGE (5 items — the minimal safe set)
1. **MIG-CHECK** — new branch, `database-engineer`, **Irreversible tier, Founder sign-off**. One migration
   (spec below). Closes adversary P1 (B0: bare text[] app-side-only enum) + qa P1#2 (serial defences)
   + the PostgREST long-key path. Gates the whole train; no Wave-2 branch reworks for it.
2. **P7-T1** — `test-engineer` on `feat/p7-video-profile-tagging`: unit test file for `saveVideoProfile`
   (`apps/kol/src/lib/tagging/__tests__/actions.test.ts`, mocked Supabase client, no key/staging):
   (a) thankyou+feed payload gives fieldErrors AND zero upsert calls; (b) invalid videoId gives error,
   no write; (c) valid input passes parsed payload verbatim to upsert; (d) unauthenticated gives error,
   no write. Closes qa P1#1 (the sole write-time thankyou defence call site has zero tests — verified).
3. **P7-T2** — same worker, same branch: `apps/kol/vitest.config.ts` — remove `src/**/*.eval.ts` from
   default `include`; add explicit `pnpm eval` script/config. Prevents live LLM spend on every
   `pnpm test` the moment the key lands (~39 calls/run).
4. **SEED-S1** — `devops-engineer` on `feat/seed-blocks-catalog`: DELETE `scripts/seed-blocks.sh`; put
   apply instructions in the SQL header (supabase CLI or psql, secrets never in argv). SQL+data are
   clean and PASS as-is; the branch PASSes once the script is gone.
5. **MAIN-T1** — `test-engineer`, Trivial-tier PR to main: `live-account-boundary.test.ts:158`
   becomes `expect(row.bio ?? "").not.toContain(...)`.

## MIG-CHECK migration spec (ONE migration, Irreversible)
`alter table public.video_profiles`
- `video_profiles_purpose_allowed`: `check (purpose <@ array['intro','craft-story','process','product-narration','thankyou','atmosphere']::text[])`
- `video_profiles_page_eligibility_allowed`: `check (page_eligibility <@ array['feed','grown','world','product','checkout','thankyou']::text[])`
- `video_profiles_mood_allowed`: `check (mood <@ array['calm','warm','energetic','intimate']::text[])`
- `video_profiles_thankyou_exclusive`: `check (not ('thankyou' = any(purpose) or 'thankyou' = any(page_eligibility)) or (purpose = array['thankyou']::text[] and page_eligibility = array['thankyou']::text[]))`
- `video_profiles_antirep_key_shape`: `check (anti_repetition_key is null or (char_length(anti_repetition_key) <= 64 and anti_repetition_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'))`

Notes: empty arrays pass `<@` (untagged stays valid/invisible). CHECKs bind service-role too — that is
what makes the two defences parallel. NO cardinality caps (multi-purpose clips are a product decision;
anti-stuffing belongs in scoring — F4). `product_links` is typed uuid[] — nothing needed. Pre-apply:
assert zero nonconforming rows on staging. Acceptance: live test proving a direct owner-JWT PostgREST
write of purpose=['thankyou'] + page_eligibility=['feed'] fails with 23514.

## RIDES-AS-FOLLOW-UP (ordered)
- F1 select-videos: rehydrate SelectedClip payload from stage-1 objects by id + CTO ratifies 4.3 deviation (backend-engineer)
- F2 cookie-ring: write-side serialized-byte bound ~3800B (4096 browser cap vs 8192 read bound asymmetry) + test (backend-engineer)
- F3 eligible.ts FEED: server-side .order() + explicit .limit()/pagination — REQUIRED before B1 serves traffic (backend-engineer)
- F4 rank.ts business-term breadth normalization (tag-stuffing scores 1.0 in 7 states) — CPO+CTO scoring decision
- F5 cookie-ring.test.ts: raw NUL bytes rewritten as backslash-u0000 string escapes so the file is text/diffable — required before any future edit to it (test-engineer)
- F6 W1-FF: restore pre-parse .max(2048) avatar input bound (backend-engineer)
- F7 P7 cost_usd: add cache_creation_input_tokens at 1.25x rate — required BEFORE key provisioning (ai-engineer)
- F8 P7 rate limit + transcript cap on suggest path — required BEFORE key provisioning (backend-engineer)
- F9 429 max-retry doc conflict (spine P7 says 3, ai-pipeline 10.2 says 5) — CTO aligns binding docs
- F10 test batch: .or() string-shape assertion, freshness directional test, suggestTags tests incl. hallucinated-id filter, owner-filter test, TagEditor component tests, SEED drift test (test-engineer)
- F11 sharp <0.35.0 CVEs — pre-existing on main (devops-engineer)

## W2-WIRE binding conditions (Wave 3 — QA will BLOCK without them)
- One real-composition test: P6a+P6b together, no cross-half mocks (qa P2, becomes P1 at wire time).
- `createEligible` gets the ANON client — never the USER client (unpublished-clip leak) and never service.

## SEED privilege ruling (recorded convention — CTO appends to DECISIONS.md)
Management-API `/database/query` (runs as `postgres` under an org-wide PAT) is **FORBIDDEN in
committed automation**. Repo scripts use least privilege: project-scoped service-role or psql with a
scoped connection string; secrets never in argv, never `set -a` exported. Break-glass = documented
manual runbook only, Irreversible floor, Founder sign-off.

## P7 eval disposition
P7 merges DARK once P7-T1/T2 land: verified `not-configured` degradation means no key = feature off
with a designed message — no flag needed. Binding condition: `ANTHROPIC_API_KEY` must NOT be
provisioned in any deployed environment until `tagging_accuracy` runs at macro-F1 >= 0.80 with
thankyou-gate 100% AND F7/F8 land. Eval artifact comes back to QA-Lead as a Lite-tier re-check.

## Panel record
adversary-engineer ADVERSARY-BLOCK · code-reviewer(P7) REVIEW-PASS · code-reviewer(engine) REVIEW-PASS ·
security-engineer PASS/PASS/BLOCK(seed) · qa-engineer COVERAGE-BLOCK. Spawned out-of-band by CEO;
QA-Lead adjudicated on verified evidence. Byte-identical `engine/types.ts` both-added conflict is
intentional (packet 2.3) — not a defect.
