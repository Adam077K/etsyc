-- ============================================================================
-- KOL MVP — 0003 · PRODUCT config_id (close the OQ-2 product id-space gap)
-- ============================================================================
--
--   RISK TIER: **LITE**. Adds one nullable column and one partial unique index
--   to `public.products`. No RLS policy is added, dropped, or altered — the
--   existing `products_owner_all` and `products_public_read_published` policies
--   from 0001 continue to govern every row unchanged. Adding a column does not
--   widen who can read or write.
--
--   WHY
--   ---
--   A maker's world renders from `stores.config` (jsonb), whose product refs are
--   SYMBOLIC ids — `p_ridge_tumbler`, `p_ash_bowl`, `p_shibori_throw` — while
--   `products.id` is a uuid primary key. ADR-0001 OQ-2 makes `videos`/`config`
--   share an id space but leaves the (weaker) product mirror on two id spaces.
--   So a world links to `/m/sena/p/p_ridge_tumbler`, and
--   `getProduct('p_ridge_tumbler')` against a uuid PK finds nothing — the live
--   product page cannot render. `config_id` carries the store-config symbolic id
--   so the adapter can resolve either space (uuid → id, symbolic → config_id).
--
--   Idempotent and re-runnable: `add column if not exists` +
--   `create unique index if not exists`. Apply 0001 (and optionally 0002) first;
--   this file touches only the `products` table which 0001 creates.
--   Apply this BEFORE re-running seed.sql — the seed now sets `config_id`.
-- ============================================================================

begin;

-- The store-config symbolic product id (e.g. 'p_ridge_tumbler'). Nullable: a
-- commission-only product that never appears in a rendered world has no config
-- presence and therefore no symbolic id.
alter table public.products
  add column if not exists config_id text;

comment on column public.products.config_id is
  'Store-config symbolic product id (e.g. p_ridge_tumbler) mirrored from '
  'stores.config; resolves the OQ-2 product id-space gap. NULL for products '
  'with no world presence. Unique per store where present.';

-- Unique PER STORE, only where set: two different stores may both name a
-- product 'p_hero', but one store may not carry the same symbolic id twice.
-- A partial index ignores the NULLs so commission-only products are unconstrained.
create unique index if not exists products_store_config_id_key
  on public.products (store_id, config_id)
  where config_id is not null;

commit;
