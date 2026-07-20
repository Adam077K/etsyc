-- ============================================================================
-- KOL MVP — Migration Plan · Group 02 · Stores & Store Versions
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  The D4 store spine (P3/P4). A store IS its `config jsonb` — the one
--           JSON object the AI drafts and the single renderer consumes (see
--           store-config.schema.md). `store_versions` snapshots the whole config
--           per revision, carrying the auto-critic score (P9) and the
--           section-by-section approval set (P10).
--
-- IMPORTANT (D4): config blocks/theme/media are NOT normalized into columns.
--           The AI emits ONE JSON object; ONE renderer reads it. `stores.config`
--           and `store_versions.config` stay jsonb. The `blocks` TABLE (group 05)
--           is the block-type CATALOG, not per-store block instances.
--
-- Tables:   stores, store_versions
-- Types:    store_version_status (draft|in_review|approved|published)
--
-- FK deps:  stores.owner_id -> profiles.id (group 01)
--           store_versions.store_id -> stores.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.store_versions;
--   DROP TABLE IF EXISTS public.stores;
--   DROP TYPE  IF EXISTS public.store_version_status;
-- ============================================================================

create type public.store_version_status as enum
  ('draft', 'in_review', 'approved', 'published');

-- --- stores -----------------------------------------------------------------
create table if not exists public.stores (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  handle     text not null unique,          -- shop slug, e.g. "ashwork"
  name       text not null default '',
  craft      text,                           -- "hand-thrown stoneware"
  bio        text,
  config     jsonb not null default '{}'::jsonb,  -- D4 store-config (Zod-validated app-side)
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_owner_id_idx  on public.stores (owner_id);
create index if not exists stores_published_idx on public.stores (published);
-- GIN on config supports app-side jsonb containment queries (e.g. media.clips refs).
create index if not exists stores_config_gin     on public.stores using gin (config jsonb_path_ops);

-- --- store_versions ---------------------------------------------------------
create table if not exists public.store_versions (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  version           integer not null,                         -- config.meta.version
  config            jsonb not null,                           -- full snapshot
  status            public.store_version_status not null default 'draft',
  critic_score      numeric(4,3),                             -- P9 auto-critic 0..1
  approved_sections jsonb not null default '[]'::jsonb,       -- P10 blockId[] human gate
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (store_id, version)
);

create index if not exists store_versions_store_id_idx on public.store_versions (store_id);
create index if not exists store_versions_status_idx   on public.store_versions (status);

-- --- RLS --------------------------------------------------------------------
alter table public.stores         enable row level security;
alter table public.store_versions enable row level security;

-- stores: owner has full control; anyone (incl. anon) reads PUBLISHED stores.
create policy "stores_public_read_published"
  on public.stores for select
  using (published = true or owner_id = auth.uid());

create policy "stores_owner_write"
  on public.stores for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- store_versions: OWNER ONLY (drafts are internal). No public read — the live
-- store is served from stores.config, not from draft versions.
create policy "store_versions_owner_all"
  on public.store_versions for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));
