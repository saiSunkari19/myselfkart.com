import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function PrivacyPage() {
  const sections = [
    { title: "1. Information We Collect", text: "We collect information you provide when placing orders (name, email, phone, address), payment information (processed securely by our payment partners), and usage data (pages visited, device type, IP address) to improve our services." },
    { title: "2. How We Use Your Information", text: "We use your information to process and fulfil orders; send order confirmations, shipping updates, and delivery notifications; personalise your experience; detect and prevent fraud; and communicate promotional offers (only with your consent)." },
    { title: "3. Sharing Your Information", text: "We do not sell or trade your personal information. We share data only with delivery partners (for shipping), payment processors (for transactions), and technology providers (for website functionality), all bound by confidentiality agreements." },
    { title: "4. Payment Security", text: "All payment transactions are processed by Razorpay, a PCI-DSS Level 1 certified payment gateway. Volt does not store any card details on its servers." },
    { title: "5. Cookies", text: "We use cookies to remember preferences, analyse traffic, and improve the shopping experience. You can disable cookies in your browser settings, though some features may not function correctly." },
    { title: "6. Your Rights", text: "You have the right to access, correct, or delete the personal data we hold about you. To exercise these rights, contact us at privacy@volt.in. We will respond within 7 business days." },
    { title: "7. Data Retention", text: "We retain your information for as long as necessary to fulfil orders and comply with legal obligations (typically 7 years for financial records)." },
    { title: "8. Contact", text: "For privacy-related queries, contact us at privacy@volt.in or write to: Volt Electronics Pvt. Ltd., 14th Floor, One BKC, Bandra Kurla Complex, Mumbai 400051." },
  ]
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Last updated: January 2025</div>
          <div className={s.pageHeaderTitle}>Privacy Policy</div>
        </div>
      </div>
      <div className={s.container}>
        <div className={s.infoContent}>
          {sections.map(sec => (
            <div key={sec.title} className={s.infoSection}>
              <h2>{sec.title}</h2>
              <p>{sec.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
