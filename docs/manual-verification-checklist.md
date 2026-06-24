# Manual Verification Checklist — Email v1 + Shipping

**Covers commits** `09c01217b` → `4885a4763` (email v1, Sprint 2 emails, Shiprocket creds/token/push/webhook, superadmin Shiprocket UI, P-2 admin reset).
**How to use:** go top to bottom, tick each box, note anything that fails (with the log line / screenshot). Start with Prereqs — most failures trace back there.

---

## 0. Prerequisites (do these first)
- [ ] **Deploy the latest commit** (`4885a4763`) — both `selfkart-medusa` and `selfkart-superadmin` on Render.
- [ ] **Render env (backend)** set: `RESEND_API_KEY`, `RESEND_FROM=noreply@myselfkart.com`, `RESEND_REPLY_TO=connect@myselfkart.com`, `SELFKART_EMAIL_DOMAIN=myselfkart.com`, `SHIPROCKET_WEBHOOK_SECRET`, `SELFKART_CREDENTIALS_SECRET` (same value the creds were/will be encrypted with).
- [ ] **⚠ Resend plan:** free tier = **2 emails/day**. This whole checklist sends >2. **Upgrade Resend**, or test in small batches across days. Tip: even when inbox delivery lags, verify sends in **Resend → Logs**.
- [ ] **Pick a test tenant** you'll use throughout. Example: **Electric** `ab018e90-67c7-4990-9841-cce080e9a4de`, host `elec.myselfkart.com`.
- [ ] **Set that tenant's `contact_email`** in its store config (else buyer emails have no Reply-To — expected, but set it to test reply delegation).
- [ ] Have a **buyer email** you control to receive mail.

---

## 1. Customer (buyer) emails

### 1.1 Order confirmation (C-1)
- [ ] Place + complete an order on the test tenant's storefront.
- [ ] Buyer inbox gets **"Order #N confirmed"**.
- [ ] **From** = `"<Store>" <store+<tenant_id>@myselfkart.com>`; **Reply-To** = seller `contact_email`.
- [ ] Body shows correct items, total, store branding (logo/color), and a **View your order** link to the store host.
- [ ] DB check (optional): `select * from order_tenant_map where order_id='order_…';` row exists.

### 1.2 Password reset (C-3) + cross-tenant isolation
- [ ] On the store, request password reset for the buyer email → response is **success regardless** (no "email not found" leak).
- [ ] Email arrives: branded, **Reset your password** button → link host = **this** store's host.
- [ ] **Isolation:** the same email is a customer at 4 stores (elec/stone/cloth/launch). Request reset on **two different** store hosts → each email's link + From point to the **store you requested from** (never the other).
- [ ] Open a reset link → set new password → can log in on that store.

### 1.3 Welcome email (C-2)
- [ ] Register a **brand-new** email on the store → **Welcome to <Store>** email arrives; signup still succeeds instantly.
- [ ] Register an **already-existing** email (correct password) → logs in, **no** welcome email (fallback path).

---

## 2. Platform / seller emails

### 2.1 Seller onboarding (P-1)
- [ ] In the superadmin console, **approve a pending application** (or create one via `/apply` then approve).
- [ ] The seller's email gets **"Your Selfkart store '…' is ready"** from `noreply@myselfkart.com` (Reply-To `connect@`), containing: admin login email, temp password, admin URL, storefront URL.
- [ ] The operator response/console still shows the one-time credential (mail is a bonus, not the only copy).

### 2.2 Seller admin self-reset (P-2)
- [ ] Go to the Medusa Admin login (`https://api.myselfkart.com/app`) → **"Forgot password?"** → enter the seller admin email.
- [ ] Reset email arrives from `noreply@` with a **/app/reset-password** link.
- [ ] Open it → set a new password → seller can log into `/app`.
- [ ] *(If no email: confirm the stock admin "Forgot password?" actually fires `auth.password_reset` — check backend logs for `[admin-password-reset]`.)*

