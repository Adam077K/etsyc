# `src/lib/data` — the data seam

One interface (`KolDataSource`), two implementations. `getData()` returns the
Supabase adapter when `hasSupabase()` is true (both `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set), the mock adapter otherwise, and
logs one line on first use saying which. Nothing above this directory branches
on the answer.

```
src/lib/data/
  types.ts             the interface + the entity shapes (= the mock types)
  mock-adapter.ts      today's behaviour, over mock/db.ts + localStorage
  supabase-adapter.ts  the ADR-0001 tables/RPCs
  index.ts             getData()
```

**No page has been migrated yet.** This directory is the seam only.

---

## Moving a page from `useKolStore()` to `getData()`

Today:

```tsx
"use client";
const store = useKolStore();
const reviews = store.reviewsFor(productId);
const onSubmit = () => store.addReview({ productId, buyer: "You", stars, ... });
```

After:

```tsx
const data = getData();
const reviews = await data.reviewsForProduct(productId);        // now async
await data.addReview({ productId, buyer: "You", stars, ... });  // now async
```

Three things change, and only three:

1. **Everything is `async`.** The mock resolves immediately; the shape of the
   call site is what matters, not the latency. A client component reads through
   `useEffect` + state, or the page becomes a Server Component that awaits
   directly. A Server Component is the better default — `getData()` works in
   both.
2. **`getX()` returns `null`, never `undefined`.** `db.ts` helpers returned
   `undefined` for a miss; the interface normalises to `null` so a missing row
   and an unset field are never confused.
3. **Entity shapes do not change at all.** `Maker`, `Product`, `Review`,
   `Order`, … are the mock types re-exported. If a shape ever needs to change,
   it changes in one place and the compiler finds every call site.

### Migrate a whole loop at a time

The mock adapter and `KolStoreProvider` hold two `createPersistentStore`
instances over the same localStorage key. Each reads the persisted value at
module init, but neither notifies the other within a session. So move all of
checkout, or all of community — never half a loop, or a write through
`getData()` will be invisible to a sibling page still on `useKolStore()` until
reload. This caveat vanishes once a loop is fully migrated, and does not exist
against Supabase at all.

---

## The B0 rule: which mutations MUST go through a server route

RLS is the **only** boundary in this stack. An authenticated user reaches
PostgREST directly with their JWT, so an app-layer allow-list is not a control —
it is a comment. Any write a client must not be trusted with therefore goes
through a `SECURITY DEFINER` RPC or the service role.

| Write | How | Why |
|---|---|---|
| **Create an order** | `rpc('create_order', { p_store_id, p_items })` | Prices are re-read from `products` server-side, `buyer_id` is bound to `auth.uid()`, status forced `pending`, cross-store items and `quantity <= 0` rejected. A client-supplied total is ignored — `NewOrderInput.totalMinor` is carried only for the mock. (ADR-0001 P1-1) |
| **Cancel / advance an order** | `rpc('cancel_order')`, `rpc('set_order_status')` | Buyer may cancel own pending/paid; seller may set whitelisted targets on own store only. `orders`/`order_items` are SELECT-only under RLS. (P1-1) |
| **Mark an order paid** | Stripe webhook, **service role** | Never reachable from any user session. (P1-1) |
| **`buyer_signals`** | **service role** only | Buyers must not be able to write their own weighted ranking signals; RLS is read-own. (P2-4) |
| **Notifications** | server emitter (service role) | One-way and maker-attributed — a client insert would let anyone forge a maker's voice. Also needs a table; see gaps below. |
| **`reviews.verified`** | nothing — it is a **GENERATED** column (`order_item_id is not null`) | Cannot be written by anyone, including the service role. To earn it, bind the buyer's `order_item_id` on insert. (OQ-7, P1-3) |
| **Real-Maker verification / badge** | **service role** + trigger | No self-verification, no false badge; the trigger fires for every writer. (P1-2) |
| **`profiles.role` → seller** | **service role** during onboarding | Client role changes are blocked by `guard_profile_role`. (P2-1/2) |

Everything else is a plain RLS-scoped read or an owner-scoped write. Reviews,
public Q&A, store drafts (`store_versions`) and `stores.published` are all
written directly by the owner/buyer under existing policies — no route needed.

### Money

Integer minor units everywhere (`priceMinor`, `totalMinor`, `price_amount`,
`subtotal_amount`, `unit_price_amount`). Never a float, never a formatted
string in a domain object. Format at the edge, with `formatPrice()`.

---

## Schema gaps — where the Supabase adapter throws

These methods throw `NotInSchemaError` naming the gap, because ADR-0001 has no
table for them. Inventing one here would put schema in application code that
the migration plan has never seen.

| Capability | Gap |
|---|---|
| `listFeed()` | `videos` + `video_profiles` are canonical (OQ-2) but carry no feed-card presentation fields (title, `size`, `aspect`) and no ranking. Belongs behind the D5 engine route. |
| `listNotifications()` | No `notifications` table. Needs a migration group plus a service-role emitter. |
| `getCommunity()`, `postsFor()`, `addPost()`, `addComment()`, `toggleHidden()`, `listHidden()` | No community/posts/comments/moderation tables. B15 postdates the schema; needs a group with RLS keyed on `follows`. |
| `listCollections()`, `getCollection()` | `saves` exists (polymorphic product\|store) but there is no `collections` / `collection_items` table and no public-board visibility flag. |
| `advanceOrder()` | `orders.status` is a payment/fulfilment enum, not the 5-step production timeline; there is no `stage` column and no `order_updates` table. |

Lossy-but-working mappings, flagged in code:

- `Order.stage` is projected from `orders.status`, and `Order.updates` comes
  back empty (no timeline table). The B8 maker-authored thank-you has no
  storage either.
- `Product.expect` fills 10 of the 11 P14 labels — `product_specs` has no
  `first_use` column, so "First use" is absent rather than fabricated.
- `Maker.filmClass` / `Product.filmClass` are mock presentation tokens with no
  column; a live world takes its look from `config.theme` (D4).
- `Maker.location` / `craftLine` come from `stores.config.maker` (D4 identity),
  not from columns.
- `Thread.type` is derived from `commissions` linkage (there is no
  `threads.type` column) and `Thread.unread` is always false (no read-receipt
  column).
- `StoreOverride.dirty` has no column — it is an editor-local concern.
- `Product.currency` throws `DomainMappingError` on a non-USD row: ADR-0001
  defaults `currency` to `'GBP'` while `MockProduct["currency"]` pins `"USD"`.
  Widening that literal in `src/lib/mock/db.ts` is the fix.
