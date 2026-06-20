"use client"

import React from "react"
import Link from "next/link"
import { NavBar, Footer, Reveal, GoldDivider, TrustStrip } from "../_components"
import s from "../_styles.module.css"
import ab from "./_about.module.css"

const TEAM = [
  {
    name: "Dr. Priya Mehta",
    role: "Co-Founder & Chief Science Officer",
    bio: "Dermatologist with 14 years of clinical experience. Formulated every product in our range.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=85",
  },
  {
    name: "Anika Sharma",
    role: "Co-Founder & CEO",
    bio: "Former beauty industry exec turned clean beauty advocate. Obsessed with ingredients transparency.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=85",
  },
  {
    name: "Rahul Nair",
    role: "Head of Product Development",
    bio: "Cosmetic chemist with a passion for marrying Ayurvedic wisdom with modern dermatology.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=85",
  },
  {
    name: "Sonia Kapoor",
    role: "Director of Customer Experience",
    bio: "Ensures every Glow customer finds the right routine for their unique skin story.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=85",
  },
]

const VALUES = [
  {
    icon: "🔬",
    title: "Science First",
    desc: "Every ingredient is backed by peer-reviewed research. We only include what works — nothing more.",
  },
  {
    icon: "🌿",
    title: "Clean by Design",
    desc: "Free from parabens, sulfates, artificial fragrance, and over 1,400 potentially harmful ingredients.",
  },
  {
    icon: "🐰",
    title: "Cruelty-Free Forever",
    desc: "Certified cruelty-free and 100% vegan. No animal testing, ever — it's written into our charter.",
  },
  {
    icon: "♻️",
    title: "Planet Conscious",
    desc: "Recycled packaging, carbon-neutral shipping, and 1% of revenue donated to reforestation projects.",
  },
  {
    icon: "🤝",
    title: "Radical Transparency",
    desc: "Full ingredient lists, sourcing disclosures, and clinical trial data — publicly available.",
  },
  {
    icon: "🇮🇳",
    title: "Proudly Indian",
    desc: "Formulated, tested, and manufactured in India using locally sourced botanicals where possible.",
  },
]

const TIMELINE = [
  { year: "2021", title: "The Idea", desc: "Dr. Priya and Anika meet at a clean beauty conference and discover their shared frustration with the gap between clinical skincare and consumer access." },
  { year: "2022", title: "3 Years in a Lab", desc: "We spent 36 months formulating, testing, and reformulating. 200+ iterations before a single product reached the market." },
  { year: "2023", title: "Glow Launches", desc: "Three hero products. A waitlist of 12,000. The response overwhelmed us — we sold out in 48 hours." },
  { year: "2024", title: "Full Range", desc: "Expanded to 8 products across all major skin concerns. Partnered with 200+ dermatologists across India." },
  { year: "2025", title: "2.4L+ Skin Stories", desc: "Our community has grown to over 2,40,000 customers. We're just getting started." },
]

