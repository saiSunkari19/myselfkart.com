"use client"

import { PageShell, Reveal, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function CertificationPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Certified. Verified. Guaranteed.</div>
        <h1 className={s.pageHeaderTitle}>Our Certifications</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>
          At Aurum, certification is not optional — it is the foundation of everything we do. Every piece carries full documentation of its authenticity.
        </p>
      </div>

      <div className={s.container}>
        <div className={s.certGrid} style={{ marginTop: 80, marginBottom: 80 }}>
          {[
            {
              logo: "BIS",
              title: "BIS Hallmarking",
              text: "Bureau of Indian Standards hallmarking is mandatory for all gold and silver jewellery sold in India. At Aurum, we have been voluntarily BIS hallmarking since 1998 — long before it was mandated. Every gold piece carries the BIS triangle, purity mark, Assaying and Hallmarking Centre (AHC) mark, and year of marking.",
              points: ["916 for 22-karat gold", "750 for 18-karat gold", "958 for 23-karat gold", "BIS 925 for sterling silver"],
            },
            {
              logo: "GIA",
              title: "GIA Diamond Grading",
              text: "The Gemological Institute of America (GIA) is the world's most respected diamond grading laboratory. Every diamond we use above 0.30 carats comes with a GIA grading report that assesses Cut, Colour, Clarity, and Carat weight — the 4Cs — with complete scientific precision.",
              points: ["International recognition", "Non-negotiable standards", "Laser-inscribed report number", "Full 4C grading report"],
            },
            {
              logo: "GRS",
              title: "GRS Gemstone Certification",
              text: "Gem Research Swisslab (GRS) is the leading laboratory for coloured gemstone certification, particularly for rubies, sapphires, and emeralds. GRS reports are recognised worldwide and provide detailed analysis of colour, origin, treatments, and quality grading.",
              points: ["Origin determination", "Treatment disclosure", "Colour grading", "Accepted globally"],
            },
            {
              logo: "AGL",
              title: "AGL Certification",
              text: "The American Gemological Laboratories (AGL) is renowned for its coloured stone certification, particularly for rare and high-value gems. AGL provides comprehensive origin reports and is the preferred laboratory for many auction houses and high-end dealers.",
              points: ["Premier coloured stone lab", "Auction-house standard", "Full treatment disclosure", "Country of origin reports"],
            },
          ].map((cert, i) => (
            <Reveal key={cert.title} delay={(i % 2) as 0|1}>
              <div className={s.certCard}>
                <div className={s.certLogo}>{cert.logo}</div>
                <div className={s.certTitle}>{cert.title}</div>
                <p className={s.certText}>{cert.text}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {cert.points.map(p => (
                    <li key={p} style={{ fontSize: 13, color: "#6b5f52", padding: "5px 0", borderBottom: "1px solid #f0ebe2", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "#b8962e" }}>✦</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Guarantee */}
        <Reveal>
          <div style={{ background: "#0d0b08", padding: "60px 48px", marginBottom: 80, textAlign: "center" }}>
            <span className={s.sectionLabel}>Our Guarantee</span>
            <h2 className={s.sectionTitle} style={{ color: "#fff", fontSize: 36, marginBottom: 16 }}>
              If it's not certified, we don't sell it.
            </h2>
            <GoldDivider />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 32px" }}>
              This is our non-negotiable standard. Every metal is hallmarked. Every diamond above 0.30 ct is GIA certified. Every premium gemstone has a reputable lab report. This is not a marketing promise — it is a verified fact backed by documentation that comes with every Aurum purchase.
            </p>
          </div>
        </Reveal>
      </div>
    </PageShell>
  )
}
