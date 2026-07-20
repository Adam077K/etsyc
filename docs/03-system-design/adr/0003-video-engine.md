# ADR-0003: One unified rules+context video-selection engine with a pluggable AI-ranker slot

> Architecture Decision Record. Implements D5. Consumes the Workstream-A data model (ADR-0001) — `videos` / `video_profiles` / `buyer_signals`. Companion spec: [`KOL-video-engine-spec.md`](../KOL-video-engine-spec.md).

---

## Header

| Field | Value |
|-------|-------|
| **ADR Number** | 0003 |
| **Title** | One unified rules+context video-selection engine (discovery + store + narration) with a pluggable AI-ranker slot |
| **Date** | 2026-07-19 |
| **Status** | Proposed |
| **Deciders** | ai-engineer (video-engine, author) · CTO (kol-p4-engines) · database-engineer (kol-p4-schema, data contract) · QA-Lead (eval gate) |

---

## Context

The KOL buyer journey (concept-lock §"buyer journey", feature-tree §4 state machine) needs the *right* real footage surfaced at three very different moments: the magazine **discovery feed** (B1), the **persistent in-store player** while a maker's world is open (B3/B4), and **contextual narration** when the buyer drills into a product and the video shrinks to a corner (B5). These look like three different problems, but they are the same problem: *given the buyer's current state + this business's footage + this buyer's relationship history, pick the best clip(s) and don't repeat yourself.*

Three hard constraints force the shape of this decision:

1. **No buyer-time generation (D5).** The MVP selects from pre-tagged real footage; it never generates video at request time. So the engine is a *selection* engine, not a generation engine.
2. **Footage must be decoupled from layout (D4×D5).** A `thankyou` clip lives in `media` but is bound to no block; the engine surfaces it only in `THANK_YOU`. The engine therefore must **not** read `blocks` or per-store config — it queries a canonical, cross-maker tag pool.
3. **The data contract is already locked by Workstream A (ADR-0001).** `videos` + `video_profiles` are the CANONICAL queryable tables; `buyer_signals` is the relationship event log. We must build *on* that contract, not redesign it.

If we do nothing / build three bespoke selectors, we get triplicated eligibility logic, three places the "no thank-you clip in the feed" rule can rot, and no single seam to later add ML ranking. We need one engine, one pipeline, one upgrade slot.

---

## Decision

Build **one selection engine** with a fixed three-stage pipeline — **eligibility filter → scoring → anti-repetition** — that serves all buyer states by parameterising the eligibility query per state, reads only `videos`/`video_profiles`/`buyer_signals` (never `blocks`/config), scores with a transparent rules formula (business/brand profile + buyer situation + freshness + **relationship** signals from `buyer_signals`), and exposes a single **`Ranker` interface seam** where an LLM/embedding re-ranker can later replace the rules scorer for callers unchanged — gated by an offline eval.

---

## Rationale

**Why we chose this:**

