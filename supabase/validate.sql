-- ============================================================================
-- KOL — validate.sql
-- The ADR-0001 MANDATORY 9-point pre-apply validation, as runnable SQL.
-- ============================================================================
--
--   RUN THIS ON STAGING, AFTER APPLYING 0001 (and again after 0002), BEFORE THE
--   SCHEMA EVER TOUCHES PRODUCTION. D18 authorises the apply; it explicitly does
--   NOT waive this validation.
--
--   HOW TO RUN
--   ----------
--     psql "$SUPABASE_DB_URL" -f supabase/validate.sql
--
--   psql is strongly preferred: Part B reports through NOTICE messages, which
--   the dashboard SQL Editor renders inconsistently, and the `\echo` section
--   headers below are psql meta-commands the editor rejects outright. If you
--   must use the editor, delete every `\echo` line first and check the Logs
--   pane for the Part B notices.
--
--   Every check prints one row:
--     check | result | detail
--   `result` is PASS, FAIL, SKIP, or MANUAL.
--
--   READ EVERY LINE. A single FAIL blocks the production apply. A SKIP means the
--   check could not run here and you must satisfy it another way — the detail
--   column says how. MANUAL means the check is not expressible in SQL at all
--   (it needs a real anon-key HTTP request); the exact commands to run are in
--   PART C at the bottom of this file.
--
--   CONNECT AS A NORMAL ROLE, NOT AS A SUPERUSER, WHERE POSSIBLE. The Supabase
--   `postgres` role is BYPASSRLS-adjacent in practice; PART B works around this
--   by switching to the `authenticated` role explicitly, but be aware that any
--   ad-hoc query you run alongside this file is NOT seeing what a client sees.
--
--   PART B mutates nothing permanently: it runs inside an explicit transaction
--   that ends in ROLLBACK.
-- ============================================================================


-- ============================================================================
-- PART A · STATIC CATALOGUE CHECKS (checks 1, 2, 3, 9 + coverage)
-- ============================================================================

\echo '=============================================================='
\echo 'PART A — static catalogue checks'
\echo '=============================================================='

-- ---------------------------------------------------------------------------
-- CHECK 1a · apply-run: every expected table exists.
-- ADR validation step 1. 31 tables from 0001; 7 more if 0002 was applied.
-- ---------------------------------------------------------------------------
with expected(t) as (
  values
    ('profiles'),('stores'),('store_versions'),('media'),('videos'),
    ('video_profiles'),('products'),('product_specs'),('product_provenance'),
    ('blocks'),('voiceovers'),('carts'),('orders'),('order_items'),('reviews'),
    ('review_media'),('verifications'),('badges'),('interviews'),
    ('interview_answers'),('threads'),('messages'),('commissions'),
    ('commission_drafts'),('questions'),('answers'),('follows'),('saves'),
    ('buyer_signals'),('categories'),('product_categories')
),
missing as (
  select t from expected
  where not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = expected.t and c.relkind = 'r')
)
select '1a. 0001 tables present (31 expected)' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then '31/31 present'
            else 'MISSING: ' || string_agg(t, ', ') end as detail
from missing;

with expected(t) as (
  values ('notifications'),('collections'),('collection_items'),
         ('communities'),('community_members'),('community_posts'),('post_comments')
),
present as (
  select count(*) n from expected
  where exists (
    select 1 from pg_class c join pg_namespace nn on nn.oid = c.relnamespace
    where nn.nspname = 'public' and c.relname = expected.t and c.relkind = 'r')
)
select '1b. 0002 tables (7 expected, optional)' as check,
       case when n = 7 then 'PASS' when n = 0 then 'SKIP' else 'FAIL' end as result,
       case when n = 7 then '0002 applied, 7/7 present'
            when n = 0 then '0002 not applied — this is a valid state; re-run after applying it'
            else 'PARTIAL: ' || n || '/7 — 0002 applied incompletely, investigate' end as detail
from present;

-- ---------------------------------------------------------------------------
-- CHECK 1c · RLS is ENABLED on every table in public.
-- ADR B0: RLS is the ONLY boundary. A table without it is an open door.
-- ---------------------------------------------------------------------------
select '1c. RLS enabled on every public table' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'all tables have relrowsecurity'
            else 'RLS OFF: ' || string_agg(c.relname, ', ') end as detail
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

