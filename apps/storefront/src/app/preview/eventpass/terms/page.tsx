import { PageShell, T } from "../_components"

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{title}</h2>
    <div style={{ color: T.textMuted, fontSize: 15, lineHeight: 1.9 }}>{children}</div>
  </div>
)

export default function TermsPage() {
  return (
    <PageShell>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: "0.8px", marginBottom: 12 }}>LEGAL</div>
          <h1 style={{ color: T.text, fontSize: 40, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>Terms & Conditions</h1>
          <p style={{ color: T.textLight, fontSize: 14 }}>Last updated: June 19, 2026</p>
        </div>

        <Section title="1. Acceptance of Terms">
          By using EventPass to discover or book event tickets, you agree to these Terms & Conditions. If you do not agree, please do not use the platform.
        </Section>

        <Section title="2. Ticket Purchases">
          All ticket purchases are final unless the event is cancelled or postponed by the organiser. Tickets are non-transferable unless explicitly stated. The QR code issued to you is your entry pass.
        </Section>

        <Section title="3. Event Cancellations">
          EventPass is not the event organiser. We facilitate ticket sales on behalf of organisers. If an event is cancelled, refunds are processed per our Refund Policy. EventPass is not liable for any indirect losses arising from event cancellations.
        </Section>

        <Section title="4. Service Fees">
          A service fee of up to 5% of the ticket price is charged per transaction. This fee is displayed at checkout before payment is made.
        </Section>

        <Section title="5. User Conduct">
          You agree not to resell tickets purchased on EventPass, use bots or automated tools to purchase tickets, or provide false information at checkout.
        </Section>

        <Section title="6. Intellectual Property">
          All content on EventPass — including event listings, images, and design — is the property of EventPass or its licensors and may not be reproduced without permission.
        </Section>

        <Section title="7. Limitation of Liability">
          EventPass is not liable for any loss or damage arising from your attendance at an event, including personal injury, theft, or any other incident at the venue.
        </Section>

        <Section title="8. Governing Law">
          These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
        </Section>

        <Section title="9. Contact">
          For terms-related queries, contact legal@eventpass.in.
        </Section>
      </div>
    </PageShell>
  )
}
