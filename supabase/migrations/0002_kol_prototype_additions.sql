-- ============================================================================
-- KOL MVP — 0002 · PROTOTYPE ADDITIONS (notifications, collections, community)
-- ============================================================================
--
--   RISK TIER: **IRREVERSIBLE**. Approved for apply under D18 only insofar as
--   D18 ratifies D17 (the buyer↔buyer social layer). The three subsystems here
--   are marked **PROPOSED** in their specs, not locked like ADR-0001.
--
--   THIS FILE IS DELIBERATELY SEPARATE FROM 0001 so it can be applied or
--   skipped independently. 0001 alone is a complete, coherent schema. Nothing
--   in 0001 references anything created here. Skipping this file costs you the
--   /notifications, /me/collections + /c/[slug], and community routes — nothing
--   else. Apply 0001 first; it is a hard prerequisite (every table below FKs
--   `profiles`, and community FKs `stores`).
--
--   RUN `supabase/validate.sql` AFTER 0001 AND AGAIN AFTER THIS FILE. This
--   migration introduces the FIRST anon-SELECT policy on a table holding
--   user-authored content (`collections`, visibility='public') — a new trust
--   boundary that `saved-collections.md` requires security-engineer to review.
--
--   SOURCES
--   -------
--     B16 notifications  → docs/04-features/specs/notifications.md
--     B17 collections    → docs/04-features/specs/saved-collections.md
--     B15/D17 community  → docs/04-features/specs/maker-community.md
--
--   Idempotent and re-runnable on the same terms as 0001.
--   Every function is `set search_path = ''` and fully schema-qualified.
-- ============================================================================

begin;

-- ============================================================================
-- B16 · NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- One-way, system-emitted, read-only, maker-attributed. NOT the inbox: there is
-- no reply path, structurally — a notification has no thread and no body text a
-- user can author, only a `body_key` template reference the client renders.
--
-- RLS: READ-OWN ONLY. There is no client INSERT and no client UPDATE policy of
-- any kind. Rows are written exclusively by the service-role emitter; `read_at`
-- is set exclusively by the two definer RPCs below.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'notification_type' and n.nspname = 'public') then
    create type public.notification_type as enum (
      'maker_new_product',
      'maker_new_store_version',
      'commission_message_reply',
      'commission_draft_new_version',
      'order_status_paid',
      'order_status_fulfilled',
      'order_status_cancelled',
      'order_status_refunded',
      'question_answered',
      'new_follower',
      'community_new_post'
    );
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'notification_subject' and n.nspname = 'public') then
    create type public.notification_subject as enum
      ('product', 'store', 'thread', 'commission', 'order', 'question', 'answer', 'community_post');
  end if;
end $$;

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  recipient_id   uuid not null references public.profiles (id) on delete cascade,
  type           public.notification_type not null,
  -- The maker whose voice and face this row speaks in. Nullable only for
  -- system-neutral types (a platform-set order status); the vast majority are
  -- maker-attributed, which is the whole design point of the surface.
  actor_maker_id uuid references public.profiles (id) on delete set null,
  subject_type   public.notification_subject not null,
  subject_id     uuid not null,   -- polymorphic; no FK (app/Zod validated)
  -- Copy TEMPLATE key, never free text. Storing a key rather than a rendered
  -- string PREVENTS a write path from ever putting arbitrary prose in front of
  -- a buyer under a maker's name.
  body_key       text not null check (char_length(body_key) between 1 and 100),
  body_vars      jsonb,           -- small variable bag: product_title, count, order_last4
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
-- Partial index serves the unread presence-dot query cheaply.
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where (read_at is null);
create index if not exists notifications_actor_type_created_idx
  on public.notifications (actor_maker_id, type, created_at);

alter table public.notifications enable row level security;

-- PREVENTS: reading anyone else's notification stream, which would expose their
-- orders, commissions, follows and questions in one query.
drop policy if exists "notifications_recipient_read" on public.notifications;
create policy "notifications_recipient_read"
  on public.notifications for select
  using (recipient_id = auth.uid());

-- No INSERT / UPDATE / DELETE policy. The ABSENCE is the control: it PREVENTS a
-- client fabricating a notification that appears to come from a maker, and
-- PREVENTS marking another user's notifications read. Emission is service-role;
-- read-marking is the two RPCs below.

create or replace function public.mark_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
    set read_at = coalesce(read_at, now())
    where id = p_id
      and recipient_id = auth.uid();   -- scope is enforced here, not by the caller
  if not found then
    raise exception 'notification not found';
  end if;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  update public.notifications
    set read_at = now()
    where recipient_id = auth.uid()
      and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.mark_notification_read(uuid)    from public;
revoke execute on function public.mark_all_notifications_read()   from public;
grant  execute on function public.mark_notification_read(uuid)    to authenticated;
grant  execute on function public.mark_all_notifications_read()   to authenticated;