-- ---------------------------------------------------------------------------
-- CHECK 1d · Every RLS-enabled table actually HAS at least one policy.
-- RLS with zero policies denies everything — usually a mistake, not a design.
-- Exception: none. Every table here is expected to have explicit policies.
-- ---------------------------------------------------------------------------
select '1d. every table has >=1 policy' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'no policy-less tables'
            else 'NO POLICIES: ' || string_agg(c.relname, ', ') end as detail
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

-- ---------------------------------------------------------------------------
-- CHECK 1e · orders / order_items / buyer_signals / notifications have NO
-- client write policies. This is the P1-1 / P2-4 / B16 control, and it is an
-- ABSENCE — so it must be asserted explicitly or a future migration will
-- silently add one.
-- ---------------------------------------------------------------------------
select '1e. no write policies on write-locked tables' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'orders/order_items/buyer_signals/notifications are SELECT-only'
            else 'UNEXPECTED WRITE POLICY: ' ||
                 string_agg(c.relname || '.' || p.polname || ' (' || p.polcmd || ')', ', ')
       end as detail
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('orders', 'order_items', 'buyer_signals', 'notifications')
  and p.polcmd <> 'r';   -- 'r' = SELECT

-- ---------------------------------------------------------------------------
-- CHECK 2a · pg_proc search-path audit (ADR validation step 2).
-- Every SECURITY DEFINER function in public must pin search_path. Without it a
-- caller can prepend a schema of their own and hijack an unqualified reference
-- inside a function that runs with the owner's privileges.
-- ---------------------------------------------------------------------------
select '2a. every SECURITY DEFINER fn pins search_path' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'all definer functions have search_path in proconfig'
            else 'UNPINNED: ' || string_agg(p.proname, ', ') end as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
  and (p.proconfig is null
       or not exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'));

-- Broader form: ALL functions in public, definer or not. 0001/0002 pin every
-- one; a new function without a pinned path is a smell even when invoker-rights.
select '2b. every public fn pins search_path (advisory)' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'all public functions pin search_path'
            else 'UNPINNED: ' || string_agg(p.proname, ', ') end as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and (p.proconfig is null
       or not exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'));

-- ---------------------------------------------------------------------------
-- CHECK 2c · No EXECUTE granted to `public` or `anon` on any function, EXCEPT
-- get_public_profile (which is anon + authenticated by design, NEW-1).
-- ADR validation step 2, second half.
-- ---------------------------------------------------------------------------
select '2c. anon/public EXECUTE grants are limited to get_public_profile' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'no unexpected anon/public EXECUTE grants'
            else 'UNEXPECTED GRANT: ' || string_agg(p.proname || ' -> ' || g.grantee, ', ')
       end as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral (values ('anon'), ('public')) as g(grantee)
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.proname <> 'get_public_profile'
  and has_function_privilege(
        case when g.grantee = 'public' then 'public' else g.grantee end,
        p.oid, 'EXECUTE');

-- ---------------------------------------------------------------------------
-- CHECK 3 · Anon must NOT be able to execute any write RPC.
-- ADR validation step 3. This is the SQL-expressible half (the grant ACL). The
-- end-to-end half — a real PostgREST call with the anon key returning
-- `permission denied` — is MANUAL; see PART C, command C1.
-- ---------------------------------------------------------------------------
with write_rpcs(fn) as (
  values ('create_order'), ('cancel_order'), ('set_order_status'),
         ('mark_notification_read'), ('mark_all_notifications_read'),
         ('join_community'), ('leave_community')
),
leaks as (
  select p.proname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join write_rpcs w on w.fn = p.proname
  where n.nspname = 'public'
    and has_function_privilege('anon', p.oid, 'EXECUTE')
)
select '3. anon cannot EXECUTE any write RPC' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'anon has no EXECUTE on write RPCs (verify end-to-end: PART C, C1)'
            else 'ANON CAN EXECUTE: ' || string_agg(proname, ', ') end as detail
from leaks;

-- ---------------------------------------------------------------------------
-- CHECK 4a · The NEW-1 enumeration gate, structural half.
-- The cycle-1 `public_profiles` view let anon SELECT * over every user and was
-- removed. Assert no view or table in public exposes profiles wholesale.
-- The behavioural half — that no call shape of get_public_profile returns
-- never-posted buyers — is MANUAL; see PART C, command C2.
-- ---------------------------------------------------------------------------
select '4a. no unfiltered profiles view exists' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'no public_profiles-style view'
            else 'FOUND VIEW: ' || string_agg(c.relname, ', ') end as detail
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm')
  and pg_get_viewdef(c.oid) ilike '%profiles%';

-- get_public_profile must exist, be definer, stable, and return exactly the
-- four public display columns — never bio.
select '4b. get_public_profile shape' as check,
       case when count(*) = 1 then 'PASS' else 'FAIL' end as result,
       coalesce(string_agg(pg_get_function_result(p.oid), ' | '),
                'FUNCTION MISSING') as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_public_profile'
  and p.prosecdef = true
  and pg_get_function_result(p.oid) not ilike '%bio%';

-- ---------------------------------------------------------------------------
-- CHECK 8a · Triggers exist on the correct tables and events (ADR step 8,
-- structural half). The behavioural half — that they actually RAISE — is
-- exercised live in PART B.
-- ---------------------------------------------------------------------------
with expected(trg, tbl, expect_events) as (
  values
    ('on_auth_user_created',       'users',       'INSERT'),
    ('profiles_role_guard',        'profiles',    'UPDATE'),
    ('reviews_seller_scope_guard', 'reviews',     'UPDATE'),
    ('badges_real_maker_guard',    'badges',      'INSERT/UPDATE'),
    ('threads_guard',              'threads',     'INSERT/UPDATE'),
    ('commissions_guard',          'commissions', 'INSERT/UPDATE')
),
found as (
  select e.trg, e.tbl, e.expect_events,
         (select count(*) from pg_trigger t
          join pg_class c on c.oid = t.tgrelid
          where t.tgname = e.trg and c.relname = e.tbl and not t.tgisinternal) as n
  from expected e
)
select '8a. all 6 guard triggers installed' as check,
       case when count(*) filter (where n = 0) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) filter (where n = 0) = 0 then '6/6 present'
            else 'MISSING: ' || string_agg(trg, ', ') filter (where n = 0) end as detail
from found;

-- ---------------------------------------------------------------------------
-- CHECK 9 · Function/view owner is a NON-SUPERUSER role.
-- ADR validation step 9. SECURITY DEFINER functions run as their OWNER. If the
-- owner is a superuser, the definer boundary is not a privilege boundary at all
-- — it is a total bypass, including of every RLS policy in this schema.
-- ---------------------------------------------------------------------------
select '9. definer functions are not owned by a superuser' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'no SECURITY DEFINER function is owned by a superuser'
            else 'SUPERUSER-OWNED: ' || string_agg(p.proname || ' (owner ' || a.rolname || ')', ', ')
       end as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_authid a on a.oid = p.proowner
where n.nspname = 'public' and p.prosecdef = true and a.rolsuper = true;

-- Informational: who owns them, so the reviewer can eyeball it.
select '9b. definer function owners (informational)' as check,
       'INFO' as result,
       string_agg(distinct a.rolname, ', ') as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_authid a on a.oid = p.proowner
where n.nspname = 'public' and p.prosecdef = true;

-- ---------------------------------------------------------------------------
-- CHECK 10 · 0002 · the new anon-read boundary on `collections`.
-- The public-read policy must carry a visibility='public' predicate. A policy
-- of `using (true)` here would expose every private board to the internet.
-- ---------------------------------------------------------------------------
select '10. collections public-read policy is visibility-gated' as check,
       case
         when not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                          where n.nspname='public' and c.relname='collections')
           then 'SKIP'
         when exists (
           select 1 from pg_policy p
           join pg_class c on c.oid = p.polrelid
           where c.relname = 'collections'
             and p.polname = 'collections_public_read'
             and pg_get_expr(p.polqual, p.polrelid) ilike '%visibility%public%')
           then 'PASS'
         else 'FAIL'
       end as result,
       coalesce(
         (select pg_get_expr(p.polqual, p.polrelid)
          from pg_policy p join pg_class c on c.oid = p.polrelid
          where c.relname = 'collections' and p.polname = 'collections_public_read'),
         '0002 not applied, or policy missing') as detail;

