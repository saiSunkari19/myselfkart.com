# MySelfKart — Managed E-commerce for Sellers

> **Positioning (one line):** We are not a website builder. We are the **managed e-commerce operations layer** for sellers who already have customers — Flipkart/Amazon sellers tired of commissions, and Instagram/WhatsApp sellers tired of doing checkout by hand.

This document is the market-analyst answer to: *how should we price and pitch MySelfKart as a SaaS product to attract Flipkart/Amazon sellers and Instagram sellers?*

---

## 1. Market reality (the honest analyst read)

The Indian seller market is **price-sensitive at the top of funnel but support-heavy after onboarding.** Two facts drive every pricing decision below:

1. **An Instagram seller doing ₹50k–₹2L/month in sales will not pay ₹4,999/month to start.** Competitors (Dukaan, Shopify Basic, Bikayi, Instamojo) anchor buyers at the ₹1,000–₹2,500/month range. A ₹4,999 cold-start floor loses the deal before the pitch lands.
2. **Orders — not visitors or products — create 90% of our real cost:** payment webhooks, Shiprocket calls, WhatsApp/email, returns, refunds, and "why hasn't my payout come" support tickets. So **orders must be the metric we price on**, and "unlimited" is a trap we never offer below the top tier.

**Resolution:** Low monthly floor to remove cold-start friction → a one-time setup fee to filter serious sellers and pay for our onboarding labor → premium "managed / done-for-you" tiers that justify higher MRR. This is the middle path between "premium-only" (loses Instagram sellers) and "race to the bottom" (drowns us in support).

### Competitive anchor (why our price is defensible)

| Competitor | Entry price | What they give | Our wedge |
|---|---|---|---|
| Dukaan / Bikayi | ₹999–₹2,500/mo | DIY tool, you do everything | We do the setup + run the tech |
| Shopify Basic | ~₹1,994/mo + txn fees | DIY tool + transaction cut | No per-transaction commission |
| Instamojo | low | Payment-first, weak storefront | Full branded storefront + ops |
| **MySelfKart** | **₹1,999/mo + setup** | **Managed: we build + run it** | **Done-for-you, 0% commission** |

The moat is **"managed / done-for-you," not features.** That is what lets us charge more than Dukaan without being Shopify.

---

## 2. Who this is for (and the pitch for each)

We sell to three nightmares. Speak to the nightmare, not the feature.

| Segment | Their nightmare | Our one-line pitch |
|---|---|---|
| **Flipkart / Amazon sellers** | 15–30% commission, arbitrary bans, no access to customer data | **"Stop renting your business from a marketplace."** Own your store, your customers, 100% of your margin. |
| **Instagram / WhatsApp sellers** | 300 DMs, lost UPI screenshots, manual Shiprocket entry | **"Stop being a DM clerk."** Customers click, pay, and get a tracking link automatically — while you sleep. |
| **Offline retail shops** | Tech is hard, IT staff is expensive, quick-commerce pressure | **"Your shop, online, without the tech headache."** We run the servers and updates. You just pack orders. |

---

## 3. Pricing — the recommended model

Two parts: **a one-time Setup Fee** (pays for onboarding labor + filters tyre-kickers) and a **monthly subscription** (recurring revenue, priced on orders).

### 3.1 Setup fees (one-time)

The setup fee is non-negotiable. It is the single most important filter — it converts "curious" into "committed" and pays for the human hours of onboarding.

| Package | Price | Includes |
|---|---:|---|
| **Basic Launch** | ₹4,999 | 1 template, logo/colors/fonts, up to **50 products** (clean CSV), subdomain, standard pages, Razorpay + Shiprocket setup |
| **Standard Launch** | ₹9,999 | Up to **250 products** (clean CSV), custom domain mapping, categories + collections, all integrations tested |
| **Migration Launch** | ₹19,999 | Up to **1,000 products** (clean CSV), full taxonomy, marketplace migration support |
| **Large Catalog** | ₹19,999 + ₹2–₹5/product over 1,000 | Only with clean catalog data |
| **Custom Template** | ₹49,999+ | A new, reusable design system (treated as a product investment, not a one-off) |

**The "clean CSV" rule (must be stated to every seller):** to qualify for import pricing, the seller must provide name, SKU, price, stock, description, category, image URLs, and variant data in our template. WhatsApp images + random Excel = **manual data-entry billed at ₹20–₹40/product.** Never absorb manual catalog work into a setup fee — it is a services business, not SaaS.

### 3.2 Monthly subscription (recurring) — **priced on orders**

| Plan | Monthly | Annual (≈2 months free) | Orders/mo | Products | Built for |
|---|---:|---:|---:|---:|---|
| **Starter** | ₹1,999 | ₹19,999/yr | 150 | 500 | Serious small / new sellers |
| **Growth** ⭐ | ₹3,999 | ₹39,999/yr | 500 | 2,000 | Active Instagram / marketplace sellers |
| **Scale** | ₹6,999 | ₹69,999/yr | 1,000 | 5,000 | Established sellers |
| **Pro** | ₹12,999+ | Custom | 3,000+ | 10,000+ | High-volume, priority support, ONDC |

