"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { type Product } from "./_data"
import s from "./_styles.module.css"

// ---------------------------------------------------------------------------
// Scroll Reveal Hook
// ---------------------------------------------------------------------------

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
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
  const delayClass = delay > 0 ? (s as any)[`revealDelay${delay}`] : ""
  return (
    <div ref={ref} className={`${s.reveal} ${visible ? s.revealed : ""} ${delayClass} ${className}`}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Loader
// ---------------------------------------------------------------------------

export const PageLoader = () => {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2400)
    return () => clearTimeout(t)
  }, [])
  if (!show) return null
  return (
    <div className={s.loader}>
      <div className={s.loaderLogo}>Aurum</div>
      <div className={s.loaderLine} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export const NavBar = () => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  return (
    <>
      <div className={s.announcementBar}>
        <span className={s.announcementDot} />
        Free insured shipping on all orders above ₹10,000
        <span className={s.announcementDot} />
        <strong>BIS Hallmarked · GIA Certified · Lifetime Exchange</strong>
        <span className={s.announcementDot} />
        30-Day hassle-free returns
      </div>
      <nav className={`${s.nav} ${scrolled ? s.navScrolled : ""}`}>
        <div className={s.navInner}>
          <div className={s.navLeft}>
            {[
              { label: "Collections", href: "/preview/aurum/collections" },
              { label: "Shop", href: "/preview/aurum/shop" },
              { label: "Bridal", href: "/preview/aurum/bridal" },
              { label: "New Arrivals", href: "/preview/aurum/new-arrivals" },
            ].map(item => (
              <Link key={item.label} href={item.href} className={s.navLink}>{item.label}</Link>
            ))}
          </div>

          <Link href="/preview/aurum" className={s.navLogo}>
            <span className={s.navLogoText}>Aurum</span>
            <span className={s.navLogoSub}>Fine Jewellery</span>
          </Link>

          <div className={s.navRight}>
            <Link href="/preview/aurum/about" className={s.navIconBtn}>About</Link>
            <Link href="/preview/aurum/store-locator" className={s.navIconBtn}>Stores</Link>
            <Link href="/preview/aurum/cart" className={s.navIconBtn}>
              Bag <span className={s.cartCount}>2</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const Footer = () => (
  <footer className={s.footer}>
    <div className={s.footerTop}>
      <div className={s.footerBrand}>
        <Link href="/preview/aurum" className={s.footerLogoText}>Aurum</Link>
        <span className={s.footerLogoSub}>Fine Jewellery</span>
        <p className={s.footerTagline}>
          Since 1987, we have crafted jewellery that endures. Every piece is an heirloom in waiting.
        </p>
        <div className={s.footerGoldLine} />
        <div className={s.footerCerts}>
          {["BIS 916", "GIA", "ISO 9001", "BIS 925"].map(c => (
            <span key={c} className={s.footerCertItem}>{c}</span>
          ))}
        </div>
      </div>
      {[
        {
          title: "Collections",
          links: [
            { label: "Eternal Gold", href: "/preview/aurum/collections" },
            { label: "Diamond Dreams", href: "/preview/aurum/collections" },
            { label: "Royal Bridal", href: "/preview/aurum/bridal" },
            { label: "Gemstone Garden", href: "/preview/aurum/collections" },
            { label: "New Arrivals", href: "/preview/aurum/new-arrivals" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About Aurum", href: "/preview/aurum/about" },
            { label: "Store Locator", href: "/preview/aurum/store-locator" },
            { label: "Contact Us", href: "/preview/aurum/contact" },
            { label: "Certification", href: "/preview/aurum/certification" },
            { label: "Care Guide", href: "/preview/aurum/care-guide" },
          ],
        },
        {
          title: "Support",
          links: [
            { label: "FAQs", href: "/preview/aurum/faq" },
            { label: "Shipping Policy", href: "/preview/aurum/shipping" },
            { label: "Return Policy", href: "/preview/aurum/returns" },
            { label: "Privacy Policy", href: "/preview/aurum/privacy" },
            { label: "Terms & Conditions", href: "/preview/aurum/terms" },
          ],
        },
      ].map(col => (
        <div key={col.title}>
          <div className={s.footerColTitle}>{col.title}</div>
          <ul className={s.footerLinks}>
            {col.links.map(link => (
              <li key={link.label}>
                <Link href={link.href} className={s.footerLink}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className={s.footerBottom}>
      <span className={s.footerCopy}>© 2026 Aurum Fine Jewellery Pvt. Ltd. All rights reserved.</span>
      <span className={s.footerBadge}>Crafted with Precision</span>
    </div>
  </footer>
)

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

export const ProductCard = ({ product, delay = 0 }: { product: Product; delay?: 0|1|2|3|4 }) => (
  <Reveal delay={delay}>
    <Link href={`/preview/aurum/products/${product.id}`} className={s.productCard}>
      <div className={s.productImageWrap}>
        <img src={product.image} alt={product.name} />
        {product.badge && (
          <span className={`${s.productBadge} ${
            product.badge === "New" ? s.badgeNew :
            product.badge === "Bestseller" ? s.badgeBestseller :
            product.badge === "Limited" ? s.badgeLimited : s.badgeBridal
          }`}>{product.badge}</span>
        )}
        {product.certified && (
          <span className={s.productCertBadge}>✦ Certified</span>
        )}
        <div className={s.productHoverPanel}>
          <button className={s.productHoverBtn}>View Details</button>
        </div>
      </div>
      <div className={s.productName}>{product.name}</div>
      <div className={s.productMeta}>{product.metal}{product.stone ? ` · ${product.stone}` : ""}</div>
      <div className={s.productPriceRow}>
        <span className={`${s.productPrice} ${product.originalPrice ? s.productPriceSale : ""}`}>
          ₹{product.price.toLocaleString("en-IN")}
        </span>
        {product.originalPrice && (
          <span className={s.productPriceOriginal}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
        )}
      </div>
    </Link>
  </Reveal>
)

// ---------------------------------------------------------------------------
// Gold Divider
// ---------------------------------------------------------------------------

export const GoldDivider = () => (
  <div className={s.goldLine}>
    <div className={s.goldDiamond} />
    <div className={s.goldDiamond} style={{ opacity: 0.4 }} />
    <div className={s.goldDiamond} />
  </div>
)

// ---------------------------------------------------------------------------
// Trust Strip
// ---------------------------------------------------------------------------

export const TrustStrip = () => (
  <div className={s.trustStrip}>
    <div className={s.trustInner}>
      {[
        { icon: "🏅", label: "BIS Hallmarked", sub: "916 & 925 certified" },
        { icon: "💎", label: "GIA Certified", sub: "Every diamond verified" },
        { icon: "🔒", label: "Secure Packaging", sub: "Insured delivery" },
        { icon: "↩️", label: "30-Day Returns", sub: "Hassle-free exchange" },
      ].map(item => (
        <div key={item.label} className={s.trustItem}>
          <span className={s.trustIcon}>{item.icon}</span>
          <div>
            <div className={s.trustLabel}>{item.label}</div>
            <div className={s.trustSub}>{item.sub}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// Newsletter Section
// ---------------------------------------------------------------------------

export const NewsletterSection = () => {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)
  return (
    <section className={s.newsletter}>
      <div className={s.newsletterLabel}>Private Circle</div>
      <h2 className={s.newsletterTitle}>First access. Always.</h2>
      <p className={s.newsletterSub}>
        New collections, private previews, and invitations to exclusive events — only for those who sign up.
      </p>
      {done ? (
        <p style={{ color: "#d4af6a", fontSize: 14, letterSpacing: 0.5 }}>✦ You're on the list. Thank you.</p>
      ) : (
        <>
          <div className={s.newsletterForm}>
            <input
              className={s.newsletterInput}
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className={s.newsletterBtn} onClick={() => email && setDone(true)}>
              Join
            </button>
          </div>
          <p className={s.newsletterPrivacy}>No spam. Unsubscribe anytime. We value your privacy.</p>
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page Shell
// ---------------------------------------------------------------------------

export const PageShell = ({ children, loader = false }: {
  children: React.ReactNode
  loader?: boolean
}) => (
  <div className={s.page}>
    {loader && <PageLoader />}
    <NavBar />
    <div className={s.pageShell}>{children}</div>
    <Footer />
  </div>
)
