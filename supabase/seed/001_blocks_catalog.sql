-- ============================================================================
-- KOL MVP — Seed 001 · blocks catalog  (DATA SEED — NOT a migration)
-- ----------------------------------------------------------------------------
-- Purpose:  Populate `public.blocks`, the platform's STATIC catalog of block
--           TYPES + VARIANTS (OQ-1, P5/D4). One row per (type, variant) pair
--           declared by the shipped Zod discriminated union in
--           apps/kol/src/lib/store-config/schema.ts (StoreBlockSchema,
--           lines ~324-441). 11 types · 31 (type, variant) pairs.
--           Per-store block INSTANCES live in stores.config.blocks[] (jsonb) —
--           this table is platform reference data only.
--
-- Access:   SERVICE-ROLE ONLY. `blocks` is public-read with NO client write
--           policy (see 20260721000005_blocks_voiceovers.sql). Never apply
--           with a client/anon key.
--
-- How to apply — MANUAL RUNBOOK (operator-run; deliberately NO repo script):
--   Security review removed scripts/seed-blocks.sh: it ran this file through
--   the Management API /database/query endpoint, which executes as the
--   `postgres` superuser under an org-wide personal access token — far beyond
--   the project-scoped service-role write this seed was authorized for.
--   Committed automation must be least-privilege; see
--   .claude/memory/DECISIONS.md (2026-07-21) for the standing policy.
--
--   Apply by hand with psql using the project-scoped connection string
--   (Dashboard → Project Settings → Database). As of 2026-07-21 neither psql
--   nor the Supabase CLI is installed on the dev machine — install one first
--   (e.g. `brew install libpq` for psql).
--
--     psql -h <project-db-host> -p 5432 -d postgres -U postgres -W \
--          -f supabase/seed/001_blocks_catalog.sql
--
--   Secret handling (non-negotiable):
--     * NEVER pass the password/token in argv — argv is world-readable via
--       `ps -ef`. Use -W to be prompted, or ~/.pgpass (chmod 600).
--     * NEVER `set -a; source .env.local` — that exports every secret (incl.
--       the service-role key and DB password) into all child-process
--       environments. Read single non-secret vars explicitly if needed.
--   If using the Supabase CLI instead: authenticate with `supabase login`
--   (interactive prompt — never `--token <value>` in argv), then
--   `supabase link --project-ref <ref>`, and run this file via psql as above.
--
--   Verify after apply (expect total_rows=31, distinct_types=11):
--     select count(*) as total_rows, count(distinct type) as distinct_types
--       from public.blocks;
--
-- Idempotent: YES. Upsert on the `unique (type, variant)` constraint; running
--           this file twice leaves the table content identical.
--
-- allowed_states: {empty,loading,error,success} for ALL rows — the shipped P5
--           suite (apps/kol/src/components/blocks/states.test.ts) asserts all
--           4 states render for every block; no block has a restricted set.
--
-- Rollback (exact, scoped — removes ONLY the rows this seed writes):
--   delete from public.blocks where (type, variant) in (
--     ('hero-video','full-bleed'), ('hero-video','center-column'),
--     ('hero-video','corner-shrunk'),
--     ('craft-story','text-left-media-right'), ('craft-story','stacked-editorial'),
--     ('craft-story','pull-quote'),
--     ('product-showcase','rail'), ('product-showcase','masonry'),
--     ('product-showcase','featured-single'),
--     ('product-detail','image-gallery'), ('product-detail','3d-viewer'),
--     ('product-detail','video-led'),
--     ('voice-quote','audio-tap'), ('voice-quote','text-only'),
--     ('voice-quote','text+waveform'),
--     ('process-reel','single-reel'), ('process-reel','multi-clip-carousel'),
--     ('reviews','list'), ('reviews','rating-summary'), ('reviews','featured-quote'),
--     ('trust-badge','inline-compact'), ('trust-badge','expandable-detail'),
--     ('thank-you','video-message'), ('thank-you','text+media'),
--     ('atmosphere','color-wash'), ('atmosphere','block-ground'),
--     ('atmosphere','image-band'), ('atmosphere','motion-divider'),
--     ('contact-cta','button'), ('contact-cta','card'), ('contact-cta','footer-strip')
--   );
-- ============================================================================

begin;

