-- ============================================================================
-- KOL MVP — Migration Plan · Group 07 · Reviews & Review Media (D16-5)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header. Apply via the migration RUNNER.
--
-- Purpose:  Trustworthy Reviews (B6+/D16-5): verified-purchase flag, photo/video,
--           exact variation, expectation-accuracy, and single maker response.
--
-- OQ-7 resolutions applied here:
--   - `verified` is a GENERATED column: true iff order_item_id IS NOT NULL
--     (a review tied to a real purchased line item is a verified purchase).
--   - `maker_response` is a SINGLE text column on reviews (not a child table).
--
-- Security model (QA fix cycle 1):
--   * P1-3: buyer INSERT/UPDATE WITH CHECK now requires the bound order_item to
--     belong to the buyer AND to the SAME product being reviewed
--     (`oi.product_id = reviews.product_id`) — no reviewing a product you didn't
--     buy by borrowing an unrelated line item.
--   * P1-4: a seller may change ONLY `maker_response`. Column scope is DB-ENFORCED
--     by a BEFORE UPDATE trigger that rejects any change to rating/body/variation/
--     expectation_accuracy/product_id/buyer_id/order_item_id when the actor is not
--     the review's buyer. (Service role, auth.uid() null, is unrestricted.)
--
-- Tables:   reviews, review_media
-- Types:    review_media_kind (image|video)
-- Fns/Trig: enforce_review_seller_scope() + reviews_seller_scope_guard
--
-- FK deps:  reviews.product_id -> products.id (04); .buyer_id -> profiles.id (01);
--           .order_item_id -> order_items.id (06); review_media.review_id -> reviews.id
--
-- Rollback notes (create-only):
--   DROP TRIGGER IF EXISTS reviews_seller_scope_guard ON public.reviews;
--   DROP FUNCTION IF EXISTS public.enforce_review_seller_scope();
--   DROP TABLE IF EXISTS public.review_media;
--   DROP TABLE IF EXISTS public.reviews;
--   DROP TYPE  IF EXISTS public.review_media_kind;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'review_media_kind' and n.nspname = 'public') then
    create type public.review_media_kind as enum ('image', 'video');
  end if;
end $$;

-- --- reviews ----------------------------------------------------------------
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
  verified             boolean generated always as (order_item_id is not null) stored,
  maker_response       text,   -- single seller response column (OQ-7)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- one review per buyer per purchased line item
  unique (buyer_id, order_item_id)
);

create index if not exists reviews_product_id_idx    on public.reviews (product_id);
create index if not exists reviews_buyer_id_idx       on public.reviews (buyer_id);
create index if not exists reviews_order_item_id_idx  on public.reviews (order_item_id);

-- --- review_media -----------------------------------------------------------
create table if not exists public.review_media (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  kind       public.review_media_kind not null,
  src        text not null,
  alt        text,
  created_at timestamptz not null default now()
);

create index if not exists review_media_review_id_idx on public.review_media (review_id);

-- --- P1-4: seller may only touch maker_response -----------------------------
create or replace function public.enforce_review_seller_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only constrain interactive users; the service role (null uid) is trusted.
  if auth.uid() is not null and auth.uid() is distinct from old.buyer_id then
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

create or replace trigger reviews_seller_scope_guard
  before update on public.reviews
  for each row execute function public.enforce_review_seller_scope();

-- --- RLS --------------------------------------------------------------------
alter table public.reviews      enable row level security;
alter table public.review_media enable row level security;

-- Public reads all reviews (buyer-facing social proof).
create policy "reviews_public_read"
  on public.reviews for select
  using (true);

-- P1-3: buyer writes a review only on a line item THEY purchased AND whose
-- product matches the review's product_id.
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

-- Buyer edits own review; re-check purchase ownership + product match on update
-- so the bound order_item can't be swapped to a non-owned / mismatched line.
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
create policy "reviews_buyer_delete"
  on public.reviews for delete
  using (buyer_id = auth.uid());

-- Seller may UPDATE reviews on OWN products; the seller-scope trigger above
-- restricts the change to maker_response only (DB-enforced, not app-side).
create policy "reviews_seller_respond"
  on public.reviews for update
  using (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())))
  with check (product_id in (
    select p.id from public.products p
    where p.store_id in (select id from public.stores where owner_id = auth.uid())));

-- review_media: public read; buyer writes media on own reviews.
create policy "review_media_public_read"
  on public.review_media for select
  using (true);
create policy "review_media_buyer_all"
  on public.review_media for all
  using (review_id in (select id from public.reviews where buyer_id = auth.uid()))
  with check (review_id in (select id from public.reviews where buyer_id = auth.uid()));

commit;
