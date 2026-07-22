---
role: cto
task: wave3-dispatch-packet
date: 2026-07-21
tier: n/a (planning deliverable — no code)
qa_verdict: n/a
deliverable: docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md
---

- Produced the Wave-3 packet: 13 paste-ready briefs (W2-WIRE, SEED-W3, B1a, B1b, B2–B5, S8, B6, B7a, B7b, B8). No code written, no workers spawned.
- **Zero new migrations needed.** Verified `products`, `media`, `carts`, `orders`, `order_items`, `create_order` are all applied; `create_order` reads price server-side (`20260721000006_commerce.sql:159-165`). Only pending DDL is MIG-CHECK (already Founder-signed) — must apply before SEED-W3.
- Found the root cause of QA-Lead's anon-client condition: `lib/supabase/` has no server-side anon factory, only user/browser/admin. W2-WIRE ships `anon.ts` + `createEngineDeps` so the user client is structurally unreachable from `createEligible`.
- New unit **SEED-W3** — the real long pole. Wave 2 seeded the `blocks` catalog, not content; no store/video/profile/product exists, so B1–B8 have nothing to render.
- New conflicts found: `/feed` is auth-gated but B1 must serve anon (decided: `/feed` goes public, B1a owns it); `create_order` has no idempotency guard (resolved app-side, no migration); `orders` has no buyer UPDATE policy so PI stamping is service-role.
- `criticScore` null-vs-number does NOT reach Wave 3 — no AI-drafted config exists until S3 (Wave 4a); SEED-W3 hand-authors a numeric value. Still due before S3.
- Tiers: B7a **Irreversible** (`**/api/webhooks/**` floor + billing) with Founder sign-off; Full on W2-WIRE, SEED-W3, B1a, B1b, S8, B6, B7b; Lite on B2–B5, B8.
- Flagged the Design-Lead seam (B1 composition + limit, B2/B3 choreography, B5 dock placement) with spec defaults, not invented decisions. Also flagged: no framer-motion — P4's `HeroStage` FLIP already does shared-element continuity.
