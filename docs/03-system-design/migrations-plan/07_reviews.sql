-- ============================================================================
-- KOL MVP — Migration Plan · Group 07 · Reviews & Review Media (D16-5)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  Trustworthy Reviews (B6+/D16-5): verified-purchase flag, photo/video,
--           exact variation, expectation-accuracy, and single maker response.
--
-- OQ-7 resolutions applied here:
--   - `verified` is a GENERATED column: true iff order_item_id IS NOT NULL
--     (a review tied to a real purchased line item is a verified purchase). No
--     trigger needed.
--   - `maker_response` is a SINGLE text column on reviews (not a child table).
--
-- Tables:   reviews, review_media
-- Types:    review_media_kind (image|video)
--
-- FK deps:  reviews.product_id -> products.id (04); .buyer_id -> profiles.id (01);
--           .order_item_id -> order_items.id (06)
--           review_media.review_id -> reviews.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.review_media;
--   DROP TABLE IF EXISTS public.reviews;
--   DROP TYPE  IF EXISTS public.review_media_kind;
-- ============================================================================

create type public.review_media_kind as enum ('image', 'video');

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

-- --- RLS --------------------------------------------------------------------
alter table public.reviews      enable row level security;
alter table public.review_media enable row level security;

-- Public reads all reviews (they're buyer-facing social proof).
create policy "reviews_public_read"
  on public.reviews for select
  using (true);

-- Buyer writes a review ONLY on a line item they purchased (verified path).
-- (An unverified review would require order_item_id null; MVP requires purchase,
--  so INSERT check binds the order_item to the buyer.)
create policy "reviews_buyer_insert"
  on public.reviews for insert
  with check (
    buyer_id = auth.uid()
    and order_item_id in (
      select oi.id from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.buyer_id = auth.uid()));

-- Buyer edits/deletes own review.
create policy "reviews_buyer_modify"
  on public.reviews for update
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());
create policy "reviews_buyer_delete"
  on public.reviews for delete
  using (buyer_id = auth.uid());

-- Seller updates the maker_response on reviews of OWN products. Column-level
-- restriction (maker_response only) is enforced app-side; RLS scopes to the
-- seller's own products.
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
