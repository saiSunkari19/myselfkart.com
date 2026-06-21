"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { StoreProduct } from "../../../lib/medusa/products"
import { TemplateConfigProvider } from "../../../lib/template-config-context"
import {
  PageLoader, TrustStrip, ProductCard, Reveal, Stars, Badge, Footer,
} from "./_components"
import {
  PRODUCTS, CATEGORIES, BRANDS, DEALS, BESTSELLERS,
  type Product,
} from "./_data"
import s from "./_styles.module.css"

/* ---- Convert Medusa StoreProduct → Volt Product shape ---- */
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=85",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=85",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=85",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=85",
  "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=85",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=85",
]

function toVoltProduct(p: StoreProduct, index: number): Product {
  const price = p.variants?.find(v => v.calculated_price?.calculated_amount != null)
    ?.calculated_price?.calculated_amount ?? 0
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: p.handle ?? p.id,
    name: p.title,
    brand: "",
    category: "Featured",
    price,
    rating: 4.5,
    reviewCount: 0,
    image: img,
    images: [img],
    badge: undefined,
    inStock: true,
    warranty: "",
    description: p.description ?? "",
    highlights: [],
    specs: [],
  }
}

/* ---- Live product card: links to the real PDP /products/<handle> ---- */
function LiveProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className={s.productCard}>
      <div className={s.productCardImg}>
        <img src={product.image} alt={product.name} />
        <div className={s.productCardBadge}><Badge type={product.badge} /></div>
        <div className={s.productCardActions}>
          <button className={s.productActionBtn} onClick={e => e.preventDefault()} title="Quick View">👁</button>
          <button className={s.productActionBtn} onClick={e => e.preventDefault()} title="Compare">⚖</button>
        </div>
      </div>
      <div className={s.productCardBody}>
        {product.brand && <div className={s.productCardBrand}>{product.brand}</div>}
        <div className={s.productCardName}>{product.name}</div>
        <div className={s.productCardRating}>
          <div className={s.ratingBadge}>
            <span style={{ color: "#f59e0b" }}>★</span>
            {product.rating}
          </div>
          <span className={s.reviewCount}>({product.reviewCount.toLocaleString()})</span>
        </div>
        <div className={s.productCardPrice}>
          <span className={s.priceMain}>₹{product.price.toLocaleString("en-IN")}</span>
          {product.originalPrice && (
            <span className={s.priceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
          )}
          {product.discount && (
            <span className={s.priceDiscount}>{product.discount}% off</span>
          )}
        </div>
        {product.emi && <div className={s.productCardEmi}>EMI from {product.emi}</div>}
        {product.delivery && <div className={s.productCardDelivery}>🚚 {product.delivery}</div>}
      </div>
    </Link>
  )
}

