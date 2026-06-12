import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="June 2026">
      <Section title="1. Introduction">
        <p>Cardly ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>
      </Section>
      <Section title="2. Information We Collect">
        <p><strong style={{ color: "#d4af37" }}>Account information:</strong> When you sign in via Manus OAuth, we receive your name and email address.</p>
        <p><strong style={{ color: "#d4af37" }}>Invitation content:</strong> The names, dates, venue details, photos, and messages you enter when creating an invitation.</p>
        <p><strong style={{ color: "#d4af37" }}>Guest RSVP data:</strong> Guest names, party sizes, phone numbers, and messages submitted by guests responding to your invitation.</p>
        <p><strong style={{ color: "#d4af37" }}>Payment information:</strong> We do not store card numbers. Payment is handled by Stripe, which stores payment details on their secure servers. We only store a Stripe payment reference ID.</p>
        <p><strong style={{ color: "#d4af37" }}>Usage data:</strong> Invitation view counts and basic analytics to help you understand how guests interact with your invitation.</p>
      </Section>
      <Section title="3. How We Use Your Information">
        <p>We use your information to: provide and operate the Service; process payments; send transactional emails (payment receipts, invitation confirmations); and improve the Service.</p>
        <p>We do not sell your personal data to third parties.</p>
      </Section>
      <Section title="4. Data Sharing">
        <p>We share data with: <strong style={{ color: "#d4af37" }}>Stripe</strong> (payment processing); <strong style={{ color: "#d4af37" }}>Manus</strong> (authentication and hosting infrastructure). All third parties are bound by data processing agreements.</p>
      </Section>
      <Section title="5. Data Retention">
        <p>Your invitation data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a>.</p>
        <p>Guest RSVP data is retained for 12 months after the event date, after which it is automatically deleted.</p>
      </Section>
      <Section title="6. Cookies">
        <p>We use a single session cookie to keep you signed in. We do not use advertising or tracking cookies.</p>
      </Section>
      <Section title="7. Your Rights">
        <p>You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; and withdraw consent at any time. To exercise these rights, contact us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a>.</p>
      </Section>
      <Section title="8. Security">
        <p>We use industry-standard security measures including HTTPS, encrypted databases, and access controls to protect your data.</p>
      </Section>
      <Section title="9. Children's Privacy">
        <p>The Service is not directed at children under 13. We do not knowingly collect personal information from children.</p>
      </Section>
      <Section title="10. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service.</p>
      </Section>
      <Section title="11. Contact">
        <p>For privacy-related questions, contact us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a>.</p>
      </Section>
    </LegalPage>
  );
}

function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: "'Lato', sans-serif" }}>
      <nav style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
        <Link href="/"><a style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#d4af37", textDecoration: "none" }}>Cardly</a></Link>
        <Link href="/"><a style={{ fontSize: 13, color: "rgba(245,230,179,0.6)", textDecoration: "none" }}>← Back to Home</a></Link>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#d4af37", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, opacity: 0.45, marginBottom: 48 }}>Last updated: {lastUpdated}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>{children}</div>
      </div>
      <footer style={{ borderTop: "1px solid rgba(212,175,55,0.12)", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/terms"><a style={footerLink}>Terms</a></Link>
          <Link href="/privacy"><a style={footerLink}>Privacy</a></Link>
          <Link href="/refund"><a style={footerLink}>Refund</a></Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#d4af37", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.8, display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

const footerLink: React.CSSProperties = { color: "rgba(245,230,179,0.5)", fontSize: 13, textDecoration: "none" };
