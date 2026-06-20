import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function TermsPage() {
  const sections = [
    { title: "1. Acceptance of Terms", text: "By accessing or purchasing from Volt.in, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website or services." },
    { title: "2. Products and Pricing", text: "All products are subject to availability. Prices are in Indian Rupees and include applicable taxes unless stated otherwise. We reserve the right to change prices, discontinue products, or cancel orders in the event of pricing errors." },
    { title: "3. Orders and Payment", text: "By placing an order you confirm you are at least 18 years old and authorised to use the selected payment method. Order confirmation does not constitute acceptance — we accept orders upon dispatch. We reserve the right to refuse any order." },
    { title: "4. Product Authenticity", text: "All products sold by Volt are 100% genuine and sourced from authorised brand distributors. Volt is an authorised dealer for all brands listed on our platform. All products come with valid manufacturer warranty." },
    { title: "5. Shipping", text: "We aim to dispatch all orders within 24 hours. Delivery timelines are estimates and may vary due to factors beyond our control. Please refer to our Shipping Policy for detailed terms." },
    { title: "6. Returns and Refunds", text: "Our 10-day return policy applies to eligible products in original condition. Please refer to our Return Policy for full details on eligibility, process, and refund timelines." },
    { title: "7. Intellectual Property", text: "All content on Volt.in — including logos, product images, descriptions, and design — is the intellectual property of Volt Electronics Pvt. Ltd. and may not be reproduced without written permission." },
    { title: "8. Limitation of Liability", text: "Volt's liability for any claim shall not exceed the value of the product purchased. We are not liable for indirect, incidental, or consequential damages arising from use of our products or services." },
    { title: "9. Governing Law", text: "These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra." },
    { title: "10. Contact", text: "For queries about these terms, contact legal@volt.in or write to: Volt Electronics Pvt. Ltd., 14th Floor, One BKC, Bandra Kurla Complex, Mumbai 400051." },
  ]
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.container}>
          <div className={s.pageHeaderLabel}>Last updated: January 2025</div>
          <div className={s.pageHeaderTitle}>Terms & Conditions</div>
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
