"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTemplateConfig } from "../../../lib/template-config-context"
import s from "./_styles.module.css"

/* ---- Page Loader ---- */
export const PageLoader = () => (
  <div className={s.loader} aria-hidden>
    <span className={s.loaderLogo}>glow.</span>
    <div className={s.loaderBar}><div className={s.loaderBarFill} /></div>
    <span className={s.loaderText}>Preparing your ritual</span>
  </div>
)

/* ---- Scroll-triggered reveal ---- */
export const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: 0 | 1 | 2 | 3 | 4 | 5
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const delayClass = delay > 0 ? s[`revealDelay${delay}` as keyof typeof s] : ""

  return (
    <div
      ref={ref}
      className={`${s.reveal} ${visible ? s.revealVisible : ""} ${delayClass} ${className}`}
    >
      {children}
    </div>
  )
}

/* ---- Navbar ---- */
export const NavBar = ({
  storeName,
  logoUrl,
  announcementText,
}: {
  storeName?: string | null
  logoUrl?: string | null
  announcementText?: string | null
} = {}) => {
  const { basePath, config } = useTemplateConfig()
  const resolvedName = storeName ?? config?.store_name ?? "glow."
  const resolvedLogo = logoUrl ?? config?.logo_url ?? null
  const resolvedAnnouncement = announcementText ?? (config?.announcement_enabled ? config.announcement_text : null) ?? null
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className={s.stickyHeader}>
      <AnnouncementBar text={resolvedAnnouncement ?? undefined} />
      <nav className={`${s.navbar} ${scrolled ? s.navbarScrolled : ""}`}>
        <a href={basePath || "/"} className={s.navLogo}>
          {resolvedLogo
            ? <img src={resolvedLogo} alt={resolvedName} style={{ height: 32, objectFit: "contain" }} />
            : resolvedName
          }
        </a>
        <ul className={s.navLinks}>
          {[
            { label: "Shop", href: `${basePath}/shop` },
            { label: "Serums", href: `${basePath}/shop` },
            { label: "Moisturisers", href: `${basePath}/shop` },
            { label: "Sun Care", href: `${basePath}/shop` },
            { label: "Routines", href: `${basePath}/shop` },
            { label: "About", href: `${basePath}/about` },
          ].map(({ label, href }) => (
            <li key={label}><a href={href} className={s.navLink}>{label}</a></li>
          ))}
        </ul>
        <div className={s.navActions}>
          <a href={`${basePath}/cart`} className={s.navCart}>
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span className={s.navCartBadge}>2</span>
          </a>
        </div>
      </nav>
    </div>
  )
}

