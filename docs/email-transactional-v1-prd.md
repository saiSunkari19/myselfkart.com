# Product Requirements Document: Multi-Tenant Transactional Email v1

**Author**: Sai Krishna Sunkari
**Date**: 2026-06-24
**Status**: Draft
**Stakeholders**: Platform eng (Medusa/RLS), storefront eng (Next.js), ops (seller onboarding)
**Provider**: Resend (behind Medusa Notification Module)
**Related**: `Medusa neon rls multitenant implementation plan · MD.md`, `docs/seller-onboarding.md`

---

## 1. Executive Summary

Selfkart can provision sellers, run isolated storefronts, and complete buyer
checkout — but it sends **no email**. This PRD specifies a transactional email
layer that delivers platform mail (seller onboarding, admin reset, enquiry
notifications) and buyer mail (order confirmation, shipping, account/password)
through a single authenticated sending domain on Resend, using the
Shopify-style pattern: **store display name + `store+<tenant_id>@mail.myselfkart.com`
From + seller `Reply-To`**. Per-seller custom sending domains (Model C) are
deferred.

## 2. Background & Context

- **No outbound email exists today.** The plan only covers the RLS-protected
  in-admin `notification` table and `emailpass` auth credentials — nothing
  actually sends mail.
- **Multi-tenant constraint**: one Medusa backend + one Next.js storefront serve
  many sellers, isolated by Postgres RLS (`SET LOCAL app.current_tenant`).
  Background subscribers run *outside* tenant context unless wrapped in
  `runWithTenantContext` (plan line 980) — the central correctness hazard here.
- **Prior analysis (this engagement)**:
  - *Red-team* established that Resend is send-only (no mailbox), the
    "graduate like Razorpay" analogy underestimates per-seller DNS (Model C),
    and subscriber tenant-context is a privacy hazard.
  - *Pre-mortem* surfaced three launch-blockers: shared auth-mail reputation,
    tenant-context bleed, and the no-reply dead-end.
  - *Evidence*: a live Shopify order email confirmed the chosen pattern —
    `From: store+<id>@t.shopifyemail.com` (display name = store), `Reply-To` =
    seller's own address, DKIM signed by a **dedicated sending domain**, not the
    apex.
- **Hard constraint**: Vercel holds `myselfkart.com` DNS and cannot move; all
  DKIM/SPF/DMARC records are added in Vercel DNS.

## 3. Objectives & Success Metrics

**Goals**
1. Every order placed on any seller storefront triggers a branded confirmation
   email to the buyer, sent under the correct store identity.
2. Sellers receive their admin credential + portal URL automatically on `/apply`
   approval (closing the "lost one-time credential" gap).
3. Buyers and sellers can recover accounts via working password-reset email.
4. Zero cross-tenant email bleed (correct recipient + correct store data, always).
5. Strong deliverability: auth/transactional mail reliably reaches the inbox.

**Non-Goals**
1. **Per-seller custom sending domains (Model C)** — deferred to an opt-in phase.
2. **Inbound mailbox hosting** on the sending domain — replies are delegated via
   `Reply-To`; no mailbox is hosted at `mail.myselfkart.com`.
3. **Marketing / promotional / newsletter email** — transactional only.
4. **The `connect@` receiving mailbox** for enquiries (Workspace/Zoho vs.
   dashboard) — a separate decision; this PRD only *sends* the enquiry
   notification.
5. **Dedicated IP / IP warming** — start on Resend shared IPs at pilot scale.

**Success Metrics**
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Order-confirmation send success | 0% | ≥99% of paid orders emailed | Resend delivered events vs. orders |
| Cross-tenant email bleed | unknown | 0 incidents | Integration test + prod audit |
| Inbox placement (auth/transactional) | n/a | ≥95% inbox (not spam) | mail-tester + seed inbox checks |
| Bounce rate | n/a | <2% | Resend bounce webhook |
| Complaint rate | n/a | <0.1% | Resend complaint webhook |
| Seller onboarding email delivered | manual console copy | 100% auto-delivered | Provision flow logs |

## 4. Target Users & Segments

- **Buyers** — receive order/shipping/account email from a store they recognize
  (display name = store). Must trust the sender enough not to mark spam, and need
  a way to reply/get support.
- **Sellers** — receive onboarding/reset email from Selfkart; their buyers'
  replies must reach them (`Reply-To`). Pilot sellers may *not* own a domain, so
  `Reply-To` may be a personal/Gmail contact captured at `/apply`.
- **Platform ops** — receive `/apply` enquiry notifications at `connect@`.

Scale: handful of pilot sellers, real buyers, low volume — fits a single Resend
sending domain on shared IPs.

## 5. User Stories & Requirements