### 2.3 Enquiry notification (P-3)
- [ ] Submit the public `/apply` form with valid data.
- [ ] Ops inbox (`SELFKART_ENQUIRY_TO` / `RESEND_REPLY_TO` / `connect@`) gets **"New seller application: …"** with store/owner/email/phone/subdomain/market/notes; **Reply-To = applicant**.
- [ ] Submit invalid (bad email / reserved subdomain) → 422, **no** email. Submit a duplicate email/subdomain → 409, **no** email.

---

## 3. Shipping (Shiprocket)

### 3.1 Superadmin Shiprocket UI
- [ ] Open the test tenant in the console → **Shipping** panel is present (below Payments).
- [ ] Enter **API user email** + **API password** (test account: `swati23793@gmail.com` / its API password).
- [ ] Click **Test connection** → shows **✓ Connected · pickups: Home, work**.
- [ ] **Pickup location** field now autocompletes those names (datalist); pick **Home**.
- [ ] Click **Copy** on the webhook URL → clipboard has `https://api.myselfkart.com/webhooks/delivery/<tenant_id>`.
- [ ] (Optional) enter a per-tenant **Webhook token**; **Enable** + **Save** → readiness chip flips to **Enabled**, line shows "Pushing orders · API user …".
- [ ] Negative: enter a wrong password → **Test connection** shows **✗** with the auth error (caught before save).

### 3.2 Register the webhook in Shiprocket
- [ ] In the Shiprocket account → **Settings → API → Webhook**: paste the copied URL, Auth Token Type **x-api-key**, Token = the per-tenant token you saved (or the env `SHIPROCKET_WEBHOOK_SECRET` if you left it blank) → **Save**.
- [ ] Click **Test Webhook** → **200 OK** (no email — sample payload has no real order id).

### 3.3 Order push (SH-3)
- [ ] Place an order on the **same** test tenant's storefront (must have a shipping address).
- [ ] **Shiprocket dashboard → Orders**: a NEW order appears; its `channel_order_id` = the Medusa `order_…` id.
- [ ] DB check: `select * from order_shiprocket where order_id='order_…';` row with a `shipment_id`.
- [ ] Backend logs show `[shiprocket-push] pushed order …`.

### 3.4 Status emails (SH-6/7) — the full loop
- [ ] In Shiprocket, process the order: assign courier/AWB (Shipped) → Out for Delivery → Delivered.
- [ ] Buyer inbox gets **Shipped / Out for delivery / Delivered** emails (store identity, tracking link, AWB/courier in the body).
- [ ] Duplicate/late status webhooks do **not** re-send the same stage (idempotency key).

---

## 4. Multi-tenant isolation spot-checks
- [ ] Configure Shiprocket for **one** tenant only → other tenants' orders are **not** pushed (push runs for enabled tenants only).
- [ ] A status webhook to `/webhooks/delivery/<tenantA>` only ever resolves Tenant A's order (wrong/foreign `channel_order_id` → acked, no email).
- [ ] Buyer emails for two different stores never show the other store's identity (covered by 1.2 isolation).

---

## 5. If something fails — quick triage
| Symptom | Likely cause |
|---|---|
| No buyer email at all | Resend 2/day cap hit → check Resend Logs; or `RESEND_*` env missing |
| Email sent but no Reply-To | tenant `contact_email` not set (expected) |
| Shiprocket "Test connection" fails | wrong API user/password, or API user email == login email (Shiprocket rejects) |
| Order not pushed to Shiprocket | tenant not Enabled, no shipping address, or no pickup location |
| `set:shiprocket`/saved creds can't decrypt | `SELFKART_CREDENTIALS_SECRET` differs between where saved vs. running backend |
| Admin reset email missing | stock `/app` "Forgot password?" may not be firing — check `[admin-password-reset]` logs |
| Webhook 401 | x-api-key token in Shiprocket panel ≠ per-tenant secret / env `SHIPROCKET_WEBHOOK_SECRET` |

---

### Coverage map (feature → section)
Resend provider §0/1 · order confirmation §1.1 · reset §1.2 · welcome §1.3 · onboarding §2.1 · admin reset §2.2 · enquiry §2.3 · Shiprocket creds/token §3.1 · webhook §3.2/3.4 · order push §3.3 · status emails §3.4 · superadmin UI (copy/test/datalist) §3.1 · isolation §4.
