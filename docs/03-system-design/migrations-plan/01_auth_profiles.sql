-- ============================================================================
-- KOL MVP — Migration Plan · Group 01 · Auth & Profiles
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN (reviewed, not executed). Founder applies manually
--           after QA + sign-off. Do NOT paste $$-quoted bodies line-by-line into
--           the Supabase web SQL Editor — apply via the migration runner
--           (supabase db push) so the trigger function body is one statement.
--
-- Purpose:  The auth spine (P1/P2, D2). One `profiles` row per auth.users row,
--           carrying the buyer|seller role that every downstream RLS policy keys
--           off. A signup trigger seeds the profile automatically.
--
-- Tables:   profiles
-- Types:    user_role (buyer|seller)
-- Fns/Trig: public.handle_new_user() + trigger on auth.users (profile seeding)
--
-- FK deps:  profiles.id -> auth.users.id (Supabase-managed auth schema). No other
--           deps. This group MUST run first — every later group FKs profiles.
--
-- Rollback notes (create-only; provided for completeness, do not run in prod):
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_new_user();
--   DROP TABLE IF EXISTS public.profiles;
--   DROP TYPE IF EXISTS public.user_role;
-- ============================================================================

-- --- Types ------------------------------------------------------------------
-- NOTE: Postgres has no `CREATE TYPE IF NOT EXISTS`. This plan is greenfield
-- create-once; the Founder applies it a single time. Do not wrap in a DO/$$
-- block (the Supabase SQL Editor mis-splits semicolons inside $$).
create type public.user_role as enum ('buyer', 'seller');

-- --- profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'buyer',
  display_name text not null default '',
  handle       text unique,                 -- @username; nullable for buyers
  avatar_url   text,
  bio          text check (char_length(bio) <= 280),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS predicate + lookup indexes
create index if not exists profiles_role_idx   on public.profiles (role);
create index if not exists profiles_handle_idx on public.profiles (handle);

-- --- Signup trigger: seed a profile row, carrying the role flag --------------
-- Standard Supabase pattern (security definer, empty search_path). No DECLARE
-- block, so it is safe against the SQL-Editor semicolon-split bug.
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
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'buyer'),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    new.raw_user_meta_data ->> 'handle'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- RLS --------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Anyone (incl. anon) may read SELLER profiles (public maker identity);
-- a user may always read their own row.
create policy "profiles_public_read_sellers"
  on public.profiles for select
  using (role = 'seller' or id = auth.uid());

-- A user may update only their own profile.
create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT is performed by the SECURITY DEFINER signup trigger only; no direct
-- client INSERT policy (the trigger bypasses RLS). DELETE cascades from auth.users.
