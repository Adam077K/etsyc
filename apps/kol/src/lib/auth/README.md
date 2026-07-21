# `src/lib/auth` — identity for KOL

Real Supabase email/OTP auth (spec: `docs/04-features/specs/store-engine-spine.md`
§P1 Auth, §P2 Account & Profile; schema: `docs/03-system-design/adr/0001-kol-data-model.md`).

It is built to do two things at once:

- **With a Supabase project configured** — real accounts, real sessions in
  httpOnly cookies, a real seller role gate.
- **Without one** — a complete no-op. Every surface degrades to the anonymous
  prototype that exists today. Nothing fakes a session, nothing blocks a page,
  and no network call is made.

The switch is `hasSupabase()` from `@/lib/supabase/config`. There is no third mode.

---

## Environment variables

```bash
# Required — presence of BOTH is what flips the app into authenticated mode.
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or NEXT_PUBLIC_SUPABASE_ANON_KEY

# Server-only. NEVER prefixed NEXT_PUBLIC_, never imported by a client component.
# Used by seller-role elevation, the Stripe webhook, and buyer_signals writes —
# none of which live in this directory.
SUPABASE_SERVICE_ROLE_KEY=...
```

Supabase dashboard settings that must match:

- **Authentication → Providers → Email**: enabled, "Confirm email" on, OTP length 6.
- **Authentication → URL Configuration → Redirect URLs**: add
  `http://localhost:3000/auth/callback` and `https://<prod-domain>/auth/callback`.
  The callback route is the only redirect target this app uses.

---

## Anonymous → authenticated

Anonymous is the default and stays first-class. The buyer feed, search, product
pages, saves, follows, and cart all work signed-out — they live in the existing
`localStorage` session (`src/lib/mock/session.tsx`).

1. A visitor browses anonymously. `useAuth()` returns
   `{ user: null, profile: null, role: "anonymous", isAnonymous: true }`.
2. They hit `/login` or `/signup` and enter an email.
   `signInWithOtp` sends a 6-digit code and a link.
   `/login` passes `shouldCreateUser: false`; `/signup` passes `true`.
3. Either the code is entered in-page (`verifyOtp`) **or** the emailed link
   lands on `/auth/callback`, which exchanges `?code=` (PKCE) or
   `?token_hash=&type=` (OTP link) for a session.
4. On first-ever sign-in the DB trigger `on_auth_user_created` →
   `handle_new_user` seeds the `profiles` row with role **forced `'buyer'`**
   and a null handle. The app never sends a role or handle.
5. The session lands in httpOnly cookies. `src/middleware.ts` refreshes them on
   every navigation via `auth.getUser()`.
6. Landing is role-correct: buyer → `/for-you`, seller → `/sell`
   (`landingFor()` in `types.ts`), or a validated `?next=` path.

**The anonymous prototype session is not migrated on sign-in.** Follows/saves/cart
made while signed-out stay in `localStorage`; they are not silently claimed by the
new account. Merging them is a deliberate future decision (it needs the
`buyer_signals` service-role write path from P2), not something to do implicitly.

---

## What is gated — and what is deliberately not

| Surface | Gate |
|---|---|
| `/`, `/for-you`, `/search`, `/m/**`, `/c/**`, `/cart`, `/checkout` | **Never gated.** The buyer feed is public by design. |
| `/sell` | **Public.** It's the pitch page — gating it would hide the recruiting surface. |
| `/sell/interview`, `/sell/voice`, `/sell/draft`, `/sell/verify` | Signed in (any role). This is onboarding; a buyer must be able to start it. |
| `/sell/dashboard`, `/sell/products`, `/sell/edit`, `/sell/publish` | Signed in **and** `profiles.role = 'seller'`, resolved from the DB. |
| `/settings`, `/orders`, `/me`, `/inbox` | Not gated by middleware. They render an honest signed-out state and their data is RLS-scoped anyway. Gating them in middleware would be a second, weaker copy of the RLS boundary. |

