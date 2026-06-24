"use client"

import Link from "next/link"
import { PageShell, Reveal, GoldDivider } from "../_components"
import { STORES } from "../_data"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

export default function StoreLocatorPage() {
  const { basePath } = useTemplateConfig()
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Experience Aurum</div>
        <h1 className={s.pageHeaderTitle}>Our Stores</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          Five flagship boutiques across India. Private appointments available for bridal consultations and high-value purchases.
        </p>
      </div>

      <div className={s.container}>
        <div className={s.storeGrid} style={{ padding: "80px 0" }}>
          {STORES.map((store, i) => (
            <Reveal key={store.id} delay={(i % 3) as 0|1|2}>
              <div className={s.storeCard}>
                <div className={s.storeCardImg}>
                  <img src={store.image} alt={store.city} />
                </div>
                <div className={s.storeCardBody}>
                  <div className={s.storeArea}>{store.area}</div>
                  <div className={s.storeCity}>{store.city}</div>
                  <p className={s.storeAddress}>{store.address}</p>
                  <p className={s.storePhone}>{store.phone}</p>
                  <p className={s.storeHours}>{store.hours}</p>
                  <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnOutlineGold}`} style={{ fontSize: 10, padding: "10px 20px" }}>
                    Book Appointment
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Services */}
        <Reveal>
          <div style={{ background: "#fdf9f4", padding: "60px 48px", marginBottom: 80, borderTop: "2px solid #b8962e" }}>
            <div className={s.sectionCenter} style={{ marginBottom: 48 }}>
              <span className={s.sectionLabel}>In-Store Services</span>
              <h2 className={s.sectionTitle} style={{ fontSize: 36 }}>What we offer at every store</h2>
            </div>
            <div className={s.grid3} style={{ gap: 32 }}>
              {[
                { icon: "💍", title: "Private Consultations", desc: "One-on-one time with our jewellery specialists. No rush, no pressure." },
                { icon: "🔧", title: "Repairs & Cleaning", desc: "Professional cleaning, polishing, and repairs. Complimentary for Aurum pieces." },
                { icon: "📐", title: "Custom Orders", desc: "Design your own piece with our master craftspeople. 8–16 week lead time." },
                { icon: "📋", title: "Certification Assistance", desc: "We'll help you understand every certification and its meaning." },
                { icon: "🔄", title: "Lifetime Exchange", desc: "Exchange any Aurum piece at current gold value — no questions asked." },
                { icon: "🎁", title: "Gift Services", desc: "Luxury gift packaging, personal message cards, and direct delivery." },
              ].map((item, i) => (
                <div key={item.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 22, width: 36, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1410", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "#6b5f52", lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  )
}
