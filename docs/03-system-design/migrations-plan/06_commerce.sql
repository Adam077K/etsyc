-- ============================================================================
-- KOL MVP — Migration Plan · Group 06 · Commerce (Carts, Orders, Order Items)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header. Apply via the migration RUNNER.
--
-- Purpose:  KOL-owned checkout (D6/B7): cart -> order -> line items. Stripe
--           test-mode; real order rows, no real money. Order history (B9) reads
--           these tables.
--
-- Money:    all amounts INTEGER MINOR UNITS + currency (store-config §2.4).
--
-- Security model (QA fix cycle 1, P1-1 — subsumes P1-3 & the cart->items concern):
--   RLS is the only boundary, so a buyer JWT must NOT be able to write arbitrary
--   order rows / amounts / statuses via PostgREST. Therefore:
--     * orders / order_items have NO client INSERT or UPDATE policies.
--     * Order + line-item creation goes through `create_order()` — a SECURITY
--       DEFINER RPC that computes every *_amount SERVER-SIDE from products (client
--       amounts are ignored), forces status='pending', and binds buyer_id to
--       auth.uid().
--     * Buyer cancel goes through `cancel_order()` (status -> 'cancelled' only,
--       own pending/paid orders).
--     * Seller fulfilment goes through `set_order_status()` (whitelisted
--       transitions on own-store orders; cannot touch amounts/items).
--     * 'paid' is set by the Stripe webhook via the SERVICE ROLE (bypasses RLS),
--       not by any user RPC.
--   Buyers/sellers keep SELECT policies only; all mutation is column-whitelisted
--   inside the definer functions (DB-enforced, not app-side).
--
-- FORWARD-REF (OQ-3): `orders.commission_id` is created here as a plain nullable
--           uuid. Its FK -> commissions(id) is added in group 10 (ALTER TABLE).
--
-- Tables:   carts, orders, order_items
-- Types:    cart_status (active|checked_out|abandoned),
--           order_status (pending|paid|fulfilled|cancelled|refunded)
-- Fns:      create_order(), cancel_order(), set_order_status()  (all SECURITY DEFINER)
--
-- FK deps:  carts.buyer_id / orders.buyer_id -> profiles.id (01)
--           orders.store_id -> stores.id (02); order_items.order_id -> orders.id;
--           order_items.product_id -> products.id (04)
--           orders.commission_id -> commissions.id (FK ADDED IN GROUP 10)
--
-- Rollback notes (create-only):
--   DROP FUNCTION IF EXISTS public.set_order_status(uuid, public.order_status);
--   DROP FUNCTION IF EXISTS public.cancel_order(uuid);
--   DROP FUNCTION IF EXISTS public.create_order(uuid, jsonb);
--   -- (the commission FK is dropped in group 10's rollback)
--   DROP TABLE IF EXISTS public.order_items;
--   DROP TABLE IF EXISTS public.orders;
--   DROP TABLE IF EXISTS public.carts;
--   DROP TYPE  IF EXISTS public.order_status;
--   DROP TYPE  IF EXISTS public.cart_status;
-- ============================================================================

begin;

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

-- --- Write RPCs (SECURITY DEFINER) ------------------------------------------
-- create_order: single-store checkout. p_items = jsonb array of
--   [{ "product_id": uuid, "quantity": int, "variation": text|null }, ...].
-- Amounts + currency are read from public.products (client-supplied prices are
-- ignored). All items must belong to p_store_id and to a PUBLISHED store.
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

-- cancel_order: buyer cancels own order while still pending/paid.
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

-- set_order_status: seller advances fulfilment on own-store orders. Whitelisted
-- transitions only; cannot set 'paid' (that is the Stripe webhook via service role).
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

revoke execute on function public.create_order(uuid, jsonb)                from public;
revoke execute on function public.cancel_order(uuid)                       from public;
revoke execute on function public.set_order_status(uuid, public.order_status) from public;
grant  execute on function public.create_order(uuid, jsonb)                to authenticated;
grant  execute on function public.cancel_order(uuid)                       to authenticated;
grant  execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- --- RLS (SELECT-only for users; all mutation via the RPCs above) -----------
alter table public.carts       enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- carts: buyer owns fully (scratch space; no money lives here).
create policy "carts_buyer_all"
  on public.carts for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- orders: buyer reads own; seller reads orders RECEIVED for own stores.
-- No INSERT/UPDATE policies -> writes only through create_order/cancel_order/
-- set_order_status (definer) or the service role.
create policy "orders_buyer_read"
  on public.orders for select
  using (buyer_id = auth.uid());
create policy "orders_seller_read_received"
  on public.orders for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

-- order_items: buyer reads items of own orders; seller reads items of received
-- orders. No write policies -> created only inside create_order (definer).
create policy "order_items_buyer_read"
  on public.order_items for select
  using (order_id in (select id from public.orders where buyer_id = auth.uid()));
create policy "order_items_seller_read"
  on public.order_items for select
  using (order_id in (
    select o.id from public.orders o
    where o.store_id in (select id from public.stores where owner_id = auth.uid())));

commit;
