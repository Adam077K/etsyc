---
role: devops-engineer
task: seed-s1 (SEED must-fix — remove over-privileged seed script)
tier: full
qa_verdict: pending
---
Closed the security BLOCK on `feat/seed-blocks-catalog`: deleted `scripts/seed-blocks.sh` (Management API `/database/query` runs as `postgres` superuser under an org-wide PAT; PAT in curl argv is ps-visible; `set -a; source .env.local` exported service-role key + DB password to child processes). Seed SQL untouched except its header: apply path is now a documented manual runbook (psql with project-scoped connection string; secrets never in argv, never `set -a` exported; verify query included). Standing policy appended to `.claude/memory/DECISIONS.md`, incl. the known gap that neither psql nor the Supabase CLI is installed on the dev machine. No re-run needed — the 31 rows are live and verified idempotent. Nothing executable added.
