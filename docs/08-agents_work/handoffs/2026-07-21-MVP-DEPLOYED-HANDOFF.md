# Handoff: KOL MVP — DEPLOYED & LIVE

**Task:** Continue the KOL MVP after first public deployment
**From:** session `kol-mvp-page-design` (2026-07-21)
**To:** next build team
**Date:** 2026-07-21
**Priority:** High

> Read this file first, then `docs/KOL-START-HERE.md` for product ground truth and
> `.claude/memory/DECISIONS.md` (entries D17, D18, and the two 2026-07-21 deploy entries)
> for the decision trail. This document alone should let you continue without re-deriving state.

---

## Context

KOL is a desktop-first, video-native maker marketplace (see `docs/01-foundation/KOL-v2-concept-lock.md`).
As of 2026-07-21 it is **deployed, public, and running on a live database** — an intentionally
EMPTY marketplace, ready to acquire real makers. Everything below is what you need to keep going
from exactly this position.

---

## 1 · The access points ("contacts") — where everything lives

| What | Where | Who owns / how to access |
|---|---|---|
| **Live site (production)** | https://kol-heard.vercel.app | public; buyer feed, `/login`, `/sell` |
| **GitHub — canonical repo** | `github.com/Adam077K/etsyc` | Adam (founder). PR #1 holds all this work. |
| **GitHub — deploy fork** | `github.com/shaianudani-eng/etsyc` | Shaian. Vercel deploys this fork's `main`. |
| **Working branch** | `claude/kol-mvp-page-design-f0c090` | pushed to BOTH `main` and the branch on the fork |
| **Vercel project** | `kol-heard` (team: shaianudani-eng's projects, Hobby) | Shaian's Vercel (GitHub-auth). Root dir = `apps/kol`. Prod tracks `main`. |
| **Supabase project** | `KOL-Staging`, ref `ktezyykgvqkflmoksmhn`, AWS ca-central-1, Free/Nano | Shaian's Supabase. URL: `https://ktezyykgvqkflmoksmhn.supabase.co` |
| **Anthropic (AI)** | not yet configured | needs a key from console.anthropic.com |
| **Local worktree** | `…/KOL/.claude/worktrees/kol-mvp-page-design-f0c090` | app at `apps/kol/` |

**Human decision-owners** (things that are NOT engineering):
- **Adam (founder)** — approved the DB apply + D17 in person 2026-07-21 (logged as D18). Owns:
  D-number ratification, the "KOL" trademark call, and any Etsy-API/branding move.
- **Shaian** — holds the Vercel + Supabase + fork accounts; ran the deploy in-session.
- Team of four (Adam, Shaian, Thea, Megan) — the D12 footage (their own maker worlds).

## 2 · Credentials — WHERE they are, never the values

- **Supabase public values** (project URL + `sb_publishable_…` anon key): committed convenience copy
  in `apps/kol/.env.development.local` (gitignored) and set in Vercel env for `kol-heard`. Both are
  PUBLIC by design (RLS is the boundary).
- **Supabase secret** (`sb_secret_…` service-role key): **NOT stored anywhere in this repo and never
  was.** Nothing in the current build needs it. If a future server feature does, add it to Vercel env
  + `.env.local` only — never `NEXT_PUBLIC_`, never committed.
- **Anthropic key**: not set. Add `ANTHROPIC_API_KEY` to `apps/kol/.env.local` (local) and Vercel env
  (prod) to turn the AI seller pipeline from simulated → real.
- Env template + full var list: `apps/kol/.env.example` and `apps/kol/DEPLOY.md`.

## 3 · Current state (what's live and true right now)

- **Deployed**: `kol-heard.vercel.app` serves the real app reading live Supabase. Verified: honest
  empty feed ("No maker has filmed for KOL yet"), `/login` renders the real email/OTP form, `/sell/*`
  redirects to sign-in.
- **Database**: 31-table schema (migration 0001) + prototype tables (0002: notifications, collections,
  community) + `products.config_id` (0003) — all APPLIED to KOL-Staging. RLS on every table; 9-point
  validation passed. Seeded, then **wiped clean** — 0 makers/products/reviews/accounts; only system
  reference kept (11-block catalog, 7 categories). `supabase/` has the migrations, `validate.sql`,
  `seed.sql` (dev-only), and `README.md`.
- **Auth**: real Supabase email/OTP. Prod URLs registered (Site URL + `/auth/callback` for localhost,
  prod, and a preview wildcard). Anonymous browsing preserved by design.
- **Data layer**: `apps/kol/src/lib/data/` — one `KolDataSource` interface, mock + supabase adapters,
  `getData()` switches on env. Client-safe (browser client only in client bundles). Every buyer page
  reads it.
- **Quality**: `tsc` clean, `eslint --max-warnings=0` clean, `next build` green (32 routes),
  **60/60 e2e** green (run in mock mode). No fake data or invented stats anywhere in the UI.

## 4 · What was done (this session, in order)

- Reconciled the founder page list → `docs/04-features/PAGE-MAP.md` + 5 new specs (community,
  notifications, collections, buyer-onboarding, events).
- Built the 26-page HTML prototype (`docs/10-page-mockups/`) then the working Next.js app.
- Closed the four product loops (buy, sell→world, community/reviews writes, persistent hero film).
- Added real AI pipeline (simulated w/o key), real MediaRecorder capture, real `<video>` path,
  mobile + a11y pass.
- Applied the DB (0001/0002/0003), validated, seeded, wiped; migrated every page to live data;
  purged all fake stats; deployed to Vercel; wired prod auth.

## 5 · What remains (start at item 1)

1. **Seller pipeline WRITE-wiring** — the `/sell/*` screens are live and gated but still read/write
   the mock seller-state, not Supabase. This is the next real build phase: make S2 interview → S3
   draft → S4 edit → S6 publish actually PERSIST a store-config + products to the DB under the signed-in
   maker (RLS: `stores.owner_id = auth.uid()`). Until this lands, a real maker can't create a live world.
   Verify the OQ-2 id coherence end-to-end once real data exists (config product ids ↔ `products.config_id`).
2. **D12 footage** — films are placeholder gradients. Drop real `.mp4`s per `apps/kol/public/media/README.md`
   and set `videoSrc` on each maker. This is the product's core bet; it can't be validated without it.
3. **AI key** — set `ANTHROPIC_API_KEY` to exercise the real interview/draft/critic (currently simulated).
   `pnpm eval` scores the pipeline once a key is present.
4. **"KOL" trademark check** — preliminary USPTO read done 2026-07-21: NO live bare-"KOL" mark in the
   marketplace/software/SaaS classes (35/42/9); the software-class "KOL" marks are all pharma compounds.
   Encouraging, but "KOL" is crowded (50 live marks) → weak mark. A trademark attorney must clear it
   before promoting the name. Search: tmsearch.uspto.gov, Wordmark = KOL.
5. **Custom SMTP** — OTP email uses Supabase's built-in sender (rate-limited). Configure real SMTP
   before user-acquisition volume, or sign-ins will throttle.
6. **Order-timeline table** — `advanceOrder` throws `NotInSchemaError` (no `order_updates` table). Order
   detail degrades to a simple status. Add the table when the fulfilment timeline is needed.
7. **(Optional) custom domain** on the Vercel project; **status-level 404s** (SSR pass) — post-MVP polish.

## 6 · How to run / deploy

- Local: `cd apps/kol && pnpm install && pnpm dev` (needs `.env.development.local`; without Supabase env
  it runs on mock). Node 24, pnpm via corepack.
- Tests: `./node_modules/.bin/playwright test` (mock mode — unset Supabase env or run on a mock server).
- Deploy: automatic on push to the fork's `main`. Full runbook + env in `apps/kol/DEPLOY.md`.
- **Do NOT** let any future Vercel project/URL carry the string "etsyc" (trademark decision 2026-07-14).

## 7 · Governance reminders (carried from CLAUDE.md)

- QA gate is sacred: no merge to `main` without QA-Lead PASS. Migrations/auth/billing = Irreversible tier,
  Founder sign-off. Adam cannot be bypassed on Irreversible.
- The mock data (`db.ts`, `seed.sql`) is dev/test scaffolding — a production build never reads it. Keep it
  that way; do not seed fake makers into the live DB.

---

*Receiving team: you are inheriting a live, empty, honest MVP. The next unit of value is item 1
(seller write-wiring) so real makers can populate it, in parallel with item 2 (footage).*