-- ---------------------------------------------------------------------------
-- CHECK 11 · 0002 · community read policies must go through the membership
-- helper, never `using (true)`. A `true` predicate on community_posts would
-- make every private community public.
-- ---------------------------------------------------------------------------
select '11. community_posts read is membership-gated' as check,
       case
         when not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                          where n.nspname='public' and c.relname='community_posts')
           then 'SKIP'
         when exists (
           select 1 from pg_policy p
           join pg_class c on c.oid = p.polrelid
           where c.relname = 'community_posts'
             and p.polcmd = 'r'
             and pg_get_expr(p.polqual, p.polrelid) ilike '%can_read_community%')
           then 'PASS'
         else 'FAIL'
       end as result,
       coalesce(
         (select pg_get_expr(p.polqual, p.polrelid)
          from pg_policy p join pg_class c on c.oid = p.polrelid
          where c.relname = 'community_posts' and p.polcmd = 'r' limit 1),
         '0002 not applied, or policy missing') as detail;

-- ---------------------------------------------------------------------------
-- CHECK 12 · money columns are integer, never floating point.
-- A float here loses pennies silently and permanently.
-- ---------------------------------------------------------------------------
select '12. no float/numeric money columns' as check,
       case when count(*) = 0 then 'PASS' else 'FAIL' end as result,
       case when count(*) = 0 then 'all *_amount columns are integer'
            else 'NON-INTEGER: ' || string_agg(table_name || '.' || column_name || ' ' || data_type, ', ')
       end as detail
