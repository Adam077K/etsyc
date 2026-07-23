---
role: design-lead
task: imagegen-prompts-three-pages
date: 2026-07-22
tier: trivial
qa_verdict: PASS
branch: ceo-6-1784669506
---

- Authored `docs/06-design/2026-07-22-imagegen-prompts-three-pages.md`: one ≤12-line launch prompt + three 444–454-word image-model prompts (Discovery Feed, Maker World unfolded, Product Page with docked narration).
- Palettes deliberately differ to prove range: `sunbaked` light → `market-plum` light → `cuberto-noir` dark, each with its **bound** pairing (statement-grotesk / warm-serif / modern-mono-grotesk). No Inter anywhere.
- Every hex, slot, radius, dock geometry and exclusion zone traced to `KOL-design-system.md` + `KOL-wave3-screen-specs.md`; every maker name, statement, product title and price traced to `supabase/seed/002_w3_seed_worlds.sql` — zero invented data except photographic direction.
- Each prompt carries a literal negative/anti-slop clause and render params; a 7-item output rejection checklist closes the file.
- Docs only. No `.ts`/`.tsx`/`.sql` touched. Not merged, not pushed.
