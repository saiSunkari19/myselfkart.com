"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PageShell, TrustStrip, ProductCard, Reveal, Stars } from "./_components"
import { PRODUCTS, CATEGORIES, BRANDS, DEALS, NEW_LAUNCHES, BESTSELLERS } from "./_data"
import s from "./_styles.module.css"

const HERO_SLIDES = [
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

function Hero() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className={s.hero}>
      {HERO_SLIDES.map((slide, i) => (
        <div key={i} className={`${s.heroSlide} ${i === active ? s.heroSlideActive : ""}`}>
          <img src={slide.bg} alt="" className={s.heroImg} />
          <div className={s.heroOverlay} />
        </div>
      ))}
      <div className={s.heroContent}>
        <div className={s.heroText}>
          <div className={s.heroBrand}>{HERO_SLIDES[active].product.brand} · {HERO_SLIDES[active].tagline}</div>
          <h1 className={s.heroTitle}>{HERO_SLIDES[active].product.name}</h1>
          <p className={s.heroSub}>{HERO_SLIDES[active].product.description.slice(0, 100)}...</p>
          <div className={s.heroPrice}>
            <span className={s.heroPriceMain}>₹{HERO_SLIDES[active].product.price.toLocaleString("en-IN")}</span>
            {HERO_SLIDES[active].product.originalPrice && (
              <span className={s.heroPriceOriginal}>₹{HERO_SLIDES[active].product.originalPrice!.toLocaleString("en-IN")}</span>
            )}
            {HERO_SLIDES[active].product.discount && (
              <span className={s.heroPriceDiscount}>{HERO_SLIDES[active].product.discount}% OFF</span>
            )}
          </div>
          <div className={s.heroActions}>
            <Link href={`/preview/volt/products/${HERO_SLIDES[active].product.id}`} className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>Shop Now</Link>
            <Link href="/preview/volt/shop" className={`${s.btn} ${s.btnDark} ${s.btnLg}`}>View All</Link>
          </div>
        </div>
      </div>
      <div className={s.heroDots}>
        {HERO_SLIDES.map((_, i) => (
          <div key={i} className={`${s.heroDot} ${i === active ? s.heroDotActive : ""}`} onClick={() => setActive(i)} />
        ))}
      </div>
    </div>
  )
}

function CategoryBar() {
  const cats = CATEGORIES.slice(0, 8).map(c => c.name)
  return (
    <div className={s.categoryBar}>
      <div className={s.categoryBarInner}>
        <Link href="/preview/volt/shop" className={s.categoryBarItem}>All</Link>
        {cats.map(cat => (
          <Link key={cat} href={`/preview/volt/shop?category=${encodeURIComponent(cat)}`} className={s.categoryBarItem}>
            {cat}
          </Link>
        ))}
      </div>
    </div>
  )
}

const REVIEWS = [
  { name: "Rahul Sharma", rating: 5, text: "Absolutely love my new iPhone! Volt delivered it next day, packaged perfectly. Genuine product, great price.", product: "iPhone 16 Pro Max", avatar: "R" },
  { name: "Priya Mehta", rating: 5, text: "Sony WH-1000XM6 is life-changing. Ordered at midnight, arrived by noon. Will shop here always.", product: "Sony WH-1000XM6", avatar: "P" },
  { name: "Amit Patel", rating: 4, text: "Great experience, MacBook Pro arrived in perfect condition. EMI process was seamless.", product: "MacBook Pro M4 Pro", avatar: "A" },
  { name: "Sneha Joshi", rating: 5, text: "Best prices I found anywhere online. Plus they have 24/7 support which saved me. 10/10.", product: "Samsung Galaxy S25", avatar: "S" },
]

export default function VoltHome() {
  return (
    <PageShell>
      <Hero />
      <TrustStrip />
      <CategoryBar />

      {/* Shop by Category */}
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
              <Reveal key={cat.id} delay={(i % 4) as 0|1|2|3}>
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

      {/* New Launches */}
      <section className={s.section}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Just In</span>
                <div className={s.sectionTitle}>New Launches</div>
                <div className={s.sectionSub}>The latest releases from the world's top brands</div>
              </div>
              <Link href="/preview/volt/new-launches" className={s.viewAll}>View All →</Link>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {NEW_LAUNCHES.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Top Deals */}
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
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Brand */}
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
              <Reveal key={brand.id} delay={(i % 4) as 0|1|2|3}>
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

      {/* Bestsellers */}
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
          <div className={s.productGrid}>
            {BESTSELLERS.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Buy */}
      <section className={`${s.section} ${s.sectionDark}`}>
        <div className={s.container}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className={s.sectionLabel} style={{ color: "#60a5fa" }}>Why Volt</span>
              <div className={s.sectionTitle} style={{ color: "#fff" }}>Built for Trust</div>
            </div>
          </Reveal>
          <div className={s.grid4}>
            {[
              { icon: "🏆", title: "10+ Years of Trust", text: "Serving 50 lakh+ customers since 2014 with consistent quality." },
              { icon: "📦", title: "Same-Day Dispatch", text: "Order before 3 PM and get your product dispatched same day." },
              { icon: "🔧", title: "Expert Support", text: "Certified technicians available for all product queries." },
              { icon: "💯", title: "Price Promise", text: "Found it cheaper? We'll match it. No questions asked." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) as 0|1|2|3}>
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

      {/* Reviews */}
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
          <div className={s.grid4}>
            {REVIEWS.map((r, i) => (
              <Reveal key={r.name} delay={(i % 4) as 0|1|2|3}>
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
    </PageShell>
  )
}
