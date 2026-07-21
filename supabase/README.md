# KOL — Supabase apply procedure

Everything needed to take the KOL data model from "reviewed on paper" to "running
in a real project", once, without guessing.

| File | What it is |
|---|---|
| `migrations/0001_kol_initial.sql` | The ADR-0001 31-table model, consolidated from the 13 plan files. **Irreversible tier.** Approved to apply under D18. |
| `migrations/0002_kol_prototype_additions.sql` | The four PROPOSED subsystems from the new page specs: notifications, collections, community. Separate on purpose — apply or skip independently. |
| `validate.sql` | The ADR-0001 mandatory 9-point pre-apply validation, runnable. Prints PASS/FAIL per check. |
| `seed.sql` | The prototype's content — 5 makers, their products with full P13 provenance and all 11 P14 spec fields, two store configs, reviews, Q&A — so the deployed app shows what the prototype shows. **Never run on production with real users.** |

> **D18 approved the apply. D18 did not waive the validation.**
> Sequence is fixed: provision staging → apply 0001 → run `validate.sql` → read
> every line → only then consider production.

---

## 0. Before you start

You need:

- A Supabase account.
- The Supabase CLI (`brew install supabase/tap/supabase`) **or** willingness to
  paste SQL into the dashboard SQL Editor. The CLI is strongly preferred —
  see the warning in step 4.
- ~20 minutes.

---

## 1. Create the project

1. <https://supabase.com/dashboard> → **New project**.
2. **Name it neutrally.** Per D18, the repo is still named `etsyc*` and a project
   or deploy URL defaulting to that string publishes a contested trademark. Use
   something like `kol-staging`. Do not accept a default derived from the repo name.
3. Pick a region near your users. Postgres 15 or later.
4. Save the database password somewhere safe at creation time — it is shown once.
5. Create a **second** project, `kol-prod`, only after staging validates clean.
   Staging is not optional here; it is the thing that makes this apply safe.

---

## 2. Find your keys

Dashboard → **Project Settings → API**:

