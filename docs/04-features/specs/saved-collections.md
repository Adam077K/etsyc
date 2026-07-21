# Saved Collections (B17 — proposed)

<!-- CPO page-spec pass (2026-07-21). EXTENDS B13 follow-save; does NOT re-spec follow/save writes or the buyer_signals mirror. The load-bearing argument: a private list of saves is just a tab of the Buyer Profile and does NOT earn a distinct surface. What earns Saved Collections its own routes is the PUBLIC shareable board — a collection becomes an object other people visit, with its own URL, and therefore an acquisition + discovery surface. If public boards are cut from scope, this feature collapses back into a Buyer Profile tab (see Out of Scope + Open Questions). Anti-flattening is the single highest risk in this feature (a board is by nature a grid of saved things) and is enforced by hard-gate ACs mirroring B1 (discovery-feed) and B11 (search) — items render as maker-attributed cards that OPEN the maker's world, never a bare product grid. New tables (`collections`, `collection_items`) are PROPOSED (not in ADR-0001's 31-table plan, which has NEVER BEEN APPLIED) and must be added by database-engineer BEFORE backend — Irreversible tier. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Saved Collections |
| **Feature Slug** | saved-collections |
| **Status** | Draft |
| **Author** | CPO (page-spec pass) |
| **Reviewers** | CPO + CTO + database-engineer + security-engineer |
| **Created** | 2026-07-21 |
| **Last Updated** | 2026-07-21 |
| **Target Sprint** | Phase 6 — Build |

---

## Prioritization

