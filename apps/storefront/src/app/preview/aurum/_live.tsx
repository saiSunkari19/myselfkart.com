"use client"

import React from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView } from "../../../lib/views"
import type { HomeProps, NavProps, FooterProps } from "../../../lib/themes/types"
import s from "./_styles.module.css"

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

/** Publish store-config brand colours on Aurum's semantic CSS vars. */
export function aurumColorVars(config: StoreConfig | null): React.CSSProperties {
  return {
    ...(config?.accent_color ? { "--aurum-gold": config.accent_color } : {}),
    ...(config?.accent_color ? { "--aurum-gold-soft": config.accent_color } : {}),
    ...(config?.primary_color ? { "--aurum-ink": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--aurum-bg": config.secondary_color } : {}),
  } as React.CSSProperties
}

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

/* ---- Nav (live routes) ---- */
export function AurumNav({ config, hasDeals }: NavProps) {
  const storeName = config?.store_name ?? "Aurum"
  const tagline = config?.tagline ?? "Fine Jewellery"
  const announcementEnabled = config?.announcement_enabled ?? true
  const announcementText = config?.announcement_text ?? null
  return (
    <>
      {announcementEnabled && (
        <div className={s.announcementBar}>
          {announcementText ? (
            <>
              <span className={s.announcementDot} />
              {announcementText}
              <span className={s.announcementDot} />
            </>
          ) : (
            <>
              <span className={s.announcementDot} />
              Free insured shipping on all orders above ₹10,000
              <span className={s.announcementDot} />
              <strong>BIS Hallmarked · GIA Certified · Lifetime Exchange</strong>
              <span className={s.announcementDot} />
              30-Day hassle-free returns
            </>
          )}
        </div>
      )}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navLeft}>
            <Link href="/shop" className={s.navLink}>Shop</Link>
            {hasDeals && <Link href="/deals" className={s.navLink}>Offers</Link>}
          </div>

          <Link href="/" className={s.navLogo}>
            {config?.logo_url ? (
              <img src={config.logo_url} alt={storeName} style={{ height: 40, objectFit: "contain" }} />
            ) : (
              <>
                <span className={s.navLogoText}>{storeName}</span>
                <span className={s.navLogoSub}>{tagline}</span>
              </>
            )}
          </Link>

          <div className={s.navRight}>
            <Link href="/account" className={s.navIconBtn}>Account</Link>
            <Link href="/cart" className={s.navIconBtn}>Bag</Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Footer (live routes) ---- */
export function AurumFooter({ config, hasDeals }: FooterProps & { hasDeals?: boolean }) {
  const storeName = config?.store_name ?? "Aurum"
  const tagline = config?.tagline ?? "Fine Jewellery"
  return (
    <footer className={s.footer}>
      <div className={s.footerTop}>
        <div className={s.footerBrand}>
          <Link href="/" className={s.footerLogoText}>{storeName}</Link>
          <span className={s.footerLogoSub}>{tagline}</span>
          <p className={s.footerTagline}>
            Jewellery crafted to endure. Every piece an heirloom in waiting.
          </p>
          <div className={s.footerGoldLine} />
          <div className={s.footerCerts}>
            {["BIS 916", "GIA", "ISO 9001", "BIS 925"].map(c => (
              <span key={c} className={s.footerCertItem}>{c}</span>
            ))}
          </div>
        </div>
        <div>
          <div className={s.footerColTitle}>Shop</div>
          <ul className={s.footerLinks}>
            <li><Link href="/shop" className={s.footerLink}>All Jewellery</Link></li>
            {hasDeals && <li><Link href="/deals" className={s.footerLink}>Offers</Link></li>}
            <li><Link href="/cart" className={s.footerLink}>Your Bag</Link></li>
          </ul>
        </div>
        <div>
          <div className={s.footerColTitle}>Support</div>
          <ul className={s.footerLinks}>
            {config?.instagram_url && <li><a href={config.instagram_url} className={s.footerLink}>Instagram</a></li>}
            {config?.youtube_url && <li><a href={config.youtube_url} className={s.footerLink}>YouTube</a></li>}
            {config?.contact_email && <li><a href={`mailto:${config.contact_email}`} className={s.footerLink}>{config.contact_email}</a></li>}
          </ul>
        </div>
      </div>
      <div className={s.footerBottom}>
        <span className={s.footerCopy}>© 2026 {storeName} Fine Jewellery. All rights reserved.</span>
        <span className={s.footerBadge}>Crafted with Precision</span>
      </div>
    </footer>
  )
}

/* ---- Hero (config-aware) ---- */
function Hero({ config, hasDeals }: { config: StoreConfig | null; hasDeals: boolean }) {
  const heroCta = config?.hero_cta
  const heroImage = config?.hero_image_url ?? "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=90"
  return (
    <section className={s.hero} style={{ height: "100vh" }}>
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

/* ---- Trust strip (brand chrome) ---- */
function TrustStrip() {
  return (
    <div className={s.trustStrip}>
      <div className={s.trustInner}>
        {[
          { icon: "🏅", label: "BIS Hallmarked", sub: "916 & 925 certified" },
          { icon: "💎", label: "GIA Certified", sub: "Every diamond verified" },
          { icon: "🔒", label: "Secure Packaging", sub: "Insured delivery" },
          { icon: "↩️", label: "30-Day Returns", sub: "Hassle-free exchange" },
        ].map(item => (
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
function CollectionsSection({ categories }: { categories: HomeProps["categories"] }) {
  if (categories.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Curated for You</span>
          <h2 className={s.sectionTitle}>Our Collections</h2>
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
                <div className={s.collectionCta}>Explore Collection →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Craftsmanship editorial (brand chrome) ---- */
function CraftsmanshipSection() {
  return (
    <section className={`${s.section} ${s.sectionDark}`}>
      <div className={s.container}>
        <div className={s.aboutHero} style={{ gap: 80 }}>
          <div className={s.aboutHeroImg}>
            <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=85" alt="Craftsmanship" />
          </div>
          <div>
            <span className={s.sectionLabel}>Our Promise</span>
            <h2 className={s.sectionTitle} style={{ color: "#fff" }}>
              Three generations<br />of mastery.
            </h2>
            <GoldDivider />
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, margin: "0 0 32px", maxWidth: 400 }}>
              Every piece is made by hand in our atelier by master artisans whose skills have passed
              through generations. Hallmarked, certified, and crafted to be worn for a lifetime.
            </p>
            <Link href="/shop" className={`${s.btn} ${s.btnOutlineGold}`}>Shop the Collection →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---- Certifications (brand chrome) ---- */
function CertificationSection() {
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
          {[
            { icon: "🏅", title: "BIS Hallmarked", desc: "Every gold piece is hallmarked under the Bureau of Indian Standards." },
            { icon: "💎", title: "GIA Certified", desc: "Diamonds graded by the Gemological Institute of America." },
            { icon: "🔬", title: "Gemstone Certified", desc: "Coloured gemstones certified by the most respected gem labs." },
            { icon: "🛡️", title: "Lifetime Exchange", desc: "Exchange your jewellery at full value, any time, at any store." },
          ].map(item => (
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

/* ---- Testimonials (brand chrome) ---- */
function Testimonials() {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>From Our Families</span>
          <h2 className={s.sectionTitle}>Words that honour us.</h2>
          <GoldDivider />
        </div>
        <div className={s.testimonialsGrid}>
          {[
            { name: "Sunita Kapoor", city: "Mumbai", stars: 5, piece: "Royal Kundan Bridal Set", text: "The bridal set was beyond anything I imagined. The craftsmanship is extraordinary." },
            { name: "Anil Mehta", city: "Delhi", stars: 5, piece: "Solitaire Diamond Ring", text: "The certificate, the presentation, the service — everything was perfection." },
            { name: "Kavitha Rajan", city: "Bangalore", stars: 5, piece: "Gold Temple Bangles", text: "The detail of the carvings, the weight of the gold — this is heirloom jewellery." },
          ].map((t, i) => (
            <div key={i} className={s.testimonialCard}>
              <div className={s.testimonialStars}>{"★".repeat(t.stars)}</div>
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
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Newsletter (brand chrome) ---- */
function Newsletter() {
  return (
    <section className={s.newsletter}>
      <div className={s.newsletterLabel}>Private Circle</div>
      <h2 className={s.newsletterTitle}>First access. Always.</h2>
      <p className={s.newsletterSub}>
        New collections, private previews, and invitations to exclusive events.
      </p>
      <div className={s.newsletterForm}>
        <input className={s.newsletterInput} type="email" placeholder="Your email address" />
        <button className={s.newsletterBtn}>Join</button>
      </div>
      <p className={s.newsletterPrivacy}>No spam. Unsubscribe anytime. We value your privacy.</p>
    </section>
  )
}

/* ---- Home slot ---- */
export function AurumLivePage({ config, products, newArrivals, deals, categories }: HomeProps) {
  const hasDeals = deals.length > 0
  return (
    <div className={s.page} style={aurumColorVars(config)}>
      <AurumNav config={config} hasDeals={hasDeals} categories={categories} />
      <Hero config={config} hasDeals={hasDeals} />
      <TrustStrip />
      <CollectionsSection categories={categories} />
      <ProductSection
        label="Just Arrived" title="New Arrivals"
        sub="Freshly crafted, now available. Each piece certified and ready to ship."
        products={newArrivals.slice(0, 3)} cta={{ label: "View All", href: "/shop" }}
        cream grid3
      />
      <CraftsmanshipSection />
      <ProductSection
        label="Most Loved" title="Bestsellers"
        sub="Our most celebrated pieces, cherished by families across India."
        products={products.slice(0, 4)} cta={{ label: "Shop All", href: "/shop" }}
      />
      <CertificationSection />
      <ProductSection
        label="Limited Time" title="Special Offers"
        sub="Exceptional pieces at exceptional value."
        products={deals.slice(0, 4)} cta={{ label: "View Offers", href: "/deals" }}
      />
      <Testimonials />
      <Newsletter />
      <AurumFooter config={config} hasDeals={hasDeals} />
    </div>
  )
}
