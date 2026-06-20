import { PageShell } from "../_components"
import s from "../_styles.module.css"

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.staticHero}>
          <div className={s.pageTitleLabel}>Legal</div>
          <h1 className={s.pageTitleText}>Privacy Policy</h1>
          <p className={s.staticUpdated}>Last updated: 19 June 2026</p>
        </div>

        <div className={s.staticBody}>
          <p>
            Thread ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights in relation to it.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Name, email address, and phone number when you place an order or contact us</li>
            <li>Shipping address for delivery</li>
            <li>Payment information (processed securely by our payment partners — we do not store card details)</li>
            <li>Communications you send us via email or our contact form</li>
          </ul>
          <p>We also collect certain information automatically when you use our website:</p>
          <ul>
            <li>Device type, browser, and operating system</li>
            <li>Pages visited and time spent on site</li>
            <li>IP address and approximate location</li>
            <li>Referring website or search terms</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Process and fulfil your orders</li>
            <li>Send order confirmations, shipping updates, and delivery notifications</li>
            <li>Respond to your questions and support requests</li>
            <li>Send marketing emails (only if you opt in — you can unsubscribe anytime)</li>
            <li>Improve our website and understand how customers use it</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We share your information only with:
          </p>
          <ul>
            <li>Courier and logistics partners to deliver your orders</li>
            <li>Payment processors to handle transactions securely</li>
            <li>Analytics providers (e.g., Google Analytics) to understand site usage</li>
            <li>Law enforcement or regulators when legally required</li>
          </ul>

          <h2>4. Cookies</h2>
          <p>
            We use cookies to remember your preferences, keep you logged in, and analyse site traffic. You can control cookie settings through your browser. Disabling cookies may affect some site functionality, such as keeping items in your cart.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal data for as long as necessary to fulfil the purposes described in this policy, or as required by law. Order data is retained for 7 years for accounting and tax purposes. You may request deletion of your personal data at any time (subject to legal retention requirements).
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications at any time</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
          <p>To exercise any of these rights, email us at privacy@thread.in.</p>

          <h2>7. Security</h2>
          <p>
            We use industry-standard security measures to protect your personal information, including HTTPS encryption, access controls, and regular security reviews. No transmission over the internet is completely secure, but we take all reasonable steps to protect your data.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our website is not directed at children under 18. We do not knowingly collect personal information from anyone under 18. If you believe we have collected information from a minor, please contact us immediately.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We'll notify you of significant changes via email or a prominent notice on our website. The date at the top of this page shows when it was last updated.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            For privacy-related questions, contact our Privacy Officer at privacy@thread.in or write to Thread, 14 Linking Road, Bandra West, Mumbai 400050.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
