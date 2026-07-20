-- ============================================================================
-- KOL MVP — Migration Plan · Group 06 · Commerce (Carts, Orders, Order Items)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  KOL-owned checkout (D6/B7): cart -> order -> line items. Stripe
--           test-mode; real order rows, no real money. Order history (B9) reads
--           these tables.
--
-- Money:    all amounts INTEGER MINOR UNITS + currency (store-config §2.4).
--
-- FORWARD-REF (OQ-3): `orders.commission_id` is created here as a plain nullable
--           uuid. Its FK -> commissions(id) is added later in group 10 (ALTER
--           TABLE), because `commissions` does not exist until then. This keeps
--           FK-dependency ordering clean.
--
-- Tables:   carts, orders, order_items
-- Types:    cart_status (active|checked_out|abandoned),
--           order_status (pending|paid|fulfilled|cancelled|refunded)
--
-- FK deps:  carts.buyer_id / orders.buyer_id -> profiles.id (01)
--           orders.store_id -> stores.id (02); order_items.order_id -> orders.id;
--           order_items.product_id -> products.id (04)
--           orders.commission_id -> commissions.id (FK ADDED IN GROUP 10)
--
-- Rollback notes (create-only):
--   -- (the commission FK is dropped in group 10's rollback)
--   DROP TABLE IF EXISTS public.order_items;
--   DROP TABLE IF EXISTS public.orders;
--   DROP TABLE IF EXISTS public.carts;
--   DROP TYPE  IF EXISTS public.order_status;
--   DROP TYPE  IF EXISTS public.cart_status;
-- ============================================================================

create type public.cart_status  as enum ('active', 'checked_out', 'abandoned');
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');

-- --- carts ------------------------------------------------------------------
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  status     public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_buyer_id_idx on public.carts (buyer_id);
-- At most one active cart per buyer.
create unique index if not exists carts_one_active_per_buyer
  on public.carts (buyer_id) where (status = 'active');

-- --- orders -----------------------------------------------------------------
create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  buyer_id                 uuid not null references public.profiles (id) on delete restrict,
  store_id                 uuid not null references public.stores (id) on delete restrict,
  commission_id            uuid,   -- FK -> commissions(id) added in group 10 (OQ-3)
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

-- --- order_items ------------------------------------------------------------
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

-- --- RLS --------------------------------------------------------------------
alter table public.carts       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- carts: buyer owns fully.
create policy "carts_buyer_all"
  on public.carts for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- orders: buyer reads own + CREATES own; buyer may cancel (update) own.
create policy "orders_buyer_read"
  on public.orders for select
  using (buyer_id = auth.uid());
create policy "orders_buyer_insert"
  on public.orders for insert
  with check (buyer_id = auth.uid());
create policy "orders_buyer_update"
  on public.orders for update
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- orders RECEIVED: seller reads orders for own stores + updates STATUS
-- (fulfilment). Sellers have NO insert policy -> cannot create orders.
-- Column-level restriction (status only) is enforced app-side; RLS scopes to
-- the seller's own stores.
create policy "orders_seller_read_received"
  on public.orders for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "orders_seller_update_status"
  on public.orders for update
  using (store_id in (select id from public.stores where owner_id = auth.uid()))
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));

-- order_items: buyer via own order (read + insert at checkout);
-- seller reads items of orders for own stores.
create policy "order_items_buyer_all"
  on public.order_items for all
  using (order_id in (select id from public.orders where buyer_id = auth.uid()))
  with check (order_id in (select id from public.orders where buyer_id = auth.uid()));
create policy "order_items_seller_read"
  on public.order_items for select
  using (order_id in (
    select o.id from public.orders o
    where o.store_id in (select id from public.stores where owner_id = auth.uid())));
