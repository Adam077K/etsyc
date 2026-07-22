# KOL — Wave 3 T2 (B6) is dispatch-ready. Paste and go.

*From session `ceo-1-1784669503`, 2026-07-22. Wave 3 T1 is merged. B6 is fully planned and ruled; **every unit is unblocked**. The session ended on a monthly spend limit, not on a decision.*

---

## STATE

**`main` @ `5a23e55`** — Wave 3 T1 merged (`2abb982`), verified with keys: **58 files, 934 passed, 1 skipped, 0 failed**, typecheck 0, lint clean. Gate 2: **PASS, Full tier, zero P0/P1**.

**The buyer spine runs end to end:** feed → grow → world → browse → narrate.

**B6 produced no code** — three units were dispatched and all died on the spend limit within two minutes. **No branches, nothing lost, nothing half-written.** Raise the limit and dispatch.

## THE THREE PLANNING DOCUMENTS ARE ON `main` — READ THEM, DON'T REDERIVE
- `docs/08-agents_work/sessions/2026-07-22-cto-b6-plan.md` — 593 lines, six units, **per-unit briefs written to be dispatched verbatim**
- `docs/08-agents_work/sessions/2026-07-22-cpo-b6-open-questions.md` — all five open questions **ruled**
- `docs/08-agents_work/sessions/2026-07-22-cpo-narrate-shrink-ac.md` — the acceptance criteria

## DISPATCH ORDER

**Track 1 — three units in parallel, off `main` @ `5a23e55`, all Lite:**
| Unit | Branch | What |
|---|---|---|
| **U-A** frontend | `feat/b6-route-surface` | `/w/[handle]/p/[productId]` + product surface + exclusion-zone reservation |
| **U-B** backend | `feat/b6-cart-lib` | sessionStorage cart + `addToCart`/`getCart` |
| **U-C** frontend | `feat/b6-film-pill` | pill affordance in `FilmLayer` (additive-only) |

**Track 2 — after Track 1 lands:** U-D (wire CTA → cart), U-E (IntersectionObserver trigger → U-C's API).
**Track 3 — alongside:** U-F qa-engineer, `test/b6-suite`.
**Deferred, do NOT ride along:** the `model3d_id` ownership migration — **Irreversible**, belongs to S8's write path, needs Founder sign-off on its own cycle.

## GROUND TRUTH THE CTO ESTABLISHED — this is why the plan is trustworthy
1. **The pill-collapse mechanism was never shipped.** An earlier CPO ruling said B5 shipped it; the CTO read the code and found **zero pill symbols in `FilmLayer.tsx`**. B5 shipped the *contract* only. CPO retracted the prose. **U-C builds the mechanism.**
2. **`carts` has no items table** — `create_order(store_id, items jsonb)` takes items directly. Hence sessionStorage.
3. **`components/blocks/product-detail/index.tsx` already exists** — two-column, mono price, inventory, CTA. Adapt it; don't rebuild.
4. **The narration override is already wired** — `StoreWorld` accepts `narrationProductId` (`StoreWorld.tsx:38-46`). **Do not build a second shrink.**

## CONSTRAINTS THAT MUST RIDE IN EVERY BRIEF
- **U-C, binding:** additive-only to `FilmLayerApi`; **every existing `FilmLayer` test must remain byte-identical in outcome — if a pre-existing test needs changing, the unit is wrong: return BLOCKED, do not "fix" the tests.** Its suite has been byte-identical to `main` across every branch all wave, and that property only holds if nobody may relax it when inconvenient.
- **Every seam test mounts BOTH sides.** *A unit test that constructs its own counterparty cannot detect that the counterparty was never connected.* Three seams shipped unwired this wave with per-branch suites at 62/62 and 108/108 green.
- **Import, never re-type.** Nine re-typed-constant defects in Wave 3. Especially the **model↔pixels trap**: an exclusion-zone dimension appearing in CSS must *derive* from `DOCK_BANDS`, not restate it — the last instance left a layout guard reasoning correctly about a world that wasn't being painted.
- **Price is server-truth.** `create_order` ignores smuggled client prices (live-proved). A tampered cart must not be able to change what is charged — and that needs its own mutation-verified test.
- **Currency:** `fix/s8-currency-minor-unit` @ `9f6ef09` is **NOT merged**. If a unit needs per-currency exponents it must return **BLOCKED**, not hardcode 2 decimals — that hardcoding is the exact defect that branch fixes.
- **The film never stops.** Collapsing must not pause playback, remount the element, or reset `readyState`. Prove continuity (same node, not paused), not just geometry.

## AFTER B6
**B7a Stripe server + webhook — IRREVERSIBLE**: Full pipeline + 2-of-3 multi-judge + **Founder sign-off**. TEST MODE only; an `sk_live_` prefix must hard-fail at startup. Then B7b checkout surface, B8 thank-you (maker-authored, never AI-fabricated), Gate 3, then **Wave 4 seller pipeline → MVP functionally complete.**

## WAVE-CLOSE CONDITIONS (T1 is merged but not "COMPLETE")
1. Re-run `film-handoff.spec.ts` against post-merge `main`. **Related and unwritten:** it asserts the frame *survives* navigation but **not that the film keeps playing** — approved for strengthening. *"The film never stops"* is the premise; a test proving the element survived hasn't tested the claim.
2. **The curated modulated absent-statement nameplate has never been viewed at world scale.** Needs a `/preview` fixture with the statement off on hollowgrain or sena.

## FOUNDER ITEMS — none of these can be worked around
1. **Re-apply `supabase/seed/002_w3_seed_worlds.sql`** (all upserts). Two seed worlds still render in the **system font stack on staging** — fixed in code, untrue in production.
2. **Real maker footage.** Gates both wave-close conditions and five acceptance criteria. Every visual judgement in this project was made against synthetic gradients from one generative template.
3. **`store-media` bucket** — public read, authenticated write.
