import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function ReturnsPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.staticHero}>
          <div className={s.pageTitleLabel}>Hassle-Free</div>
          <h1 className={s.pageTitleText}>Return Policy</h1>
          <p className={s.staticUpdated}>30-day no-hassle returns on all products</p>
        </div>

        <div className={s.staticBody}>
          <h2>1. Return Eligibility</h2>
          <ul>
            <li>Items can be returned within 30 days of delivery.</li>
            <li>Garments must be unworn, unwashed, and with all original tags attached.</li>
            <li>A valid Thread order confirmation or invoice must accompany the return.</li>
            <li>Items showing signs of wear, alteration, or odour from use are not eligible for return.</li>
          </ul>

          <h2>2. Non-Returnable Items</h2>
          <ul>
            <li>Innerwear, swimwear, and other intimate apparel for hygiene reasons</li>
            <li>Items marked "Final Sale" at the time of purchase</li>
            <li>Customised or altered garments</li>
            <li>Gift cards</li>
          </ul>

          <h2>3. How to Return</h2>
          <ul>
            <li>1. Email us at support@thread.in with your order ID and the reason for return.</li>
            <li>2. We'll confirm eligibility and arrange a free pickup from your delivery address.</li>
            <li>3. Once we receive and inspect the item (1–2 business days), your refund is initiated.</li>
            <li>4. Refunds are credited to your original payment method within 5–7 business days.</li>
          </ul>

          <h2>4. Exchanges</h2>
          <p>
            Need a different size? Choose an exchange instead of a refund when requesting your return — subject to stock availability for the size you need.
          </p>

          <h2>5. Damaged or Incorrect Items</h2>
          <p>
            Report any damage, defect, or incorrect item within 48 hours of delivery, along with photos. We'll arrange a free replacement or full refund — no need to return the item first while we review your case.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            Questions about a return or exchange? Reach our support team at support@thread.in.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
