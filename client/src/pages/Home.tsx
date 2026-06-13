import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLang, LangToggle } from "@/contexts/LangContext";
import { Link } from "wouter";

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: {
    navFeatures: "Features",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navSignIn: "Sign In",
    navCreate: "Create Invitation",
    heroEyebrow: "Digital Wedding Invitations",
    heroH1a: "Your love story,",
    heroH1b: "beautifully delivered.",
    heroSub: "Create a stunning digital invitation in minutes. Animated envelope, bilingual Arabic & English, live venue map, RSVP collection — one link, shared with everyone.",
    heroCta: "Create Your Invitation →",
    heroHow: "See How It Works",
    heroPriceLine: "AED 200/month · Up to 10 invitations · Cancel anytime",
    galleryCaption: "6 envelope styles · Animated wax seal opening",
    featuresTitle: "Everything you need",
    featuresSub: "One invitation. Every detail covered.",
    features: [
      { icon: "💌", title: "Stunning Envelopes", desc: "Six hand-crafted envelope styles with wax seals and animated opening sequences." },
      { icon: "🌐", title: "English & Arabic", desc: "Full bilingual support — switch between English and Arabic with a single tap." },
      { icon: "🎵", title: "Background Music", desc: "Choose from six curated tracks or upload your own wedding song." },
      { icon: "📍", title: "Live Venue Map", desc: "Paste any Google Maps link — guests get an embedded map and one-tap directions." },
      { icon: "✉️", title: "RSVP Management", desc: "Collect guest names, party sizes, and phone numbers. Export to CSV." },
      { icon: "🎉", title: "Wishes Wall", desc: "Display guest messages on a beautiful presentation screen at your venue." },
    ],
    howTitle: "Three steps to your invitation",
    steps: [
      { n: "01", title: "Build", desc: "Fill in your names, date, venue, and message. Choose your envelope style, music, and language." },
      { n: "02", title: "Subscribe & publish", desc: "Subscribe for AED 200/month. Create up to 10 invitations per billing period. Cancel anytime." },
      { n: "03", title: "Share", desc: "Send the link via WhatsApp, SMS, or email. Guests open it in any browser — no app needed." },
    ],
    pricingTitle: "Simple, honest pricing",
    pricingBadge: "Monthly Subscription",
    pricingAmount: "AED 200",
    pricingPer: "/month",
    pricingApprox: "≈ USD 54 · EUR 50 · GBP 43 per month",
    pricingFeatures: [
      "Up to 10 invitations per month",
      "Unlimited guest views per invitation",
      "RSVP collection + CSV export",
      "Bilingual English & Arabic",
      "6 envelope styles + animations",
      "Background music",
      "Live venue map",
      "Wishes Wall presentation",
      "Cancel anytime from your account",
    ],
    pricingCta: "Start Creating →",
    pricingFootnote: "No contract · Cancel anytime · Renews monthly",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "How does it work?", a: "Fill in your details, choose your envelope style, preview your invitation, subscribe, and get a shareable link to send to all your guests." },
      { q: "What does the AED 200/month plan include?", a: "Create up to 10 digital invitations per month. Each invitation includes unlimited guest views, RSVP collection, bilingual English & Arabic support, background music, venue map, and a Wishes Wall. Your subscription renews monthly." },
      { q: "Can I edit after publishing?", a: "Yes. You can update your invitation details at any time. Changes reflect instantly for all guests." },
      { q: "Do guests need to download an app?", a: "No. Guests open a link in any browser — no app, no account, no friction." },
      { q: "Is payment secure?", a: "Yes. Payments are processed by Stripe, the world's most trusted payment platform. We never store your card details." },
      { q: "What languages are supported?", a: "English and Arabic are fully supported, including right-to-left layout and Arabic calligraphy fonts." },
    ],
    ctaTitle: "Ready to create yours?",
    ctaSub: "Join couples across the UAE and beyond who chose Cardly for their special day.",
    ctaBtn: "Create Your Invitation →",
    footerTerms: "Terms of Service",
    footerPrivacy: "Privacy Policy",
    footerRefund: "Refund Policy",
    footerContact: "Contact",
    footerCopyright: `© ${new Date().getFullYear()} Cardly. All rights reserved.`,
  },
  ar: {
    navFeatures: "المميزات",
    navPricing: "الأسعار",
    navFaq: "الأسئلة الشائعة",
    navSignIn: "تسجيل الدخول",
    navCreate: "إنشاء دعوة",
    heroEyebrow: "دعوات زفاف رقمية",
    heroH1a: "قصة حبكم،",
    heroH1b: "تُقدَّم بأجمل صورة.",
    heroSub: "أنشئ دعوة رقمية رائعة في دقائق. ظرف متحرك، ثنائي اللغة عربي وإنجليزي، خريطة الموقع المباشرة، وجمع الردود — رابط واحد يُشارَك مع الجميع.",
    heroCta: "أنشئ دعوتك ←",
    heroHow: "كيف يعمل",
    heroPriceLine: "٢٠٠ درهم/شهر · حتى ١٠ دعوات · إلغاء في أي وقت",
    galleryCaption: "٦ أنماط للأظرف · فتح بختم الشمع المتحرك",
    featuresTitle: "كل ما تحتاجه",
    featuresSub: "دعوة واحدة. كل التفاصيل.",
    features: [
      { icon: "💌", title: "أظرف فاخرة", desc: "ستة أنماط مصممة يدويًا مع ختم الشمع وتسلسلات فتح متحركة." },
      { icon: "🌐", title: "عربي وإنجليزي", desc: "دعم ثنائي اللغة بالكامل — التبديل بين العربية والإنجليزية بنقرة واحدة." },
      { icon: "🎵", title: "موسيقى خلفية", desc: "اختر من بين ستة مقاطع موسيقية مختارة أو ارفع أغنية زفافك الخاصة." },
      { icon: "📍", title: "خريطة الموقع المباشرة", desc: "الصق أي رابط من خرائط جوجل — يحصل الضيوف على خريطة مدمجة واتجاهات بنقرة واحدة." },
      { icon: "✉️", title: "إدارة الردود", desc: "اجمع أسماء الضيوف وأعداد المجموعات وأرقام الهواتف. تصدير إلى CSV." },
      { icon: "🎉", title: "جدار الأمنيات", desc: "اعرض رسائل الضيوف على شاشة عرض جميلة في مكان حفلك." },
    ],
    howTitle: "ثلاث خطوات لدعوتك",
    steps: [
      { n: "٠١", title: "ابنِ دعوتك", desc: "أدخل الأسماء والتاريخ والمكان والرسالة. اختر نمط الظرف والموسيقى واللغة." },
      { n: "٠٢", title: "اشترك وانشر", desc: "اشترك بـ ٢٠٠ درهم/شهر. أنشئ حتى ١٠ دعوات في كل فترة فوترة. إلغاء في أي وقت." },
      { n: "٠٣", title: "شارك", desc: "أرسل الرابط عبر واتساب أو رسالة نصية أو بريد إلكتروني. يفتحه الضيوف في أي متصفح — دون تطبيق." },
    ],
    pricingTitle: "أسعار بسيطة وشفافة",
    pricingBadge: "اشتراك شهري",
    pricingAmount: "٢٠٠ درهم",
    pricingPer: "/شهر",
    pricingApprox: "≈ ٥٤ دولار · ٥٠ يورو · ٤٣ جنيه إسترليني شهريًا",
    pricingFeatures: [
      "حتى ١٠ دعوات في الشهر",
      "مشاهدات غير محدودة لكل دعوة",
      "جمع الردود + تصدير CSV",
      "ثنائي اللغة عربي وإنجليزي",
      "٦ أنماط أظرف مع رسوم متحركة",
      "موسيقى خلفية",
      "خريطة الموقع المباشرة",
      "عرض جدار الأمنيات",
      "إلغاء في أي وقت من حسابك",
    ],
    pricingCta: "ابدأ الإنشاء ←",
    pricingFootnote: "لا عقود · إلغاء في أي وقت · يتجدد شهريًا",
    faqTitle: "الأسئلة الشائعة",
    faq: [
      { q: "كيف يعمل النظام؟", a: "أدخل تفاصيلك، اختر نمط الظرف، استعرض دعوتك، اشترك، واحصل على رابط قابل للمشاركة لإرساله لجميع ضيوفك." },
      { q: "ماذا يتضمن اشتراك ٢٠٠ درهم/شهر؟", a: "أنشئ حتى ١٠ دعوات رقمية في الشهر. كل دعوة تتضمن مشاهدات غير محدودة، وجمع الردود، ودعم ثنائي اللغة، وموسيقى خلفية، وخريطة الموقع، وجدار الأمنيات. يتجدد اشتراكك شهريًا." },
      { q: "هل يمكنني التعديل بعد النشر؟", a: "نعم. يمكنك تحديث تفاصيل دعوتك في أي وقت. تنعكس التغييرات فورًا لجميع الضيوف." },
      { q: "هل يحتاج الضيوف لتنزيل تطبيق؟", a: "لا. يفتح الضيوف الرابط في أي متصفح — دون تطبيق أو حساب أو تعقيدات." },
      { q: "هل الدفع آمن؟", a: "نعم. تتم معالجة المدفوعات عبر Stripe، أكثر منصات الدفع موثوقية في العالم. لا نخزن بيانات بطاقتك أبدًا." },
      { q: "ما اللغات المدعومة؟", a: "العربية والإنجليزية مدعومتان بالكامل، بما في ذلك تخطيط من اليمين لليسار وخطوط الخط العربي." },
    ],
    ctaTitle: "مستعد لإنشاء دعوتك؟",
    ctaSub: "انضم إلى المضيفين في الإمارات وخارجها ممن اختاروا Cardly لمناسباتهم الخاصة.",
    ctaBtn: "أنشئ دعوتك ←",
    footerTerms: "شروط الخدمة",
    footerPrivacy: "سياسة الخصوصية",
    footerRefund: "سياسة الاسترداد",
    footerContact: "تواصل معنا",
    footerCopyright: `© ${new Date().getFullYear()} Cardly. جميع الحقوق محفوظة.`,
  },
};

