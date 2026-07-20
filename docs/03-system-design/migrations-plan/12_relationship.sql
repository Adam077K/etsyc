-- ============================================================================
-- KOL MVP — Migration Plan · Group 12 · Relationship & Ranking Signals
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  Relationship-Based Ranking inputs (B13/P6+/D16-7):
--           - `follows`       : buyer -> maker (OQ-7, one direction only).
--           - `saves`         : polymorphic save of product|store (OQ-7).
--           - `buyer_signals` : the event log the video/rank engine consumes
--                               (OQ-4). NOT general popularity — relationship
--                               signals only.
--
-- OQ-4:     buyer_signals = (buyer_id, subject_type[maker|store|product],
--           subject_id, signal_type[visit|purchase|question|save|follow|
--           commission|review], weight, created_at). Composite index
--           (buyer_id, subject_type, subject_id, signal_type).
--
-- Polymorphic note: saves.subject_id and buyer_signals.subject_id are polymorphic
--           (no single FK target) -> intentionally no FK; integrity is app-side.
--
-- Tables:   follows, saves, buyer_signals
-- Types:    save_subject (product|store), signal_subject (maker|store|product),
--           signal_type (visit|purchase|question|save|follow|commission|review)
--
-- FK deps:  follows.buyer_id/maker_id -> profiles.id (01)
--           saves.buyer_id -> profiles.id; buyer_signals.buyer_id -> profiles.id
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.buyer_signals;
--   DROP TABLE IF EXISTS public.saves;
--   DROP TABLE IF EXISTS public.follows;
--   DROP TYPE  IF EXISTS public.signal_type;
--   DROP TYPE  IF EXISTS public.signal_subject;
--   DROP TYPE  IF EXISTS public.save_subject;
-- ============================================================================

create type public.save_subject   as enum ('product', 'store');
create type public.signal_subject as enum ('maker', 'store', 'product');
create type public.signal_type    as enum
  ('visit', 'purchase', 'question', 'save', 'follow', 'commission', 'review');

-- --- follows (buyer -> maker only) ------------------------------------------
create table if not exists public.follows (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, maker_id)
);

create index if not exists follows_buyer_id_idx on public.follows (buyer_id);
create index if not exists follows_maker_id_idx on public.follows (maker_id);

-- --- saves (polymorphic product|store) --------------------------------------
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

-- --- buyer_signals (ranking event log, OQ-4) --------------------------------
create table if not exists public.buyer_signals (
  id           uuid primary key default gen_random_uuid(),
  buyer_id     uuid not null references public.profiles (id) on delete cascade,
  subject_type public.signal_subject not null,
  subject_id   uuid not null,   -- polymorphic; no FK (app-validated)
  signal_type  public.signal_type not null,
  weight       numeric(6,3) not null default 1.0,
  created_at   timestamptz not null default now()
);

-- OQ-4 composite index for engine lookups.
create index if not exists buyer_signals_lookup_idx
  on public.buyer_signals (buyer_id, subject_type, subject_id, signal_type);
create index if not exists buyer_signals_subject_idx
  on public.buyer_signals (subject_type, subject_id);

-- --- RLS --------------------------------------------------------------------
alter table public.follows       enable row level security;
alter table public.saves         enable row level security;
alter table public.buyer_signals enable row level security;

-- follows: buyer owns own rows; a maker may READ who follows them.
create policy "follows_buyer_all"
  on public.follows for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());
create policy "follows_maker_read"
  on public.follows for select
  using (maker_id = auth.uid());

-- saves: buyer owns; private.
create policy "saves_buyer_all"
  on public.saves for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- buyer_signals: buyer owns; NEVER public. (Engine reads via service role.)
create policy "buyer_signals_buyer_all"
  on public.buyer_signals for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());
