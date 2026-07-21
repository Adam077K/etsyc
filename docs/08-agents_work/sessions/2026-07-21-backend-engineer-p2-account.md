---
date: 2026-07-21
role: backend-engineer
unit: P2 (Account & Profile)
tier: full
qa_verdict: pending
branch: feat/kol-w1-p2-account
---

# P2 Account & Profile — built + live-verified

**Shipped:** `/account` protected any-role route class · Zod profile schemas (displayName/bio/avatarUrl — role+handle deliberately absent, B0) · RLS-scoped own-row update action (sets `updated_at` explicitly; no moddatetime trigger, deferred) · `getPublicProfile` wrapper over the id-keyed `get_public_profile(uuid)` RPC (NEW-1: no list/search shape) · server-only `buyer_signals` paths (service-role `recordBuyerSignal`, RLS read-own `readOwnSignals`) · profile screen with all 4 states.
**Live-verified vs staging (8/8):** own update reflected · cross-user bio invisible under RLS · RPC returns exactly one 4-field row (anon+authed), unknown id → 0 · anon base-table scan shows sellers only · client signal INSERT denied 42501 · weight CHECK 23514 even vs service role · client role change rejected. Test users cleaned up (leftovers asserted 0).
**Green:** typecheck · lint · 412 unit + 8 live tests · `pnpm build` (/account dynamic route).