-- ============================================================================
-- B17 · COLLECTIONS  ⚠ NEW ANON-READ TRUST BOUNDARY
-- ----------------------------------------------------------------------------
-- ⚠ `collections_public_read` below is the FIRST policy in this schema that
--   grants `anon` SELECT on a table carrying user-authored content. Everything
--   anon could previously read was maker-published-by-intent (stores, products,
--   reviews, Q&A). A collection is a private board by default that its owner may
--   flip public. security-engineer MUST review this policy specifically, and
--   validate.sql check 10 asserts anon cannot see a private row.
--
-- ⚠ SLUG MUST NOT BE ENUMERABLE. The default below is 32 hex characters derived
--   from `gen_random_uuid()` (~122 bits of entropy) — not sequential, not
--   derived from the row id, not guessable. Do NOT replace it with a
--   title-slugified or serial value. The app must return **404, not 403**, for a
--   private or missing slug, so that a probe cannot distinguish "exists but
--   private" from "does not exist".
-- ============================================================================

-- 122 bits of URL-safe entropy, no pgcrypto dependency (gen_random_uuid is
-- built in on PG13+). Deliberately independent of the row's own id.
create or replace function public.generate_collection_slug()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- Slug generation happens server-side, in a DEFAULT. Revoked from PUBLIC so the
-- audit in validate.sql check 2c stays clean; the default still evaluates on
-- INSERT because defaults run as the table's context, not the caller's.
revoke execute on function public.generate_collection_slug() from public;
grant  execute on function public.generate_collection_slug() to authenticated, service_role;

create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  slug       text not null unique default public.generate_collection_slug(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists collections_owner_id_idx on public.collections (owner_id);
-- slug is UNIQUE, therefore already indexed.

create table if not exists public.collection_items (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  subject_type  text not null check (subject_type in ('product', 'maker', 'video')),
  subject_id    uuid not null,   -- polymorphic; no FK (mirrors `saves`, app-validated)
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (collection_id, subject_type, subject_id)
);

create index if not exists collection_items_collection_position_idx
  on public.collection_items (collection_id, "position");
create index if not exists collection_items_subject_idx
  on public.collection_items (subject_type, subject_id);

alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;

-- Owner has full control of their own boards.
drop policy if exists "collections_owner_all" on public.collections;
create policy "collections_owner_all"
  on public.collections for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ⚠ THE NEW ANON-READ BOUNDARY. The `visibility = 'public'` predicate is the
-- entire control: it PREVENTS anon (and any other buyer) reading a private
-- board. It must never be widened, and no policy on this table may ever be
-- written with `using (true)`.
drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read"
  on public.collections for select
  using (visibility = 'public');

-- Items inherit their parent's visibility exactly. PREVENTS: reading the
-- contents of a private board through the child table when the parent row is
-- correctly hidden.
drop policy if exists "collections_items_read" on public.collection_items;
create policy "collections_items_read"
  on public.collection_items for select
  using (collection_id in (
    select c.id from public.collections c
    where c.owner_id = auth.uid() or c.visibility = 'public'));

-- PREVENTS: adding to, reordering, or deleting from someone else's board —
-- including a public one, which is readable but not writable by its audience.
drop policy if exists "collection_items_owner_write" on public.collection_items;
create policy "collection_items_owner_write"
  on public.collection_items for all
  using (collection_id in (select id from public.collections where owner_id = auth.uid()))
  with check (collection_id in (select id from public.collections where owner_id = auth.uid()));


-- ============================================================================
-- B15 / D17 · MAKER COMMUNITY
-- ----------------------------------------------------------------------------
-- A per-maker community layer. `mode` decides the read boundary:
--   'broadcast' — any authenticated user may read posts and comment.
--   'private'   — only rows in `community_members` may read; membership is
--                 derived from a `follows` row and granted by an RPC.
--
-- SINGLE-LEVEL COMMENTS ONLY. `post_comments` has NO parent_comment_id column
-- and never should: the absence of the column is what makes nested reply trees
-- structurally impossible rather than merely discouraged.
--
-- RECURSION NOTE: a policy on `community_members` that itself queries
-- `community_members` would recurse (RLS applies inside policy subqueries). The
-- SECURITY DEFINER helpers below break that cycle and are the only sanctioned
-- way to test membership inside a policy.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'community_mode' and n.nspname = 'public') then
    create type public.community_mode as enum ('broadcast', 'private');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'member_role' and n.nspname = 'public') then
    create type public.member_role as enum ('member', 'moderator');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'post_kind' and n.nspname = 'public') then
    create type public.post_kind as enum ('text', 'media', 'product-announcement');
  end if;
end $$;