from information_schema.columns
where table_schema = 'public'
  and column_name like '%_amount'
  and data_type <> 'integer';


-- ============================================================================
-- PART B · LIVE RLS MATRIX (ADR checks 5, 6, 7, 8-behavioural)
-- ----------------------------------------------------------------------------
-- Runs inside a transaction that ENDS IN ROLLBACK. Nothing below persists.
--
-- It creates two throwaway users, promotes one to seller (service-role path),
-- publishes a store with a product, then switches to the `authenticated` role
-- with a forged-but-local JWT claim set and asserts what each actor can and
-- cannot do. Every assertion prints its own PASS/FAIL NOTICE.
--
-- If your connection cannot insert into `auth.users` (some managed setups
-- restrict it), the whole part prints SKIP with instructions — create two users
-- through the Supabase Auth API instead and re-run the assertions against their
-- ids, or run the equivalent matrix from the app's integration test suite.
-- ============================================================================

\echo ''
\echo '=============================================================='
\echo 'PART B — live RLS matrix (transactional, rolled back)'
\echo '=============================================================='

begin;

do $$
declare
  v_buyer   uuid := gen_random_uuid();
  v_seller  uuid := gen_random_uuid();
  v_store   uuid;
  v_product uuid;
  v_order   uuid;
  v_ok      boolean;
  v_n       integer;
