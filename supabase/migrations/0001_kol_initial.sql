-- ============================================================================
-- KOL MVP — 0001 · INITIAL SCHEMA (consolidated)
-- ============================================================================
--
--   RISK TIER: **IRREVERSIBLE**.
--   APPROVED UNDER: `.claude/memory/DECISIONS.md` → D18 (2026-07-21, Founder
--   Adam, in person). D18 authorises the APPLY. D18 explicitly does NOT waive
--   validation.
--
--   DO NOT APPLY THIS TO PRODUCTION until `supabase/validate.sql` (the ADR-0001
--   mandatory 9-point pre-apply validation) has been run on a STAGING project
--   and every check prints PASS. Sequence is: provision staging → apply 0001 →
--   run validate.sql → read results → only then apply to production.
--
--   WHAT THIS IS
--   ------------
--   The 31-table KOL MVP data model of ADR-0001 (`docs/03-system-design/adr/
--   0001-kol-data-model.md`), consolidated from the 13 reviewed migration-plan
--   files in `docs/03-system-design/migrations-plan/` into ONE dependency-ordered,
--   idempotent migration. Group order is preserved:
--
--     01 auth/profiles → 02 stores → 03 media/videos → 04 products
--     → 05 blocks/voiceovers → 06 commerce → 07 reviews → 08 trust
--     → 09 interviews → 10 messaging/commissions → 11 public Q&A
--     → 12 relationship signals → 13 search/categories
--
--   SECURITY MODEL (ADR-0001 §Security hardening, rule B0)
--   ------------------------------------------------------
--   RLS is the ONLY boundary. Every authenticated user reaches PostgREST
--   directly with their own JWT, so any restriction that lives only in the app
--   layer is not a restriction at all. Consequently, in this schema a client
--   can never set:
--     * `orders.subtotal_amount` / `order_items.unit_price_amount` — computed
--       server-side inside `create_order()` from `products`;
--     * `orders.buyer_id` — bound to `auth.uid()` inside `create_order()`;
--     * `orders.status` — no client UPDATE policy; only the definer RPCs
--       (`cancel_order`, `set_order_status`) and the service role;
--     * `profiles.role` — seeded 'buyer' by `handle_new_user`, frozen by
--       `guard_profile_role`; only the service role may promote to 'seller'.
--
--   IDEMPOTENCY
--   -----------
--   Re-runnable. Types are DO-guarded, tables/indexes use IF NOT EXISTS,
--   functions use CREATE OR REPLACE, triggers and policies are dropped-if-exists
--   before creation, ALTER-added constraints are catalogue-guarded. The whole
--   file runs inside one transaction: a mid-file failure rolls back wholly and
--   the file can simply be re-applied after the fix.
--
--   APPLY VIA THE MIGRATION RUNNER (`supabase db push` / CI), NOT by pasting
--   into the web SQL Editor — the $$-quoted function and DO bodies must each
--   reach the server as ONE statement.
--
--   FUNCTION SEARCH PATH
--   --------------------
--   Every function below is declared `set search_path = ''` and fully
--   schema-qualifies every reference. ADR-0001 validation step 2 audits
--   `pg_proc.proconfig` for exactly this; do not add a function without it.
--
--   MONEY
--   -----
--   Integer MINOR units + `char(3)` currency everywhere. Never floats.
--   Timestamps are `timestamptz` everywhere.
--
--   KNOWN DEVIATION FROM THE PLAN FILES (flagged, deliberate)
--   ---------------------------------------------------------
--   `product_specs` carries an 11th column `first_use`. The plan file
--   `04_products.sql` defines only 10 columns, but the P14 "Exactly What to
--   Expect" standard as exercised by the prototype (`apps/kol/src/lib/mock/
--   db.ts`, `expectKeys`) has 11 required fields — the 11th being "First use".
--   Adding the column here keeps the DB able to represent everything the
--   prototype already shows. See the note at the table.
--
--   DEFERRED (recorded in ADR-0001, intentionally NOT in this file)
--   --------------------------------------------------------------
--   * `moddatetime` / BEFORE UPDATE auto-touch of `updated_at`.
--   * `guard_commission_draft` role guard (NEW-3).
--   * `set_order_status` from-state transition matrix (NEW-4 / N2).
--   * inventory / sold-out check in `create_order` (N3).
--   * auto-revoke of a `real-maker` badge when its verification is rejected (N4).
--
--   ROLLBACK: see `supabase/README.md`. This migration is create-only; there is
--   no down-migration. Rolling back means restoring the project from a
--   pre-apply PITR point or dropping objects manually in reverse order.
-- ============================================================================

begin;

-- ============================================================================
-- GROUP 01 · AUTH & PROFILES
-- ----------------------------------------------------------------------------
-- One `profiles` row per `auth.users` row, carrying the buyer|seller role that
-- every downstream RLS policy keys off. MUST come first: everything FKs it.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'user_role' and n.nspname = 'public') then
    create type public.user_role as enum ('buyer', 'seller');
  end if;
end $$;

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

-- P2-2 · Signup trigger. Seeds role='buyer' UNCONDITIONALLY — client signup
-- metadata is untrusted, so a user cannot self-register as a seller. `handle`
-- is deferred to null so a unique collision on a client-supplied handle can
-- never fail the auth.users INSERT (which would break signup entirely).
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- P2-1 / N1 · Blocks role self-escalation. PREVENTS: any client (authenticated
-- OR anon) flipping their own `profiles.role` to 'seller' and thereby gaining
-- every seller-scoped write policy in this schema. The escape hatch is tested
-- as auth.role() = 'service_role' EXPLICITLY, never `auth.uid() is null` —
-- anon also has a null uid, so the null idiom would be a silent bypass.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role'
     and new.role is distinct from old.role then
    raise exception 'profiles.role may not be changed by the account holder';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

-- PREVENTS: anon/any user reading buyer PII. Full-row read is limited to SELLER
-- profiles (public maker identity, needed by the anon feed) plus the caller's
-- own row. A buyer's `bio` is never readable by another user through this path.
drop policy if exists "profiles_public_read_sellers" on public.profiles;
create policy "profiles_public_read_sellers"
  on public.profiles for select
  using (role = 'seller' or id = auth.uid());

-- PREVENTS: editing another user's profile. Role changes are additionally
-- blocked by profiles_role_guard above (RLS is row-scoped, not column-scoped).
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- No client INSERT policy: rows are created only by the SECURITY DEFINER signup
-- trigger (which bypasses RLS). DELETE cascades from auth.users.

-- P2-3 / NEW-1 · id-keyed, buyer-safe display read.
-- PREVENTS: membership enumeration. Buyers appear as review/Q&A authors, thread
-- participants and in seller order views, so those UIs need display_name +
-- avatar_url for an id they ALREADY hold. This function returns exactly one
-- known id's public display fields. There is deliberately no unfiltered view
-- (the cycle-1 `public_profiles` view let anon `SELECT *` enumerate every user
-- and was removed). `bio` and every other column stay behind the base policy.
create or replace function public.get_public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar_url text, role public.user_role)
language sql
security definer
stable
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_url, p.role
  from public.profiles p
  where p.id = p_id;
$$;

revoke execute on function public.get_public_profile(uuid) from public;
grant  execute on function public.get_public_profile(uuid) to anon, authenticated;


-- ============================================================================
-- GROUP 02 · STORES & STORE VERSIONS
-- ----------------------------------------------------------------------------
-- D4: a store IS its `config jsonb` — the one JSON object the AI drafts and the
-- single renderer consumes. Blocks/theme/media are NOT normalised into columns.
-- `store_versions` snapshots the whole config per revision with the auto-critic
-- score (P9) and the section approval set (P10).
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'store_version_status' and n.nspname = 'public') then
    create type public.store_version_status as enum
      ('draft', 'in_review', 'approved', 'published');
  end if;
end $$;

create table if not exists public.stores (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  handle     text not null unique,               -- shop slug, e.g. "ashwork"
  name       text not null default '',
  craft      text,
  bio        text,
  config     jsonb not null default '{}'::jsonb, -- D4 store-config (Zod-validated app-side)
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_owner_id_idx  on public.stores (owner_id);
create index if not exists stores_published_idx on public.stores (published);
create index if not exists stores_config_gin    on public.stores using gin (config jsonb_path_ops);

create table if not exists public.store_versions (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores (id) on delete cascade,
  version           integer not null,                     -- config.meta.version
  config            jsonb not null,                       -- full snapshot
  status            public.store_version_status not null default 'draft',
  critic_score      numeric(4,3) check (critic_score is null
                       or (critic_score >= 0 and critic_score <= 1)),   -- P9, 0..1
  approved_sections jsonb not null default '[]'::jsonb,   -- P10 blockId[] human gate
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (store_id, version)
);

create index if not exists store_versions_store_id_idx on public.store_versions (store_id);
create index if not exists store_versions_status_idx   on public.store_versions (status);

alter table public.stores         enable row level security;
alter table public.store_versions enable row level security;

-- PREVENTS: anon reading an unpublished (still-drafting) world. Published
-- stores are anon-readable because the discovery feed must serve signed-out
-- visitors; the owner always sees their own.
drop policy if exists "stores_public_read_published" on public.stores;
create policy "stores_public_read_published"
  on public.stores for select
  using (published = true or owner_id = auth.uid());

-- P2-6 · PREVENTS: a buyer JWT creating a store (and thereby unlocking every
-- seller-scoped policy downstream: products, media, orders-received, answers).
-- The WITH CHECK demands owner = caller AND caller holds role='seller', which
-- only the service role can grant (see guard_profile_role).
drop policy if exists "stores_owner_write" on public.stores;
create policy "stores_owner_write"
  on public.stores for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'seller'));

-- PREVENTS: anyone reading another maker's unreleased drafts and critic scores.
-- Owner-only, no public read at all — the live world is served from
-- stores.config, never from a draft version row.
drop policy if exists "store_versions_owner_all" on public.store_versions;
create policy "store_versions_owner_all"
  on public.store_versions for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));


-- ============================================================================
-- GROUP 03 · MEDIA, VIDEOS & VIDEO PROFILES
-- ----------------------------------------------------------------------------
-- OQ-2: `videos` + `video_profiles` are the CANONICAL queryable source of truth
-- for the video engine; `stores.config.media.clips[]` mirror the bound subset
-- for the renderer and every clip id must equal a videos.id owned by the same
-- store. The DB cannot enforce that (ids live inside jsonb) — the Zod validator
-- does, at write time, in the same transaction as the config write.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'media_kind' and n.nspname = 'public') then
    create type public.media_kind as enum ('image', 'audio', 'model3d', 'poster');
  end if;
end $$;

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  store_id    uuid references public.stores (id) on delete cascade,   -- null = account-level
  kind        public.media_kind not null,
  src         text not null,
  alt         text,                          -- required for images app-side (a11y)
  aspect      text,                          -- "1:1 | 4:5 | 3:2 | 16:9"
  focal_point jsonb,                         -- { "x":0..1, "y":0..1 }
  duration_ms integer,
  mime        text,
  created_at  timestamptz not null default now()
);

create index if not exists media_owner_id_idx on public.media (owner_id);
create index if not exists media_store_id_idx on public.media (store_id);

create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  store_id     uuid references public.stores (id) on delete cascade,
  src          text not null,
  poster       text,                         -- still frame (feed + loading states)
  duration_ms  integer,
  captions_src text,                         -- WebVTT (a11y)
  created_at   timestamptz not null default now()
);

create index if not exists videos_owner_id_idx on public.videos (owner_id);
create index if not exists videos_store_id_idx on public.videos (store_id);

create table if not exists public.video_profiles (
  id                  uuid primary key default gen_random_uuid(),
  video_id            uuid not null unique references public.videos (id) on delete cascade,
  purpose             text[] not null default '{}',   -- intro|craft-story|process|product-narration|thankyou|atmosphere
  page_eligibility    text[] not null default '{}',   -- feed|grown|world|product|checkout|thankyou
  product_links       uuid[] not null default '{}',   -- product ids (app-validated; no element FK)
  mood                text[] not null default '{}',   -- calm|warm|energetic|intimate
  anti_repetition_key text,                           -- engine dedupes on this per session
  created_at          timestamptz not null default now()
);

-- The engine's eligibility filter is a set-intersection over these arrays, so
-- each one is GIN-indexed: selection must be index-served, never a jsonb scan.
create index if not exists video_profiles_video_id_idx on public.video_profiles (video_id);
create index if not exists video_profiles_purpose_gin  on public.video_profiles using gin (purpose);
create index if not exists video_profiles_page_gin     on public.video_profiles using gin (page_eligibility);
create index if not exists video_profiles_product_gin  on public.video_profiles using gin (product_links);
create index if not exists video_profiles_mood_gin     on public.video_profiles using gin (mood);
create index if not exists video_profiles_antirep_idx  on public.video_profiles (anti_repetition_key);

alter table public.media          enable row level security;
alter table public.videos         enable row level security;
alter table public.video_profiles enable row level security;

-- P1-5 · PREVENTS: cross-store brand hijack. Without the store_id clause in the
-- WITH CHECK, an attacker could insert a row with their OWN owner_id but a
-- VICTIM's store_id, injecting media into someone else's world. store_id must
-- be null (account-level) or a store the caller owns.
drop policy if exists "media_owner_all" on public.media;
create policy "media_owner_all"
  on public.media for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (store_id is null
         or store_id in (select id from public.stores where owner_id = auth.uid())));

drop policy if exists "media_public_read_published" on public.media;
create policy "media_public_read_published"
  on public.media for select
  using (store_id in (select id from public.stores where published = true));

-- P1-5 · same cross-store guard as media.
drop policy if exists "videos_owner_all" on public.videos;
create policy "videos_owner_all"
  on public.videos for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (store_id is null
         or store_id in (select id from public.stores where owner_id = auth.uid())));

drop policy if exists "videos_public_read_published" on public.videos;
create policy "videos_public_read_published"
  on public.videos for select
  using (store_id in (select id from public.stores where published = true));

-- PREVENTS: writing selection signals onto someone else's clip (which would let
-- an attacker inject their footage into another maker's narration/feed slots).
drop policy if exists "video_profiles_owner_all" on public.video_profiles;
create policy "video_profiles_owner_all"
  on public.video_profiles for all
  using (video_id in (select id from public.videos where owner_id = auth.uid()))
  with check (video_id in (select id from public.videos where owner_id = auth.uid()));

-- Anon read is required: the signed-out feed engine queries eligibility signals.
-- Scoped to clips of PUBLISHED stores only.
drop policy if exists "video_profiles_public_read_published" on public.video_profiles;
create policy "video_profiles_public_read_published"
  on public.video_profiles for select
  using (video_id in (
    select v.id from public.videos v
    join public.stores s on s.id = v.store_id
    where s.published = true));


-- ============================================================================
-- GROUP 04 · PRODUCTS, SPECS & PROVENANCE
-- ----------------------------------------------------------------------------
-- Canonical product catalogue (commerce + search source of truth) plus the two
-- D16 trust subsystems: P14 "Exactly What to Expect" (product_specs) and P13
-- "Proof of Product" (product_provenance — maker-DECLARED, not third-party
-- physically verified; D7 forbids implying otherwise).
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'inventory_status' and n.nspname = 'public') then
    create type public.inventory_status as enum ('in-stock', 'made-to-order', 'sold-out');
  end if;
end $$;

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores (id) on delete cascade,
  title            text not null,
  description      text,                       -- maker's own copy (AI-assist OK, D10)
  materials        text,                       -- surfaced in search (B11)
  price_amount     integer not null check (price_amount >= 0),   -- MINOR units
  currency         char(3) not null default 'GBP' check (char_length(currency) = 3),
  inventory_status public.inventory_status not null default 'in-stock',
  inventory_qty    integer check (inventory_qty is null or inventory_qty >= 0),
  model3d_id       uuid references public.media (id) on delete set null,
  badges           text[] not null default '{}',  -- one-of-a-kind|made-to-order|limited
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_store_id_idx on public.products (store_id);
create index if not exists products_model3d_idx  on public.products (model3d_id);

-- P14 · the required structured product-info standard, 1:1 with a product.
-- NOTE: `first_use` is the 11th field. It is present in the P14 field set the
-- prototype renders (apps/kol mock `expectKeys`) but absent from migration-plan
-- file 04_products.sql, which lists only 10. Added here so the DB can hold
-- everything the product page already shows. See the header's "KNOWN DEVIATION".
create table if not exists public.product_specs (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null unique references public.products (id) on delete cascade,
  dimensions           text,
  materials            text,
  texture              text,
  handmade_variation   text,
  production_time      text,
  shipping             text,
  care                 text,
  repairs              text,
  returns              text,
  customization_limits text,
  first_use            text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Idempotent add for a database created from an earlier plan revision.
alter table public.product_specs add column if not exists first_use text;

create index if not exists product_specs_product_id_idx on public.product_specs (product_id);

create table if not exists public.product_provenance (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null unique references public.products (id) on delete cascade,
  maker_role          text,                    -- e.g. "designed & hand-thrown by me"
  materials           text,
  process             text,
  production_location text,
  partners            text,
  process_media_ids   uuid[] not null default '{}',  -- media/videos ids (app-validated)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists product_provenance_product_id_idx on public.product_provenance (product_id);

alter table public.products           enable row level security;
alter table public.product_specs      enable row level security;
alter table public.product_provenance enable row level security;

-- PREVENTS: a seller editing another store's catalogue — including its prices,
-- which `create_order()` trusts as the server-side source of truth. Ownership
-- is derived through the store, so there is no direct owner_id to spoof.
drop policy if exists "products_owner_all" on public.products;
create policy "products_owner_all"
  on public.products for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));

drop policy if exists "products_public_read_published" on public.products;
create policy "products_public_read_published"
  on public.products for select
  using (store_id in (select id from public.stores where published = true));

drop policy if exists "product_specs_owner_all" on public.product_specs;
create policy "product_specs_owner_all"
  on public.product_specs for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));

drop policy if exists "product_specs_public_read_published" on public.product_specs;
create policy "product_specs_public_read_published"
  on public.product_specs for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));

drop policy if exists "product_provenance_owner_all" on public.product_provenance;
create policy "product_provenance_owner_all"
  on public.product_provenance for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));

drop policy if exists "product_provenance_public_read_published" on public.product_provenance;
create policy "product_provenance_public_read_published"
  on public.product_provenance for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));


-- ============================================================================
-- GROUP 05 · BLOCK CATALOG & VOICEOVERS
-- ----------------------------------------------------------------------------
-- OQ-1: `blocks` is the STATIC catalogue of block TYPES + variants the one
-- renderer supports — platform reference data, not per-store instances. Per-
-- store block instances live in `stores.config.blocks[]` (jsonb). Do NOT create
-- a `store_blocks` table.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'voiceover_element_kind' and n.nspname = 'public') then
    create type public.voiceover_element_kind as enum ('block', 'product', 'field');
  end if;
end $$;

create table if not exists public.blocks (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,   -- hero-video|craft-story|product-showcase|...
  variant         text not null,   -- center-column|masonry|expandable-detail|...
  allowed_states  text[] not null default '{empty,loading,error,success}',
  prop_schema_ref text,            -- pointer to the Zod prop schema for this type
  created_at      timestamptz not null default now(),
  unique (type, variant)
);

create index if not exists blocks_type_idx on public.blocks (type);

create table if not exists public.voiceovers (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  element_kind public.voiceover_element_kind not null,
  element_id   text not null,     -- blockId | productId | field owner id
  element_field text,             -- for kind=field (e.g. "title"); else null
  media_id     uuid references public.media (id) on delete set null,  -- audio asset
  src          text not null,     -- seller-recorded REAL voice (D11: no cloning)
  duration_ms  integer,
  transcript   text,              -- optional a11y; NOT the source of the copy
  label        text not null,     -- buyer-facing, e.g. "Hear Sena on this glaze"
  created_at   timestamptz not null default now()
);

create index if not exists voiceovers_store_id_idx on public.voiceovers (store_id);
create index if not exists voiceovers_media_id_idx on public.voiceovers (media_id);

alter table public.blocks     enable row level security;
alter table public.voiceovers enable row level security;

-- Public read (the renderer needs the catalogue). There is deliberately NO
-- client write policy, which PREVENTS: any user adding or altering a block type
-- and thereby changing what the single renderer will compose for every store.
-- The service role bypasses RLS to seed/maintain the catalogue.
drop policy if exists "blocks_public_read" on public.blocks;
create policy "blocks_public_read"
  on public.blocks for select
  using (true);

-- PREVENTS: attaching a voiceover to a store you do not own — i.e. putting
-- words in another maker's mouth on their own world.
drop policy if exists "voiceovers_owner_all" on public.voiceovers;
create policy "voiceovers_owner_all"
  on public.voiceovers for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));

drop policy if exists "voiceovers_public_read_published" on public.voiceovers;
create policy "voiceovers_public_read_published"
  on public.voiceovers for select
  using (store_id in (select id from public.stores where published = true));


-- ============================================================================
-- GROUP 06 · COMMERCE (CARTS, ORDERS, ORDER ITEMS)
-- ----------------------------------------------------------------------------
-- P1-1 · Orders and line items have SELECT-ONLY RLS. There are NO client INSERT
-- or UPDATE policies anywhere on `orders` / `order_items`. Every mutation goes
-- through a SECURITY DEFINER RPC that computes amounts server-side, or through
-- the service role (Stripe webhook → 'paid').
--
-- FORWARD REF (OQ-3): `orders.commission_id` is created here as a plain nullable
-- uuid; its FK to `commissions` is added in group 10 below.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'cart_status' and n.nspname = 'public') then
    create type public.cart_status as enum ('active', 'checked_out', 'abandoned');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'order_status' and n.nspname = 'public') then
    create type public.order_status as enum
      ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');
  end if;
end $$;

create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  status     public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_buyer_id_idx on public.carts (buyer_id);
create unique index if not exists carts_one_active_per_buyer
  on public.carts (buyer_id) where (status = 'active');

create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  buyer_id                 uuid not null references public.profiles (id) on delete restrict,
  store_id                 uuid not null references public.stores (id) on delete restrict,
  commission_id            uuid,   -- FK → commissions(id) added in group 10 (OQ-3)
  status                   public.order_status not null default 'pending',
  subtotal_amount          integer not null check (subtotal_amount >= 0),  -- MINOR units
  currency                 char(3) not null default 'GBP' check (char_length(currency) = 3),
  stripe_payment_intent_id text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx      on public.orders (buyer_id);
create index if not exists orders_store_id_idx      on public.orders (store_id);
create index if not exists orders_commission_id_idx on public.orders (commission_id);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid not null references public.products (id) on delete restrict,
  quantity          integer not null check (quantity > 0),
  unit_price_amount integer not null check (unit_price_amount >= 0),  -- snapshot, MINOR
  currency          char(3) not null default 'GBP' check (char_length(currency) = 3),
  variation         text,   -- chosen variation / customization context
  created_at        timestamptz not null default now()
);

create index if not exists order_items_order_id_idx   on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- create_order · single-store checkout.
--   p_items = jsonb array of { product_id uuid, quantity int, variation text|null }.
-- PREVENTS: a client setting its own price, its own buyer_id, or a non-'pending'
-- status. Amounts and currency are read from `public.products`; any price the
-- client sends is simply never read. buyer_id is bound to auth.uid().
create or replace function public.create_order(p_store_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer    uuid := auth.uid();
  v_order    uuid;
  v_currency char(3);
  v_subtotal integer := 0;
  v_item     jsonb;
  v_pid      uuid;
  v_qty      integer;
  v_price    integer;
  v_cur      char(3);
begin
  if v_buyer is null then
    raise exception 'authentication required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;
  if not exists (select 1 from public.stores s where s.id = p_store_id and s.published = true) then
    raise exception 'store not found or not published';
  end if;

  insert into public.orders (buyer_id, store_id, status, subtotal_amount, currency)
  values (v_buyer, p_store_id, 'pending', 0, 'GBP')
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item ->> 'product_id')::uuid;
    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_qty <= 0 then
      raise exception 'invalid quantity for product %', v_pid;
    end if;

    select p.price_amount, p.currency into v_price, v_cur
    from public.products p
    where p.id = v_pid and p.store_id = p_store_id;

    if v_price is null then
      raise exception 'product % is not in store %', v_pid, p_store_id;
    end if;
    if v_currency is null then
      v_currency := v_cur;
    elsif v_currency <> v_cur then
      raise exception 'mixed currencies in one order';
    end if;

    insert into public.order_items
      (order_id, product_id, quantity, unit_price_amount, currency, variation)
    values
      (v_order, v_pid, v_qty, v_price, v_cur, v_item ->> 'variation');

    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  update public.orders
    set subtotal_amount = v_subtotal,
        currency        = coalesce(v_currency, 'GBP'),
        updated_at      = now()
    where id = v_order;

  return v_order;
end;
$$;

-- cancel_order · PREVENTS: cancelling someone else's order, and cancelling an
-- order that has already been fulfilled/refunded. Scope is enforced in the WHERE
-- clause, not by the caller.
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
    set status = 'cancelled', updated_at = now()
    where id = p_order_id
      and buyer_id = auth.uid()
      and status in ('pending', 'paid');
  if not found then
    raise exception 'order not cancellable';
  end if;
end;
$$;

-- set_order_status · seller fulfilment on own-store orders only.
-- PREVENTS: a seller marking an order 'paid' (that is the Stripe webhook via the
-- service role — a seller could otherwise fake payment), and PREVENTS touching
-- any other column: this RPC writes only `status`.
-- KNOWN GAP (ADR NEW-4/N2): target states are whitelisted but legal FROM→TO
-- transitions are not; deferred.
create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('fulfilled', 'cancelled', 'refunded') then
    raise exception 'status % not settable by seller', p_status;
  end if;
  update public.orders o
    set status = p_status, updated_at = now()
    where o.id = p_order_id
      and o.store_id in (select id from public.stores where owner_id = auth.uid());
  if not found then
    raise exception 'order not found for this seller';
  end if;
end;
$$;

-- Anon must not reach any write RPC. `public` includes anon, so revoke first,
-- then grant to authenticated only. ADR validation step 3 asserts this.
revoke execute on function public.create_order(uuid, jsonb)                   from public;
revoke execute on function public.cancel_order(uuid)                          from public;
revoke execute on function public.set_order_status(uuid, public.order_status) from public;
grant  execute on function public.create_order(uuid, jsonb)                   to authenticated;
grant  execute on function public.cancel_order(uuid)                          to authenticated;
grant  execute on function public.set_order_status(uuid, public.order_status) to authenticated;

alter table public.carts       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Cart is scratch space; no money lives here, so buyer full control is safe.
drop policy if exists "carts_buyer_all" on public.carts;
create policy "carts_buyer_all"
  on public.carts for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- SELECT-ONLY. The ABSENCE of INSERT/UPDATE policies here is the control that
-- PREVENTS: a buyer POSTing an order row with a price of 1p, or PATCHing
-- status='paid' without paying. Do not add write policies to these two tables.
drop policy if exists "orders_buyer_read" on public.orders;
create policy "orders_buyer_read"
  on public.orders for select
  using (buyer_id = auth.uid());

drop policy if exists "orders_seller_read_received" on public.orders;
create policy "orders_seller_read_received"
  on public.orders for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

drop policy if exists "order_items_buyer_read" on public.order_items;
create policy "order_items_buyer_read"
  on public.order_items for select
  using (order_id in (select id from public.orders where buyer_id = auth.uid()));

drop policy if exists "order_items_seller_read" on public.order_items;
create policy "order_items_seller_read"
  on public.order_items for select
  using (order_id in (
    select o.id from public.orders o
    where o.store_id in (select id from public.stores where owner_id = auth.uid())));


-- ============================================================================
-- GROUP 07 · REVIEWS & REVIEW MEDIA
-- ----------------------------------------------------------------------------
-- OQ-7: `verified` is a GENERATED column (true iff order_item_id is not null) —
-- verified-purchase is derivable, never separately settable. `maker_response`
-- is a single column on the review, not a child table.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'review_media_kind' and n.nspname = 'public') then
    create type public.review_media_kind as enum ('image', 'video');
  end if;
end $$;

create table if not exists public.reviews (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  buyer_id             uuid not null references public.profiles (id) on delete cascade,
  order_item_id        uuid references public.order_items (id) on delete set null,
  rating               integer not null check (rating between 1 and 5),
  body                 text,
  variation            text,   -- which variation was purchased
  expectation_accuracy integer check (expectation_accuracy is null
                                      or expectation_accuracy between 1 and 5),
  -- GENERATED: PREVENTS a buyer marking their own unverified review "verified".
  verified             boolean generated always as (order_item_id is not null) stored,
  maker_response       text,   -- single seller response column (OQ-7)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (buyer_id, order_item_id)   -- one review per buyer per purchased line
);

create index if not exists reviews_product_id_idx   on public.reviews (product_id);
create index if not exists reviews_buyer_id_idx     on public.reviews (buyer_id);
create index if not exists reviews_order_item_id_idx on public.reviews (order_item_id);

create table if not exists public.review_media (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  kind       public.review_media_kind not null,
  src        text not null,
  alt        text,
  created_at timestamptz not null default now()
);

create index if not exists review_media_review_id_idx on public.review_media (review_id);

-- P1-4 · column-scoped seller restriction. RLS is row-scoped, so the policy
-- below can only say "seller may UPDATE reviews on own products"; this trigger
-- supplies the column scope. PREVENTS: a seller editing away a 1-star rating,
-- rewriting the body, or re-pointing the review at a different product/buyer.
-- The service role is unrestricted (N1: explicit role test, not a null-uid test).
create or replace function public.enforce_review_seller_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role'
     and auth.uid() is distinct from old.buyer_id then
    if new.rating               is distinct from old.rating
       or new.body                 is distinct from old.body
       or new.variation            is distinct from old.variation
       or new.expectation_accuracy is distinct from old.expectation_accuracy
       or new.product_id           is distinct from old.product_id
       or new.buyer_id             is distinct from old.buyer_id
       or new.order_item_id        is distinct from old.order_item_id then
      raise exception 'a seller may update only maker_response';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_seller_scope_guard on public.reviews;
create trigger reviews_seller_scope_guard
  before update on public.reviews
  for each row execute function public.enforce_review_seller_scope();

alter table public.reviews      enable row level security;
alter table public.review_media enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select
  using (true);

-- P1-3 · PREVENTS: reviewing a product you never bought by borrowing an
-- unrelated line item you did buy. The bound order_item must belong to the
-- caller AND its product must equal the review's product.
drop policy if exists "reviews_buyer_insert" on public.reviews;
create policy "reviews_buyer_insert"
  on public.reviews for insert
  with check (
    buyer_id = auth.uid()
    and order_item_id in (
      select oi.id
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.buyer_id = auth.uid()
        and oi.product_id = reviews.product_id));

-- Same check is re-applied on UPDATE, which PREVENTS: swapping the bound
-- order_item afterwards to fabricate a "verified" flag on a mismatched product.
drop policy if exists "reviews_buyer_modify" on public.reviews;
create policy "reviews_buyer_modify"
  on public.reviews for update
  using (buyer_id = auth.uid())
  with check (
    buyer_id = auth.uid()
    and order_item_id in (
      select oi.id
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.buyer_id = auth.uid()
        and oi.product_id = reviews.product_id));

drop policy if exists "reviews_buyer_delete" on public.reviews;
create policy "reviews_buyer_delete"
  on public.reviews for delete
  using (buyer_id = auth.uid());

-- Row scope only; the column scope is reviews_seller_scope_guard above.
drop policy if exists "reviews_seller_respond" on public.reviews;
create policy "reviews_seller_respond"
  on public.reviews for update
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));

drop policy if exists "review_media_public_read" on public.review_media;
create policy "review_media_public_read"
  on public.review_media for select
  using (true);

-- PREVENTS: attaching photos to another buyer's review.
drop policy if exists "review_media_buyer_all" on public.review_media;
create policy "review_media_buyer_all"
  on public.review_media for all
  using (review_id in (select id from public.reviews where buyer_id = auth.uid()))
  with check (review_id in (select id from public.reviews where buyer_id = auth.uid()));


-- ============================================================================
-- GROUP 08 · TRUST (VERIFICATIONS & BADGES)
-- ----------------------------------------------------------------------------
-- D7: never a false claim. A Real-Maker badge exists only downstream of a
-- verification that a human at KOL resolved to 'verified'.
-- ============================================================================

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

create table if not exists public.verifications (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores (id) on delete cascade,
  maker_id             uuid not null references public.profiles (id) on delete cascade,
  voice_anchor_clip_id uuid references public.videos (id) on delete set null,
  status               public.verification_status not null default 'pending',
  verified_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists verifications_store_id_idx on public.verifications (store_id);
create index if not exists verifications_maker_id_idx on public.verifications (maker_id);
create index if not exists verifications_clip_id_idx  on public.verifications (voice_anchor_clip_id);

create table if not exists public.badges (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  kind               public.badge_kind not null,
  verification_id    uuid references public.verifications (id) on delete set null,
  transparency_level public.ai_transparency_level,
  disclosure         text,
  ai_assisted_fields text[] not null default '{}',  -- copy|layout|palette|...
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (store_id, kind)
);

create index if not exists badges_store_id_idx        on public.badges (store_id);
create index if not exists badges_verification_id_idx on public.badges (verification_id);

-- P1-2 · PREVENTS: a false Real-Maker badge. Fires for EVERY writer, including
-- the service role — this guard trusts no one, because the badge is the single
-- strongest trust claim in the product (D7). A 'real-maker' row must reference a
-- verification for the SAME store whose status is 'verified'.
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

drop trigger if exists badges_real_maker_guard on public.badges;
create trigger badges_real_maker_guard
  before insert or update on public.badges
  for each row execute function public.enforce_real_maker_badge();

alter table public.verifications enable row level security;
alter table public.badges        enable row level security;

-- Never public: a pending/rejected verification is not a buyer-facing fact.
drop policy if exists "verifications_owner_read" on public.verifications;
create policy "verifications_owner_read"
  on public.verifications for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

-- PREVENTS: self-verification. A maker may only REQUEST — status is pinned to
-- 'pending' and verified_at to null in the WITH CHECK. There is deliberately NO
-- user UPDATE or DELETE policy, so only the service role can resolve a request.
drop policy if exists "verifications_owner_request" on public.verifications;
create policy "verifications_owner_request"
  on public.verifications for insert
  with check (
    store_id in (select id from public.stores where owner_id = auth.uid())
    and maker_id = auth.uid()
    and status = 'pending'
    and verified_at is null);

drop policy if exists "badges_public_read" on public.badges;
create policy "badges_public_read"
  on public.badges for select
  using (true);

-- PREVENTS: a maker minting themselves a 'real-maker' badge. The kind predicate
-- appears in BOTH using and with check, so a maker can only ever write the
-- honest self-disclosure badge. (The trigger above is the second, absolute line.)
drop policy if exists "badges_owner_ai_transparency" on public.badges;
create policy "badges_owner_ai_transparency"
  on public.badges for all
  using (
    kind = 'ai-transparency'
    and store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (
    kind = 'ai-transparency'
    and store_id in (select id from public.stores where owner_id = auth.uid()));


-- ============================================================================
-- GROUP 09 · AI INTERVIEW (S2, D8)
-- ----------------------------------------------------------------------------
-- Raw interview capture that feeds the AI store draft. PRIVATE to the maker —
-- never public, at any point.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'interview_mode' and n.nspname = 'public') then
    create type public.interview_mode as enum ('film', 'voice');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'interview_status' and n.nspname = 'public') then
    create type public.interview_status as enum ('in_progress', 'complete');
  end if;
end $$;

create table if not exists public.interviews (
  id         uuid primary key default gen_random_uuid(),
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid references public.stores (id) on delete set null,  -- may predate the store
  mode       public.interview_mode not null,
  status     public.interview_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_maker_id_idx on public.interviews (maker_id);
create index if not exists interviews_store_id_idx on public.interviews (store_id);

create table if not exists public.interview_answers (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  beat_key     text not null,      -- fixed story-beat identifier
  question     text,               -- the (possibly follow-up) prompt asked
  answer_text  text,               -- transcript / typed answer
  media_id     uuid references public.media (id) on delete set null,  -- film/voice answer
  ordinal      integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists interview_answers_interview_id_idx on public.interview_answers (interview_id);
create index if not exists interview_answers_media_id_idx     on public.interview_answers (media_id);

alter table public.interviews        enable row level security;
alter table public.interview_answers enable row level security;

-- No public read policy at all. PREVENTS: raw, unedited personal storytelling
-- (the maker's unpolished answers about family, money, failure) leaking to
-- buyers or to other makers.
drop policy if exists "interviews_maker_all" on public.interviews;
create policy "interviews_maker_all"
  on public.interviews for all
  using (maker_id = auth.uid())
  with check (maker_id = auth.uid());

drop policy if exists "interview_answers_maker_all" on public.interview_answers;
create policy "interview_answers_maker_all"
  on public.interview_answers for all
  using (interview_id in (select id from public.interviews where maker_id = auth.uid()))
  with check (interview_id in (select id from public.interviews where maker_id = auth.uid()));


-- ============================================================================
-- GROUP 10 · MESSAGING & COMMISSIONS
-- ----------------------------------------------------------------------------
-- OQ-3: a commission is a pre-order negotiation entity with its own lifecycle,
-- linked to a thread; an approved commission YIELDS an order. OQ-5 keeps this
-- private subsystem strictly separate from the public Q&A of group 11.
-- Circular FK: threads.commission_id ↔ commissions.thread_id — both tables are
-- created first, then the back-reference FKs are added.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'message_kind' and n.nspname = 'public') then
    create type public.message_kind as enum ('text', 'audio', 'video');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'commission_status' and n.nspname = 'public') then
    create type public.commission_status as enum
      ('brief', 'negotiating', 'drafting', 'approved', 'rejected', 'cancelled');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'commission_draft_status' and n.nspname = 'public') then
    create type public.commission_draft_status as enum ('proposed', 'revised', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.threads (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references public.profiles (id) on delete cascade,
  maker_id      uuid not null references public.profiles (id) on delete cascade,
  store_id      uuid references public.stores (id) on delete set null,
  commission_id uuid,   -- FK added below, once commissions exists
  subject       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint threads_distinct_parties check (buyer_id <> maker_id)
);

create index if not exists threads_buyer_id_idx      on public.threads (buyer_id);
create index if not exists threads_maker_id_idx      on public.threads (maker_id);
create index if not exists threads_store_id_idx      on public.threads (store_id);
create index if not exists threads_commission_id_idx on public.threads (commission_id);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  kind       public.message_kind not null default 'text',
  body       text,
  media_id   uuid references public.media (id) on delete set null,  -- audio/video message
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_id_idx on public.messages (thread_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_media_id_idx  on public.messages (media_id);

create table if not exists public.commissions (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid references public.stores (id) on delete set null,
  thread_id  uuid references public.threads (id) on delete set null,
  brief      jsonb not null default '{}'::jsonb,  -- recipient/occasion/meaning/preferences
  status     public.commission_status not null default 'brief',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commissions_distinct_parties check (buyer_id <> maker_id)
);

create index if not exists commissions_buyer_id_idx  on public.commissions (buyer_id);
create index if not exists commissions_maker_id_idx  on public.commissions (maker_id);
create index if not exists commissions_store_id_idx  on public.commissions (store_id);
create index if not exists commissions_thread_id_idx on public.commissions (thread_id);

-- Back-reference FKs (catalogue-guarded: PG15 has no ADD CONSTRAINT IF NOT EXISTS).
do $$ begin
  if not exists (select 1 from pg_constraint
                 where conname = 'threads_commission_id_fkey'
                   and conrelid = 'public.threads'::regclass) then
    alter table public.threads
      add constraint threads_commission_id_fkey
      foreign key (commission_id) references public.commissions (id) on delete set null;
  end if;
end $$;

-- OQ-3 · wire the group-06 forward-declared column.
do $$ begin
  if not exists (select 1 from pg_constraint
                 where conname = 'orders_commission_id_fkey'
                   and conrelid = 'public.orders'::regclass) then
    alter table public.orders
      add constraint orders_commission_id_fkey
      foreign key (commission_id) references public.commissions (id) on delete set null;
  end if;
end $$;

create table if not exists public.commission_drafts (
  id            uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions (id) on delete cascade,
  version       integer not null,
  content       jsonb not null default '{}'::jsonb,
  media_ids     uuid[] not null default '{}',   -- media/videos ids (app-validated)
  note          text,
  status        public.commission_draft_status not null default 'proposed',
  created_at    timestamptz not null default now(),
  unique (commission_id, version)
);

create index if not exists commission_drafts_commission_id_idx on public.commission_drafts (commission_id);

-- P2-5 · PREVENTS: opening a private thread with an arbitrary user (the maker
-- must actually be a seller), and PREVENTS attaching a thread to a store the
-- maker does not own (which would make the conversation appear to come from
-- someone else's world).
create or replace function public.guard_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.buyer_id = new.maker_id then
    raise exception 'thread parties must differ';
  end if;
  if not exists (select 1 from public.profiles p
                 where p.id = new.maker_id and p.role = 'seller') then
    raise exception 'thread maker must be a seller';
  end if;
  if new.store_id is not null
     and not exists (select 1 from public.stores s
                     where s.id = new.store_id and s.owner_id = new.maker_id) then
    raise exception 'thread store must belong to the maker';
  end if;
  return new;
end;
$$;

drop trigger if exists threads_guard on public.threads;
create trigger threads_guard
  before insert or update on public.threads
  for each row execute function public.guard_thread();

-- P2-5 · PREVENTS: unilateral self-approval. `commissions_participants_all`
-- gives both parties UPDATE, so without this guard a buyer could set their own
-- commission to 'approved' and drive an order off it. Transitions are role-
-- scoped: buyer → brief|cancelled; maker → negotiating|drafting|approved|
-- rejected|cancelled. Also PREVENTS a maker opening a commission on a buyer's
-- behalf (INSERT must come from the buyer, at status 'brief').
create or replace function public.guard_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.buyer_id = new.maker_id then
    raise exception 'commission parties must differ';
  end if;
  if not exists (select 1 from public.profiles p
                 where p.id = new.maker_id and p.role = 'seller') then
    raise exception 'commission maker must be a seller';
  end if;
  if new.store_id is not null
     and not exists (select 1 from public.stores s
                     where s.id = new.store_id and s.owner_id = new.maker_id) then
    raise exception 'commission store must belong to the maker';
  end if;

  -- Interactive callers only; the service role is trusted (N1: explicit role
  -- test — anon also has a null uid, so a null-uid test would be a bypass).
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      if auth.uid() <> new.buyer_id or new.status <> 'brief' then
        raise exception 'a commission must be opened by the buyer with status brief';
      end if;
    elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
      if auth.uid() = old.buyer_id then
        if new.status not in ('brief', 'cancelled') then
          raise exception 'buyer may only set status brief or cancelled';
        end if;
      elsif auth.uid() = old.maker_id then
        if new.status not in ('negotiating', 'drafting', 'approved', 'rejected', 'cancelled') then
          raise exception 'maker may not set status %', new.status;
        end if;
      else
        raise exception 'only the commission parties may change status';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists commissions_guard on public.commissions;
create trigger commissions_guard
  before insert or update on public.commissions
  for each row execute function public.guard_commission();

alter table public.threads           enable row level security;
alter table public.messages          enable row level security;
alter table public.commissions       enable row level security;
alter table public.commission_drafts enable row level security;

-- Two participants only, never public. PREVENTS: reading a private buyer↔maker
-- negotiation (which contains gift recipients, occasions, budgets).
drop policy if exists "threads_participants_all" on public.threads;
create policy "threads_participants_all"
  on public.threads for all
  using (buyer_id = auth.uid() or maker_id = auth.uid())
  with check (buyer_id = auth.uid() or maker_id = auth.uid());

drop policy if exists "messages_participants_read" on public.messages;
create policy "messages_participants_read"
  on public.messages for select
  using (thread_id in (
    select id from public.threads
    where buyer_id = auth.uid() or maker_id = auth.uid()));

-- PREVENTS: forging a message as the other party (sender_id must be the caller)
-- and PREVENTS posting into a thread you are not in.
drop policy if exists "messages_sender_insert" on public.messages;
create policy "messages_sender_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and thread_id in (
      select id from public.threads
      where buyer_id = auth.uid() or maker_id = auth.uid()));

drop policy if exists "commissions_participants_all" on public.commissions;
create policy "commissions_participants_all"
  on public.commissions for all
  using (buyer_id = auth.uid() or maker_id = auth.uid())
  with check (buyer_id = auth.uid() or maker_id = auth.uid());

drop policy if exists "commission_drafts_participants_all" on public.commission_drafts;
create policy "commission_drafts_participants_all"
  on public.commission_drafts for all
  using (commission_id in (
    select id from public.commissions
    where buyer_id = auth.uid() or maker_id = auth.uid()))
  with check (commission_id in (
    select id from public.commissions
    where buyer_id = auth.uid() or maker_id = auth.uid()));


-- ============================================================================
-- GROUP 11 · ASK THE MAKER (PUBLIC Q&A)
-- ----------------------------------------------------------------------------
-- OQ-5: deliberately separate from threads/messages. Public-read here, private
-- there — merging them would either leak private threads or hide public Q&A.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'answer_kind' and n.nspname = 'public') then
    create type public.answer_kind as enum ('text', 'audio', 'video');
  end if;
end $$;

create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),  -- spam guard
  created_at timestamptz not null default now()
);

create index if not exists questions_product_id_idx on public.questions (product_id);
create index if not exists questions_store_id_idx   on public.questions (store_id);
create index if not exists questions_buyer_id_idx   on public.questions (buyer_id);

create table if not exists public.answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  maker_id    uuid not null references public.profiles (id) on delete cascade,
  kind        public.answer_kind not null default 'text',
  body        text,
  media_id    uuid references public.media (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists answers_question_id_idx on public.answers (question_id);
create index if not exists answers_maker_id_idx    on public.answers (maker_id);
create index if not exists answers_media_id_idx    on public.answers (media_id);

alter table public.questions enable row level security;
alter table public.answers   enable row level security;

drop policy if exists "questions_public_read" on public.questions;
create policy "questions_public_read"
  on public.questions for select
  using (true);

drop policy if exists "answers_public_read" on public.answers;
create policy "answers_public_read"
  on public.answers for select
  using (true);

-- P2-8 · PREVENTS: posting a public question against a mismatched store_id
-- (which would surface the question on an unrelated maker's world) and PREVENTS
-- questions on unpublished/private stores. Body length is bounded as a spam guard.
drop policy if exists "questions_buyer_write" on public.questions;
create policy "questions_buyer_write"
  on public.questions for all
  using (buyer_id = auth.uid())
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = questions.product_id
        and p.store_id = questions.store_id
        and s.published = true));

-- PREVENTS: answering in another maker's name, or answering questions on a
-- store you do not own.
drop policy if exists "answers_seller_write" on public.answers;
create policy "answers_seller_write"
  on public.answers for all
  using (
    maker_id = auth.uid()
    and question_id in (
      select q.id from public.questions q
      where q.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (
    maker_id = auth.uid()
    and question_id in (
      select q.id from public.questions q
      where q.store_id in (select id from public.stores where owner_id = auth.uid())));


-- ============================================================================
-- GROUP 12 · RELATIONSHIP & RANKING SIGNALS
-- ----------------------------------------------------------------------------
-- OQ-4: `buyer_signals` is an append-only event log the ranking/video engine
-- consumes. These are RELATIONSHIP signals, not general popularity.
-- `saves.subject_id` and `buyer_signals.subject_id` are polymorphic and
-- therefore have no FK — integrity is app/Zod-enforced, the DB will not backstop.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'save_subject' and n.nspname = 'public') then
    create type public.save_subject as enum ('product', 'store');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'signal_subject' and n.nspname = 'public') then
    create type public.signal_subject as enum ('maker', 'store', 'product');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'signal_type' and n.nspname = 'public') then
    create type public.signal_type as enum
      ('visit', 'purchase', 'question', 'save', 'follow', 'commission', 'review');
  end if;
end $$;

create table if not exists public.follows (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, maker_id)
);

create index if not exists follows_buyer_id_idx on public.follows (buyer_id);
create index if not exists follows_maker_id_idx on public.follows (maker_id);

create table if not exists public.saves (
  id           uuid primary key default gen_random_uuid(),
  buyer_id     uuid not null references public.profiles (id) on delete cascade,
  subject_type public.save_subject not null,
  subject_id   uuid not null,   -- polymorphic; no FK (app-validated)
  created_at   timestamptz not null default now(),
  unique (buyer_id, subject_type, subject_id)
);

create index if not exists saves_buyer_id_idx on public.saves (buyer_id);
create index if not exists saves_subject_idx  on public.saves (subject_type, subject_id);

create table if not exists public.buyer_signals (
  id           uuid primary key default gen_random_uuid(),
  buyer_id     uuid not null references public.profiles (id) on delete cascade,
  subject_type public.signal_subject not null,
  subject_id   uuid not null,   -- polymorphic; no FK (app-validated)
  signal_type  public.signal_type not null,
  weight       numeric(6,3) not null default 1.0 check (weight >= 0 and weight <= 100),
  created_at   timestamptz not null default now()
);

create index if not exists buyer_signals_lookup_idx
  on public.buyer_signals (buyer_id, subject_type, subject_id, signal_type);
create index if not exists buyer_signals_subject_idx
  on public.buyer_signals (subject_type, subject_id);

alter table public.follows       enable row level security;
alter table public.saves         enable row level security;
alter table public.buyer_signals enable row level security;

-- PREVENTS: following on someone else's behalf, or reading who else a buyer
-- follows. A maker may read their own follower rows (needed for follower counts
-- and for notification fan-out).
drop policy if exists "follows_buyer_all" on public.follows;
create policy "follows_buyer_all"
  on public.follows for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

drop policy if exists "follows_maker_read" on public.follows;
create policy "follows_maker_read"
  on public.follows for select
  using (maker_id = auth.uid());

-- Private by design: a buyer's saves are not a public wishlist.
drop policy if exists "saves_buyer_all" on public.saves;
create policy "saves_buyer_all"
  on public.saves for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- P2-4 · READ-OWN ONLY, and the absence of an INSERT policy is the control.
-- PREVENTS: a client writing arbitrary weighted signals to farm its own ranking
-- (or another buyer's). Signals are emitted server-side by the engine via the
-- service role; the weight CHECK is defence-in-depth.
drop policy if exists "buyer_signals_buyer_read" on public.buyer_signals;
create policy "buyer_signals_buyer_read"
  on public.buyer_signals for select
  using (buyer_id = auth.uid());


-- ============================================================================
-- GROUP 13 · SEARCH & BROWSE
-- ----------------------------------------------------------------------------
-- OQ-6: MVP search = generated tsvector + GIN, plus pg_trgm for typo tolerance.
-- Categories are a normalised join (chosen over text[]) for shared taxonomy,
-- parent/child facets and referential integrity on browse filters.
-- ============================================================================

create extension if not exists pg_trgm;

alter table public.stores
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' || coalesce(craft, '') || ' ' || coalesce(bio, ''))
  ) stored;

create index if not exists stores_search_tsv_gin on public.stores using gin (search_tsv);
create index if not exists stores_handle_trgm    on public.stores using gin (handle gin_trgm_ops);
create index if not exists stores_name_trgm      on public.stores using gin (name gin_trgm_ops);

alter table public.products
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(materials, ''))
  ) stored;

create index if not exists products_search_tsv_gin on public.products using gin (search_tsv);
create index if not exists products_title_trgm     on public.products using gin (title gin_trgm_ops);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  parent_id  uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists categories_parent_id_idx on public.categories (parent_id);

create table if not exists public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx on public.product_categories (category_id);

alter table public.categories         enable row level security;
alter table public.product_categories enable row level security;

-- Public reference data. No client write policy PREVENTS: a seller inventing
-- taxonomy entries that reshape browse for the whole platform.
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  using (true);

drop policy if exists "product_categories_public_read_published" on public.product_categories;
create policy "product_categories_public_read_published"
  on public.product_categories for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));

-- PREVENTS: categorising another maker's product (a cheap way to hijack a
-- competitor's browse placement).
drop policy if exists "product_categories_owner_write" on public.product_categories;
create policy "product_categories_owner_write"
  on public.product_categories for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));


-- ============================================================================
-- FUNCTION HARDENING · revoke the default PUBLIC execute grant
-- ----------------------------------------------------------------------------
-- Postgres grants EXECUTE to PUBLIC on every newly created function. For the
-- SECURITY DEFINER trigger functions above that grant is inert (a trigger
-- function cannot be invoked directly through SQL), but it should still not
-- exist — validate.sql check 2c audits for exactly this. Revoking it keeps the
-- audit clean and means no future refactor of one of these into a callable
-- function silently ships anon-executable SECURITY DEFINER code.
-- ============================================================================

revoke execute on function public.handle_new_user()             from public;
revoke execute on function public.guard_profile_role()          from public;
revoke execute on function public.enforce_review_seller_scope() from public;
revoke execute on function public.enforce_real_maker_badge()    from public;
revoke execute on function public.guard_thread()                from public;
revoke execute on function public.guard_commission()            from public;

commit;

-- ============================================================================
-- END 0001. Next: run `supabase/validate.sql` and read every PASS/FAIL line
-- before this schema carries a single real user.
-- ============================================================================
