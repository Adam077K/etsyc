-- ============================================================================
-- KOL MVP — Migration Plan · Group 11 · Ask the Maker (Public Q&A, B12/D16-3)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  Public per-product Q&A (B12). Buyers ask PUBLIC questions; makers
--           answer via text/audio/video.
--
-- OQ-5:     This is DELIBERATELY SEPARATE from private threads/messages (group
--           10). Questions/answers are PUBLIC-read; threads/messages are private.
--           "Reuse" of the messaging UI is a UI-layer concern, NOT a schema merge.
--
-- Tables:   questions, answers
-- Types:    answer_kind (text|audio|video)
--
-- FK deps:  questions.product_id -> products.id (04); .store_id -> stores.id (02);
--             .buyer_id -> profiles.id (01)
--           answers.question_id -> questions.id; .maker_id -> profiles.id;
--             .media_id -> media.id (03)
--
-- Security (QA fix cycle 1, P2-8): a question's store_id must match its product's
-- store, the product's store must be PUBLISHED, and body length is bounded (spam
-- guard). All DB-enforced (RLS WITH CHECK + CHECK constraint).
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.answers;
--   DROP TABLE IF EXISTS public.questions;
--   DROP TYPE  IF EXISTS public.answer_kind;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'answer_kind' and n.nspname = 'public') then
    create type public.answer_kind as enum ('text', 'audio', 'video');
  end if;
end $$;

-- --- questions --------------------------------------------------------------
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  store_id   uuid not null references public.stores (id) on delete cascade,
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),  -- spam guard
  created_at timestamptz not null default now()
);

create index if not exists questions_product_id_idx on public.questions (product_id);
create index if not exists questions_store_id_idx    on public.questions (store_id);
create index if not exists questions_buyer_id_idx    on public.questions (buyer_id);

-- --- answers ----------------------------------------------------------------
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
create index if not exists answers_media_id_idx    on public.answers (media_id);   -- P3

-- --- RLS --------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.answers   enable row level security;

-- PUBLIC read for both (Q&A is public social proof).
create policy "questions_public_read"
  on public.questions for select
  using (true);
create policy "answers_public_read"
  on public.answers for select
  using (true);

-- Buyer asks (owns) own questions. P2-8: store_id must be the product's store and
-- that store must be published — no questions on private/mismatched products.
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

-- Seller answers on OWN products (via store ownership). maker_id must be the seller.
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

commit;
