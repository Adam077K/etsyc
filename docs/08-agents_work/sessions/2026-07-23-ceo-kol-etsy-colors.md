---
role: ceo
task: kol-etsy-colors
date: 2026-07-23
qa_verdict: PASS
tier: full
merged: feat/kol-etsy-colors (6 commits, --no-ff into main)
---

# CEO — KOL Etsy brand re-skin

- Founder directive (pre-pitch): "switch the coloring to ETSY COLORS." Pitch positions KOL as a feature inside Etsy; Etsy panel judges Fri Jul 24.
- **Approach:** token VALUES only, class names untouched — whole 36-page app recolored coherently, wave-4 fixes included. Dark editorial ink/bone ground deliberately KEPT (re-badge the accent system, not a light-theme flip).
- **Mapping:** marigold→Etsy Orange `#F1641E` · bright→`#FF7A3C` · clay→`#7C2D12` rust (critic-mandated second step: first candidate `#AE4328` collapsed into the accent's hue family and killed spread color-blocking; rust restored blob separation 1.81→2.94) · plum→`#4C2740` fig · sky→`#41628C` denim · olive kept. Full table + honest-regressions in DECISIONS.md.
- Every pairing scripted AA (worst: ink-on-orange CTA 5.61:1; bone-on-rust 7.57:1); two opacity AA-fixes shipped (StatSpread, ValuesSpread metas to full bone).
- **Gate:** critic PASS ("unmistakably Etsy while still KOL editorial — an Etsy exec will recognize the brand immediately and feel the ambition in the same beat"; golden-glow→commercial-orange trade explicitly accepted for this audience; keep-list moments all intact). Finish-reviewer PASS after two one-line fixes (stale sign-in glow rgba — the only stale literal among six old hexes app-wide; DECISIONS ratio correction). Advisory logged to TODO-NEXT: focus ring 2.09:1 on bone grounds (improved from 1.61, still under 3:1 non-text floor).
- clay-bright unchanged (#E08462) — Sharon world accent unaffected; her decorative clay hairline flagged (1.23:1 effective at rust) for stage-2 eyeball.
- Fully reversible: values live on one branch; DESIGN.md carries the dated Etsy-skin note.
