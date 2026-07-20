# ADR-0001: KOL MVP Data Model (Supabase schema + RLS)

> Architecture Decision Record for the complete KOL MVP relational data model — the migration plan in [`../migrations-plan/`](../migrations-plan/). **Non-applied plan**: the Founder applies manually after QA + sign-off.

---

## Header

| Field | Value |
|-------|-------|
| **ADR Number** | 0001 |
| **Title** | KOL MVP data model — Supabase schema, RLS, and the config↔table boundary |
| **Date** | 2026-07-19 |
| **Status** | Proposed |
| **Deciders** | database-engineer (author), CTO (`cto-kol-p4-schema`), QA-Lead (pending review) |

---

## Context

KOL is a desktop-first, video-native marketplace (concept lock D1–D16). Phase 4 needs the complete relational data model before backend routes can be built. The model has to serve three spines simultaneously: the **D4 store engine** (a per-maker JSON config rendered by one renderer), the **D5 video engine** (rules+context clip selection over tagged footage), and the **D6 KOL-owned checkout** — plus the seven D16 subsystems folded into MVP (Proof of Product, Exactly-What-to-Expect, messaging/drafts, search, public Q&A, follow/save, enriched reviews).

Two tensions force explicit decisions: (1) the store *is* a `jsonb` config (D4 says the AI emits one JSON object, one renderer consumes it) — so what belongs in columns vs in the blob? (2) the video engine must **query** footage by tags, but those same clips are *referenced* from inside the store config — so where is the source of truth, and how do the two stay in sync? Every table also carries user data across a hard buyer/seller/public trust boundary, so RLS is not optional. This ADR records the model and the seven resolved open questions (OQ-1…OQ-7) so downstream engineers implement against one agreed contract.

---

## Decision

Adopt a **31-table Postgres/Supabase model** applied in 13 FK-ordered migration-plan groups, with **RLS enabled + explicit policies on every table**, where: `stores.config` and `store_versions.config` stay **`jsonb`** (D4 — not normalized); `videos` + `video_profiles` are the **canonical queryable source of truth** for the video engine (config mirrors them); money is stored as **integer minor units + currency**; and a `profiles.role` (buyer|seller), seeded by an `auth.users` signup trigger, is the anchor for the buyer/seller/public RLS split.

---

## Rationale

**Why we chose this:**

1. **`jsonb` config, not normalized columns (D4).** The whole point of the store engine is that AI emits *data, not code*, and one renderer consumes any world. Normalizing blocks/theme/media into relational columns would fork the renderer's contract across SQL joins and jsonb, break the "one JSON object" invariant, and make the AI drafter target a moving schema. The config blob is versioned wholesale in `store_versions` (snapshot + `critic_score` + `approved_sections`), which is exactly what the anti-slop critic (P9) and section approval gate (P10) need.
2. **Canonical `videos`/`video_profiles`, config mirrors (OQ-2).** The engine's eligibility filter is a set-intersection over tag arrays; that has to be an *indexed table query*, not a scan of every store's jsonb. Making the tables canonical and GIN-indexing the arrays (`purpose[]`, `page_eligibility[]`, `product_links[]`, `mood[]`) makes discovery/narration selection index-served. The config's `media.clips[]` mirror the bound subset for the renderer; the write path upserts both in one transaction (contract below).
3. **RLS at the DB, keyed on `profiles.role`.** A missing check in any of the ~40 future routes would leak another user's orders or private messages. Enforcing isolation in Postgres means an app bug cannot bypass it. The role is seeded by a `SECURITY DEFINER` signup trigger so it exists the instant a session does.
4. **Integer minor units for money.** Floats lose pennies; store-config §2.4 already specifies minor units. Every amount column is `integer` + a 3-char `currency`.

**What we're trading off:**

