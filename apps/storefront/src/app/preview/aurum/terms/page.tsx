import { PageShell, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      text: `By accessing or using the Aurum website (aurumjewels.in) or purchasing from us, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services. These terms apply to all visitors, users, and customers of Aurum Fine Jewellery Pvt. Ltd.`
    },
    {
      title: "2. Products and Pricing",
      text: `All products on the Aurum website are subject to availability. Prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. Making charges, where applicable, are displayed separately on the product page. Aurum reserves the right to change prices, modify descriptions, or discontinue products at any time without prior notice. In the event of a pricing error, we reserve the right to cancel or adjust the order.`
    },
    {
      title: "3. Orders and Payment",
      text: `By placing an order, you represent that you are at least 18 years of age and are authorised to use the selected payment method. Order confirmation by email does not constitute acceptance — orders are accepted only upon dispatch. We accept payment via credit cards, debit cards, UPI, net banking, and EMI. All payments are processed securely by our payment partners. We reserve the right to refuse any order at our discretion.`
    },
    {
      title: "4. Product Authenticity and Certification",
      text: `All Aurum products are genuine and as described. Gold and silver jewellery carries BIS Hallmarks certifying purity. Diamonds above 0.30 carats are accompanied by GIA grading reports. Coloured gemstones of significant value are certified by GRS or AGL. Certificates accompanying products are authentic documents from the respective laboratories and can be independently verified.`
    },
    {
      title: "5. Shipping and Delivery",
      text: `Delivery timelines are estimates and not guaranteed. Aurum will not be liable for delays caused by courier partners, natural events, public holidays, or circumstances beyond our reasonable control. Risk of loss and title of products pass to you upon delivery to the shipping address provided. Please refer to our Shipping Policy for complete details on delivery timelines, insurance, and tracking.`
    },
    {
      title: "6. Returns and Exchanges",
      text: `Returns are accepted within 30 days of delivery for eligible items in original condition. Custom and personalised pieces are non-returnable. Aurum offers a lifetime exchange policy at our stores at current gold value. Please refer to our Returns & Exchange Policy for complete details on eligibility, the return process, and timelines.`
    },
    {
      title: "7. Intellectual Property",
      text: `All content on the Aurum website — including text, images, logos, product photographs, design elements, and the overall look and feel — is the exclusive intellectual property of Aurum Fine Jewellery Pvt. Ltd. and is protected by applicable copyright and trademark laws. You may not reproduce, distribute, modify, or use any content from this website without prior written permission from Aurum.`
    },
    {
      title: "8. Limitation of Liability",
      text: `To the maximum extent permitted by law, Aurum's liability for any claim arising from the use of our website or products shall not exceed the value of the product purchased. Aurum shall not be liable for any indirect, incidental, consequential, or punitive damages arising from the use of our services or products.`
    },
    {
      title: "9. Governing Law",
      text: `These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from these terms or from your use of Aurum's website or products shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.`
    },
    {
      title: "10. Changes to Terms",
      text: `Aurum reserves the right to update these Terms and Conditions at any time. Material changes will be communicated via email or a notice on our website. Continued use of our website or services after changes are posted constitutes your acceptance of the revised terms.`
    },
    {
      title: "11. Contact",
      text: `For any questions about these Terms and Conditions, please contact us at legal@aurumjewels.in or write to: Aurum Fine Jewellery Pvt. Ltd., 12 Bhulabhai Desai Road, Warden Road, Mumbai 400026.`
    },
  ]

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Last updated: January 2025</div>
        <h1 className={s.pageHeaderTitle}>Terms & Conditions</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>Please read these terms carefully before using our website or making a purchase.</p>
      </div>

      <div className={s.container}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 0 100px" }}>
          {sections.map(section => (
            <div key={section.title} style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: "#1a1410", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #e8e0d4" }}>
                {section.title}
              </h2>
              <p style={{ fontSize: 14, color: "#6b5f52", lineHeight: 1.9 }}>{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
