---
role: ai-engineer
task: KOL video-engine spec (Phase 4, Workstream C)
date: 2026-07-19
branch: feat/kol-p4-video-engine
worktree: .worktrees/kol-p4-video-engine
tier: full
qa_verdict: PENDING
---

# ai-engineer — KOL video-engine spec (P6/P7)

**Scope:** DOCS ONLY. Specced the D5 unified video-selection engine + P7 tagging pipeline. No app/migration/.ts written.

**Delivered:**
- `docs/03-system-design/adr/0003-video-engine.md` — ADR: one engine, 3-stage pipeline, AI-ranker seam.
- `docs/03-system-design/KOL-video-engine-spec.md` — full P6/P7 build contract.

**Key decisions:**
- One `selectVideos(ctx)` = `antiRepetition(ranker.rank(eligible(ctx)))`; state = query param.
- FEED uses a POSITIVE `page_eligibility @> {'feed'}` predicate → thankyou clips structurally excluded (locked constraint), not blocklisted.
- `Ranker` seam sits between eligibility (correctness) and anti-repetition (hygiene) so AI can improve but never break invariants; gated by offline `ranking_ndcg@k` eval.
- Relationship ranking (D16-7) = per-buyer `buyer_signals` affinity only (never global counts); visit-cap + recency-decay + saturating squash prevent collapse into popularity.
- AI-assisted tagging: Haiku, cached prompt, ≥12 golden clips, `tagging_accuracy` macro-F1 ≥ 0.80 + 100% thankyou-gate; 429/529 handling + cost log mandatory.

**Read-only contract honoured:** engine reads `videos`/`video_profiles`/`buyer_signals` (ADR-0001), never `blocks`/config. Added zero columns.

**Coordination:** shared eval-harness AGREED with Workstream B (`ai-engineer-kol-ai-pipeline`) — B adopted my shape as base + 3 additive-optional extensions (`breakdown?`, cost-log optional block, `tags?`-encoded labels); folded into spec §7 (OQ-V1 RESOLVED). Untagged-at-draft behaviour confirmed consistent with B's reference-emitting pipeline (OQ-V2 RESOLVED): untagged clips match no eligibility query → invisible to buyers, safe-by-default.

**Open questions:** OQ-V3 scoring weights TBD post-launch (only remaining open). OQ-V1/OQ-V2 resolved.

**Commits:** ADR-0003; P6/P7 spec. Not merged — QA gate structural.
