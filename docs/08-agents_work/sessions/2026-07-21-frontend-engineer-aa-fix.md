---
date: 2026-07-21
role: frontend-engineer
task: aa-fix
branch: fix/aa-muted-alpha
tier: lite
qa_verdict: PENDING
---

Closed the deferred Wave-0 WCAG AA ship-blocker per `docs/06-design/KOL-wave3-aa-fix-muted.md`. Recomputed every ratio with the repo's `contrast.ts` — all decision-relevant numbers reproduced (one non-decision delta: bazaar dark defect 5.33 vs spec 5.16, both passing). Fix A: dropped ink-token alphas — EmptyPrompt hint `text-body text-muted/80` → `text-caption text-muted` (3.63:1 → 5.56:1 sunbaked; 5.00–7.59 all 10 combos) and hero-video craft line `/90` (redundant; caption scale carries the hierarchy). Fix B: sunbaked light `--muted` `#6F6153` → `#645648` in tokens.ts + globals.css :root (6.19:1 ground / 6.86:1 surface; separation 2.38×); other palettes untouched. Guards: `no-ink-alpha.test.ts` fails with file:line on any `text-<ink>/<alpha>` in src (proven: injected violation fails, revert green); aa-audit adds a sunbaked-light 5.5:1 headroom floor + globals↔tokens sync check. Gates: typecheck PASS, lint PASS, vitest 403/403 (2 pre-existing env-gated live-staging files fail at import without `.env.local`; untouched by this branch). Docs updated: design-system §2.1/§5, block-catalog cross-cutting.
