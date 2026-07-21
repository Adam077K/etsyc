---
role: backend-engineer
task: p6b-antirepetition
date: 2026-07-21
branch: feat/p6b-antirepetition
tier: full
qa_verdict: pending
---
P6b shipped: stage-3 anti-repetition (KEY_RING_MAX=50, newest-wins), HMAC-SHA256 signed-cookie ring (fail-closed verify, timingSafeEqual, `secret` as required ctor arg — zero env reads), and `selectVideos` composition that structurally enforces selection ⊆ eligible and stage-3-after-stage-2. `types.ts` reproduced byte-identically from dispatch packet §4.1. 28 tests added incl. both QA-greppable structural invariants. Gates: typecheck 0 errors, lint clean, 440/440 tests pass.
