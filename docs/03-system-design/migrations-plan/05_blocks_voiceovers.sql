-- ============================================================================
-- KOL MVP — Migration Plan · Group 05 · Block Catalog & Voiceovers
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  - `blocks`     : the STATIC block-type CATALOG (OQ-1, P5/D4). One row
--                            per (type, variant) the renderer knows how to compose,
--                            with its allowed 4 states and a prop-schema pointer.
--                            This is NOT per-store block instances — those live in
--                            stores.config.blocks[] (jsonb). Do NOT create
--                            `store_blocks`.
--           - `voiceovers` : per-element real-voice recordings (P12/D10/D11).
--                            Independent of product copy and clip narration.
--
-- Tables:   blocks, voiceovers
-- Types:    voiceover_element_kind (block|product|field)
--
-- FK deps:  voiceovers.store_id -> stores.id (02); .media_id -> media.id (03)
--           blocks has no FK (reference/catalog data).
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.voiceovers;
--   DROP TABLE IF EXISTS public.blocks;
--   DROP TYPE  IF EXISTS public.voiceover_element_kind;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'voiceover_element_kind' and n.nspname = 'public') then
    create type public.voiceover_element_kind as enum ('block', 'product', 'field');
  end if;
end $$;

-- --- blocks (static catalog, OQ-1) ------------------------------------------
-- Catalog of the block TYPES + variants the single renderer supports. Seeded by
-- the platform (service-role), read by everyone. Not user data.
create table if not exists public.blocks (
  id               uuid primary key default gen_random_uuid(),
  type             text not null,   -- hero-video|craft-story|product-showcase|...
  variant          text not null,   -- e.g. center-column|masonry|expandable-detail
  allowed_states   text[] not null default '{empty,loading,error,success}',
  prop_schema_ref  text,            -- pointer to the Zod prop schema for this type
  created_at       timestamptz not null default now(),
  unique (type, variant)
);

create index if not exists blocks_type_idx on public.blocks (type);

-- --- voiceovers -------------------------------------------------------------
create table if not exists public.voiceovers (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores (id) on delete cascade,
  element_kind   public.voiceover_element_kind not null,
  element_id     text not null,     -- blockId | productId | field owner id
  element_field  text,              -- for kind=field (e.g. "title"); else null
  media_id       uuid references public.media (id) on delete set null,  -- audio asset
  src            text not null,     -- seller-recorded real voice (no cloning)
  duration_ms    integer,
  transcript     text,              -- optional a11y; NOT the source of the copy
  label          text not null,     -- buyer-facing, e.g. "Hear Sena on this glaze"
  created_at     timestamptz not null default now()
);

create index if not exists voiceovers_store_id_idx on public.voiceovers (store_id);
create index if not exists voiceovers_media_id_idx on public.voiceovers (media_id);

-- --- RLS --------------------------------------------------------------------
alter table public.blocks     enable row level security;
alter table public.voiceovers enable row level security;

-- blocks: public read for all (incl. anon). Writes are service-role only
-- (platform seeding) — no client write policy, so RLS denies client writes while
-- the service role bypasses RLS to seed/maintain the catalog.
create policy "blocks_public_read"
  on public.blocks for select
  using (true);

-- voiceovers: seller owns via store; anon reads voiceovers of PUBLISHED stores.
create policy "voiceovers_owner_all"
  on public.voiceovers for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "voiceovers_public_read_published"
  on public.voiceovers for select
  using (store_id in (select id from public.stores where published = true));

commit;
