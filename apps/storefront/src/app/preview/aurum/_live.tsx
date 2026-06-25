"use client"

import React from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView } from "../../../lib/views"
import type { HomeProps } from "../../../lib/themes/types"
import { TestimonialSlider } from "../../../lib/components/testimonial-slider"
import { StarRating } from "../../../lib/components/star-rating"
import { AurumNav, AurumFooter } from "./_components"
import s from "./_styles.module.css"

// Re-exported so existing imports of `AurumNav`/`AurumFooter` from "./_live"
// keep working — the actual components now live in ./_components, which can
// also render them for the static info pages (About/Privacy/...).
export { AurumNav, AurumFooter }

/**
 * Aurum theme — live slots. The Aurum (fine-jewellery) preview design fed REAL
 * Medusa view models and wired to live routes (`/shop`, `/deals`,
 * `/products/<handle>`, `/cart`). No mock data, no preview-path links, no
 * template-config context — config arrives as props from the server route.
 */

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1583292438338-39e574a78eba?w=600&q=85",
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=85",
  "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=85",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=85",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=85",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=85",
]

function cardImage(p: ProductView, index: number): string {
  return p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

function inr(amount: number | null | undefined): string {
  return `₹${(amount ?? 0).toLocaleString("en-IN")}`
}

/**
 * Publish store-config brand colours on Aurum's semantic CSS vars.
 * Re-exported from a plain module so the server-rendered account/login slots can
 * call it too (a "use client" export is unusable from a server component).
 */
import { aurumColorVars } from "./_color-vars"
export { aurumColorVars }

/* ---- Live product card → real PDP ---- */
export function AurumProductCard({ product, index = 0 }: { product: ProductView; index?: number }) {
  return (
    <Link href={product.href} className={s.productCard}>
      <div className={s.productImageWrap}>
        <img src={cardImage(product, index)} alt={product.title} />
        {product.isOnSale && <span className={`${s.productBadge} ${s.badgeLimited}`}>Sale</span>}
        <span className={s.productCertBadge}>✦ Certified</span>
        <div className={s.productHoverPanel}>
          <button className={s.productHoverBtn}>View Details</button>
        </div>
      </div>
      <div className={s.productName}>{product.title}</div>
      <div className={s.productMeta}>{product.tags[0] ?? "Fine Jewellery"}</div>
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

/* ---- Gold divider (brand chrome) ---- */
function GoldDivider() {
  return (
    <div className={s.goldLine}>
      <div className={s.goldDiamond} />
      <div className={s.goldDiamond} style={{ opacity: 0.4 }} />
      <div className={s.goldDiamond} />
    </div>
  )
}

/* ---- Hero (config-aware) ---- */
function Hero({ config, hasDeals }: { config: StoreConfig | null; hasDeals: boolean }) {
  const heroCta = config?.hero_cta
  const heroImage = config?.hero_image_url ?? "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=90"
  return (
    // margin: 0 overrides the global `section { margin: 2rem 0 }` rule
    // (globals.css) — otherwise it leaves an unwanted 2rem gap above TrustStrip.
    <section className={s.hero} style={{ height: "100vh", margin: 0 }}>
      <img src={heroImage} alt={config?.hero_heading ?? "Aurum"} className={s.heroBg} />
      <div className={s.heroOverlay} />
      <div className={s.heroContent} style={{ paddingTop: 60 }}>
        <div className={s.heroLabel}>{config?.tagline ?? "New Collection — 2026"}</div>
        <h1 className={s.heroTitle}>
          {config?.hero_heading ?? <>Where gold<br />meets <em>eternity.</em></>}
        </h1>
        <p className={s.heroSub}>
          {config?.hero_subtext ?? "Jewellery crafted for moments that last a lifetime. Hallmarked. Certified. Yours."}
        </p>
        <div className={s.heroCtas}>
          <Link href={heroCta?.primary_link ?? "/shop"} className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
            {heroCta?.primary_label ?? "Explore Collection"}
          </Link>
          {hasDeals
            ? <Link href="/deals" className={`${s.btn} ${s.btnWhite} ${s.btnLg}`}>View Offers</Link>
            : (heroCta?.secondary_label && (
                <Link href={heroCta.secondary_link ?? "/shop"} className={`${s.btn} ${s.btnWhite} ${s.btnLg}`}>
                  {heroCta.secondary_label}
                </Link>
              ))}
        </div>
      </div>
      <div className={s.heroScroll}>
        <div className={s.heroScrollLine} />
        <span>Scroll</span>
      </div>
    </section>
  )
}

const DEFAULT_TRUST_STRIP = [
  { icon: "🏅", label: "BIS Hallmarked", sub: "916 & 925 certified" },
  { icon: "💎", label: "GIA Certified", sub: "Every diamond verified" },
  { icon: "🔒", label: "Secure Packaging", sub: "Insured delivery" },
  { icon: "↩️", label: "30-Day Returns", sub: "Hassle-free exchange" },
]

/* ---- Trust strip — falls back to brand-chrome defaults when not customized. ---- */
function TrustStrip({ config }: { config: StoreConfig | null }) {
  const items = config?.sections?.trust_strip?.items ?? DEFAULT_TRUST_STRIP
  return (
    <div className={s.trustStrip}>
      <div className={s.trustInner}>
        {items.map((item: typeof DEFAULT_TRUST_STRIP[number]) => (
          <div key={item.label} className={s.trustItem}>
            <span className={s.trustIcon}>{item.icon}</span>
            <div>
              <div className={s.trustLabel}>{item.label}</div>
              <div className={s.trustSub}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---- Product section (real products) ---- */
function ProductSection({ label, title, sub, products, cta, cream, grid3 }: {
  label: string; title: string; sub?: string; products: ProductView[]
  cta?: { label: string; href: string }; cream?: boolean; grid3?: boolean
}) {
  if (products.length === 0) return null
  return (
    <section className={`${s.section} ${cream ? s.sectionCream : ""}`}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <div>
            <span className={s.sectionLabel}>{label}</span>
            <h2 className={s.sectionTitle}>{title}</h2>
            {sub && <p className={s.sectionSub}>{sub}</p>}
          </div>
          {cta && <Link href={cta.href} className={`${s.btn} ${s.btnOutlineGold}`}>{cta.label}</Link>}
        </div>
        <div className={grid3 ? s.productGrid3 : s.productGrid4}>
          {products.map((p, i) => <AurumProductCard key={p.id} product={p} index={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ---- Categories (real categories; hidden when none) ---- */
function CategoriesSection({ categories }: { categories: HomeProps["categories"] }) {
  if (categories.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Browse</span>
          <h2 className={s.sectionTitle}>Shop by Category</h2>
          <GoldDivider />
        </div>
        <div className={s.collectionGrid}>
          {categories.map((cat, i) => (
            <Link key={cat.id} href={cat.href} className={s.collectionCard}>
              <img src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} alt={cat.name} />
              <div className={s.collectionOverlay} />
              <div className={s.collectionInfo}>
                <div className={s.collectionName}>{cat.name}</div>
                <div className={s.collectionCount}>{cat.count} piece{cat.count !== 1 ? "s" : ""}</div>
                <div className={s.collectionCta}>Explore Category →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Collections (real Medusa collections; seller-curated, distinct from the
   category taxonomy; hidden when none) ---- */
function CollectionsSection({ collections }: { collections: HomeProps["collections"] }) {
  if (collections.length === 0) return null
  return (
    <section className={`${s.section} ${s.sectionCream}`}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Curated for You</span>
          <h2 className={s.sectionTitle}>Our Collections</h2>
          <GoldDivider />
        </div>
        <div className={s.collectionGrid}>
          {collections.map((col, i) => (
            <Link key={col.id} href={col.href} className={s.collectionCard}>
              <img src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} alt={col.name} />
              <div className={s.collectionOverlay} />
              <div className={s.collectionInfo}>
                <div className={s.collectionName}>{col.name}</div>
                <div className={s.collectionCount}>{col.count} piece{col.count !== 1 ? "s" : ""}</div>
                <div className={s.collectionCta}>Explore Collection →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEFAULT_CRAFTSMANSHIP = {
  image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=85",
  label: "Our Promise",
  title: "Three generations<br />of mastery.",
  body: "Every piece is made by hand in our atelier by master artisans whose skills have passed through generations. Hallmarked, certified, and crafted to be worn for a lifetime.",
  cta_label: "Shop the Collection →",
}

/* ---- Craftsmanship editorial — falls back to brand-chrome defaults. ---- */
function CraftsmanshipSection({ config }: { config: StoreConfig | null }) {
  const b = { ...DEFAULT_CRAFTSMANSHIP, ...(config?.sections?.craftsmanship ?? {}) }
  return (
    <section className={`${s.section} ${s.sectionDark}`}>
      <div className={s.container}>
        <div className={s.aboutHero} style={{ gap: 80 }}>
          <div className={s.aboutHeroImg}>
            <img src={b.image} alt="Craftsmanship" />
          </div>
          <div>
            <span className={s.sectionLabel}>{b.label}</span>
            <h2
              className={s.sectionTitle}
              style={{ color: "#fff" }}
              dangerouslySetInnerHTML={{ __html: b.title }}
            />
            <GoldDivider />
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, margin: "0 0 32px", maxWidth: 400 }}>
              {b.body}
            </p>
            <Link href="/shop" className={`${s.btn} ${s.btnOutlineGold}`}>{b.cta_label}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const DEFAULT_CERTIFICATION = [
  { icon: "🏅", title: "BIS Hallmarked", desc: "Every gold piece is hallmarked under the Bureau of Indian Standards." },
  { icon: "💎", title: "GIA Certified", desc: "Diamonds graded by the Gemological Institute of America." },
  { icon: "🔬", title: "Gemstone Certified", desc: "Coloured gemstones certified by the most respected gem labs." },
  { icon: "🛡️", title: "Lifetime Exchange", desc: "Exchange your jewellery at full value, any time, at any store." },
]

/* ---- Certifications — falls back to brand-chrome defaults. ---- */
function CertificationSection({ config }: { config: StoreConfig | null }) {
  const items = config?.sections?.certification?.items ?? DEFAULT_CERTIFICATION
  return (
    <section className={`${s.section} ${s.sectionCream}`}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Trust &amp; Authenticity</span>
          <h2 className={s.sectionTitle}>Certified. Verified. Guaranteed.</h2>
          <GoldDivider />
          <p className={`${s.sectionSub} ${s.sectionSubCenter}`}>
            Every piece comes with full certification and a lifetime exchange guarantee.
          </p>
        </div>
        <div className={s.certGrid}>
          {items.map((item: typeof DEFAULT_CERTIFICATION[number]) => (
            <div key={item.title} className={s.certCard}>
              <div className={s.certLogo}>{item.icon}</div>
              <div className={s.certTitle}>{item.title}</div>
              <p className={s.certText}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEFAULT_AURUM_TESTIMONIALS = [
  { name: "Sunita Kapoor", city: "Mumbai", stars: 5, piece: "Royal Kundan Bridal Set", text: "The bridal set was beyond anything I imagined. The craftsmanship is extraordinary." },
  { name: "Anil Mehta", city: "Delhi", stars: 5, piece: "Solitaire Diamond Ring", text: "The certificate, the presentation, the service — everything was perfection." },
  { name: "Kavitha Rajan", city: "Bangalore", stars: 5, piece: "Gold Temple Bangles", text: "The detail of the carvings, the weight of the gold — this is heirloom jewellery." },
]

/* ---- Testimonials — falls back to brand-chrome defaults. ---- */
function Testimonials({ config }: { config: StoreConfig | null }) {
  const items = config?.sections?.testimonials?.items ?? DEFAULT_AURUM_TESTIMONIALS
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>From Our Families</span>
          <h2 className={s.sectionTitle}>Words that honour us.</h2>
          <GoldDivider />
        </div>
        <TestimonialSlider
          items={items}
          gap={28}
          accentColor="var(--aurum-gold, #b08d4f)"
          renderItem={(t: typeof DEFAULT_AURUM_TESTIMONIALS[number], i: number) => (
            <div key={i} className={s.testimonialCard}>
              <div className={s.testimonialStars}><StarRating rating={t.stars} /></div>
              <p className={s.testimonialText}>&quot;{t.text}&quot;</p>
              <div className={s.testimonialAuthor}>
                <div className={s.testimonialAvatar}>{t.name[0]}</div>
                <div>
                  <div className={s.testimonialName}>{t.name}</div>
                  <div className={s.testimonialCity}>{t.city}</div>
                  <div className={s.testimonialPurchase}>{t.piece}</div>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  )
}

const DEFAULT_AURUM_NEWSLETTER = {
  label: "Private Circle",
  title: "First access. Always.",
  sub: "New collections, private previews, and invitations to exclusive events.",
  button_label: "Join",
}

/* ---- Newsletter — falls back to brand-chrome defaults. ---- */
function Newsletter({ config }: { config: StoreConfig | null }) {
  const n = { ...DEFAULT_AURUM_NEWSLETTER, ...(config?.sections?.newsletter ?? {}) }
  return (
    <section className={s.newsletter}>
      <div className={s.newsletterLabel}>{n.label}</div>
      <h2 className={s.newsletterTitle}>{n.title}</h2>
      <p className={s.newsletterSub}>
        {n.sub}
      </p>
      <div className={s.newsletterForm}>
        <input className={s.newsletterInput} type="email" placeholder="Your email address" />
        <button className={s.newsletterBtn}>{n.button_label}</button>
      </div>
      <p className={s.newsletterPrivacy}>No spam. Unsubscribe anytime. We value your privacy.</p>
    </section>
  )
}

/* ---- Home slot ---- */
export function AurumLivePage({ config, cartCount, products, newArrivals, deals, categories, collections }: HomeProps) {
  const hasDeals = deals.length > 0
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} cartCount={cartCount} hasDeals={hasDeals} categories={categories} />
      <Hero config={config} hasDeals={hasDeals} />
      <TrustStrip config={config} />
      <CollectionsSection collections={collections} />
      <CategoriesSection categories={categories} />
      <ProductSection
        label="Just Arrived" title="New Arrivals"
        sub="Freshly crafted, now available. Each piece certified and ready to ship."
        products={newArrivals.slice(0, 3)} cta={{ label: "View All", href: "/shop" }}
        cream grid3
      />
      <CraftsmanshipSection config={config} />
      <ProductSection
        label="Most Loved" title="Bestsellers"
        sub="Our most celebrated pieces, cherished by families across India."
        products={products.slice(0, 4)} cta={{ label: "Shop All", href: "/shop" }}
      />
      <CertificationSection config={config} />
      <ProductSection
        label="Limited Time" title="Special Offers"
        sub="Exceptional pieces at exceptional value."
        products={deals.slice(0, 4)} cta={{ label: "View Offers", href: "/deals" }}
      />
      <Testimonials config={config} />
      <Newsletter config={config} />
      <AurumFooter config={config} hasDeals={hasDeals} />
    </div>
  )
}
