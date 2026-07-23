# KOL Wave 3 — Experience Reimagining Handoff
*CEO `ceo-6` · 2026-07-23 · The dispatch brief for the wave-3 team. Read fully before touching anything.*

---

## The Founder's verdict (verbatim intent — this is the brief)

> "The product is only like any other e-commerce shop with some videos — but we wanted to **reimagine how people shop**. It has to be totally different from what we usually see. There is also interaction missing in the user experience on most pages. And I need it **deployed** so I can test the real experience and flows against what we planned."

Waves 1–2 delivered the full surface (18+ screens, 5 worlds, 11 products, video pipeline, QA-gated throughout). Wave 3's job is not more screens. It is **the experience itself**.

## The diagnosis — why it reads as "a shop with videos"

The concept lock (docs/01-foundation/KOL-v2-concept-lock.md) describes ONE CONTINUOUS CINEMATIC EXPERIENCE:
tap a film → it grows → the world unfolds **around the still-playing film** → you scroll the store while it plays → you go deeper and the film **shrinks to a corner and keeps narrating what you're looking at** → you buy → the maker thanks you on film.

What shipped is structurally page-based:
1. **The film dies at every route boundary.** Feed→world is a re-mount, world→product re-mounts again, product→checkout kills it entirely. The one thing that was never supposed to stop — stops constantly.
2. **Checkout/thank-you/account are disconnected pages**, not the final beats of one film-led journey.
3. **The feed is static after first paint** — the "living magazine that reshuffles and breathes" is a single deal of the deck.
4. **Contextual narration (journey step 5) is a label mock** — the docked film doesn't respond to what the buyer looks at.
5. **Interactions are hover-deep only** on most pages — the signature physicality (drag, momentum, liquid, sound-of-the-craft moments) exists mainly in the feed hero.

## Wave-3 mandate — three tracks

### Track A — THE CONTINUOUS FILM (the differentiator; highest priority)
Make the film genuinely persistent across the buyer journey. Architecture options (builder decides, documents in DECISIONS.md):
- A persistent film layer in the app shell (layout-level `<MakerFilm>` host that survives route changes; routes register their film intent) — the strong option.
- View Transitions API for the route seams it can't cover.
Acceptance: from feed tap to thank-you, the active maker's film is **never re-mounted from black**; it grows, docks, swaps clips contextually (mocked per-section clip labels are fine — the MOTION of the swap is what must be real), and survives world→product→checkout→thank-you. `prefers-reduced-motion` = static posters, same continuity of presence.

### Track B — ALIVE + PHYSICAL (interaction density on every page)
- Feed: reshuffle-on-return ("the room changes"), idle drift, entrance choreography on revisit.
- Worlds/product: scroll-linked physicality (parallax restraint per DESIGN.md), press states, drag-to-peek galleries, the deferred backlog (olive values spread, full-bleed spreads, hover-blurb transform rework).
- Checkout/thank-you: the maker-presence beats made kinetic (portrait cluster reacts, thank-you film moment is THE payoff).
- Every interactive element: designed press/active states, not just hover. Mobile gets touch equivalents.

### Track C — DEPLOY (Founder testing)
Deploy apps/kol to Vercel (all-SSG, no env secrets needed). Produce a shareable URL. If Vercel auth is absent in the environment, report the exact one-line command the Founder must run — do not stall.

## Hard rules (unchanged from waves 1–2)
- DESIGN.md + PRODUCT.md remain the locked contract. Wave 3 changes CHOREOGRAPHY and CONTINUITY, not the visual system.
- QA gate before every merge. Track A is `risk:full` (it touches the app shell + every route). No merge without PASS.
- No fabricated humans/AI craft imagery. Honest mocks, labeled.
- The words are sacred: no prose changes without explicit CEO sign-off (all voice copy passed adversarial review).
- Worktrees off origin/main (9cff135+); additive fixtures; stop-and-ask on any shared-file conflict.

## What "done" looks like
The Founder opens the deployed URL, taps Lena's film, and reaches the thank-you page without the film ever going dark — and says "this is not a shop; this is the thing we planned."