> Fill this section before moving Status to Approved. Used to compare features objectively and prevent gut-feel prioritization.

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 4 | Fewer buyers create + share a public board than tap follow/save (assumed — low confidence; basis "4 seed worlds + first cohort," and boards themselves have NO backing D#). Owner-only viewing skews Reach lower; the multiplier is the shared-board VISITOR (a new inbound). |
| **Impact** | 2 | Medium. As a private list it is low-impact (a Buyer Profile tab could carry it). As a **public shareable board** it becomes a genuine acquisition + discovery surface — a URL other people arrive at (est.). |
| **Confidence** | 55% | Low-medium. Public-board thesis is un-validated (USER-INSIGHTS.md empty); tables are proposed, not locked; the 31-table migration from ADR-0001 has NEVER BEEN APPLIED so we cannot verify the additive migration path against a live DB (assumed — low confidence). |
| **Effort** | 3 person-weeks | Two new tables + RLS (Irreversible), owner CRUD, public read route, visibility toggle, share affordance, empty-state design load (est.). |
| **RICE Score** | (4 × 2 × 0.55) ÷ 3 = **≈ 1.5** | Notably below B13 follow-save (7.5). If the public-board scope is cut, RICE collapses further and this should be a Buyer Profile tab, not a page. |

**MoSCoW Classification:** Should Have (this cycle) — **conditional on the public shareable board.** If public boards are descoped, reclassify as **Won't Have (this cycle)** and fold the private-list into a Buyer Profile tab. Boards themselves have NO backing D# — they come from the founder page-list, not concept-lock; B13 save is the specced parent.

**Why this priority?** A private list of saves is just a tab of Buyer Profile and does not earn its own page. What earns Saved Collections a distinct surface is the **public shareable board**: a URL other people visit, a collection becoming an *object* in the world. That, and only that, justifies routes, tables, and RLS work now.

---

## Overview

Saved Collections lets a signed-in buyer organize the items they saved via B13 into personal **boards** — each board holding products, makers, and videos — that they can title, reorder, and (crucially) flip **public** to get a shareable URL. Owner boards live at `/me/collections` (KOL chrome). A public board lives at `/c/[slug]` (KOL chrome) and can be visited by anyone, signed in or not.

---

## Problem

B13 (`follow-save.md`) captures affinity signals and writes durable `follows` / `saves` rows, but it explicitly leaves the buyer's **organization + sharing** need unmet. The buyer's account "saved area" (B13 UX) is a single flat list per buyer — one bucket, private, tied to the account.

Two problems follow:

1. **Organization.** A buyer building relationships across multiple makers (D16-7, the whole thesis of relationship-not-popularity) has no way to group saves by intent — "wedding gifts," "for the studio," "makers I want to commission next year." Every save lands in one bucket, then decays.
2. **Sharing.** A collection of saved makers and pieces is a natural social object — the buyer *tells someone else* about the makers they discovered. Without a public URL, that word-of-mouth path dead-ends inside the account. The buyer's account "saved area" (B13) is a private list; there is no object anyone else can visit.

The pain, in the buyer's terms: *"I found four makers I love and I want to keep them together and send them to my sister"* (grounded in D16-7 relationship framing and the founder page-list; USER-INSIGHTS.md is empty — no verbatim quotes). Note honestly: unlike B13 (which grounds in D16-7), **boards themselves have no D# anchor** — they come from the founder page-list, not concept-lock (assumed).

> No user quote available — USER-INSIGHTS.md is empty. Do not invent one.

---

## Proposed Solution

A buyer's saves (B13) plus their follows (B13) are the *contents pool*. Saved Collections adds a lightweight layer on top: named **boards** the buyer creates, each holding items chosen from that pool. Boards can be flipped **public**, in which case they are visible at a stable `/c/[slug]` URL to anyone (signed in or not) via the FIXED KOL chrome (D15a).

Each board item, wherever it renders (private `/me/collections` or public `/c/[slug]`), is a **maker-attributed card that opens the maker's world** — never a bare product grid. This is the load-bearing anti-flattening guarantee (see AC "Anti-flattening").

**UX Flow (owner path — creating and sharing):**

1. Signed-in buyer visits `/me/collections` (KOL chrome). If they have no boards, they see the **dominant empty state** (see UX Notes) — a warm invitation to create a first board from their saves and follows.
2. Buyer creates a board — provides a title (rename any time). The board is `visibility='private'` by default.
3. Buyer adds items to the board from their saves/follows pool — products, makers, videos. Buyer can reorder items (drag) and remove them.
4. Buyer toggles the board `public`. A share affordance reveals the stable URL `/c/[slug]` (a non-guessable slug, see Security AC) and a copy-link action.
5. Buyer sends the URL to someone.

**UX Flow (visitor path — arriving at a public board):**

1. A visitor (typically **not** signed in) opens `/c/[slug]` (KOL chrome).
2. The board renders read-only: title, owner display name (from `get_public_profile`, ADR-0001 P2-3), and the maker-attributed item cards.
3. Tapping a maker card opens the maker's world (B3 world-unfold). Tapping a product card lands the visitor on the product page (B6). Tapping a saved video plays the film. Each destination is the real KOL world — not a preview inside the board.
4. Visitor can (optionally) sign up / sign in from the KOL chrome. Their board interaction is CTA into KOL, not the terminus.

---

## User Stories

- As a buyer, I want to group my saves into named boards so that I can organize by intent (a gift, a project, "makers I want to commission").
- As a buyer, I want to make a board public and share its URL so that I can send my curated makers to a friend without asking them to sign in first.
- As a buyer, I want to reorder items in a board so that the story of the collection reads intentionally.
- As a buyer, I want a public visitor to my board to land on the real makers' worlds — not a flat grid of things — so that the board deepens the makers' reach instead of flattening them.
- As a **visitor** (signed-out) to a shared board, I want to explore the makers on film, not a catalog grid, so that the board is a window into a person, not a wishlist screenshot.

---

## Acceptance Criteria

> Given/When/Then. Anti-flattening ACs are load-bearing and mirror the B1 (discovery-feed) + B11 (search) precedents.

**Happy Path — Owner (create / rename / add / reorder / delete)**
- Given a signed-in buyer, when they POST a new collection with a title, then a `collections(owner_id, title, visibility='private', slug)` row is written (RLS: `owner_id = auth.uid()`); a slug is generated server-side and is non-guessable (see "Slug non-enumeration" below).
- Given an owner and an existing board, when they add a saved product, maker, or video, then a `collection_items(collection_id, subject_type, subject_id, position)` row is written; `subject_id` is polymorphic with **no DB FK** (mirrors the B13 `saves.subject_id` pattern per ADR-0001 OQ-2/OQ-6-adjacent); app/Zod validates that `subject_id` resolves to a row the buyer already saved (or a maker they follow).
- Given an owner reordering items, when they drop an item into a new position, then `position` values are updated for the affected rows in one transaction; the new order persists across reload.
- Given an owner deleting a board, when they confirm, then the `collections` row and its `collection_items` rows are removed (`ON DELETE CASCADE`); a public URL to that slug returns 404 within one request cycle (no stale public read).

**Happy Path — Visibility toggle + share**
- Given an owner viewing a `private` board, when they toggle it `public`, then `collections.visibility='public'` is set and the share affordance surfaces the stable URL `/c/[slug]` + a copy-link action.
- Given an owner viewing a `public` board, when they toggle it back `private`, then subsequent visits to `/c/[slug]` return **404 (not 403)** — un-authenticated visitors cannot distinguish "does not exist" from "was made private," which prevents enumeration of ex-public boards.

**Anti-flattening (load-bearing — mirrors B1 + B11)**
- Given a board renders at either `/me/collections/[id]` or `/c/[slug]`, when items lay out, then each item is a **maker-attributed card that opens the maker's world** — every saved product card visibly carries its maker's identity (maker handle + a maker media element) and, on tap, routes into the maker's world (B3) or product page (B6, which lives inside the maker's world). Saved **makers** render as `hero-video` feed-language cards (B1) — makers **on film**, not a static avatar tile.
- Given a board renders, when the layout composes, then it is a **magazine composition, not a uniform equal-cell product grid**. There MUST be an automated layout test (mirroring B1 §"Layout identity" and B11 §"no code path renders a flat product grid") asserting: (a) rendered board cards do not all share identical dimensions; (b) there is **no code path** in the board renderer that emits a uniform product grid. This is the single highest flattening risk in the whole product and the test is a merge blocker.
- Given a board contains only saved videos (edge case), when it renders, then the layout still varies size and uses the `hero-video` feed variant — never a matrix of equal thumbnails.