insert into public.blocks (type, variant, allowed_states, prop_schema_ref) values
  -- hero-video (3) — store-config/schema.ts#HeroVideoBlockSchema
  ('hero-video',       'full-bleed',            '{empty,loading,error,success}', 'store-config/schema.ts#HeroVideoBlockSchema'),
  ('hero-video',       'center-column',         '{empty,loading,error,success}', 'store-config/schema.ts#HeroVideoBlockSchema'),
  ('hero-video',       'corner-shrunk',         '{empty,loading,error,success}', 'store-config/schema.ts#HeroVideoBlockSchema'),
  -- craft-story (3)
  ('craft-story',      'text-left-media-right', '{empty,loading,error,success}', 'store-config/schema.ts#CraftStoryBlockSchema'),
  ('craft-story',      'stacked-editorial',     '{empty,loading,error,success}', 'store-config/schema.ts#CraftStoryBlockSchema'),
  ('craft-story',      'pull-quote',            '{empty,loading,error,success}', 'store-config/schema.ts#CraftStoryBlockSchema'),
  -- product-showcase (3)
  ('product-showcase', 'rail',                  '{empty,loading,error,success}', 'store-config/schema.ts#ProductShowcaseBlockSchema'),
  ('product-showcase', 'masonry',               '{empty,loading,error,success}', 'store-config/schema.ts#ProductShowcaseBlockSchema'),
  ('product-showcase', 'featured-single',       '{empty,loading,error,success}', 'store-config/schema.ts#ProductShowcaseBlockSchema'),
  -- product-detail (3)
  ('product-detail',   'image-gallery',         '{empty,loading,error,success}', 'store-config/schema.ts#ProductDetailBlockSchema'),
  ('product-detail',   '3d-viewer',             '{empty,loading,error,success}', 'store-config/schema.ts#ProductDetailBlockSchema'),
  ('product-detail',   'video-led',             '{empty,loading,error,success}', 'store-config/schema.ts#ProductDetailBlockSchema'),
  -- voice-quote (3)
  ('voice-quote',      'audio-tap',             '{empty,loading,error,success}', 'store-config/schema.ts#VoiceQuoteBlockSchema'),
  ('voice-quote',      'text-only',             '{empty,loading,error,success}', 'store-config/schema.ts#VoiceQuoteBlockSchema'),
  ('voice-quote',      'text+waveform',         '{empty,loading,error,success}', 'store-config/schema.ts#VoiceQuoteBlockSchema'),
  -- process-reel (2)
  ('process-reel',     'single-reel',           '{empty,loading,error,success}', 'store-config/schema.ts#ProcessReelBlockSchema'),
  ('process-reel',     'multi-clip-carousel',   '{empty,loading,error,success}', 'store-config/schema.ts#ProcessReelBlockSchema'),
  -- reviews (3)
  ('reviews',          'list',                  '{empty,loading,error,success}', 'store-config/schema.ts#ReviewsBlockSchema'),
  ('reviews',          'rating-summary',        '{empty,loading,error,success}', 'store-config/schema.ts#ReviewsBlockSchema'),
  ('reviews',          'featured-quote',        '{empty,loading,error,success}', 'store-config/schema.ts#ReviewsBlockSchema'),
  -- trust-badge (2)
  ('trust-badge',      'inline-compact',        '{empty,loading,error,success}', 'store-config/schema.ts#TrustBadgeBlockSchema'),
  ('trust-badge',      'expandable-detail',     '{empty,loading,error,success}', 'store-config/schema.ts#TrustBadgeBlockSchema'),
  -- thank-you (2)
  ('thank-you',        'video-message',         '{empty,loading,error,success}', 'store-config/schema.ts#ThankYouBlockSchema'),
  ('thank-you',        'text+media',            '{empty,loading,error,success}', 'store-config/schema.ts#ThankYouBlockSchema'),
  -- atmosphere (4)
  ('atmosphere',       'color-wash',            '{empty,loading,error,success}', 'store-config/schema.ts#AtmosphereBlockSchema'),
  ('atmosphere',       'block-ground',          '{empty,loading,error,success}', 'store-config/schema.ts#AtmosphereBlockSchema'),
  ('atmosphere',       'image-band',            '{empty,loading,error,success}', 'store-config/schema.ts#AtmosphereBlockSchema'),
  ('atmosphere',       'motion-divider',        '{empty,loading,error,success}', 'store-config/schema.ts#AtmosphereBlockSchema'),
  -- contact-cta (3)
  ('contact-cta',      'button',                '{empty,loading,error,success}', 'store-config/schema.ts#ContactCtaBlockSchema'),
  ('contact-cta',      'card',                  '{empty,loading,error,success}', 'store-config/schema.ts#ContactCtaBlockSchema'),
  ('contact-cta',      'footer-strip',          '{empty,loading,error,success}', 'store-config/schema.ts#ContactCtaBlockSchema')
on conflict (type, variant) do update set
  allowed_states  = excluded.allowed_states,
  prop_schema_ref = excluded.prop_schema_ref;

commit;
