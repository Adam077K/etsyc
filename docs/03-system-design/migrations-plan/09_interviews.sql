-- ============================================================================
-- KOL MVP — Migration Plan · Group 09 · AI Interview (S2, D8)
-- ----------------------------------------------------------------------------
-- Status:   NON-APPLIED PLAN. See group 01 header.
--
-- Purpose:  The adaptive AI interview capture (S2/D8): fixed story beats + smart
--           follow-ups; film (preferred) or voice. Feeds the AI store draft (S3).
--           PRIVATE to the maker — never public.
--
-- Tables:   interviews, interview_answers
-- Types:    interview_mode (film|voice), interview_status (in_progress|complete)
--
-- FK deps:  interviews.maker_id -> profiles.id (01); .store_id -> stores.id (02)
--           interview_answers.interview_id -> interviews.id; .media_id -> media.id (03)
--
-- Rollback notes (create-only):
--   DROP TABLE IF EXISTS public.interview_answers;
--   DROP TABLE IF EXISTS public.interviews;
--   DROP TYPE  IF EXISTS public.interview_status;
--   DROP TYPE  IF EXISTS public.interview_mode;
-- ============================================================================

begin;

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'interview_mode' and n.nspname = 'public') then
    create type public.interview_mode as enum ('film', 'voice');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'interview_status' and n.nspname = 'public') then
    create type public.interview_status as enum ('in_progress', 'complete');
  end if;
end $$;

-- --- interviews -------------------------------------------------------------
create table if not exists public.interviews (
  id         uuid primary key default gen_random_uuid(),
  maker_id   uuid not null references public.profiles (id) on delete cascade,
  store_id   uuid references public.stores (id) on delete set null,  -- may predate the store
  mode       public.interview_mode not null,
  status     public.interview_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_maker_id_idx on public.interviews (maker_id);
create index if not exists interviews_store_id_idx on public.interviews (store_id);

-- --- interview_answers ------------------------------------------------------
create table if not exists public.interview_answers (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  beat_key     text not null,      -- fixed story-beat identifier
  question     text,               -- the (possibly follow-up) prompt asked
  answer_text  text,               -- transcript / typed answer
  media_id     uuid references public.media (id) on delete set null,  -- film/voice answer
  ordinal      integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists interview_answers_interview_id_idx on public.interview_answers (interview_id);
create index if not exists interview_answers_media_id_idx     on public.interview_answers (media_id);

-- --- RLS --------------------------------------------------------------------
alter table public.interviews        enable row level security;
alter table public.interview_answers enable row level security;

-- PRIVATE: maker owns own interviews + answers. No public read.
create policy "interviews_maker_all"
  on public.interviews for all
  using (maker_id = auth.uid())
  with check (maker_id = auth.uid());

create policy "interview_answers_maker_all"
  on public.interview_answers for all
  using (interview_id in (select id from public.interviews where maker_id = auth.uid()))
  with check (interview_id in (select id from public.interviews where maker_id = auth.uid()));

commit;