**Public visitor (signed-out)**
- Given an anonymous visitor navigating to `/c/[slug]` for a `visibility='public'` board, when the page renders, then it returns 200 with the board's title, owner display name (via `get_public_profile(owner_id)` — ADR-0001 P2-3 / NEW-1; **not** an unfiltered public-profiles view), and maker-attributed cards, WITHOUT requiring a session.
- Given the same visitor, when they tap any item, then they land in the real KOL surface (B3 world-unfold / B6 product page) — the board is **not** a walled preview; it is a launching pad into makers' worlds.
- Given the visitor is not signed in, when the board renders, then the KOL chrome shows a sign-in / sign-up CTA (curated chrome, D15a) — the board is an acquisition surface.

**Slug non-enumeration (trust boundary)**
- Given the board slug generator, when a slug is minted, then it is at least 16 chars of URL-safe random (`≥ 96 bits` of entropy; est.) — sequential integers or the raw `collections.id` MUST NOT appear in the URL, so a visitor cannot enumerate `/c/1`, `/c/2`, … to discover private boards.
- Given an anonymous visitor navigating to `/c/[slug]` for a board that is `visibility='private'` (or does not exist), when the page renders, then it returns **404** (indistinguishable from "not found") — never 403 (which would confirm the slug exists but is private).

