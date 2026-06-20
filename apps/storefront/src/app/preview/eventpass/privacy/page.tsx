import { PageShell, T } from "../_components"

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
    <div style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.9 }}>{children}</div>
  </div>
)

export default function PrivacyPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", marginBottom: 12 }}>LEGAL</div>
          <h1 style={{ color: T.text, fontSize: 40, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>Privacy Policy</h1>
          <p style={{ color: T.textLight, fontSize: 14 }}>Last updated: June 19, 2026</p>
        </div>

        <Section title="1. Information We Collect">
          When you book a ticket, we collect your name, email address, and phone number. We also collect standard log data (IP address, browser type, pages visited) for security and analytics purposes. We do not collect or store your payment card details — all payments are processed by Razorpay.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information to: send your booking confirmation and QR ticket, contact you about important changes to your booking or event, and improve our platform. We do not use your information for advertising or sell it to third parties.
        </Section>

        <Section title="3. Cookies">
          EventPass uses minimal cookies to remember your cart and to measure basic analytics (pages visited, session duration). We do not use third-party advertising cookies.
        </Section>

        <Section title="4. Data Sharing">
          We share your name and email with the event organiser for check-in purposes only. We do not share your data with advertising networks, data brokers, or any other third parties without your explicit consent.
        </Section>

        <Section title="5. Data Retention">
          We retain your booking data for 3 years for tax and compliance purposes. You may request deletion of your data at any time by emailing privacy@eventpass.in.
        </Section>

        <Section title="6. Your Rights">
          You have the right to access, correct, or delete your personal data. Email us at privacy@eventpass.in for any data requests. We will respond within 30 days.
        </Section>

        <Section title="7. Contact">
          For privacy-related queries, contact us at privacy@eventpass.in or write to EventPass, Mumbai, Maharashtra, India.
        </Section>
      </div>
    </PageShell>
  )
}
