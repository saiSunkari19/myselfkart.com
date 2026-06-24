# Product Requirements Document: Shiprocket v2 Fulfillment Provider (multi-tenant)

**Author**: Sai Krishna Sunkari
**Date**: 2026-06-25
**Status**: Draft — decision pending (build vs. defer)
**Related**: `docs/email-transactional-v1-prd.md`, `docs/email-shipping-backlog.md`, [[shiprocket-multitenant-fulfillment]], [[razorpay-multitenant-payment-provider]]

---

## 1. Executive Summary
Make Shiprocket a first-class **Medusa v2 fulfillment provider** so sellers fulfill orders *inside Medusa Admin* (one click → AWB/label) and buyers see *live shipping rates* at checkout — instead of today's fire-and-forget push where sellers manage everything in the Shiprocket dashboard. This is a **maturity upgrade, not a gap**: the current order→Shiprocket→status-email loop already works. The PRD's job is to decide *when* it's worth the large build, and to define a phased path that doesn't break the working loop.

## 2. Background & Context
- **Today (shipped, working):** an `order.placed` subscriber pushes each order to the seller's Shiprocket account (adhoc create, `order_id = Medusa order.id`). The seller assigns courier/AWB/label/pickup **in the Shiprocket dashboard**. Status returns via the per-tenant webhook `/webhooks/delivery/<tenant_id>` (x-api-key) → buyer shipped/out-for-delivery/delivered emails. Per-tenant creds in superadmin (encrypted, 240h token cache). Checkout uses a **manual flat-rate** shipping option. **Medusa does not track shipment state.**
- **Why consider more:** two real limitations of today's model — (1) buyers pay a *flat rate* that may not match actual shipping cost/serviceability; (2) sellers context-switch to Shiprocket's dashboard and Medusa Admin shows no tracking/AWB. A fulfillment provider closes both.
- **Proven pattern to reuse:** the Razorpay payment provider already does multi-tenant "one registered provider, per-tenant encrypted creds resolved per call via AsyncLocalStorage." The fulfillment provider mirrors this exactly.
- **Prior art:** the community `medusa-fulfillment-shiprocket` plugin is **Medusa v1 / single-tenant** — reference only (its `forward-order.js` payload + token-refresh are reusable).

## 3. Objectives & Success Metrics

**Goals**
1. Sellers fulfill from Medusa Admin (assign AWB + label) without opening the Shiprocket dashboard.
2. Medusa natively tracks AWB, courier, tracking number, and fulfillment status per order.
3. (Later) Buyers see accurate, serviceable shipping rates at checkout instead of a flat rate.
4. No regression: the existing buyer status emails and per-tenant isolation keep working.

**Non-Goals**
1. **Replacing Shiprocket** as the carrier aggregator — we integrate it, not rebuild it.
2. **Multi-warehouse / split shipments** logic beyond what Shiprocket exposes (Phase C+ at most).
3. **International / multi-currency rate logic** — pilot is India/INR.
4. **Removing the Shiprocket dashboard** — sellers can still use it; this adds an in-Medusa path.
5. **Doing this before there's demand** — see the decision gate in §3.

**Success Metrics**
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Seller shipments done from Medusa Admin | 0% | ≥80% of shipments (post Phase A) | fulfillment created via provider vs. dashboard |
| Orders with Medusa-tracked AWB/tracking | 0% | 100% of shipped orders | `fulfillment.tracking_links` populated |
| Checkout shipping-cost accuracy (Phase B) | flat rate | within ±10% of charged courier cost | rate quoted vs. AWB charged |
| Double-push incidents (subscriber + provider) | n/a | 0 | `order_shiprocket` unique reconciliation |
| Buyer status-email regression | working | 0 regressions | existing webhook tests stay green |

**Decision gate (build-vs-defer):** build Phase A **when any one** is true — (a) a pilot seller asks to fulfill from Medusa Admin / complains about dashboard context-switching; (b) flat-rate shipping causes margin loss or buyer complaints; (c) >N orders/day make dashboard processing a bottleneck. Until then, **defer** — the working loop is sufficient.

## 4. Target Users & Segments
- **Sellers (primary):** want to run operations in one place (Medusa Admin) and not learn/maintain the Shiprocket dashboard. Higher-volume sellers feel this most.
- **Buyers (Phase B):** want accurate shipping cost + delivery estimate at checkout, not a flat guess.
- **Platform ops:** want fewer "how do I ship?" support tickets and native visibility into fulfillment.

## 5. User Stories & Requirements

### P0 — Must Have (Phase A: in-admin fulfill, replaces subscriber-push)
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 1 | As a seller, I fulfill an order from Medusa Admin and an AWB is assigned in Shiprocket. | `createFulfillment` resolves the tenant's token, creates the Shiprocket order/forward shipment, returns AWB + tracking; runs in `/app*` tenant context. |
| 2 | As the platform, the provider is multi-tenant and isolated. | One registered provider; every method resolves the current tenant's creds (AsyncLocalStorage), never cross-tenant; fails closed without context. |
| 3 | As the platform, the subscriber-push and provider never double-create. | When the provider owns creation, the `order.placed` push is disabled (flagged off per tenant or globally); `order_shiprocket` PK still reconciles; webhook maps via `channel_order_id`. |
| 4 | As a seller, Medusa Admin shows AWB, courier, tracking, and status. | Fulfillment record carries `tracking_links`/labels; webhook updates reflect in Medusa fulfillment status (not just email). |
| 5 | As a seller, I can cancel a fulfillment and it cancels in Shiprocket. | `cancelFulfillment` calls Shiprocket cancel; state reconciled. |

