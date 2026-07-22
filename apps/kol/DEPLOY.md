# Deploying the KOL MVP

*Everything on the engineering side is done and verified. Deploy is one
short session, gated on exactly one decision that belongs to the founders:
the public name/URL.*

## The one open decision (do this first)

**Do not let the deployment URL contain "etsyc".** Vercel names a project
after the repo by default, which would publish `etsyc.vercel.app` — public
use of the string the 2026-07-14 trademark decision warns about. Pick a
neutral project name (`kol-app`, `kol-mvp`, …). Separately, "KOL" itself
has never had a trademark/domain check — run one before promoting the URL.

## Deploy steps (~10 minutes)

1. **vercel.com → Add New → Project → Import** the GitHub repo.
2. **Root Directory:** set to `apps/kol` (critical — the app is not at the
   repo root).
3. **Project name:** something neutral, per above.
4. **Environment variables** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL from Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the publishable (`sb_publishable_…`)
     key
   - `ANTHROPIC_API_KEY` — optional; without it the AI seller pipeline runs
     in clearly-labelled simulated mode
   - Do **NOT** set `SUPABASE_SERVICE_ROLE_KEY` unless a server feature
     needs it later; nothing in the current build requires it.
5. **Deploy.**
6. **Register the production auth URLs** in Supabase → Authentication →
   URL Configuration: set Site URL to the deployed origin and ADD
   `https://<your-domain>/auth/callback` to Redirect URLs (keep the
   localhost entries for development). Sign-in emails dead-end without
   this.
7. Smoke-check the deployed URL: `/` shows the honest empty feed
   ("No makers yet"), `/login` shows the email/OTP form, `/sell/*`
   redirects to sign-in.

## What the deployed app is

- Live Supabase backend (31-table schema + 0002 prototype tables + 0003
  product `config_id`), RLS on every table, validated.
- Real email/OTP auth; anonymous browsing preserved by design.
- **Zero fake content.** The database holds only system reference (the
  11-block catalog, 7 categories). All surfaces render honest empty
  states until real makers onboard. Fictional makers exist only in the
  repo's mock layer, which a deployed build never reads.
- Buyer surfaces read live data; seller pipeline screens are prototype UI
  gated behind sign-in (their live wiring is the next build phase).

## Known limits (deliberate, documented)

- The marketplace launches EMPTY — real makers onboard via /sell.
- Film surfaces show designed gradients until D12 footage lands
  (`public/media/README.md` documents the drop-in).
- Client-side 404s return HTTP 200 with a rendered not-found boundary
  (SSR status codes are a post-MVP pass; nothing leaks either way).
- The order production timeline has no backing table yet (ADR gap);
  order detail shows a simple honest status.
- OTP email delivery relies on Supabase's built-in sender (fine for MVP;
  rate-limited — configure custom SMTP before real volume).