1. **One pipeline = one place for every invariant.** The "`thankyou` is `page_eligibility:['thankyou']` only, structurally excluded from the feed" rule is enforced once, in the eligibility stage, for all callers. Three selectors would mean three copies of that rule.
2. **State is just a query parameter.** FEED/GROWN/WORLD/NARRATE/PRODUCT/CHECKOUT/THANK_YOU differ only in *which* `page_eligibility ∩ purpose ∩ productLinks ∩ mood* they request. The GIN-indexed array columns (ADR-0001) make each state's set-intersection index-served, so one engine is also the fast option.
3. **The AI-ranker slot is a seam, not a rewrite.** Defining `Ranker` as `(candidates, context) → ranked` up front means the rules scorer and a future LLM/embedding re-ranker are interchangeable behind the same call. D5's "AI-ranker-ready" is satisfied by an interface, and the offline eval hook prevents shipping a re-ranker that regresses.
4. **Relationship ≠ popularity (D16-7).** Feeding `buyer_signals` as a *per-buyer* affinity term (not a global count) keeps ranking relational. This is a scoring-term choice inside the one engine, not a separate system.

**What we're trading off:**

- **A rules scorer is not personalised ML.** Cold-start buyers get business-profile + freshness ranking only; relationship signal is thin until a buyer accrues history. Accepted — the AI-ranker slot exists precisely to upgrade this later.
- **Denormalised tag pool needs a sync contract.** The engine trusts `videos`/`video_profiles` as source-of-truth; `stores.config.media.clips[]` must mirror it (ADR-0001 OQ-2). We depend on that app-side upsert being transactional; we do not own it.
- **Anti-repetition is session-scoped, best-effort.** Dedupe on `anti_repetition_key` within a session window; across sessions a buyer may re-see a clip. Accepted for MVP.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **One engine, 3-stage pipeline, ranker seam (chosen)** | Single source for invariants; state = query param; clean upgrade slot; index-served | Rules scorer isn't ML; depends on config↔table sync contract |
| Three bespoke selectors (feed / store / narration) | Each tuned to its surface | Triplicated eligibility + anti-repetition logic; the "no thankyou in feed" rule rots in 3 places; no single ML seam |
| Buyer-time LLM/generative selection from the start | Maximally "smart" | Violates D5 (no buyer-time generation); latency + cost per feed render; unbounded/slop risk; no offline eval before it hits buyers |
| Precomputed per-buyer playlists (batch) | Cheap at read time | Stale for a live magazine feed that reshuffles per visit; can't react to in-session state (NARRATE_SHRINK context) |

---

## Consequences

**Positive:**
- Every buyer state is served by one tested code path; adding a state = adding a query preset, not a subsystem.
- The locked "thankyou-only" constraint is structurally enforced and unit-testable in one place.
- An LLM/embedding re-ranker can ship later behind the `Ranker` seam with zero caller changes, gated by an offline `ranking_ndcg@k` eval.
- The AI-assisted tagging feature (P7) and the ranker both ride the shared eval harness (with Workstream B) — accuracy and cost are measured, not hoped.

**Negative:**
- The engine is only as good as the tags. Untagged footage is invisible to the engine (see spec §3.5 draft-time behaviour) — this pushes weight onto the P7 tagging pipeline's quality.
- Relationship ranking is weak for new buyers (cold-start); the feed leans on business-profile + freshness until signals accrue.
- We inherit ADR-0001's OQ-2 sync risk: if the config↔`videos` mirror diverges, the engine can select a clip a world no longer binds. Mitigated by the transactional upsert contract, but not owned here.

**Neutral:**
- Scoring weights are launch defaults (spec §4.2), expected to be tuned against real interaction data — they are configuration, not architecture.
- The engine runs server-side with the Supabase **service role** to read `buyer_signals` (RLS makes signals private to the buyer; ADR-0001 group 12). This is a deliberate trust boundary noted in the spec.

---

## References

- `.claude/memory/DECISIONS.md` — D5 (video engine), D16 (D16-7 relationship ranking), D15
- [`docs/01-foundation/KOL-v2-concept-lock.md`](../../01-foundation/KOL-v2-concept-lock.md) — D5, D16
- [`docs/04-features/KOL-feature-tree.md`](../../04-features/KOL-feature-tree.md) — P6/P7, B1/B5, §4 buyer state machine
- [`docs/03-system-design/store-config.schema.md`](../store-config.schema.md) — §2.3 `media`/`videoProfile` (the selection surface)
- ADR-0001 (kol-p4-schema) — the `videos`/`video_profiles`/`buyer_signals` data model + OQ-2 sync contract
- Companion spec: [`KOL-video-engine-spec.md`](../KOL-video-engine-spec.md)

---

## Implementation Checklist

- [x] Status set to **Proposed**
- [x] At least 2 real alternatives listed
- [x] Both positive and negative consequences documented
- [ ] DECISIONS.md entry added (owner: CTO/CEO synthesis step)
- [ ] Deciders notified (CTO, database-engineer, QA-Lead)
- [ ] Linked from ARCHITECTURE.md / feature spec (P6 row → this ADR)
- [ ] Shared eval-harness shape converged with Workstream B (open question)

---

_Last updated: 2026-07-19 | Updated by: ai-engineer (kol-p4-video-engine)_