/* ---- Config-aware NavBar (drives store name / logo / announcement) ---- */
function NavBar({ storeName, logoUrl, announcementText }: {
  storeName: string
  logoUrl: string | null
  announcementText: string | null
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return (
    <>
      {announcementText && (
        <div className={s.announcementBar}>
          <span className={s.announcementText}>{announcementText}</span>
        </div>
      )}
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
        <div className={s.navInner}>
          <Link href="/" className={s.navLogo}>
            {logoUrl
              ? <img src={logoUrl} alt={storeName} style={{ height: 28, width: "auto", objectFit: "contain" }} />
              : <>{storeName}<span className={s.navLogoAccent}>.</span></>}
          </Link>
          <div className={s.navSearch}>
            <input className={s.navSearchInput} placeholder="Search for products..." />
            <button className={s.navSearchBtn}>🔍</button>
          </div>
          <div className={s.navLinks}>
            <Link href="/deals" className={s.navLink}>Deals</Link>
            <Link href="/new-launches" className={s.navLink}>New</Link>
            <Link href="/brands" className={s.navLink}>Brands</Link>
            <Link href="/cart" className={s.navCart}>
              🛒 Cart
              <span className={s.cartCount}>2</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Hero (config-aware) ---- */
const DEFAULT_HERO_SLIDES = [
  {
    product: PRODUCTS[0],
    bg: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1600&q=85",
    tagline: "The Ultimate Smartphone",
  },
  {
    product: PRODUCTS[2],
    bg: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=85",
    tagline: "Power. Redefined.",
  },
  {
    product: PRODUCTS[3],
    bg: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=85",
    tagline: "Hear Every Detail",
  },
]

function Hero({ config }: { config: StoreConfig | null }) {
  const [active, setActive] = useState(0)
  const hasCustomHero = !!(config?.hero_heading)

  useEffect(() => {
    if (hasCustomHero) return
    const t = setInterval(() => setActive(i => (i + 1) % DEFAULT_HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [hasCustomHero])

  if (hasCustomHero) {
    const heroImage = config?.hero_image_url || DEFAULT_HERO_SLIDES[0].bg
    const heroCta = config?.hero_cta
    return (
      <div className={s.hero}>
        <div className={`${s.heroSlide} ${s.heroSlideActive}`}>
          <img src={heroImage} alt="" className={s.heroImg} />
          <div className={s.heroOverlay} />
        </div>
        <div className={s.heroContent}>
          <div className={s.heroText}>
            {config?.tagline && <div className={s.heroBrand}>{config.tagline}</div>}
            <h1 className={s.heroTitle}>{config?.hero_heading}</h1>
            {config?.hero_subtext && <p className={s.heroSub}>{config.hero_subtext}</p>}
            <div className={s.heroActions}>
              <Link href={heroCta?.primary_link ?? "/shop"} className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
                {heroCta?.primary_label ?? "Shop Now"}
              </Link>
              {heroCta?.secondary_label && (
                <Link href={heroCta.secondary_link ?? "#"} className={`${s.btn} ${s.btnDark} ${s.btnLg}`}>
                  {heroCta.secondary_label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.hero}>
      {DEFAULT_HERO_SLIDES.map((slide, i) => (
        <div key={i} className={`${s.heroSlide} ${i === active ? s.heroSlideActive : ""}`}>
          <img src={slide.bg} alt="" className={s.heroImg} />
          <div className={s.heroOverlay} />
        </div>
      ))}
      <div className={s.heroContent}>
        <div className={s.heroText}>
          <div className={s.heroBrand}>{DEFAULT_HERO_SLIDES[active].product.brand} · {DEFAULT_HERO_SLIDES[active].tagline}</div>
          <h1 className={s.heroTitle}>{DEFAULT_HERO_SLIDES[active].product.name}</h1>
          <p className={s.heroSub}>{DEFAULT_HERO_SLIDES[active].product.description.slice(0, 100)}...</p>
          <div className={s.heroPrice}>
            <span className={s.heroPriceMain}>₹{DEFAULT_HERO_SLIDES[active].product.price.toLocaleString("en-IN")}</span>
            {DEFAULT_HERO_SLIDES[active].product.originalPrice && (
              <span className={s.heroPriceOriginal}>₹{DEFAULT_HERO_SLIDES[active].product.originalPrice!.toLocaleString("en-IN")}</span>
            )}
            {DEFAULT_HERO_SLIDES[active].product.discount && (
              <span className={s.heroPriceDiscount}>{DEFAULT_HERO_SLIDES[active].product.discount}% OFF</span>
            )}
          </div>
          <div className={s.heroActions}>
            <Link href={`/preview/volt/products/${DEFAULT_HERO_SLIDES[active].product.id}`} className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Shop Now</Link>
            <Link href="/preview/volt/shop" className={`${s.btn} ${s.btnDark} ${s.btnLg}`}>View All</Link>
          </div>
        </div>
      </div>
      <div className={s.heroDots}>
        {DEFAULT_HERO_SLIDES.map((_, i) => (
          <div key={i} className={`${s.heroDot} ${i === active ? s.heroDotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  )
}

/* ---- Category bar (mock) ---- */
function CategoryBar() {
  const [active, setActive] = useState("All")
  const cats = ["All", ...CATEGORIES.slice(0, 8).map(c => c.name)]
  return (
    <div className={s.categoryBar}>
      <div className={s.categoryBarInner}>
        {cats.map(cat => (
          <button key={cat} className={`${s.categoryBarItem} ${cat === active ? s.categoryBarItemActive : ""}`} onClick={() => setActive(cat)}>
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

const REVIEWS = [
  { name: "Rahul Sharma", rating: 5, text: "Absolutely love my new purchase! Delivered next day, packaged perfectly. Genuine product, great price.", product: "Featured Product", avatar: "R" },
  { name: "Priya Mehta", rating: 5, text: "Life-changing quality. Ordered at midnight, arrived by noon. Will shop here always.", product: "Featured Product", avatar: "P" },
  { name: "Amit Patel", rating: 4, text: "Great experience, arrived in perfect condition. EMI process was seamless.", product: "Featured Product", avatar: "A" },
  { name: "Sneha Joshi", rating: 5, text: "Best prices I found anywhere online. Plus they have 24/7 support which saved me. 10/10.", product: "Featured Product", avatar: "S" },
]

/* ---- Main export ---- */
export function VoltLivePage({ config, products: rawProducts = [] }: { config: StoreConfig | null; products?: StoreProduct[] }) {
  const storeName = config?.store_name ?? "VOLT"
  const logoUrl = config?.logo_url ?? null
  const announcementEnabled = config?.announcement_enabled ?? true
  const announcementText = announcementEnabled
    ? (config?.announcement_text ?? "🎉 VOLT SALE — Up to 40% off on top brands")
    : null

  // Real products with mock fallback
  const products: Product[] = rawProducts.length > 0
    ? rawProducts.map(toVoltProduct)
    : PRODUCTS
  const isLive = rawProducts.length > 0

  const newLaunches = products.slice(0, 4)
  const bestsellers = products.slice(0, 4)
  const allProducts = products.slice(0, 8)

  // Map seller colours onto volt's :root CSS vars
  const colorOverrides = {
    ...(config?.accent_color    ? { "--accent": config.accent_color }       : {}),
    ...(config?.primary_color   ? { "--text": config.primary_color }        : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color }        : {}),
  } as React.CSSProperties

  // Render product grids with real PDP links when live, mock cards otherwise
  const renderGrid = (items: Product[]) => (
    <div className={s.productGrid}>
      {items.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
          {isLive ? <LiveProductCard product={p} /> : <ProductCard product={p} />}
        </Reveal>
      ))}
    </div>
  )

  return (
    <TemplateConfigProvider config={config} basePath="">
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <NavBar storeName={storeName} logoUrl={logoUrl} announcementText={announcementText} />
      <div className={s.main}>
        <Hero config={config} />
        <TrustStrip />
        <CategoryBar />

        {/* Shop by Category (mock decorative) */}
        <section className={`${s.section} ${s.sectionBg}`}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Browse</span>
                  <div className={s.sectionTitle}>Shop by Category</div>
                </div>
                <Link href="/preview/volt/categories" className={s.viewAll}>View All →</Link>
              </div>
            </Reveal>
            <div className={s.categoryGrid}>
              {CATEGORIES.slice(0, 6).map((cat, i) => (
                <Reveal key={cat.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <Link href={`/preview/volt/shop?category=${cat.id}`} className={s.categoryCard}>
                    <div className={s.categoryIcon}>{cat.icon}</div>
                    <div className={s.categoryName}>{cat.name}</div>
                    <div className={s.categoryCount}>{cat.count}+ products</div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* New Launches (real products) */}
        <section className={s.section}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Just In</span>
                  <div className={s.sectionTitle}>New Launches</div>
                  <div className={s.sectionSub}>The latest releases from {storeName}</div>
                </div>
                <Link href="/preview/volt/new-launches" className={s.viewAll}>View All →</Link>
              </div>
            </Reveal>
            {renderGrid(newLaunches)}
          </div>
        </section>

        {/* Top Deals (mock decorative) */}
        <section className={`${s.section} ${s.sectionBg}`}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Limited Time</span>
                  <div className={s.sectionTitle}>Today's Best Deals</div>
                  <div className={s.sectionSub}>Prices drop at midnight — don't miss out</div>
                </div>
                <Link href="/preview/volt/deals" className={s.viewAll}>All Deals →</Link>
              </div>
            </Reveal>
            <div className={s.productGrid}>
              {DEALS.slice(0, 4).map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Brand (mock decorative) */}
        <section className={s.section}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Authorised</span>
                  <div className={s.sectionTitle}>Shop by Brand</div>
                </div>
                <Link href="/preview/volt/brands" className={s.viewAll}>All Brands →</Link>
              </div>
            </Reveal>
            <div className={s.brandGrid}>
              {BRANDS.slice(0, 5).map((brand, i) => (
                <Reveal key={brand.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <Link href={`/preview/volt/brands#${brand.id}`} className={s.brandCard}>
                    <span className={s.brandLogo}>{brand.logo}</span>
                    <div>
                      <div className={s.brandName}>{brand.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{brand.count} products</div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bestsellers (real products) */}
        <section className={`${s.section} ${s.sectionBg}`}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Customer Favourites</span>
                  <div className={s.sectionTitle}>Best Sellers</div>
                </div>
                <Link href="/preview/volt/best-sellers" className={s.viewAll}>View All →</Link>
              </div>
            </Reveal>
            {renderGrid(isLive ? bestsellers : BESTSELLERS.slice(0, 4))}
          </div>
        </section>

        {/* Shop All (real products) */}
        <section className={s.section}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Full Range</span>
                  <div className={s.sectionTitle}>Shop All Products</div>
                </div>
                <Link href="/preview/volt/shop" className={s.viewAll}>View All →</Link>
              </div>
            </Reveal>
            {renderGrid(allProducts)}
          </div>
        </section>

        {/* Why Buy (decorative) */}
        <section className={`${s.section} ${s.sectionDark}`}>
          <div className={s.container}>
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <span className={s.sectionLabel} style={{ color: "#60a5fa" }}>Why {storeName}</span>
                <div className={s.sectionTitle} style={{ color: "#fff" }}>Built for Trust</div>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              {[
                { icon: "🏆", title: "10+ Years of Trust", text: "Serving 50 lakh+ customers with consistent quality." },
                { icon: "📦", title: "Same-Day Dispatch", text: "Order before 3 PM and get your product dispatched same day." },
                { icon: "🔧", title: "Expert Support", text: "Certified technicians available for all product queries." },
                { icon: "💯", title: "Price Promise", text: "Found it cheaper? We'll match it. No questions asked." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <div style={{ textAlign: "center", padding: "28px 20px" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{item.text}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews (decorative) */}
        <section className={s.section}>
          <div className={s.container}>
            <Reveal>
              <div className={s.sectionHead}>
                <div>
                  <span className={s.sectionLabel}>Testimonials</span>
                  <div className={s.sectionTitle}>What Customers Say</div>
                </div>
              </div>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {REVIEWS.map((r, i) => (
                <Reveal key={r.name} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <div className={s.reviewCard}>
                    <div className={s.reviewHeader}>
                      <div className={s.reviewAvatar}>{r.avatar}</div>
                      <div>
                        <div className={s.reviewName}>{r.name}</div>
                        <Stars rating={r.rating} />
                      </div>
                    </div>
                    <p className={s.reviewText}>{r.text}</p>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10 }}>Verified purchase · {r.product}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <div className={s.container}>
          <Reveal>
            <div className={s.newsletter}>
              <div className={s.newsletterTitle}>Get Exclusive Deals First</div>
              <p className={s.newsletterSub}>Join 2 million+ subscribers. First access to sales, new launches, and insider offers.</p>
              <div className={s.newsletterForm}>
                <input className={s.newsletterInput} placeholder="Your email address" type="email" />
                <button className={s.newsletterBtn}>Subscribe</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
    </TemplateConfigProvider>
  )
}
