# KOL — Session Handoff (2026-07-23, CEO `ceo-6`)
*For the next agent/session continuing this work. Read this fully, then the Reading List, before acting.*

---

## Who you are here

You are the **CEO/orchestrator** of the KOL front-end effort in the `etsyc` repo (`/Users/adamks/VibeCoding/etsyc`). You never write source code. You: plan → brief builders (design-lead/worker subagents in isolated worktrees off `origin/main`) → run QA gates (2–3 independent reviewers per branch: design-critic, code-reviewer, impeccable-finish-reviewer) → fix loops → focused re-gates → merge with `--no-ff` + conventional message → session file in `docs/08-agents_work/sessions/` → push. The QA gate is sacred; CEO cannot override a BLOCK. Founder (Adam) confirms merges via a standing "merge on unanimous PASS" pattern established this session.

## Where the product stands (main @ `0e99da6`)

Everything below is MERGED, QA-passed, and pushed:
- **Waves 0–2** (18+ screens): Discovery Feed "The Maker's Issue", expanded-video, 5 maker worlds, 15 products, checkout/thank-you/account, browse/sign-in/journal(+longform story)/how/careers, seller journey (/sell → interview → studio → publish), video pipeline (`MakerFilm`), designed 404.
- **Wave 3** (the experience wave — see `docs/08-agents_work/handoffs/2026-07-23-KOL-wave3-EXPERIENCE-HANDOFF.md`):
  - **Continuous film**: persistent `FilmStage` in the app shell (`src/components/film/`) — ONE video element across world→product→checkout→thank-you, never re-mounted from black; guarded by `apps/kol/e2e/film-continuity.spec.ts` (4 cases, must stay green).
  - **Alive+physical**: feed reshuffle-on-return, `.press` primitive, drag-to-peek gallery, olive values spread, full-bleed spreads, kinetic beats.
  - **Seller workspace**: /sell/home, /sell/orders (the "This is what [buyer] sees" connection box), /sell/messages, /sell/clips; canonical `SellWorkspaceNav`.

## Deploy state

- **kol-demo.vercel.app** = wave-2 baseline (public, no protection).
- The complete 36-page wave-3 build is deployed as a Vercel **preview** and validated; production promote is **Founder-gated** (permission classifier blocks agents — correctly). Founder one-liner:
  `cd /Users/adamks/VibeCoding/etsyc/.worktrees/kol-deploy/apps/kol && npx vercel --prod`
- Deploy worktree: `.worktrees/kol-deploy`. Vercel auth exists on this machine.

## HELD: TwoDots (read before touching)

`feat/kol-twodots` in `.worktrees/kol-twodots` — **LOCAL ONLY, never pushed, held from merge**. First REAL-footage world (Sharon's children's-costume studio). QA design-PASS, all batches complete, rebased onto wave-3 main, 41 pages build. **Gated on children's-imagery governance**: Founder must decide (1) workshop.jpg approve/swap (fallback pre-staged in `apps/kol/public/media/CREDITS.md`), (2) Sharon's surname/city + copy review, (3) written permission for public use. The "Showing the little girl costume.mp4" video was NEVER ingested into the repo (deliberate). Unblock sequence on clearance: rebase-check → push → merge → redeploy. Memory file: `kol-twodots-held-branch.md` in the project auto-memory.

## Open Founder items (do not proceed past these without answers)

1. Production promote (command above).
2. Founder walkthrough verdict vs the concept ("does it feel like the reimagining?").
3. TwoDots clearance (3 items above).

## Backlog (next work, roughly prioritized)

