import { PageShell, GoldDivider } from "../_components"
import s from "../_styles.module.css"

export default function ShippingPage() {
  return (
    <PageShell>
      <div className={s.pageHeader}>
        <div className={s.pageHeaderLabel}>Delivery Information</div>
        <h1 className={s.pageHeaderTitle}>Shipping Policy</h1>
        <GoldDivider />
        <p className={s.pageHeaderSub}>Every Aurum shipment is insured, tracked, and handled with the care your jewellery deserves.</p>
      </div>

      <div className={s.container}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "60px 0 100px" }}>

          {[
            {
              title: "Shipping Rates",
              content: [
                { label: "Free Insured Shipping", detail: "All orders above ₹10,000 qualify for complimentary insured shipping across India." },
                { label: "Standard Shipping", detail: "Orders below ₹10,000 are charged ₹299 for insured, tracked delivery." },
                { label: "Express Delivery", detail: "1–2 business day delivery is available in Mumbai, Delhi, Bangalore, Chennai, and Hyderabad for ₹499." },
              ]
            },
            {
              title: "Delivery Timelines",
              content: [
                { label: "Standard Delivery", detail: "3–5 business days from the date of order confirmation." },
                { label: "Express Delivery", detail: "1–2 business days for select metro cities." },
                { label: "Bridal & Custom Orders", detail: "Custom and bridal pieces may require 2–3 additional days for additional security verification and quality checks." },
                { label: "Business Days", detail: "We ship Monday through Friday, excluding public holidays. Orders placed on weekends are processed the following Monday." },
              ]
            },
            {
              title: "Packaging",
              content: [
                { label: "Signature Box", detail: "Every Aurum piece ships in our signature matte black luxury gift box with gold embossing." },
                { label: "Security Seal", detail: "Boxes are sealed with a tamper-evident security sticker. If the seal is broken upon delivery, please contact us immediately." },
                { label: "Certificate of Authenticity", detail: "All certificates and documentation are included inside the box, sealed in a protective envelope." },
                { label: "Discreet Outer Packaging", detail: "The outer shipping carton is plain and does not display brand names or indicate the contents." },
              ]
            },
            {
              title: "Order Tracking",
              content: [
                { label: "Email Confirmation", detail: "You will receive an order confirmation email immediately after placing your order." },
                { label: "Dispatch Notification", detail: "A dispatch notification with tracking link will be sent via email and SMS within 24 hours of dispatch." },
                { label: "Live Tracking", detail: "Track your shipment in real time through our courier partner's portal using the tracking number provided." },
              ]
            },
            {
              title: "Insurance & Liability",
              content: [
                { label: "Full Insurance", detail: "Every Aurum shipment is insured for 100% of the declared value of the contents." },
                { label: "Damaged or Lost Shipments", detail: "In the unlikely event of damage or loss in transit, Aurum will arrange a full replacement or refund at no cost to you. Please contact us within 48 hours of the expected delivery date." },
                { label: "Signature Required", detail: "All Aurum deliveries require a signature from an adult at the delivery address. If you are unavailable, a re-delivery attempt will be made the following business day." },
              ]
            },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 56 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: "#1a1410", marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid #e8e0d4" }}>
                {section.title}
              </h2>
              {section.content.map(item => (
                <div key={item.label} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginBottom: 16, padding: "12px 0", borderBottom: "1px solid #f5f0e8" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1410", paddingRight: 20 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: "#6b5f52", lineHeight: 1.7 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ background: "#0d0b08", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
              For shipping queries, contact us at{" "}
              <a href="mailto:shipping@aurumjewels.in" style={{ color: "#b8962e" }}>shipping@aurumjewels.in</a>{" "}
              or call us at +91 22 6789 0123 (Mon–Fri, 10am–7pm IST).
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