| Value | Where it goes | Secret? |
|---|---|---|
| **Project URL** (`https://<ref>.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` | No — ships in the browser bundle. |
| **anon / publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No — designed to be public. RLS is what protects the data behind it. |
| **service_role / secret key** | `SUPABASE_SERVICE_ROLE_KEY` | **YES. Never in the browser.** |

Dashboard → **Project Settings → Database → Connection string** gives you the
`postgresql://...` URL used by `psql` and the CLI.

### The service-role key

**The service-role key bypasses every RLS policy in this schema.** Whoever holds
it can read every private message, every order, every interview transcript, and
can mint a Real-Maker badge. It is equivalent to the database password.

- It must **never** appear in a `NEXT_PUBLIC_*` variable. In Next.js, any env var
  prefixed `NEXT_PUBLIC_` is inlined into the client bundle at build time and is
  readable by anyone who opens devtools. There is no way to un-ship it.
- It must never be imported into a file under `apps/kol/src/app/**` that is not
  explicitly a Server Component, Route Handler, or Server Action.
- After any build, verify: `grep -r "$SUPABASE_SERVICE_ROLE_KEY" apps/kol/.next/static/`
  must return nothing.
- If it ever leaks, rotate it in the dashboard immediately (Settings → API →
  Reset). Rotation is cheap; a leak is not.

---

## 3. Set the environment variables

Copy `apps/kol/.env.example` to `apps/kol/.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>     # server-only. never NEXT_PUBLIC_.
```

`apps/kol/.env.local` is gitignored by Next.js convention — **confirm it** with
`git check-ignore apps/kol/.env.local` before you paste a key into it. If that
command prints nothing, the file is NOT ignored; stop and fix `.gitignore` first.

For CI and Vercel, set the same three as project environment variables. Mark the
service-role key as a **secret / sensitive** variable, and scope it to the
server-side environments only.

Never commit any of the three real values. `.env.example` holds names and
placeholders only.

---

## 4. Apply `0001`

### Preferred: the migration runner

```bash
supabase link --project-ref <your-ref>
supabase db push
```

The CLI applies files from `supabase/migrations/` in filename order, so `0001`
then `0002`. It sends each statement whole.

Or directly:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_kol_initial.sql
```

### If you must use the dashboard SQL Editor

Paste the **entire file at once** and run it as a single execution. Do not run it
in pieces. The `$$`-quoted function bodies and `do $$ ... $$` blocks must each
reach the server as one statement; a naive semicolon-split will tear them apart
and produce syntax errors that look like schema bugs.

### What "success" looks like

The file is wrapped in one transaction. Either all 31 tables, ~90 indexes, 10
functions, 6 triggers and ~55 policies exist, or none of them do. There is no
half-applied state to clean up. If it fails, read the error, fix it, and re-run
the whole file — it is idempotent.

---

## 5. Run the validation

```bash
psql "$SUPABASE_DB_URL" -f supabase/validate.sql
```

Use `psql`, not the dashboard SQL Editor: the file contains `\echo` section
headers (a psql meta-command the editor rejects) and Part B reports through
`NOTICE` messages the editor surfaces unreliably.

### How to read the output

The file prints three parts.

**Part A — static catalogue checks.** One row per check:

```
 check                                        | result | detail
----------------------------------------------+--------+---------------------------
 1a. 0001 tables present (31 expected)        | PASS   | 31/31 present
 2a. every SECURITY DEFINER fn pins search... | PASS   | all definer functions ...
```

- `PASS` — done, move on.
- `FAIL` — **blocks the production apply.** The `detail` column names the exact
  objects at fault. Fix the migration, re-apply to staging, re-run.
- `SKIP` — the check could not run in this context. `1b` legitimately SKIPs when
  you have not applied `0002` yet. Any other SKIP needs a reason recorded.
- `INFO` — informational, for a human to eyeball (e.g. `9b`, which lists the
  owner of the SECURITY DEFINER functions).

**Part B — live RLS matrix.** Prints `NOTICE` lines, one per assertion:

```
NOTICE:  CHECK 5a create_order ignores client price | PASS | subtotal=10000 (expected 10000)
NOTICE:  CHECK 6c buyer cannot set status=paid directly | PASS
```

This part runs inside a transaction that ends in `ROLLBACK` — it creates two
throwaway users and a test store, asserts the buyer/seller boundary against them,
and then discards everything. Nothing persists.

If Part B prints `PART B | SKIP | cannot insert into auth.users here` then your
connection is not permitted to create users directly. That is not a pass. Create
two users through the Auth API instead and run the same matrix from the app's
integration tests before you proceed.

**Part C — manual checks.** Commented-out `curl` commands. These are the checks
that genuinely cannot be expressed in SQL, because what is under test is the
PostgREST gateway and the anon-key role mapping, not the database alone. Running
the equivalent query as a database role proves nothing about them. Run C1–C5 from
a shell and record the output.

### The bar

Every Part A check `PASS` or explicably `SKIP`; every Part B assertion `PASS`;
C1–C5 run and recorded. Anything less and the schema does not go to production.
This is the ADR-0001 gate and D18 explicitly kept it.

---

## 6. Apply `0002` (optional)

`0002` adds notifications, collections and community. It is separate because all
three are marked PROPOSED in their specs, not locked like ADR-0001, and because
`collections` introduces the **first anon-read policy on user-authored content**
in this schema.

Apply it the same way, then **re-run `validate.sql`**. Checks 1b, 10 and 11 cover
the new surface; C3 and C4 in Part C cover the two boundaries that need real HTTP
requests (slug enumeration, private-community membership gate).

Before applying `0002` to production, get security-engineer eyes on
`collections_public_read` specifically. It is the one policy in this repo where a
single-word mistake publishes private user content to the open internet.

Skipping `0002` costs you the `/notifications`, `/me/collections`, `/c/[slug]`
and community routes. Nothing in `0001` depends on it.

---

## 7. Seed

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

`seed.sql` mirrors `apps/kol/src/lib/mock/db.ts` so the deployed app has the same
content the prototype has. It is idempotent (fixed UUIDs, `on conflict do
update`), so re-running refreshes rather than duplicates.

It creates five `auth.users` rows for the makers. **Run it on staging and demo
projects only.** On a project with real users it would add five fake sellers to
your production data.

---

## 8. Rollback

There is no down-migration. Both files are create-only, and dropping this schema
means dropping user data with it — which is precisely why the tier is
Irreversible and why staging validation is mandatory.

**Before applying to production:**

- Confirm Point-in-Time Recovery is available on your plan, or take a manual
  backup: `pg_dump "$SUPABASE_DB_URL" > pre-0001-$(date +%F).sql`.
- Note the timestamp of the apply. PITR to a point one minute earlier is the
  real rollback path.

**If you must undo manually**, drop in reverse dependency order. The per-group
`Rollback notes` headers in `docs/03-system-design/migrations-plan/*.sql` list the
exact `DROP` statements per group; run groups 13 → 01. Drop the FK constraints
`orders_commission_id_fkey` and `threads_commission_id_fkey` before dropping
`commissions`.

**For `0002`, prefer the feature flags over a schema revert.** Both specs
(`saved-collections.md`, `maker-community.md`) define flag-gated rollback:
disable `saved-collections-public-enabled` to kill the public-read path, or
`maker-community-enabled` to 404 the community routes, with the tables and rows
left intact. That is reversible; dropping the tables is not.

**Fastest safe rollback for a live leak** — if a policy turns out to expose data,
you do not need a migration to stop it:

```sql
drop policy if exists "collections_public_read" on public.collections;
```

RLS denies by default, so removing a policy closes the hole immediately. Fix
forward afterwards.

---

## Notes carried forward from ADR-0001

Recorded so the next person does not rediscover them the hard way:

- **`updated_at` does not auto-touch.** The columns exist with `default now()`
  but there is no `moddatetime` trigger. Set it explicitly on write, or add the
  triggers.
- **`set_order_status` has no from-state machine** (NEW-4). It whitelists target
  states, not legal transitions — `refunded → fulfilled` is currently accepted.
- **`create_order` has no inventory check** (N3). It will happily create an order
  for a `sold-out` product.
- **A `real-maker` badge is not auto-revoked** if its verification is later
  rejected (N4).
- **Polymorphic and array columns have no FK** — `saves.subject_id`,
  `buyer_signals.subject_id`, `collection_items.subject_id`,
  `video_profiles.product_links`, `product_provenance.process_media_ids`,
  `commission_drafts.media_ids`, `community_posts.media_ids`. Postgres cannot
  enforce these. App/Zod validation is load-bearing; the DB will not backstop.
- **The OQ-2 config↔table mirror is an app obligation.** Every
  `stores.config.media.clips[].id` must equal a `videos.id` owned by the same
  store, and the config write plus the `videos`/`video_profiles` upsert must
  happen in one transaction. A desync is a real bug class, not a theoretical one.
