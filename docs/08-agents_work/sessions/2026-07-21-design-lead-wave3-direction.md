---
role: design-lead
task: wave3-buyer-surface-design-direction
date: 2026-07-21
branch: ceo-1-1784669503
tier: n/a
qa_verdict: N/A — docs-only, no source files changed
workers_spawned: none (nested Task blocked per brief)
---

- Established Wave-3 design direction for B1–B5 buyer surfaces. Four files in `docs/06-design/`: direction, per-screen specs, reference pass, AA ship-blocker fix.
- **Platform-vs-seller boundary landed:** the platform owns *time and space* (geometry, tempo, rhythm, contrast law); the seller owns *light and voice* (colour, type, imagery, copy, block choice). Named the Seven Invariants. Structural resolution: seller freedom and seller adjacency are never co-present — the feed carries no seller theme, so there is no wall to prevent.
- **Ship-blocker resolved:** the 3.62:1 finding is NOT the `sunbaked --muted` token (5.23:1 on ground, passes). It is `text-muted/80` on `bg-surface/60` in `EmptyPrompt` = 3.63:1, and the same alpha modifier fails in **8 of 10** palette-modes. Fix A: ban opacity modifiers on ink tokens + guard test (→ 5.56:1). Fix B: regrade sunbaked light `--muted` `#6F6153` → `#645648` (6.19:1 on ground) for headroom. Maths verified against `contrast.ts`.
- **Two required store-config v1.3 additions:** `media.clips[].focalPoint` (cross-aspect crops decapitate makers without it) and `hero-video.props.statement` (no way today to author the one big line over the film — the reason `display-hero` exists).
- **Structural mechanism specified:** the Film Layer — one root-mounted `<video>`, FLIP between state rects, never unmounted. Required because the real cross-maker feed cannot use `layoutId` across component trees the way Wave-0's single-world `/preview` simulation does.
- **Reference pass** done first-hand against the founder-curated set (Refero/Stitch/Pencil/web unavailable this session). Three corrections to the written narrative: display-over-film is light not heavy; brave colour + composed type, never both; colour bands frame an inset portrait. Lusion unassessed (video, unviewable) — OQ-3 still open.
- Closed four pre-build open questions from the CPO specs (feed card count at N=4, image-grow treatment, motion downgrade threshold, dock/CTA collision).
- **4 open questions need a Founder/CPO decision** — OQ-1 (Focus Film amends a B1 AC) is the one that gates B1 build.
- Design-system + block-catalog doc edits for the AA fix are *specified, not applied* — they should land atomically with the code change, not ahead of it.
- No code written, no branch merged, no design-critic/QA-Lead spawned (nested Task blocked by brief).
