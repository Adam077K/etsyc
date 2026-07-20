-- ============================================================================
-- KOL MVP — Migration Plan · Group 03 · Media, Videos & Video Profiles
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  The D5 video-engine data spine (P6/P7) + generic asset store.
--           - `media`   : images, audio (voiceover source), 3D models, posters.
--           - `videos`  : CANONICAL, queryable film clips (OQ-2). config.media.clips[]
--                         references videos.id.
--           - `video_profiles`: the ONLY signals the engine selects on — purpose,
--                         page-eligibility, product-links, mood, anti-repetition.
--                         1:1 with videos. Array columns are GIN-indexed so the
--                         eligibility filter (∩ of tag sets) is index-served.
--
-- OQ-2 (config <-> table sync contract, HIGHEST RISK — see ADR-0001):
--   videos + video_profiles are the source of truth the engine QUERIES.
--   store-config's `media.clips[]` mirror the subset a given world binds, and
--   each clip's `id` MUST equal a videos.id. The mirror is maintained app-side
--   (write config -> upsert videos/video_profiles in the same transaction).
--   `video_profiles.product_links` is uuid[] and therefore has NO element-level
--   FK (Postgres cannot FK array elements); referential integrity to products is
--   enforced by the Zod config validator, not the DB. This is intentional and
--   also resolves the FK-order question (products come in group 04).
--
-- Tables:   media, videos, video_profiles
-- Types:    media_kind (image|audio|model3d|poster)
--
-- FK deps:  media/videos.owner_id -> profiles.id (01); .store_id -> stores.id (02)
--           video_profiles.video_id -> videos.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.video_profiles;
--   DROP TABLE IF EXISTS public.videos;
--   DROP TABLE IF EXISTS public.media;
--   DROP TYPE  IF EXISTS public.media_kind;
-- ============================================================================

create type public.media_kind as enum ('image', 'audio', 'model3d', 'poster');

-- --- media (images / audio / 3D / posters) ----------------------------------
create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  store_id    uuid references public.stores (id) on delete cascade,   -- null = account-level
  kind        public.media_kind not null,
  src         text not null,
  alt         text,                          -- required for images app-side (a11y)
  aspect      text,                          -- "1:1 | 4:5 | 3:2 | 16:9"
  focal_point jsonb,                         -- { "x":0..1, "y":0..1 }
  duration_ms integer,                       -- audio
  mime        text,
  created_at  timestamptz not null default now()
);

create index if not exists media_owner_id_idx on public.media (owner_id);
create index if not exists media_store_id_idx on public.media (store_id);

-- --- videos (canonical clips, OQ-2) -----------------------------------------
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  store_id    uuid references public.stores (id) on delete cascade,
  src         text not null,
  poster      text,                          -- still frame (feed + loading states)
  duration_ms integer,
  captions_src text,                         -- WebVTT (a11y)
  created_at  timestamptz not null default now()
);

create index if not exists videos_owner_id_idx on public.videos (owner_id);
create index if not exists videos_store_id_idx on public.videos (store_id);

-- --- video_profiles (engine selection signals, 1:1 with videos) -------------
create table if not exists public.video_profiles (
  id                  uuid primary key default gen_random_uuid(),
  video_id            uuid not null unique references public.videos (id) on delete cascade,
  purpose             text[] not null default '{}',   -- intro|craft-story|process|product-narration|thankyou|atmosphere
  page_eligibility    text[] not null default '{}',   -- feed|grown|world|product|checkout|thankyou
  product_links       uuid[] not null default '{}',   -- product ids (app-validated; no element FK)
  mood                text[] not null default '{}',   -- calm|warm|energetic|intimate
  anti_repetition_key text,                            -- engine dedupes on this per session
  created_at          timestamptz not null default now()
);

-- Engine eligibility filter is a set-intersection over these arrays -> GIN.
create index if not exists video_profiles_video_id_idx  on public.video_profiles (video_id);
create index if not exists video_profiles_purpose_gin   on public.video_profiles using gin (purpose);
create index if not exists video_profiles_page_gin      on public.video_profiles using gin (page_eligibility);
create index if not exists video_profiles_product_gin   on public.video_profiles using gin (product_links);
create index if not exists video_profiles_mood_gin      on public.video_profiles using gin (mood);
create index if not exists video_profiles_antirep_idx   on public.video_profiles (anti_repetition_key);

-- --- RLS --------------------------------------------------------------------
alter table public.media          enable row level security;
alter table public.videos         enable row level security;
alter table public.video_profiles enable row level security;

-- media: owner full; public reads media attached to a PUBLISHED store.
create policy "media_owner_all"
  on public.media for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "media_public_read_published"
  on public.media for select
  using (store_id in (select id from public.stores where published = true));

-- videos: owner full; public reads clips of a PUBLISHED store.
create policy "videos_owner_all"
  on public.videos for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "videos_public_read_published"
  on public.videos for select
  using (store_id in (select id from public.stores where published = true));

-- video_profiles: owner full (via parent video); public read for published stores'
-- clips so the anon feed engine can query eligibility signals.
create policy "video_profiles_owner_all"
  on public.video_profiles for all
  using (video_id in (select id from public.videos where owner_id = auth.uid()))
  with check (video_id in (select id from public.videos where owner_id = auth.uid()));
create policy "video_profiles_public_read_published"
  on public.video_profiles for select
  using (video_id in (
    select v.id from public.videos v
    join public.stores s on s.id = v.store_id
    where s.published = true));
