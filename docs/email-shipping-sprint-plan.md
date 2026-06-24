# Sprint Plan: Transactional Email + Shipping

**Source backlog**: `docs/email-shipping-backlog.md`
**Date**: 2026-06-24
**Team**: ~1 developer
**Cadence**: 2-week sprints · **3 sprints (~6 weeks)** to full shipping coverage

## Capacity model (solo dev)
- ~10 working days / 2-week sprint − 20% buffer (bugs, review, infra) = **~8 effective dev-days/sprint**.
- Effort mapping: **S = 0.5d, M = 1.5d, L = 3d**.
- Total backlog = **~24 dev-days** → 3 sprints.

| Epic | Days |
|---|---|
| Spikes (S-A,S-B) | 1.0 |
| Foundation (F-1..F-4) | 4.0 |
| Platform (P-1..P-3) | 2.5 |
| Customer (C-1..C-4) | 5.0 |
| Shipping (SH-1..SH-8) | 11.5 |

---

## Sprint 1 — Foundation + first trusted value (≈7.5d)
**Sprint Goal:** *A buyer gets a branded order-confirmation email and a new seller is auto-emailed their login — both live, with cross-tenant bleed proven impossible.*

| # | Story | Days | Notes |
|---|---|---|---|
| S-A | Spike: emailpass reset/verify events | 0.5 | front-loaded; firms up Sprint 2 |
| S-B | Spike: Shiprocket webhook secret + status list | 0.5 | front-loaded; firms up Sprint 3 |
| F-1 | Verify domains in Vercel DNS + Resend | 0.5 | DNS authoritative ✓ |
| F-2 | Resend behind Notification Module | 0.5 | |
| F-3 | **Tenant-safe send helper + no-bleed test** | 1.5 | ⚠ privacy-critical — do not rush |
| F-4 | Branded theme-tokened template | 1.5 | |
| P-1 | Seller onboarding email | 0.5 | closes lost-credential gap |
| P-3 | /apply enquiry notification | 0.5 | |
| C-1 | Order-placed confirmation | 1.5 | the demoable win |

**Demo:** place an order on two seller storefronts → each buyer gets the right store's email; approve a seller → onboarding email arrives.
**Risks:** F-3 is the linchpin — if the no-bleed test is flaky, stop and fix before C-1. DNS propagation can lag (start F-1 day 1).

## Sprint 2 — Customer auth emails + Shiprocket credentials (≈8d)
**Sprint Goal:** *Buyers can verify/reset their account at the correct store, sellers can reset admin access, and the platform can authenticate to each seller's Shiprocket account.*

| # | Story | Days | Notes |
|---|---|---|---|
| C-4 | Order deep-link + support block | 0.5 | |
| C-2 | emailpass account create/verify | 1.5 | uses S-A outcome |
| C-3 | **emailpass reset — tenant-scoped link** | 1.5 | ⚠ privacy-critical (multi-store same email) |
| P-2 | Seller admin password reset | 1.5 | |
| SH-1 | Per-seller Shiprocket creds in superadmin | 1.5 | Razorpay-style |
| SH-2 | Per-tenant token mint + ≤10-day refresh | 1.5 | new vs Razorpay |

**Demo:** same email registered at two stores → reset on each lands on the right store; superadmin shows Shiprocket "ready" per seller.
**Risks:** C-3 depends on S-A's decision; if emailpass needs a custom token flow, C-2/C-3 grow — re-estimate after Sprint 1.

## Sprint 3 — Shipping provider + shipping emails (≈8.5d)
**Sprint Goal:** *An order ships through Shiprocket and the buyer gets correct, in-order shipped/out-for-delivery/delivered emails — routed to the right tenant from a context-less webhook.*

| # | Story | Days | Notes |
|---|---|---|---|
| SH-3 | v2 Shiprocket fulfillment provider | 3.0 | largest item |
| SH-4 | Order→shipment mapping (non-RLS bridge) | 0.5 | |
| SH-5 | Status→email transition state machine | 1.5 | dedupe/ordering |
| SH-6 | **Per-tenant webhook handler** | 1.5 | ⚠ privacy-critical (secret verify → runWithTenantContext) |
| SH-7 | Buyer shipping emails | 1.5 | |
| SH-8 | Operator step: set webhook URL+secret | 0.5 | may spill to follow-up |

**Demo:** ship a test order → buyer receives shipped email with tracking link; out-of-order/duplicate webhooks don't double-send; webhook for tenant A never touches tenant B.
**Risks:** SH-3 is the biggest unknown (v2 provider from scratch); if it overruns, SH-8 spills. Webhook secret header must be confirmed (S-B) before SH-6.

---

## Definition of Done (every story)
- [ ] Buyer sends run inside `runWithTenantContext`; no-bleed covered by F-3 test.
- [ ] All sends through the Notification Module (no ad-hoc Resend calls).
- [ ] Idempotent; correct From/Reply-To; secrets never logged.
- [ ] Tests green; PR reviewed.

## Cross-sprint risks
| Risk | Mitigation |
|---|---|
| Knowledge concentration (solo dev) | Keep PRD + backlog + this plan current as the written record. |
| emailpass events unknown (S-A) | Front-loaded in Sprint 1; re-estimate C-2/C-3 after. |
| v2 Shiprocket provider effort (SH-3) | Use the v1 plugin's `forward-order.js` + verified live payloads as reference; live account already proven. |
| Deliverability dip | F-1 seed-inbox check before any volume; bounce monitoring is a fast-follow (PRD P1 #10). |

## Kickoff (start of execution)
Day 1: **S-A** (inspect Medusa auth module for emailpass events) + **S-B** (configure test-account webhook) + **F-1** (add DNS records — propagation lag). Everything else in Sprint 1 unblocks from F-2/F-3.
