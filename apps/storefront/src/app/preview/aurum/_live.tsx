"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { StoreProduct } from "../../../lib/medusa/products"
import {
  Footer, TrustStrip, NewsletterSection,
  GoldDivider, Reveal, PageLoader, ProductCard,
} from "./_components"
import { PRODUCTS, COLLECTIONS, type Product } from "./_data"
import s from "./_styles.module.css"

/* ---- Convert Medusa StoreProduct → Aurum Product shape ---- */
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1583292438338-39e574a78eba?w=600&q=85",
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=85",
  "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=85",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=85",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=85",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=85",
]

const BADGE_CYCLE: Array<Product["badge"]> = ["Bestseller", "New", "Bridal", "Limited"]

function toAurumProduct(p: StoreProduct, index: number): Product {
  const price = p.variants?.find(v => v.calculated_price?.calculated_amount != null)
    ?.calculated_price?.calculated_amount ?? 0
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: p.handle ?? p.id,
    name: p.title,
    category: "Fine Jewellery",
    collection: "Eternal Gold",
    metal: "22K Gold",
    stone: undefined,
    price,
    weight: "—",
    purity: "BIS Hallmarked",
    image: img,
    images: [img],
    badge: BADGE_CYCLE[index % BADGE_CYCLE.length],
    certified: true,
    description: p.description ?? "",
    highlights: [],
    details: [],
  }
}

