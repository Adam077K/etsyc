-- ============================================================================
-- KOL MVP — Migration Plan · Group 08 · Trust (Verifications & Badges)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  D7 trust layers (P11/S9):
--           - `verifications` : the Real-Maker flow. Links a VOICE-ANCHOR clip in
--             `videos` (OQ-7) to a maker/store; internal, owner-scoped.
--           - `badges`        : buyer-facing trust marks. Real-Maker badge is
--             MINTED ONLY when a verification resolves to 'verified' (D7 — never a
--             false claim). AI-Transparency badge carries the honest disclosure.
--
-- Tables:   verifications, badges
-- Types:    verification_status (pending|verified|rejected),
--           badge_kind (real-maker|ai-transparency),
--           ai_transparency_level (maker-authored|ai-assisted|ai-drafted)
--
-- FK deps:  verifications.store_id -> stores.id (02); .maker_id -> profiles.id (01);
--           .voice_anchor_clip_id -> videos.id (03)
--           badges.store_id -> stores.id (02); .verification_id -> verifications.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.badges;
--   DROP TABLE IF EXISTS public.verifications;
--   DROP TYPE  IF EXISTS public.ai_transparency_level;
--   DROP TYPE  IF EXISTS public.badge_kind;
--   DROP TYPE  IF EXISTS public.verification_status;
-- ============================================================================

create type public.verification_status   as enum ('pending', 'verified', 'rejected');
create type public.badge_kind            as enum ('real-maker', 'ai-transparency');
create type public.ai_transparency_level as enum ('maker-authored', 'ai-assisted', 'ai-drafted');

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
  -- real-maker: mint only when verification_id resolves to 'verified' (app-enforced, D7)
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

-- --- RLS --------------------------------------------------------------------
alter table public.verifications enable row level security;
alter table public.badges        enable row level security;

-- verifications: internal — owner (maker/store) only. Never public.
create policy "verifications_owner_all"
  on public.verifications for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));

-- badges: PUBLIC read (buyer-facing trust); seller owns writes via store.
create policy "badges_public_read"
  on public.badges for select
  using (true);
create policy "badges_owner_write"
  on public.badges for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));
