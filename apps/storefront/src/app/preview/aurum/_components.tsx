"use client"

import { useTemplateConfig } from "../../../lib/template-config-context"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { type Product } from "./_data"
import type { NavProps, FooterProps } from "../../../lib/themes/types"
import { SocialLinks } from "../../../lib/components/social-links"
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

// Single canonical nav, used by every page (live shop/cart/PDP AND the static
// About/Privacy/Terms/etc. info pages) so the header never drifts out of sync.
// basePath is read from context internally (empty on live, "/preview/aurum" in
// the template-picker demo).
export function AurumNav({ config, hasDeals, cartCount = 0 }: NavProps) {
  const { basePath } = useTemplateConfig()
  const storeName = config?.store_name ?? "Aurum"
  const tagline = config?.tagline ?? "Fine Jewellery"
  const announcementEnabled = config?.announcement_enabled ?? true
  const announcementText = config?.announcement_text ?? null
  return (
    <>
      {announcementEnabled && (
        <div className={s.announcementBar}>
          {announcementText ? (
            <>
              <span className={s.announcementDot} />
              {announcementText}
              <span className={s.announcementDot} />
            </>
          ) : (
            <>
              <span className={s.announcementDot} />
              Free insured shipping on all orders above ₹10,000
              <span className={s.announcementDot} />
              <strong>BIS Hallmarked · GIA Certified · Lifetime Exchange</strong>
              <span className={s.announcementDot} />
              30-Day hassle-free returns
            </>
          )}
        </div>
      )}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navLeft}>
            <Link href={`${basePath}/shop`} className={s.navLink}>Shop</Link>
            {hasDeals && <Link href={`${basePath}/deals`} className={s.navLink}>Offers</Link>}
          </div>

          <Link href={basePath || "/"} className={s.navLogo}>
            {config?.logo_url ? (
              <img src={config.logo_url} alt={storeName} style={{ height: 40, objectFit: "contain" }} />
            ) : (
              <>
                <span className={s.navLogoText}>{storeName}</span>
                <span className={s.navLogoSub}>{tagline}</span>
              </>
            )}
          </Link>

          <div className={s.navRight}>
            <Link href={`${basePath}/account`} className={s.navIconBtn}>Account</Link>
            <Link href={`${basePath}/cart`} className={s.navIconBtn}>
              Bag{cartCount > 0 && <span className={s.cartCount}>{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ---- Static info pages (About/Privacy/Terms/...) pull real data from context ---- */
export const NavBar = () => {
  const { config, hasDeals, cartCount } = useTemplateConfig()
  return <AurumNav config={config} hasDeals={hasDeals} cartCount={cartCount} categories={[]} />
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

/* ---- Aurum footer slot (StoreTheme.Footer) — used directly by live routes ---- */
export function AurumFooter({ config, hasDeals }: FooterProps & { hasDeals?: boolean }) {
  const { basePath } = useTemplateConfig()
  const storeName = config?.store_name ?? "Aurum"
  return (
    <footer className={s.footer}>
      <div className={s.footerTop}>
        <div className={s.footerBrand}>
          <Link href={basePath || "/"} className={s.footerLogoText}>{storeName}</Link>
          <span className={s.footerLogoSub}>{config?.tagline ?? "Fine Jewellery"}</span>
          <p className={s.footerTagline}>
            Jewellery crafted to endure. Every piece an heirloom in waiting.
          </p>
          <div className={s.footerGoldLine} />
          <div className={s.footerCerts}>
            {["BIS 916", "GIA", "ISO 9001", "BIS 925"].map(c => (
              <span key={c} className={s.footerCertItem}>{c}</span>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <SocialLinks config={config} size={16} color="#b8962e" gap={14} />
          </div>
        </div>
        {[
          {
            title: "Collections",
            links: [
              { label: "Eternal Gold", href: `${basePath}/collections` },
              { label: "Diamond Dreams", href: `${basePath}/collections` },
              { label: "Royal Bridal", href: `${basePath}/bridal` },
              { label: "Gemstone Garden", href: `${basePath}/collections` },
              { label: "New Arrivals", href: `${basePath}/new-arrivals` },
              ...(hasDeals ? [{ label: "Offers", href: `${basePath}/deals` }] : []),
            ],
          },
          {
            title: "Company",
            links: [
              { label: `About ${storeName}`, href: `${basePath}/about` },
              { label: "Store Locator", href: `${basePath}/store-locator` },
              { label: "Contact Us", href: `${basePath}/contact` },
              { label: "Certification", href: `${basePath}/certification` },
              { label: "Care Guide", href: `${basePath}/care-guide` },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "FAQs", href: `${basePath}/faq` },
              { label: "Shipping Policy", href: `${basePath}/shipping` },
              { label: "Return Policy", href: `${basePath}/returns` },
              { label: "Privacy Policy", href: `${basePath}/privacy` },
              { label: "Terms & Conditions", href: `${basePath}/terms` },
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
        <span className={s.footerCopy}>© 2026 {storeName} Fine Jewellery. All rights reserved.</span>
        <span className={s.footerBadge}>Crafted with Precision</span>
      </div>
    </footer>
  )
}

/* ---- Static info pages (About/Privacy/Terms/...) pull real data from context ---- */
export const Footer = () => {
  const { config, hasDeals } = useTemplateConfig()
  return <AurumFooter config={config} hasDeals={hasDeals} />
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

export const ProductCard = ({ product, delay = 0 }: { product: Product; delay?: 0|1|2|3|4 }) => {
  const { basePath } = useTemplateConfig()
  return (
  <Reveal delay={delay}>
    <Link href={`${basePath}/products/${product.id}`} className={s.productCard}>
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
}

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
