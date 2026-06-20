"use client"

import { useEffect, useRef, useState } from "react"
import {
  NavBar, AnnouncementBar, TrustStrip, GoldDivider,
  PageLoader, Reveal, ProductCard, BeforeAfterSlider, Footer,
} from "./_components"
import { PRODUCTS, COLLECTIONS, TESTIMONIALS, INGREDIENTS, SKIN_CONCERNS, HERO_SLIDES } from "./_data"
import s from "./_styles.module.css"

/* ---- Hero ---- */
const Hero = () => {
  const [current, setCurrent] = useState(0)
  const total = HERO_SLIDES.length

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)

  return (
    <section className={s.hero}>
      {HERO_SLIDES.map((slide, i) => (
        <div key={slide.id} className={`${s.heroSlide} ${i === current ? s.heroSlideActive : ""}`}>
          <img src={slide.image} alt={slide.heading} className={s.heroBg} />
          <div className={s.heroOverlay} />
        </div>
      ))}

      <div className={s.heroContent}>
        <div className={s.heroLabel}>{HERO_SLIDES[current].label}</div>
        <h1 className={s.heroTitle}>{HERO_SLIDES[current].heading}</h1>
        <p className={s.heroSub}>{HERO_SLIDES[current].sub}</p>
        <div className={s.heroCtas}>
          <a href="#" className={`${s.btn} ${s.btnDark}`} style={{ background: "rgba(250,248,244,0.95)", color: "#2A2A2A" }}>
            {HERO_SLIDES[current].cta}
          </a>
          <a href="#" className={`${s.btn} ${s.btnOutlineLight}`}>Find My Routine</a>
        </div>
      </div>

      <div className={s.heroDots}>
        {HERO_SLIDES.map((_, i) => (
          <div
            key={i}
            className={`${s.heroDot} ${i === current ? s.heroDotActive : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      <div className={s.heroControls}>
        <button className={s.heroArrow} onClick={prev} aria-label="Previous">←</button>
        <button className={s.heroArrow} onClick={next} aria-label="Next">→</button>
      </div>

      <div className={s.heroProgress} key={current} />
    </section>
  )
}

/* ---- Brand Story ---- */
const BrandStory = () => (
  <div className={s.storySection}>
    <div className={s.storyImage}>
      <img
        src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=85"
        alt="Our Story"
        className={s.storyImg}
        loading="lazy"
      />
    </div>
    <Reveal className={s.storyContent}>
      <span className={s.sectionLabel}>Our Philosophy</span>
      <h2 className={s.sectionTitle} style={{ textAlign: "left" }}>
        Skin science<br />should feel like poetry.
      </h2>
      <div className={s.storyQuote}>"Beauty rooted in transparency, powered by science."</div>
      <p className={s.sectionSub}>
        We believe every skin has a story. Ours begins with 3 years of research,
        partnering with leading dermatologists and botanists to create formulas
        that actually work — without compromise. No fillers. No fragrance. No greenwashing.
        Just clean, clinical skincare that delivers visible results.
      </p>
      <div className={s.storyStats}>
        {[
          { num: "30+", label: "Active Ingredients" },
          { num: "2.4L+", label: "Happy Skin Stories" },
          { num: "4.8★", label: "Average Rating" },
          { num: "100%", label: "Dermatologist Approved" },
        ].map(({ num, label }) => (
          <div key={label} className={s.storyStat}>
            <div className={s.storyStatNum}>{num}</div>
            <div className={s.storyStatLabel}>{label}</div>
          </div>
        ))}
      </div>
    </Reveal>
  </div>
)

/* ---- Collections ---- */
const FeaturedCollections = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel}>Curated Edits</span>
          <h2 className={s.sectionTitle}>Shop by Skin Goal</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.collectionsGrid}>
        {COLLECTIONS.map((col, i) => (
          <Reveal key={col.id} delay={(i % 4) as 0|1|2|3|4|5}>
            <a href="#" className={s.collectionCard}>
              <img src={col.image} alt={col.name} className={s.collectionImg} loading="lazy" />
              <div className={s.collectionOverlay}>
                <div className={s.collectionName}>{col.name}</div>
                <div className={s.collectionTagline}>{col.tagline}</div>
                <div className={s.collectionCount}>{col.count} Products →</div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Skin Concern Finder ---- */
const SkinConcernFinder = () => {
  const [active, setActive] = useState("brightening")
  const concern = SKIN_CONCERNS.find(c => c.id === active)!
  const products = concern.products.map(id => PRODUCTS.find(p => p.id === id)!).filter(Boolean)

  return (
    <section className={`${s.section} ${s.concernSection}`}>
      <div className={s.container}>
        <Reveal>
          <div className={s.sectionCenter}>
            <span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>Personalised For You</span>
            <h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>What's your skin concern?</h2>
            <GoldDivider />
          </div>
        </Reveal>

        <div className={s.concernTabs}>
          {SKIN_CONCERNS.map(c => (
            <button
              key={c.id}
              className={`${s.concernTab} ${active === c.id ? s.concernTabActive : ""}`}
              onClick={() => setActive(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className={s.concernProducts}>
          {products.map(p => (
            <div key={p.id} className={s.concernProductCard}>
              <img src={p.image} alt={p.name} className={s.concernProductImg} loading="lazy" />
              <div>
                <div className={s.concernProductName}>{p.name}</div>
                <div style={{ fontSize: 12, color: "rgba(250,248,244,0.5)", marginBottom: 8 }}>{p.subtitle}</div>
                <div className={s.concernProductPrice}>₹{p.price.toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Best Sellers ---- */
const BestSellers = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel}>Community Favourites</span>
          <h2 className={s.sectionTitle}>Best Sellers</h2>
          <GoldDivider />
          <p className={s.sectionSub} style={{ marginTop: 16 }}>
            Loved by 2,40,000+ skin lovers. Rated 4.8★ on average.
          </p>
        </div>
      </Reveal>
      <div className={s.productsGrid}>
        {PRODUCTS.filter(p => p.badge === "Bestseller" || p.badge === "Award Winner" || p.badge === "New").slice(0, 4).map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}>
            <ProductCard {...p} />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- All Products ---- */
const AllProducts = () => (
  <section className={s.section} style={{ background: "var(--beige)" }}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel}>Full Range</span>
          <h2 className={s.sectionTitle}>Shop All Products</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.productsGrid}>
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}>
            <ProductCard {...p} />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Ingredient Spotlight ---- */
const IngredientSpotlight = () => (
  <section className={`${s.section} ${s.ingredientSection}`}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel}>Clean Chemistry</span>
          <h2 className={s.sectionTitle}>Inside Every Formula</h2>
          <GoldDivider />
          <p className={s.sectionSub} style={{ marginTop: 16 }}>
            We believe in full transparency. Every ingredient earns its place in our formulas.
          </p>
        </div>
      </Reveal>
      <div className={s.ingredientsGrid}>
        {INGREDIENTS.map((ing, i) => (
          <Reveal key={ing.id} delay={(i % 3) as 0|1|2|3|4|5}>
            <div className={s.ingredientCard} style={{ ["--color" as string]: ing.color }}>
              <span className={s.ingredientIcon} style={{ color: ing.color }}>{ing.icon}</span>
              <div className={s.ingredientName}>{ing.name}</div>
              <div className={s.ingredientSource}>{ing.source}</div>
              <div className={s.ingredientBenefit}>{ing.benefit}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Before & After ---- */
const BeforeAfter = () => (
  <section className={`${s.section} ${s.beforeAfterSection}`}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>Real Results</span>
          <h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>See the difference.</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.beforeAfterWrap}>
        <Reveal>
          <BeforeAfterSlider
            before="https://images.unsplash.com/photo-1569163139294-de4944aa5b62?w=600&q=85"
            after="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=85"
          />
        </Reveal>
        <Reveal delay={2}>
          <div className={s.baResults}>
            <div>
              <span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>Luminous Veil Serum · 8-Week Study</span>
              <p style={{ color: "rgba(250,248,244,0.7)", fontSize: 15, marginTop: 12, lineHeight: 1.7 }}>
                In an independent clinical study of 94 participants using the Luminous Veil Serum twice daily, results after 8 weeks showed significant improvement across all measured skin parameters.
              </p>
            </div>
            {[
              { num: "89%", label: "reported visibly brighter skin" },
              { num: "76%", label: "saw reduction in dark spots" },
              { num: "94%", label: "said skin felt smoother & softer" },
              { num: "4 weeks", label: "average time to visible results" },
            ].map(({ num, label }) => (
              <div key={label} className={s.baStat}>
                <div className={s.baStatNum}>{num}</div>
                <div className={s.baStatLabel}>{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
)

/* ---- Testimonials ---- */
const Testimonials = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal>
        <div className={s.sectionCenter}>
          <span className={s.sectionLabel}>Skin Stories</span>
          <h2 className={s.sectionTitle}>Real People. Real Results.</h2>
          <GoldDivider />
        </div>
      </Reveal>
      <div className={s.testimonialsGrid}>
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.id} delay={(i % 2) as 0|1|2|3|4|5}>
            <div className={s.testimonialCard}>
              <div className={s.testimonialStars}>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className={s.starFill}>★</span>
                ))}
              </div>
              <p className={s.testimonialText}>"{t.text}"</p>
              <div className={s.testimonialResult}>✓ {t.result}</div>
              <div className={s.testimonialAuthor}>
                <img src={t.avatar} alt={t.name} className={s.testimonialAvatar} loading="lazy" />
                <div>
                  <div className={s.testimonialName}>{t.name}, {t.age}</div>
                  <div className={s.testimonialMeta}>{t.skinType} · {t.concern}</div>
                  {t.verified && <div className={s.verifiedBadge}>✓ Verified Purchase</div>}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
)

/* ---- Newsletter ---- */
const Newsletter = () => (
  <section className={s.newsletterSection}>
    <div className={s.container}>
      <Reveal>
        <span className={s.sectionLabel}>Join the Ritual</span>
        <h2 className={s.sectionTitle}>
          Glow tips, new launches<br />& exclusive offers.
        </h2>
        <p className={s.sectionSub} style={{ margin: "0 auto" }}>
          Join 85,000+ skin lovers. Get personalised skincare advice, early access to launches, and members-only discounts.
        </p>
        <div className={s.newsletterForm}>
          <input
            type="email"
            placeholder="your@email.com"
            className={s.newsletterInput}
          />
          <button className={`${s.btn} ${s.btnDark}`}>Subscribe</button>
        </div>
      </Reveal>
    </div>
  </section>
)

/* ---- Page ---- */
export default function GlowPage() {
  return (
    <div className={s.page}>
      <PageLoader />
      <NavBar />
      <div className={s.headerSpacer} />
      <Hero />
      <TrustStrip />
      <BrandStory />
      <FeaturedCollections />
      <SkinConcernFinder />
      <BestSellers />
      <IngredientSpotlight />
      <BeforeAfter />
      <AllProducts />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  )
}
