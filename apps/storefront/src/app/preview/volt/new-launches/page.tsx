import { PageShell, ProductCard, Reveal } from "../_components"
import { NEW_LAUNCHES, PRODUCTS } from "../_data"
import s from "../_styles.module.css"

export default function NewLaunchesPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Just Arrived</div>
          <div className={s.pageHeaderTitle}>New Launches</div>
          <div className={s.pageHeaderSub}>The latest and greatest from the world's leading technology brands</div>
        </div>
      </div>
      <div className={s.container}>
        <section className={s.section}>
          <Reveal>
            <div className={s.sectionHead}>
              <div className={s.sectionTitle}>🆕 Latest Releases</div>
            </div>
          </Reveal>
          <div className={s.productGrid}>
            {NEW_LAUNCHES.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0|1|2|3}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>

        <section className={s.section} style={{ borderTop: "1px solid var(--border)" }}>
          <Reveal>
            <div className={s.sectionHead}>
              <div className={s.sectionTitle}>📅 Coming Soon</div>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { name: "Apple iPhone 17", brand: "Apple", date: "September 2025", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80" },
              { name: "Samsung Galaxy S26", brand: "Samsung", date: "January 2026", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80" },
              { name: "Nothing Phone (3)", brand: "Nothing", date: "Q2 2025", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80" },
            ].map(item => (
              <Reveal key={item.name}>
                <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                  <div style={{ aspectRatio: "3/2", overflow: "hidden", background: "var(--bg2)", position: "relative" }}>
                    <img src={item.image} alt={item.name} style={{ filter: "blur(6px) grayscale(30%)", transform: "scale(1.05)" }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)" }}>
                      <span style={{ background: "var(--accent)", color: "#fff", padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>Coming Soon</span>
                    </div>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>{item.brand}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>Expected: {item.date}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
