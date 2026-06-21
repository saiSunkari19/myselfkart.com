"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { type Product } from "./_data"
import { useTemplateConfig } from "../../../lib/template-config-context"
import s from "./_styles.module.css"

// ---- Scroll Reveal ----
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0, rootMargin: "0px 0px -50px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

export function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode
  delay?: 0 | 1 | 2 | 3 | 4
  className?: string
}) {
  const { ref, visible } = useReveal()
  const dc = delay > 0 ? (s as any)[`revealDelay${delay}`] : ""
  return (
    <div ref={ref} className={`${s.reveal} ${visible ? s.revealed : ""} ${dc} ${className}`}>
      {children}
    </div>
  )
}

// ---- Page Loader ----
export function PageLoader() {
  const [show, setShow] = useState(true)
  useEffect(() => { const t = setTimeout(() => setShow(false), 1800); return () => clearTimeout(t) }, [])
  if (!show) return null
  return (
    <div className={s.loader}>
      <div className={s.loaderLogo}>VOLT<span style={{ color: "#2563eb" }}>.</span></div>
      <div className={s.loaderTrack}><div className={s.loaderBar} /></div>
    </div>
  )
}

// ---- Stars ----
export function Stars({ rating }: { rating: number }) {
  return (
    <div className={s.stars}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#f59e0b" : "#e2e8f0" }}>★</span>
      ))}
    </div>
  )
}

// ---- Badge ----
export function Badge({ type }: { type: Product["badge"] }) {
  if (!type) return null
  const cls = type === "New" ? s.badgeNew : type === "Hot" ? s.badgeHot : type === "Sale" ? s.badgeSale : type === "Limited" ? s.badgeLimited : s.badgeTrending
  return <span className={`${s.badge} ${cls}`}>{type}</span>
}

// ---- Product Card ----
export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { basePath } = useTemplateConfig()
  return (
    <Link href={`${basePath}/products/${product.id}`} className={s.productCard}>
      <div className={s.productCardImg}>
        <img src={product.image} alt={product.name} />
        <div className={s.productCardBadge}><Badge type={product.badge} /></div>
        <div className={s.productCardActions}>
          <button className={s.productActionBtn} onClick={e => e.preventDefault()} title="Quick View">👁</button>
          <button className={s.productActionBtn} onClick={e => e.preventDefault()} title="Compare">⚖</button>
        </div>
      </div>
      <div className={s.productCardBody}>
        <div className={s.productCardBrand}>{product.brand}</div>
        <div className={s.productCardName}>{product.name}</div>
        <div className={s.productCardRating}>
          <div className={s.ratingBadge}>
            <span style={{ color: "#f59e0b" }}>★</span>
            {product.rating}
          </div>
          <span className={s.reviewCount}>({product.reviewCount.toLocaleString()})</span>
        </div>
        <div className={s.productCardPrice}>
          <span className={s.priceMain}>₹{product.price.toLocaleString("en-IN")}</span>
          {product.originalPrice && (
            <span className={s.priceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
          )}
          {product.discount && (
            <span className={s.priceDiscount}>{product.discount}% off</span>
          )}
        </div>
        {product.emi && <div className={s.productCardEmi}>EMI from {product.emi}</div>}
        {product.delivery && <div className={s.productCardDelivery}>🚚 {product.delivery}</div>}
      </div>
    </Link>
  )
}

