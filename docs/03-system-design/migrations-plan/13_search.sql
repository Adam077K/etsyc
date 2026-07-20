-- ============================================================================
-- KOL MVP — Migration Plan · Group 13 · Search & Browse (B11/D16-1)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  MVP search = Postgres full-text (tsvector) + trigram fuzzy (OQ-6):
--           - Generated `search_tsv` on stores (name/craft/bio) and products
--             (title/description/materials), each GIN-indexed.
--           - pg_trgm GIN indexes for fuzzy handle/title lookup.
--           - Categories: `categories` + `product_categories` JOIN table (OQ-6
--             chosen over text[] — a normalized join gives clean browse/filter
--             facets and shared taxonomy; recorded in ADR-0001).
--
--           Results open the maker's WORLD, never a flat grid (D16-1) — that is a
--           render-layer rule; this group only provides the query substrate.
--
-- Tables:   categories, product_categories  (+ ALTER stores, ALTER products)
-- Extensions: pg_trgm
--
-- FK deps:  categories.parent_id -> categories.id (self)
--           product_categories.product_id -> products.id (04); .category_id -> categories.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.product_categories;
--   DROP TABLE IF EXISTS public.categories;
--   ALTER TABLE public.products DROP COLUMN IF EXISTS search_tsv;
--   ALTER TABLE public.stores   DROP COLUMN IF EXISTS search_tsv;
--   -- (pg_trgm left installed; harmless)
-- ============================================================================

begin;

create extension if not exists pg_trgm;

-- --- Full-text: stores ------------------------------------------------------
alter table public.stores
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' || coalesce(craft, '') || ' ' || coalesce(bio, ''))
  ) stored;

create index if not exists stores_search_tsv_gin on public.stores using gin (search_tsv);
create index if not exists stores_handle_trgm    on public.stores using gin (handle gin_trgm_ops);
create index if not exists stores_name_trgm       on public.stores using gin (name gin_trgm_ops);

-- --- Full-text: products ----------------------------------------------------
alter table public.products
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(materials, ''))
  ) stored;

create index if not exists products_search_tsv_gin on public.products using gin (search_tsv);
create index if not exists products_title_trgm      on public.products using gin (title gin_trgm_ops);

-- --- Categories (OQ-6: normalized join) -------------------------------------
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
-- (product_id is the PK prefix -> already indexed for the product->categories lookup)

-- --- RLS --------------------------------------------------------------------
alter table public.categories         enable row level security;
alter table public.product_categories enable row level security;

-- categories: public reference data — anon read; writes service-role only
-- (no client write policy).
create policy "categories_public_read"
  on public.categories for select
  using (true);

-- product_categories: public read when the product's store is PUBLISHED;
-- seller writes for own products.
create policy "product_categories_public_read_published"
  on public.product_categories for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));
create policy "product_categories_owner_write"
  on public.product_categories for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));

commit;
