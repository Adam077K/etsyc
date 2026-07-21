---
role: qa-lead
task: kol-p5-block-library
date: 2026-07-21
branch: feat/kol-p5-block-library
base: feat/kol-p3-store-config-validator
commit: 6ec5946
tier: Full
qa_verdict: BLOCK
---

# QA-Lead Session — KOL P5 Block Library

## Verdict: BLOCK

## Tier Ruling: Full
603 insertions / 141 deletions across 13 files (744 total lines changed). >300 lines triggers Full. No critical-path files (auth/billing/migrations) — the only trigger is line count.

## Reviewers
- cr-p5 (code-reviewer): PASS recommendation — 179/179 vitest, tsc clean, zero any. AA checks were unit-level numeric token-pair tests only, NOT browser-rendered contrast.
- qa-p5 (qa-engineer): BLOCK recommendation — browser-real Playwright + axe-core; 34 serious color-contrast violations confirmed.

## Blocking Finding

**P1 — shared.tsx:84 groundStyle derived --muted fails AA body contrast**

The `groundStyle` function derives `--muted` as:
```
color-mix(in oklab, var(--on-block-${ground}) 72%, var(--block-${ground}))
```

On sunbaked block-a (#FBF3E8 on-block, #B8452A ground), the 72% mix yields approximately #EDC3B2 on #B8452A = 3.32:1 at 17px body. WCAG AA body text requires 4.5:1. The developer's own comment in voice-quote/index.tsx:81-83 explicitly acknowledges this failure.

Multiple blocks render `text-muted` body text inside `BlockSection` with block grounds — most directly: craft-story/index.tsx:62 (`text-body-lg text-muted` inside `BlockSection ground={ground}`). This is a confirmed live path to the AA failure across all palettes that have dark block-a grounds.

## Non-Blocking Findings

**P2 — sunbaked page-level muted token (3.62:1)**
Axe-core found muted body text at 3.62:1 on the page background in some states (EmptyPrompt hints, ErrorInline). Color values don't match the curated sunbaked tokens exactly — may be P8 palette token scope. File as P8 follow-up; does not block P5.

**P2 — /preview matrix chrome inherits wrong text-ink**
The state-matrix section does not set its own background/text, causing matrix headings to inherit the custom fixture's root ink at 1.09:1. This is a harness gap, not a block library defect. Deferred.

## Cycle-2 Must-Fix

1. `apps/kol/src/components/blocks/shared.tsx:84` — Change `--muted` derivation so body text remains ≥4.5:1 on all block grounds across all curated palettes. Options: (a) increase mix percentage to ≥91% (verify per palette), (b) reference a pre-computed AA-verified `--on-block-${ground}-muted` token, (c) document that `--muted` on block grounds is large-text-only and replace `text-muted` body text inside block-ground sections with `text-ink`. Acceptance: axe-core zero `color-contrast` on /preview noor #world and /preview #state-matrix for all block-ground combinations containing body text.
2. Confirm axe pass on craft-story/index.tsx:62 specifically (body-large muted text in ground section).

## Deferred Items

- P2 sunbaked muted token → P8/design-system investigation
- P2 /preview matrix chrome → P5 follow-up ticket, non-blocking
- P3 nit: dead-code `?? maker.bio` → code-reviewer cycle-2 light pass
- P3 nit: add comment distinguishing platform UI labels from maker quotes → code-reviewer cycle-2

## Notes

cr-p5 PASS recommendation does not contradict qa-p5 BLOCK — cr-p5 explicitly did not browser-test contrast. Under reviewer disagreement, most-paranoid reviewer wins; but this BLOCK is independently justified by confirmed browser evidence and the developer's own code comment.
