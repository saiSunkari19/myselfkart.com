import { PageShell, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      text: `When you visit our website or make a purchase, we collect information you provide directly — including your name, email address, mobile number, shipping address, and payment information (processed securely by our payment partners and not stored by us). We also collect non-personal information automatically, including your IP address, browser type, device information, pages visited, and referral source, to improve our website and services.`
    },
    {
      title: "How We Use Your Information",
      text: `We use your information to process and fulfil your orders; send order confirmations, shipping updates, and delivery notifications; respond to your enquiries and customer service requests; personalise your experience on our website; send promotional communications and jewellery recommendations (only with your consent); detect and prevent fraud; and comply with legal and regulatory obligations.`
    },
    {
      title: "Sharing Your Information",
      text: `Aurum does not sell, rent, or trade your personal information to third parties. We share your information only with trusted service providers who help us operate our business — including our payment processors (Razorpay), logistics partners (for shipment delivery and tracking), and technology providers who host and maintain our website. All third parties are contractually obligated to keep your information confidential and use it only for the services they provide to us.`
    },
    {
      title: "Payment Security",
      text: `All payment transactions on Aurum are processed by Razorpay, a PCI-DSS compliant payment gateway. We do not store your card details on our servers. All payment data is encrypted using 256-bit SSL technology and handled entirely by our payment partners in accordance with PCI-DSS standards.`
    },
    {
      title: "Cookies",
      text: `We use cookies and similar tracking technologies to improve your browsing experience, remember your preferences, and analyse site traffic. You can control cookie settings through your browser. Disabling cookies may affect certain features of our website, such as remembering items in your shopping bag.`
    },
    {
      title: "Your Rights",
      text: `You have the right to access the personal information we hold about you; request correction of inaccurate data; request deletion of your personal data (subject to certain legal exceptions); withdraw consent for marketing communications at any time; and lodge a complaint with a supervisory authority. To exercise any of these rights, please contact us at privacy@aurumjewels.in.`
    },
    {
      title: "Data Retention",
      text: `We retain your personal information for as long as necessary to fulfil the purposes described in this policy, including maintaining your order history and complying with tax, legal, and regulatory obligations. Typically, order and transaction records are retained for seven years.`
    },
    {
      title: "Updates to This Policy",
      text: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a prominent notice on our website. The date at the top of this page indicates when the policy was last updated.`
    },
    {
      title: "Contact Us",
      text: `For any questions about this Privacy Policy or how we handle your personal data, please contact our Data Privacy team at privacy@aurumjewels.in or write to: Aurum Fine Jewellery Pvt. Ltd., 12 Bhulabhai Desai Road, Warden Road, Mumbai 400026.`
    },
  ]

  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Last updated: January 2025</div>
        <h1 className={s.pageHeaderTitle}>Privacy Policy</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>At Aurum, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
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
