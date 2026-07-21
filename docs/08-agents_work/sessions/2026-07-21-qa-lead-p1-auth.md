---
date: 2026-07-21
role: qa-lead
unit: P1 (Auth)
tier: irreversible
verdict: PASS
branch: feat/kol-w1-p1-auth
merged: main @ 22ce96e (pushed, Founder-signed-off)
reviewers: [cr-p1, adv-p1, sec-p1, qalead-p1]
---

# P1 Auth — QA PASS (Irreversible) — merged

**Verdict:** PASS. Founder (Adam) signed off; merged to main @ `22ce96e`, pushed. 384/384 tests, typecheck + build green (proxy compiles as Next-16 middleware).

**What shipped:** email/OTP auth (all 4 states) · role forced `buyer` at signup via the `handle_new_user` DB trigger (live-verified: hostile `role:'seller'` metadata still lands buyer) · `guard_profile_role` blocks client role change · session persistence (httpOnly cookies, `getUser()` revalidation) · role-gated routing in `proxy.ts` + page-level re-check + RLS · finding-#2 hardening (service-role key moved to `env.server.ts` server-only).

**QA caught + closed TWO real open-redirect phishing vectors before merge (the gate earned its keep):**
1. Control-char bypass — `?next=/%09//evil.com` (browser strips the tab → `https://evil.com/`). Found by sec-p1 (adv-p1 missed it).
2. Dot-segment bypass — `?next=/..//evil.com` (parser collapses `..` → output `//evil.com`). Found by sec-p1 on re-verify of the first fix.
Closed structurally: `parseSameOriginPath` now re-validates the OUTPUT (re-parses the result, rejects `//`/`/\`), the single choke point for all four redirect surfaces.

**Process lesson (logged for CTO):** adv-p1 tested only the obvious `//`/`/\` open-redirect forms and missed the control-char + dot-segment classes. Future auth-boundary adversary briefs MUST include URL-parser normalization payloads (encoded control chars, dot-segments, backslash variants). The layered independent review (3 reviewers) is what caught this — a single pass would have shipped it. Ran past the 2-cycle QA cap by one round (CEO judgment: converging class-closing fix, not thrashing; flagged to Founder).

**Deferred (P3 → backend-engineer → Wave 2):** next-param length/UX bound; 2 redirect UX edges; case-sensitive route classification (mitigated by page re-check + RLS).

**Wave 1 status:** MIG-STAGE ✅ MIG-APPLY ✅ (9/9) P1 ✅ — only **P2 account/profile** remains to close Wave 1.
