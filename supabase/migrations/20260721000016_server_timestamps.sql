-- ============================================================================
-- KOL MVP — Migration · Group 16 · Server-enforced timestamps (MIG-TS)
-- ----------------------------------------------------------------------------
-- Status:   Wave-2 remediation. IRREVERSIBLE TIER — Founder-signed spec; the
--           function body and the 11-table list are part of the signed spec
--           and must not be altered.
--
-- Purpose:  A Full-tier adversary review found (and the CEO verified live)
--           that `videos.created_at` / `video_profiles.created_at` are
--           attacker-settable: no BEFORE trigger, no CHECK, and
--           `authenticated` holds INSERT/UPDATE column grants on created_at
--           across every exposed table. RLS gates WHOSE row you write, never
--           WHAT values you put in it — the identical gap MIG-CHECK (group
--           15) closed for the tag columns.
--
--           W2-WIRE's F3 fix made this a weapon: bounding the feed to
--           FEED_CANDIDATE_CAP = 300 most-recently-tagged clips turned
--           created_at from a ranking BIAS into a membership GATE. A seller
--           inserting 300 profiles dated 2099-01-01 permanently evicts every
--           other maker from discovery (a future date never rotates out), and
--           rank.ts clamps the future date to ageDays = 0 — permanent maximum
--           freshness. Denial-of-visibility by one maker against all others.
--
--           Mechanism is a TRIGGER, not a column-grant revoke (QA-Lead
--           ruling): column-list grants silently break every future
--           ADD COLUMN and reject benign echo-back upserts. The trigger
--           accepts the write and overrides the value.
--
-- What:     public.enforce_server_timestamps() — BEFORE INSERT OR UPDATE on
--           the 11 exposed tables:
--             videos · video_profiles · stores · store_versions · products ·
--             reviews · media · profiles · carts · commissions · threads
--           INSERT → created_at := now()   (client value ignored)
--           UPDATE → created_at := old.created_at   (immutable)
--           service_role escape hatch (§B0): auth.role() = 'service_role'
--           returns NEW untouched — SEED-W3 idempotence and operator
--           backfills keep explicit timestamp control. NEVER test
--           `auth.uid() is null` (anon is also null uid).
--
-- Deliberately NOT covered (verified live pre-apply, 2026-07-22):
--   * orders / order_items / buyer_signals — zero INSERT or UPDATE RLS
--     policies for authenticated (default deny); the column grant is
--     unreachable. Writes happen only via SECURITY DEFINER RPCs / service
--     role.
--   * verifications — no UPDATE policy; its INSERT policy
--     (verifications_owner_request) pins status='pending' AND
--     verified_at IS NULL, but created_at IS still client-settable on that
--     INSERT path. Out of the Founder-signed scope; recorded as a follow-up
--     finding in the MIG-TS session file (queue-order forgery only — no
--     buyer-surface read keys on it today).
--   * updated_at columns (8 of the 11 carry one) — left client-writable BY
--     DECISION: no read path orders, ranks, or gates on updated_at anywhere
--     in the engine (rank.ts / eligible.ts key exclusively on created_at),
--     so forging it grants nothing; and forcing updated_at := now() on
--     UPDATE is a write-semantics change (echo-back upserts would bump it)
--     that belongs in its own signed migration if/when a read path appears.
--
-- Pre-flight (staging olwtcjzmohdhawdzlzqs, 2026-07-22):
--   * all 11 tables exist; created_at is timestamptz NOT NULL default now()
--     on every one.
--   * existing BEFORE triggers (commissions_guard, profiles_role_guard,
--     reviews_seller_scope_guard, threads_guard) verified to never touch
--     created_at/updated_at; alphabetical firing order puts every guard
--     before the *_server_timestamps trigger — disjoint fields, no
--     interaction.
--   * public.enforce_server_timestamps does not yet exist — no collision.
--   * no app write path sends created_at (grep: reads only) — zero benign
--     collisions; the trigger is purely defensive.
--
-- Apply runbook (MANUAL — no committed automation, per the standing policy in
-- .claude/memory/DECISIONS.md, 2026-07-21):
--   1. psql over the session pooler as the migration role:
--        psql "host=aws-1-us-east-2.pooler.supabase.com port=5432 \
--              dbname=postgres user=postgres.<project-ref> sslmode=require" \
--             -v ON_ERROR_STOP=1 -f <this file>
--      Password via PGPASSFILE (chmod 600) — never on argv, never sourced.
--   2. Record the apply in the ledger:
--        insert into supabase_migrations.schema_migrations (version, name)
--        values ('20260721000016', 'server_timestamps');
--
-- Rollback plan (trigger + function drops only — no data change):
--   drop trigger if exists videos_server_timestamps         on public.videos;
--   drop trigger if exists video_profiles_server_timestamps on public.video_profiles;
--   drop trigger if exists stores_server_timestamps         on public.stores;
--   drop trigger if exists store_versions_server_timestamps on public.store_versions;
--   drop trigger if exists products_server_timestamps       on public.products;
--   drop trigger if exists reviews_server_timestamps        on public.reviews;
--   drop trigger if exists media_server_timestamps          on public.media;
--   drop trigger if exists profiles_server_timestamps       on public.profiles;
--   drop trigger if exists carts_server_timestamps          on public.carts;
--   drop trigger if exists commissions_server_timestamps    on public.commissions;
--   drop trigger if exists threads_server_timestamps        on public.threads;
--   drop function if exists public.enforce_server_timestamps();
--   delete from supabase_migrations.schema_migrations where version = '20260721000016';
-- ============================================================================

begin;

create or replace function public.enforce_server_timestamps()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  -- service_role keeps explicit control (§B0 escape hatch; SEED idempotence depends on it)
  if auth.role() = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    new.created_at := now();
  elsif tg_op = 'UPDATE' then
    new.created_at := old.created_at;   -- immutable
  end if;
  return new;
end $$;

-- Group-14 policy: trigger functions are not client-callable — trigger
-- execution never checks the invoking user's EXECUTE privilege.
revoke execute on function public.enforce_server_timestamps() from public, anon, authenticated;

create or replace trigger videos_server_timestamps
  before insert or update on public.videos
  for each row execute function public.enforce_server_timestamps();

create or replace trigger video_profiles_server_timestamps
  before insert or update on public.video_profiles
  for each row execute function public.enforce_server_timestamps();

create or replace trigger stores_server_timestamps
  before insert or update on public.stores
  for each row execute function public.enforce_server_timestamps();

create or replace trigger store_versions_server_timestamps
  before insert or update on public.store_versions
  for each row execute function public.enforce_server_timestamps();

create or replace trigger products_server_timestamps
  before insert or update on public.products
  for each row execute function public.enforce_server_timestamps();

create or replace trigger reviews_server_timestamps
  before insert or update on public.reviews
  for each row execute function public.enforce_server_timestamps();

create or replace trigger media_server_timestamps
  before insert or update on public.media
  for each row execute function public.enforce_server_timestamps();

create or replace trigger profiles_server_timestamps
  before insert or update on public.profiles
  for each row execute function public.enforce_server_timestamps();

create or replace trigger carts_server_timestamps
  before insert or update on public.carts
  for each row execute function public.enforce_server_timestamps();

create or replace trigger commissions_server_timestamps
  before insert or update on public.commissions
  for each row execute function public.enforce_server_timestamps();

create or replace trigger threads_server_timestamps
  before insert or update on public.threads
  for each row execute function public.enforce_server_timestamps();

commit;