- FilmStage pill geometry follow-up: at 375px top-scroll the collapsed NOW-PLAYING pill corners the product h1 tail (logged, Track-A territory).
- `apps/kol/TODO-NEXT.md` leftovers (hover-blurb, humans-in-frame imagery, etc. — some already closed; verify against file).
- Founder asset drops: real clips per `apps/kol/public/media/video/README.md` (filename→surface map; Ken-Burns renders must be palindrome-encoded); real photography per the CREDITS imagery-upgrade manifest (priority: Noor + Juno portraits/products).
- "ON THE BENCH" checkout label ambiguity — logged for Founder judgment.
- Pitch assets from the screens (Founder mentioned a pitch; `KOL-pitch/` dir exists untracked in repo root; a parallel session merged an HLV pitch plan into docs).

## Hard rules that held all session (keep them)

- Locked design contract: `apps/kol/DESIGN.md` + `PRODUCT.md` (palette/type/motion; marigold single-signal; scrim rule; locked bezier [0.16,1,0.3,1]; transform/opacity/filter only). Choreography may evolve; the system may not.
- D15: KOL chrome fixed; maker brand only inside worlds/preview panes. D7 trust claims must be provable.
- No AI imagery for craft objects/humans (extends the launch-film rule). Honest cross-context reuse requires crop/treatment differentiation. No fabricated identities.
- Prose is sacred once adversarially reviewed — no copy edits without explicit sign-off.
- Fixtures additive-only; builders in worktrees; stop-and-ask on unexpected conflicts; agents never push `main` (CEO merges).
- Network is blocked in agent envs (no downloads); Higgsfield API 403s on the current tier.

## Orchestration playbook that worked (reuse it)

Parallel design-lead builders (opus) with strict territory maps + additive-only shared files → 2–3 reviewer gate per branch → consolidated fix batch (dedupe, keep-list of praised elements, CEO adjudicates reviewer splits) → focused re-verify by the original reviewers → merge train in dependency order (shell/architecture first, interactions rebase over it) → redeploy. Reviewers stall often: nudge with "deliver the report now" via SendMessage. Messages cross constantly: always point agents at inbox msg IDs.

## Reading list (in order, before major work)

1. `CLAUDE.md` (repo) + `.claude/agents/ceo.md` — operating rules.
2. `apps/kol/DESIGN.md` + `apps/kol/PRODUCT.md` — THE locked contract.
3. `docs/01-foundation/KOL-v2-concept-lock.md` — product concept + locked decisions.
4. `docs/08-agents_work/handoffs/2026-07-23-KOL-wave3-EXPERIENCE-HANDOFF.md` — the experience mandate.
5. Session files `docs/08-agents_work/sessions/2026-07-2{2,3}-ceo-*.md` — full merge/QA history.
6. `apps/kol/public/media/CREDITS.md` — imagery governance + Founder decision tables.
7. `apps/kol/public/media/video/README.md` — clip drop-in map.
8. Project auto-memory `MEMORY.md` → `kol-video-pipeline.md`, `kol-twodots-held-branch.md`.
9. `docs/research/references/NARRATIVE.md` + reference PNGs — the design direction source.

## Suggested skills (invoke as needed)

- `impeccable` — the craft engine; builders run `node .claude/skills/impeccable/scripts/context.mjs` once/session; `detect.mjs` must return `[]` before any merge.
- `emilkowal-animations` — for any motion choreography work.
- `playwright-skill` — screenshots/e2e verification (Playwright MCP is currently disconnected; use the local `@playwright/test` in apps/kol or CDP fallback).
- `deploy-to-vercel` / `vercel-cli-with-tokens` — deploy mechanics.
- `frontend-design`, `web-design-guidelines`, `ui-typography` — reviewer calibration.
- Project slash-skills: `/review`, `/build`, `/design`, `/qa` per `.claude/skills/MANIFEST.json` (filter by tags; 3–5 skills max for leads, 2–3 for workers; never preload).

## Identity/session bootstrap for the next CEO session

`/color gold`, `/name ceo-[task-slug]`, read this handoff + reading list items 1–2, check `git -C /Users/adamks/VibeCoding/etsyc log --oneline -5` and `git worktree list` (many stale worktrees exist — do not prune without checking), then plan with the Founder before deploying agents.
