# Maker Community (proposed B15)

<!-- Page-spec pass · 2026-07-21 · CPO. Proposed feature — NOT in concept-lock, NOT in feature-tree §1B, NOT in ADR-0001. Requires founder decision (proposed D17) before build. Renders inside the maker's world (D15b). -->

> **⚠️ ESCALATION — READ BEFORE ANY BUILD WORK. This feature has NO backing locked decision.**
>
> The feature-tree traceability rule (`KOL-feature-tree.md` §preamble) is unambiguous: *"every feature cites the D# it implements. If a build agent finds work with no D#, it is out of scope — escalate, do not build."* Maker Community cites **no D#**. It came from a founder page list ("Pages To Include"), not from `KOL-v2-concept-lock.md` and not from the D16 addendum. There is no matching entry in `.claude/memory/DECISIONS.md`.
>
> **What this feature changes about KOL, structurally.** The locked concept is a **one-to-many** social shape: a maker broadcasts (film, world, thank-you, tap-to-hear) and buyers receive; every private conversation goes through P15 (`buyer↔maker` counterparty threads, `buyer_id <> maker_id` enforced by `threads_guard`); every public buyer utterance goes through B12 (public product Q&A). There is **nowhere in the locked model where buyers talk to each other.** A community turns KOL into a **many-to-many** graph — buyers post, comment on each other, and see each other's posts under a maker's roof. That is a genuinely new social shape, not a UI enhancement.
>
> **This is the single largest genuinely-new bet on the page list.** Everything else on the "Pages To Include" list is a re-surfacing of already-locked features. This one is not.
>
> **Required decision: propose D17 — "KOL adopts a buyer↔buyer social layer under each maker."** Founder must lock or reject before build. Until D17 lands: **Status: Draft. MoSCoW: Could Have. Target Sprint: Phase 6 — Build (BLOCKED pending D17).** Do not open a Linear ticket to build. Do not spawn database-engineer. Do not begin any implementation.

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Maker Community |
| **Feature Slug** | maker-community |
| **Status** | Draft |
| **Author** | CPO (page-spec pass) |
| **Reviewers** | Founder (D17 decision) → CPO + CTO → QA-Lead |
| **Created** | 2026-07-21 |
| **Last Updated** | 2026-07-21 |
| **Target Sprint** | Phase 6 — Build (**BLOCKED pending D17**) |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 3 | Community is per-maker, per-world; MVP surface is 4 seed worlds (D12). Even at full launch, only followed makers with active communities get visited (assumed — low confidence). Compare to B7 checkout (every buyer) or B6 product page (every decision) at Reach 8. |
| **Impact** | 2 | Medium. Communities *could* deepen relationship (KOL's thesis), but they can also flatten it into a generic forum — undermining the "meet the human, one-to-one" positioning. Impact is genuinely two-sided (est.). |
| **Confidence** | 30% | **Low.** No locked decision, no user research, no USER-INSIGHTS quote, no equivalent shipped surface to reference. Cold-start dynamics at 4 worlds unknown. Moderation cost unknown. (est. — low confidence). |
| **Effort** | 6 person-weeks | 4 new tables + migration (Irreversible) + 4-state community feed + composer + comment thread + membership gate + a NEW moderation surface that does not exist anywhere else in MVP (est. — ask CTO). |
| **RICE Score** | (3 × 2 × 0.30) ÷ 6 = **0.3** | For comparison: Follow & Save = 7.5, Product Page ≫ 1. |

**MoSCoW Classification:** **Could Have** (not Must, not Should). Explicitly deprioritized behind every base + D16 MVP feature.

**Why this priority?** Low RICE (0.3), no locked D#, unknown user demand, cold-start risk at 4 seed worlds, and a required moderation subsystem that would need its own spec + own tables + own trust boundary. Every locked MVP feature ranks ahead of it. The honest position: **do not build in Phase 6 unless the founder locks D17 and explicitly accepts the moderation + cold-start risks below.**

---

## Overview

Maker Community is a proposed public or private space centered on an individual maker — a page at `/m/[maker]/community` inside that maker's world (their theme, per D15b), where buyers can post updates, join discussions, respond to the maker's announcements, and access exclusive releases. It is distinct from **P15** (private 1:1 buyer↔maker messaging, `buyer_id <> maker_id` counterparty threads) and from **B12** (public product-scoped Q&A). Community posts are a new artifact class: buyer-authored, maker-visible, potentially buyer-visible-to-each-other. It presupposes a locked founder decision (proposed D17) that KOL is willing to be a many-to-many social layer, and a moderation subsystem that does not yet exist.

---

## Problem

There is no locked user problem this feature solves. That is not a rhetorical framing — it is a literal statement: `USER-INSIGHTS.md` contains no quote about wanting to talk to other buyers of the same maker, the concept-lock does not name it, D16 does not name it, and the feature-tree screen inventory does not name it. The founder page list is the only source.

*(No user quote — none exists in `USER-INSIGHTS.md`. Do not invent one.)*

The pain that *could* motivate it, in a buyer's own terms if we asked: "I love this maker; I want to know when she drops a new piece, hear what she's making, and — maybe — talk to other people who love her work." That last clause is the load-bearing one, and the honest thing to say is: **we don't know whether buyers want it, whether makers want it, or whether it strengthens or dilutes the one-to-one relationship the whole product is built to protect.** D17 is where that gets decided.

There is a real cost to *ignoring* the question. Buyers who fall in love with a maker's world today have three ways to keep the relationship: **follow** (B13), **save** (B13), and **DM** (P15). None of those is a room the maker walks into and speaks to everyone. If the founder believes the relationship needs that room, a community is a plausible shape. If the founder believes the relationship is protected by staying one-to-one, a community *breaks* it — turning KOL into "yet another creator platform" with feed-and-comments dynamics. **This spec is the artifact that forces that call.**

---

## Proposed Solution

*(Contingent on D17 locking "yes, KOL adopts a buyer↔buyer social layer under each maker.")*

A maker's community page renders at `/m/[maker]/community`, inside the maker's world (their theme — D15b, per-shop custom design system derived by the AI, NOT KOL chrome). Buyers who follow the maker (B13) are, by default, **members** of the community (the follow acts as the natural membership signal — the load-bearing reuse). The maker sees their following as a member list; buyers see either the maker's posts only (public/broadcast community) or a shared feed (private/discussion community), depending on the community's mode.

**UX Flow:**

1. From a maker's world (B3/B4), the buyer clicks a `contact-cta` variant or a world-nav item pointing at `/m/[maker]/community` (the world's theme, not KOL chrome).
2. The community page renders one of two modes (maker-chosen at community creation): **broadcast** (public — anyone signed-in can read maker posts and comment; only the maker posts top-level; buyer↔buyer conversation limited to comment threads under maker posts) or **private** (membership-gated — only the maker's followers see posts; membership derived from B13 `follows`).
3. The maker posts an update — text, media, or a product-scoped announcement — writing to a proposed `community_posts` row.
4. Members read the post and comment (proposed `post_comments`). Comment threads carry the buyer↔buyer conversation, one thread per post.
5. Exclusive releases: the maker posts a link to a product where the community sees it before the world does (marketed as the point of the community; a real value driver **only if D17 says the relationship needs a room**).
6. Result: a persistent room, per maker, under the maker's roof, that buyers can revisit — with the moderation, cold-start, and trust-boundary costs enumerated in Risk Assessment.

---

## User Stories

*(Every story below is contingent on D17. Each is a hypothesis, not a validated need. Marked accordingly.)*

- **(hypothesis)** As a **buyer** who followed a maker, I want a place to see her updates and (in private communities) talk to other buyers who love her work, so that the relationship goes beyond a one-time purchase.
- **(hypothesis)** As a **maker**, I want a room where I can announce a new drop or share a process update to the buyers who have already declared they care, so that I stop shouting into the feed and start speaking to my people.
- **(hypothesis)** As a **maker**, I want to choose whether the room is broadcast or discussion, so that my community's shape reflects how I actually want to relate to buyers.
- As **KOL**, I want membership to reuse B13 follows so the community does not invent a second, competing membership graph.
- As **KOL**, I want private community posts kept strictly separate from P15 (private 1:1) and B12 (public product Q&A), so the three social surfaces do not conflate.

---

## Acceptance Criteria

*(Every criterion below is contingent on D17. Written as if D17 = yes; do not implement without the founder lock.)*

**Happy Path — post + read**
- Given the maker of a community, when they post text or media, then a `community_posts(community_id, author_id, kind, body, media_ids[])` row is written; the post appears at the top of the community feed for eligible readers.
- Given a member of a private community, when they open `/m/[maker]/community`, then they see the maker's posts and any comment threads they are allowed to read (membership-gated via `community_members`).
- Given a signed-in buyer viewing a broadcast community, when they read a maker post, then they can add a `post_comments(post_id, author_id, body, media_id)` row visible to the maker and other readers of that post.

**Membership derivation (B13 reuse)**
- Given a buyer who has followed the maker (`follows(buyer_id, maker_id)`), when the community mode is `private`, then their `community_members` row is auto-created on first entry (follow = the natural membership signal — no separate join flow).
- Given a buyer who has NOT followed the maker, when the community mode is `private`, then reads are blocked (RLS via membership) and the surface prompts them to follow first.

**Privacy separation (three distinct social surfaces)**
- Given a private community post, when B12 renders public product Q&A, then it does NOT surface the community post (community posts are their own table, separate from `questions`/`answers` — following OQ-5's pattern for private/public separation).
- Given a P15 private 1:1 thread between buyer and maker, when the community renders, then it does NOT surface the thread (P15 is `buyer_id <> maker_id` counterparty-only; the community is many-to-many under the maker; the two never share a table).

**Moderation (missing subsystem — see Risk Assessment)**
- Given a post or comment that violates policy, when a reader reports it, then the report is recorded and the maker (or KOL) can remove the row. **This AC requires a moderation subsystem that does not exist in the MVP; building this feature ships a first-time trust-and-safety surface.**

**Route guard + mode**
- Given `/m/[maker]/community` for a maker who has no community configured, when hit, then the page 404s cleanly into the maker's world (no fabricated empty room). A community exists only if the maker opts in.
- Given the community mode is `broadcast`, when a non-maker buyer attempts a top-level post, then the write is rejected (buyers can only comment under maker posts in broadcast mode; RLS-enforced).

**Empty State**
- Given a community with zero posts (freshly created), when a member visits, then it shows a warm "This community is quiet — [maker] hasn't posted yet" state with a link back to the world — **empty ≠ blank; empty ≠ pretending activity exists**. **See cold-start risk in Risk Assessment: 3 of 4 seed worlds would ship with a persistently empty community.**

**Loading State**
- Given the community page is loading, when it renders, then a post-list skeleton at editorial rhythm shows (never a bare spinner), and the world's persistent hero video (if arriving from `WORLD_BROWSE`) keeps playing per the state machine.

**Error State**
- Given a post fetch fails, when the community renders, then cached posts render if available; otherwise a quiet inline "Community is taking a moment" + retry — the world around it stays usable.

**Success**
- Given a member with posts to read, when the page renders, then posts + comment counts + membership state (member/not-member) all resolve, the maker's theme applies (D15b — NOT KOL chrome), and the film always wins (community chrome must not pull focus from any persistent hero video).

---

## UX / UI Notes

Surface: **inside the maker's world** — this page uses the maker's derived custom design system (D15b, per-shop tokens/theme), not KOL curated chrome. The film-always-wins rule (block-catalog cross-cutting) holds: a hero video, if it followed the buyer into the community, keeps playing; community chrome does not pull focus.

**Key Interactions:**

- Composer (maker or, in broadcast mode, comment-only for buyers). Multi-kind: text, media (reusing `media`), product-scoped announcement (references `products.id`).
- Post feed: chronological (recency), one post per row, comment count + latest commenter chip.
- Comment thread: expandable per post; one level deep (no nested reply trees in v1 — nesting is a moderation cost multiplier we cannot afford here).
- Member badge on posts/comments: maker chip vs. buyer chip (visual distinction — the maker's voice is always the primary voice).
- Follow prompt on private-community 403: the community is the payoff for the follow (reuses B13 rather than a duplicate join CTA).

**Edge Cases:**

- **empty** — see AC above; the cold-start honest state, not fabricated activity. Never seed fake posts (concept-lock guardrail: *"Trust must be honest. No claim we can't back."*).
- **loading** — skeleton at editorial rhythm; no spinner.
- **error** — cached posts render; inline retry; world stays usable.
- **success** — full feed + comments + moderation surface (see Risk).
- Reduced-motion honored; keyboard-navigable composer + comment thread.
- Reader signed out on a private community → routed to sign-in (P1) then to follow prompt (B13) then to community.

---

## Technical Requirements

> **Risk tier: Irreversible.** Reason: new tables + migration + a new trust boundary (membership-gated reads on `community_posts`/`post_comments`), and community posts are a new user-content surface with no prior moderation surface. Per CLAUDE.md QA-tier ladder, DB migration + agent-definition-level trust surface = Irreversible; requires Full path + 2-of-3 multi-judge + Founder sign-off.
>
> **STACKING ON AN UNAPPLIED MIGRATION.** ADR-0001's 31-table migration is `Status: Proposed` and **has never been applied** (see ADR-0001 §Pre-apply staging validation: *"This bundle was authored and reviewed without execution … NON-APPLIED by mandate"*). Any migration proposed here would stack on top of that unapplied migration — which means the founder would be applying **two** never-run migrations in sequence, one of which introduces four brand-new tables and a new trust boundary. Escalate: does the founder want to run ADR-0001 first, then run this second, with staging validation between? Or roll them into one? **This choice is a founder decision, not a CTO decision.**

### Backend Changes

- New server actions to create a community (maker-only), post to it (maker or comment-author per mode), read the community feed (membership-gated for private), moderate a post/comment (maker + KOL, via SECURITY DEFINER RPCs on the ADR-0001 pattern).
- A **membership-gated read RLS policy** on `community_posts` and `post_comments` — the community's read boundary is (a) any signed-in reader for `mode='broadcast'` communities, (b) an active `community_members` row for `mode='private'`. This is a new trust boundary; RLS is the only enforcement (per ADR-0001 §Security hardening). Every read path must be tested against it.
- Reuses B13 `follows` as the membership source signal (on first entry to a private community by a follower, an `INSERT ON CONFLICT DO NOTHING` upserts a `community_members` row via a SECURITY DEFINER RPC — clients do not write `community_members` directly).
- **Moderation surface: NEW — does not exist in MVP.** This spec assumes at least a "hide row" endpoint + a maker-visible report list. A full moderation subsystem (report queue, escalation, KOL-side review) is a separate spec that this feature would need before ship.

### Frontend Changes

- New route `/m/[maker]/community` rendered inside the maker's world (D15b theme, per-shop tokens; NOT KOL chrome).
- New community-feed block (proposed; not one of the 11 primitives in `KOL-block-catalog.md`) — 4 states required. **Extending the block catalog is itself a Design-Lead + CPO decision** (the catalog is a locked Phase-3 deliverable); the honest option is a bespoke page-level composition rather than a new block, so the 11-block anti-slop guarantee stays intact for stores.
- Composer (maker) + comment composer (member/reader per mode).
- Member badge + follow prompt for non-members on private communities.
- All 4 states.

### Database Changes

**Data need — PROPOSED, NOT LOCKED. Requires database-engineer + a new migration at Irreversible risk tier. All tables below are new; NONE exists in ADR-0001. Founder must lock D17 AND accept the migration path before database-engineer is spawned.**

| Object | Purpose | Status |
|---|---|---|
| `communities(id, maker_id, store_id, mode community_mode, name, description, created_at)` where `community_mode` is a new enum `('broadcast'|'private')` | Per-maker community record | **PROPOSED — not in ADR-0001** |
| `community_members(community_id, buyer_id, joined_at, role member_role)` with unique `(community_id, buyer_id)` and `member_role` = `('member'|'moderator')` | Membership graph derived from B13 follows on first entry to private community | **PROPOSED — not in ADR-0001** |
| `community_posts(id, community_id, author_id, kind post_kind, body, media_ids uuid[], product_id, hidden_at, created_at)` where `post_kind` = `('text'|'media'|'product-announcement')` | Community-scoped posts | **PROPOSED — not in ADR-0001** |
| `post_comments(id, post_id, author_id, body, media_id, hidden_at, created_at)` — single-level (no nested reply trees) | Comment threads under posts | **PROPOSED — not in ADR-0001** |

**RLS — new trust boundary:**

- `communities` — public read (community name/description/mode discoverable); insert/update maker-only via RPC (SECURITY DEFINER, ADR-0001 pattern).
- `community_members` — read own row + read same-community rows only for members; insert via SECURITY DEFINER RPC that verifies a `follows` row exists (the membership derivation).
- `community_posts` — read policy = `mode='broadcast'` (any authed) OR `mode='private'` AND `EXISTS (community_members where community_id = posts.community_id AND buyer_id = auth.uid())`. Write policy = maker-only in `broadcast`; maker + member in `private` per community rules. **This is the new read boundary.**
- `post_comments` — same read policy as parent post; write policy = any reader of the post (broadcast comments open to any authed; private comments membership-gated).

**Extends** the existing 31-table model to **35 tables**. Adds 3 new enums (`community_mode`, `post_kind`, `member_role`). No changes to any existing ADR-0001 table.

### External Services

- None new for the core feature. If moderation is elevated to include KOL-side human review, an internal moderation tool (not a third party) would be needed — that is a separate spec.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Community feed initial load < 500ms P95 for a community with 100 posts; comment expansion < 200ms. | Load-test with a seeded 100-post community. |
| **Security** | Membership-gated RLS is the only read boundary for private communities — verified end-to-end (anon key + non-member JWT + member JWT); community posts never leak into B12 public Q&A or P15 private DMs; `community_members` insert is service-role/RPC only. | RLS test suite mirroring ADR-0001 §Pre-apply staging validation §3–§7. |
| **Trust & Safety (new)** | Every post + comment can be hidden by the maker within one action; KOL retains a service-role override. This is a **new subsystem in KOL** — first user-generated content surface with buyer↔buyer interaction. | Moderation walkthrough + report/hide integration test. |
| **Accessibility** | Composer + feed keyboard-navigable; comment threads screen-reader legible; media posts have text alternatives. | axe-core + screen-reader walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| **D17 founder decision** (proposed) — locks whether KOL adopts a buyer↔buyer social layer at all | Decision | **Not made** | **H — blocks entire feature** |
| ADR-0001 31-table migration applied to production | Data (Irreversible) | **Never applied** (see ADR-0001 §Pre-apply staging validation) | **H — this spec stacks on it** |
| A new migration adding `communities`, `community_members`, `community_posts`, `post_comments` + 3 enums + membership RPC + read-policy RLS | Data (Irreversible) | Not written | H |
| B13 Follow & Save (membership signal) | Feature | Draft (this batch) | H |
| A **moderation subsystem** (report queue, hide, KOL override) — **does not currently exist anywhere in MVP** | Subsystem | **Not designed** | **H — no moderation surface exists to reuse** |
| P1 Auth (buyer + maker identities) | Feature (W1 spine) | Not Started | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| None locked | — | — | The feature is a leaf; nothing in the locked model consumes it. |

---

## Out of Scope

Explicitly excluded from this spec (some are also excluded from MVP entirely):

- **P15 (private 1:1 buyer↔maker messaging)** — a *separate* subsystem (`threads`/`messages`/`commission_drafts`, counterparty `buyer_id <> maker_id` enforced by `threads_guard`). Community is many-to-many; P15 is counterparty-only; they never share a table.
- **B12 (public product Q&A)** — a *separate* subsystem (`questions`/`answers`, product-scoped, publicly readable, OQ-5). Community posts are community-scoped, membership-gated (for private), and are a distinct artifact class.
- **B13 (Follow & Save)** — this spec *reuses* follows as membership signal but does not re-spec them; see `follow-save.md`.
- Nested comment reply trees — single-level comments only in v1 (moderation cost multiplier).
- Global feed across all communities the buyer belongs to — per-maker only in v1.
- Notifications on new maker posts — needs a notifications subsystem that also does not exist; post-MVP.
- Reactions (like/heart/etc.) — post-MVP.
- Community-scoped search — post-MVP.
- A full moderation subsystem (report queue, escalation, KOL human review) — must be its own spec; this feature ships a minimal hide-row surface and no more.
- KOL-owned brand community (a "KOL Community" separate from any maker) — not proposed.
- Extending the block-catalog with a new `community-feed` block — either avoid it (bespoke page composition) or route through Design-Lead + CPO first (the catalog is Phase-3 locked).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **No D# — feature is out of scope by traceability rule** | **H** | **H** | Escalate to founder; propose D17. Do not build until locked. This is the primary blocker. |
| **Cold-start at 4 seed worlds** — 3 of 4 shipped worlds would have an empty community with a single founder (Adam / Shaian / Thea / Megan) as sole poster + zero comments. An empty community is *worse than no community* — it signals dead product. | **H** | **H** | Either (a) ship the feature disabled for teammate worlds at launch, (b) require ≥ N followers before the community surface appears, or (c) do not build until real followers exist (post-MVP). **Recommend option (c).** |
| **Moderation is a subsystem that does not exist in MVP.** No report queue, no hide UI, no KOL-side review tool exists anywhere in the locked feature set. First buyer↔buyer post = first moderation liability. | **H** | **H** | Do not build community without a companion moderation spec + Trust & Safety policy. Trust boundary + T&S = separate CPO spec + founder review before build. |
| **Stacking on an unapplied migration** — ADR-0001's 31 tables are Proposed / never applied. This adds 4 more, plus 3 enums + RPCs + trust-boundary RLS, on top. | H | H | Founder must decide: apply ADR-0001 first (staging validation) → apply this second, or roll both together. **Not a CTO decision.** |
| **Social-shape change: 1-to-many → many-to-many** breaks a locked positioning ("meet the human, one-to-one"). | M | H | D17 must explicitly accept this shape change. If the founder wants to preserve one-to-one positioning, the feature is *rejected*, not deferred. |
| **Privacy leak — community posts surfacing in B12 or P15** (three social surfaces conflated) | L | H | SEPARATE tables per OQ-5 pattern; participants-only RLS test asserts community posts never appear in `questions`/`answers` or `messages`. |
| **Membership derivation edge cases** — a buyer who unfollows a maker retains a `community_members` row and can still read posts | M | M | On unfollow, either delete the `community_members` row (loses history) or gate reads on live `follows` at query time (preferred). Owner: CTO. |
| **`community_members` write path abuse** (client writes membership directly to enter a private community) | L | H | Service-role/RPC only insert; RPC verifies `follows` row exists (mirrors ADR-0001 §P2-4 pattern). |
| **Extending the block-catalog without going through Design-Lead** breaks the anti-slop guarantee for stores | M | M | Compose community feed at the page level (bespoke), not as a new block. Or route the new block through Design-Lead first. |
| **RLS sprawl** — 4 more tables × multi-role policies on the ADR-0001 pattern | M | M | Follow ADR-0001 §Security hardening pattern (SECURITY DEFINER RPCs, `search_path=''`, per-file `BEGIN/COMMIT`); QA-Lead gates on it. |

---

## Success Metrics

*(Contingent on D17 = yes and a decision to ship after seed-world cold-start is resolved.)*

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Communities created by makers (of makers with >0 followers) | 0 | ≥ 40% opt-in | 60 days post-launch |
| Posts per active community per week | N/A | ≥ 2 maker posts + ≥ 5 buyer comments | 30 days post-community-launch |
| Empty-community rate (no post in 14 days) | N/A | < 30% | 30 days |
| Community posts leaking into B12 or P15 | 0 | 0 | Always |
| Moderation actions per 100 posts | N/A | tracked (informs whether the subsystem is under-built) | ongoing |
| Follow → community-visit conversion | N/A | ≥ 25% of followers visit at least once | 30 days |

If any of "empty-community rate," "moderation actions per 100 posts," or "follow → visit" fails to hit target after 60 days, revisit the fundamental D17 assumption — a struggling community is worse than none.

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **D17 Decision** | Founder | D17 lock: KOL adopts buyer↔buyer social layer under each maker. Or: reject; archive this spec. | Until locked |
| **Migration prerequisite** | Founder + database-engineer | ADR-0001 applied on staging + validated per its §Pre-apply staging validation, then this feature's migration authored, applied on staging, validated | 1–2 weeks |
| **Moderation spec + Trust & Safety policy** | CPO + Founder + (spawned) Trust & Safety draft | Report queue + hide + KOL override designed and reviewed | 2 weeks |
| **Internal Testing** | 4 seed worlds (D12) — but see cold-start risk | All ACs pass; RLS test suite green; moderation surface functional; community disabled by default per world; opt-in per maker | 1 week |
| **Private Beta** | First cohort with real followers only | Communities enabled only for makers with ≥ N followers (N TBD); no privacy leak; no lost posts | 2–4 weeks |
| **Full Launch** | All makers who opt in | Metrics on target; moderation load sustainable | — |

**Feature Flag** — `maker-community-enabled`. Owner: CTO. Flag must gate the entire route + all writes. **Irreversible tier — founder sign-off per CLAUDE.md for the migration itself, per D17 for the concept.**

**Rollback Plan**

- **Rollback trigger:** privacy leak (community posts visible in wrong surface), moderation load unsustainable at pilot scale, or a founder decision that the many-to-many shape hurts the one-to-one positioning.
- **Rollback decision maker:** Founder (per Irreversible tier + concept-level implications).
- **Rollback steps:** disable `maker-community-enabled` → community routes return 404 → posts persist (data preserved for audit) → makers notified → moderation queue drained → decide whether to iterate or archive.
- **Data impact:** Migrations are additive; no cascade to existing tables. Rollback is flag-gated, not schema-reverting.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **D17 — Does KOL adopt a buyer↔buyer social layer under each maker?** If no, archive this spec. If yes, accept the many-to-many shape change and moderation cost. | Founder | Before any build |
| 2 | Migration sequencing — apply ADR-0001 first (with staging validation) then this second, or roll them together? | Founder + CTO + database-engineer | Before build |
| 3 | Is a full moderation subsystem in scope for MVP, or does this ship with a minimal hide-only surface and elevate T&S later? | Founder + CPO | Before build |
| 4 | Cold-start: at 4 seed worlds, do we ship the community disabled by default, gate on follower count, or defer entirely to post-MVP? | Founder + CPO | Before build |
| 5 | Membership persistence — does unfollowing a maker revoke reads to a private community (preferred: yes, gated on live `follows`)? | CTO | Before build |
| 6 | Does the community add a 12th block to the catalog, or render as a bespoke page composition outside the block system? | CPO + Design-Lead | Before build |
| 7 | Are there any commercial mechanics (paid membership, exclusive-drop pricing) attached — or is community strictly relational? | Founder + CBO | Before build (route pricing to CBO) |
| 8 | Notifications on new maker posts — required for the community to feel alive, but a subsystem that does not exist. Is a minimal email digest acceptable, or is community deferred until notifications are built? | Founder + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial draft (page-spec pass) — flagged BLOCKED pending D17; proposed 4 new tables; enumerated cold-start + moderation + unapplied-migration risks | CPO (page-spec pass) |

---

_Last updated: 2026-07-21 | Updated by: CPO (page-spec pass)_
