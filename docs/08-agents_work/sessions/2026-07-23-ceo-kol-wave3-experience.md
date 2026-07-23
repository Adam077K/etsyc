---
role: ceo
task: kol-wave3-experience
date: 2026-07-23
qa_verdict: PASS
tier: full
merged: 4723354 + bd3b05f + f62e143 + a9b38f0 (main)
---

# CEO — KOL Wave 3: the experience wave

- Founder verdict driving the wave: "only an e-commerce shop with videos — we wanted to reimagine how people shop." Handoff doc carried it verbatim; 5 tracks.
- **Continuous film** (4723354, risk:full ×3 reviewers): persistent FilmStage in the app shell — ONE video element feed→world→product→checkout→thank-you, never re-mounted from black (e2e-proven, 4 cases). Critic: "the world genuinely unfolds around the still-playing film." 2 P1s caught+fixed (reduced-motion occlusion, back-nav freeze).
- **Alive+physical** (bd3b05f): reshuffle-on-return, press states, drag-peek gallery, olive values spread, full-bleed spreads, kinetic beats. Dropped its own thank-you beat as anti-concept (re-mount) at rebase — concept upheld over sunk cost.
- **Seller workspace** (f62e143 + a9b38f0): /sell/home (connection box: maker's status line = buyer's view), /sell/orders, /sell/messages (correspondence "airtight"), /sell/clips. Canonical SellWorkspaceNav.
- **TwoDots** (HELD local, unmerged): first real-footage world, Sharon's costumes. Design PASS ("voice strongest of six"; back-of-child framing = cleared template). Governance audit caught a misclassified child-profile image (devil-back.jpg) — Founder clearance list now complete: workshop.jpg + devil-back.jpg + written permission. Accent → clay.
- **Deploy**: kol-demo.vercel.app live (wave-2 baseline); wave-3 preview built; production promote is Founder-run (permission-gated, correctly).
- Peer coordination matured: builders pre-negotiated conflicts, refused unassigned scope, stopped at permission boundaries.
