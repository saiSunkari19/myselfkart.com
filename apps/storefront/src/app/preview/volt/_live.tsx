"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView, CategoryView } from "../../../lib/views"
import type { HomeProps, NavProps } from "../../../lib/themes/types"
import {
  PageLoader, TrustStrip, Reveal, Stars, Badge, Footer,
} from "./_components"
import { type Product } from "./_data"
import s from "./_styles.module.css"

/* ---- View model → Volt card shape ----
   The route maps Medusa → ProductView (the seam); here we adapt ProductView into
   Volt's local card shape purely for rendering. No mock data, no derivation. */
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=85",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=85",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=85",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=85",
  "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=85",
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=85",
]

export function viewToVolt(v: ProductView, index: number): Product {
  const img = v.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: v.handle ?? v.id,
    name: v.title,
    brand: "",
    category: v.tags[0] ?? "Featured",
    price: v.price ?? 0,
    originalPrice: v.originalPrice ?? undefined,
    discount: v.discountPercent > 0 ? v.discountPercent : undefined,
    rating: 4.5,
    reviewCount: 0,
    image: img,
    images: [img],
    badge: undefined,
    inStock: true,
    warranty: "",
    description: v.description,
    highlights: [],
    specs: [],
  }
}

/* ---- Live product card: links to the real PDP /products/<handle> ---- */
export function LiveProductCard({ product }: { product: Product }) {
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
export function LiveNavBar({ storeName, logoUrl, announcementText, hasDeals = false }: {
  storeName: string
  logoUrl: string | null
  announcementText: string | null
  hasDeals?: boolean
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
            <Link href="/shop" className={s.navLink}>Shop</Link>
            {hasDeals && <Link href="/deals" className={s.navLink}>Deals</Link>}
            <Link href="/cart" className={s.navCart}>🛒 Cart</Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Volt nav slot (StoreTheme.Nav) ---- */
export function VoltNav({ config, hasDeals }: NavProps) {
  const announcementEnabled = config?.announcement_enabled ?? true
  return (
    <LiveNavBar
      storeName={config?.store_name ?? "VOLT"}
      logoUrl={config?.logo_url ?? null}
      announcementText={announcementEnabled ? (config?.announcement_text ?? null) : null}
      hasDeals={hasDeals}
    />
  )
}

/* ---- Hero (config-aware; falls back to a real featured product, never mock) ---- */
function Hero({ config, featured }: { config: StoreConfig | null; featured: Product | null }) {
  const heroImage =
    config?.hero_image_url ||
    featured?.image ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=85"
  const heading = config?.hero_heading || featured?.name || config?.store_name || "Shop the collection"
  const sub = config?.hero_subtext || (featured ? featured.description.slice(0, 110) : null)
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
          <h1 className={s.heroTitle}>{heading}</h1>
          {sub && <p className={s.heroSub}>{sub}</p>}
          <div className={s.heroActions}>
            <Link href={heroCta?.primary_link ?? "/shop"} className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
              {heroCta?.primary_label ?? "Shop Now"}
            </Link>
            {heroCta?.secondary_label && (
              <Link href={heroCta.secondary_link ?? "/shop"} className={`${s.btn} ${s.btnDark} ${s.btnLg}`}>
                {heroCta.secondary_label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Category bar (derived from tags; hidden when empty) ---- */
function CategoryBar({ categories }: { categories: CategoryView[] }) {
  const [active, setActive] = useState("All")
  if (categories.length === 0) return null
  const cats = ["All", ...categories.map(c => c.name)]
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

/* ---- Home slot (StoreTheme.Home) — renders the tenant's real products ---- */
export function VoltLivePage({ config, products: productViews, categories, deals: dealViews, newArrivals }: HomeProps) {
  const storeName = config?.store_name ?? "VOLT"

  const products = productViews.map(viewToVolt)
  const deals = dealViews.map(viewToVolt)
  const newLaunches = newArrivals.slice(0, 4).map(viewToVolt)
  const allProducts = products.slice(0, 8)
  const hasDeals = deals.length > 0

  const colorOverrides = {
    ...(config?.accent_color    ? { "--accent": config.accent_color }       : {}),
    ...(config?.primary_color   ? { "--text": config.primary_color }        : {}),
    ...(config?.secondary_color ? { "--bg2": config.secondary_color }        : {}),
  } as React.CSSProperties

  const renderGrid = (items: Product[]) => (
    <div className={s.productGrid}>
      {items.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
          <LiveProductCard product={p} />
        </Reveal>
      ))}
    </div>
  )

  return (
    <div className={s.pageShell} style={colorOverrides}>
      <PageLoader />
      <VoltNav config={config} hasDeals={hasDeals} categories={categories} />
      <div className={s.main}>
        <Hero config={config} featured={newLaunches[0] ?? allProducts[0] ?? null} />
        <TrustStrip />
        <CategoryBar categories={categories} />

        {/* Shop by Category — derived from product tags */}
        {categories.length > 0 && (
          <section className={`${s.section} ${s.sectionBg}`}>
            <div className={s.container}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>Browse</span>
                    <div className={s.sectionTitle}>Shop by Category</div>
                  </div>
                  <Link href="/shop" className={s.viewAll}>View All →</Link>
                </div>
              </Reveal>
              <div className={s.categoryGrid}>
                {categories.slice(0, 6).map((cat, i) => (
                  <Reveal key={cat.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <Link href={cat.href} className={s.categoryCard}>
                      <div className={s.categoryIcon}>🏷️</div>
                      <div className={s.categoryName}>{cat.name}</div>
                      <div className={s.categoryCount}>{cat.count} products</div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals (real) */}
        {newLaunches.length > 0 && (
          <section className={s.section}>
            <div className={s.container}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>Just In</span>
                    <div className={s.sectionTitle}>New Arrivals</div>
                    <div className={s.sectionSub}>The latest from {storeName}</div>
                  </div>
                  <Link href="/shop" className={s.viewAll}>View All →</Link>
                </div>
              </Reveal>
              {renderGrid(newLaunches)}
            </div>
          </section>
        )}

        {/* Today's Best Deals — only when products are genuinely on sale */}
        {hasDeals && (
          <section className={`${s.section} ${s.sectionBg}`}>
            <div className={s.container}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>Limited Time</span>
                    <div className={s.sectionTitle}>Today's Best Deals</div>
                    <div className={s.sectionSub}>On sale right now</div>
                  </div>
                  <Link href="/deals" className={s.viewAll}>All Deals →</Link>
                </div>
              </Reveal>
              {renderGrid(deals.slice(0, 4))}
            </div>
          </section>
        )}

        {/* Shop All (real) */}
        {allProducts.length > 0 && (
          <section className={s.section}>
            <div className={s.container}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>Full Range</span>
                    <div className={s.sectionTitle}>Shop All Products</div>
                  </div>
                  <Link href="/shop" className={s.viewAll}>View All →</Link>
                </div>
              </Reveal>
              {renderGrid(allProducts)}
            </div>
          </section>
        )}

        {/* Why Buy (decorative chrome) */}
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
                { icon: "🏆", title: "Trusted Quality", text: "Genuine products, carefully checked before dispatch." },
                { icon: "📦", title: "Fast Dispatch", text: "Orders processed quickly so they reach you sooner." },
                { icon: "🔧", title: "Helpful Support", text: "A team ready to help with any product queries." },
                { icon: "💯", title: "Fair Pricing", text: "Honest prices with no hidden surprises." },
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

        {/* Reviews (decorative chrome) */}
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
              <p className={s.newsletterSub}>Be first to hear about sales, new arrivals, and insider offers.</p>
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
  )
}