**RLS trust boundary (new public-read gate)**
- Given RLS on `collections`, when a query runs, then: (a) owner may `SELECT/INSERT/UPDATE/DELETE` their own rows; (b) `anon` and `authenticated` may `SELECT` only rows where `visibility='public'` — this is a **NEW public-read policy** on a table that carries user-authored content, must be reviewed by security-engineer, and is the trust boundary distinct from the mostly-private ADR-0001 model.
- Given RLS on `collection_items`, when a query runs, then read is joined through the parent board's visibility (same public-vs-owner gate); write is owner-only.
- Given any client, when it attempts to write `collection_items` for a `collection_id` it does not own, then the write is rejected at the RLS layer (defence-in-depth: RLS `USING owner_id = auth.uid()` on the parent; write to `collection_items` re-checks the parent's owner).

**Empty state (dominant first-run — must be designed, not stubbed)**
- Given a signed-in buyer who has no boards, when they open `/me/collections`, then a warm empty state renders — copy invites them to create a first board from their saves/follows, previews their most recent 3–6 saves as items ready to drop in, and CTA "Create your first board." **Empty ≠ blank** (mirrors B13). This is the dominant state at launch (no first-run buyer has boards); the design must survive scrutiny.
- Given a signed-in buyer who has boards but the currently open board has no items, when the board page renders, then a within-board empty state invites them to add saves/follows to this specific board.
- Given an anon visitor arriving at a `/c/[slug]` for a board that exists and is public but has zero items, when the page renders, then a warm read-only "the collector hasn't added anything yet" state renders — not a broken layout.

**Loading state**
- Given the boards list is fetching, when the page renders, then a card-skeleton at the board card aspect renders (no layout shift, no spinner) — mirrors B1 / product-page loading discipline.
- Given a board's items are fetching, when the board page renders, then the item cards render as maker-attributed skeletons at the feed-card aspect (still non-uniform sizing) — never a uniform loading grid that would preview the anti-pattern.

**Error state**
- Given the boards write fails (create / rename / add-item / reorder / toggle-visibility / delete), when the optimistic UI has been applied, then it **reverts** with a quiet inline retry — no phantom board, phantom item, or phantom public URL.
- Given `/c/[slug]` fails to resolve (slug malformed, DB error), when the page renders, then a KOL-chrome 404 page routes the visitor to the discovery feed — never a bare stack trace, never a partially-rendered board.

**Success state**
- Given all reads resolve, when the owner is on `/me/collections/[id]`, then the board renders with drag-reorder, add-from-saves affordance, rename, visibility toggle, and (if public) share affordance — all in the FIXED KOL chrome (D15a).

---

## UX / UI Notes

**Surface touched.** Both routes render inside **KOL curated chrome — the FIXED design system** (D15a): `/me/collections` and `/c/[slug]` are KOL's own product surfaces (analogous to the discovery feed and account chrome), NOT inside any single maker's world. Palette, type, motion tokens come from `KOL-design-system.md` (§1). The board **items**, when tapped, transition to the maker's world (which uses the maker's own theme via P4). The chrome/world boundary is clean.

**Key Interactions:**

