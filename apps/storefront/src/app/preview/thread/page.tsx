"use client"

import Link from "next/link"
import { NavBar, Footer, ProductCard, NewsletterSection } from "./_components"
import { PRODUCTS, CATEGORIES } from "./_data"
import s from "./_styles.module.css"

const Hero = () => (
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

const NewArrivals = () => (
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
        {PRODUCTS.filter(p => p.tag === "New").map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  </section>
)

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

const BestSellers = () => (
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
        {PRODUCTS.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  </section>
)

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

const SaleSection = () => (
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
        {PRODUCTS.filter(p => p.tag === "Sale").map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  </section>
)

export default function ThreadHome() {
  return (
    <div className={s.page}>
      <NavBar />
      <Hero />
      <div style={{ paddingTop: 0 }}>
      <NewArrivals />
      <CategoriesSection />
      <EditorialBanner />
      <BestSellers />
      <Testimonials />
      <SaleSection />
      <NewsletterSection />
      </div>
      <Footer />
    </div>
  )
}
