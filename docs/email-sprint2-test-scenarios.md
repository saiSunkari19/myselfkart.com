# Test Scenarios: Sprint 2 Transactional Email

**Source**: Sprint 2 stories C-2, C-3, P-1, P-3 (commit `507638478`)
**Total scenarios**: 24
**Coverage**: happy path · multi-tenant isolation · fail-closed · non-blocking/non-fatal · idempotency · security · config/deliverability

Legend — **Auto** = automatable now (DB/code/HTTP), **Manual** = needs running app + inbox, **Mock** = needs Resend/SMTP mock.

---

## C-3 — Customer password reset

### S1: Happy path — reset email sent under store identity  *(Manual)*
**Tests**: C-3 | **Preconditions**: tenant A active with `store_config.store_name`+`contact_email`, customer `buyer@x.com` registered on A. **Role**: buyer.
| Step | Action | Expected |
|---|---|---|
| 1 | POST `/store/auth/customer/emailpass/reset-password` `{email:buyer@x.com}` on host A | 201 |
| 2 | Inspect sent email | From `"<A name>" <store+<A_id>@myselfkart.com>`, Reply-To = A's `contact_email`, link `https://<A host>/reset-password?token=…&email=…` |
| 3 | Open link, set new password | reset succeeds; can log into A |
**Priority**: Critical

### S2: Cross-tenant isolation — same email at two stores  *(Auto-ish / Manual)*
**Tests**: C-3 (no bleed) | **Preconditions**: `buyer@x.com` registered on tenant A **and** tenant B; both have distinct store_name/host/contact_email.
| Step | Action | Expected |
|---|---|---|
| 1 | Reset request on **host B** | event carries `metadata.tenant_id = B`; email From `store+<B_id>@…`, Reply-To B's contact, link to **B** host |
| 2 | Reset request on **host A** | From `store+<A_id>@…`, link to **A** host |
| 3 | Diff the two emails | zero overlap of tenant id / host / reply-to; B email never references A |
**Priority**: Critical

### S3: No email-existence disclosure  *(Auto — HTTP)*
| Step | Action | Expected |
|---|---|---|
| 1 | Reset for a **non-existent** email | **201** (same as existing); no error/timing signal; no email sent |
| 2 | Reset with empty/missing email body | 201; no send |
**Priority**: High

### S4: Tenant has no primary host  *(Auto — code/DB)*
**Preconditions**: tenant with no `tenant_domains.is_primary=true` row.
| 1 | Reset request | subscriber logs `no primary host…`, **skips send** (fail-closed), no crash |
**Priority**: High

### S5: Event missing tenant_id metadata  *(Auto — unit)*
| 1 | Emit `auth.password_reset` with no `metadata.tenant_id` | subscriber logs warn, returns, **no send** |
**Priority**: High

### S6: Non-customer actor ignored  *(Auto — unit)*
| 1 | `auth.password_reset` with `actor_type:"user"` (admin) | subscriber returns early; **no customer email** |
**Priority**: Medium *(note: this is why P-2 admin reset is still TODO)*

### S7: Retry idempotency  *(Auto — code)*
| 1 | Same reset event delivered twice (same token) | `idempotencyKey password-reset:<tenant>:<token>` dedupes → at most one send |
**Priority**: Medium

### S8: Store name HTML-injection safe  *(Auto — unit)*
**Preconditions**: `store_name = 'Evil"<script>,Co'`.
| 1 | Render reset email | display name sanitized (no `<`,`>`,`"`,newline,comma); header not broken; body escaped |
**Priority**: High

---

## C-2 — Welcome email

### S9: Happy path — welcome on new account  *(Manual)*
| 1 | POST `/store/auth/customer/emailpass/register` new email on host A | 200 + token; welcome email From A identity, "Start shopping" → A host |
**Priority**: High

### S10: No welcome on existing-email fallback  *(Auto — code)*
**Preconditions**: email already a global emailpass identity.
| 1 | Register same email on host B with correct password | 200 + token (authenticate fallback); **`isNewAccount=false` → NO welcome email** |
**Priority**: High

### S11: Welcome failure never breaks signup  *(Auto — code)*
| 1 | Force `sendWelcomeEmail` to throw (e.g. notification down) | register still returns 200 + token; error swallowed; fire-and-forget |
**Priority**: Critical

### S12: Welcome with no tenant context  *(Auto — code)*
| 1 | Call register path with no `/store*` tenant context | `getTenantContext()?.tenantId` undefined → welcome skipped, signup unaffected |
**Priority**: Medium

### S13: Wrong-password on existing email  *(Auto — HTTP)*
| 1 | Register existing email + wrong password | 4xx "account already exists, sign in"; no welcome |
**Priority**: Medium

---

## P-1 — Seller onboarding email

### S14: Happy path — credentials emailed on approval  *(Manual)*
| 1 | Approve a pending application | provisioning runs; seller receives email From `noreply@myselfkart.com`, Reply-To `connect@`, with login email + temp password + admin URL + storefront URL |
| 2 | Operator console | still shows one-time credential in API response |
**Priority**: Critical

### S15: Mail failure does not fail provisioning  *(Auto — code)*
| 1 | Make `sendPlatformEmail` throw after step 4 | application still flips to `active`; `provisionSellerFromApplication` returns `{tempPassword,…}`; error logged |
**Priority**: Critical