RLS is the real boundary (ADR-0001). The middleware gate is a UX affordance that
saves someone a wasted click — it is **not** the security control, and nothing in
this directory is written as if it were.

---

## Security invariants

1. **Role is server-assigned, always.** Nothing here writes `profiles.role`.
   `handle_new_user` forces `'buyer'`; elevation to `'seller'` is a service-role
   step in seller onboarding; `guard_profile_role` rejects everything else. The
   guard tests `auth.role() = 'service_role'` explicitly — never `auth.uid() IS NULL`
   (N1: anon also has a null uid).
2. **No client-supplied user id is ever trusted.** Every id comes from
   `supabase.auth.getUser()`, which re-validates the JWT against the auth server
   rather than decoding the cookie locally.
3. **The service-role key never reaches a client component.** No file in this
   directory reads it.
4. **Sessions live in httpOnly cookies, not localStorage.** The middleware sets
   `httpOnly: true`, `sameSite: "lax"`, and `secure` in production. Sign-out is a
   POST to `/auth/signout` handled on the server, because the browser cannot
   clear an httpOnly cookie.
5. **`?next=` is validated** (`safeRedirect`): same-origin absolute paths only,
   resolved against our own origin. An open redirect on a magic-link callback is
   how the code leaks.
6. **Cross-user profile reads must use `get_public_profile(uuid)`.** The reads
   here are own-row only and never `SELECT *` — `profiles.bio` is RLS-gated PII.

---

## Files

| File | What it is |
|---|---|
| `types.ts` | Shared shapes, `ANONYMOUS`, `landingFor`, `safeRedirect`, `isValidEmail`. Framework-free. |
| `session.ts` | `getServerUser()` — server components. Returns `{ user, profile, role, isAnonymous }`. |
| `useAuth.tsx` | `useAuth()` — client hook, one shared subscription. Adds `status: "loading" \| "ready"`. |
| `AuthMenu.tsx` | Nav pill: signed-out "Sign in" vs signed-in name/email + sign out. |
| `AccountSection.tsx` | Settings → Account info. Real rows with a session, decorative rows without. |

Routes (owned by this feature, outside this directory):
`src/app/(auth)/login`, `src/app/(auth)/signup`, `src/app/auth/callback/route.ts`,
`src/app/auth/signout/route.ts`, `src/middleware.ts`.

### Server vs client

`session.ts` and `useAuth.tsx` are separate on purpose. `session.ts` reaches
`@/lib/supabase/server`, which uses `next/headers`; re-exporting the hook from it
would drag `next/headers` into the browser bundle and fail the build. Server
components import `getServerUser` from `./session`; client components import
`useAuth` from `./useAuth`.

### Nav integration

`src/components/chrome/Nav.tsx` still has a hard-coded pill linking to `/welcome`.
One swap, described in the handoff notes: import `AuthMenu` from
`@/lib/auth/AuthMenu` and render `<AuthMenu />` in place of that `<Link>`.

---

## Contract with `src/lib/supabase/**`

This directory does not own those files. It binds to exactly three exports:

```ts
// src/lib/supabase/config.ts
export function hasSupabase(): boolean;

// src/lib/supabase/client.ts   (browser)
export function getBrowserClient(): SupabaseClient;

// src/lib/supabase/server.ts   (server, next/headers)
export async function getServerClient(): Promise<SupabaseClient>;
```

Call sites, if those ever move: `session.ts`, `useAuth.tsx`, `AccountSection.tsx`,
`AuthForm.tsx`, `auth/callback/route.ts`, `auth/signout/route.ts`.
`middleware.ts` builds its own `createServerClient` from `@supabase/ssr` directly,
because the `next/headers` cookie adapter does not work in middleware.

The browser client is only ever reached through `await import(...)` inside a
`hasSupabase()` guard, so `requirePublicEnv()` can never throw during a prototype
render.

**The server client must set `httpOnly: true` on session cookies.** The middleware
does; if `server.ts` does not, the token becomes readable from JS and invariant 4
above is broken.