### P1 — Should Have (Phase B: live checkout rates)
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 6 | As a buyer, I see real shipping options/rates for my pincode. | `getFulfillmentOptions` + `calculatePrice` call Shiprocket serviceability; storefront `fulfillment.listCartOptions` surfaces them; replaces/augments the flat-rate option. |
| 7 | As the platform, rate calc is resilient. | Serviceability failure falls back to the flat-rate option (never blocks checkout); cached per pincode briefly. |
| 8 | As a seller, AWB selection follows a policy. | Cheapest vs. fastest courier rule configurable per tenant (default cheapest serviceable). |

### P2 — Nice to Have / Future (Phase C: returns, labels, docs)
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 9 | As a seller, I generate labels/manifests from Medusa. | `getFulfillmentDocuments`/`getShipmentDocuments` return Shiprocket docs. |
| 10 | As a buyer/seller, returns flow through Medusa. | `createReturnFulfillment` creates a Shiprocket return shipment. |
| 11 | As a seller, pickups are scheduled from Medusa. | Pickup generation call wired post-AWB. |

## 6. Solution Overview
- **Module:** `src/modules/shiprocket-fulfillment` exporting `ModuleProvider(Modules.FULFILLMENT, …)`; service extends `AbstractFulfillmentProviderService`. Registered under `@medusajs/medusa/fulfillment` providers in `medusa-config.ts` (alongside the existing manual provider).
- **Multi-tenant:** reuse `src/lib/shiprocket/{credentials,token,client}.ts` — every method calls `resolveShiprocketCredentials(knex, tenantId)` + `getShiprocketToken(...)` where `tenantId` comes from tenant context (admin requests are tenant-scoped; the read-path patch + `runWithTenantContext` already established). Identical posture to the Razorpay payment provider.
- **Method map (v2 `AbstractFulfillmentProviderService`):**
  - `getFulfillmentOptions` → Shiprocket courier/serviceability list (Phase B).
  - `validateFulfillmentData` / `validateOption` → sanity-check pincode/option.
  - `canCalculate` / `calculatePrice` → live rate (Phase B); Phase A returns the flat default.
  - `createFulfillment` → create Shiprocket order + forward shipment (assign AWB) — the Phase A core; reuses the `forward-order` payload shape.
  - `cancelFulfillment` → Shiprocket cancel.
  - `createReturnFulfillment`, `get*Documents` → Phase C.
- **Reconciliation / no double-push:** the existing `order_shiprocket` bridge + webhook stay. Phase A flips order creation from the **subscriber** to the **provider's `createFulfillment`** (operator-driven), so an order isn't pushed twice. Add a per-tenant flag (or global toggle) `shiprocket_fulfillment_mode = auto-push | manual-provider`; webhook reconciliation via `channel_order_id` is unchanged.
- **Checkout rewiring (Phase B):** replace the provisioned flat-rate option with a Shiprocket-backed option; storefront Server Actions (`fulfillment.listCartOptions`, `cart.addShippingMethod`) already call the right SDK methods — they surface whatever options the provider returns, with the flat rate as fallback.

## 7. Open Questions
| Question | Owner | Deadline |
|----------|-------|----------|
| Does any pilot seller actually want in-Admin fulfillment yet? (the build trigger) | PM | Before starting Phase A |
| In Phase A, do we *disable* the order.placed subscriber-push globally, or per-tenant toggle? | eng | Phase A design |
| Does Medusa v2's fulfillment flow let a provider assign AWB at `createFulfillment` and store it as a tracking link cleanly? (verify the exact interface in 2.15.5 via Context7) | eng | Phase A spike |
| Serviceability/rate API quotas + latency at checkout — acceptable on the checkout path? | eng | Phase B spike |
| AWB selection policy default (cheapest serviceable vs fastest) — per tenant? | PM/eng | Phase B |
| Pickup scheduling: automatic at fulfill, or seller-triggered? | PM | Phase C |

## 8. Timeline & Phasing
**Decision first:** do **not** start until the §3 decision gate trips. Then:

- **Phase A — In-admin fulfill + AWB (replaces subscriber-push).** Spike the v2 fulfillment interface in 2.15.5 → build `createFulfillment`/`cancelFulfillment` multi-tenant → flip push from subscriber to provider (toggle) → Medusa tracks AWB/tracking. *Largest single step; delivers P0.* Keeps webhook emails intact.
- **Phase B — Live checkout rates.** `getFulfillmentOptions`/`calculatePrice` via serviceability → surface in storefront checkout with flat-rate fallback → AWB selection policy.
- **Phase C — Returns, labels, docs, pickup scheduling.** The P2 surface.

**Migration safety:** at every phase the existing loop (subscriber-push OR provider, webhook → emails) must remain single-source — guarded by the `shiprocket_fulfillment_mode` toggle so creation happens in exactly one place.

---

### Bottom line
**Recommendation: DEFER** until the decision gate trips. The shipping loop is functionally complete; this provider is a UX/accuracy maturity upgrade with a large surface (~8–10 methods + checkout rewiring). When it's time, **Phase A alone** captures ~80% of the value (in-Admin fulfillment + native tracking) and is the natural first slice.
