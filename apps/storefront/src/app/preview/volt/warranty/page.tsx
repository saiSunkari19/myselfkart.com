import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function WarrantyPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>After-Sales</div>
          <div className={s.pageHeaderTitle}>Warranty Information</div>
          <div className={s.pageHeaderSub}>All products sold by Volt come with full manufacturer warranty</div>
        </div>
      </div>
      <div className={s.container}>
        <div className={s.infoContent}>
          {[
            { title: "1. Manufacturer Warranty", content: ["All products sold on Volt.in carry the standard manufacturer warranty as applicable for that product in India.", "Warranty duration varies by brand and product category — typically 1 year for consumer electronics, 2 years for appliances.", "The warranty is provided by the brand directly. Volt facilitates the claim process on your behalf at no extra charge.", "All warranty claims must be supported by your Volt purchase invoice, which is sent to your email at the time of order."] },
            { title: "2. What's Covered", content: ["Manufacturing defects in materials and workmanship", "Hardware failures under normal use conditions", "Dead on arrival (DOA) — products that fail within 7 days of delivery", "Component failures not caused by physical damage or misuse"] },
            { title: "3. What's Not Covered", content: ["Physical damage (drops, cracks, water damage beyond rated resistance)", "Damage from misuse, negligence, or unauthorised repair", "Normal wear and tear (scratches, battery degradation over time)", "Software issues, viruses, or unauthorised modifications", "Accessories not covered by product warranty"] },
            { title: "4. How to Claim Warranty", content: ["Contact Volt support at 1800-VOLT-CARE or support@volt.in with your order ID.", "Our team will diagnose the issue and guide you to the nearest authorised service centre.", "For DOA products (failure within 7 days), we offer direct replacement without requiring service centre visits.", "Turnaround time at authorised service centres is typically 7–14 business days depending on the brand and issue."] },
            { title: "5. Extended Warranty", content: ["Extended warranty plans (1–3 additional years) are available for select products at checkout.", "Extended warranty covers everything in the standard manufacturer warranty plus accidental damage protection.", "Extended warranty plans are provided by our partner insurers and are fully underwritten."] },
          ].map(section => (
            <div key={section.title} className={s.infoSection}>
              <h2>{section.title}</h2>
              <ul>{section.content.map(item => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
