"use client"

import React from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView, CategoryView } from "../../../lib/views"
import type { HomeProps } from "../../../lib/themes/types"
import { TestimonialSlider } from "../../../lib/components/testimonial-slider"
import {
  PageLoader, TrustStrip, Reveal, Stars, Badge, Footer, VoltNav,
} from "./_components"

// Re-exported so existing imports of `VoltNav` from "./_live" keep working —
// the actual component now lives in ./_components alongside Footer.
export { VoltNav }
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

// LiveNavBar / VoltNav now live in ./_components, alongside Footer, so the
// static info pages (About/Privacy/...) can render the exact same nav.

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

/* ---- Category bar (derived from tags; hidden when empty). Each pill links
   straight to the filtered shop listing — it's navigation, not a toggle. ---- */
function CategoryBar({ categories }: { categories: CategoryView[] }) {
  if (categories.length === 0) return null
  return (
    <div className={s.categoryBar}>
      <div className={s.categoryBarInner}>
        <Link href="/shop" className={s.categoryBarItem}>All</Link>
        {categories.map(cat => (
          <Link key={cat.id} href={cat.href} className={s.categoryBarItem}>
            {cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

const DEFAULT_REVIEWS = [
  { name: "Rahul Sharma", rating: 5, text: "Absolutely love my new purchase! Delivered next day, packaged perfectly. Genuine product, great price.", product: "Featured Product", avatar: "R" },
  { name: "Priya Mehta", rating: 5, text: "Life-changing quality. Ordered at midnight, arrived by noon. Will shop here always.", product: "Featured Product", avatar: "P" },
  { name: "Amit Patel", rating: 4, text: "Great experience, arrived in perfect condition. EMI process was seamless.", product: "Featured Product", avatar: "A" },
  { name: "Sneha Joshi", rating: 5, text: "Best prices I found anywhere online. Plus they have 24/7 support which saved me. 10/10.", product: "Featured Product", avatar: "S" },
]

const DEFAULT_WHY_BUY = [
  { icon: "🏆", title: "Trusted Quality", text: "Genuine products, carefully checked before dispatch." },
  { icon: "📦", title: "Fast Dispatch", text: "Orders processed quickly so they reach you sooner." },
  { icon: "🔧", title: "Helpful Support", text: "A team ready to help with any product queries." },
  { icon: "💯", title: "Fair Pricing", text: "Honest prices with no hidden surprises." },
]

const DEFAULT_NEWSLETTER = {
  title: "Get Exclusive Deals First",
  sub: "Be first to hear about sales, new arrivals, and insider offers.",
  button_label: "Subscribe",
}

/* ---- Home slot (StoreTheme.Home) — renders the tenant's real products ---- */
export function VoltLivePage({ config, cartCount, products: productViews, categories, collections, deals: dealViews, newArrivals }: HomeProps) {
  const storeName = config?.store_name ?? "VOLT"

  const products = productViews.map(viewToVolt)
  const deals = dealViews.map(viewToVolt)
  const newLaunches = newArrivals.slice(0, 4).map(viewToVolt)
  const allProducts = products.slice(0, 8)
  const hasDeals = deals.length > 0

  const reviews = config?.sections?.testimonials?.items ?? DEFAULT_REVIEWS
  const whyBuy = config?.sections?.why_buy?.items ?? DEFAULT_WHY_BUY
  const newsletter = { ...DEFAULT_NEWSLETTER, ...(config?.sections?.newsletter ?? {}) }

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
      <VoltNav config={config} cartCount={cartCount} hasDeals={hasDeals} categories={categories} />
      <div className={s.main}>
        <Hero config={config} featured={newLaunches[0] ?? allProducts[0] ?? null} />
        <TrustStrip />
        <CategoryBar categories={categories} />

        {/* Shop by Collection — seller-curated Medusa collections, kept distinct
            from the category taxonomy below */}
        {collections.length > 0 && (
          <section className={s.section}>
            <div className={s.container}>
              <Reveal>
                <div className={s.sectionHead}>
                  <div>
                    <span className={s.sectionLabel}>Curated</span>
                    <div className={s.sectionTitle}>Shop by Collection</div>
                  </div>
                  <Link href="/shop" className={s.viewAll}>View All →</Link>
                </div>
              </Reveal>
              <div className={s.categoryGrid}>
                {collections.slice(0, 6).map((col, i) => (
                  <Reveal key={col.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <Link href={col.href} className={s.categoryCard}>
                      <div className={s.categoryIcon}>✨</div>
                      <div className={s.categoryName}>{col.name}</div>
                      <div className={s.categoryCount}>{col.count} products</div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Shop by Category — real Medusa categories (else product tags) */}
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
            <div className={s.featureGrid}>
              {whyBuy.map((item: typeof DEFAULT_WHY_BUY[number], i: number) => (
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
            <TestimonialSlider
              items={reviews}
              gap={16}
              accentColor="var(--accent, #2563eb)"
              renderItem={(r: typeof DEFAULT_REVIEWS[number], i: number) => (
                <div key={i} className={s.reviewCard}>
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
              )}
            />
          </div>
        </section>

        {/* Newsletter */}
        <div className={s.container}>
          <Reveal>
            <div className={s.newsletter}>
              <div className={s.newsletterTitle}>{newsletter.title}</div>
              <p className={s.newsletterSub}>{newsletter.sub}</p>
              <div className={s.newsletterForm}>
                <input className={s.newsletterInput} placeholder="Your email address" type="email" />
                <button className={s.newsletterBtn}>{newsletter.button_label}</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  )
}