### S16: Provisioning failure → no onboarding email  *(Auto — code)*
| 1 | Force a step (1–4) to throw | application = `failed`; onboarding email **not** sent |
**Priority**: High

### S17: Re-approval idempotency  *(Auto — code/Manual)*
| 1 | Approve, then re-run approval for same tenant | `idempotencyKey seller-onboarding:<tenant>` prevents a duplicate onboarding email |
**Priority**: Medium

### S18: Temp password renders intact  *(Auto — unit)*
| 1 | base64url temp password through `renderStoreEmail` rows | value not HTML-mangled/escaped into unusability; copy-paste works |
**Priority**: High

---

## P-3 — Enquiry notification

### S19: Happy path — ops notified  *(Manual)*
| 1 | POST `/selfkart/applications` valid body | 201 `{pending}`; ops inbox (`SELFKART_ENQUIRY_TO`/`RESEND_REPLY_TO`/`connect@`) gets email with store/owner/email/phone/subdomain/market/notes; reply-to = applicant |
**Priority**: High

### S20: Validation failure → no notification  *(Auto — HTTP)*
| 1 | POST invalid body (bad email, reserved subdomain) | 422; **no enquiry email** |
**Priority**: Medium

### S21: Duplicate email/subdomain → no notification  *(Auto — HTTP)*
| 1 | POST with an email/subdomain already in use | 409; no email (row not inserted) |
**Priority**: Medium

### S22: Mail failure never blocks the funnel  *(Auto — code)*
| 1 | Force notification to throw | applicant still gets 201; row saved; error swallowed |
**Priority**: High

---

## Cross-cutting

### S23: Provider precedence + fallback  *(Auto — config)*
| 1 | RESEND_* set | Resend owns `email`; local owns `feed` only |
| 2 | RESEND unset, SENDGRID set | SendGrid owns `email` |
| 3 | neither set | local owns `feed`+`email` (dev: logs, no real send) |
| 4 | partial RESEND (key xor from) | boot throws "Resend is incomplete" |
**Priority**: High

### S24: Resend free-tier rate limit  *(Manual/Mock)*
| 1 | Exceed 2 emails/day | Resend returns rate-limit error; provider logs + returns `{}`; **caller not thrown** (signup/checkout/provisioning unaffected) |
**Priority**: High *(real-world blocker — upgrade plan)*

---

## Coverage Matrix
| Requirement | Happy | Isolation | Fail-closed | Non-fatal | Idempotency | Security |
|---|---|---|---|---|---|---|
| C-3 reset | S1 | S2 | S4,S5,S6 | — | S7 | S3,S8 |
| C-2 welcome | S9 | (per-tenant From) | S12 | S11 | (key) | — |
| P-1 onboarding | S14 | — | S16 | S15 | S17 | S18 |
| P-3 enquiry | S19 | — | S20,S21 | S22 | (enquiry:id) | — |
| Config/deliverability | S23 | — | — | S24 | — | — |

## Results — automated run (2026-06-25)
**Executed now (code/DB):**
- ✅ **S8** store-name HTML injection escaped — `tests/integration/rls/email-template.test.js` (raw `<script>` absent, `&lt;script&gt;` present).
- ✅ **S8** row value escaped (no raw `<img onerror>`).
- ✅ **S23** invalid `primaryColor` rejected → default `#111827` (no `</style>`/`<script>` breakout); **S23b** valid hex honored.
- ✅ **S18** base64url temp password + URLs render verbatim in html + text.
- ✅ render structure: always html (`<!doctype`) + non-empty text alternative.
- ✅ **S2 (From component)** disjoint per-tenant senders — `tests/integration/rls/store-sender.test.js` (5/5).
- ✅ **S2 (data feasibility)** confirmed live: one buyer email is a customer at **4 tenants**, each with a **distinct primary host** (elec/stone/cloth/launch .myselfkart.com) — so the reset From + URL are provably per-tenant. Cross-store leak would require the subscriber to ignore `metadata.tenant_id`, which the code does not.

**Verified by code review / logic (deterministic):**
- S3 always-201 (route calls `res.sendStatus(201)` unconditionally; non-existent identity → `throwOnError:false` → no event → no send).
- S5/S6 early returns (no tenant_id metadata / non-customer actor).
- S10 `isNewAccount=false` on authenticate-fallback → no welcome.
- S11/S12/S15/S22 wrapped in try/catch (best-effort/non-fatal); S7/S17 idempotency keys present.

**Still MANUAL (needs running app + inbox; gated by Resend free-tier 2/day):**
- S1, S9, S14, S19 happy-path delivery + header inspection.
- S24 rate-limit behavior already observed (hit the 2/day cap during F-2/C-1 live tests).

## Test Data Requirements
- Two active tenants (A,B) with distinct `store_config` (store_name, contact_email, primary_color) and distinct primary `tenant_domains` hosts.
- One buyer email registered on **both** A and B (the cross-tenant case).
- A pending `seller_applications` row to approve (P-1) and an invalid + duplicate one (P-3).
- A store_config row with a malicious `store_name` for S8/injection.
- Resend test key (or a notification mock) + a way to force send failures (S11,S15,S22).
