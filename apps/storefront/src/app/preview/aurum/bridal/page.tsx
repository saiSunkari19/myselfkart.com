"use client"

import Link from "next/link"
import { PageShell, ProductCard, Reveal, GoldDivider, NewsletterSection } from "../_components"
import { PRODUCTS } from "../_data"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const bridalProducts = PRODUCTS.filter(p => p.category === "Bridal")

export default function BridalPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      {/* Cinematic hero */}
      <section className={s.hero}>
        <img
          src="https://images.unsplash.com/photo-1583292438338-39e574a78eba?w=1600&q=90"
          alt="Royal Bridal Collection"
          className={s.heroBg}
        />
        <div className={s.heroOverlay} />
        <div className={s.heroContent} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className={s.heroLabel}>Royal Bridal Collection 2026</div>
          <h1 className={s.heroTitle} style={{ maxWidth: 700, textAlign: "center" }}>
            Begin forever <em>beautifully.</em>
          </h1>
          <p className={s.heroSub} style={{ textAlign: "center" }}>
            Every bridal set is crafted over 80–120 hours by our master karigar. Traditional Kundan, Polki, and 22K gold — for the most important day of your life.
          </p>
          <div className={s.heroCtas}>
            <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
              Book Bridal Appointment
            </Link>
            <a href="#collection" className={`${s.btn} ${s.btnWhite} ${s.btnLg}`}>
              View Collection
            </a>
          </div>
        </div>
      </section>

      {/* Why Aurum Bridal */}
      <section className={`${s.sectionMd} ${s.sectionCream}`}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter} style={{ marginBottom: 56 }}>
              <span className={s.sectionLabel}>The Aurum Bridal Promise</span>
              <h2 className={s.sectionTitle}>Why brides choose Aurum</h2>
              <GoldDivider />
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28 }}>
            {[
              { icon: "⏳", title: "80–120 Hours", sub: "Per bridal set" },
              { icon: "✋", title: "Hand-Crafted", sub: "By master karigar" },
              { icon: "🏅", title: "BIS 916", sub: "Hallmark guaranteed" },
              { icon: "🎁", title: "Bridal Box", sub: "Museum-quality packaging" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) as 0|1|2|3}>
                <div style={{ textAlign: "center", padding: "32px 20px", background: "#fff", borderTop: "2px solid #b8962e" }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{item.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 400, color: "#1a1410", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#a09080", letterSpacing: 0.5 }}>{item.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bridal Collection */}
      <section id="collection" className={s.section}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionHead}>
              <div>
                <span className={s.sectionLabel}>Bridal Collection</span>
                <h2 className={s.sectionTitle}>Bridal Jewellery Sets</h2>
                <p className={s.sectionSub}>Complete sets and individual pieces — from necklaces and maang tikka to bangles and earrings.</p>
              </div>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {bridalProducts.map((p, i) => <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />)}
          </div>
        </div>
      </section>

      {/* Appointment CTA */}
      <section className={`${s.sectionMd} ${s.sectionDark}`}>
        <div className={s.container}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
              <span className={s.sectionLabel}>Private Bridal Consultation</span>
              <h2 className={s.sectionTitle} style={{ color: "#fff" }}>Let us dress your wedding.</h2>
              <GoldDivider />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 36 }}>
                Our bridal specialists will guide you through the entire process — from design consultation to final fitting. Every detail, perfectly handled.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
                  Book Appointment
                </Link>
                <Link href={`${basePath}/store-locator`} className={`${s.btn} ${s.btnOutlineGold}`}>
                  Visit a Store
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <NewsletterSection />
    </PageShell>
  )
}