### P0 — Must Have
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 1 | As a buyer, when I place an order, I get a confirmation email from the store I bought from. | From = `"<Store>" <store+<tenant_id>@mail.myselfkart.com>`; subject + body contain correct order #, items, totals; store name/logo from `tenant_theme_config`; sent within seconds of `order.placed`. |
| 2 | As the platform, every buyer email resolves the *correct* tenant's data and recipient. | Subscriber runs inside `runWithTenantContext`; integration test placing 1 order per tenant concurrently asserts each email's recipient + order body + store name match the origin tenant; **no bleed**. |
| 3 | As a buyer, I can act on the email without a dead end. | `Reply-To` = seller contact email; body includes a deep link to the order/tracking page and the seller's support contact. |
| 4 | As a seller, on approval I receive my admin password + portal URL by email. | `/apply` provisioning sends From `"Selfkart" <noreply@myselfkart.com>`, Reply-To `connect@myselfkart.com`, To seller; one-time credential delivered; send failure surfaces in the provision flow (not silent). |
| 5 | As a seller, I can reset my admin password by email. | Reset request emits a Medusa auth event → email with a tenant-correct reset link; link expires; works for the seller's `/app` login. |
| 6 | As a buyer, I can reset / verify my store account, scoped to the right store. | emailpass create/verify + reset emails sent; reset link resolves to the **correct tenant/store** even when the same email exists at multiple stores; link lands on that store's storefront. |
| 7 | As the platform, deliverability is configured before launch. | `mail.myselfkart.com` (buyer) + `myselfkart.com` (platform) have valid SPF, DKIM, DMARC in Vercel DNS; verified in Resend; seed-inbox + mail-tester pass ≥95% inbox. |
| 8 | As ops, a new `/apply` enquiry notifies us. | Enquiry submission sends a notification to `connect@myselfkart.com` (receiving mailbox handled separately). |

### P1 — Should Have
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 9 | As a buyer, I get a shipping email with a tracking link when my order ships (via Shiprocket). | Fired when an AWB is assigned; `tracking_url` + courier + AWB from the Shiprocket payload in the body; sent under store identity in tenant context. |
| 9a | As a buyer, I get out-for-delivery / delivered updates. | Driven by Shiprocket status webhook; only whitelisted forward transitions email; no out-of-order or duplicate sends. |
| 9b | As the platform, Shiprocket status webhooks resolve to the correct tenant + order. | Per-tenant webhook URL `/webhooks/shiprocket/<tenant_id>` + per-tenant secret verified; handler enters `runWithTenantContext` before any send; webhook maps to the Medusa order via the order id passed at Shiprocket order-creation. |
| 10 | As the platform, I can attribute bounces/complaints to a tenant. | Resend bounce/complaint webhook parsed; `store+<tenant_id>` local part maps the event to a tenant; counter stored per tenant. |
| 11 | As the platform, all email uses one shared, theme-tokened layout. | Single base template (React Email) skinned per store via `tenant_theme_config`, mirroring the storefront theming approach — not N hand-built templates. |
| 12 | As the platform, sends are idempotent. | Route sends through the tenant-scoped `notification` idempotency keys so retries don't double-email. |

### P2 — Nice to Have / Future
| # | User Story | Acceptance Criteria |
|---|-----------|---------------------|
| 13 | As a seller, I can use my own sending domain (Model C). | Opt-in assisted DNS verification via Resend Domains API; From becomes seller domain; reputation isolated per seller. |
| 14 | As the platform, I have a per-tenant email health dashboard. | Delivered/bounce/complaint rates per seller; throttle/alert on bad actors. |
| 15 | As a buyer, replies to store email are captured in-app. | Inbound parsing → seller `/app` inbox (only if a real product need emerges). |

## 6. Solution Overview

**Sending architecture (Shopify pattern):**

```
Buyer-facing (sent on behalf of a store):
  From:     "<Store Name>" <store+<tenant_id>@mail.myselfkart.com>
  Reply-To: <seller contact email captured at /apply>
  To:       <customer email>

Platform-facing (Selfkart → seller / ops):
  From:     "Selfkart" <noreply@myselfkart.com>
  Reply-To: connect@myselfkart.com
  To:       <seller email>  (or connect@ for enquiries)
```

**Key decisions:**
- **Dedicated subdomain `mail.myselfkart.com`** for buyer volume isolates its
  reputation from the apex `myselfkart.com` used for platform/auth mail — a bad
  seller can't tank onboarding/reset deliverability.
- **`store+<tenant_id>` subaddress** gives per-store identity + bounce
  attribution from **one** verified domain (no per-seller DNS).
- **Medusa Notification Module + Resend provider**; subscribers fire on
  `order.placed`, fulfillment, and auth events, each wrapped in
  `runWithTenantContext`.
- **Reply-To delegation** replaces a hosted inbox — no inbound on the sending
  domain.
- **DNS** records added in Vercel DNS (authoritative); a return-path MX on
  `mail.myselfkart.com` does not disturb the apex MX / any `connect@` inbox.

**Data:**
- Seller `contact_email` captured at `/apply` (drives `Reply-To`); stored on the
  tenant registry.
