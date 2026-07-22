---
date: 2026-07-21
role: backend-engineer
unit: W1-FF (Wave-1 fast-follow queue)
tier: full
branch: feat/w1-fastfollow
qa_verdict: pending
---
All 6 fixes landed, one commit each, on `feat/w1-fastfollow` (typecheck + 442/442 tests + lint green; both sec-p1 open-redirect vectors re-asserted failing closed).
FIX 1 data-loss: account read error now renders a recoverable error state (retry via router.refresh) — never a submittable blank form. FIX 2 avatar 2048 bound post-normalization. FIX 3 ?next= bound 512 on input AND normalized output (additive in parseSameOriginPath). FIX 4 case-insensitive classifyRoute (fails closed). FIX 5 AccountBar → next/link. FIX 6 failed role read bounces via auth-entry (no buyer-feed flash for sellers); rejected ?next= stripped from the sign-in URL server-side.
Decisions for QA: 512 bound rationale, error-state drops AccountBar (role unknown on failed read), removed unused BUYER_LANDING import in auth/actions.ts.