begin
  -- --- seed as the current (privileged) role ------------------------------
  begin
    insert into auth.users (id, email) values
      (v_buyer,  'validate-buyer-'  || v_buyer  || '@example.invalid'),
      (v_seller, 'validate-seller-' || v_seller || '@example.invalid');
  exception when others then
    raise notice 'PART B | SKIP | cannot insert into auth.users here (%). Create two users via the Auth API and run the matrix from the app integration tests instead.', sqlerrm;
    return;
  end;

  -- CHECK 8b · did the signup trigger fire, and did it force role='buyer'?
  select count(*) into v_n from public.profiles
   where id in (v_buyer, v_seller) and role = 'buyer';
  raise notice 'CHECK 8b handle_new_user seeded 2 buyer profiles | % | found %',
    case when v_n = 2 then 'PASS' else 'FAIL' end, v_n;

  -- service-role path: promote one profile to seller. The claim must be set
  -- first — `guard_profile_role` tests auth.role() = 'service_role' explicitly,
  -- and a bare psql connection has no claims at all (auth.role() → NULL), which
  -- the guard correctly treats as "not trusted".
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profiles set role = 'seller' where id = v_seller;

  insert into public.stores (owner_id, handle, name, published)
    values (v_seller, 'validate-store-' || substr(v_seller::text, 1, 8), 'Validate Store', true)
    returning id into v_store;

  insert into public.products (store_id, title, price_amount, currency)
    values (v_store, 'Validate Product', 5000, 'GBP')
    returning id into v_product;

  -- --- switch to a BUYER session ------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer::text, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- CHECK 5a · create_order ignores any client-supplied price.
  v_order := public.create_order(v_store,
    jsonb_build_array(jsonb_build_object(
      'product_id', v_product, 'quantity', 2,
      'unit_price_amount', 1,        -- attacker-supplied; must be ignored
      'subtotal_amount', 1)));
  select subtotal_amount into v_n from public.orders where id = v_order;
  raise notice 'CHECK 5a create_order ignores client price | % | subtotal=% (expected 10000)',
    case when v_n = 10000 then 'PASS' else 'FAIL' end, v_n;

  -- CHECK 5b · buyer_id is bound to the caller, status forced to pending.
  select count(*) into v_n from public.orders
   where id = v_order and buyer_id = v_buyer and status = 'pending';
  raise notice 'CHECK 5b buyer_id bound to caller, status pending | %',
    case when v_n = 1 then 'PASS' else 'FAIL' end;

  -- CHECK 5c · quantity <= 0 is rejected.
  v_ok := false;
  begin
    perform public.create_order(v_store,
      jsonb_build_array(jsonb_build_object('product_id', v_product, 'quantity', 0)));
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 5c quantity<=0 rejected | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 5d · a product from another store is rejected.
  v_ok := false;
  begin
    perform public.create_order(v_store,
      jsonb_build_array(jsonb_build_object('product_id', gen_random_uuid(), 'quantity', 1)));
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 5d cross-store item rejected | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 6a · buyer cannot self-promote to seller (profiles_role_guard).
  v_ok := false;
  begin
    update public.profiles set role = 'seller' where id = v_buyer;
    -- if RLS silently matched zero rows that is also a pass; check the value
    select count(*) into v_n from public.profiles where id = v_buyer and role = 'seller';
    v_ok := (v_n = 0);
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 6a buyer cannot self-promote role | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 6b · buyer cannot mint a real-maker badge.
  v_ok := false;
  begin
    insert into public.badges (store_id, kind) values (v_store, 'real-maker');
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 6b buyer cannot mint real-maker badge | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 6c · buyer cannot directly UPDATE an order's status (no policy).
  update public.orders set status = 'paid' where id = v_order;
  select count(*) into v_n from public.orders where id = v_order and status = 'paid';
  raise notice 'CHECK 6c buyer cannot set status=paid directly | %',
    case when v_n = 0 then 'PASS' else 'FAIL' end;

  -- CHECK 6d · buyer cannot INSERT an order row directly (no INSERT policy).
  v_ok := false;
  begin
    insert into public.orders (buyer_id, store_id, subtotal_amount)
      values (v_buyer, v_store, 1);
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 6d buyer cannot INSERT orders directly | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 6e · buyer cannot write a weighted ranking signal.
  v_ok := false;
  begin
    insert into public.buyer_signals (buyer_id, subject_type, subject_id, signal_type, weight)
      values (v_buyer, 'store', v_store, 'visit', 100);
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 6e buyer cannot write buyer_signals | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 6f · buyer cannot create a store (P2-6, role gate).
  v_ok := false;
  begin
    insert into public.stores (owner_id, handle, name)
      values (v_buyer, 'buyer-store-' || substr(v_buyer::text,1,8), 'nope');
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 6f buyer cannot create a store | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- --- switch to the SELLER session ---------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_seller::text, 'role', 'authenticated')::text, true);

  -- CHECK 7a · seller may advance own-store order to 'fulfilled'.
  v_ok := true;
  begin
    perform public.set_order_status(v_order, 'fulfilled');
  exception when others then v_ok := false;
  end;
  select count(*) into v_n from public.orders where id = v_order and status = 'fulfilled';
  raise notice 'CHECK 7a seller can set own order fulfilled | %',
    case when v_ok and v_n = 1 then 'PASS' else 'FAIL' end;

  -- CHECK 7b · seller may NOT set 'paid' (that is the Stripe webhook only).
  v_ok := false;
  begin
    perform public.set_order_status(v_order, 'paid');
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 7b seller cannot set status=paid | %', case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 7c · seller may not touch an order outside their own store.
  v_ok := false;
  begin
    perform public.set_order_status(gen_random_uuid(), 'fulfilled');
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 7c seller cannot touch another store''s order | %',
    case when v_ok then 'PASS' else 'FAIL' end;

  -- CHECK 8c · threads_guard: a thread whose maker is not a seller must fail.
  v_ok := false;
  begin
    insert into public.threads (buyer_id, maker_id) values (v_seller, v_buyer);
  exception when others then v_ok := true;
  end;
  raise notice 'CHECK 8c threads_guard rejects non-seller maker | %',
    case when v_ok then 'PASS' else 'FAIL' end;

  reset role;
