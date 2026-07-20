---
date: 2026-07-20
role: frontend-engineer
task: kol-app-scaffold
branch: feat/kol-app-scaffold
base: feat/kol-design-reconcile
tier: full
qa_verdict: PENDING
---

# apps/kol scaffold — Phase-3 coded component library shell

- Built `apps/kol` (@etsyc/kol, Next 16.2 / React 19.2 / strict TS + noUncheckedIndexedAccess / Tailwind 3.4→CSS-vars), self-contained per D14; no root files touched.
- Encoded ds-v2 verbatim: 5 palettes ×light/dark + block-ground sets, 4 pairings (Fontshare CSS + next/font/google, no Inter), 4 motion presets (`liquid`/`dimensional` signature beats token-stubbed for Phase 6), 3 radius identities, 2 densities; globals.css carries all global tokens.
- All 11 catalog blocks as real 4-state components (layout-matched skeletons, empty-as-invitation, quiet inline errors); `renderStore` consumes store-config v1.2 types (mirrored exactly, types-only — Zod is P3 backend) and handles BOTH `theme.kind` paths converging on one CSS-var contract.
- `/preview`: full world render + 11×4 state matrix, `?fixture=sena|custom`; sena = schema §3 verbatim, custom = new any-hex indigo/ochre world. Playwright (1 chromium project) screenshots both — 2/2 pass; typecheck + `next build` clean.
- Media: crafted SVG stand-in stills/posters (real footage is D12, Phase 5); video 404 paths exercise the designed poster-fallback honestly.
- NOT merged — QA gate structural. Deps beyond stack: cva/clsx/tailwind-merge/lucide-react (standard shadcn micro-deps, flagged).
- **Fix cycle 1 (QA BLOCK → all P1+P2 closed):** P1-1 Tailwind alpha modifiers via `rgb(from var(--x) r g b / <alpha>)` (verified in compiled CSS); P1-2 fabricated thank-you quote → neutral copy + optional maker `message` prop (v1.3 field routed to Design-Lead); P1-3 Sena now color-blocks (voice-quote `--block-a`, atmosphere `block-ground b`, footer CTA `--block-a`) + groundStyle re-points `--accent/--accent-ink`. P2: custom-font catalog mapping, live captions toggle, PosterStill (no DOM `.remove()`), per-block error boundary, shared TapToHear wired everywhere (no dead buttons), scroll-gated autoplay, header/contrast/poster-text/cqi-hero visual fixes, ESLint (`eslint src e2e`, 0 errors).
- **Deferred (documented):** inline retry for product-showcase/reviews needs the real data-fetch layer (P4/P5 — retry currently reloads); maker-authored thank-you message field lands with store-config v1.3.
