"use client"

import Link from "next/link"
import {
  NavBar, Footer, ProductCard, TrustStrip,
  NewsletterSection, GoldDivider, Reveal, PageLoader,
} from "./_components"
import { PRODUCTS, COLLECTIONS } from "./_data"
import s from "./_styles.module.css"

// ---- Hero ----------------------------------------------------------------
const Hero = () => (
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

// ---- Featured Collections ------------------------------------------------
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

// ---- New Arrivals --------------------------------------------------------
const NewArrivals = () => (
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
        {PRODUCTS.filter(p => p.badge === "New").slice(0, 3).map((p, i) => (
          <ProductCard key={p.id} product={p} delay={(i % 3) as 0|1|2} />
        ))}
      </div>
    </div>
  </section>
)

// ---- Bridal Editorial ----------------------------------------------------
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

// ---- Bestsellers ---------------------------------------------------------
const Bestsellers = () => (
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
        {PRODUCTS.filter(p => p.badge === "Bestseller").slice(0, 4).map((p, i) => (
          <ProductCard key={p.id} product={p} delay={(i % 4) as 0|1|2|3} />
        ))}
      </div>
    </div>
  </section>
)

// ---- Craftsmanship -------------------------------------------------------
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

// ---- Collections Grid ----------------------------------------------------
const CollectionsGrid = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter} style={{ marginBottom: 16 }}>
          <span className={s.sectionLabel}>Explore Further</span>
          <h2 className={s.sectionTitle}>More Collections</h2>
        </div>
      </Reveal>
      <div className={s.collectionGrid2}>
        {COLLECTIONS.slice(3).map((col, i) => (
          <Reveal key={col.id} delay={(i % 2) as 0|1|2|3}>
            <Link href="/preview/aurum/collections" className={s.collectionCard} style={{ aspectRatio: "4/5" }}>
              <img src={col.image} alt={col.name} />
              <div className={s.collectionOverlay} />
              <div className={s.collectionInfo}>
                <div className={s.collectionTheme}>{col.theme}</div>
                <div className={s.collectionName}>{col.name}</div>
                <div className={s.collectionCount}>{col.count} pieces</div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

// ---- Certifications -------------------------------------------------------
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

// ---- Testimonials --------------------------------------------------------
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

// ---- Gift Editorial -------------------------------------------------------
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

// ---- Store Locations strip -----------------------------------------------
const StoreStrip = () => (
  <section className={`${s.sectionMd} ${s.sectionWarm}`}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionHead}>
          <div>
            <span className={s.sectionLabel}>Experience Aurum</span>
            <h2 className={s.sectionTitle}>Visit a Store</h2>
            <p className={s.sectionSub}>Five flagship boutiques across India. Book a private appointment for personalised service.</p>
          </div>
          <Link href="/preview/aurum/store-locator" className={`${s.btn} ${s.btnDark}`}>
            All Locations
          </Link>
        </div>
      </Reveal>
      <div style={{ display: "flex", gap: 2 }}>
        {["Mumbai", "New Delhi", "Bangalore", "Chennai", "Hyderabad"].map((city, i) => (
          <div key={city} style={{
            flex: 1,
            background: "#fff",
            padding: "24px",
            borderLeft: i === 0 ? "2px solid #b8962e" : "1px solid #e8e0d4",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#b8962e", marginBottom: 6 }}>
              Store {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 16, fontWeight: 400, color: "#1a1410", marginBottom: 4 }}>{city}</div>
            <div style={{ fontSize: 11, color: "#a09080", letterSpacing: 0.5 }}>Mon–Sat · 10am–8pm</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ---- Home page -----------------------------------------------------------
export default function AurumHome() {
  return (
    <div className={s.page}>
      <PageLoader />
      <NavBar />
      <Hero />
      <TrustStrip />
      <FeaturedCollections />
      <NewArrivals />
      <BridalEditorial />
      <Bestsellers />
      <CraftsmanshipSection />
      <CollectionsGrid />
      <CertificationSection />
      <Testimonials />
      <GiftSection />
      <StoreStrip />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