const SAMPLE_ENVELOPES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
];

export default function Home() {
  const { user, loading } = useAuth();
  const { lang, isAr, dir, bodyFont, scriptFont } = useLang();
  const t = T[lang];
  const ctaHref = user ? "/create" : getLoginUrl("/create");

  return (
    <div dir={dir} style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: bodyFont }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,15,30,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: scriptFont, fontSize: 22, fontWeight: 700, color: "#d4af37", letterSpacing: isAr ? 0 : "0.06em" }}>
          Cardly
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <a href="#features" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none", fontFamily: bodyFont }}>{t.navFeatures}</a>
          <a href="#pricing" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none", fontFamily: bodyFont }}>{t.navPricing}</a>
          <a href="#faq" style={{ color: "rgba(245,230,179,0.7)", fontSize: 13, textDecoration: "none", fontFamily: bodyFont }}>{t.navFaq}</a>
          <LangToggle />
          {loading ? null : user ? (
            <Link href="/create">
              <button style={{ ...btnGold, fontFamily: bodyFont }}>{t.navCreate}</button>
            </Link>
          ) : (
            <a href={getLoginUrl("/create")}>
              <button style={{ ...btnGold, fontFamily: bodyFont }}>{t.navSignIn}</button>
            </a>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: isAr ? 0 : "0.22em", textTransform: "uppercase", color: "#d4af37", marginBottom: 20, opacity: 0.85, fontFamily: bodyFont }}>
          {t.heroEyebrow}
        </p>
        <h1 style={{ fontFamily: scriptFont, fontSize: "clamp(2.8rem, 8vw, 4.5rem)", fontWeight: 700, lineHeight: 1.25, marginBottom: 24, color: "#f5e6b3" }}>
          {t.heroH1a}<br />
          <span style={{ color: "#d4af37" }}>{t.heroH1b}</span>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)", opacity: 0.75, lineHeight: 1.8, marginBottom: 40, maxWidth: 540, margin: "0 auto 40px", fontFamily: bodyFont }}>
          {t.heroSub}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={ctaHref}>
            <button style={{ ...btnGold, fontSize: 16, padding: "14px 36px", fontFamily: bodyFont }}>
              {t.heroCta}
            </button>
          </a>
          <a href="#features">
            <button style={{ ...btnOutline, fontSize: 16, padding: "14px 32px", fontFamily: bodyFont }}>
              {t.heroHow}
            </button>
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, opacity: 0.45, fontFamily: bodyFont }}>{t.heroPriceLine}</p>
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
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, opacity: 0.45, letterSpacing: isAr ? 0 : "0.1em", fontFamily: bodyFont }}>
          {t.galleryCaption}
        </p>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ ...sectionTitle, fontFamily: scriptFont }}>{t.featuresTitle}</h2>
          <p style={{ ...sectionSubtitle, fontFamily: bodyFont }}>{t.featuresSub}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 48 }}>
            {t.features.map((f) => (
              <div key={f.title} style={{
                background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)",
                borderRadius: 12, padding: "24px 20px",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontFamily: scriptFont, fontSize: 18, color: "#d4af37", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, fontFamily: bodyFont }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ ...sectionTitle, fontFamily: scriptFont }}>{t.howTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 48, textAlign: isAr ? "right" : "left" }}>
            {t.steps.map((step) => (
              <div key={step.n} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <span style={{ fontFamily: scriptFont, fontSize: 48, color: "rgba(212,175,55,0.25)", lineHeight: 1, flexShrink: 0, width: 56 }}>{step.n}</span>
                <div>
                  <h3 style={{ fontFamily: scriptFont, fontSize: 22, color: "#d4af37", marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.7, fontFamily: bodyFont }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "60px 24px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ ...sectionTitle, fontFamily: scriptFont }}>{t.pricingTitle}</h2>
          <div style={{ marginTop: 40, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "40px 32px" }}>
            <p style={{ fontSize: 13, letterSpacing: isAr ? 0 : "0.18em", textTransform: "uppercase", opacity: 0.6, marginBottom: 12, fontFamily: bodyFont }}>{t.pricingBadge}</p>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
              <p style={{ fontFamily: scriptFont, fontSize: 52, color: "#d4af37", fontWeight: 700, lineHeight: 1, margin: 0 }}>{t.pricingAmount}</p>
              <p style={{ fontSize: 16, opacity: 0.6, margin: 0, fontFamily: bodyFont }}>{t.pricingPer}</p>
            </div>
            <p style={{ fontSize: 13, opacity: 0.5, marginTop: 6, fontFamily: bodyFont }}>{t.pricingApprox}</p>
            <div style={{ margin: "28px 0", borderTop: "1px solid rgba(212,175,55,0.15)", paddingTop: 24 }}>
              {t.pricingFeatures.map((item) => (
                <p key={item} style={{ fontSize: 14, opacity: 0.8, marginBottom: 8, textAlign: isAr ? "right" : "left", fontFamily: bodyFont }}>
                  <span style={{ color: "#d4af37", marginInlineEnd: 10 }}>✓</span>{item}
                </p>
              ))}
            </div>
            <a href={ctaHref}>
              <button style={{ ...btnGold, width: "100%", fontSize: 16, padding: "14px 0", fontFamily: bodyFont }}>
                {t.pricingCta}
              </button>
            </a>
            <p style={{ fontSize: 11, opacity: 0.4, marginTop: 12, fontFamily: bodyFont }}>{t.pricingFootnote}</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ ...sectionTitle, textAlign: "center", fontFamily: scriptFont }}>{t.faqTitle}</h2>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            {t.faq.map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid rgba(212,175,55,0.12)", paddingBottom: 20 }}>
                <h3 style={{ fontFamily: scriptFont, fontSize: 18, color: "#d4af37", marginBottom: 8 }}>{item.q}</h3>
                <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.8, fontFamily: bodyFont }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "60px 24px 80px", textAlign: "center" }}>
        <h2 style={{ fontFamily: scriptFont, fontSize: "clamp(2rem, 5vw, 3rem)", color: "#f5e6b3", marginBottom: 16 }}>
          {t.ctaTitle}
        </h2>
        <p style={{ fontSize: 15, opacity: 0.65, marginBottom: 32, fontFamily: bodyFont }}>
          {t.ctaSub}
        </p>
        <a href={ctaHref}>
          <button style={{ ...btnGold, fontSize: 16, padding: "14px 40px", fontFamily: bodyFont }}>
            {t.ctaBtn}
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
        <span style={{ fontFamily: scriptFont, fontSize: 18, color: "#d4af37" }}>Cardly</span>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ ...footerLink, fontFamily: bodyFont }}>{t.footerTerms}</Link>
          <Link href="/privacy" style={{ ...footerLink, fontFamily: bodyFont }}>{t.footerPrivacy}</Link>
          <Link href="/refund" style={{ ...footerLink, fontFamily: bodyFont }}>{t.footerRefund}</Link>
          <a href="mailto:support@cardly.app" style={{ ...footerLink, fontFamily: bodyFont }}>{t.footerContact}</a>
        </div>
        <p style={{ fontSize: 12, opacity: 0.35, fontFamily: bodyFont }}>{t.footerCopyright}</p>
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
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: "0.06em",
  cursor: "pointer",
  transition: "opacity 0.15s ease",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
  color: "#f5e6b3",
  textAlign: "center",
  marginBottom: 8,
};

const sectionSubtitle: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.55,
  textAlign: "center",
};

const footerLink: React.CSSProperties = {
  color: "rgba(245,230,179,0.5)",
  fontSize: 13,
  textDecoration: "none",
};
