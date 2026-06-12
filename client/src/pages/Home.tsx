import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

const SAMPLE_ENVELOPES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
];

const FEATURES = [
  { icon: "💌", title: "Stunning Envelopes", desc: "Six hand-crafted envelope styles with wax seals and animated opening sequences." },
  { icon: "🌐", title: "English & Arabic", desc: "Full bilingual support — switch between English and Arabic with a single tap." },
  { icon: "🎵", title: "Background Music", desc: "Choose from six curated tracks or upload your own wedding song." },
  { icon: "📍", title: "Live Venue Map", desc: "Paste any Google Maps link — guests get an embedded map and one-tap directions." },
  { icon: "✉️", title: "RSVP Management", desc: "Collect guest names, party sizes, and phone numbers. Export to CSV." },
  { icon: "🎉", title: "Wishes Wall", desc: "Display guest messages on a beautiful presentation screen at your venue." },
];

const FAQ = [
  { q: "How does it work?", a: "Fill in your details, choose your envelope style, preview your invitation, pay once, and get a shareable link to send to all your guests." },
  { q: "What does the AED 200/month plan include?", a: "Create up to 10 digital invitations per month. Each invitation includes unlimited guest views, RSVP collection, bilingual English & Arabic support, background music, venue map, and a Wishes Wall. Your subscription renews monthly." },
  { q: "Can I edit after publishing?", a: "Yes. You can update your invitation details at any time. Changes reflect instantly for all guests." },
  { q: "Do guests need to download an app?", a: "No. Guests open a link in any browser — no app, no account, no friction." },
  { q: "Is payment secure?", a: "Yes. Payments are processed by Stripe, the world's most trusted payment platform. We never store your card details." },
  { q: "What languages are supported?", a: "English and Arabic are fully supported, including right-to-left layout and Arabic calligraphy fonts." },
];

