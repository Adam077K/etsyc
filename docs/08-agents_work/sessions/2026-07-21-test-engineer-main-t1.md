---
date: 2026-07-21
role: test-engineer
unit: MAIN-T1 (P2 live suite NULL-bio hardening)
tier: trivial
verdict: PASS
branch: fix/live-account-null-bio
---

# MAIN-T1 — null-safe bio leak assertion in P2 live suite

**Fix (1 line):** `live-account-boundary.test.ts:158` — `expect(row.bio).not.toContain("B-PRIVATE-BIO")` → `expect(row.bio ?? "").not.toContain(...)`. The unfiltered cross-user scan threw TypeError on any visible seller row with NULL bio (hit twice: P7 worker vs staging; masked on main only because P6a's fixture never promotes to seller).

**Verified both directions** via scratch vitest run: old form throws on NULL; new form passes on NULL and on normal bios, and still FAILS when "B-PRIVATE-BIO" is present — leak detection intact.

**Neighbours checked:** only `bio` is nullable among scanned assertions; lines 157/194/228 use crash-safe matchers on NOT NULL columns — no other fix needed.

**Runs:** live suite 8/8 vs staging (3.06s) · `tsc --noEmit` clean · eslint clean.