/* ---- Announcement Bar ---- */
export const AnnouncementBar = ({ text }: { text?: string } = {}) => {
  const items = text
    ? [text]
    : [
        "Free delivery on orders above ₹999",
        "Clean Beauty · No Parabens · No Sulfates",
        "Dermatologist Tested & Approved",
        "Cruelty-Free & Vegan Formulas",
        "100-Day Money-Back Guarantee",
      ]
  const doubled = [...items, ...items]
  return (
    <div className={s.announcementBar}>
      <div className={s.marqueeTrack}>
        {doubled.map((item, i) => (
          <span key={i} className={s.marqueeItem}>
            <span className={s.marqueeDot} />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---- Trust Strip ---- */
export const TrustStrip = () => (
  <div className={s.trustStrip}>
    {[
      { icon: "🌿", text: "100% Clean Ingredients" },
      { icon: "🔬", text: "Clinically Tested" },
      { icon: "🐰", text: "Cruelty-Free & Vegan" },
      { icon: "🇮🇳", text: "Made in India" },
      { icon: "♻️", text: "Sustainable Packaging" },
    ].map(({ icon, text }) => (
      <div key={text} className={s.trustItem}>
        <span className={s.trustIcon}>{icon}</span>
        <span className={s.trustText}>{text}</span>
      </div>
    ))}
  </div>
)

/* ---- Gold Divider ---- */
export const GoldDivider = () => <div className={s.goldLine} />

/* ---- Product Card ---- */
export const ProductCard = ({
  name, subtitle, category, price, originalPrice, image, hoverImage, badge, rating, reviews,
}: {
  name: string; subtitle: string; category: string; price: number;
  originalPrice?: number; image: string; hoverImage: string;
  badge?: string; rating: number; reviews: number;
}) => {
  const badgeClass = badge === "Bestseller" ? s.badgeBestseller
    : badge === "New" ? s.badgeNew
    : badge === "Limited" ? s.badgeLimited
    : badge === "Award Winner" ? s.badgeAward
    : ""

  const { basePath } = useTemplateConfig()
  return (
    <div className={s.productCard}>
      <div className={s.productImageWrap}>
        <img src={image} alt={name} className={s.productImg} loading="lazy" />
        <img src={hoverImage} alt={name} className={`${s.productImg} ${s.productImgHover}`} loading="lazy" />
        {badge && <span className={`${s.productBadge} ${badgeClass}`}>{badge}</span>}
        <a href={`${basePath}/cart`} className={s.productQuickAdd}>+ Add to Bag</a>
      </div>
      <div className={s.productCategory}>{category}</div>
      <div className={s.productName}>{name}</div>
      <div className={s.productSub}>{subtitle}</div>
      <div className={s.productFooter}>
        <div>
          <span className={s.productPrice}>₹{price.toLocaleString("en-IN")}</span>
          {originalPrice && (
            <span className={s.productOriginal}>₹{originalPrice.toLocaleString("en-IN")}</span>
          )}
        </div>
        <div className={s.productRating}>
          <span className={s.starFill}>★</span>
          {rating} ({reviews.toLocaleString()})
        </div>
      </div>
    </div>
  )
}

/* ---- Before/After Slider ---- */
export const BeforeAfterSlider = ({
  before, after,
}: { before: string; after: string }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const afterWrapRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setPos = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100))
    if (afterWrapRef.current) {
      afterWrapRef.current.style.width = `${pct}%`
      // Keep after image at full container width regardless of wrapper size
      const img = afterWrapRef.current.querySelector("img") as HTMLImageElement
      if (img) img.style.width = `${rect.width}px`
    }
    if (dividerRef.current) dividerRef.current.style.left = `${pct}%`
  }

  useEffect(() => {
    const stop = () => { dragging.current = false }
    window.addEventListener("mouseup", stop)
    window.addEventListener("touchend", stop)

    // Set initial image width once mounted
    const rect = wrapRef.current?.getBoundingClientRect()
    if (rect && afterWrapRef.current) {
      const img = afterWrapRef.current.querySelector("img") as HTMLImageElement
      if (img) img.style.width = `${rect.width}px`
    }

    return () => {
      window.removeEventListener("mouseup", stop)
      window.removeEventListener("touchend", stop)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={s.baSlider}
      onMouseDown={e => { dragging.current = true; setPos(e.clientX) }}
      onMouseMove={e => { if (dragging.current) setPos(e.clientX) }}
      onTouchStart={e => { dragging.current = true; setPos(e.touches[0].clientX) }}
      onTouchMove={e => { if (dragging.current) setPos(e.touches[0].clientX) }}
    >
      {/* Before — full width underneath */}
      <img src={before} alt="Before" className={s.baImg} loading="lazy" draggable={false} />

      {/* After — clipped by wrapper width */}
      <div ref={afterWrapRef} className={s.baAfterWrap}>
        <img src={after} alt="After" className={s.baAfterImg} loading="lazy" draggable={false} />
      </div>

      {/* Divider line + knob */}
      <div ref={dividerRef} className={s.baDivider}>
        <div className={s.baDividerKnob}>
          <span>◂</span><span>▸</span>
        </div>
      </div>

      <div className={s.baLabels}>
        <span className={s.baLabel}>Before</span>
        <span className={s.baLabel}>After 8 weeks</span>
      </div>
    </div>
  )
}

/* ---- Footer ---- */
export const Footer = ({ storeName }: { storeName?: string | null } = {}) => (
  <footer className={s.footer}>
    <div className={s.container}>
      <div className={s.footerTop}>
        <div>
          <span className={s.footerLogo}>{storeName ?? "glow."}</span>
          <p className={s.footerDesc}>
            Science-backed, nature-inspired skincare for every skin story.
            Clean formulas. Real results. Delivered to your door.
          </p>
          <div className={s.footerSocials}>
            {["📸", "▶", "✦", "◉"].map((icon, i) => (
              <a key={i} href="#" className={s.footerSocial}>{icon}</a>
            ))}
          </div>
        </div>
        {[
          { title: "Shop", links: ["All Products", "Serums", "Moisturisers", "Cleansers", "Sun Care", "Eye Care", "Masks"] },
          { title: "Routines", links: ["Brightening Routine", "Anti-Aging Routine", "Acne Routine", "Dry Skin Routine", "Skin Quiz"] },
          { title: "Company", links: ["Our Story", "Ingredients", "Sustainability", "Press", "Careers", "Contact"] },
        ].map(col => (
          <div key={col.title}>
            <div className={s.footerColTitle}>{col.title}</div>
            <ul className={s.footerLinks}>
              {col.links.map(l => <li key={l}><a href="#" className={s.footerLink}>{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className={s.footerBottom}>
        <span>© 2025 Glow. All rights reserved. Built on Selfkart.</span>
        <div className={s.footerBadges}>
          {["Cruelty-Free", "Vegan", "Dermatologist Tested"].map(b => (
            <span key={b} className={s.footerBadge}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  </footer>
)
