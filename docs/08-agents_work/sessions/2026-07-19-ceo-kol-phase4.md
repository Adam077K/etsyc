---
date: 2026-07-19
role: ceo
session: ceo-6
task: KOL Phase 4 — Data Model & AI/Video Engine Specs
tier: irreversible          # schema branch; specs are lite
qa_verdict: PASS            # schema: PASS after 2 BLOCK cycles (contingent on staging validation before apply); B/C specs: Lite PASS
model: opus                 # spec/planning tier; Fable 5 reserved for Phase-6 build
status: COMPLETE — pending Founder merge confirmation + migration apply sign-off
---

# CEO Session — KOL Phase 4 (Build Planning)

## Goal
Turn the locked concept (D1–D16) into the two build-ready technical spines — the Supabase data model and the AI/video engines — before any Phase-6 build. Schema-first, then AI-pipeline + video-engine specs in parallel.

## What shipped (4 branches off `origin/main`, docs/plan only — NOTHING applied or merged)
| Branch | Deliverable | QA |
|--------|-------------|----|
| `feat/kol-p4-schema` | ADR-0001 + 13 non-applied SQL plan files — 31 tables, RLS, auth, indexes | Irreversible → **PASS** (2 BLOCK cycles) |
| `feat/kol-p4-ai-pipeline` | ADR-0002 + `KOL-ai-pipeline-spec.md` — interview→brand→custom design system (D15)→critic→gate; 6 per-feature evals | Lite → **PASS** (1 fix pass) |
| `feat/kol-p4-video-engine` | ADR-0003 + `KOL-video-engine-spec.md` — unified selection, tagging, ranker slot, relationship ranking | Lite → **PASS** |
| `feat/kol-storeconfig-amend` | store-config.schema.md v1.1 — theme discriminated-union (D15) + videoProfile source-of-truth note | verified |

## Orchestration (T2 dispatch-packet, all Opus)
CEO → CTO packets → workers via Task; validators out-of-band. Schema: CTO → database-engineer → QA-Lead (security-engineer + adversary-engineer + code-reviewer) → 2 fix cycles → cycle-3 PASS. Engines: CTO → 2 ai-engineers (converged directly on a shared eval harness) → code-reviewer Lite QA. Amendment: Design-Lead.

## Key decisions
- **D15 made expressible** — store-config `theme` is now `discriminatedUnion('kind',[curated|custom])`. Curated-enum invariant scopes to `kind:"curated"` only; for `kind:"custom"` (seller freedom) the guarantee is the **deterministic WCAG-AA gate + auto-critic + maker approval** (config must carry a passing `criticScore` before leaving `draft`). schemaVersion → 1.1.
- **RLS is the only security boundary** — the schema's cycle-1 BLOCK root cause: app-side column allow-lists are bypassable via direct PostgREST with a user JWT. All column/transition restrictions moved DB-side (10 SECURITY DEFINER fns, 6 triggers, id-keyed profile fn).
- **`videos`/`video_profiles` canonical, queryable** (engine reads them, never per-store config); `config.media.clips` references `videos.id` (app-enforced sync). `buyer_signals` = event-log feeding per-buyer relationship ranking.

## Gates & follow-ups (do NOT skip)
- **Migration apply is Founder-gated + Irreversible.** The plan is **static-reviewed only** — the **9-point staging validation (ADR-0001) is MANDATORY before apply** (apply-run on staging + anon/buyer/seller-JWT probes). QA-Lead PASS = readiness, not apply authorization.
- **4 P3 tech-debt follow-ups** documented in ADR-0001 "Post-MVP hardening" (commission_drafts status guard; set_order_status from-state machine; create_order inventory check; badge revocation on later-rejected verification).
- **Open (non-blocking):** OQ-V3 video scoring weights = post-launch tuning; MVP fonts = hosted catalog (upload = roadmap).

## Handoff → Phase 5 (per-feature specs)
CPO leads per-feature spec packs → `docs/04-features/specs/*.md`, each citing the Phase-4 schema tables + the two engine contracts + store-config v1.1. Then Phase 6 build (Fable 5) in `apps/kol/`. Backend-engineer implements the P3 Zod validator (store-config incl. theme union) + the 4 P3 follow-ups; calls `get_public_profile()` for author display.

## Breadcrumb
DECISIONS.md updated (2026-07-19 Phase-4 entry). Detail: `docs/03-system-design/adr/0001..0003` + `KOL-ai-pipeline-spec.md` + `KOL-video-engine-spec.md` + store-config.schema.md v1.1.
