-- ============================================================================
-- KOL MVP — Migration · Group 14 · Function EXECUTE-grant hardening
-- ----------------------------------------------------------------------------
-- Status:   Fix authored from the MIG-APPLY 9-point staging validation
--           (2026-07-21). Points 2+3 FAILED on groups 01-13 as authored:
--           anon retained EXECUTE on the three definer write RPCs.
--
-- WHY:      Supabase provisions ALTER DEFAULT PRIVILEGES so that every new
--           function in schema public is granted EXECUTE to anon,
--           authenticated AND service_role EXPLICITLY at CREATE FUNCTION time.
--           Groups 01-13 did `revoke execute ... from public` — but a revoke
--           from the public pseudo-role does NOT remove anon's own explicit
--           default-privilege grant (proacl kept `anon=X/postgres`). The calls
--           failed closed at runtime (auth.uid() guard raised P0001, zero rows
--           written), but ADR-0001 requires the EXECUTE-layer gate: anon must
--           get 42501 permission denied without entering the function body.
--
-- WHAT:     1. Revoke anon EXECUTE on the 3 definer write RPCs
--              (create_order / cancel_order / set_order_status) — they remain
--              callable by authenticated + service_role only.
--           2. Revoke public/anon/authenticated EXECUTE on the 6 trigger
--              functions — trigger execution does not check the invoking
--              user's EXECUTE privilege, so nothing breaks; direct RPC calls
--              were never intended (they are 0A000-uncallable anyway).
--           3. Policy for the future: default privileges in schema public no
--              longer auto-grant EXECUTE to anon — every anon-callable
--              function must carry its own explicit grant (as
--              get_public_profile does).
--
-- NOT touched: get_public_profile(uuid) keeps its explicit anon+authenticated
--           grant from group 01 — it is the ONE intended anon-callable
--           function (NEW-1 id-keyed buyer-safe display read).
--
-- Rollback notes:
--   grant execute on function public.create_order(uuid, jsonb) to anon;
--   grant execute on function public.cancel_order(uuid) to anon;
--   grant execute on function public.set_order_status(uuid, public.order_status) to anon;
--   grant execute on function public.handle_new_user() to anon, authenticated;
--   grant execute on function public.guard_profile_role() to anon, authenticated;
--   grant execute on function public.enforce_review_seller_scope() to anon, authenticated;
--   grant execute on function public.enforce_real_maker_badge() to anon, authenticated;
--   grant execute on function public.guard_thread() to anon, authenticated;
--   grant execute on function public.guard_commission() to anon, authenticated;
--   alter default privileges in schema public grant execute on functions to anon;
-- ============================================================================

begin;

-- 1. Definer write RPCs: authenticated + service_role only, never anon.
revoke execute on function public.create_order(uuid, jsonb)                    from anon;
revoke execute on function public.cancel_order(uuid)                           from anon;
revoke execute on function public.set_order_status(uuid, public.order_status)  from anon;

-- 2. Trigger functions: not client-callable at all (fired by the DB only).
revoke execute on function public.handle_new_user()             from public, anon, authenticated;
revoke execute on function public.guard_profile_role()          from public, anon, authenticated;
revoke execute on function public.enforce_review_seller_scope() from public, anon, authenticated;
revoke execute on function public.enforce_real_maker_badge()    from public, anon, authenticated;
revoke execute on function public.guard_thread()                from public, anon, authenticated;
revoke execute on function public.guard_commission()            from public, anon, authenticated;

-- 3. Future functions: no implicit anon EXECUTE — anon access is opt-in via an
--    explicit grant (the get_public_profile pattern).
alter default privileges in schema public revoke execute on functions from anon;

commit;