create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  maker_id    uuid not null references public.profiles (id) on delete cascade,
  store_id    uuid references public.stores (id) on delete set null,
  mode        public.community_mode not null default 'broadcast',
  name        text not null check (char_length(name) between 1 and 120),
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (maker_id)   -- one community per maker in MVP
);

create index if not exists communities_maker_id_idx on public.communities (maker_id);
create index if not exists communities_store_id_idx on public.communities (store_id);

create table if not exists public.community_members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  buyer_id     uuid not null references public.profiles (id) on delete cascade,
  role         public.member_role not null default 'member',
  joined_at    timestamptz not null default now(),
  unique (community_id, buyer_id)
);

create index if not exists community_members_community_idx on public.community_members (community_id);
create index if not exists community_members_buyer_idx     on public.community_members (buyer_id);

create table if not exists public.community_posts (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  kind         public.post_kind not null default 'text',
  body         text check (body is null or char_length(body) <= 5000),
  media_ids    uuid[] not null default '{}',   -- media/videos ids (app-validated)
  product_id   uuid references public.products (id) on delete set null,
  pinned       boolean not null default false,
  hidden_at    timestamptz,                    -- hide-only moderation (no hard delete)
  created_at   timestamptz not null default now()
);

create index if not exists community_posts_community_created_idx
  on public.community_posts (community_id, created_at desc);
create index if not exists community_posts_author_idx on public.community_posts (author_id);

-- SINGLE-LEVEL BY CONSTRUCTION: no parent_comment_id.
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  media_id   uuid references public.media (id) on delete set null,
  hidden_at  timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_created_idx on public.post_comments (post_id, created_at);
create index if not exists post_comments_author_idx       on public.post_comments (author_id);

-- --- Membership helpers (SECURITY DEFINER: they bypass RLS on purpose, to
-- --- break the policy-recursion cycle described above). Both are read-only.
create or replace function public.is_community_member(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id
      and m.buyer_id = auth.uid());
$$;

-- The single read predicate for community content: broadcast communities are
-- open to any AUTHENTICATED user (never anon — community is a signed-in
-- surface); private communities require a live membership row; the owning maker
-- always sees their own.
create or replace function public.can_read_community(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id
      and (
        c.maker_id = auth.uid()
        or (c.mode = 'broadcast' and auth.uid() is not null)
        or (c.mode = 'private' and public.is_community_member(c.id))
      ));
$$;

create or replace function public.is_community_owner(p_community_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.communities c
    where c.id = p_community_id and c.maker_id = auth.uid());
$$;

revoke execute on function public.is_community_member(uuid) from public;
revoke execute on function public.can_read_community(uuid)  from public;
revoke execute on function public.is_community_owner(uuid)  from public;
grant  execute on function public.is_community_member(uuid) to authenticated;
grant  execute on function public.can_read_community(uuid)  to authenticated;
grant  execute on function public.is_community_owner(uuid)  to authenticated;

-- Membership is DERIVED from a follow, not self-asserted.
-- PREVENTS: joining a private community without following the maker — the
-- follows row is the membership signal, and this RPC is the only write path
-- into `community_members` for a client.
create or replace function public.join_community(p_community_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer  uuid := auth.uid();
  v_maker  uuid;
  v_id     uuid;
begin
  if v_buyer is null then
    raise exception 'authentication required';
  end if;

  select c.maker_id into v_maker from public.communities c where c.id = p_community_id;
  if v_maker is null then
    raise exception 'community not found';
  end if;
  if v_maker = v_buyer then
    raise exception 'the maker owns this community and is not a member of it';
  end if;
  if not exists (select 1 from public.follows f
                 where f.buyer_id = v_buyer and f.maker_id = v_maker) then
    raise exception 'follow the maker before joining their community';
  end if;

  insert into public.community_members (community_id, buyer_id, role)
  values (p_community_id, v_buyer, 'member')
  -- `community_members` here is the ON CONFLICT alias for the target row, not a
  -- schema lookup; the no-op SET makes the RETURNING clause fire on re-join.
  on conflict (community_id, buyer_id) do update set role = community_members.role
  returning id into v_id;

  return v_id;
end;
$$;

-- Leaving is unambiguous and needs no derivation.
create or replace function public.leave_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.community_members
    where community_id = p_community_id
      and buyer_id = auth.uid();
end;
$$;

revoke execute on function public.join_community(uuid)  from public;
revoke execute on function public.leave_community(uuid) from public;
grant  execute on function public.join_community(uuid)  to authenticated;
grant  execute on function public.leave_community(uuid) to authenticated;

alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts   enable row level security;
alter table public.post_comments     enable row level security;

-- The community RECORD (name, description, mode) is discoverable so a buyer can
-- see that a private community exists and ask to join. Its CONTENT is not.
drop policy if exists "communities_public_read" on public.communities;
create policy "communities_public_read"
  on public.communities for select
  using (true);

-- PREVENTS: creating or renaming a community you do not own, and PREVENTS a
-- buyer creating one at all (maker_id must be the caller, and only sellers hold
-- stores/followers this hangs off).
drop policy if exists "communities_maker_write" on public.communities;
create policy "communities_maker_write"
  on public.communities for all
  using (maker_id = auth.uid())
  with check (
    maker_id = auth.uid()
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'seller'));

