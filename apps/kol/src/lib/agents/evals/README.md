# KOL agent evals — shared harness (placeholder)

This directory is the reserved home for the shared eval harness used by the
AI co-creation pipeline (P8 drafter, P9 auto-critic) and the video engine's
ranker upgrade slot (D5).

Nothing lives here yet by design — the harness lands with the Phase-4 AI
pipeline work (see `docs/03-system-design/KOL-ai-pipeline-spec.md`). It is
scaffolded now so that:

- eval files have one canonical location from day one (`ai-engineer` owns it),
- the store-config fixtures in `src/lib/store-config/fixtures/` can be reused
  as eval inputs without moving them later,
- the critic's AA-contrast checks and the renderer consume the same
  `StoreConfig` types (`src/lib/store-config/types.ts`).

Expected shape when it lands: `cases/*.json` (store-config inputs + expected
critic verdicts), `run.ts` (harness entry), `rubrics/` (critic scoring specs).
