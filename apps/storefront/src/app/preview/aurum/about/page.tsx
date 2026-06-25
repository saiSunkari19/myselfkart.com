"use client"

import Link from "next/link"
import { PageShell, Reveal, GoldDivider } from "../_components"
import s from "../_styles.module.css"
import { useTemplateConfig } from "../../../../lib/template-config-context"

const DEFAULT_ABOUT_VALUES = [
  { icon: "✋", title: "Hand-Craftsmanship", text: "Every piece is made by hand. We use no mass-production machinery. Our karigar families have been with us for two and three generations." },
  { icon: "🌿", title: "Responsible Sourcing", text: "Our gold is sourced from certified responsible mines. Our gemstones come from traceable, ethically operated sources with full documentation." },
  { icon: "🏅", title: "Full Certification", text: "We certify everything. BIS hallmarks for all gold and silver. GIA or equivalent for all diamonds. Reputable labs for all coloured stones." },
  { icon: "♾️", title: "Lifetime Commitment", text: "We stand behind our work forever. Free cleaning and inspection for life. Lifetime exchange at full gold value. Repair guarantee." },
  { icon: "📚", title: "Transparency", text: "We show you exactly what you're paying for — metal weight, stone quality, making charges. No hidden costs, ever." },
  { icon: "🎓", title: "Artisan Welfare", text: "Our karigar earn above-market wages, receive healthcare, and have pathways to ownership. Their families are part of the Aurum family." },
]

const DEFAULT_ABOUT_STATS = [
  { value: "37", label: "Years", sub: "of craftsmanship" },
  { value: "220+", label: "Artisans", sub: "across two ateliers" },
  { value: "85,000+", label: "Families", sub: "who trust Aurum" },
  { value: "5", label: "Flagship Stores", sub: "across India" },
]

export default function AboutPage() {
  const { basePath, config } = useTemplateConfig()
  const values = config?.sections?.about_values?.items ?? DEFAULT_ABOUT_VALUES
  const stats = config?.sections?.about_stats?.items ?? DEFAULT_ABOUT_STATS
  return (
    <PageShell>
      {/* Hero — marginTop: 0 cancels the page-shell's full-bleed-under-nav trick
          (`.pageShell > .editorial:first-child { margin-top: -108px }`), since
          this banner isn't a full-screen image and was rendering its text
          behind the fixed nav bar. */}
      <section className={s.editorial} style={{ minHeight: 500, marginTop: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1400&q=85"
          alt="Aurum Atelier"
          className={s.editorialBg}
        />
        <div className={s.editorialOverlay} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "100px var(--container-pad, 48px)", width: "100%" }}>
          <Reveal>
            <span className={s.sectionLabel}>Since 1987</span>
            <h1 className={s.sectionTitle} style={{ color: "#fff", fontSize: "clamp(36px,5vw,72px)" }}>
              Three generations.<br />One pursuit.
            </h1>
            <GoldDivider />
            <p className={s.sectionSub} style={{ color: "rgba(255,255,255,0.5)" }}>
              We have been making jewellery worthy of passing down since Rameshwar Lal Shah opened our first atelier in Jaipur in 1987.
            </p>
          </Reveal>
        </div>
      </section>

      <div className={s.container}>
        {/* Story */}
        <div className={s.aboutHero}>
          <div className={s.aboutHeroImg}>
            <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=85" alt="Aurum atelier" />
          </div>
          <Reveal>
            <span className={s.sectionLabel}>Our Story</span>
            <h2 className={s.sectionTitle}>Built on a single promise.</h2>
            <GoldDivider />
            {config?.about_text ? (
              <p style={{ fontSize: 15, color: "#6b5f52", lineHeight: 1.9, marginBottom: 32, whiteSpace: "pre-line" }}>
                {config.about_text}
              </p>
            ) : (
              <>
                <p style={{ fontSize: 15, color: "#6b5f52", lineHeight: 1.9, marginBottom: 16 }}>
                  In 1987, Rameshwar Lal Shah left his position at a large Jaipur jewellery house with one conviction: that Indian jewellery craft deserved better than the race to the bottom that mass production was driving.
                </p>
                <p style={{ fontSize: 15, color: "#6b5f52", lineHeight: 1.9, marginBottom: 16 }}>
                  He started Aurum with four karigar families and a single workshop. The rules were simple: only natural materials, only traditional techniques, and only craftsmanship that would last generations.
                </p>
                <p style={{ fontSize: 15, color: "#6b5f52", lineHeight: 1.9, marginBottom: 32 }}>
                  Today, under the leadership of his son Vikram and granddaughter Priya, Aurum employs over 220 artisans across two ateliers. The rules haven't changed.
                </p>
              </>
            )}
            <Link href={`${basePath}/contact`} className={`${s.btn} ${s.btnDark}`}>Visit Our Atelier</Link>
          </Reveal>
        </div>

        {/* Values */}
        <section className={s.sectionMd}>
          <Reveal>
            <div className={s.sectionCenter} style={{ marginBottom: 56 }}>
              <span className={s.sectionLabel}>What We Stand For</span>
              <h2 className={s.sectionTitle}>Our Values</h2>
              <GoldDivider />
            </div>
          </Reveal>
          <div className={s.aboutValuesGrid}>
            {values.map((v: typeof DEFAULT_ABOUT_VALUES[number], i: number) => (
              <Reveal key={v.title ?? i} delay={(i % 3) as 0 | 1 | 2}>
                <div className={s.aboutValue}>
                  <div className={s.aboutValueIcon}>{v.icon}</div>
                  <div className={s.aboutValueTitle}>{v.title}</div>
                  <p className={s.aboutValueText}>{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Numbers */}
        <section className={`${s.sectionMd} ${s.sectionCream}`} style={{ margin: "0 calc(var(--container-pad, 48px) * -1)", padding: "80px var(--container-pad, 48px)" }}>
          <Reveal>
            <div className={s.sectionCenter} style={{ marginBottom: 56 }}>
              <span className={s.sectionLabel}>By the Numbers</span>
              <h2 className={s.sectionTitle}>Aurum in 2026</h2>
            </div>
          </Reveal>
          <div className={s.grid4} style={{ gap: 2 }}>
            {[
              { value: "37", label: "Years", sub: "of craftsmanship" },
              { value: "220+", label: "Artisans", sub: "across two ateliers" },
              { value: "85,000+", label: "Families", sub: "who trust Aurum" },
              { value: "5", label: "Flagship Stores", sub: "across India" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div style={{ background: "#fff", padding: "48px 32px", textAlign: "center", borderTop: "2px solid #b8962e" }}>
                  <div style={{ fontSize: 44, fontWeight: 200, color: "#1a1410", letterSpacing: -2, marginBottom: 6 }}>{stat.value}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1410", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 12, color: "#a09080" }}>{stat.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
