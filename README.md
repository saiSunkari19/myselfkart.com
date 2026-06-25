# MySelfKart — Marketing Site

The public landing site for **[MySelfKart](https://myselfkart.com)** — a done-for-you service that builds and runs your **own branded online store** in India: your domain, your customers, your Razorpay, **0% commission**, live in 5 days.

This repo is a small, dependency-free **static site** (plain HTML + inline CSS + a little vanilla JS). No build step, no framework — just open the files.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page — hero, savings calculator, pricing, FAQ, apply form |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms & Conditions |
| `thanks.html` | Post-submission thank-you page (`noindex`) |

## SEO / social assets

| File | Purpose |
|---|---|
| `robots.txt` | Crawl rules; welcomes AI/answer-engine bots (GPTBot, ClaudeBot, PerplexityBot, …) |
| `sitemap.xml` | Sitemap (homepage + legal pages) |
| `og-image.jpg` | 1200×630 social share image (Open Graph / Twitter) |
| `og-image.svg` | Editable source for `og-image.jpg` |
| `favicon.jpeg`, `myselfkart.svg` | Favicon and logo |

The pages ship with full meta tags: canonical URLs, Open Graph + Twitter Cards, `theme-color`, geo targeting (India), and JSON-LD structured data (`Organization`, `WebSite`, `Service` + pricing, and a `FAQPage`) for SEO, GEO and AEO.

> **Editing the share image:** change `og-image.svg`, then regenerate the JPG:
> ```sh
> sips -s format jpeg -s formatOptions 88 -z 630 1200 og-image.svg --out og-image.jpg
> ```

## Deploy (Vercel)

This is a static site with one serverless function, deployed on **Vercel**:

- **Connect the repo:** import this repository into Vercel. Framework preset **Other**, **no build command**, output directory the repo root. Static files are served from the root; the `api/` folder is auto-detected as serverless functions.

The apply form posts to a **Vercel Serverless Function** (`api/apply.js`, reached at `/api/apply`) that emails each submission via [Resend](https://resend.com) to `connect@myselfkart.com`, then redirects to `thanks.html`.

Set these environment variables in **Vercel → Project → Settings → Environment Variables** (then redeploy):

| Variable | Example | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | From the Resend dashboard |
| `FORM_TO` | `connect@myselfkart.com` | Where enquiries land |
| `FORM_FROM` | `MySelfKart <noreply@myselfkart.com>` | Must be on a **domain verified in Resend** |

In Resend, verify the `myselfkart.com` domain (add the DNS records it gives you) so the `FORM_FROM` sender is accepted. The honeypot (`_honey`) field silently drops bot submissions.

## How it works under the hood

The store **engine** behind MySelfKart is a separate multi-tenant platform: **one Medusa v2 backend + one Next.js storefront + one Neon Postgres database** safely serve every seller, isolated by PostgreSQL **Row-Level Security (RLS)** rather than per-query `WHERE tenant_id` filters. Tenant identity is derived server-side, set as a transaction-local Postgres variable (`SET LOCAL app.current_tenant`), and enforced by RLS policies on every tenant-owned table — so the system **fails closed** if context is ever missing. That platform lives in its own repository; this repo is just the marketing front door.

## License

[MIT](./LICENSE) © 2026 Sai Krishna Sunkari and Swati Parge.

Built by [Sai Krishna Sunkari](https://github.com/saiSunkari19) and [Swati Parge](https://github.com/swatiparge).
