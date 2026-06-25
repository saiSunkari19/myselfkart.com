# Bug validation — Order email ₹0.00 & stale order-detail status

Two independent, confirmed bugs. Both root-caused in code.

---

## BUG 1 — Confirmation email shows ₹0.00 / qty ×1

**Symptom:** Email for Order #29 shows `Bose QuietComfort 45 ×1 — ₹0.00`, Total ₹0.00. The
storefront confirmation page for the *same* order correctly shows `×2 — ₹53,980.00`.

**Root cause (validated):** the order-placed email subscriber requests **narrowed** item fields:

```ts
// apps/medusa/src/subscribers/order-placed-email.ts:60-66
fields: [ ..., "items.title", "items.quantity", "items.total" ]
```

In Medusa v2, computed line-item fields (`total`, and quantity in this path) only resolve when
items are expanded with the **wildcard** `*items`. The storefront loader already documents this:

```ts
// apps/storefront/src/lib/medusa/order.ts:27-31
// `*items` is required for the line-item computed fields (total/quantity/etc.)
// to resolve — narrowing to explicit `items.total` returns 0.
const ORDER_FIELDS = "id,display_id,email,currency_code,total,*items,items.product.handle"
```

So in the email path `items.total` / `order.total` come back `0` → `₹0.00`, and quantity comes
back null → the `Number(it?.quantity ?? 1)` fallback prints **1**.

**Fix direction:** mirror the storefront — request `*items` (and verify `order.total`) in the
subscriber's `query.graph` call, instead of the narrowed `items.*` list.

---

## BUG 2 — Order status updated in Medusa not reflected at `/order/[id]`

**Symptom:** changing an order's fulfillment/status in Medusa admin does not change what the buyer
sees at `https://sample.myselfkart.com/order/<id>`.

**Root cause (validated):** that route is a **static confirmation page**, not a status view.

- The loader omits status entirely:
  `ORDER_FIELDS = "id,display_id,email,currency_code,total,*items,items.product.handle"`
  ([order.ts:30](../apps/storefront/src/lib/medusa/order.ts)) — no `status` /
  `fulfillment_status` / `payment_status`.
- The view hard-codes the message:
  `order-summary.tsx:30` → "Order #N **is confirmed**"; `:102` → "🚚 **Delivery in 2–3 days**".

So no admin status change can ever appear there — the page never reads status.

**Contrast (works):** the `/account/orders` **list** *does* fetch
`status,fulfillment_status,payment_status` ([customer.ts:53](../apps/storefront/src/lib/medusa/customer.ts))
and renders a live `OrderStatusBadge` via `deriveOrderStatus(...)`. Both pages are
`force-dynamic`, so this is a missing-field/static-copy bug, **not** a caching bug.

**Fix direction:** add status fields to `getTenantOrder`'s `ORDER_FIELDS`, and render a live status
on the order-detail view (reuse `deriveOrderStatus` / `OrderStatusBadge` from the account list)
instead of the hard-coded "is confirmed" / "Delivery in 2–3 days" copy.

---

## Test scenarios

**Total:** 9 · **Coverage:** happy path · edge cases · regression · cross-device

### Scenario 1 — Email totals match the order (happy path) · Critical
**Tests:** Bug 1 fix · **Preconditions:** store live, Resend configured · **Role:** Buyer

| Step | Action | Expected Result |
|---|---|---|
| 1 | Place an order: 1 product, qty 2, unit ₹26,990 | Order created, total ₹53,980 |
| 2 | Open the confirmation email | Line shows `… ×2 — ₹53,980.00`; **Total ₹53,980.00** |
| 3 | Compare with `/order/[id]` page | Email totals & qty **exactly match** the page |

**Postcondition:** No ₹0.00 / qty-1 mismatch. **Priority:** Critical

### Scenario 2 — Multi-item, multi-quantity email · High
| Step | Action | Expected Result |
|---|---|---|
| 1 | Order: Item A ×3 + Item B ×1, mixed prices | Order total = sum of line totals |
| 2 | Open email | Each line shows correct qty and its own line total; Total matches order |

### Scenario 3 — Genuinely free / ₹0 order (edge) · Medium
| Step | Action | Expected Result |
|---|---|---|
| 1 | Place a 100%-discount / ₹0 order | Order total ₹0.00 |
| 2 | Open email | Shows ₹0.00 **and correct quantities** (proves 0 is real, not the bug) |

### Scenario 4 — Currency formatting (INR) · Medium
| Step | Action | Expected Result |
|---|---|---|
| 1 | Place order totalling ₹1,23,456 | — |
| 2 | Open email | Indian grouping `₹1,23,456.00`, no `NaN`/blank |

### Scenario 5 — Order detail reflects "Shipped" (happy path) · Critical
**Tests:** Bug 2 fix · **Role:** Buyer (guest link)
| Step | Action | Expected Result |
|---|---|---|
| 1 | Open `/order/[id]` right after placing | Status reads "Placed"/"Confirmed" per real payment status |
| 2 | In Medusa admin, fulfill + mark **Shipped** | — |
| 3 | Reload `/order/[id]` | Status now shows **Shipped** (not hard-coded "is confirmed") |

### Scenario 6 — Full status transition sweep (edge) · High
| Step | Action | Expected Result |
|---|---|---|
| 1 | Drive order placed → fulfilled → shipped → delivered | Detail page label tracks each: Processing → Shipped → Delivered |
| 2 | Cancel a different order | Detail page shows **Cancelled** (red) |

### Scenario 7 — Detail vs list parity · High
| Step | Action | Expected Result |
|---|---|---|
| 1 | Set an order to "Delivered" in admin | — |
| 2 | Compare `/order/[id]` and `/account/orders` badge | **Same** status label on both |

### Scenario 8 — Guest vs signed-in detail access · Medium
| Step | Action | Expected Result |
|---|---|---|
| 1 | Open `/order/[id]` as guest (no token) via confirmation link | Resolves, shows live status |
| 2 | Open same as signed-in owner | Resolves, identical status |
| 3 | Open another tenant's order id | 404 (RLS), no leak |

### Scenario 9 — Android mobile rendering (cross-device) · Medium
| Step | Action | Expected Result |
|---|---|---|
| 1 | Open email in Gmail Android (dark mode) | Totals/qty legible, no overflow |
| 2 | Open `/order/[id]` in mobile Chrome | Status badge renders; layout intact |

---

## Coverage matrix
| Requirement | Happy | Edge | Regression | Notes |
|---|---|---|---|---|
| Email totals/qty correct (Bug 1) | S1 | S2,S3,S4 | S1 step 3 parity | INR formatting incl. |
| Detail page live status (Bug 2) | S5 | S6,S8 | S7 list parity | reuse `deriveOrderStatus` |

## Test data
- Product priced > ₹0 (e.g. Bose QC45 @ ₹26,990) for non-zero totals.
- One 100%-discount path for the genuine-₹0 case (S3).
- Two tenants for the RLS isolation check (S8 step 3).
- Admin access to drive fulfillment/cancel transitions (S5–S7).
