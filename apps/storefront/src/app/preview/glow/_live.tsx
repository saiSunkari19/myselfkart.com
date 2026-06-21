"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import type { StoreConfig } from "../../../lib/store-config"
import type { ProductView } from "../../../lib/views"
import type { HomeProps, NavProps } from "../../../lib/themes/types"
import {
  AnnouncementBar, TrustStrip, GoldDivider, PageLoader,
  Reveal, BeforeAfterSlider, Footer,
} from "./_components"
import { TESTIMONIALS, INGREDIENTS, HERO_SLIDES } from "./_data"
import s from "./_styles.module.css"

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
  "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80",
  "https://images.unsplash.com/photo-1570194065650-d99fb4abbd90?w=600&q=80",
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=600&q=80",
]

function cardImage(v: ProductView, index: number): string {
  return v.thumbnail ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

/* ---- Live product card: links to the real PDP ---- */
export function GlowLiveProductCard({ product, index = 0 }: { product: ProductView; index?: number }) {
  const img = cardImage(product, index)
  return (
    <Link href={product.href} className={s.productCard} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div className={s.productImageWrap}>
        <img src={img} alt={product.title} className={s.productImg} loading="lazy" />
        <img src={img} alt={product.title} className={`${s.productImg} ${s.productImgHover}`} loading="lazy" />
        {product.isOnSale && <span className={`${s.productBadge} ${s.badgeLimited}`}>Sale</span>}
      </div>
      <div className={s.productCategory}>{product.tags[0] ?? "Featured"}</div>
      <div className={s.productName}>{product.title}</div>
      <div className={s.productSub}>{product.description.slice(0, 60)}</div>
      <div className={s.productFooter}>
        <div>
          <span className={s.productPrice}>₹{(product.price ?? 0).toLocaleString("en-IN")}</span>
          {product.originalPrice && (
            <span className={s.productOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ---- Live nav (links to live routes, not the /preview demo) ---- */
export function GlowLiveNav({ config, hasDeals }: NavProps) {
  const storeName = config?.store_name ?? "glow."
  const logoUrl = config?.logo_url ?? null
  const announcementEnabled = config?.announcement_enabled ?? true
  const announcementText = announcementEnabled ? (config?.announcement_text ?? undefined) : undefined
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <div className={s.stickyHeader}>
      <AnnouncementBar text={announcementText} />
      <nav className={`${s.navbar} ${scrolled ? s.navbarScrolled : ""}`}>
        <Link href="/" className={s.navLogo}>
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ height: 32, objectFit: "contain" }} />
            : storeName}
        </Link>
        <ul className={s.navLinks}>
          <li><Link href="/shop" className={s.navLink}>Shop</Link></li>
          {hasDeals && <li><Link href="/deals" className={s.navLink}>Offers</Link></li>}
        </ul>
        <div className={s.navActions}>
          <Link href="/cart" className={s.navCart}>
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </Link>
        </div>
      </nav>
    </div>
  )
}

/* ---- Hero (config-aware; generic marketing fallback) ---- */
const Hero = ({ config }: { config: StoreConfig | null }) => {
  const [current, setCurrent] = useState(0)
  const total = HERO_SLIDES.length
  const hasCustomHero = !!config?.hero_heading

  useEffect(() => {
    if (hasCustomHero) return
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total, hasCustomHero])

  if (hasCustomHero) {
    const heroImage = config?.hero_image_url || HERO_SLIDES[0].image
    const heroCta = config?.hero_cta
    return (
      <section className={s.hero}>
        <div className={`${s.heroSlide} ${s.heroSlideActive}`}>
          <img src={heroImage} alt={config?.hero_heading ?? ""} className={s.heroBg} />
          <div className={s.heroOverlay} />
        </div>
        <div className={s.heroContent}>
          <div className={s.heroLabel}>{config?.tagline ?? "Your Skin. Your Story."}</div>
          <h1 className={s.heroTitle}>{config?.hero_heading}</h1>
          {config?.hero_subtext && <p className={s.heroSub}>{config.hero_subtext}</p>}
          <div className={s.heroCtas}>
            <Link href={heroCta?.primary_link ?? "/shop"} className={`${s.btn} ${s.btnDark}`} style={{ background: "rgba(250,248,244,0.95)", color: "#2A2A2A" }}>
              {heroCta?.primary_label ?? "Shop Now"}
            </Link>
            {heroCta?.secondary_label && (
              <Link href={heroCta.secondary_link ?? "/shop"} className={`${s.btn} ${s.btnOutlineLight}`}>
                {heroCta.secondary_label}
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

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
          <Link href="/shop" className={`${s.btn} ${s.btnDark}`} style={{ background: "rgba(250,248,244,0.95)", color: "#2A2A2A" }}>
            {HERO_SLIDES[current].cta}
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---- Decorative chrome (kept as template identity) ---- */
const BrandStory = () => (
  <div className={s.storySection}>
    <div className={s.storyImage}>
      <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=85" alt="Our Story" className={s.storyImg} loading="lazy" />
    </div>
    <Reveal className={s.storyContent}>
      <span className={s.sectionLabel}>Our Philosophy</span>
      <h2 className={s.sectionTitle} style={{ textAlign: "left" }}>Skin science<br />should feel like poetry.</h2>
      <div className={s.storyQuote}>&quot;Beauty rooted in transparency, powered by science.&quot;</div>
      <p className={s.sectionSub}>We believe every skin has a story. Clean, clinical skincare that delivers visible results.</p>
    </Reveal>
  </div>
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
              <p className={s.testimonialText}>&quot;{t.text}&quot;</p>
              <div className={s.testimonialResult}>✓ {t.result}</div>
              <div className={s.testimonialAuthor}>
                <img src={t.avatar} alt={t.name} className={s.testimonialAvatar} loading="lazy" />
                <div>
                  <div className={s.testimonialName}>{t.name}, {t.age}</div>
                  <div className={s.testimonialMeta}>{t.skinType} · {t.concern}</div>
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
        <h2 className={s.sectionTitle}>Glow tips, new launches<br />&amp; exclusive offers.</h2>
        <div className={s.newsletterForm}>
          <input type="email" placeholder="your@email.com" className={s.newsletterInput} />
          <button className={`${s.btn} ${s.btnDark}`}>Subscribe</button>
        </div>
      </Reveal>
    </div>
  </section>
)

/* ---- Section of real products ---- */
function ProductSection({ label, title, products }: { label: string; title: string; products: ProductView[] }) {
  if (products.length === 0) return null
  return (
    <section className={s.section}>
      <div className={s.container}>
        <Reveal><div className={s.sectionCenter}><span className={s.sectionLabel}>{label}</span><h2 className={s.sectionTitle}>{title}</h2><GoldDivider /></div></Reveal>
        <div className={s.productsGrid}>
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) as 0|1|2|3|4|5}><GlowLiveProductCard product={p} index={i} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- Home slot (StoreTheme.Home) ---- */
export function GlowLivePage({ config, products, newArrivals, deals }: HomeProps) {
  const storeName = config?.store_name ?? "glow."
  const hasDeals = deals.length > 0

  const colorOverrides = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color ? { "--gold": config.accent_color } : {}),
  } as React.CSSProperties

  return (
    <div className={s.page} style={colorOverrides}>
      <PageLoader />
      <GlowLiveNav config={config} hasDeals={hasDeals} categories={[]} />
      <div className={s.headerSpacer} />
      <Hero config={config} />
      <TrustStrip />
      <BrandStory />
      <ProductSection label="Just In" title="New Arrivals" products={newArrivals.slice(0, 4)} />
      <IngredientSpotlight />
      <BeforeAfter />
      <ProductSection label="The Collection" title={`Shop ${storeName}`} products={products.slice(0, 8)} />
      <Testimonials />
      <Newsletter />
      <Footer storeName={storeName} />
    </div>
  )
}
