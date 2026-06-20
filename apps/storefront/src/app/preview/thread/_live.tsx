"use client"

import React from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { StoreProduct } from "../../../lib/medusa/products"
import { NavBar, Footer, ProductCard, NewsletterSection } from "./_components"
import { PRODUCTS, CATEGORIES, type Product } from "./_data"
import s from "./_styles.module.css"

/* ---- Convert Medusa StoreProduct → Thread Product shape ---- */
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

// Thread's Product type plus an optional handle so real products can link out.
type ThreadProduct = Product & { handle?: string | null }

// Real product handles are routed through to the detail page; the mock products
// (which lack handles) keep their numeric id-based links inside ProductCard.
function productHref(p: ThreadProduct): string {
  return p.handle ? `/products/${p.handle}` : `/preview/thread/products/${p.id}`
}

function toThreadProduct(p: StoreProduct, index: number): ThreadProduct {
  const price =
    p.variants?.find(v => v.calculated_price?.calculated_amount != null)
      ?.calculated_price?.calculated_amount ?? 0
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: p.id,
    name: p.title,
    category: "Apparel",
    price,
    image: img,
    images: [img],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [],
    description: p.description ?? "",
    details: [],
    handle: p.handle,
  }
}

/* ---- A ProductCard that links to the real handle when present ---- */
const LiveProductCard = ({ product }: { product: ThreadProduct }) => {
  if (product.handle) {
    return (
      <Link href={productHref(product)} className={s.productCard}>
        <div className={s.productImageWrap}>
          <img src={product.image} alt={product.name} />
          {product.tag && (
            <span className={`${s.productBadge} ${product.tag === "New" ? s.badgeNew : product.tag === "Sale" ? s.badgeSale : s.badgeSoldOut}`}>
              {product.tag}
            </span>
          )}
          <div className={s.productQuickAdd}>
            <button className={s.productQuickAddBtn}>Quick Add +</button>
          </div>
        </div>
        <div className={s.productName}>{product.name}</div>
        <div className={s.productCategory}>{product.category}</div>
        <div className={s.productPriceRow}>
          <span className={`${s.productPrice} ${product.originalPrice ? s.productPriceSale : ""}`}>
            ₹{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>
      </Link>
    )
  }
  return <ProductCard product={product} />
}

/* ---- Hero (config-aware) ---- */
const Hero = ({ config }: { config: StoreConfig | null }) => {
  const hasCustomHero = !!config?.hero_heading
  const heroCta = config?.hero_cta

  if (hasCustomHero) {
    return (
      <section className={s.hero}>
        <div className={s.heroLeft}>
          <div className={s.heroLabel}>{config?.tagline ?? "New Arrivals"}</div>
          <h1 className={s.heroTitle}>{config?.hero_heading}</h1>
          {config?.hero_subtext && <p className={s.heroSub}>{config.hero_subtext}</p>}
          <div className={s.heroCtas}>
            <Link href={heroCta?.primary_link ?? "/preview/thread/products"} className={s.btn}>
              {heroCta?.primary_label ?? "Shop Now"}
            </Link>
            {heroCta?.secondary_label && (
              <Link href={heroCta.secondary_link ?? "/preview/thread/categories"} className={`${s.btn} ${s.btnOutline}`}>
                {heroCta.secondary_label}
              </Link>
            )}
          </div>
          <dl className={s.heroStats}>
            {[
              { value: "600+", label: "Styles available" },
              { value: "100%", label: "Natural fabrics" },
              { value: "15K+", label: "Happy customers" },
            ].map(stat => (
              <div key={stat.label} className={s.heroStat}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={s.heroRight}>
          <img
            src={config?.hero_image_url ?? "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85"}
            alt={config?.hero_heading ?? "Editorial"}
            className={s.heroImg}
          />
          <div className={s.heroBadge}>
            <strong>Free returns</strong>
            <span>30-day no-hassle return</span>
          </div>
        </div>
      </section>
    )
  }

  // Default: thread's original styled hero
  return (
    <section className={s.hero}>
      <div className={s.heroLeft}>
        <div className={s.heroLabel}>New Arrivals — Summer 2026</div>
        <h1 className={s.heroTitle}>
          Wear<br />
          the <em>quiet</em><br />
          ones.
        </h1>
        <p className={s.heroSub}>
          Clothing built for the long haul. Natural fabrics, considered cuts, and a palette that never shouts.
        </p>
        <div className={s.heroCtas}>
          <Link href="/preview/thread/products" className={s.btn}>Shop Now</Link>
          <Link href="/preview/thread/categories" className={`${s.btn} ${s.btnOutline}`}>Browse Categories</Link>
        </div>
        <dl className={s.heroStats}>
          {[
            { value: "600+", label: "Styles available" },
            { value: "100%", label: "Natural fabrics" },
            { value: "15K+", label: "Happy customers" },
          ].map(stat => (
            <div key={stat.label} className={s.heroStat}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={s.heroRight}>
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85"
          alt="Thread editorial"
          className={s.heroImg}
        />
        <div className={s.heroBadge}>
          <strong>Free returns</strong>
          <span>30-day no-hassle return</span>
        </div>
      </div>
    </section>
  )
}

/* ---- New Arrivals (real products) ---- */
const NewArrivals = ({ products }: { products: ThreadProduct[] }) => {
  const tagged = products.filter(p => p.tag === "New")
  const display = tagged.length > 0 ? tagged : products.slice(0, 4)
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <div>
            <div className={s.sectionLabel}>Just dropped</div>
            <h2 className={s.sectionTitle}>New Arrivals</h2>
            <p className={s.sectionSub}>Our latest pieces, freshly added to the collection.</p>
          </div>
          <Link href="/preview/thread/products" className={`${s.btn} ${s.btnOutline}`}>View All</Link>
        </div>
        <div className={s.productGrid}>
          {display.map(p => (
            <LiveProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Categories (decorative / mock) ---- */
const CategoriesSection = () => (
  <section className={`${s.section} ${s.sectionSubtle}`}>
    <div className={s.container}>
      <div className={s.sectionCenter}>
        <div className={s.sectionLabel}>Browse the range</div>
        <h2 className={s.sectionTitle}>Shop by Category</h2>
        <p className={`${s.sectionSub} ${s.sectionSubCenter}`}>Find exactly what you're looking for, or discover something new.</p>
      </div>
      <div className={s.categoryGrid}>
        {CATEGORIES.map(cat => (
          <Link key={cat.id} href="/preview/thread/categories" className={s.categoryCard}>
            <img src={cat.image} alt={cat.name} />
            <div className={s.categoryOverlay} />
            <div className={s.categoryInfo}>
              <div className={s.categoryName}>{cat.name}</div>
              <div className={s.categoryCount}>{cat.count} styles</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Editorial banner (decorative / mock) ---- */
const EditorialBanner = () => (
  <section className={s.section}>
    <div className={s.editorialBanner}>
      <img
        src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1400&q=85"
        alt="Editorial"
        className={s.editorialBannerBg}
      />
      <div className={s.editorialBannerOverlay} />
      <div className={s.editorialContent}>
        <div className={s.sectionLabel}>Outerwear Edit</div>
        <h2 className={s.sectionTitle} style={{ color: "#fff", fontSize: "clamp(30px,4vw,52px)" }}>
          The coat that<br />stays forever.
        </h2>
        <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.65)" }}>
          Wool-blend coats and cropped blazers built to outlast the season.
        </p>
        <Link href="/preview/thread/categories" className={`${s.btn} ${s.btnWhite}`}>
          Explore Outerwear →
        </Link>
      </div>
    </div>
  </section>
)

/* ---- Best Sellers (real products) ---- */
const BestSellers = ({ products }: { products: ThreadProduct[] }) => (
  <section className={s.section}>
    <div className={s.container}>
      <div className={s.sectionHead}>
        <div>
          <div className={s.sectionLabel}>Community favourites</div>
          <h2 className={s.sectionTitle}>Best Sellers</h2>
        </div>
        <Link href="/preview/thread/products" className={`${s.btn} ${s.btnOutline}`}>See All</Link>
      </div>
      <div className={`${s.productGrid} ${s.productGrid4}`}>
        {products.slice(0, 4).map(p => (
          <LiveProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  </section>
)

/* ---- Testimonials (decorative / mock) ---- */
const Testimonials = () => (
  <section className={`${s.section} ${s.sectionSubtle}`}>
    <div className={s.container}>
      <div className={s.sectionCenter}>
        <div className={s.sectionLabel}>What they say</div>
        <h2 className={s.sectionTitle}>Loved by wearers</h2>
        <p className={`${s.sectionSub} ${s.sectionSubCenter}`}>Real words from real people.</p>
      </div>
      <div className={s.testimonialsGrid}>
        {[
          { name: "Ananya K.", city: "Bangalore", text: "The linen shirt has become my daily uniform. I've washed it 40 times and it only gets better. Worth every rupee.", stars: 5 },
          { name: "Meera S.", city: "Mumbai", text: "Thread's sizing is consistent and their fabric quality is unmatched. The wrap dress is stunning in person.", stars: 5 },
          { name: "Priyanka R.", city: "Delhi", text: "I was skeptical ordering online but the return policy made it easy. Kept three pieces. The quality is real.", stars: 5 },
        ].map((t, i) => (
          <div key={i} className={s.testimonialCard}>
            <div className={s.testimonialStars}>{"★".repeat(t.stars)}</div>
            <p className={s.testimonialText}>"{t.text}"</p>
            <div className={s.testimonialAuthor}>
              <div className={s.testimonialAvatar}>{t.name[0]}</div>
              <div>
                <div className={s.testimonialName}>{t.name}</div>
                <div className={s.testimonialCity}>{t.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Sale (real products) ---- */
const SaleSection = ({ products }: { products: ThreadProduct[] }) => {
  const onSale = products.filter(p => p.tag === "Sale" || p.originalPrice)
  if (onSale.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.sectionHead}>
          <div>
            <div className={s.sectionLabel}>Limited time</div>
            <h2 className={s.sectionTitle}>On Sale Now</h2>
            <p className={s.sectionSub}>Last-season pieces at honest prices.</p>
          </div>
          <Link href="/preview/thread/products" className={`${s.btn} ${s.btnAccent}`}>Shop the Sale</Link>
        </div>
        <div className={s.productGrid}>
          {onSale.map(p => (
            <LiveProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Main export ---- */
export function ThreadLivePage({ config, products: rawProducts = [] }: { config: StoreConfig | null; products?: StoreProduct[] }) {
  // Use real products if available, fall back to mock data
  const products: ThreadProduct[] =
    rawProducts.length > 0 ? rawProducts.map(toThreadProduct) : PRODUCTS

  // Thread's stylesheet uses hardcoded hex colors and exposes no CSS custom
  // properties, so we publish the conventional store-config vars on the wrapper
  // (matching buildCssVars) for any consumer that reads them.
  const colorOverrides = {
    ...(config?.primary_color   ? { "--store-primary": config.primary_color }     : {}),
    ...(config?.accent_color    ? { "--store-accent": config.accent_color }        : {}),
    ...(config?.secondary_color ? { "--store-secondary": config.secondary_color }  : {}),
  } as React.CSSProperties

  return (
    <div className={s.page} style={colorOverrides}>
      <NavBar />
      <Hero config={config} />
      <div style={{ paddingTop: 0 }}>
        <NewArrivals products={products} />
        <CategoriesSection />
        <EditorialBanner />
        <BestSellers products={products} />
        <Testimonials />
        <SaleSection products={products} />
        <NewsletterSection />
      </div>
      <Footer />
    </div>
  )
}
