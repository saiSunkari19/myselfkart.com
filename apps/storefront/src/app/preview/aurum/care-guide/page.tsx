"use client"

import { PageShell, Reveal, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function CareGuidePage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Preserve Your Investment</div>
        <h1 className={s.pageHeaderTitle}>Jewellery Care Guide</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          With the right care, Aurum jewellery will retain its beauty for generations. Follow these guidelines to keep your pieces at their finest.
        </p>
      </div>

      <div className={s.container}>
        {/* Care cards */}
        <div className={s.careGrid} style={{ marginTop: 80 }}>
          {[
            { icon: "🥇", title: "Gold Jewellery", text: "Clean 22K and 18K gold jewellery with a soft-bristle brush and warm soapy water. Rinse thoroughly and dry with a soft cloth. Avoid ultrasonic cleaners for jewellery with gemstone settings. Store individually in soft pouches to prevent scratching." },
            { icon: "💎", title: "Diamond Jewellery", text: "Clean diamonds regularly with a soft-bristle toothbrush and mild dish soap in warm water. Diamonds attract oils and grease, so regular cleaning maintains maximum brilliance. Professional cleaning at an Aurum store is recommended every 6–12 months." },
            { icon: "🔘", title: "Silver Jewellery", text: "Sterling silver can tarnish over time when exposed to air and moisture. Clean with a silver-specific polishing cloth. Store in anti-tarnish bags or boxes. Avoid rubber, latex, and chlorine — these accelerate tarnishing." },
            { icon: "🌿", title: "Gemstone Jewellery", text: "Different gemstones require different care. Emeralds are often oiled — use only mild soap and water, never ultrasonic cleaners. Pearls are delicate — wipe with a damp cloth after each wear. Avoid acids, perfume, and hairspray." },
            { icon: "👰", title: "Bridal Jewellery", text: "After wearing, gently wipe bridal sets with a soft cloth to remove perspiration and oils. Store in the original box or padded case. Avoid storing multiple pieces together — Kundan and Polki are particularly delicate." },
            { icon: "💍", title: "Rings", text: "Remove rings before washing hands, applying lotion, or doing physical work. Over time, settings can loosen — have settings inspected at an Aurum store annually. Avoid exposing rings to harsh chemicals like bleach and acetone." },
          ].map((card, i) => (
            <Reveal key={card.title} delay={(i % 3) as 0|1|2}>
              <div className={s.careCard}>
                <div className={s.careCardIcon}>{card.icon}</div>
                <div className={s.careCardTitle}>{card.title}</div>
                <p className={s.careCardText}>{card.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* General rules */}
        <Reveal>
          <div style={{ background: "#fdf9f4", padding: "60px 48px", marginBottom: 80, borderTop: "2px solid #b8962e" }}>
            <div className={s.sectionCenter} style={{ marginBottom: 48 }}>
              <span className={s.sectionLabel}>Universal Guidelines</span>
              <h2 className={s.sectionTitle} style={{ fontSize: 32 }}>What to always remember</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 880, margin: "0 auto" }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1410", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Always</h3>
                {["Store in individual soft pouches", "Clean before long-term storage", "Have settings inspected annually", "Wear jewellery as the last thing you put on", "Bring to Aurum for professional service"].map(t => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, fontSize: 13, color: "#6b5f52" }}>
                    <span style={{ color: "#b8962e", fontWeight: 700 }}>✓</span> {t}
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1410", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Never</h3>
                {["Wear jewellery in the swimming pool or sea", "Apply perfume or hairspray while wearing jewellery", "Expose to bleach or harsh cleaning chemicals", "Sleep with intricate jewellery on", "Store together without protection"].map(t => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, fontSize: 13, color: "#6b5f52" }}>
                    <span style={{ color: "#c0392b", fontWeight: 700 }}>✗</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  )
}