// ---- Nav ----
export function NavBar() {
  const { basePath, config } = useTemplateConfig()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  const storeName = config?.store_name ?? "VOLT"
  const announcementText = config?.announcement_enabled && config.announcement_text
    ? config.announcement_text
    : "🎉 VOLT SALE — Up to 40% off on top brands"
  return (
    <>
      <div className={s.announcementBar}>
        <span className={s.announcementText}>{announcementText}</span>
        <span className={s.announcementText}>|</span>
        <span className={s.announcementText}>Free delivery on orders above ₹999</span>
        <span className={s.announcementText}>|</span>
        <Link href={`${basePath}/deals`} className={s.announcementLink}>Shop Deals →</Link>
      </div>
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
        <div className={s.navInner}>
          <Link href={basePath || "/"} className={s.navLogo}>
            {config?.logo_url
              ? <img src={config.logo_url} alt={storeName} style={{ height: 32, objectFit: "contain" }} />
              : <>{storeName}<span className={s.navLogoAccent}>.</span></>
            }
          </Link>
          <div className={s.navSearch}>
            <input className={s.navSearchInput} placeholder="Search for phones, laptops, TVs & more..." />
            <button className={s.navSearchBtn}>🔍</button>
          </div>
          <div className={s.navLinks}>
            <Link href={`${basePath}/deals`} className={s.navLink}>Deals</Link>
            <Link href={`${basePath}/new-launches`} className={s.navLink}>New</Link>
            <Link href={`${basePath}/brands`} className={s.navLink}>Brands</Link>
            <Link href={`${basePath}/cart`} className={s.navCart}>
              🛒 Cart
              <span className={s.cartCount}>2</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

// ---- Footer ----
export function Footer() {
  const { basePath, config } = useTemplateConfig()
  const storeName = config?.store_name ?? "VOLT"
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerGrid}>
          <div className={s.footerBrand}>
            <div className={s.footerLogo}>{storeName}<span className={s.footerLogoAccent}>.</span></div>
            <p className={s.footerTagline}>India's most trusted destination for premium electronics. Genuine products, unbeatable prices.</p>
            <div className={s.footerSocial}>
              {["𝕏", "📘", "📸", "▶"].map(icon => (
                <button key={icon} className={s.footerSocialBtn}>{icon}</button>
              ))}
            </div>
          </div>
          {[
            { title: "Shop", links: [["Smartphones", `${basePath}/shop`], ["Laptops", `${basePath}/shop`], ["Audio", `${basePath}/shop`], ["Deals", `${basePath}/deals`], ["New Launches", `${basePath}/new-launches`]] },
            { title: "Help", links: [["FAQs", `${basePath}/faq`], ["Warranty", `${basePath}/warranty`], ["Shipping", `${basePath}/shipping`], ["Returns", `${basePath}/returns`], ["Contact", `${basePath}/contact`]] },
            { title: "Company", links: [["About Us", `${basePath}/about`], ["Brands", `${basePath}/brands`], ["Privacy Policy", `${basePath}/privacy`], ["Terms", `${basePath}/terms`]] },
            { title: "Contact", links: [["1800-VOLT-CARE", "#"], ["support@volt.in", "#"], ["Mon–Sat 9am–9pm", "#"], ["Live Chat", "#"]] },
          ].map(col => (
            <div key={col.title} className={s.footerCol}>
              <div className={s.footerColTitle}>{col.title}</div>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} className={s.footerLink}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className={s.footerBottom}>
          <span className={s.footerCopy}>© 2025 {storeName}. All rights reserved.</span>
          <div className={s.footerBottomLinks}>
            <Link href={`${basePath}/privacy`} className={s.footerBottomLink}>Privacy</Link>
            <Link href={`${basePath}/terms`} className={s.footerBottomLink}>Terms</Link>
            <Link href={`${basePath}/shipping`} className={s.footerBottomLink}>Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ---- Page Shell ----
export function PageShell({ children }: { children: React.ReactNode }) {
  const { config } = useTemplateConfig()
  const colorVars = {
    ...(config?.primary_color ? { "--text": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--accent": config.accent_color  } : {}),
  } as React.CSSProperties
  return (
    <div className={s.pageShell} style={colorVars}>
      <PageLoader />
      <NavBar />
      <div className={s.main}>
        {children}
      </div>
      <Footer />
    </div>
  )
}

// ---- Trust Strip ----
export function TrustStrip() {
  const items = [
    { icon: "✅", label: "100% Genuine", sub: "Authorised dealer" },
    { icon: "🚚", label: "Free Delivery", sub: "On orders above ₹999" },
    { icon: "↩️", label: "Easy Returns", sub: "10-day return policy" },
    { icon: "🛡", label: "Warranty Support", sub: "Brand warranty on all products" },
    { icon: "🔒", label: "Secure Payments", sub: "256-bit SSL encryption" },
    { icon: "💳", label: "No-Cost EMI", sub: "On all major cards" },
  ]
  return (
    <div className={s.trustStrip}>
      <div className={s.container}>
        <div className={s.trustGrid}>
          {items.map(item => (
            <div key={item.label} className={s.trustItem}>
              <div className={s.trustIcon}>{item.icon}</div>
              <div>
                <div className={s.trustLabel}>{item.label}</div>
                <div className={s.trustSub}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
