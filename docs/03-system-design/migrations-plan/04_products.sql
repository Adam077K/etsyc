-- ============================================================================
-- KOL MVP — Migration Plan · Group 04 · Products, Specs & Provenance
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  Canonical product catalog (D4/D6) + two D16 trust subsystems:
--           - `product_specs`      : P14 "Exactly What to Expect" — the required
--                                     structured product-info standard (1:1).
--           - `product_provenance` : P13 "Proof of Product" — maker-DECLARED &
--                                     shown provenance (role/materials/process/
--                                     location/partners/process-media). NOT
--                                     third-party physical verification (roadmap
--                                     per D7) — declared, provable, honest.
--
--           Product gallery ORDER + narration clip hints live in stores.config
--           (D4, renderer-owned). This table is the canonical source for commerce
--           (price/inventory) and for search (title/description/materials, B11).
--
-- Money:    price_amount is INTEGER MINOR UNITS + currency (store-config §2.4).
--           Never floats for money.
--
-- Tables:   products, product_specs, product_provenance
-- Types:    inventory_status (in-stock|made-to-order|sold-out)
--
-- FK deps:  products.store_id -> stores.id (02); products.model3d_id -> media.id (03)
--           product_specs.product_id / product_provenance.product_id -> products.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.product_provenance;
--   DROP TABLE IF EXISTS public.product_specs;
--   DROP TABLE IF EXISTS public.products;
--   DROP TYPE  IF EXISTS public.inventory_status;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'inventory_status' and n.nspname = 'public') then
    create type public.inventory_status as enum ('in-stock', 'made-to-order', 'sold-out');
  end if;
end $$;

-- --- products ---------------------------------------------------------------
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

-- --- product_specs (P14 — required structured product-info standard) ---------
create table if not exists public.product_specs (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null unique references public.products (id) on delete cascade,
  dimensions          text,
  materials           text,
  texture             text,
  handmade_variation  text,
  production_time     text,
  shipping            text,
  care                text,
  repairs             text,
  returns             text,
  customization_limits text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists product_specs_product_id_idx on public.product_specs (product_id);

-- --- product_provenance (P13 — maker-declared Proof of Product) --------------
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

-- --- RLS --------------------------------------------------------------------
alter table public.products           enable row level security;
alter table public.product_specs      enable row level security;
alter table public.product_provenance enable row level security;

-- Seller owns products (via store ownership); anon reads products of PUBLISHED stores.
create policy "products_owner_all"
  on public.products for all
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "products_public_read_published"
  on public.products for select
  using (store_id in (select id from public.stores where published = true));

-- specs: seller owns via product->store; anon reads for published stores.
create policy "product_specs_owner_all"
  on public.product_specs for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));
create policy "product_specs_public_read_published"
  on public.product_specs for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));

-- provenance: same shape.
create policy "product_provenance_owner_all"
  on public.product_provenance for all
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));
create policy "product_provenance_public_read_published"
  on public.product_provenance for select
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where published = true)));

commit;
