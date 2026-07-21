---
agent: backend-engineer
session: be-p1-auth
task: P1 — email/OTP auth, role forced 'buyer', role-gated routing, RLS anchor
date: 2026-07-21
branch: feat/kol-w1-p1-auth
qa_verdict: pending
tier: irreversible
---

- Email/OTP flow: Zod-validated server actions (`src/lib/auth/actions.ts`) on the anon session client; `signInWithOtp` sends NO metadata — role/handle never leave the client. All 4 spec states in `SignInForm.tsx` (empty/loading/error+resend/success).
- Role-gated routing: extended MIG-STAGE `updateSession` (not forked) with pure route policy `src/lib/auth/routes.ts`; wired via `src/proxy.ts` — Next 16 deprecates `middleware.ts` for `proxy.ts` (deviation from brief filename, verified against installed Next). Role read from RLS-scoped `profiles` row, never JWT metadata.
- Landings: `/feed` (buyer) + `/seller` (seller, server-side re-check); logged-out smoke over HTTP: `/feed`→307 `/sign-in?next=%2Ffeed`, `/seller/orders` gated, public routes 200.
- LIVE trust boundary verified on staging (5/5 in `__tests__/live-trust-boundary.test.ts`, auto-skips without keys): metadata `role:'seller'`+handle at signup → profile seeded `role='buyer'`, `handle=null`; client role update rejected by `guard_profile_role` ("role may not be changed"), role stays buyer; OTP token verify issues session; RLS = own row only vs other buyers. Triggers NOT reimplemented — verified firing. Test users deleted (cascade confirmed empty).
- QA finding #2 LANDED first commit: `getSupabaseServiceRoleKey` moved to `env.server.ts` (`import "server-only"`) — client-bundle misuse is now a build error. App runtime has NO admin-client consumer; service-role used only as test rig.
- `pnpm typecheck` + `lint` + `build` + `test` (351/351) GREEN. Deviations: proxy.ts rename (above); landings are authed shells (feed content = B1, dashboard = S7 — their units).
