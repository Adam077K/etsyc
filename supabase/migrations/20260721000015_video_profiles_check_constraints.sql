-- ============================================================================
-- KOL MVP — Migration · Group 15 · video_profiles CHECK constraints (MIG-CHECK)
-- ----------------------------------------------------------------------------
-- Status:   Wave-2 remediation. IRREVERSIBLE TIER — Founder-signed spec;
--           constraint names and predicates are part of the signed spec and
--           must not be altered.
--
-- Purpose:  A Full-tier adversary review found the platform's load-bearing
--           invariant enforced ONLY in application code. `purpose`,
--           `page_eligibility` and `mood` are bare text[] — the enum values
--           lived in a SQL comment (group 03), and RLS
--           `video_profiles_owner_all` gates WHOSE row is written, never WHAT
--           is in it. Any authenticated seller could PATCH their own row via
--           PostgREST with purpose=['intro','thankyou'],
--           page_eligibility=['feed','thankyou'] and put a thank-you clip in
--           the public discovery feed. §B0: "No restriction may be 'app-side
--           only'." These CHECKs make the app-layer Zod guard and the DB
--           guard parallel instead of serial. CHECK constraints bind the
--           service role too — unlike RLS, a privileged writer cannot bypass
--           them.
--
--           `anti_repetition_key` is capped here because the 64-char limit
--           was Zod-only (PostgREST-bypassable); overlong keys also overflow
--           the engine's signed cookie ring past the 4096-byte browser cap
--           and silently disable anti-repetition.
--
-- Invariants preserved (verified pre-apply):
--   * Empty arrays satisfy `<@` — untagged footage stays valid and INVISIBLE
--     (empty arrays match no eligibility query). Safe by default.
--   * Enum values match the frozen tag constants in the Wave-2 dispatch
--     packet §7 (single source of truth shared with lib/tagging).
--   * Deliberately NO array cardinality caps: multi-purpose clips are a
--     product decision; anti-stuffing belongs in scoring, not the schema.
--
-- Pre-flight (staging olwtcjzmohdhawdzlzqs, 2026-07-21): 0 rows total,
-- 0 nonconforming for all 5 predicates. Applied to an empty table.
--
-- Apply runbook (MANUAL — no committed automation, per QA-Lead ruling on the
-- Management API /database/query endpoint):
--   1. psql over the session pooler as the migration role:
--        psql "host=aws-1-us-east-2.pooler.supabase.com port=5432 \
--              dbname=postgres user=postgres.<project-ref> sslmode=require" \
--             -v ON_ERROR_STOP=1 -f <this file>
--      Password via PGPASSFILE (chmod 600) — never on argv, never sourced.
--   2. Record the apply in the ledger:
--        insert into supabase_migrations.schema_migrations (version, name)
--        values ('20260721000015', 'video_profiles_check_constraints');
--
-- Rollback plan (constraint drops only — no data change):
--   alter table public.video_profiles drop constraint video_profiles_purpose_enum;
--   alter table public.video_profiles drop constraint video_profiles_page_enum;
--   alter table public.video_profiles drop constraint video_profiles_mood_enum;
--   alter table public.video_profiles drop constraint video_profiles_thankyou_exclusive;
--   alter table public.video_profiles drop constraint video_profiles_antirep_key_format;
--   delete from supabase_migrations.schema_migrations where version = '20260721000015';
-- ============================================================================

begin;

alter table public.video_profiles
  add constraint video_profiles_purpose_enum
    check (purpose <@ array['intro','craft-story','process','product-narration','thankyou','atmosphere']),
  add constraint video_profiles_page_enum
    check (page_eligibility <@ array['feed','grown','world','product','checkout','thankyou']),
  add constraint video_profiles_mood_enum
    check (mood <@ array['calm','warm','energetic','intimate']),
  add constraint video_profiles_thankyou_exclusive
    check (
      not ('thankyou' = any(purpose) or 'thankyou' = any(page_eligibility))
      or (purpose = array['thankyou'] and page_eligibility = array['thankyou'])
    ),
  add constraint video_profiles_antirep_key_format
    check (anti_repetition_key is null
       or (char_length(anti_repetition_key) <= 64
       and anti_repetition_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));

commit;
