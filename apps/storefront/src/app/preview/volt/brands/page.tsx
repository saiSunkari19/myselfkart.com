import Link from "next/link"
import { PageShell, ProductCard, Reveal } from "../_components"
import { BRANDS, PRODUCTS } from "../_data"
import s from "../_styles.module.css"

export default function BrandsPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Authorised Dealer</div>
          <div className={s.pageHeaderTitle}>Shop by Brand</div>
          <div className={s.pageHeaderSub}>Official authorised dealer for all major electronics brands in India</div>
        </div>
      </div>
      <div className={s.container}>
        {/* Brand grid */}
        <section className={s.section}>
          <Reveal>
            <div className={s.sectionHead}>
              <div className={s.sectionTitle}>All Brands</div>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {BRANDS.map((brand, i) => (
              <Reveal key={brand.id} delay={(i % 4) as 0|1|2|3}>
                <div id={brand.id} className={s.brandCard} style={{ flexDirection: "column", padding: "28px 20px", gap: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 36 }}>{brand.logo}</div>
                  <div className={s.brandName} style={{ fontSize: 16 }}>{brand.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{brand.tagline}</div>
                  <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{brand.count} products</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Featured brand products */}
        <section className={`${s.section} ${s.sectionBg}`} style={{ margin: "0 -24px", padding: "40px 24px" }}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Featured</span>
                <div className={s.sectionTitle}>🍎 Apple Products</div>
              </div>
              <Link href="/preview/volt/shop?brand=apple" className={s.viewAll}>View All Apple →</Link>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {PRODUCTS.filter(p => p.brand === "Apple").slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Featured</span>
                <div className={s.sectionTitle}>🔷 Samsung Products</div>
              </div>
              <Link href="/preview/volt/shop?brand=samsung" className={s.viewAll}>View All Samsung →</Link>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {PRODUCTS.filter(p => p.brand === "Samsung").slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
