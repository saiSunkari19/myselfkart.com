# Backlog: Transactional Email + Shipping (Selfkart)

**Format**: User Stories (INVEST, 3 C's)
**Source of truth**: `docs/email-transactional-v1-prd.md`
**Date**: 2026-06-24
**Total stories**: 21 (2 spikes, 4 foundation, 3 platform, 4 customer, 8 shipping)

Epics, in dependency order:
- **E0 — Spikes** (unblock estimation)
- **E1 — Foundation** (sending plumbing; everything depends on it)
- **E2 — Platform & seller email**
- **E3 — Customer (buyer) email**
- **E4 — Shipping (Shiprocket) provider + email**

Cross-cutting AC applied to **every buyer-facing send** (E3, E4): runs inside
`runWithTenantContext`; correct recipient + correct store data (no cross-tenant
bleed); `From` = `"<Store>" <store+<tenant_id>@mail.myselfkart.com>`; `Reply-To` =
seller `contact_email`; idempotent via tenant-scoped `notification` keys.

---

## E0 — Spikes

### S-A: Spike — Medusa 2.15.5 emailpass reset/verify events
**As an engineer, I want to know whether Medusa's emailpass provider emits reset/verify events, so that I can estimate the customer auth-email stories.**

Acceptance Criteria:
- [ ] Documented: does `generateResetPasswordToken` / account-creation emit a subscribable event + payload (token, identity, scope)?
- [ ] Documented: can we derive/attach the **tenant** to that event, or must the storefront pass it?
- [ ] Decision recorded: use built-in event vs. build a custom token flow.
- [ ] Output feeds AC of C-2 and C-3.

**RESOLVED 2026-06-24:**
- Customer password reset **is built-in**: `generateResetPasswordTokenWorkflow` (core-flows) emits `auth.password_reset` `{entity_id, actor_type, token, metadata}`. No custom token flow needed.
- **The repo already implements it tenant-scoped**: `api/store/auth/customer/emailpass/reset-password/route.ts` passes `metadata.tenant_id` + always-201 (no email-existence leak); `subscribers/customer-password-reset.ts` builds a SERVER-DERIVED reset URL from the tenant's primary `tenant_domains` host → **C-3's hard part is done**.
- **No built-in account verification** for emailpass: `register/route.ts` just creates the credential + returns a token. → C-2 re-scoped to a welcome email (true verification = custom flow, defer).
- **Current provider = SendGrid** (`medusa-config.ts`) + local fallback; reset subscriber uses a SendGrid template id and sets **no From/Reply-To**. → must swap to Resend (F-2) + inject sender identity (F-3).
- **Admin reset** can reuse `generateResetPasswordTokenWorkflow` with `actorType: "user"`.

Priority: P0 | Effort: S | Dependencies: none — **DONE**

### S-B: Spike — Shiprocket webhook secret header + status list
**As an engineer, I want the exact webhook auth header and the full status vocabulary, so that I can build a correct, secure webhook handler.**

Acceptance Criteria:
- [ ] Confirmed header name carrying the Webhook Secret (e.g. `x-api-key`) by configuring *Settings → API → Webhook* on the test account.
- [ ] Full list of Shiprocket statuses captured; mapped to email triggers (Shipped/AWB, Out-for-Delivery, Delivered) vs. ignored (RTO/NDR/etc.).
- [ ] One real webhook payload captured (fields: `awb`, `current_status`, `channel_order_id`, `tracking_url`, courier).
- [ ] Output feeds AC of SH-5, SH-6, SH-7.

Priority: P0 | Effort: S | Dependencies: none

---

## E1 — Foundation

### F-1: Verify sending domains in Vercel DNS + Resend
**As the platform, I want `mail.myselfkart.com` and `myselfkart.com` authenticated, so that mail reaches the inbox.**

Acceptance Criteria:
- [ ] SPF, DKIM, DMARC (+ return-path) records added in Vercel DNS for `mail.myselfkart.com` (buyer) and `myselfkart.com` (platform).
- [ ] Both domains show "verified" in Resend.
- [ ] Return-path MX on `mail.myselfkart.com` does not disturb apex MX / `connect@`.
- [ ] Seed-inbox + mail-tester score ≥95% inbox, DMARC aligned.

**DONE 2026-06-24:** `myselfkart.com` verified in Resend (DKIM `resend._domainkey`, SPF `send` TXT/MX via Amazon SES, DMARC `p=none`), Vercel DNS authoritative. **Decision: use the apex `myselfkart.com` for sending** (not a `mail.` subdomain) — simpler; reputation isolation can be added later non-breaking. Old SendGrid DNS records remain (harmless). Seed-inbox score check still TODO.

Priority: P0 | Effort: S | Dependencies: none — **DONE (apex)**

### F-2: Wire Resend behind Medusa Notification Module
**As an engineer, I want a Resend notification provider registered, so that all sends go through one swappable interface.**

Acceptance Criteria:
- [ ] Resend provider registered in `medusa-config.ts`; API key from env.
- [ ] A smoke send delivers a test email via Resend.
- [ ] Provider supports per-send `from`, `reply-to`, `to`, html/text.
- [ ] No send path bypasses the Notification Module.

**DONE 2026-06-24 — code complete, tsc green, live smoke send verified (HTTP 200):** added custom `src/modules/resend` (`ResendNotificationProviderService` + `ModuleProvider`); wired in `medusa-config.ts` env-gated (`RESEND_API_KEY`/`RESEND_FROM`/`RESEND_REPLY_TO`), precedence Resend → SendGrid → local for the `email` channel; reads per-notification `from`/`reply_to` for the multi-tenant sender. Installed `resend ^6.14.0`. Smoke email sent from `noreply@myselfkart.com` via the Resend API.

Priority: P0 | Effort: S | Dependencies: none

### F-3: Tenant-context-safe send helper + no-bleed test
**As an engineer, I want a helper that builds the correct sender identity per tenant and a regression test, so that buyer mail can never leak across tenants.**

Acceptance Criteria:
- [ ] Helper resolves `store+<tenant_id>@mail.myselfkart.com`, store display name (from `tenant_theme_config`), and seller `contact_email` for `Reply-To`.
- [ ] Helper refuses to send if no tenant context (fail-closed).
- [ ] Integration test: place 1 order per tenant concurrently → each email's recipient + store name + order data match origin tenant; **0 bleed**.
- [ ] Idempotency: a repeated `(tenant, entity, type)` send is suppressed.

**DONE 2026-06-24 — tsc green, 5/5 unit tests pass:** `src/lib/store-sender.ts` (pure `buildStoreFrom`/`sanitizeDisplayName`/`getSendingDomain`, fail-closed on missing tenantId) + `src/lib/store-email.ts` (`resolveStoreSender` reads non-RLS `store_config`+`tenant_domains` by explicit tenant_id; `sendStoreEmail` dispatches via Notification Module with per-tenant `from`/`reply_to`, idempotency_key passthrough). No-bleed unit test `tests/integration/rls/store-sender.test.js` (ts-node transpile-only). Full place-an-order no-bleed assertion lands with C-1.

Priority: P0 | Effort: M | Dependencies: F-2

### F-4: Shared branded email template (theme-tokened)
**As the platform, I want one base template skinned per store, so that we don't maintain N templates and buyers see store branding.**

Acceptance Criteria:
- [ ] Single React Email base layout; store logo/colors/name injected from `tenant_theme_config`.
- [ ] Renders valid HTML + plain-text alternative; dark-mode safe.
- [ ] Slots for: title, body, primary CTA (deep link), seller support contact/footer.
- [ ] Snapshot test for two distinct store themes.

Priority: P0 | Effort: M | Dependencies: F-2

---

## E2 — Platform & Seller Email

### P-1: Seller onboarding email (credential + portal URL)
**As a newly approved seller, I want my admin password and portal link emailed, so that I can log in without relying on the console.**

Acceptance Criteria:
- [ ] On `/apply` approval + provisioning, an email sends From `"Selfkart" <noreply@myselfkart.com>`, Reply-To `connect@myselfkart.com`, To seller.
- [ ] Body: one-time password + `/app` portal URL + getting-started note.
- [ ] Send failure surfaces in the provision flow (not silent); retryable.
- [ ] No tenant context required (platform-scoped send).

Priority: P0 | Effort: S | Dependencies: F-2, F-4

### P-2: Seller admin password reset email
**As a seller, I want to reset my `/app` password by email, so that I can recover access.**

Acceptance Criteria:
- [ ] Reset request triggers a platform email with a working, expiring reset link.
- [ ] From/Reply-To use the platform identity (noreply/connect@).
- [ ] Link resolves the seller to the correct tenant on completion.
- [ ] Rate-limited; no account-existence disclosure.

Priority: P0 | Effort: M | Dependencies: F-2, S-A (auth pattern)

### P-3: /apply enquiry notification to connect@
**As ops, I want a notification when someone applies, so that I can action it.**

Acceptance Criteria:
- [ ] Enquiry submission sends a notification email to `connect@myselfkart.com` with applicant details.
- [ ] From platform identity; idempotent per application.
- [ ] *(Out of scope: where `connect@` receives — see open question.)*

Priority: P1 | Effort: S | Dependencies: F-2

---

## E3 — Customer (Buyer) Email

### C-1: Order-placed confirmation
**As a buyer, I want an order confirmation from the store I bought from, so that I trust the purchase went through.**

Acceptance Criteria:
- [ ] Subscriber on `order.placed` fires inside `runWithTenantContext`.
- [ ] Email shows correct order #, items, totals, store branding; deep link to order page; seller support contact.
- [ ] All cross-cutting buyer-mail AC met (no bleed, Reply-To, idempotent).
- [ ] Covered by the F-3 no-bleed test.

Priority: P0 | Effort: M | Dependencies: F-3, F-4

### C-2: emailpass account create / verify
**As a buyer creating an account at a store, I want a verification email, so that I can confirm my address.**

Acceptance Criteria:
- [ ] Triggered on emailpass registration; sent under the correct store identity.
- [ ] Verify link resolves to the **correct store/tenant**.
- [ ] Cross-cutting buyer-mail AC met.
- [ ] Implementation follows S-A decision (built-in event vs. custom flow).

Priority: P0 | Effort: M | Dependencies: S-A, F-3, F-4

### C-3: emailpass password reset (tenant-scoped link)
**As a buyer, I want to reset my store password, so that I can log back in — even if I use the same email at multiple stores.**

Acceptance Criteria:
- [ ] Reset link binds to the **specific tenant/store** the request originated from.
- [ ] Same email registered at two stores → each reset link lands on the right store and only resets that store's credential (no cross-store disclosure).
- [ ] Cross-cutting buyer-mail AC met; link expires; rate-limited.
- [ ] Regression test for the multi-store same-email case (links to existing per-tenant customer email index work).

Priority: P0 | Effort: M | Dependencies: S-A, F-3, C-2

### C-4: Order deep-link + support block in buyer emails
**As a buyer, I want a way to track/get help from any email, so that no-reply isn't a dead end.**

Acceptance Criteria:
- [ ] Every buyer email body includes a deep link to the order/tracking page.
- [ ] Seller support contact rendered; `Reply-To` = seller `contact_email`.
- [ ] Verified present in C-1 and all E4 shipping emails.

Priority: P0 | Effort: S | Dependencies: F-4

---

## E4 — Shipping (Shiprocket)

### SH-1: Per-seller Shiprocket credentials in superadmin
**As an operator, I want to store each seller's Shiprocket API user + secret, so that the platform can ship on their behalf — like Razorpay.**

Acceptance Criteria:
- [ ] Superadmin UI to enter Shiprocket API-user email + password (encrypted at rest, readiness-status only in responses).
- [ ] A generated per-tenant `webhook_secret` stored alongside.
- [ ] Reuses the `tenant_payment_credentials`-style shape; never returns secrets.
- [ ] Readiness indicator (configured / not).

Priority: P0 | Effort: M | Dependencies: none

### SH-2: Per-tenant token mint + ≤10-day refresh
**As the platform, I want a cached Shiprocket Bearer token per tenant that auto-refreshes, so that API calls don't fail after 10 days.**

Acceptance Criteria:
- [ ] On demand, mint token via `POST /auth/login` using the tenant's stored creds.
- [ ] Token cached per tenant; refreshed before the 240h expiry (scheduled job).
- [ ] Auth failure (rotated/invalid creds) surfaces as a readiness error, not a silent shipping break.
- [ ] No creds/token logged.

Priority: P0 | Effort: M | Dependencies: SH-1

### SH-3: v2 Shiprocket fulfillment provider
**As the platform, I want a Medusa v2 fulfillment provider reading per-tenant creds, so that sellers can fulfill via Shiprocket (v1 plugin is reference only).**

Acceptance Criteria:
- [ ] Implements the v2 `AbstractFulfillmentProviderService`; resolves per-tenant token (SH-2).
- [ ] Create-order maps Medusa order → adhoc payload (per `forward-order.js` reference), using a valid `pickup_location`.
- [ ] Passes Medusa order id as Shiprocket `order_id` (echoed as `channel_order_id`).
- [ ] Serviceability/courier list available; errors fail-closed under tenant context.

Priority: P0 | Effort: L | Dependencies: SH-2

### SH-4: Order→shipment mapping record (non-RLS bridge)
**As the platform, I want a stored map from Shiprocket identifiers to tenant+order, so that a context-less webhook can reconcile.**

Acceptance Criteria:
- [ ] At ship-creation (in tenant context) persist `(channel_order_id / awb / shipment_id) → tenant_id, medusa_order_id`.
- [ ] Readable by the webhook handler without tenant context (platform table, same posture as `tenants`).
- [ ] Backfills `awb` when assigned.
- [ ] Note: webhook primarily resolves tenant from the per-tenant URL (SH-6); this map resolves the **order**.

Priority: P0 | Effort: S | Dependencies: SH-3

### SH-5: Status → email transition state machine
**As the platform, I want a per-order shipping status ledger, so that buyers get correct, in-order, de-duplicated emails.**

Acceptance Criteria:
- [ ] Per-order last-emailed status stored; only whitelisted **forward** transitions trigger email (Shipped → Out-for-Delivery → Delivered).
- [ ] Out-of-order or duplicate webhooks do not re-send.
- [ ] Ignored statuses (RTO/NDR/etc.) documented per S-B.
- [ ] Unit tests for out-of-order + duplicate inputs.

Priority: P0 | Effort: M | Dependencies: S-B

### SH-6: Per-tenant Shiprocket webhook handler
**As the platform, I want `/webhooks/shiprocket/<tenant_id>` to authenticate and route correctly, so that shipping events fire the right tenant's email safely.**

Acceptance Criteria:
- [ ] Verifies the per-tenant secret (header confirmed in S-B); rejects bad/missing secret.
- [ ] Derives `tenant_id` from the URL path; enters `runWithTenantContext`.
- [ ] Resolves the Medusa order via SH-4 (`channel_order_id`).
- [ ] Forged/unknown payloads rejected; no cross-tenant access.

Priority: P0 | Effort: M | Dependencies: SH-4, SH-5, S-B

### SH-7: Buyer shipping emails (shipped / out-for-delivery / delivered)
**As a buyer, I want shipping updates with a tracking link, so that I know where my order is.**

Acceptance Criteria:
- [ ] On whitelisted transitions (SH-5), send buyer email under store identity with `tracking_url`, courier, AWB.
- [ ] All cross-cutting buyer-mail AC met (tenant context, no bleed, Reply-To, idempotent via notification keys + SH-5).
- [ ] Multi-package: one email per fulfillment/AWB, correct tracking per shipment.
- [ ] Covered by an integration test simulating webhook events for two tenants.

Priority: P0 | Effort: M | Dependencies: SH-6, F-3, F-4

### SH-8: Operator onboarding step — set webhook URL + secret
**As an operator, I want a checklist/automation to set each seller's Shiprocket webhook, so that events actually reach us.**

Acceptance Criteria:
- [ ] Onboarding runbook (or API if available per S-B) sets the seller's panel webhook URL to `/webhooks/shiprocket/<tenant_id>` + the stored secret.
- [ ] Readiness check confirms a test event was received per tenant.
- [ ] Documents the one-webhook-per-account limit.

Priority: P1 | Effort: S | Dependencies: SH-1, SH-6

---

## Story Map

```
Must-have (P0):  S-A S-B | F-1 F-2 F-3 F-4 | P-1 P-2 | C-1 C-2 C-3 C-4 |
                 SH-1 SH-2 SH-3 SH-4 SH-5 SH-6 SH-7
Should-have(P1): P-3 | SH-8
Later (P2, in PRD): bounce/complaint dashboard · Model C per-seller domains
```

Critical path: **S-A/S-B → F-1..F-4 → (P-1, C-1) → C-2/C-3 → SH-1→SH-2→SH-3→SH-4→SH-6→SH-7**

## Technical Notes
- All buyer sends route through the F-3 helper; no ad-hoc Resend calls.
- New platform (non-RLS) table for SH-4, same posture as `tenants`/`tenant_domains`.
- Reuse encrypted-credential pattern from Razorpay for SH-1; add token cache for SH-2 (Razorpay had none).
- Subscribers/webhooks must wrap in `runWithTenantContext` — enforced by F-3 fail-closed.

## Open Questions
- Where does `connect@` *receive* (Workspace/Zoho/dashboard)? — blocks P-3 usefulness, not the send.
- Shiprocket webhook URL settable via API? — if yes, SH-8 becomes automated, not manual.
- Multi-package frequency for pilot sellers — sizes SH-7's per-fulfillment handling.

## Execution Log — 2026-06-24/25
- **S-A** ✅ emailpass reset built-in & tenant-scoped already; verify = welcome email (deferred); provider swap = the work.
- **F-1** ✅ `myselfkart.com` verified in Resend (apex; DKIM/SPF/DMARC in Vercel DNS). Decision: send from apex, not `mail.` subdomain.
- **F-2** ✅ custom `src/modules/resend` provider (per-notification from/reply_to), wired in `medusa-config.ts` (Resend→SendGrid→local). Live smoke send OK.
- **F-3** ✅ `src/lib/store-sender.ts` + `src/lib/store-email.ts`; 5/5 no-bleed unit tests (`tests/integration/rls/store-sender.test.js`).
- **F-4** ✅ `src/lib/email-template.ts` `renderStoreEmail()` — branded, escaped, html+text.
- **C-1** ✅ code: `src/subscribers/order-placed-email.ts` (`order.placed` → resolve tenant via bridge → `runWithTenantContext` → render → `sendStoreEmail`); bridge `src/migration-scripts/20260625000100-order-tenant-map.ts` (non-RLS `order_tenant_map` + exception-safe AFTER INSERT trigger; reused by SH-4). **Bridge applied LIVE to Neon + 18 orders backfilled.** Live email of real order #28 ("Electric", Samsung S24 Ultra ₹131,999) delivered via Resend from `store+<tenantId>@myselfkart.com`. tsc green.
- **Caveats:** Resend free tier = **2 emails/day** (hit today) — needs paid plan for volume. Subscriber fires on the next real order once the running backend reloads the new files (not yet restarted). Full in-app checkout→subscriber path not yet exercised by a live order; F-3+F-4+Resend proven with real data.
- **SH webhook receiver** ✅ `POST /webhooks/delivery/[tenant_id]` (x-api-key via SHIPROCKET_WEBHOOK_SECRET; shipped/out-for-delivery/delivered; ack-200 always). Deployed. URL/token entered in Shiprocket panel. render.yaml + .env.example updated. **Pushed + deployed.**

## Execution Log — Sprint 2 (2026-06-25)
- **C-3** ✅ `customer-password-reset.ts` subscriber refactored off SendGrid template → `renderStoreEmail` + `sendStoreEmail` (Resend, per-tenant From/Reply-To, branded, tenant-correct reset URL unchanged).
- **C-2** ✅ welcome email on new emailpass account (`register/route.ts`, fire-and-forget, best-effort). No built-in verify event → welcome, not verify.
- **P-1** ✅ seller onboarding email (credentials + portal URL) in `provision-seller.ts` after provisioning — closes the lost-credential gap. Platform identity, non-fatal.
- **P-3** ✅ `/apply` enquiry notification to ops (`applications/route.ts`) — platform identity, reply_to = applicant, non-fatal.
- New helper `sendPlatformEmail()` (src/lib/store-email.ts) for Selfkart→seller/ops mail (noreply@ + connect@). tsc green.

## Execution Log — Sprint 3 shipping (2026-06-25)
- **SH-1** ✅ `tenant_shiprocket_credentials` table (encrypted api_email/password + optional per-tenant webhook secret + pickup_location) + repo accessors (reuse aes-256-gcm helpers). Operator surface: superadmin API `GET/POST /selfkart/platform/tenants/[id]/shiprocket-credentials` **and** CLI `pnpm set:shiprocket` (env-driven). Migration `20260625000200`. **Tables applied LIVE to Neon.**
- **SH-2** ✅ per-tenant token cache `src/lib/shiprocket/token.ts` (240h TTL, refresh <24h) + `client.ts` (fetch-based: login, createAdhocOrder, getPickupLocations) + `credentials.ts` (resolve/enabled/webhook-secret).
- **SH-3** ✅ push subscriber `src/subscribers/order-placed-shiprocket.ts` on `order.placed` → only enabled tenants → idempotent via `order_shiprocket` → creates Shiprocket adhoc order with `order_id = Medusa order.id` (echoed back as webhook `channel_order_id`); pickup = configured or account primary; addresses/items from the order; defaults for dims/weight.
- **SH-6 hardening** ✅ webhook handler now prefers the **per-tenant** webhook secret, env `SHIPROCKET_WEBHOOK_SECRET` as fallback.
- tsc green. **Deferred:** superadmin UI form for Shiprocket creds (API + CLI exist); full v2 fulfillment provider (push-on-order subscriber chosen for v1); multi-package/COD handling; forward-only status ledger (SH-5 dedupes via notification key today).
- **Remaining elsewhere:** P-2 self-serve seller admin reset (`auth.password_reset` actor_type "user").
