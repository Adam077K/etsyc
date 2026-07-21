-- ============================================================================
-- KOL MVP — Migration Plan · Group 08 · Trust (Verifications & Badges)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header. Apply via the migration RUNNER.
--
-- Purpose:  D7 trust layers (P11/S9):
--           - `verifications` : the Real-Maker flow. Links a VOICE-ANCHOR clip in
--             `videos` (OQ-7) to a maker/store; internal.
--           - `badges`        : buyer-facing trust marks. Real-Maker badge is
--             MINTED ONLY when a verification resolves to 'verified' (D7 — never a
--             false claim). AI-Transparency badge carries the honest disclosure.
--
-- Security model (QA fix cycle 1, P1-2 — "no false claims"):
--   RLS is the only boundary, so a maker JWT must NOT be able to self-verify or
--   mint a Real-Maker badge. Therefore:
--     * verifications: a maker may INSERT a REQUEST (forced status='pending',
--       verified_at null) and read own rows. There is NO user UPDATE/DELETE
--       policy — only the SERVICE ROLE resolves status to verified/rejected.
--     * badges: a maker may write ONLY the 'ai-transparency' badge (honest
--       self-disclosure). 'real-maker' badges are SERVICE-ROLE only.
--     * A BEFORE INSERT/UPDATE trigger enforces (regardless of writer, incl.
--       service role) that any 'real-maker' badge references a verification for
--       the SAME store whose status = 'verified'. Structurally no false badge.
--
-- Tables:   verifications, badges
-- Types:    verification_status (pending|verified|rejected),
--           badge_kind (real-maker|ai-transparency),
--           ai_transparency_level (maker-authored|ai-assisted|ai-drafted)
-- Fns/Trig: enforce_real_maker_badge() + badges_real_maker_guard
--
-- FK deps:  verifications.store_id -> stores.id (02); .maker_id -> profiles.id (01);
--           .voice_anchor_clip_id -> videos.id (03)
--           badges.store_id -> stores.id (02); .verification_id -> verifications.id
--
-- Rollback notes (create-only):
--   DROP TRIGGER IF EXISTS badges_real_maker_guard ON public.badges;
--   DROP FUNCTION IF EXISTS public.enforce_real_maker_badge();
--   DROP TABLE IF EXISTS public.badges;
--   DROP TABLE IF EXISTS public.verifications;
--   DROP TYPE  IF EXISTS public.ai_transparency_level;
--   DROP TYPE  IF EXISTS public.badge_kind;
--   DROP TYPE  IF EXISTS public.verification_status;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'verification_status' and n.nspname = 'public') then
    create type public.verification_status as enum ('pending', 'verified', 'rejected');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'badge_kind' and n.nspname = 'public') then
    create type public.badge_kind as enum ('real-maker', 'ai-transparency');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'ai_transparency_level' and n.nspname = 'public') then
    create type public.ai_transparency_level as enum ('maker-authored', 'ai-assisted', 'ai-drafted');
  end if;
end $$;

-- --- verifications (Real-Maker, voice-anchored) -----------------------------
create table if not exists public.verifications (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores (id) on delete cascade,
  maker_id            uuid not null references public.profiles (id) on delete cascade,
  voice_anchor_clip_id uuid references public.videos (id) on delete set null,
  status              public.verification_status not null default 'pending',
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists verifications_store_id_idx on public.verifications (store_id);
create index if not exists verifications_maker_id_idx on public.verifications (maker_id);
create index if not exists verifications_clip_id_idx  on public.verifications (voice_anchor_clip_id);

-- --- badges -----------------------------------------------------------------
create table if not exists public.badges (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores (id) on delete cascade,
  kind             public.badge_kind not null,
  -- real-maker: minting requires a resolved verification (enforced by trigger, D7)
  verification_id  uuid references public.verifications (id) on delete set null,
  -- ai-transparency: honest disclosure of where AI helped
  transparency_level public.ai_transparency_level,
  disclosure       text,
  ai_assisted_fields text[] not null default '{}',  -- copy|layout|palette|...
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (store_id, kind)
);

create index if not exists badges_store_id_idx        on public.badges (store_id);
create index if not exists badges_verification_id_idx on public.badges (verification_id);

-- --- P1-2: a real-maker badge REQUIRES a resolved, same-store verification ---
-- Fires for every writer (including the service role); structurally prevents a
-- Real-Maker badge without a verified verification for that store (D7).
create or replace function public.enforce_real_maker_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'real-maker' then
    if new.verification_id is null
       or not exists (
         select 1 from public.verifications v
         where v.id = new.verification_id
           and v.store_id = new.store_id
           and v.status = 'verified') then
      raise exception 'real-maker badge requires a resolved verification for this store';
    end if;
  end if;
  return new;
end;
$$;

create or replace trigger badges_real_maker_guard
  before insert or update on public.badges
  for each row execute function public.enforce_real_maker_badge();

-- --- RLS --------------------------------------------------------------------
alter table public.verifications enable row level security;
alter table public.badges        enable row level security;

-- verifications: maker reads own + may REQUEST (insert, forced pending). No user
-- UPDATE/DELETE -> only the service role resolves status. Never public.
create policy "verifications_owner_read"
  on public.verifications for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "verifications_owner_request"
  on public.verifications for insert
  with check (
    store_id in (select id from public.stores where owner_id = auth.uid())
    and maker_id = auth.uid()
    and status = 'pending'
    and verified_at is null);

-- badges: PUBLIC read (buyer-facing trust). Maker may write ONLY the
-- ai-transparency badge for own store; real-maker badges are service-role only.
create policy "badges_public_read"
  on public.badges for select
  using (true);
create policy "badges_owner_ai_transparency"
  on public.badges for all
  using (
    kind = 'ai-transparency'
    and store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (
    kind = 'ai-transparency'
    and store_id in (select id from public.stores where owner_id = auth.uid()));

commit;
