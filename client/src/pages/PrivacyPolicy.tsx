import { useLang, LangToggle } from "@/contexts/LangContext";
import { Link } from "wouter";

const SECTIONS = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 2025",
    backHome: "← Back to Home",
    items: [
      { h: "1. Introduction", p: "YalaInvite (\"we\", \"us\", \"our\") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights." },
      { h: "2. Information We Collect", p: "Account information: When you sign in via Manus OAuth, we receive your name and email address. Invitation content: The names, dates, venue details, photos, and messages you enter when creating an invitation. Guest RSVP data: Guest names, party sizes, phone numbers, and messages submitted by guests. Payment information: We do not store card numbers. Payment is handled by Stripe. We only store a Stripe subscription reference ID. Usage data: Invitation view counts and basic analytics." },
      { h: "3. How We Use Your Information", p: "We use your information to: provide and operate the Service; process payments; and improve the Service. We do not sell your personal data to third parties." },
      { h: "4. Data Sharing", p: "We share data with: Stripe (payment processing); Manus (authentication and hosting infrastructure). All third parties are bound by data processing agreements." },
      { h: "5. Data Retention", p: "Your invitation data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us at support@yalainvite.com. Guest RSVP data is retained for 12 months after the event date, after which it is automatically deleted." },
      { h: "6. Cookies", p: "We use a single session cookie to keep you signed in. We do not use advertising or tracking cookies." },
      { h: "7. Your Rights", p: "You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; and withdraw consent at any time. To exercise these rights, contact us at support@yalainvite.com." },
      { h: "8. Security", p: "We use industry-standard security measures including HTTPS, encrypted databases, and access controls to protect your data." },
      { h: "9. Children's Privacy", p: "The Service is not directed at children under 13. We do not knowingly collect personal information from children." },
      { h: "10. Changes to This Policy", p: "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service." },
      { h: "11. Contact", p: "For privacy-related questions, contact us at support@yalainvite.com." },
    ],
    footerLinks: { terms: "Terms", privacy: "Privacy", refund: "Refund" },
  },
  ar: {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: يونيو ٢٠٢٥",
    backHome: "العودة إلى الرئيسية ←",
    items: [
      { h: "١. المقدمة", p: "تلتزم YalaInvite («نحن»، «لنا»، «خاصتنا») بحماية معلوماتك الشخصية. توضح سياسة الخصوصية هذه البيانات التي نجمعها وكيفية استخدامها وحقوقك." },
      { h: "٢. المعلومات التي نجمعها", p: "معلومات الحساب: عند تسجيل الدخول عبر Manus OAuth، نتلقى اسمك وعنوان بريدك الإلكتروني. محتوى الدعوة: الأسماء والتواريخ وتفاصيل المكان والصور والرسائل التي تدخلها عند إنشاء دعوة. بيانات RSVP للضيوف: أسماء الضيوف وأعداد المجموعات وأرقام الهواتف والرسائل. معلومات الدفع: لا نخزن أرقام البطاقات. يتولى Stripe معالجة المدفوعات. نخزن فقط معرف مرجعي للاشتراك في Stripe. بيانات الاستخدام: عدد مشاهدات الدعوة والتحليلات الأساسية." },
      { h: "٣. كيف نستخدم معلوماتك", p: "نستخدم معلوماتك لـ: تقديم الخدمة وتشغيلها؛ ومعالجة المدفوعات؛ وتحسين الخدمة. لا نبيع بياناتك الشخصية لأطراف ثالثة." },
      { h: "٤. مشاركة البيانات", p: "نشارك البيانات مع: Stripe (معالجة المدفوعات)؛ Manus (البنية التحتية للمصادقة والاستضافة). جميع الأطراف الثالثة ملزمة باتفاقيات معالجة البيانات." },
      { h: "٥. الاحتفاظ بالبيانات", p: "يتم الاحتفاظ ببيانات دعوتك طالما حسابك نشط. يمكنك طلب حذف بياناتك في أي وقت بالتواصل معنا على support@yalainvite.com. يتم الاحتفاظ ببيانات RSVP للضيوف لمدة ١٢ شهرًا بعد تاريخ الحفل، وبعدها تُحذف تلقائيًا." },
      { h: "٦. ملفات تعريف الارتباط", p: "نستخدم ملف تعريف ارتباط واحد للجلسة لإبقائك مسجلًا للدخول. لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبعية." },
      { h: "٧. حقوقك", p: "لديك الحق في: الوصول إلى البيانات الشخصية التي نحتفظ بها عنك؛ وتصحيح البيانات غير الدقيقة؛ وطلب حذف بياناتك؛ وسحب الموافقة في أي وقت. لممارسة هذه الحقوق، تواصل معنا على support@yalainvite.com." },
      { h: "٨. الأمان", p: "نستخدم تدابير أمنية معيارية في الصناعة تشمل HTTPS وقواعد البيانات المشفرة وضوابط الوصول لحماية بياناتك." },
      { h: "٩. خصوصية الأطفال", p: "الخدمة غير موجهة للأطفال دون سن ١٣ عامًا. لا نجمع عن قصد معلومات شخصية من الأطفال." },
      { h: "١٠. التغييرات على هذه السياسة", p: "قد نُحدِّث سياسة الخصوصية هذه من وقت لآخر. سنُعلمك بالتغييرات الجوهرية بنشر إشعار على الخدمة." },
      { h: "١١. التواصل", p: "للاستفسارات المتعلقة بالخصوصية، تواصل معنا على support@yalainvite.com." },
    ],
    footerLinks: { terms: "الشروط", privacy: "الخصوصية", refund: "الاسترداد" },
  },
};

export default function PrivacyPolicy() {
  const { lang, isAr, dir, bodyFont, scriptFont } = useLang();
  const t = SECTIONS[lang];

  return (
    <div dir={dir} style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: bodyFont }}>
      <nav style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
        <Link href="/" style={{ fontFamily: scriptFont, fontSize: 22, fontWeight: 700, color: "#d4af37", textDecoration: "none", letterSpacing: isAr ? 0 : "0.06em" }}>YalaInvite</Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "rgba(245,230,179,0.6)", textDecoration: "none", fontFamily: bodyFont }}>{t.backHome}</Link>
          <LangToggle />
        </div>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: scriptFont, fontSize: "clamp(2rem, 5vw, 3rem)", color: "#d4af37", marginBottom: 8 }}>{t.title}</h1>
        <p style={{ fontSize: 13, opacity: 0.45, marginBottom: 48, fontFamily: bodyFont }}>{t.lastUpdated}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {t.items.map((item) => (
            <div key={item.h}>
              <h2 style={{ fontFamily: scriptFont, fontSize: 20, color: "#d4af37", marginBottom: 10 }}>{item.h}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.8, fontFamily: bodyFont }}>{item.p}</p>
            </div>
          ))}
        </div>
      </div>
      <footer style={{ borderTop: "1px solid rgba(212,175,55,0.12)", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/terms" style={fl(bodyFont)}>{t.footerLinks.terms}</Link>
          <Link href="/privacy" style={fl(bodyFont)}>{t.footerLinks.privacy}</Link>
          <Link href="/refund" style={fl(bodyFont)}>{t.footerLinks.refund}</Link>
        </div>
      </footer>
    </div>
  );
}

const fl = (font: string): React.CSSProperties => ({ color: "rgba(245,230,179,0.5)", fontSize: 13, textDecoration: "none", fontFamily: font });