- **Boards list (`/me/collections`).** Owner sees their boards as bold, cinematic cards (KOL chrome) with title + item-count + a first-3 item preview; the preview thumbnails are themselves maker-attributed (a face on film, not a product tile).
- **Board page (`/me/collections/[id]`).** Header: title (rename inline), visibility toggle (`private ↔ public`), share affordance (only when `public`), delete. Body: a magazine composition (not a grid) of maker-attributed item cards. Drag-reorder with cinematic ease (`--ease-kol`, motion tokens §1.5).
- **Add-item.** From within a board, a picker surfaces the buyer's saves + follows pool (B13) — buyer selects one or many, drops them onto the board. No "browse and save from here" — Saved Collections consumes the B13 pool; it does not create new saves.
- **Visibility toggle.** A single toggle (`private ↔ public`). Turning public reveals the share affordance with the copy-link CTA. Turning back to private hides the URL and immediately breaks any outstanding shared link (returns 404 to future visitors — see AC).
- **Public board (`/c/[slug]`).** Read-only. Title, owner display name (via `get_public_profile`), item cards. The chrome carries a sign-up / sign-in CTA appropriate for an acquisition surface.
- **Item tap.** Always routes into the real KOL surface — maker item → B3 world-unfold; product item → B6 product page (which itself lives inside the maker's world); video item → the film plays. The board never becomes a walled preview.

**Edge Cases (all 4 states — empty is the dominant first-run state):**

- **empty** (DOMINANT — must be designed, not stubbed):
  - Zero boards at `/me/collections` → warm invitation + preview of the buyer's most recent saves/follows as drop-in candidates + CTA "Create your first board." Copy leans on the B13 language ("your saves"), not a generic "no data yet."
  - Boards exist but selected board is empty → within-board invitation to drop saves/follows in.
  - Public board with zero items → visitor-side read-only empty ("the collector hasn't added anything yet") — still KOL-chrome, still non-broken.
- **loading** — card skeletons at the card aspect; no layout shift; no spinner; skeletons intentionally non-uniform (so the loading state doesn't preview the anti-pattern grid).
- **error** — optimistic write revert-on-error with inline retry (mirrors B13); `/c/[slug]` failures land on a KOL-chrome 404 with a route to the discovery feed.
- **success** — full render; interactive owner controls (if owner) or read-only maker-attributed cards (if visitor).

**A saved MAKER renders on film.** A `subject_type='maker'` item MUST render as the B1 `hero-video` feed-card language — the maker moving, on film — not a static avatar chip. This is the specific rule that makes a board a window into people, not a wishlist screenshot.

---

## Technical Requirements

> **Risk tier: Irreversible.** Two new tables + a NEW public-read RLS trust boundary + a slug non-enumeration invariant. Database-engineer sequences before backend-engineer (per ADR-0001 build order; per the Phase-4 CTO note). Note explicitly: the ADR-0001 31-table migration plan **has NEVER BEEN APPLIED** — see "Database Changes" below for the sequencing implication.

### Backend Changes

- CRUD server actions (all RLS-scoped to `auth.uid()` as owner):
  - `create_collection(title)` → returns `{id, slug}`; slug generated server-side with ≥ 96 bits URL-safe random.
  - `rename_collection(id, title)` — owner only.
  - `set_collection_visibility(id, visibility)` — `'private'|'public'`; on flip to private, previously-shared `/c/[slug]` starts returning 404 immediately (no stale caches).
  - `delete_collection(id)` — cascades items.
  - `add_collection_item(collection_id, subject_type, subject_id)` — Zod validates `subject_type ∈ {product|maker|video}` and (app-side, no DB FK) that `subject_id` resolves to a row the buyer has already saved (subject_type=product|maker|store) or a maker they follow. Idempotent via unique `(collection_id, subject_type, subject_id)`.
  - `remove_collection_item(collection_id, item_id)` — owner only.
  - `reorder_collection_items(collection_id, ordered_ids[])` — writes new `position` values in one transaction.
- Public read for `/c/[slug]`: a plain PostgREST read against `collections` filtered by slug + `visibility='public'`; the NEW anon SELECT policy makes it index-served. **Do not** introduce a definer function that could leak private rows.
- Rate-limit `create_collection` and `set_collection_visibility='public'` (app-layer; abuse prevention on a public-URL-minting endpoint).

### Frontend Changes

- `/me/collections` route — Server Component listing the buyer's boards (KOL chrome, D15a).
- `/me/collections/[id]` route — owner board editor (title, visibility, share, item add/remove/reorder, delete).
- `/c/[slug]` route — public read-only board (KOL chrome, D15a); accessible anonymously.
- All-4-states rigor per UX Notes; empty is the dominant first-run state and must be designed, not stubbed.
- Layout composer for board items MUST be non-uniform (magazine composition). Includes the automated layout test asserting no uniform-grid render path (mirrors B1's test + B11's guard).
- Optimistic UI on rename / add-item / reorder / visibility toggle with revert-on-error (mirrors B13).

### Database Changes

**Data need (Irreversible tier — DB before backend; two NEW proposed tables).**

> **IMPORTANT.** The ADR-0001 31-table migration plan **has NEVER BEEN APPLIED** to Supabase. Do not treat the schema as "locked in the DB" — treat it as "locked on paper." database-engineer must therefore either (a) add these two new tables and their RLS to the existing groups 01–13 of the migration plan **before the plan is applied to staging** (preferred), OR (b) author them as an additive group 14 that follows immediately. Either path requires a fresh database-engineer pass; the tables below are PROPOSED, not locked.

| Object | Use | Status |
|---|---|---|
| `collections(id uuid pk, owner_id uuid → profiles.id, title text, visibility text CHECK IN ('private','public') default 'private', slug text UNIQUE, created_at, updated_at)` | Owner's named boards | **PROPOSED** (not in ADR-0001) |
| `collection_items(id uuid pk, collection_id uuid → collections.id ON DELETE CASCADE, subject_type text CHECK IN ('product','maker','video'), subject_id uuid, position integer, created_at, UNIQUE(collection_id, subject_type, subject_id))` | Polymorphic ref; ordered | **PROPOSED** (not in ADR-0001) |

- **Polymorphic `subject_id` has NO DB FK** (Postgres cannot polymorphically FK; mirrors the B13 `saves` pattern per ADR-0001). App/Zod validation is load-bearing — the DB will not backstop.
- **Indexes.** `collections(owner_id)`, `collections(slug)` UNIQUE, `collection_items(collection_id, position)`, `collection_items(subject_type, subject_id)`.
- **RLS on `collections`** — NEW public-read trust boundary:
  - `collections_owner_all`: `USING owner_id = auth.uid()` for `SELECT/INSERT/UPDATE/DELETE`.
  - `collections_public_read`: `USING visibility = 'public'` for `SELECT` to `anon` and `authenticated`. **This is a new anon-SELECT gate on a table carrying user-authored content — security-engineer MUST review.**
- **RLS on `collection_items`** — owner-only writes; SELECT gated by joining `collections` (owner OR public).
- **Slug generator.** Server-side, ≥ 96 bits of URL-safe entropy (base32 or base64url of `gen_random_bytes(12)`). The slug MUST NOT be sequential and MUST NOT contain the row `id`; enumeration of `/c/1`, `/c/2`, … MUST be structurally impossible.

### External Services

- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | `/me/collections` board list P95 < 300ms; `/c/[slug]` public read P95 < 250ms; drag-reorder feels instant (optimistic). | Load test; Playwright drag benchmark. |
| **Security** | (a) Slug non-enumerable (≥ 96 bits entropy); (b) private / non-existent slugs return **404, not 403**; (c) NEW `anon` SELECT on `collections` gated strictly by `visibility='public'`; (d) polymorphic `subject_id` app-validated. | RLS test matrix (anon vs owner vs another buyer); enumeration test (sequential-slug crawler must not find any private board); security-engineer review. |
| **Scalability** | Correct for a buyer with 100 boards × 200 items; correct for a public board pulled by a moderately viral link (assumed target: 10k views/day, low confidence). | Seed 100 × 200; k6 on `/c/[slug]`. |
| **Accessibility** | Drag-reorder is keyboard-operable (arrow-based move up/down); visibility toggle has a clear pressed-state ARIA; empty-state copy is descriptive; `/c/[slug]` is landmark-labeled for signed-out visitors. | axe-core + keyboard walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B13 Follow & Save (contents pool) | Feature | Draft (this batch) | H — no saves = no items to add. |
| P1 Auth (owner identity) | Feature (spine) | Not Started | H |
| P2 `get_public_profile` (owner display name on public boards) | Data/Function (ADR-0001 P2-3 / NEW-1) | Not Started (plan un-applied) | M — could fall back to owner handle |
| ADR-0001 31-table migration plan | Migration | **Un-applied** | H — the two new tables must land in the same first apply. |
| KOL design system (KOL chrome, D15a) | Design | Locked | L |
| B1 discovery-feed card language (reused for maker items) | Feature | Draft | M |
| B3 world-unfold (item-tap destination) | Feature | Draft | M |
| B6 product page (item-tap destination) | Feature | Draft | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P6+ Relationship-Based Ranking | ai-engineer | No | Board-add MAY emit a `save`-weight signal per Open Question #2; if yes, feeds P6+. |
| B11 Search & browse | frontend-engineer | No | Public board slugs could later be indexed; out of scope now. |

---

## Out of Scope

- **The follow/save write path itself** — owned by B13. This spec consumes the B13 pool; it does not re-spec `follows` / `saves` writes or the `buyer_signals` mirror (see `follow-save.md` §Technical Requirements).
- **Board-level collaboration** — multi-owner boards, invite-a-friend-to-edit, comments on boards, likes on boards. Post-MVP.
- **Following a board** (a buyer subscribing to another buyer's public board and being notified when it updates) — Post-MVP. Would meaningfully extend the trust boundary and warrants its own spec.
- **Global "trending boards" or a public boards directory** — explicitly rejected. Mirrors the D16-7 relationship-not-popularity stance for follow/save: KOL does not surface global popularity.
- **Search over public boards** — deferred to B11 or post-MVP.
- **Publish-to-social / OG-image generation for a board's `/c/[slug]`** — nice-to-have; not blocking.
- **If the public shareable board is descoped**, this feature should collapse back into a **Buyer Profile tab** and this spec should be closed as "Won't Have (this cycle)" — see Prioritization + Open Questions #1.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Boards flatten makers into a grid (the single highest flattening risk in the whole product)** | H | H | Load-bearing anti-flattening ACs mirror B1 + B11; automated layout test forbids any uniform-grid render path in the board renderer (merge blocker); maker items render as `hero-video` feed cards (on film), never avatar tiles. |
| Public-read RLS accidentally leaks private boards | L | H | Explicit `visibility='public'` predicate on the anon SELECT policy; security-engineer review; RLS test matrix asserts anon cannot read a private board's row. |
| Slug enumeration reveals private / ex-public boards | M | H | ≥ 96-bit URL-safe random slug; **404 (not 403)** for private / missing; sequential enumeration test on staging. |
| ADR-0001 migration not applied → these tables land against an incomplete schema | H | M | database-engineer folds tables into the existing groups (or a new group 14) **before** the first staging apply; QA-Lead gates on staging validation (ADR-0001 §Pre-apply staging validation). |
| Board-add mistaken for a global-popularity signal | L | H | Out-of-Scope + AC forbid a "trending boards" surface; if a signal is emitted (OQ #2), it is per-buyer, mirroring B13. |
| Feature ships without the public board and duplicates Buyer Profile | M | M | Prioritization + Out of Scope prescribe collapsing back to a Profile tab in that case; do not build the routes/tables without public-board scope. |

---

## Success Metrics

_A private-list version's metrics would be indistinguishable from "did people scroll their saved area." The metrics that make this feature earn its distinct surface are the **public-board** metrics._

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Signed-in buyers who create ≥ 1 board | 0% | ≥ 20% (assumed — low confidence; no D# anchor) | 30 days post-launch |
| Boards flipped `public` (of created boards) | 0% | ≥ 25% (est. — validates the shareable thesis) | 30 days |
| Sessions arriving from a `/c/[slug]` referral (new inbound path) | 0 | Non-zero, tracked (est.) | ongoing |
| Anonymous-visitor sign-up conversion from `/c/[slug]` | 0% | ≥ 3% (assumed — low confidence) | 30 days |
| Uniform-grid regressions in the board renderer | N/A | 0 (layout test blocks merge) | ongoing |
| Enumeration of private boards from staging crawler | N/A | 0 findings | pre-launch + ongoing |

---

## Rollout Plan

> Rollback plan mandatory here — this is Irreversible tier (new tables + new public-read RLS trust boundary).

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | 4 seed accounts | All 4 states pass; anti-flattening layout test green; RLS test matrix green; slug enumeration crawler finds 0 private boards; empty-state design approved | 2–3 days |
| **Private Beta** | First cohort | ≥ 1 board flipped public per participant; qualitative: "the shared URL felt like a real thing to send" | 1 week |
| **Gradual Rollout** | 10% → 50% → 100% | No P0; anon SELECT policy healthy; no enumeration incidents; drag-reorder P95 healthy | 2 weeks |
| **Full Launch** | All signed-in buyers | Passed | — |

**Feature Flag**

- Behind a feature flag? **Yes** — `saved-collections-enabled`.
- Two sub-flags recommended: `saved-collections-owner-enabled` (turns on `/me/collections`) and `saved-collections-public-enabled` (turns on `/c/[slug]` + the public-read RLS policy). This lets us ship the owner-only surface if public-read review finds an issue — though per Prioritization, an owner-only ship duplicates Buyer Profile and should not go GA alone.
- Flag owner: CTO.

**Rollback Plan**

- **Rollback trigger:** (a) anon SELECT leaks a `private` row in staging validation or prod monitoring; (b) enumeration of `/c/[slug]` returns a private board; (c) anti-flattening regression (uniform-grid render path); (d) an abuse spike on `create_collection` / `set_collection_visibility='public'`.
- **Rollback decision maker:** CTO (with security-engineer for RLS-triggered rollbacks).
- **Rollback steps:** disable `saved-collections-public-enabled` first (kills the public-read path); if the cause is not public-read, disable `saved-collections-owner-enabled` next. `collections` / `collection_items` are additive tables — no data loss; existing rows persist for re-enable.
- **Data impact:** none on rollback; tables are additive and untouched by disable.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Is the public shareable board (`/c/[slug]`) in scope for the MVP?** If yes, this feature is a page. If no, it collapses back into a Buyer Profile tab and should be closed as Won't Have (this cycle). This is the single load-bearing scope question. | CPO + Founder | pre-build |
| 2 | Does adding an item to a board emit a `buyer_signals` event (e.g., mirroring the B13 `save` weight of 1.5), or is board-add ranking-neutral (a save is already the signal)? | CPO + ai-engineer + CTO | pre-build |
| 3 | Can a buyer add an item to a board **that they haven't already saved** (i.e., is board-add a save shortcut too), or must the item pre-exist in `saves` / `follows`? Simplest: pre-exist. Founder call. | CPO + Founder | pre-build |
| 4 | Slug format — base32 vs base64url vs a chosen readable-slug ("wedding-gifts-x8f2"). Readable slugs have brand appeal but must still be non-enumerable (append entropy). | CPO + Design-Lead | pre-build |
| 5 | Owner display name on `/c/[slug]` — the `get_public_profile` function (ADR-0001 P2-3 / NEW-1) exists on paper; the migration has not been applied. Confirm it will be applied in the same first apply as these tables. | database-engineer + CTO | pre-build |
| 6 | Does a public board expose the owner's **other public boards** (a mini-profile), or only the one board's items? Simplest: only this board. | CPO + Design-Lead | pre-build |
| 7 | Rate-limit thresholds for `create_collection` and `set_collection_visibility='public'` (abuse prevention on a public-URL-minting endpoint). | security-engineer + CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial draft (proposed B17; page-spec pass) | CPO (page-spec pass) |

---

_Last updated: 2026-07-21 | Updated by: CPO (page-spec pass)_
