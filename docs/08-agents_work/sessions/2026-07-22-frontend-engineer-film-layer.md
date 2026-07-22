---
role: frontend-engineer
task: FILM-LAYER — persistent film architecture (Wave 3, T0a, Amendment A)
branch: feat/film-layer
tier: full
qa_verdict: PENDING
---
Built the app-root Film Layer: one player mounted once from layout.tsx, A/B video buffers (swap = load inactive → canplay → play → cross-fade at --dur-swap), imperative FLIP between published rects on the §5.2 edge table (dock/undock ride a linear() spring from --spring-video), full §5.3 reduced-motion contract (invert step skipped, film keeps playing). HeroStage demoted to slot registrar; dock FLIP moved into the layer; FilmFrame gained "layer" slot mode and keeps exact Wave-0 behaviour without a provider ("self" mode). §5.1 tokens + --z-film added to globals.css, owned here. Wave-0 hero-persistence suite rewritten with every guarantee preserved; new film-layer suite carries the four QA-greppable tests incl. the cross-tree handoff. Gates: typecheck 0 errors, lint clean, 578/578 tests. 5 commits in the mandated order.