export function AboutClient({ config }: { config?: import("../../../../lib/store-config").StoreConfig | null }) {
  const colorVars = {
    ...(config?.primary_color ? { "--charcoal": config.primary_color } : {}),
    ...(config?.accent_color  ? { "--gold":     config.accent_color  } : {}),
  } as React.CSSProperties
  return (
    <div className={s.page} style={colorVars}>
      <NavBar storeName={config?.store_name} logoUrl={config?.logo_url} announcementText={config?.announcement_enabled ? config?.announcement_text : null} />
      <div className={s.headerSpacer} />

      {/* Hero */}
      <div className={ab.hero}>
        <img
          src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=85"
          alt="About Glow"
          className={ab.heroBg}
        />
        <div className={ab.heroOverlay} />
        <div className={`${s.container} ${ab.heroContent}`}>
          <Reveal>
            <div className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.6)" }}>Our Story</div>
            <h1 className={ab.heroTitle}>
              Skincare rooted<br />in truth.
            </h1>
            <p className={ab.heroSub}>
              We built Glow because we believed you deserved better — better ingredients, better transparency, better results.
            </p>
            <div className={ab.heroCtas}>
              <Link href="/preview/glow/shop" className={`${s.btn} ${s.btnDark}`} style={{ background: "rgba(250,248,244,0.95)", color: "#283616" }}>
                Shop the Range
              </Link>
              <a href="#story" className={`${s.btn} ${s.btnOutlineLight}`}>Read Our Story</a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Stats */}
      <div className={ab.statsBar}>
        <div className={s.container}>
          <div className={ab.stats}>
            {[
              { num: "3 yrs", label: "In development" },
              { num: "200+", label: "Iterations per formula" },
              { num: "2.4L+", label: "Customers served" },
              { num: "4.8 ★", label: "Average rating" },
              { num: "100%", label: "Dermatologist tested" },
            ].map(({ num, label }) => (
              <div key={label} className={ab.stat}>
                <div className={ab.statNum}>{num}</div>
                <div className={ab.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Origin Story */}
      <section id="story" className={`${s.section} ${ab.storySection}`}>
        <div className={s.container}>
          <div className={ab.storySplit}>
            <Reveal className={ab.storyText}>
              <span className={s.sectionLabel}>How It Began</span>
              <h2 className={s.sectionTitle} style={{ textAlign: "left" }}>
                Born from frustration.<br />Built with purpose.
              </h2>
              <GoldDivider />
              <p className={ab.bodyText}>
                Dr. Priya Mehta spent 14 years watching her patients buy expensive skincare that simply didn't work — or worse, contained ingredients that irritated already-sensitive skin. The problem wasn't effort. It was information.
              </p>
              <p className={ab.bodyText}>
                Meanwhile, Anika Sharma was navigating the beauty industry from the business side — and growing increasingly uncomfortable with the gap between what brands claimed and what was in the bottle.
              </p>
              <p className={ab.bodyText}>
                Together, they decided to build something different. Not just another skincare brand, but a new standard: clinical efficacy, full ingredient transparency, and a price point that doesn't punish you for wanting good skin.
              </p>
              <div className={ab.quote}>
                "We asked ourselves: what would a dermatologist recommend if they had no financial interest in what you bought?"
                <div className={ab.quoteAttrib}>— Dr. Priya Mehta, Co-Founder</div>
              </div>
            </Reveal>
            <Reveal delay={2} className={ab.storyImages}>
              <img
                src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=85"
                alt="In the lab"
                className={ab.storyImg}
              />
              <img
                src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=85"
                alt="Formulation"
                className={`${ab.storyImg} ${ab.storyImgSmall}`}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={`${s.section} ${ab.valuesSection}`}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter}>
              <span className={s.sectionLabel}>What We Stand For</span>
              <h2 className={s.sectionTitle}>Our Values</h2>
              <GoldDivider />
            </div>
          </Reveal>
          <div className={ab.valuesGrid}>
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) as 0|1|2|3|4|5}>
                <div className={ab.valueCard}>
                  <span className={ab.valueIcon}>{v.icon}</span>
                  <div className={ab.valueTitle}>{v.title}</div>
                  <p className={ab.valueDesc}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className={`${s.section} ${ab.timelineSection}`}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter}>
              <span className={s.sectionLabel} style={{ color: "rgba(250,248,244,0.5)" }}>The Journey</span>
              <h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>From idea to icon.</h2>
              <GoldDivider />
            </div>
          </Reveal>
          <div className={ab.timeline}>
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={(i % 3) as 0|1|2|3|4|5}>
                <div className={ab.timelineItem}>
                  <div className={ab.timelineYear}>{item.year}</div>
                  <div className={ab.timelineDot} />
                  <div className={ab.timelineContent}>
                    <div className={ab.timelineTitle}>{item.title}</div>
                    <p className={ab.timelineDesc}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={s.section}>
        <div className={s.container}>
          <Reveal>
            <div className={s.sectionCenter}>
              <span className={s.sectionLabel}>The People</span>
              <h2 className={s.sectionTitle}>Meet the Team</h2>
              <GoldDivider />
              <p className={s.sectionSub} style={{ marginTop: 16 }}>
                Scientists, advocates, and skin obsessives — united by a belief in honest beauty.
              </p>
            </div>
          </Reveal>
          <div className={ab.teamGrid}>
            {TEAM.map((member, i) => (
              <Reveal key={member.name} delay={(i % 4) as 0|1|2|3|4|5}>
                <div className={ab.teamCard}>
                  <div className={ab.teamImageWrap}>
                    <img src={member.image} alt={member.name} className={ab.teamImage} loading="lazy" />
                  </div>
                  <div className={ab.teamName}>{member.name}</div>
                  <div className={ab.teamRole}>{member.role}</div>
                  <p className={ab.teamBio}>{member.bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className={`${s.section} ${ab.sustainSection}`}>
        <div className={s.container}>
          <div className={ab.sustainSplit}>
            <Reveal>
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=700&q=85"
                alt="Sustainability"
                className={ab.sustainImg}
                loading="lazy"
              />
            </Reveal>
            <Reveal delay={2} className={ab.sustainText}>
              <span className={s.sectionLabel}>Our Planet Promise</span>
              <h2 className={s.sectionTitle} style={{ textAlign: "left" }}>Beauty that gives back.</h2>
              <GoldDivider />
              <p className={ab.bodyText}>
                We believe a sustainable future and beautiful skin shouldn't be mutually exclusive. From the day we launched, sustainability has been built into every decision — not bolted on as an afterthought.
              </p>
              <ul className={ab.sustainList}>
                {[
                  "100% recycled secondary packaging since 2023",
                  "Refillable primary containers for 4 of our best-sellers",
                  "Carbon-neutral shipping on all orders",
                  "1% of revenue donated to Project GreenIndia",
                  "Locally sourced botanical ingredients where possible",
                  "Zero single-use plastic in our fulfilment centres",
                ].map(item => (
                  <li key={item} className={ab.sustainItem}>
                    <span className={ab.sustainCheck}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* CTA */}
      <section className={ab.ctaSection}>
        <div className={s.container}>
          <Reveal>
            <h2 className={s.sectionTitle} style={{ color: "var(--ivory)" }}>
              Ready to start your<br />skin story?
            </h2>
            <p className={s.sectionSub} style={{ color: "rgba(250,248,244,0.7)", margin: "0 auto 32px" }}>
              Take our 2-minute skin quiz and we'll build you a personalised routine.
            </p>
            <div className={ab.ctaBtns}>
              <Link href="/preview/glow/shop" className={`${s.btn} ${s.btnDark}`} style={{ background: "rgba(250,248,244,0.95)", color: "#283616" }}>
                Shop All Products
              </Link>
              <a href="#" className={`${s.btn} ${s.btnOutlineLight}`}>Take the Skin Quiz</a>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  )
}
