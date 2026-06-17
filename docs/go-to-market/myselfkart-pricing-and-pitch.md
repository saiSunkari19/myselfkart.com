# MySelfKart — Managed E-commerce for Sellers

> **Positioning (one line):** We are not a website builder. We are the **managed e-commerce operations layer** for sellers who already have customers — Flipkart/Amazon sellers tired of commissions, and Instagram/WhatsApp sellers tired of doing checkout by hand.

This document is the market-analyst answer to: *how should we price and pitch MySelfKart as a SaaS product to attract Flipkart/Amazon sellers and Instagram sellers?*

---

## 1. Market reality (the honest analyst read)

The Indian seller market is **price-sensitive at the top of funnel but support-heavy after onboarding.** Two facts drive every pricing decision below:

1. **The setup fee — not a cheap monthly — is what filters serious sellers.** Once a seller has paid ₹4,999–₹19,999 to onboard, they are committed; the monthly no longer needs to be cheap "to get them in the door." That removes the reason for a sub-₹4,999 tier and lets us hold a premium floor.
2. **Orders — not visitors or products — create 90% of our real cost:** payment webhooks, Shiprocket calls, WhatsApp/email, returns, refunds, and "why hasn't my payout come" support tickets. So **orders must be the metric we price on**, and "unlimited" is a trap we never offer below the top tier.
3. **₹4,999/month is cheap per-order, not expensive.** At 150 orders it is **₹33/order** versus the **₹160–₹200/order** a marketplace silently takes in commission. Framed against commission (not against Dukaan's sticker price), it wins.

**Resolution:** A premium monthly floor (₹4,999) → backed by a one-time setup fee that does the real filtering → "managed / done-for-you" positioning that justifies the price over DIY tools. We deliberately choose **fewer, serious, higher-paying sellers over many small ones** — small sellers generate the most support tickets per rupee, which breaks the 1-hour/day goal.

### Competitive anchor (why our price is defensible)

| Competitor | Entry price | What they give | Our wedge |
|---|---|---|---|
| Dukaan / Bikayi | ₹999–₹2,500/mo | DIY tool, you do everything | We do the setup + run the tech |
| Shopify Basic | ~₹1,994/mo + txn fees | DIY tool + transaction cut | No per-transaction commission |
| Instamojo | low | Payment-first, weak storefront | Full branded storefront + ops |
| **MySelfKart** | **₹4,999/mo + setup** | **Managed: we build + run it** | **Done-for-you, 0% commission** |

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

## 2.5. Lead with the math (the hero block)

Don't open with a paragraph — open with **arithmetic the seller can't argue with.** The whole pitch in one sentence:

> **On a marketplace, the more you sell, the more they take. Your cost is a *percentage* that grows with you. With your own store, your cost is *fixed* — every extra rupee of growth is 100% yours.**

### Per order — what each sale really costs you

| On a single ₹500 sale | Marketplace (Flipkart/Amazon) | Your own store |
|---|---:|---:|
| Commission (15–30%) | **₹75 – ₹150** | **₹0** |
| You keep | ₹350 – ₹425 | **₹500 (minus only payment gateway)** |

### Per month — what it costs as you grow

| Your monthly sales | Marketplace takes (15–30%) | MySelfKart (fixed) | Extra you keep |
|---|---:|---:|---:|
| ₹25,000 | ₹3,750 – ₹7,500 | ₹4,999 | ≈ **break-even** |
| ₹1,00,000 *(200 orders @ ₹500)* | **₹15,000 – ₹30,000** | ₹4,999 – ₹9,999 | **₹10,000 – ₹20,000 / mo** |
| ₹3,00,000 | ₹45,000 – ₹90,000 | ₹9,999 | **₹35,000 – ₹80,000 / mo** |

### The line that closes it

> **If you do more than ~₹25,000 in monthly sales, your own store is already cheaper than a marketplace — and every rupee above that, you keep.**

*Footnote (keep it, it builds trust):* 15–30% is the **conservative** case. Real marketplace deductions are usually higher once closing fees, shipping fees, and payment-collection fees are added. The "extra you keep" numbers above are the floor, not the ceiling.

**Comparison strip (above the fold), beyond just money:**

| | Marketplace | Your own store (with us) |
|---|---|---|
| Commission per order | 15–30% | **0%** |
| Monthly fixed cost | ₹0 *(but 15–30% on every order)* | **₹4,999 – ₹9,999 flat** |
| Cost on a ₹500 sale | ₹75 – ₹150 | **₹0** |
| Cost at ₹1L/month sales | ₹15,000 – ₹30,000 | **₹4,999 – ₹9,999** |
| Own your customer data | ❌ No | ✅ **Yes** |
| Remarket on WhatsApp/email | ❌ No | ✅ **Yes** |
| Your brand & domain | ❌ Just a listing | ✅ **Yours** |
| Risk of arbitrary ban | ⚠️ Yes | ✅ **None** |

---

## 3. Pricing — the recommended model

Two parts: **a one-time Setup Fee** (pays for onboarding labor + filters tyre-kickers) and a **monthly subscription** (recurring revenue, priced on orders).

### 3.1 Setup fees (one-time)

The setup fee is non-negotiable. It is the single most important filter — it converts "curious" into "committed" and pays for the human hours of onboarding.

**Every tier includes the same fixed-effort work: domain config, Razorpay config, and Shiprocket config.** That work is roughly constant regardless of catalog size, so it is bundled into all tiers. **The only thing that scales the price is the number of products** (the variable-effort work).

| Package | Price | Includes (domain + Razorpay + Shiprocket in *all* tiers) |
|---|---:|---|
| **Basic Launch** | ₹4,999 | 1 template, logo/colors/fonts, subdomain, standard pages, up to **50 products** (clean CSV) |
| **Standard Launch** | ₹9,999 | + custom domain mapping, categories + collections, up to **250 products** (clean CSV) |
| **Migration Launch** | ₹19,999 | + full taxonomy, marketplace migration support, up to **1,000 products** (clean CSV) |
| **Large Catalog** | ₹19,999 + ₹2–₹5/product over 1,000 | Only with clean catalog data |
| **Custom Template** | ₹49,999+ | A new, reusable design system (treated as a product investment, not a one-off) |

**The "clean CSV" rule (must be stated to every seller):** to qualify for import pricing, the seller must provide name, SKU, price, stock, description, category, image URLs, and variant data in our template. WhatsApp images + random Excel = **manual data-entry billed at ₹20–₹40/product.** Never absorb manual catalog work into a setup fee — it is a services business, not SaaS.

### 3.2 Monthly subscription (recurring) — **priced on orders**

| Plan | Monthly | Annual (≈2 months free) | Orders/mo | Products | Built for |
|---|---:|---:|---:|---:|---|
| **Starter** | ₹4,999 | ₹49,999/yr | 150 | 500 | Serious sellers with existing demand |
| **Growth** ⭐ | ₹7,999 | ₹79,999/yr | 500 | 2,000 | Active Instagram / marketplace sellers |
| **Scale** | ₹9,999 | ₹99,999/yr | 1,000 | 5,000 | Established sellers |
| **Pro** | ₹14,999+ | Custom | 3,000+ | 10,000+ | High-volume, priority support, ONDC |

⭐ **Growth is the hero plan** — anchor every conversation here. **Starter is a real floor, not a trap tier:** at ₹4,999 / 150 orders it is ₹33/order vs. the ₹160–₹200/order a marketplace takes in commission. Lead with the **annual** number (₹49,999/yr) so the setup invoice + first month isn't a double-shock.

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

> 20 sellers on Growth (₹7,999) = **₹1,59,980 MRR** ≈ ₹19.2L/year recurring.
> Plus setup fees: 20 × ₹9,999 ≈ ₹2L one-time.
> Even all-Starter (₹4,999) × 20 = **₹99,980 MRR** ≈ ₹12L/year.

Infra at this scale (multi-tenant) is **fixed at roughly ₹2,500–₹4,000/month total**, so marginal infra cost per seller is ~₹50–₹200. **The real cost is not infra — it is support and onboarding.** Every pricing rule above exists to cap that cost.

The target is **fewer, better-paying sellers**: 20 sellers paying ₹7,999 beats 100 sellers paying ₹999. The second group generates 5× the support tickets for the same revenue — and breaks the 1-hour/day goal.

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

1. **Hero = the math, not a slogan.** Headline *"Stop giving marketplaces 20% of your profits."* — then immediately the **per-order + per-month comparison tables from Section 2.5** as the visual centerpiece (this is the eye-catcher that does the convincing). CTA: **See Pricing** / secondary **View Demo Store**.
2. **"The marketplace tax grows with you" strip** — the full comparison strip from Section 2.5 (commission, fixed cost, cost on ₹500 sale, cost at ₹1L/month, customer data, brand, ban risk). End with the closing line: *"Sell more than ~₹25,000/month and your own store is already cheaper."*
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
SETUP (one-time)  — domain + Razorpay + Shiprocket bundled in ALL tiers
  Basic Launch        ₹4,999    up to 50 products
  Standard Launch     ₹9,999    up to 250 products + custom domain
  Migration Launch    ₹19,999   up to 1,000 products
  Custom Template     ₹49,999+  new reusable design
  (only product count scales the price)

MONTHLY (priced on orders)
  Starter   ₹4,999/mo   150 orders    (real floor — ₹33/order vs ₹160+ commission)
  Growth ⭐ ₹7,999/mo   500 orders    (HERO — anchor here)
  Scale     ₹9,999/mo   1,000 orders
  Pro       ₹14,999+/mo 3,000+ orders, ONDC, account manager

  Annual = ~2 months free (lead with this).  Overage = ₹3/order.
```
