import { Link } from "wouter";

export default function RefundPolicy() {
  return (
    <LegalPage title="Refund Policy" lastUpdated="June 2026">
      <Section title="1. Overview">
        <p>We want you to be completely satisfied with Cardly. This Refund Policy explains the circumstances under which refunds are available.</p>
      </Section>
      <Section title="2. Eligibility for Refund">
        <p><strong style={{ color: "#d4af37" }}>Full refund:</strong> If you have paid but your invitation has not yet been published (i.e., the payment completed but a technical error prevented publication), you are entitled to a full refund. Please contact us within 7 days of payment.</p>
        <p><strong style={{ color: "#d4af37" }}>No refund after publication:</strong> Once your invitation has been successfully published and the shareable link has been delivered, no refund is available. This is because the digital service has been fully rendered and delivered.</p>
        <p><strong style={{ color: "#d4af37" }}>Exceptional circumstances:</strong> If you experience a significant technical issue that prevents guests from accessing your invitation and we are unable to resolve it within 48 hours, you may be eligible for a partial or full refund at our discretion.</p>
      </Section>
      <Section title="3. How to Request a Refund">
        <p>To request a refund, email us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a> with:</p>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Your registered email address</li>
          <li>The invitation slug or title</li>
          <li>A brief description of the issue</li>
        </ul>
        <p>We will respond within 2 business days.</p>
      </Section>
      <Section title="4. Refund Processing">
        <p>Approved refunds are processed back to the original payment method within 5–10 business days, depending on your bank or card issuer.</p>
      </Section>
      <Section title="5. Changes to This Policy">
        <p>We may update this Refund Policy from time to time. The latest version will always be available at this URL.</p>
      </Section>
      <Section title="6. Contact">
        <p>For refund enquiries, contact us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a>.</p>
      </Section>
    </LegalPage>
  );
}

function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: "'Lato', sans-serif" }}>
      <nav style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#d4af37", textDecoration: "none" }}>Cardly</Link>
        <Link href="/" style={{ fontSize: 13, color: "rgba(245,230,179,0.6)", textDecoration: "none" }}>← Back to Home</Link>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#d4af37", marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, opacity: 0.45, marginBottom: 48 }}>Last updated: {lastUpdated}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>{children}</div>
      </div>
      <footer style={{ borderTop: "1px solid rgba(212,175,55,0.12)", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/terms" style={footerLink}>Terms</Link>
          <Link href="/privacy" style={footerLink}>Privacy</Link>
          <Link href="/refund" style={footerLink}>Refund</Link>
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