- **Config↔table duplication for videos** (and, more weakly, products). The mirror must be kept consistent app-side; a bug can desync the config's clip refs from the `videos` rows. Mitigated by the single-transaction upsert contract and by the Zod validator (P3) rejecting configs whose clip ids don't resolve.
- **RLS policy sprawl.** ~30 tables × multiple policies is a lot of surface to review and a lot of correlated subqueries (`store_id in (select … where owner_id = auth.uid())`). Mitigated by indexing every predicate column; still, RLS failures are opaque to debug.
- **Polymorphic columns without FKs** (`saves.subject_id`, `buyer_signals.subject_id`, array `product_links`/`process_media_ids`/`media_ids`). Postgres can't FK an array element or a polymorphic target, so referential integrity for these is app-enforced, not DB-enforced.
- **Column-level RLS gaps.** Postgres RLS is row-, not column-scoped. "Seller may update only `orders.status`" and "seller may update only `reviews.maker_response`" are row-scoped in RLS (own store) and column-restricted in the app layer. Documented so backend-engineer enforces the column allow-list.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Chosen: jsonb config + canonical video tables + full RLS** | One renderer contract; engine queries are indexed; DB-enforced isolation | Config/table mirror to keep in sync; RLS sprawl |
| Fully normalize the store config into relational tables (blocks, theme_tokens, block_bindings, …) | Classic relational integrity; SQL-queryable layout | Breaks D4 "one JSON object, one renderer"; AI must target a shifting relational schema; heavy joins to render one world |
| Video profile tags **only** inside `stores.config` jsonb (no `videos` table) | No duplication; single source | Engine must scan/expand jsonb across all stores per selection — no GIN over per-clip tags; can't cheaply filter discovery feed. Rejected by OQ-2 |
| Application-layer authorization instead of RLS | Simpler migrations; no Postgres policy debugging | Any missing route check leaks data across the buyer/seller boundary — unacceptable for orders, messages, buyer_signals |
| `text[]` categories instead of a join table (OQ-6 alt) | Fewer tables; GIN-filterable | No shared taxonomy, no parent/child facets, no referential integrity for browse filters |

---

## Consequences

**Positive:**
- backend-engineer implements against one agreed 31-table model with the config↔table boundary fixed; no re-litigation mid-build.
- Data isolation is DB-enforced; the public feed can be served to anon users while orders/messages/interviews/buyer_signals stay private, structurally.
- The video engine's hot path (eligibility ∩ over tag arrays + anti-repetition) is GIN/btree-indexed from day one.
- Store versioning + critic score + approved sections are first-class, so the anti-slop gates (D9) have their storage.

**Negative:**
- Every future table must ship `ENABLE ROW LEVEL SECURITY` + policies — easy to forget; QA-Lead should gate on it.
- The videos config-mirror is a durable maintenance obligation; a desync is a real (app-layer) bug class.
- Polymorphic + array references need app/Zod validation that the DB will not backstop.

**Neutral:**
- `blocks` and `categories` are platform reference data (public-read, service-role write) — they need a seed step outside these create-only migrations.
- Testing RLS requires setting `auth.uid()` in test transactions (test-engineer concern).
- `plpgsql` appears once (the signup trigger) — it has no `DECLARE` block, so it's safe against the Supabase SQL-Editor semicolon-split bug, but the group-01 file must be applied via the migration runner, not pasted line-by-line.

---

## Resolved Open Questions (OQ-1 … OQ-7)

