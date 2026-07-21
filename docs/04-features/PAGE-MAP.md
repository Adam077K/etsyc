# KOL — Page Map & Route Contract

*Authored 2026-07-21 · session `kol-mvp-page-design`. Reconciles the founder page list ("Pages To Include", 17 buyer surfaces) with the locked concept ([`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md), D1–D16) and the 32 Phase-5 feature specs.*

> **What this file is.** The feature specs in [`specs/`](specs/) are **feature-scoped** — they describe behaviour. This file is **route-scoped** — it says which URLs exist, which design system each renders under, which blocks and specs compose it, and which Phase-6 wave builds it. It is the missing contract between the feature tree and the build.
>
> **What this file is not.** It does not supersede concept-lock or any spec. Where it conflicts with [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md), concept-lock wins.

---

## 0 · The structural rule: two design surfaces

Everything below is governed by **D15**, which splits the product in two:

| | **A — KOL chrome** | **B — Inside a maker's world** |
|---|---|---|
| Design system | **Fixed.** 5 palettes, 4 pairings, motion presets ([`KOL-design-system.md`](../03-system-design/KOL-design-system.md)) | **Free.** Any hex, any font, per-maker, from `stores.config` |
| Branding | KOL's | The maker's |
| Hero video | Not persistent | **Persistent — never unmounts or pauses** |
| Composition | Ordinary React routes | `renderStore(config)` — one renderer, 11 blocks, ordered by `blocks[].order` |
| Anti-slop guarantee | Design system + review | AA hard gate → auto-critic ≥0.75 → maker approval (D9, D15) |

**Consequence for page design:** surfaces in column B are **not pages**. They are states of one continuous render sharing a single `layoutId="hero-video"` element. Designing them as independent pages breaks the signature mechanic and the P4 persistence invariant.

---

## 1 · The mission test

KOL's claim (concept-lock): *meet the real human, trust them, and buy — turning shopping from a transaction back into a relationship.* Tagline: "Every maker, finally heard."

Every surface is scored on three axes:

- **Provable** — does it make the real human verifiable? (trust · D7)
- **Present** — does it put you in front of an actual person, on film? (connection · D5)
- **Particular** — does it preserve the maker's own voice and brand rather than flattening it? (authorship · D4, D15)

Ratings used below: **Carries** (the mission lives here) · **Supports** · **Hygiene** (no mission load; build it cleanly and cheaply) · **Risk** (actively pulls against the mission if designed conventionally).

---

## 2 · Surface A — KOL chrome

Fixed design system. No maker theming. Routes are ordinary Next.js App Router pages.

| Surface | Route | Feature specs | Wave | Mission |
|---|---|---|---|---|
| **Discovery feed** | `/` | [`discovery-feed.md`](specs/discovery-feed.md) (B1) | 3a | **Carries** — Present ✓✓ Particular ✓ |
| **For You** | `/?feed=for-you` | B1 + [`relationship-based-ranking.md`](specs/relationship-based-ranking.md) (P6+) | 3a / 5 | **Carries** — same surface, relationship-weighted |
| **Search & Shop** | `/search` | [`search-browse.md`](specs/search-browse.md) (B11) | 5 *(scope deferred)* | **Risk** — see §5 |
| **Cart** | `/cart` | [`checkout.md`](specs/checkout.md) (B7) | 3b | Hygiene |
| **Checkout** | `/checkout` | [`checkout.md`](specs/checkout.md) (B7) | 3b | Hygiene |
| **Orders & Tracking** | `/orders`, `/orders/[id]` | [`order-history.md`](specs/order-history.md) (B9) | 5 | Supports |
| **Inbox & Conversations** | `/inbox`, `/inbox/[thread]` | [`buyer-maker-messaging-drafts.md`](specs/buyer-maker-messaging-drafts.md) (P15) | 4c | Supports — see §5 |
| **Notifications** | `/notifications` | [`notifications.md`](specs/notifications.md) (B16) 🆕 | 5 | Supports |
| **Buyer Profile** | `/me` | store-engine-spine §P2 · [`follow-save.md`](specs/follow-save.md) (B13) | 1 / 5 | Supports |
| **Saved Collections** | `/me/collections`, `/c/[slug]` | [`saved-collections.md`](specs/saved-collections.md) (B17) 🆕 | 5 | Supports |
| **Settings & Privacy** | `/settings` | store-engine-spine §P2 | 1 | **Hygiene** |
| **Onboarding** | `/welcome` *(flow)* | [`buyer-onboarding.md`](specs/buyer-onboarding.md) (B18) 🆕 | 1 | Supports |
| **Auth** | `/login`, `/signup` | store-engine-spine §P1 | 1 | Hygiene |
| **Thank-you** | `/orders/[id]/thanks` | [`thank-you-moment.md`](specs/thank-you-moment.md) (B8) | 3b | **Carries** — the relationship close |

> **Thank-you is a boundary case.** It lives at a chrome route but renders the maker's personal film and maker-authored message. Treat its *content* as surface B, its *chrome* as surface A. The message is maker-authored or neutral — **never AI-fabricated** (D10 honesty gate).

---

## 3 · Surface B — inside a maker's world

One route namespace, one continuous render, hero video persists across every transition. These map to the buyer state machine in [`KOL-feature-tree.md`](KOL-feature-tree.md) §4.

| Surface | Route | State | Feature specs | Wave | Mission |
|---|---|---|---|---|---|
| **Grown video** | `/` *(overlay)* | `GROWN` | [`grow-interaction.md`](specs/grow-interaction.md) (B2) | 3a | **Carries** |
| **Maker world** | `/m/[maker]` | `WORLD_OPEN` → `WORLD_BROWSE` | [`world-unfold.md`](specs/world-unfold.md) (B3) · [`store-scroll-interact.md`](specs/store-scroll-interact.md) (B4) | 3a | **Carries** ✓✓✓ |
| **Narration dock** | *(transition)* | `NARRATE_SHRINK` | [`contextual-narration-shrink.md`](specs/contextual-narration-shrink.md) (B5) | 3a | **Carries** |
| **Product page** | `/m/[maker]/p/[id]` | `PRODUCT_PAGE` | [`product-page.md`](specs/product-page.md) (B6) · [`proof-of-product.md`](specs/proof-of-product.md) (P13) · [`exactly-what-to-expect.md`](specs/exactly-what-to-expect.md) (P14) · [`trust-badges.md`](specs/trust-badges.md) (P11) | 3b | **Carries** — Provable lands here |
| **Reviews** | *(block)* | — | [`trustworthy-reviews.md`](specs/trustworthy-reviews.md) (B6+) | 5 | Supports |
| **Ask the Maker** | `/m/[maker]/p/[id]#ask` | — | [`ask-the-maker.md`](specs/ask-the-maker.md) (B12) | 5 | Supports |
| **Co-Create** | `/m/[maker]/create` | — | [`guided-co-creation-commission.md`](specs/guided-co-creation-commission.md) (B14) on P15 | 5 | **Carries** |
| **Maker Community** | `/m/[maker]/community` | — | [`maker-community.md`](specs/maker-community.md) (B15) ✅ D17 | 5 | Carries (as a layer) — see §5 |
| **Events & Live** | `/m/[maker]/live` | — | [`events-live-experiences.md`](specs/events-live-experiences.md) (B19) 🆕 🔜 | **v1.1** | Deferred (D16-8) |

**Blocks available to surface B** — the 11 in [`KOL-block-catalog.md`](KOL-block-catalog.md): `hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere · contact-cta`.

**Invariants that hold across every surface-B transition:**
- Exactly one `hero-video` per world; it **never unmounts and never pauses** (Wave-0 P4 invariant).
- Corner dock via FLIP on `layoutId="hero-video"`, `--spring-video`, ~440ms. Never animate layout properties.
- World unfold ≤ **900ms** (`--dur-unfold` hard cap), `--ease-cinematic`, 70ms stagger, media leads text.
- `prefers-reduced-motion` → unfold becomes a cross-fade, dock snaps, signature renders as static end-state.
- Every block implements all **4 states**: empty · loading · error · success. Empty ≠ blank.

---

## 4 · Surface C — seller pipeline

Absent from the founder page list. Three of the six mission-carrying surfaces in the product are here.

| Surface | Route | Feature spec | Wave | Mission |
|---|---|---|---|---|
| **Onboarding explainer** | `/sell` | [`seller-onboarding-explainer.md`](specs/seller-onboarding-explainer.md) (S1) | 4a | Supports |
| **AI interview** | `/sell/interview` | [`adaptive-ai-interview.md`](specs/adaptive-ai-interview.md) (S2) | 4a | **Carries** — "finally heard," literally |
| **Draft review** | `/sell/draft` | [`ai-store-draft.md`](specs/ai-store-draft.md) (S3) | 4a | **Carries** — the reveal moment |
| **Co-edit editor** | `/sell/edit` | [`co-edit-editor.md`](specs/co-edit-editor.md) (S4) | 4a | **Carries** — authorship is enforced here or nowhere |
| **Voiceover recorder** | `/sell/voice` | [`per-element-voiceover-recording.md`](specs/per-element-voiceover-recording.md) (S5) | 4a | **Carries** — the un-fakeable anchor |
| **Approve → publish** | `/sell/publish` | [`section-approve-publish.md`](specs/section-approve-publish.md) (S6) · [`anti-slop-auto-critic.md`](specs/anti-slop-auto-critic.md) (P9) · [`human-approval-gate.md`](specs/human-approval-gate.md) (P10) | 4b | **Carries** — the anti-slop gate |
| **Verification** | `/sell/verify` | [`verification-real-maker.md`](specs/verification-real-maker.md) (S9) | 4b | **Carries** — Provable resolves here |
| **Dashboard** | `/sell/dashboard` | [`seller-dashboard.md`](specs/seller-dashboard.md) (S7) | 4a | Hygiene |
| **Product management** | `/sell/products` | [`product-management.md`](specs/product-management.md) (S8) | 3b | Hygiene *(but P14 makes it publish-blocking)* |

**Publish gate is strictly serial and cannot be parallelized:** `P9 → P10 → S9 → S6`. S6 has four hard preconditions: AA-PASS ∧ all rendered blocks approved ∧ Real-Maker anchor resolved ∧ P14 `product_specs` complete.

---

## 5 · The four surfaces that need a decision before design

### 5.1 Search & Shop — the highest-risk surface in the product

Every convention in commerce design pulls `/search` toward a results grid. **A grid is precisely what KOL exists to refuse.** The B11 acceptance criterion — results show makers-on-film and open their worlds, never a flat product grid — carries enormous load for one line. B1's AC likewise explicitly forbids a uniform grid.

Scope is currently **deferred** (Wave 5), and the delivery-requirements filter has **no backing source field**. Both need resolution before design.

### 5.2 Maker Community — D17 DECIDED 2026-07-21 (adopted as a layer)

✅ **Unblocked.** D17: adopted as a *layer* on the community page, not a defining feature; single-level comments, hide-only moderation, membership on follows. Original concern preserved: [`maker-community.md`](specs/maker-community.md) exists but carries no backing locked decision. The feature-tree traceability rule is explicit: *"every feature cites the D# it implements. If a build agent finds work with no D#, it is out of scope — escalate, do not build."*

Community moves KOL from **one-to-many** (maker broadcasts) to **many-to-many** (buyers talk to each other). It needs a founder decision (**proposed D17**) plus a moderation subsystem that exists nowhere in the MVP. It is the single largest genuinely-new bet on the founder page list.

### 5.3 Inbox — split placement

The route lives in chrome (`/inbox`), but each thread's content is a conversation with one maker. Open question: does a thread render in KOL chrome, or adopt that maker's theme? Rendering in maker theme is more on-mission but complicates a mixed-thread list view.

### 5.4 Events & Live — deferred, and should stay deferred

D16-8 tiers this **roadmap v1.1** because streaming infra doesn't gate the recorded-video loop. [`events-live-experiences.md`](specs/events-live-experiences.md) exists to document the forward-compatible seams, **not** to authorize a build.

---

## 6 · Count reconciliation

The founder list of 17 buyer surfaces resolves as:

| Resolution | Count | Which |
|---|---|---|
| Distinct chrome pages | 8 | Discover · Search · Cart/Checkout · Orders · Notifications · Profile · Collections · Settings |
| States inside a maker's world | 4 | Maker Page · Product Page · Co-Create · Community |
| Collapses into another surface | 2 | For You *(tab of Discover)* · Reviews *(block on Product)* |
| A flow, not a page | 1 | Onboarding |
| Chrome + world hybrid | 1 | Inbox |
| Out of MVP | 1 | Events *(v1.1)* |

**Plus 9 seller surfaces absent from the list.** Total MVP surfaces: **~26**, of which **6 carry the mission** and deserve disproportionate design investment: discovery feed · maker world · product page · AI interview · co-edit editor · publish/verify gate.

---

## 7 · Hard blockers standing in front of all of this

1. **The 31-table ADR-0001 migration has never been applied.** It is a reviewed plan. Wave 0 needs no DB, but everything from Wave 1 on is hard-blocked until it is applied to a shared staging Supabase, behind the 9-point validation and founder sign-off.
2. **The four new surfaces stack new tables onto that unapplied migration** — `notifications`, `collections`/`collection_items`, `communities`/`community_*`, `sessions`/`session_*`. All **Irreversible** tier. All marked PROPOSED, not locked.
3. **The design system is not signed off.** It closes with palette/pairing/motion as taste calls "gating on Founder sign-off before any UI is built." Every hex is proposed, not verified.
4. **`KOL-reference-library.md` contains a superseded direction that is not marked as such** in the file itself — its synthesis paragraph describes the "quietly premium" direction the founder rejected. Only [`research/references/README.md`](../research/references/README.md) and `NARRATIVE.md` record the correction.
5. **`lusion.mov` has never been viewed by any agent** (gitignored video, no committed still). The cinematic/3D half of the visual direction rests on it.

---

## 8 · Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial page map — route contract, two-surface split, mission scoring, 17→26 reconciliation | session `kol-mvp-page-design` |
