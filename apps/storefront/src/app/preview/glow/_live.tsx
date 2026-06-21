"use client"

import React, { useEffect, useRef, useState } from "react"
import type { StoreConfig } from "../../../lib/store-config"
import type { StoreProduct } from "../../../lib/medusa/products"
import {
  NavBar, TrustStrip, GoldDivider, PageLoader,
  Reveal, ProductCard, BeforeAfterSlider, Footer,
} from "./_components"
import {
  PRODUCTS, COLLECTIONS, TESTIMONIALS,
  INGREDIENTS, SKIN_CONCERNS, HERO_SLIDES,
  type Product,
} from "./_data"
import s from "./_styles.module.css"

/* ---- Convert Medusa StoreProduct → Glow Product shape ---- */
function toGlowProduct(p: StoreProduct, index: number): Product {
  const price = p.variants?.find(v => v.calculated_price?.calculated_amount != null)
    ?.calculated_price?.calculated_amount ?? 0
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
    "https://images.unsplash.com/photo-1570194065650-d99fb4abbd90?w=600&q=80",
    "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600&q=80",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80",
    "https://images.unsplash.com/photo-1631390783071-1c11b9edadf5?w=600&q=80",
  ]
  const img = p.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return {
    id: p.id,
    name: p.title,
    subtitle: p.description?.slice(0, 60) ?? "",
    category: "Skincare",
    price,
    image: img,
    hoverImage: img,
    rating: 4.5,
    reviews: 128,
    skinTypes: [],
    concerns: [],
    description: p.description ?? "",
    keyIngredients: [],
    size: "",
  }
}

