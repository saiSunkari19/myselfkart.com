"use client"

import React from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView } from "../../../lib/views"
import type { HomeProps, NavProps, FooterProps } from "../../../lib/themes/types"
import { TestimonialSlider } from "../../../lib/components/testimonial-slider"
import s from "./_styles.module.css"

/**
 * Thread theme — live slots. The Thread (apparel) preview design fed REAL Medusa
 * view models and wired to live routes (`/shop`, `/deals`, `/products/<handle>`,
 * `/cart`). No mock data, no preview-path links, no template-config context —
 * config arrives as props from the server route.
 */

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  "https://images.unsplash.com/photo-1594938374182-a55022f33b23?w=600&q=80",
  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80",
  "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
  "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
]

function cardImage(p: ProductView, index: number): string {
  return p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function inr(amount: number | null | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`
}

/**
 * Publish store-config brand colours on the wrapper (Thread CSS uses hex).
 * Re-exported from a plain module so the server-rendered account/login slots can
 * call it too (a "use client" export is unusable from a server component).
 */
import { threadColorVars } from "./_color-vars"
export { threadColorVars }

/* ---- Live product card → real PDP ---- */
export function ThreadProductCard({ product, index = 0 }: { product: ProductView; index?: number }) {
  return (
    <Link href={product.href} className={s.productCard}>
      <div className={s.productImageWrap}>
        <img src={cardImage(product, index)} alt={product.title} />
        {product.isOnSale && <span className={`${s.productBadge} ${s.badgeSale}`}>Sale</span>}
        <div className={s.productQuickAdd}>
          <button className={s.productQuickAddBtn}>View Product</button>
        </div>
      </div>
      <div className={s.productName}>{product.title}</div>
      <div className={s.productCategory}>{product.tags[0] ?? "Apparel"}</div>
      <div className={s.productPriceRow}>
        <span className={`${s.productPrice} ${product.originalPrice ? s.productPriceSale : ""}`}>
          {inr(product.price)}
        </span>
        {product.originalPrice && (
          <span className={s.productPriceOriginal}>{inr(product.originalPrice)}</span>
        )}
      </div>
    </Link>
  )
}

/* ---- Nav (live routes) ---- */
export function ThreadNav({ config, hasDeals, cartCount = 0 }: NavProps) {
  const storeName = config?.store_name ?? "Thread"
  const announcementEnabled = config?.announcement_enabled ?? true
  const announcementText = config?.announcement_text
  return (
    <>
      {announcementEnabled && (
        <div className={s.announcementBar}>
          {announcementText ?? (
            <>
              <strong>Free shipping</strong> on orders above ₹2,999 &nbsp;·&nbsp; Wear the minimal.
            </>
          )}
        </div>
      )}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navActions} style={{ justifyContent: "flex-start" }}>
            <Link href="/shop" className={s.navLink}>Shop</Link>
            {hasDeals && <Link href="/deals" className={s.navLink}>Sale</Link>}
          </div>
          <Link href="/" className={s.navLogo}>
            {config?.logo_url
              ? <img src={config.logo_url} alt={storeName} style={{ height: 28, objectFit: "contain" }} />
              : storeName}
          </Link>
          <div className={s.navActions}>
            <Link href="/account" className={s.navIconBtn}>Account</Link>
            <Link href="/cart" className={s.navIconBtn}>
              Bag{cartCount > 0 && <span className={s.cartBadge}>{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Footer (live routes) ---- */
export function ThreadFooter({ config, hasDeals }: FooterProps & { hasDeals?: boolean }) {
  const storeName = config?.store_name ?? "Thread"
  const tagline = config?.tagline ?? "Wear the minimal. Own the moment."
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div className={s.footerTop}>
          <div className={s.footerBrand}>
            <Link href="/" className={s.footerLogo}>{storeName}</Link>
            <p className={s.footerTagline}>{tagline}</p>
            <div className={s.footerSocials}>
              {config?.instagram_url && <a href={config.instagram_url} className={s.footerSocial}>I</a>}
              {config?.youtube_url && <a href={config.youtube_url} className={s.footerSocial}>Y</a>}
            </div>
          </div>
          <div>
            <div className={s.footerColTitle}>Shop</div>
            <ul className={s.footerLinks}>
              <li><Link href="/shop" className={s.footerLink}>All Products</Link></li>
              {hasDeals && <li><Link href="/deals" className={s.footerLink}>Sale</Link></li>}
              <li><Link href="/cart" className={s.footerLink}>Your Bag</Link></li>
            </ul>
          </div>
          <div>
            <div className={s.footerColTitle}>Help</div>
            <ul className={s.footerLinks}>
              <li><Link href="/about" className={s.footerLink}>About Us</Link></li>
              <li><Link href="/faq" className={s.footerLink}>FAQs</Link></li>
              <li><Link href="/returns" className={s.footerLink}>Returns</Link></li>
              <li><Link href="/privacy" className={s.footerLink}>Privacy Policy</Link></li>
              <li><Link href="/terms" className={s.footerLink}>Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span className={s.footerCopy}>© 2026 {storeName}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

/* ---- Hero (config-aware) ---- */
function Hero({ config, hasDeals }: { config: StoreConfig | null; hasDeals: boolean }) {
  const heroCta = config?.hero_cta
  const heroImage = config?.hero_image_url ?? "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85"
  return (
    <section className={s.hero}>
      <div className={s.heroLeft}>
        <div className={s.heroLabel}>{config?.tagline ?? "New Arrivals — 2026"}</div>
        <h1 className={s.heroTitle}>
          {config?.hero_heading ?? <>Wear<br />the <em>quiet</em><br />ones.</>}
        </h1>
        <p className={s.heroSub}>
          {config?.hero_subtext ?? "Clothing built for the long haul. Natural fabrics, considered cuts, and a palette that never shouts."}
        </p>
        <div className={s.heroCtas}>
          <Link href={heroCta?.primary_link ?? "/shop"} className={s.btn}>{heroCta?.primary_label ?? "Shop Now"}</Link>
          {hasDeals
            ? <Link href="/deals" className={`${s.btn} ${s.btnOutline}`}>Shop the Sale</Link>
            : (heroCta?.secondary_label && (
                <Link href={heroCta.secondary_link ?? "/shop"} className={`${s.btn} ${s.btnOutline}`}>{heroCta.secondary_label}</Link>
              ))}
        </div>
      </div>
      <div className={s.heroRight}>
        <img src={heroImage} alt={config?.hero_heading ?? "Editorial"} className={s.heroImg} />
        <div className={s.heroBadge}>
          <strong>Free returns</strong>
          <span>30-day no-hassle return</span>
        </div>
      </div>
    </section>
  )
}

/* ---- Product section (real products) ---- */
function ProductSection({ label, title, sub, products, cta }: {
  label: string; title: string; sub?: string; products: ProductView[]; cta?: { label: string; href: string }
}) {
  if (products.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <div>
            <div className={s.sectionLabel}>{label}</div>
            <h2 className={s.sectionTitle}>{title}</h2>
            {sub && <p className={s.sectionSub}>{sub}</p>}
          </div>
          {cta && <Link href={cta.href} className={`${s.btn} ${s.btnOutline}`}>{cta.label}</Link>}
        </div>
        <div className={`${s.productGrid} ${s.productGrid4}`}>
          {products.map((p, i) => <ThreadProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ---- Collections (seller-curated Medusa collections; hidden when none).
   Kept distinct from the category taxonomy below — same card markup, own heading. ---- */
function CollectionsSection({ collections }: { collections: HomeProps["collections"] }) {
  if (collections.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 40 }}>
          <div className={s.sectionLabel} style={{ marginBottom: 12 }}>Curated</div>
          <h2 className={s.sectionTitle} style={{ marginBottom: 16 }}>Shop by Collection</h2>
          <p className={`${s.sectionSub} ${s.sectionSubCenter}`} style={{ marginBottom: 0 }}>Hand-picked edits, grouped just for you.</p>
        </div>
        <div className={s.categoryGrid}>
          {collections.map((col) => (
            <Link key={col.id} href={col.href} className={s.categoryCard}>
              <img
                src={col.image ?? `https://placehold.co/600x750/png?text=${encodeURIComponent(col.name)}`}
                alt={col.name}
              />
              <div className={s.categoryOverlay} />
              <div className={s.categoryInfo}>
                <div className={s.categoryName}>{col.name}</div>
                <div className={s.categoryCount}>{col.count} style{col.count !== 1 ? "s" : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Categories (real categories; hidden when none) ---- */
function CategoriesSection({ categories }: { categories: HomeProps["categories"] }) {
  if (categories.length === 0) return null
  return (
    <section className={`${s.section} ${s.sectionSubtle}`}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 40 }}>
          <div className={s.sectionLabel} style={{ marginBottom: 12 }}>Browse the range</div>
          <h2 className={s.sectionTitle} style={{ marginBottom: 16 }}>Shop by Category</h2>
          <p className={`${s.sectionSub} ${s.sectionSubCenter}`} style={{ marginBottom: 0 }}>Find exactly what you&apos;re looking for, or discover something new.</p>
        </div>
        <div className={s.categoryGrid}>
          {categories.map((cat) => (
            <Link key={cat.id} href={cat.href} className={s.categoryCard}>
              <img
                src={cat.image ?? `https://placehold.co/600x750/png?text=${encodeURIComponent(cat.name)}`}
                alt={cat.name}
              />
              <div className={s.categoryOverlay} />
              <div className={s.categoryInfo}>
                <div className={s.categoryName}>{cat.name}</div>
                <div className={s.categoryCount}>{cat.count} style{cat.count !== 1 ? "s" : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEFAULT_EDITORIAL_BANNER = {
  image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1400&q=85",
  label: "The Edit",
  title: "Built to<br />outlast the season.",
  body: "Considered cuts and natural fabrics, made to be worn for years.",
  cta_label: "Explore the Collection →",
}

const DEFAULT_THREAD_TESTIMONIALS = [
  { name: "Ananya K.", city: "Bangalore", text: "Become my daily uniform. I've washed it 40 times and it only gets better. Worth every rupee.", stars: 5 },
  { name: "Meera S.", city: "Mumbai", text: "Consistent sizing and fabric quality that's unmatched. Stunning in person.", stars: 5 },
  { name: "Priyanka R.", city: "Delhi", text: "Ordered online, the return policy made it easy. The quality is real.", stars: 5 },
]

/* ---- Editorial banner (brand chrome) ---- */
function EditorialBanner({ config }: { config: StoreConfig | null }) {
  const b = { ...DEFAULT_EDITORIAL_BANNER, ...(config?.sections?.editorial_banner ?? {}) }
  return (
    <section className={s.section}>
      <div className={s.editorialBanner}>
        <img src={b.image} alt="Editorial" className={s.editorialBannerBg} />
        <div className={s.editorialBannerOverlay} />
        <div className={s.editorialContent}>
          <div className={s.sectionLabel}>{b.label}</div>
          <h2
            className={s.sectionTitle}
            style={{ color: "#fff", fontSize: "clamp(30px,4vw,52px)" }}
            dangerouslySetInnerHTML={{ __html: b.title }}
          />
          <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.65)" }}>
            {b.body}
          </p>
          <Link href="/shop" className={`${s.btn} ${s.btnWhite}`}>{b.cta_label}</Link>
        </div>
      </div>
    </section>
  )
}

/* ---- Testimonials (brand chrome) ---- */
function Testimonials({ config }: { config: StoreConfig | null }) {
  const items = config?.sections?.testimonials?.items ?? DEFAULT_THREAD_TESTIMONIALS
  return (
    <section className={`${s.section} ${s.sectionSubtle}`}>
      <div className={s.container}>
        <div className={s.sectionCenter}>
          <div className={s.sectionLabel}>What they say</div>
          <h2 className={s.sectionTitle}>Loved by wearers</h2>
        </div>
        <TestimonialSlider
          items={items}
          gap={24}
          renderItem={(t: typeof DEFAULT_THREAD_TESTIMONIALS[number], i: number) => (
            <div key={i} className={s.testimonialCard}>
              <div className={s.testimonialStars}>{"★".repeat(t.stars)}</div>
              <p className={s.testimonialText}>&quot;{t.text}&quot;</p>
              <div className={s.testimonialAuthor}>
                <div className={s.testimonialAvatar}>{t.name[0]}</div>
                <div>
                  <div className={s.testimonialName}>{t.name}</div>
                  <div className={s.testimonialCity}>{t.city}</div>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  )
}

/* ---- Home slot ---- */
export function ThreadLivePage({ config, cartCount, products, newArrivals, deals, categories, collections }: HomeProps) {
  const hasDeals = deals.length > 0
  return (
    <div className={s.page} style={threadColorVars(config)}>
      <ThreadNav config={config} cartCount={cartCount} hasDeals={hasDeals} categories={categories} />
      <Hero config={config} hasDeals={hasDeals} />
      <ProductSection
        label="Just dropped" title="New Arrivals"
        sub="Our latest pieces, freshly added to the collection."
        products={newArrivals.slice(0, 4)} cta={{ label: "View All", href: "/shop" }}
      />
      <CollectionsSection collections={collections} />
      <CategoriesSection categories={categories} />
      <EditorialBanner config={config} />
      <ProductSection
        label="The collection" title="Shop All"
        products={products.slice(0, 8)} cta={{ label: "See All", href: "/shop" }}
      />
      <Testimonials config={config} />
      <ProductSection
        label="Limited time" title="On Sale Now"
        sub="Last-season pieces at honest prices."
        products={deals.slice(0, 4)} cta={{ label: "Shop the Sale", href: "/deals" }}
      />
      <ThreadFooter config={config} hasDeals={hasDeals} />
    </div>
  )
}