⭐ **Growth is the hero plan** — anchor every conversation here. Starter exists to remove "too expensive" objections; most sellers should land on Growth.

**Feature laddering (what unlocks the upgrade):**
- **Starter:** branded storefront, Razorpay, Shiprocket, basic pages, WhatsApp order link.
- **Growth:** + abandoned-cart recovery, WhatsApp order notifications, Instagram shopping, basic analytics, homepage section control.
- **Scale:** + dedicated onboarding call, custom checkout tweaks, priority queue.
- **Pro:** + account manager, ONDC integration, custom limits.

### 3.3 Overage & fair-use (never hard-block a paying seller)

- Extra orders: **₹3/order** beyond the included limit.
- Sustained overage: if a seller exceeds their order limit **2 months in a row → upgrade required** (don't nickel-and-dime a one-off spike).
- Products/storage are **fair-use limits**, not metered billing, until clearly abused.

---

## 4. Passive-income math (why this works)

> 20 sellers on Growth (₹3,999) = **₹79,980 MRR** ≈ ₹9.6L/year recurring.
> Plus setup fees: 20 × ₹9,999 ≈ ₹2L one-time.

Infra at this scale (multi-tenant) is **fixed at roughly ₹2,500–₹4,000/month total**, so marginal infra cost per seller is ~₹50–₹200. **The real cost is not infra — it is support and onboarding.** Every pricing rule above exists to cap that cost.

The target is **fewer, better-paying sellers**: 20 sellers paying ₹3,999 beats 100 sellers paying ₹999. The second group generates 5× the support tickets for the same revenue.

---

## 5. The rules that keep this a SaaS (not an agency)

These are the discipline lines. Every "yes" to a one-off pulls us toward agency margins.

1. No free-forever plan.
2. No unlimited custom design — configuration, not custom code.
3. No manual product upload without a per-product fee.
4. **Never promise sales or traffic.** We provide the store; the seller drives demand.
5. No custom backend logic per seller.
6. Support via ticket / WhatsApp form only — not "call me anytime."
7. One onboarding call maximum (except Scale/Pro).
8. Product import only via our CSV template.
9. Monthly reports automated.
10. Customization = logo, colors, fonts, banners, homepage sections, policy pages — **not** per-seller React or schema.

---

## 6. The landing page (1-page, conversion-first)

1. **Hero** — *"Stop giving marketplaces 20% of your profits. Own your store."* Sub: *"We build and manage your fully-branded online store. You market and pack orders — we handle the tech, servers, and integrations."* CTA: **See Pricing** / secondary **View Demo Store**.
2. **Marketplace vs. Your Own Store** — comparison table (commission 0% vs 15–30%, customer data 100% yours, your brand, faster payouts, tech managed by us).
3. **How it works (3 steps)** — *We build it (48h) → You sell it → We manage it.*
4. **Pricing** — setup fee + 3 visible tiers (Starter/Growth/Scale), Growth highlighted. Guarantee: *"Store live + a test payment processed within 5 days, or we refund the setup fee."*
5. **Who this is NOT for** — *"We don't bring you traffic. We don't run your customer support or courier disputes."* (Builds trust by repelling the wrong buyer.)
6. **Founder note + form** — Name, WhatsApp number, business type (Insta / Flipkart-Amazon / Retail).

---

## 7. What to build first (and what to skip)

**MVP (build now):** 3 templates · CSV product import · Razorpay · Shiprocket · custom domain mapping · seller dashboard · usage/order tracking · plan enforcement · subscription billing.

**Defer (do NOT build yet):** AI product descriptions · advanced coupons · loyalty points · multi-warehouse · custom reports · mobile app · complex inventory sync.

**Biggest technical hurdle:** the multi-tenant wrapper — serving many branded storefronts from one Next.js frontend + one Medusa backend, isolated by `store_id` / sales channel / publishable API key (already the direction of the current RLS work on this repo). Get **2 sellers live and paying the setup fee first**; their results become the social proof on the landing page.

---

## 8. TL;DR pricing card

```
SETUP (one-time)
  Basic Launch        ₹4,999    up to 50 products
  Standard Launch     ₹9,999    up to 250 products + custom domain
  Migration Launch    ₹19,999   up to 1,000 products
  Custom Template     ₹49,999+  new reusable design

MONTHLY (priced on orders)
  Starter   ₹1,999/mo   150 orders    (removes price objection)
  Growth ⭐ ₹3,999/mo   500 orders    (HERO — anchor here)
  Scale     ₹6,999/mo   1,000 orders
  Pro       ₹12,999+/mo 3,000+ orders, ONDC, account manager

  Annual = ~2 months free.  Overage = ₹3/order.
```