/* ---- Hero (config-aware) ---- */
const Hero = ({ config }: { config: StoreConfig | null }) => {
  const [current, setCurrent] = useState(0)
  const total = HERO_SLIDES.length

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  const prev = () => setCurrent(c => (c - 1 + total) % total)
  const next = () => setCurrent(c => (c + 1) % total)

  // If seller set a custom hero heading, show a single config-driven slide
  const hasCustomHero = !!(config?.hero_heading)
  const heroImage = config?.hero_image_url || HERO_SLIDES[current].image
  const heroHeading = config?.hero_heading || HERO_SLIDES[current].heading
  const heroSub = config?.hero_subtext || HERO_SLIDES[current].sub
  const heroCta = config?.hero_cta

  if (hasCustomHero) {
    return (
      <section className={s.hero}>
        <div className={`${s.heroSlide} ${s.heroSlideActive}`}>
          <img src={heroImage} alt={heroHeading} className={s.heroBg} />
          <div className={s.heroOverlay} />
        </div>
        <div className={s.heroContent}>
          <div className={s.heroLabel}>{config?.tagline ?? "Your Skin. Your Story."}</div>
          <h1 className={s.heroTitle}>{heroHeading}</h1>
          {heroSub && <p className={s.heroSub}>{heroSub}</p>}
          <div className={s.heroCtas}>
            <a
              href={heroCta?.primary_link ?? "/shop"}
              className={`${s.btn} ${s.btnDark}`}
              style={{ background: "rgba(250,248,244,0.95)", color: "#2A2A2A" }}
            >
              {heroCta?.primary_label ?? "Shop Now"}
            </a>
            {heroCta?.secondary_label && (
              <a href={heroCta.secondary_link ?? "#"} className={`${s.btn} ${s.btnOutlineLight}`}>
                {heroCta.secondary_label}
              </a>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default: carousel from _data.ts
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
          <div key={i} className={`${s.heroDot} ${i === current ? s.heroDotActive : ""}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
      <div className={s.heroControls}>
        <button className={s.heroArrow} onClick={prev}>←</button>
        <button className={s.heroArrow} onClick={next}>→</button>
      </div>
      <div className={s.heroProgress} key={current} />
    </section>
  )
}

/* ---- Static sections (same as page.tsx) ---- */
const BrandStory = () => (
  <div className={s.storySection}>
    <div className={s.storyImage}>
      <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=85" alt="Our Story" className={s.storyImg} loading="lazy" />
    </div>
    <Reveal className={s.storyContent}>
      <span className={s.sectionLabel}>Our Philosophy</span>
      <h2 className={s.sectionTitle} style={{ textAlign: "left" }}>Skin science<br />should feel like poetry.</h2>
      <div className={s.storyQuote}>"Beauty rooted in transparency, powered by science."</div>
      <p className={s.sectionSub}>We believe every skin has a story. Clean, clinical skincare that delivers visible results.</p>
      <div className={s.storyStats}>
        {[{ num: "30+", label: "Active Ingredients" }, { num: "2.4L+", label: "Happy Skin Stories" }, { num: "4.8★", label: "Average Rating" }, { num: "100%", label: "Dermatologist Approved" }].map(({ num, label }) => (
          <div key={label} className={s.storyStat}>
            <div className={s.storyStatNum}>{num}</div>
            <div className={s.storyStatLabel}>{label}</div>
          </div>
        ))}
      </div>
    </Reveal>
  </div>
)

const FeaturedCollections = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>Curated Edits</span><h2 className={s.sectionTitle}>Shop by Skin Goal</h2><GoldDivider /></div></Reveal>
      <div className={s.collectionsGrid}>
        {COLLECTIONS.map((col, i) => (
          <Reveal key={col.id} delay={(i % 4) as 0|1|2|3|4|5}>
            <a href="/shop" className={s.collectionCard}>
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

const SkinConcernFinder = () => {
  const [active, setActive] = useState("brightening")
  const concern = SKIN_CONCERNS.find(c => c.id === active)!
  const products = concern.products.map(id => PRODUCTS.find(p => p.id === id)!).filter(Boolean)
  return (
    <section className={`${s.section} ${s.concernSection}`}>
      <div className={s.container}>
        <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>Personalised For You</span><h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>What's your skin concern?</h2><GoldDivider /></div></Reveal>
        <div className={s.concernTabs}>
          {SKIN_CONCERNS.map(c => <button key={c.id} className={`${s.concernTab} ${active === c.id ? s.concernTabActive : ""}`} onClick={() => setActive(c.id)}>{c.icon} {c.label}</button>)}
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

const BestSellers = ({ products }: { products: Product[] }) => {
  const items = products.filter(p => p.badge === "Bestseller" || p.badge === "Award Winner" || p.badge === "New").slice(0, 4)
  const display = items.length > 0 ? items : products.slice(0, 4)
  return (
    <section className={s.section}>
      <div className={s.container}>
        <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>Community Favourites</span><h2 className={s.sectionTitle}>Best Sellers</h2><GoldDivider /></div></Reveal>
        <div className={s.productsGrid}>
          {display.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><ProductCard {...p} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const AllProducts = ({ products }: { products: Product[] }) => (
  <section className={s.section} style={{ background: "var(--beige)" }}>
    <div className={s.container}>
      <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>Full Range</span><h2 className={s.sectionTitle}>Shop All Products</h2><GoldDivider /></div></Reveal>
      <div className={s.productsGrid}>
        {products.map((p, i) => <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><ProductCard {...p} /></Reveal>)}
      </div>
    </div>
  </section>
)

const IngredientSpotlight = () => (
  <section className={`${s.section} ${s.ingredientSection}`}>
    <div className={s.container}>
      <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>Clean Chemistry</span><h2 className={s.sectionTitle}>Inside Every Formula</h2><GoldDivider /></div></Reveal>
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

const BeforeAfter = () => (
  <section className={`${s.section} ${s.beforeAfterSection}`}>
    <div className={s.container}>
      <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>Real Results</span><h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>See the difference.</h2><GoldDivider /></div></Reveal>
      <div className={s.beforeAfterWrap}>
        <Reveal><BeforeAfterSlider before="https://images.unsplash.com/photo-1569163139294-de4944aa5b62?w=600&q=85" after="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=85" /></Reveal>
        <Reveal delay={2}>
          <div className={s.baResults}>
            {[{ num: "89%", label: "reported visibly brighter skin" }, { num: "76%", label: "saw reduction in dark spots" }, { num: "94%", label: "said skin felt smoother & softer" }, { num: "4 weeks", label: "average time to visible results" }].map(({ num, label }) => (
              <div key={label} className={s.baStat}><div className={s.baStatNum}>{num}</div><div className={s.baStatLabel}>{label}</div></div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
)

const Testimonials = () => (
  <section className={s.section}>
    <div className={s.container}>
      <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>Skin Stories</span><h2 className={s.sectionTitle}>Real People. Real Results.</h2><GoldDivider /></div></Reveal>
      <div className={s.testimonialsGrid}>
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.id} delay={(i % 2) as 0|1|2|3|4|5}>
            <div className={s.testimonialCard}>
              <div className={s.testimonialStars}>{Array.from({ length: t.rating }).map((_, j) => <span key={j} className={s.starFill}>★</span>)}</div>
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

const Newsletter = () => (
  <section className={s.newsletterSection}>
    <div className={s.container}>
      <Reveal>
        <span className={s.sectionLabel}>Join the Ritual</span>
        <h2 className={s.sectionTitle}>Glow tips, new launches<br />& exclusive offers.</h2>
        <div className={s.newsletterForm}>
          <input type="email" placeholder="your@email.com" className={s.newsletterInput} />
          <button className={`${s.btn} ${s.btnDark}`}>Subscribe</button>
        </div>
      </Reveal>
    </div>
  </section>
)

/* ---- Main export ---- */
export function GlowLivePage({ config, products: rawProducts = [] }: { config: StoreConfig | null; products?: StoreProduct[] }) {
  const storeName = config?.store_name ?? "glow."
  const logoUrl = config?.logo_url ?? null
  const announcementText = config?.announcement_text ?? null
  const announcementEnabled = config?.announcement_enabled ?? true

  // Use real products if available, fall back to mock data
  const products: Product[] = rawProducts.length > 0
    ? rawProducts.map(toGlowProduct)
    : PRODUCTS

  const colorOverrides = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold": config.accent_color }      : {}),
  } as React.CSSProperties

  return (
    <div className={s.page} style={colorOverrides}>
      <PageLoader />
      <NavBar storeName={storeName} logoUrl={logoUrl} announcementText={announcementEnabled ? announcementText : null} />
      <div className={s.headerSpacer} />
      <Hero config={config} />
      <TrustStrip />
      <BrandStory />
      <FeaturedCollections />
      <SkinConcernFinder />
      <BestSellers products={products} />
      <IngredientSpotlight />
      <BeforeAfter />
      <AllProducts products={products} />
      <Testimonials />
      <Newsletter />
      <Footer storeName={storeName} />
    </div>
  )
}
