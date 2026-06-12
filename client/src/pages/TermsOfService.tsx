import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="June 2026">
      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Cardly ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
      </Section>
      <Section title="2. Description of Service">
        <p>Cardly provides a digital invitation creation platform. Users create, customise, and publish digital invitations accessible via a unique URL. The Service is offered on a one-time-payment basis per invitation.</p>
      </Section>
      <Section title="3. Payment">
        <p>Each published invitation requires a one-time payment of AED 500 (or the equivalent in your local currency). Payment is processed securely by Stripe. Your invitation is published immediately upon successful payment confirmation.</p>
        <p>All prices are inclusive of any applicable taxes unless stated otherwise.</p>
      </Section>
      <Section title="4. Refund Policy">
        <p>Please refer to our <Link href="/refund"><a style={{ color: "#d4af37" }}>Refund Policy</a></Link> for details on refunds and cancellations.</p>
      </Section>
      <Section title="5. User Responsibilities">
        <p>You are responsible for all content you submit. You must not upload content that is unlawful, defamatory, obscene, or infringes any third-party rights. Cardly reserves the right to remove content that violates these terms without notice or refund.</p>
      </Section>
      <Section title="6. Intellectual Property">
        <p>You retain ownership of all content you create. By using the Service, you grant Cardly a limited, non-exclusive licence to host and display your content solely for the purpose of providing the Service.</p>
        <p>The Cardly platform, design, and software are the exclusive property of Cardly and may not be copied or reproduced without written permission.</p>
      </Section>
      <Section title="7. Privacy">
        <p>Your use of the Service is also governed by our <Link href="/privacy"><a style={{ color: "#d4af37" }}>Privacy Policy</a></Link>.</p>
      </Section>
      <Section title="8. Disclaimer of Warranties">
        <p>The Service is provided "as is" without warranties of any kind. Cardly does not guarantee uninterrupted or error-free operation of the Service.</p>
      </Section>
      <Section title="9. Limitation of Liability">
        <p>To the maximum extent permitted by law, Cardly shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
      </Section>
      <Section title="10. Changes to Terms">
        <p>Cardly may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
      </Section>
      <Section title="11. Governing Law">
        <p>These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Abu Dhabi, UAE.</p>
      </Section>
      <Section title="12. Contact">
        <p>For questions about these Terms, please contact us at <a href="mailto:support@cardly.app" style={{ color: "#d4af37" }}>support@cardly.app</a>.</p>
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
