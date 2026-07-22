---
role: database-engineer
task: mig-ts
tier: irreversible
qa_verdict: pending
---
Applied `20260721000016_server_timestamps.sql` (Founder-signed body, verbatim) to staging: `enforce_server_timestamps()` BEFORE INSERT/UPDATE on all 11 exposed tables — INSERT forces `created_at := now()`, UPDATE keeps it immutable, `auth.role()='service_role'` escape hatch (§B0). Kills the feed-eviction vector (2099-dated rows squatting FEED_CANDIDATE_CAP=300 + rank ageDays=0 clamp). Acceptance 5/5 live: forged INSERT → ≈now() on videos + video_profiles; owner PATCH lands but timestamp unmoved; service-role explicit timestamps preserved both ways. SEED-W3 re-run post-apply: 12× `INSERT 0 0`, md5 checksums identical on all 7 seeded tables. Pre-existing live suites 36/36. `updated_at` deliberately NOT covered: no read path ranks/gates on it (engine keys on created_at only) and forcing it is a write-semantics change needing its own sign-off. Follow-up finding for CTO: `verifications.created_at` IS client-settable on INSERT (its policy pins status/verified_at but not created_at) — outside signed scope, queue-order forgery only. Rollback: 11 drop trigger + drop function + ledger delete (in migration header). Branch `feat/mig-ts`.