/* ---- Config-aware Product Card (links to /products/<handle>) ---- */
const LiveProductCard = ({ product, handle, delay = 0 }: {
  product: Product
  handle?: string | null
  delay?: 0 | 1 | 2 | 3 | 4
}) => {
  if (!handle) return <ProductCard product={product} delay={delay} />
  return (
    <Reveal delay={delay}>
      <Link href={`/products/${handle}`} className={s.productCard}>
        <div className={s.productImageWrap}>
          <img src={product.image} alt={product.name} />
          {product.badge && (
            <span className={`${s.productBadge} ${
              product.badge === "New" ? s.badgeNew :
              product.badge === "Bestseller" ? s.badgeBestseller :
              product.badge === "Limited" ? s.badgeLimited : s.badgeBridal
            }`}>{product.badge}</span>
          )}
          {product.certified && (
            <span className={s.productCertBadge}>✦ Certified</span>
          )}
          <div className={s.productHoverPanel}>
            <button className={s.productHoverBtn}>View Details</button>
          </div>
        </div>
        <div className={s.productName}>{product.name}</div>
        <div className={s.productMeta}>{product.metal}{product.stone ? ` · ${product.stone}` : ""}</div>
        <div className={s.productPriceRow}>
          <span className={`${s.productPrice} ${product.originalPrice ? s.productPriceSale : ""}`}>
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice && (
            <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
      </Link>
    </Reveal>
  )
}

/* ---- Config-aware NavBar (mirrors _components NavBar markup) ---- */
const LiveNavBar = ({ config }: { config: StoreConfig | null }) => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

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
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
        <div className={s.navInner}>
          <div className={s.navLeft}>
            {[
              { label: "Collections", href: "/preview/aurum/collections" },
              { label: "Shop", href: "/preview/aurum/shop" },
              { label: "Bridal", href: "/preview/aurum/bridal" },
              { label: "New Arrivals", href: "/preview/aurum/new-arrivals" },
            ].map(item => (
              <Link key={item.label} href={item.href} className={s.navLink}>{item.label}</Link>
            ))}
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
            <Link href="/preview/aurum/about" className={s.navIconBtn}>About</Link>
            <Link href="/preview/aurum/store-locator" className={s.navIconBtn}>Stores</Link>
            <Link href="/preview/aurum/cart" className={s.navIconBtn}>
              Bag <span className={s.cartCount}>2</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Hero (config-aware) ---- */
const Hero = ({ config }: { config: StoreConfig | null }) => {
  const hasCustomHero = !!(config?.hero_heading)
  const heroCta = config?.hero_cta

  if (hasCustomHero) {
    return (
      <section className={s.hero} style={{ height: "100vh" }}>
        {config?.hero_image_url ? (
          <img src={config.hero_image_url} alt={config.hero_heading ?? ""} className={s.heroBg} />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=90"
            alt={config?.hero_heading ?? "Hero"}
            className={s.heroBg}
          />
        )}
        <div className={s.heroOverlay} />
        <div className={s.heroContent} style={{ paddingTop: 60 }}>
          <div className={s.heroLabel}>{config?.tagline ?? "New Collection"}</div>
          <h1 className={s.heroTitle}>{config?.hero_heading}</h1>
          {config?.hero_subtext && <p className={s.heroSub}>{config.hero_subtext}</p>}
          <div className={s.heroCtas}>
            <Link href={heroCta?.primary_link ?? "/preview/aurum/collections"} className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
              {heroCta?.primary_label ?? "Explore Collections"}
            </Link>
            {heroCta?.secondary_label && (
              <Link href={heroCta.secondary_link ?? "/preview/aurum/bridal"} className={`${s.btn} ${s.btnWhite} ${s.btnLg}`}>
                {heroCta.secondary_label}
              </Link>
            )}
          </div>
        </div>
        <div className={s.heroScroll}>
          <div className={s.heroScrollLine} />
          <span>Scroll</span>
        </div>
      </section>
    )
  }

  // Default hero from page.tsx
  return (
    <section className={s.hero} style={{ height: "100vh" }}>
      <img
        src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&q=90"
        alt="Aurum Bridal Collection"
        className={s.heroBg}
      />
      <div className={s.heroOverlay} />
      <div className={s.heroContent} style={{ paddingTop: 60 }}>
        <div className={s.heroLabel}>New Collection — Monsoon 2026</div>
        <h1 className={s.heroTitle}>
          Where gold<br />
          meets <em>eternity.</em>
        </h1>
        <p className={s.heroSub}>
          Jewellery crafted for moments that last a lifetime. Hallmarked. Certified. Yours.
        </p>
        <div className={s.heroCtas}>
          <Link href="/preview/aurum/collections" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
            Explore Collections
          </Link>
          <Link href="/preview/aurum/bridal" className={`${s.btn} ${s.btnWhite} ${s.btnLg}`}>
            Bridal Edit
          </Link>
        </div>
      </div>
      <div className={s.heroScroll}>
        <div className={s.heroScrollLine} />
        <span>Scroll</span>
      </div>
    </section>
  )
}

/* ---- Featured Collections (decorative, mock) ---- */
const FeaturedCollections = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Curated for You</span>
          <h2 className={s.sectionTitle}>Our Collections</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.collectionGrid}>
        {COLLECTIONS.slice(0, 3).map((col, i) => (
          <Reveal key={col.id} delay={(i % 3) as 0|1|2}>
            <Link href="/preview/aurum/collections" className={s.collectionCard}>
              <img src={col.image} alt={col.name} />
              <div className={s.collectionOverlay} />
              <div className={s.collectionInfo}>
                <div className={s.collectionTheme}>{col.theme}</div>
                <div className={s.collectionName}>{col.name}</div>
                <div className={s.collectionCount}>{col.count} pieces</div>
                <div className={s.collectionCta}>Explore Collection →</div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- New Arrivals (real products) ---- */
const NewArrivals = ({ products, rawProducts }: { products: Product[]; rawProducts: StoreProduct[] }) => {
  const items = products.slice(0, 3)
  return (
    <section className={`${s.section} ${s.sectionCream}`}>
      <div className={s.container}>
        <Reveal>
          <div className={s.sectionHead}>
            <div>
              <span className={s.sectionLabel}>Just Arrived</span>
              <h2 className={s.sectionTitle}>New Arrivals</h2>
              <p className={s.sectionSub}>Freshly crafted, now available. Each piece certified and ready to ship.</p>
            </div>
            <Link href="/preview/aurum/new-arrivals" className={`${s.btn} ${s.btnOutline}`}>
              View All
            </Link>
          </div>
        </Reveal>
        <div className={s.productGrid3}>
          {items.map((p, i) => (
            <LiveProductCard key={p.id} product={p} handle={rawProducts[i]?.handle} delay={(i % 3) as 0|1|2} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Bridal Editorial (decorative, mock) ---- */
const BridalEditorial = () => (
  <section className={s.editorial} style={{ minHeight: 680 }}>
    <img
      src="https://images.unsplash.com/photo-1583292438338-39e574a78eba?w=1600&q=85"
      alt="Royal Bridal Collection"
      className={s.editorialBg}
    />
    <div className={s.editorialOverlay} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "80px 48px", width: "100%" }}>
      <Reveal>
        <span className={s.sectionLabel}>Royal Bridal 2026</span>
        <h2 className={s.sectionTitle} style={{ color: "#fff", maxWidth: 560, fontSize: "clamp(32px,4vw,60px)" }}>
          For your most radiant day.
        </h2>
        <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.55)", maxWidth: 420 }}>
          Kundan, Polki, and heirloom gold — bridal jewellery crafted over months for a day you'll remember forever.
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
          <Link href="/preview/aurum/bridal" className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
            Explore Bridal
          </Link>
          <Link href="/preview/aurum/contact" className={`${s.btn} ${s.btnWhite}`}>
            Book Appointment
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
)

/* ---- Bestsellers (real products) ---- */
const Bestsellers = ({ products, rawProducts }: { products: Product[]; rawProducts: StoreProduct[] }) => {
  const items = products.slice(0, 4)
  return (
    <section className={s.section}>
      <div className={s.container}>
        <Reveal>
          <div className={s.sectionHead}>
            <div>
              <span className={s.sectionLabel}>Most Loved</span>
              <h2 className={s.sectionTitle}>Bestsellers</h2>
              <p className={s.sectionSub}>Our most celebrated pieces, cherished by thousands of families across India.</p>
            </div>
            <Link href="/preview/aurum/shop" className={`${s.btn} ${s.btnOutlineGold}`}>Shop All</Link>
          </div>
        </Reveal>
        <div className={s.productGrid4}>
          {items.map((p, i) => (
            <LiveProductCard key={p.id} product={p} handle={rawProducts[i]?.handle} delay={(i % 4) as 0|1|2|3} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Craftsmanship (decorative, mock) ---- */
const CraftsmanshipSection = () => (
  <section className={`${s.section} ${s.sectionDark}`}>
    <div className={s.container}>
      <div className={s.aboutHero} style={{ gap: 80 }}>
        <div className={s.aboutHeroImg}>
          <img
            src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=85"
            alt="Aurum craftsmanship"
          />
        </div>
        <Reveal>
          <span className={s.sectionLabel}>Our Promise</span>
          <h2 className={s.sectionTitle} style={{ color: "#fff" }}>
            Three generations<br />of mastery.
          </h2>
          <GoldDivider />
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, margin: "0 0 32px", maxWidth: 400 }}>
            Since 1987, every Aurum piece has been made by hand in our Jaipur atelier. We employ over 200 master artisans — karigar families who have passed their skills down through generations. It takes up to 120 hours to complete a single bridal set.
          </p>
          <Link href="/preview/aurum/about" className={`${s.btn} ${s.btnOutlineGold}`}>
            Our Story →
          </Link>
        </Reveal>
      </div>
    </div>
  </section>
)

/* ---- All Products (real products) ---- */
const AllProducts = ({ products, rawProducts }: { products: Product[]; rawProducts: StoreProduct[] }) => (
  <section className={`${s.section} ${s.sectionCream}`}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Full Range</span>
          <h2 className={s.sectionTitle}>Shop All Pieces</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.productGrid4}>
        {products.map((p, i) => (
          <LiveProductCard key={p.id} product={p} handle={rawProducts[i]?.handle} delay={(i % 4) as 0|1|2|3} />
        ))}
      </div>
    </div>
  </section>
)

/* ---- Certifications (decorative, mock) ---- */
const CertificationSection = () => (
  <section className={`${s.section} ${s.sectionCream}`}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Trust & Authenticity</span>
          <h2 className={s.sectionTitle}>Certified. Verified. Guaranteed.</h2>
          <GoldDivider />
          <p className={`${s.sectionSub} ${s.sectionSubCenter}`}>
            Every Aurum piece comes with full certification and a lifetime exchange guarantee.
          </p>
        </div>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
        {[
          { icon: "🏅", title: "BIS Hallmarked", desc: "Every gold piece is hallmarked under the Bureau of Indian Standards — 916 for 22K, 750 for 18K." },
          { icon: "💎", title: "GIA Certified", desc: "Our diamonds are graded by the Gemological Institute of America — the world's most trusted diamond laboratory." },
          { icon: "🔬", title: "Gemstone Certified", desc: "Coloured gemstones certified by GRS, AGL, or Gübelin — the three most respected gem labs worldwide." },
          { icon: "🛡️", title: "Lifetime Exchange", desc: "We stand behind every piece. Exchange your Aurum jewellery at full value, any time, at any of our stores." },
        ].map((item, i) => (
          <Reveal key={item.title} delay={(i % 4) as 0|1|2|3}>
            <div className={s.certCard}>
              <div className={s.certLogo}>{item.icon}</div>
              <div className={s.certTitle}>{item.title}</div>
              <p className={s.certText}>{item.desc}</p>
              <Link href="/preview/aurum/certification" className={`${s.btn} ${s.btnOutlineGold}`} style={{ fontSize: 10, padding: "10px 20px" }}>
                Learn More
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Testimonials (decorative, mock) ---- */
const Testimonials = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>From Our Families</span>
          <h2 className={s.sectionTitle}>Words that honour us.</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.testimonialsGrid}>
        {[
          { name: "Sunita Kapoor", city: "Mumbai", stars: 5, piece: "Royal Kundan Bridal Set", text: "The bridal set was beyond anything I imagined. My family was speechless. Three months later and I still find myself staring at it. The craftsmanship is extraordinary." },
          { name: "Dr. Anil Mehta", city: "Delhi", stars: 5, piece: "Solitaire Diamond Ring", text: "I purchased the solitaire for our 25th anniversary. The GIA certificate, the presentation, the service — everything was perfection. My wife hasn't taken it off since." },
          { name: "Kavitha Rajan", city: "Bangalore", stars: 5, piece: "Gold Temple Bangles", text: "The temple bangles are incredible — the detail of the carvings, the weight of the gold, the hallmark certificate. Worth every rupee. This is heirloom jewellery." },
        ].map((t, i) => (
          <Reveal key={i} delay={(i % 3) as 0|1|2}>
            <div className={s.testimonialCard}>
              <div className={s.testimonialStars}>{"★".repeat(t.stars)}</div>
              <p className={s.testimonialText}>"{t.text}"</p>
              <div className={s.testimonialAuthor}>
                <div className={s.testimonialAvatar}>{t.name[0]}</div>
                <div>
                  <div className={s.testimonialName}>{t.name}</div>
                  <div className={s.testimonialCity}>{t.city}</div>
                  <div className={s.testimonialPurchase}>{t.piece}</div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Gift Editorial (decorative, mock) ---- */
const GiftSection = () => (
  <section className={s.editorial} style={{ minHeight: 500 }}>
    <img
      src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1400&q=85"
      alt="Gift Collection"
      className={s.editorialBg}
    />
    <div className={s.editorialOverlay} />
    <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "80px 48px", width: "100%" }}>
      <Reveal>
        <span className={s.sectionLabel}>Gift Collection</span>
        <h2 className={s.sectionTitle} style={{ color: "#fff", fontSize: "clamp(28px,3.5vw,52px)" }}>
          The gift of brilliance.
        </h2>
        <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.5)" }}>
          Curated for every occasion — anniversaries, birthdays, milestones. Luxury presentation included.
        </p>
        <Link href="/preview/aurum/gifts" className={`${s.btn} ${s.btnGold}`}>
          Shop Gifts →
        </Link>
      </Reveal>
    </div>
  </section>
)

/* ---- Main export ---- */
export function AurumLivePage({ config, products: rawProducts = [] }: { config: StoreConfig | null; products?: StoreProduct[] }) {
  // Use real products if available, fall back to mock data
  const products: Product[] = rawProducts.length > 0
    ? rawProducts.map(toAurumProduct)
    : PRODUCTS

  // Seller colours mapped onto Aurum's palette as CSS custom properties.
  // Aurum uses hardcoded gold (#b8962e), soft gold (#d4af6a), ink (#1a1410),
  // and white backgrounds; we expose seller overrides as semantic vars.
  const colorOverrides = {
    ...(config?.accent_color    ? { "--aurum-gold": config.accent_color } : {}),
    ...(config?.accent_color    ? { "--aurum-gold-soft": config.accent_color } : {}),
    ...(config?.primary_color   ? { "--aurum-ink": config.primary_color } : {}),
    ...(config?.secondary_color ? { "--aurum-bg": config.secondary_color } : {}),
  } as React.CSSProperties

  return (
    <div className={s.page} style={colorOverrides}>
      <PageLoader />
      <LiveNavBar config={config} />
      <Hero config={config} />
      <TrustStrip />
      <FeaturedCollections />
      <NewArrivals products={products} rawProducts={rawProducts} />
      <BridalEditorial />
      <Bestsellers products={products} rawProducts={rawProducts} />
      <CraftsmanshipSection />
      <AllProducts products={products} rawProducts={rawProducts} />
      <CertificationSection />
      <Testimonials />
      <GiftSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
