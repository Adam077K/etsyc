---
role: frontend-engineer
task: S8 — seller product management (Wave 3, T1)
branch: feat/s8-product-mgmt
tier: full
qa_verdict: PENDING
---
Built the S8 price contract + surface: `lib/products` (Zod boundary, exact string-math major↔minor money, RLS-scoped server actions deriving store_id from ownership), the `/seller/products` ledger list + `[productId]` form (all 4 states, WCAG AA labels/fieldsets, mono tabular price, no card grid), and the full `store-media` upload path (per-file alt+focal+order staging, quiet error + retry with prior media retained, owner-prefix-verified `media` rows). Narration is read-only + deep-links to P7's tag editor — `video_profiles.product_links` stays clip-side-written (closed write list). Live staging suite proves: owner-only writes, anon read gates, float/negative price rejection, MIG-TS created_at stamp, P1-5 media cross-store guard, and create_order ignoring a smuggled client price (charged 4850 server-side). Gates: typecheck 0 errors, lint clean, 696 passed / 1 skipped (bucket smoke — `store-media` bucket does NOT exist on staging; PARTIAL, resume at STEP 3 smoke once provisioned). Inventory stays display-only (N3 cited, not built). 4 step commits + session file.
