import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function TermsPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.staticHero}>
          <div className={s.pageTitleLabel}>Legal</div>
          <h1 className={s.pageTitleText}>Terms of Service</h1>
          <p className={s.staticUpdated}>Last updated: 19 June 2026</p>
        </div>

        <div className={s.staticBody}>
          <p>
            These Terms of Service ("Terms") govern your use of the Thread website and any purchases you make from us. By accessing our website or placing an order, you agree to these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Thread website, you confirm that you are at least 18 years old, have the legal authority to enter into these Terms, and agree to be bound by them. If you do not agree to these Terms, please do not use our website.
          </p>

          <h2>2. Products and Pricing</h2>
          <p>
            We reserve the right to modify prices at any time without notice. All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless otherwise stated. We make every effort to display accurate product images, but colours may vary slightly due to your screen calibration.
          </p>
          <ul>
            <li>All products are subject to availability.</li>
            <li>We reserve the right to limit quantities purchased per customer.</li>
            <li>We may refuse or cancel any order for any reason at our discretion.</li>
          </ul>

          <h2>3. Orders and Payment</h2>
          <p>
            An order is confirmed only when you receive an order confirmation email from Thread. We accept payment by card, UPI, net banking, and Cash on Delivery. Payment is processed securely through our payment partners — Thread does not store your payment card details.
          </p>

          <h2>4. Shipping and Delivery</h2>
          <p>
            We aim to dispatch all orders within 1–2 business days. Estimated delivery times are 3–5 business days for standard shipping and 1–2 business days for express shipping. Thread is not responsible for delays caused by courier partners, natural events, or circumstances beyond our control.
          </p>

          <h2>5. Returns and Refunds</h2>
          <p>
            We accept returns within 30 days of delivery. Items must be in their original, unworn, unwashed condition with all tags attached. Refunds are processed to your original payment method within 5–7 business days of receiving the returned item. Shipping charges are non-refundable unless the return is due to a Thread error.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on the Thread website — including text, images, logos, and design — is the intellectual property of Thread and may not be reproduced, distributed, or used without prior written permission.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            Thread's liability in relation to any purchase is limited to the value of the order in question. We are not liable for any indirect, incidental, or consequential damages arising from your use of our website or products.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes are effective immediately upon posting. Your continued use of the website after any changes constitutes acceptance of the updated Terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            For questions about these Terms, contact us at legal@thread.in or write to Thread, 14 Linking Road, Bandra West, Mumbai 400050.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
