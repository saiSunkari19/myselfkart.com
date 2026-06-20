"use client"

import { PageShell, NewsletterSection } from "../_components"
import s from "../_styles.module.css"

export default function AboutPage() {
  return (
    <PageShell>
      <div className={s.container}>
        {/* Hero */}
        <div className={s.aboutHero}>
          <div className={s.aboutHeroImg}>
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85"
              alt="Thread atelier"
            />
          </div>
          <div>
            <div className={s.sectionLabel}>Our story</div>
            <h1 className={s.sectionTitle} style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
              Clothing that lasts.<br />Principles that don't bend.
            </h1>
            <p style={{ fontSize: 15, color: "#6b6560", lineHeight: 1.8, marginBottom: 20 }}>
              Thread was founded in 2021 out of frustration with fast fashion — clothes that fell apart after three washes and a supply chain no one wanted to think too hard about.
            </p>
            <p style={{ fontSize: 15, color: "#6b6560", lineHeight: 1.8, marginBottom: 20 }}>
              We started with a simple idea: what if a clothing brand just made things well? Natural fabrics. Honest prices. No trend-chasing. No micro-collections released weekly to manufacture urgency.
            </p>
            <p style={{ fontSize: 15, color: "#6b6560", lineHeight: 1.8 }}>
              Five years later, we're still at it. Every Thread piece is designed to last a decade and to look better as it does.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className={`${s.section} ${s.sectionSubtle}`} style={{ borderRadius: 24, padding: "60px 60px" }}>
          <div className={s.sectionCenter}>
            <div className={s.sectionLabel}>What we stand for</div>
            <h2 className={s.sectionTitle}>Our Values</h2>
          </div>
          <div className={s.aboutValues}>
            {[
              { icon: "🌿", title: "Natural Fabrics Only", text: "Linen, cotton, wool, Tencel. We don't use synthetic fabrics except where function requires it (and we'll tell you when we do)." },
              { icon: "🔬", title: "Rigorous Quality", text: "Every fabric is tested before production. Every garment is inspected before shipping. If we wouldn't wear it ourselves, we don't sell it." },
              { icon: "💰", title: "Honest Pricing", text: "We show you our cost breakdown. Fabric, labour, overhead, margin. Nothing hidden, no markups built on inflated original prices." },
              { icon: "🤝", title: "Fair Production", text: "All Thread clothing is produced in certified factories in India and Portugal with fair wages and safe conditions. We visit annually." },
              { icon: "♻️", title: "Circularity First", text: "We take back worn Thread pieces. We repair what we can. We recycle what we can't. Zero clothes to landfill is the goal." },
              { icon: "📦", title: "Low Waste Shipping", text: "Our packaging is 100% recycled and recyclable. No plastic mailers, no tissue paper. Just the clothes." },
            ].map(v => (
              <div key={v.title} className={s.aboutValue}>
                <div className={s.aboutValueIcon}>{v.icon}</div>
                <div className={s.aboutValueTitle}>{v.title}</div>
                <p className={s.aboutValueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <section className={s.section} style={{ textAlign: "center" }}>
          <div className={s.sectionLabel}>By the numbers</div>
          <h2 className={s.sectionTitle}>Thread in 2026</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginTop: 48 }}>
            {[
              { value: "15,000+", label: "Customers", sub: "across India" },
              { value: "600+", label: "Products", sub: "in our range" },
              { value: "4", label: "Factories", sub: "all certified" },
              { value: "100%", label: "Natural fibres", sub: "by default" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#f2efe9", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#1a1a1a", letterSpacing: -2, marginBottom: 6 }}>{stat.value}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 13, color: "#a09890" }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className={s.sectionTight}>
          <div className={s.sectionCenter} style={{ marginBottom: 48 }}>
            <div className={s.sectionLabel}>The people</div>
            <h2 className={s.sectionTitle}>Meet the Team</h2>
          </div>
          <div className={s.teamGrid}>
            {[
              { name: "Kavita Nair", role: "Founder & Creative Director", initials: "KN" },
              { name: "Rohan Mehta", role: "Head of Production", initials: "RM" },
              { name: "Sanya Gupta", role: "Lead Designer", initials: "SG" },
              { name: "Arjun Das", role: "Sustainability Lead", initials: "AD" },
            ].map(person => (
              <div key={person.name} className={s.teamCard}>
                <div className={s.teamAvatar}>{person.initials}</div>
                <div className={s.teamName}>{person.name}</div>
                <div className={s.teamRole}>{person.role}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <NewsletterSection />
    </PageShell>
  )
}