| OQ | Choice | Reason |
|----|--------|--------|
| **OQ-1** | `blocks` is a **static catalog** (`type`, `variant`, `allowed_states[]`, `prop_schema_ref`). No `store_blocks` table. | Per-store block *instances* live in `stores.config.blocks[]` (jsonb, D4). The table only enumerates the block *types* the one renderer supports. |
| **OQ-2** | `videos` + `video_profiles` are **canonical/queryable**; `config.media.clips[]` reference `videos.id` and mirror the bound subset. GIN on `purpose[]`/`page_eligibility[]`/`product_links[]`/`mood[]` + btree on `anti_repetition_key`. | The engine must filter footage by an indexed set-intersection, not a jsonb scan. See sync contract below. |
| **OQ-3** | `commissions` = pre-order negotiation entity with its own lifecycle (`brief`→`negotiating`→`drafting`→`approved`→`rejected`→`cancelled`), linked to a `thread`; on approval yields `orders.commission_id` (nullable FK). `commission_drafts` FK→`commissions`, versioned. | Commissioning is a distinct stateful negotiation, not an order attribute; the order is its *outcome*. FK added via ALTER in group 10 to respect ordering. |
| **OQ-4** | `buyer_signals` = event log `(buyer_id, subject_type[maker\|store\|product], subject_id, signal_type[visit\|purchase\|question\|save\|follow\|commission\|review], weight, created_at)`, composite index `(buyer_id, subject_type, subject_id, signal_type)`. | Append-only signal stream is what the ranking engine consumes; polymorphic subject keeps it one table. |
| **OQ-5** | `questions`/`answers` are **public-read** and **separate** from private `threads`/`messages`. | Public Q&A and private messaging have opposite visibility; merging them would leak private threads or hide public Q&A. UI reuse ≠ schema merge. |
| **OQ-6** | MVP search = generated `tsvector` + GIN on `stores`(name/craft/bio) and `products`(title/description/materials) + `pg_trgm` fuzzy on handle/title. Categories via **`categories` + `product_categories` join** (chosen over `text[]`). | Full-text covers relevance; trigram covers typos; a normalized join gives shared taxonomy, parent/child facets, and clean filter integrity for browse. |
| **OQ-7** | `reviews.verified` = **generated column** `order_item_id IS NOT NULL`; `maker_response` = single column; `saves` polymorphic (product\|store); `follows` buyer→maker only; `verifications` links a voice-anchor clip in `videos`; `badges` minted only when a verification resolves (app-enforced, D7). | Verified-purchase is derivable, not separately stored; each of these is the minimal honest representation (no false-claim badges per D7). |

### OQ-2 config ↔ table sync contract (highest risk)

- **Source of truth for selection:** `videos` + `video_profiles`. The engine queries these; it never reads `stores.config`.
- **Source of truth for layout binding:** `stores.config.media.clips[]` and `blocks[].bindings.clipTags`. The renderer reads config; it never queries `video_profiles`.
- **Invariant:** every `config.media.clips[].id` **equals** a `videos.id` owned by the same store. Enforced by the Zod validator (P3) at write time (referential check) — the DB cannot enforce it (ids live inside jsonb).
- **Write path:** persisting a store config and upserting the corresponding `videos`/`video_profiles` rows happen in **one transaction**. A clip removed from config should mark/remove its `videos` row (or leave it orphaned but ineligible) — backend-engineer decides the retention policy; the schema permits either (nullable `store_id`, cascade on store delete).
- **`product_links` are `uuid[]`** with no element FK (Postgres limitation); the validator checks they resolve to real products.

---

## References

- `.claude/memory/DECISIONS.md` — 2026-07-19 D15 (seller brand freedom) + D16 (8 missing features); this ADR implements the Phase-4 table adds those entries name.
- [`docs/01-foundation/KOL-v2-concept-lock.md`](../../01-foundation/KOL-v2-concept-lock.md) — D1–D16 ground truth.
- [`docs/04-features/KOL-feature-tree.md`](../../04-features/KOL-feature-tree.md) — §1A–1D `Data need` = authoritative table list.
- [`docs/03-system-design/store-config.schema.md`](../store-config.schema.md) — the D4 jsonb config contract this model stores.
- Migration plan: [`docs/03-system-design/migrations-plan/`](../migrations-plan/) (groups 01–13).

---

## Implementation Checklist

- [x] Status is set to **Proposed** (not Accepted until QA-Lead review)
- [x] At least **2 real alternatives** listed
- [x] Both **positive and negative consequences** documented
- [ ] Entry added to **`.claude/memory/DECISIONS.md`** (CTO/lead writes — workers do not write DECISIONS.md)
- [ ] **Deciders** notified (QA-Lead review pending)
- [ ] Linked from `ARCHITECTURE.md` / relevant spec (Phase 5)
- [ ] Impacted agents informed (backend-engineer: config↔table contract + column-level RLS gaps)

---

_Last updated: 2026-07-19 | Updated by: database-engineer (`feat/kol-p4-schema`)_
