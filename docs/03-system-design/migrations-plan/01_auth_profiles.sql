-- ============================================================================
-- KOL MVP — Migration Plan · Group 01 · Auth & Profiles
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN (reviewed, not executed). Founder applies manually
--           after QA + sign-off. Apply via the migration RUNNER (supabase db
--           push / CI), NOT by pasting into the web SQL Editor — the $$-quoted
--           function/DO bodies must each run as one statement.
--
-- Purpose:  The auth spine (P1/P2, D2). One `profiles` row per auth.users row,
--           carrying the buyer|seller role that every downstream RLS policy keys
--           off. A signup trigger seeds the profile automatically.
--
-- Security model (QA fix cycle 1):
--   * RLS is the ONLY boundary — authed users hit PostgREST directly with their
--     JWT. Every column/transition restriction is DB-ENFORCED (trigger / RPC /
--     view / service-role), never "app-side".
--   * `profiles.role` is NOT client-settable. The signup trigger always seeds
--     'buyer' (client metadata is untrusted). A BEFORE UPDATE trigger blocks any
--     client role change. Upgrade to 'seller' happens ONLY via the service role
--     during seller onboarding (auth.uid() is null under service role, so the
--     guard trigger permits it). [P2-1, P2-2]
--
-- Tables:   profiles          Views: public_profiles (narrow buyer-safe read)
-- Types:    user_role (buyer|seller)
-- Fns/Trig: handle_new_user() + on_auth_user_created (seed profile)
--           guard_profile_role() + profiles_role_guard (block role self-escalation)
--
-- FK deps:  profiles.id -> auth.users.id. This group MUST run first.
--
-- Rollback notes (create-only; do not run in prod):
--   DROP VIEW IF EXISTS public.public_profiles;
--   DROP TRIGGER IF EXISTS profiles_role_guard ON public.profiles;
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.guard_profile_role();
--   DROP FUNCTION IF EXISTS public.handle_new_user();
--   DROP TABLE IF EXISTS public.profiles;
--   DROP TYPE IF EXISTS public.user_role;
-- ============================================================================

begin;

-- --- Types (idempotent guard; runner-applied so DO/$$ is safe) ---------------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('buyer', 'seller');
  end if;
end $$;

-- --- profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'buyer',
  display_name text not null default '',
  handle       text unique,                 -- @username; nullable, set post-signup
  avatar_url   text,
  bio          text check (char_length(bio) <= 280),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_role_idx   on public.profiles (role);
create index if not exists profiles_handle_idx on public.profiles (handle);

-- --- Signup trigger: seed a 'buyer' profile (role NOT trusted from client) ---
-- P2-2: always 'buyer'; handle deferred to null so a unique collision or bad
-- metadata can never fail the auth.users insert. Role -> 'seller' is a later
-- service-role step (seller onboarding).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name, handle)
  values (
    new.id,
    'buyer',
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    null
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- P2-1: block role self-escalation ---------------------------------------
-- A client JWT (auth.uid() not null) may never change its own role. The service
-- role (auth.uid() null) is trusted to upgrade buyer -> seller during onboarding.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'profiles.role may not be changed by the account holder';
  end if;
  return new;
end;
$$;

create or replace trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- --- RLS --------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Full-row read: SELLER profiles (public maker identity) + a user's own row.
-- Buyer PII (bio) stays behind this. Buyer-safe display fields are exposed via
-- the public_profiles view below (P2-3).
create policy "profiles_public_read_sellers"
  on public.profiles for select
  using (role = 'seller' or id = auth.uid());

-- A user may update only their own profile (role change blocked by trigger).
create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT is the SECURITY DEFINER signup trigger only (bypasses RLS). No client
-- INSERT policy. DELETE cascades from auth.users.

-- --- P2-3: narrow public read of buyer display fields -----------------------
-- Buyers appear as review/Q&A authors, thread participants, and in seller
-- order-fulfilment views. Those UIs need display_name + avatar_url only. This
-- definer view exposes exactly {id, display_name, avatar_url, role} for everyone;
-- bio and all other columns remain gated by the base-table policy above.
create or replace view public.public_profiles
  with (security_invoker = false) as
  select id, display_name, avatar_url, role
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

commit;