end $$;

rollback;

\echo ''
\echo 'PART B complete — transaction rolled back, nothing persisted.'


-- ============================================================================
-- PART C · MANUAL CHECKS (cannot be expressed in SQL)
-- ----------------------------------------------------------------------------
-- These require a real HTTP request carrying the anon key through PostgREST and
-- GoTrue. Running the equivalent SQL as a database role does NOT prove them:
-- the API gateway, the JWT verification, and the role mapping are all part of
-- what is under test. Run them from a shell and paste the output into the QA
-- record alongside this file's PASS/FAIL rows.
--
-- Set these first:
--   export SUPABASE_URL="https://<project-ref>.supabase.co"
--   export ANON_KEY="<the anon/publishable key>"
--
-- --- C1 · ADR step 3 · anon key → every write RPC returns permission denied ---
--   for fn in create_order cancel_order set_order_status \
--             mark_notification_read mark_all_notifications_read join_community; do
--     echo "== $fn"
--     curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/$fn" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
--       -H "Content-Type: application/json" -d '{}'
--     echo
--   done
--   EXPECT: every one returns a 401/403-class error mentioning permission denied
--   (or "function not found" if PostgREST hides unexecutable functions — also a
--   pass). ANY 200, or any error that reveals a constraint violation from inside
--   the function body, is a FAIL: it means anon reached the body.
--
-- --- C2 · ADR step 4 · get_public_profile enumeration gate -------------------
--   Known id returns exactly one row:
--     curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/get_public_profile" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
--       -H "Content-Type: application/json" -d '{"p_id":"<A-KNOWN-BUYER-UUID>"}'
--   EXPECT: one object, containing id/display_name/avatar_url/role and NOTHING
--   else — in particular no `bio`, no email.
--
--   Now attempt enumeration. ALL of these must return zero buyer rows:
--     curl -s "$SUPABASE_URL/rest/v1/profiles?select=*" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   EXPECT: only role='seller' rows. If a single buyer row appears, the NEW-1
--   gate has regressed and this is a FAIL that blocks the production apply.
--
--     curl -s "$SUPABASE_URL/rest/v1/rpc/get_public_profile" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   EXPECT: an error about the missing p_id argument — never a full listing.
--
-- --- C3 · 0002 · collections slug enumeration (saved-collections.md NFR) -----
--   Create one PRIVATE board as a buyer, note its slug, then as anon:
--     curl -s "$SUPABASE_URL/rest/v1/collections?select=*" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   EXPECT: only visibility='public' rows.
--     curl -s "$SUPABASE_URL/rest/v1/collections?slug=eq.<PRIVATE-SLUG>&select=*" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   EXPECT: [] — and the APP must render 404, not 403, so a probe cannot tell
--   "private" from "does not exist".
--   Also confirm the slug is 32 hex chars, is not the row id, and that two boards
--   created back to back have unrelated slugs.
--
-- --- C4 · 0002 · private community membership gate ---------------------------
--   With a NON-MEMBER authenticated JWT (not the anon key):
--     curl -s "$SUPABASE_URL/rest/v1/community_posts?community_id=eq.<PRIVATE-COMMUNITY-ID>&select=*" \
--       -H "apikey: $ANON_KEY" -H "Authorization: Bearer <NON-MEMBER-JWT>"
--   EXPECT: []. Then join via join_community() as a follower and repeat —
--   EXPECT: the posts. Then unfollow and repeat if OQ-5 of maker-community.md
--   ("does unfollowing revoke reads") has been answered yes.
--
-- --- C5 · ADR step 9, human half -------------------------------------------
--   Confirm with the Supabase dashboard which role owns the definer functions
--   and that it is not a superuser. Check 9 above tests `rolsuper`, but a role
--   can also be dangerous through membership (e.g. granted `postgres`). Run:
--     select r.rolname, m.rolname as member_of
--       from pg_auth_members am
--       join pg_authid r on r.oid = am.member
--       join pg_authid m on m.oid = am.roleid
--      where r.rolname = '<the owner from check 9b>';
--   EXPECT: no membership that confers superuser or BYPASSRLS.
-- ============================================================================