-- PREVENTS: enumerating the membership of a private community. A member sees
-- the roster of communities they belong to; everyone else sees only their own
-- row; the owning maker sees their own community's roster.
drop policy if exists "community_members_read" on public.community_members;
create policy "community_members_read"
  on public.community_members for select
  using (
    buyer_id = auth.uid()
    or public.is_community_owner(community_id)
    or public.is_community_member(community_id));

-- No client INSERT policy: membership is granted only by join_community(),
-- which PREVENTS self-adding to a private community without a follow.
drop policy if exists "community_members_self_leave" on public.community_members;
create policy "community_members_self_leave"
  on public.community_members for delete
  using (buyer_id = auth.uid() or public.is_community_owner(community_id));

-- THE MEMBERSHIP-GATED READ BOUNDARY. PREVENTS: a non-member (or anon) reading
-- a private community's posts. Hidden posts stay visible to the owning maker
-- and to their author, so moderation is auditable rather than silent deletion.
drop policy if exists "community_posts_read" on public.community_posts;
create policy "community_posts_read"
  on public.community_posts for select
  using (
    public.can_read_community(community_id)
    and (hidden_at is null
         or author_id = auth.uid()
         or public.is_community_owner(community_id)));

-- Broadcast → maker posts only. Private → maker or any member. PREVENTS: a
-- buyer posting into a maker's broadcast community as if it were a forum, and
-- PREVENTS posting under another user's name (author_id must be the caller).
drop policy if exists "community_posts_write" on public.community_posts;
create policy "community_posts_write"
  on public.community_posts for insert
  with check (
    author_id = auth.uid()
    and (
      public.is_community_owner(community_id)
      or (public.is_community_member(community_id)
          and exists (select 1 from public.communities c
                      where c.id = community_id and c.mode = 'private'))
    ));

-- PREVENTS: editing another user's post. The owning maker may update too — that
-- is the hide-only moderation path (setting `hidden_at`).
drop policy if exists "community_posts_update" on public.community_posts;
create policy "community_posts_update"
  on public.community_posts for update
  using (author_id = auth.uid() or public.is_community_owner(community_id))
  with check (author_id = auth.uid() or public.is_community_owner(community_id));

drop policy if exists "community_posts_delete" on public.community_posts;
create policy "community_posts_delete"
  on public.community_posts for delete
  using (author_id = auth.uid() or public.is_community_owner(community_id));

-- Comments inherit the parent post's read boundary exactly. PREVENTS: reading a
-- private community's discussion through the comment table.
drop policy if exists "post_comments_read" on public.post_comments;
create policy "post_comments_read"
  on public.post_comments for select
  using (
    post_id in (
      select p.id from public.community_posts p
      where public.can_read_community(p.community_id)
        and (p.hidden_at is null or public.is_community_owner(p.community_id)))
    and (hidden_at is null
         or author_id = auth.uid()
         or post_id in (select p2.id from public.community_posts p2
                        where public.is_community_owner(p2.community_id))));

-- Any reader of a post may comment on it (broadcast: any authed; private:
-- members only) — the read gate is the write gate. PREVENTS commenting under
-- another user's name, and PREVENTS commenting into a private community you are
-- not a member of.
drop policy if exists "post_comments_write" on public.post_comments;
create policy "post_comments_write"
  on public.post_comments for insert
  with check (
    author_id = auth.uid()
    and post_id in (
      select p.id from public.community_posts p
      where public.can_read_community(p.community_id)
        and p.hidden_at is null));

drop policy if exists "post_comments_update" on public.post_comments;
create policy "post_comments_update"
  on public.post_comments for update
  using (
    author_id = auth.uid()
    or post_id in (select p.id from public.community_posts p
                   where public.is_community_owner(p.community_id)))
  with check (
    author_id = auth.uid()
    or post_id in (select p.id from public.community_posts p
                   where public.is_community_owner(p.community_id)));

drop policy if exists "post_comments_delete" on public.post_comments;
create policy "post_comments_delete"
  on public.post_comments for delete
  using (
    author_id = auth.uid()
    or post_id in (select p.id from public.community_posts p
                   where public.is_community_owner(p.community_id)));

commit;

-- ============================================================================
-- END 0002. Re-run `supabase/validate.sql` — checks 10 and 11 cover the two new
-- boundaries this file introduces (anon-readable public collections, and the
-- membership gate on private communities).
-- ============================================================================