- Reuse the encrypted-credential pattern (`tenant_payment_credentials` shape) if
  any per-tenant email config is needed later (Model C).

**Shipping & fulfillment emails (Shiprocket, multi-tenant):**
- Per-seller Shiprocket credentials configured in **superadmin**, encrypted like
  Razorpay — but Shiprocket auth is a **rotating Bearer token (240h / 10 days)**
  minted from a dedicated API user (email+password), so each tenant needs a
  **token cache + ≤10-day refresh**, not just a stored static key.
- **Tenant routing is free**: each seller has their own Shiprocket account, so the
  webhook (*Settings → API → Webhook*, **URL + Secret**) is inherently per-tenant.
  Set each account's webhook to `/webhooks/shiprocket/<tenant_id>` with a
  per-tenant secret. The context-less handler verifies the secret, derives
  `tenant_id` from the path, then `runWithTenantContext` → no RLS chicken-and-egg
  (this is *easier* than the still-deferred Razorpay shared-processor webhook,
  which needs a non-RLS mapping-table bridge).
- Webhook URL+secret are set **manually in the panel** by the **operator** (who
  holds the seller's creds) during onboarding — not a seller-blocking task. Limit:
  one webhook URL per account.
- Payload provides `event, awb, current_status, courier_name, tracking_url,
  estimated_delivery` — use `tracking_url` directly. Pass the **Medusa order id**
  as Shiprocket's `order_id` at order-creation so the webhook maps straight back.
- Community plugin `medusa-fulfillment-shiprocket` is likely Medusa v1 /
  single-tenant — treat as reference; build a v2 fulfillment provider reading
  per-tenant creds. Verify before scoping.
- Idempotency + ordering: dedupe on `(tenant_id, order_id, awb, status)` via the
  tenant-scoped `notification` keys; only email on whitelisted forward transitions.

## 7. Open Questions

| Question | Owner | Deadline |
|----------|-------|----------|
| Are Vercel nameservers authoritative for `myselfkart.com`? | eng | **RESOLVED: Yes** |
| Does the seller `contact_email` get captured at `/apply`? | eng | **RESOLVED: Yes** |
| Where does `connect@` *receive* (Google Workspace / Zoho / dashboard)? | ops | Before enquiry job ships |
| Does Medusa emailpass emit reset/verify events we can subscribe to out of the box, or must we build the token flow? | eng | Sprint 1 spike |
| How is the buyer reset link bound to a tenant when the same email exists at multiple stores? (links to existing per-tenant customer email index work) | eng | Before P0 #6 |
| Resend tier: shared IP acceptable at pilot, threshold to revisit dedicated IP? | eng | Track post-launch |
| Shiprocket: exact header carrying the Webhook Secret (likely `x-api-key`)? | eng | Before Shiprocket phase |
| Shiprocket: full status list → which map to buyer emails; can the webhook URL be set via API to drop the manual onboarding step? | eng | Before Shiprocket phase |
| Is the `medusa-fulfillment-shiprocket` plugin Medusa v2 / multi-tenant, or must we write a v2 provider? | eng | Shiprocket spike |

## 8. Timeline & Phasing

**v1 (launch) — shared-domain sending**
1. DNS + Resend domain verification (`mail.myselfkart.com` + `myselfkart.com`); seed-inbox deliverability check. *(P0 #7)*
2. Medusa Notification Module + Resend provider wired; shared React Email base template skinned per store. *(P1 #11)*
3. Tenant-context-safe subscriber for `order.placed` → confirmation, with integration test for no bleed. *(P0 #1, #2, #3)*
4. Platform jobs: onboarding credential + admin reset + enquiry notification. *(P0 #4, #5, #8)*
5. Buyer emailpass create/verify + reset with tenant-correct link. *(P0 #6)*

**Fast-follow (sprint 1 post-launch)**
- Bounce/complaint webhook → per-tenant attribution. *(P1 #10)*
- Idempotency via `notification` keys. *(P1 #12)*

**Shipping phase (after Shiprocket multi-tenant provider lands)**
1. Spike: confirm plugin version + Shiprocket webhook secret header + status list. *(open questions)*
2. Per-tenant Shiprocket creds in superadmin (email+password encrypted) + token cache/refresh.
3. v2 fulfillment provider (per-tenant creds) + pass Medusa order id as Shiprocket `order_id`.
4. `/webhooks/shiprocket/<tenant_id>` handler: verify secret → `runWithTenantContext` → map order. *(P1 #9b)*
5. Shipped (AWB) email; then out-for-delivery/delivered on whitelisted transitions. *(P1 #9, #9a)*

**Later (opt-in)**
- Model C per-seller sending domains via Resend Domains API. *(P2 #13)*
- Per-tenant email health dashboard. *(P2 #14)*

**Go/No-Go for v1:** DNS auth verified · order-confirmation tenant-context test green · buyer mail carries Reply-To + support link + order deep link · onboarding email delivered automatically · reset links tenant-correct.