export default function Home() {
  const { user, loading } = useAuth();

  const ctaHref = user ? "/create" : getLoginUrl("/create");

  return (
    <div style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: "'Lato', sans-serif" }}>
      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#d4af37", letterSpacing: "0.06em" }}>
          Cardly
        </span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="#features" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none" }}>Pricing</a>
          <a href="#faq" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none" }}>FAQ</a>
          {loading ? null : user ? (
            <Link href="/create">
              <button style={btnGold}>Create Invitation</button>
            </Link>
          ) : (
            <a href={getLoginUrl("/create")}>
              <button style={btnGold}>Sign In</button>
            </a>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "#d4af37", marginBottom: 20, opacity: 0.85 }}>
          Digital Wedding Invitations
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.8rem, 8vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24, color: "#f5e6b3" }}>
          Your love story,<br />
          <span style={{ color: "#d4af37" }}>beautifully delivered.</span>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", opacity: 0.75, lineHeight: 1.7, marginBottom: 40, maxWidth: 540, margin: "0 auto 40px" }}>
          Create a stunning digital invitation in minutes. Animated envelope, bilingual Arabic &amp; English, live venue map, RSVP collection — one link, shared with everyone.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={ctaHref}>
            <button style={{ ...btnGold, fontSize: 16, padding: "14px 36px" }}>
              Create Your Invitation →
            </button>
          </a>
          <a href="#features">
            <button style={{ ...btnOutline, fontSize: 16, padding: "14px 32px" }}>
              See How It Works
            </button>
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, opacity: 0.45 }}>AED 200/month · Up to 10 invitations · Cancel anytime</p>
      </section>

      {/* ── Envelope Gallery ── */}
      <section style={{ padding: "20px 24px 60px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {SAMPLE_ENVELOPES.map((src, i) => (
            <div key={i} style={{
              borderRadius: 12, overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "default",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(212,175,55,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)"; }}
            >
              <img src={src} alt={`Envelope style ${i + 1}`} style={{ width: "100%", display: "block", aspectRatio: "3/4", objectFit: "cover" }} />
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, opacity: 0.45, letterSpacing: "0.1em" }}>
          6 envelope styles · Animated wax seal opening
        </p>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={sectionTitle}>Everything you need</h2>
          <p style={sectionSubtitle}>One invitation. Every detail covered.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 48 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 12, padding: "24px 20px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#d4af37", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={sectionTitle}>Three steps to your invitation</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 48, textAlign: "left" }}>
            {[
              { n: "01", title: "Build", desc: "Fill in your names, date, venue, and message. Choose your envelope style, music, and language." },
              { n: "02", title: "Subscribe & publish", desc: "Subscribe for AED 200/month. Create up to 10 invitations per billing period. Cancel anytime." },
              { n: "03", title: "Share", desc: "Send the link via WhatsApp, SMS, or email. Guests open it in any browser — no app needed." },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: "rgba(212,175,55,0.25)", lineHeight: 1, flexShrink: 0, width: 56 }}>{step.n}</span>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#d4af37", marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={sectionTitle}>Simple, honest pricing</h2>
          <div style={{
            marginTop: 40, background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16,
            padding: "40px 32px",
          }}>
            <p style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6, marginBottom: 12 }}>Monthly Subscription</p>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, color: "#d4af37", fontWeight: 700, lineHeight: 1, margin: 0 }}>AED 200</p>
              <p style={{ fontSize: 16, opacity: 0.6, margin: 0 }}>/month</p>
            </div>
            <p style={{ fontSize: 13, opacity: 0.5, marginTop: 6 }}>≈ USD 54 · EUR 50 · GBP 43 per month</p>
            <div style={{ margin: "28px 0", borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 24 }}>
              {[
                "Up to 10 invitations per month",
                "Unlimited guest views per invitation",
                "RSVP collection + CSV export",
                "Bilingual English & Arabic",
                "6 envelope styles + animations",
                "Background music",
                "Live venue map",
                "Wishes Wall presentation",
                "Cancel anytime from your account",
              ].map((item) => (
                <p key={item} style={{ fontSize: 14, opacity: 0.8, marginBottom: 8, textAlign: "left" }}>
                  <span style={{ color: "#d4af37", marginRight: 10 }}>✓</span>{item}
                </p>
              ))}
            </div>
            <a href={ctaHref}>
              <button style={{ ...btnGold, width: "100%", fontSize: 16, padding: "14px 0" }}>
                Start Creating →
              </button>
            </a>
            <p style={{ fontSize: 11, opacity: 0.4, marginTop: 12 }}>No contract · Cancel anytime · Renews monthly</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ ...sectionTitle, textAlign: "center" }}>Frequently asked questions</h2>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            {FAQ.map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid rgba(212,175,55,0.12)", paddingBottom: 20 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#d4af37", marginBottom: 8 }}>{item.q}</h3>
                <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "60px 24px 80px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 5vw, 3rem)", color: "#f5e6b3", marginBottom: 16 }}>
          Ready to create yours?
        </h2>
        <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32 }}>
          Join couples across the UAE and beyond who chose Cardly for their special day.
        </p>
        <a href={ctaHref}>
          <button style={{ ...btnGold, fontSize: 16, padding: "14px 40px" }}>
            Create Your Invitation →
          </button>
        </a>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(212,175,55,0.12)",
        padding: "32px 24px",
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: 16, maxWidth: 900, margin: "0 auto",
      }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#d4af37" }}>Cardly</span>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/terms" style={footerLink}>Terms of Service</Link>
          <Link href="/privacy" style={footerLink}>Privacy Policy</Link>
          <Link href="/refund" style={footerLink}>Refund Policy</Link>
          <a href="mailto:support@cardly.app" style={footerLink}>Contact</a>
        </div>
        <p style={{ fontSize: 12, opacity: 0.35 }}>© {new Date().getFullYear()} Cardly. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const btnGold: React.CSSProperties = {
  background: "linear-gradient(135deg, #d4af37 0%, #f5e6b3 50%, #d4af37 100%)",
  color: "#0a0f1e",
  border: "none",
  borderRadius: 8,
  padding: "12px 28px",
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: 14,
  letterSpacing: "0.06em",
  cursor: "pointer",
  transition: "opacity 0.15s ease, transform 0.15s ease",
};

const btnOutline: React.CSSProperties = {
  background: "transparent",
  color: "#d4af37",
  border: "1px solid rgba(212,175,55,0.5)",
  borderRadius: 8,
  padding: "12px 28px",
  fontFamily: "'Lato', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: "0.06em",
  cursor: "pointer",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
  color: "#f5e6b3",
  textAlign: "center",
  marginBottom: 8,
};

const sectionSubtitle: React.CSSProperties = {
  textAlign: "center",
  fontSize: 15,
  opacity: 0.6,
};

const footerLink: React.CSSProperties = {
  color: "rgba(245,230,179,0.55)",
  fontSize: 13,
  textDecoration: "none",
};
