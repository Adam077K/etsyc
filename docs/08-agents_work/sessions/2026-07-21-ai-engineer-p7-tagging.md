---
role: ai-engineer
task: p7-video-profile-tagging
branch: feat/p7-video-profile-tagging
tier: full
qa_verdict: PENDING
status: PARTIAL
resume_point: "STEP 4 — execute tagging_accuracy eval; needs ANTHROPIC_API_KEY in apps/kol/.env.local"
---
P7 built in 5 atomic commits (4a63069→88e4bfe): tag-write contract (Zod trust boundary over bare text[], frozen §7 constants, thankyou-only invariant), seller TagEditor + /seller/clips/[videoId] (4 states, confirm-before-save), shared LLM runner (llm.ts + §10.1 cost-log, 429 backoff/529 fallback), shared eval harness + 13 golden clips + tagging_accuracy metric (set-F1 + thankyou hard gate), live RLS boundary suite (6/6 vs staging). 458 tests green, typecheck+lint clean. Live eval NOT run — ANTHROPIC_API_KEY still absent; eval auto-skips, never mocked. Flagged: P2 live suite's bio assertion is null-fragile on concurrent seller fixtures.
