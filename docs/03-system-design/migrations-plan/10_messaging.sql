-- ============================================================================
-- KOL MVP — Migration Plan · Group 10 · Messaging & Commissions (D16-6/OQ-3)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  The buyer<->maker messaging + draft-versioning subsystem (P15) and
--           FULL guided co-creation / commissioning (B14/D16-6):
--           - `threads`           : private 1:1 buyer<->maker conversation.
--           - `messages`          : text|audio|video messages in a thread.
--           - `commissions`       : pre-order negotiation entity with its own
--             lifecycle (OQ-3): brief -> negotiating -> drafting -> approved ->
--             rejected -> cancelled. Linked to a thread. On approval it yields
--             orders.commission_id (FK wired here).
--           - `commission_drafts` : versioned shared drafts (revisions).
--
--           PRIVATE — never public (OQ-5 keeps this separate from public Q&A).
--
-- Circular FK note: threads.commission_id <-> commissions.thread_id. Both are
--           created here; commissions.thread_id FKs threads (already exists), then
--           threads.commission_id FK is added via ALTER after commissions exists.
--
-- Cross-group FK (OQ-3): orders.commission_id -> commissions(id) is added here
--           (orders was created in group 06 with the column but no FK).
--
-- Tables:   threads, messages, commissions, commission_drafts
-- Types:    message_kind (text|audio|video),
--           commission_status (brief|negotiating|drafting|approved|rejected|cancelled),
--           commission_draft_status (proposed|revised|approved|rejected)
--
-- FK deps:  threads.buyer_id/maker_id -> profiles.id (01); .store_id -> stores.id (02)
--           messages.thread_id -> threads.id; .sender_id -> profiles.id;
--             .media_id -> media.id (03)
--           commissions.buyer_id/maker_id -> profiles.id; .store_id -> stores.id;
--             .thread_id -> threads.id
--           commission_drafts.commission_id -> commissions.id
--           orders.commission_id -> commissions.id (ALTER on group-06 table)
--
-- Rollback notes (create-only):
--   ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_commission_id_fkey;
--   DROP TABLE IF EXISTS public.commission_drafts;
--   DROP TABLE IF EXISTS public.commissions;   -- drop threads.commission_id fk first if needed
--   DROP TABLE IF EXISTS public.messages;
--   DROP TABLE IF EXISTS public.threads;
--   DROP TYPE  IF EXISTS public.commission_draft_status;
--   DROP TYPE  IF EXISTS public.commission_status;
--   DROP TYPE  IF EXISTS public.message_kind;
-- ============================================================================

create type public.message_kind           as enum ('text', 'audio', 'video');
create type public.commission_status      as enum
  ('brief', 'negotiating', 'drafting', 'approved', 'rejected', 'cancelled');
create type public.commission_draft_status as enum ('proposed', 'revised', 'approved', 'rejected');

-- --- threads (commission_id FK added after commissions exists) ---------------
create table if not exists public.threads (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references public.profiles (id) on delete cascade,
  maker_id      uuid not null references public.profiles (id) on delete cascade,
  store_id      uuid references public.stores (id) on delete set null,
  commission_id uuid,   -- FK added below, once commissions exists
  subject       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists threads_buyer_id_idx      on public.threads (buyer_id);
create index if not exists threads_maker_id_idx      on public.threads (maker_id);
create index if not exists threads_store_id_idx      on public.threads (store_id);
create index if not exists threads_commission_id_idx on public.threads (commission_id);

-- --- messages ---------------------------------------------------------------
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

-- --- commissions (pre-order negotiation, OQ-3) ------------------------------
create table if not exists public.commissions (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid references public.stores (id) on delete set null,
  thread_id  uuid references public.threads (id) on delete set null,
  brief      jsonb not null default '{}'::jsonb,  -- recipient/occasion/meaning/preferences
  status     public.commission_status not null default 'brief',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commissions_buyer_id_idx  on public.commissions (buyer_id);
create index if not exists commissions_maker_id_idx  on public.commissions (maker_id);
create index if not exists commissions_store_id_idx  on public.commissions (store_id);
create index if not exists commissions_thread_id_idx on public.commissions (thread_id);

-- Now that commissions exists, wire the back-references.
alter table public.threads
  add constraint threads_commission_id_fkey
  foreign key (commission_id) references public.commissions (id) on delete set null;

-- OQ-3: an approved commission yields an order. Wire the group-06 column's FK.
alter table public.orders
  add constraint orders_commission_id_fkey
  foreign key (commission_id) references public.commissions (id) on delete set null;

-- --- commission_drafts (versioned) ------------------------------------------
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

-- --- RLS --------------------------------------------------------------------
alter table public.threads           enable row level security;
alter table public.messages          enable row level security;
alter table public.commissions       enable row level security;
alter table public.commission_drafts enable row level security;

-- threads: the two participants only. Never public.
create policy "threads_participants_all"
  on public.threads for all
  using (buyer_id = auth.uid() or maker_id = auth.uid())
  with check (buyer_id = auth.uid() or maker_id = auth.uid());

-- messages: participants of the parent thread read; sender inserts own messages.
create policy "messages_participants_read"
  on public.messages for select
  using (thread_id in (
    select id from public.threads
    where buyer_id = auth.uid() or maker_id = auth.uid()));
create policy "messages_sender_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and thread_id in (
      select id from public.threads
      where buyer_id = auth.uid() or maker_id = auth.uid()));

-- commissions: buyer + maker participants only.
create policy "commissions_participants_all"
  on public.commissions for all
  using (buyer_id = auth.uid() or maker_id = auth.uid())
  with check (buyer_id = auth.uid() or maker_id = auth.uid());

-- commission_drafts: participants of the parent commission.
create policy "commission_drafts_participants_all"
  on public.commission_drafts for all
  using (commission_id in (
    select id from public.commissions
    where buyer_id = auth.uid() or maker_id = auth.uid()))
  with check (commission_id in (
    select id from public.commissions
    where buyer_id = auth.uid() or maker_id = auth.uid()));
