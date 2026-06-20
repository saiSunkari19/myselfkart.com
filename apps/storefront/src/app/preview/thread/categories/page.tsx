"use client"

import Link from "next/link"
import { PageShell, ProductCard } from "../_components"
import { CATEGORIES, PRODUCTS } from "../_data"
import s from "../_styles.module.css"

export default function CategoriesPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <div className={`${s.pageTitle} ${s.sectionCenter}`}>
          <div className={s.pageTitleLabel}>The Collection</div>
          <h1 className={s.pageTitleText}>Categories</h1>
          <p className={s.pageTitleSub}>Every category, every cut — all in one place.</p>
        </div>

        {/* Large category grid */}
        <div className={s.categoryLarge}>
          {CATEGORIES.slice(0, 2).map(cat => (
            <Link key={cat.id} href="/preview/thread/products" className={s.categoryLargeCard}>
              <img src={cat.image} alt={cat.name} />
              <div className={s.categoryOverlay} />
              <div className={s.categoryInfo}>
                <div className={s.categoryName} style={{ fontSize: 28 }}>{cat.name}</div>
                <div className={s.categoryCount}>{cat.count} styles available</div>
                <div style={{ color: "#fff", fontSize: 13, marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  Shop now →
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className={s.categoryGrid} style={{ marginBottom: 24 }}>
          {CATEGORIES.slice(2).map(cat => (
            <Link key={cat.id} href="/preview/thread/products" className={s.categoryCard}>
              <img src={cat.image} alt={cat.name} />
              <div className={s.categoryOverlay} />
              <div className={s.categoryInfo}>
                <div className={s.categoryName}>{cat.name}</div>
                <div className={s.categoryCount}>{cat.count} styles</div>
              </div>
            </Link>
          ))}
          {/* Promo card */}
          <div style={{
            borderRadius: 16, background: "#0d0d0d",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: 24, aspectRatio: "2/3",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#c4956a", marginBottom: 8 }}>
              Exclusive
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: -0.5 }}>
              New Season<br />Capsule
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              Curated pieces for every wardrobe.
            </p>
            <Link href="/preview/thread/products" className={`${s.btn} ${s.btnWhite}`} style={{ fontSize: 12, padding: "10px 18px" }}>
              Explore →
            </Link>
          </div>
        </div>

        {/* Featured from each category */}
        {CATEGORIES.map(cat => {
          const catProducts = PRODUCTS.filter(p => p.category === cat.name).slice(0, 3)
          return (
            <section key={cat.id} className={s.sectionTight}>
              <div className={s.sectionHead}>
                <div>
                  <div className={s.sectionLabel}>{cat.count} styles</div>
                  <h2 className={s.sectionTitle}>{cat.name}</h2>
                  <p className={s.sectionSub}>{cat.description}</p>
                </div>
                <Link href="/preview/thread/products" className={`${s.btn} ${s.btnOutline}`}>
                  Shop {cat.name}
                </Link>
              </div>
              <div className={s.productGrid}>
                {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )
        })}
      </div>
    </PageShell>
  )
}
