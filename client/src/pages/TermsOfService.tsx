import { useLang, LangToggle } from "@/contexts/LangContext";
import { Link } from "wouter";

const SECTIONS = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: June 2025",
    backHome: "← Back to Home",
    items: [
      { h: "1. Acceptance of Terms", p: "By accessing or using YalaInvite (\"the Service\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service." },
      { h: "2. Description of Service", p: "YalaInvite provides a digital invitation creation platform. Users create, customise, and publish digital invitations accessible via a unique URL. The Service is offered on a monthly subscription basis." },
      { h: "3. Subscription & Payment", p: "Access to the full Service requires an active monthly subscription of AED 200. Your subscription renews automatically each month. You may cancel at any time from your account settings. Payments are processed securely by Stripe. We do not store your payment card details. Each subscription period allows up to 10 invitations." },
      { h: "4. Refund Policy", p: "Please refer to our Refund Policy page for details on refunds and cancellations." },
      { h: "5. User Responsibilities", p: "You are responsible for all content you submit. You must not upload content that is unlawful, defamatory, obscene, or infringes any third-party rights. YalaInvite reserves the right to remove content that violates these terms without notice." },
      { h: "6. Intellectual Property", p: "You retain ownership of all content you create. By using the Service, you grant YalaInvite a limited, non-exclusive licence to host and display your content solely for the purpose of providing the Service. The YalaInvite platform, design, and software are the exclusive property of YalaInvite and may not be copied or reproduced without written permission." },
      { h: "7. Privacy", p: "Your use of the Service is also governed by our Privacy Policy." },
      { h: "8. Disclaimer of Warranties", p: "The Service is provided \"as is\" without warranties of any kind. YalaInvite does not guarantee uninterrupted or error-free operation of the Service." },
      { h: "9. Limitation of Liability", p: "To the maximum extent permitted by law, YalaInvite shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service." },
      { h: "10. Changes to Terms", p: "YalaInvite may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms." },
      { h: "11. Governing Law", p: "These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Abu Dhabi, UAE." },
      { h: "12. Contact", p: "For questions about these Terms, please contact us at support@yalainvite.com." },
    ],
    footerLinks: { terms: "Terms", privacy: "Privacy", refund: "Refund" },
  },
  ar: {
    title: "شروط الخدمة",
    lastUpdated: "آخر تحديث: يونيو ٢٠٢٥",
    backHome: "العودة إلى الرئيسية ←",
    items: [
      { h: "١. قبول الشروط", p: "باستخدامك لـ YalaInvite («الخدمة»)، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الخدمة." },
      { h: "٢. وصف الخدمة", p: "YalaInvite هي منصة إنشاء دعوات رقمية. يُنشئ المستخدمون دعوات رقمية ويخصصونها وينشرونها ويمكن الوصول إليها عبر رابط فريد. تُقدَّم الخدمة على أساس اشتراك شهري." },
      { h: "٣. الاشتراك والدفع", p: "يتطلب الوصول الكامل للخدمة اشتراكًا شهريًا نشطًا بقيمة ٢٠٠ درهم. يتجدد اشتراكك تلقائيًا كل شهر. يمكنك الإلغاء في أي وقت من إعدادات حسابك. تُعالَج المدفوعات بأمان عبر Stripe. لا نخزن بيانات بطاقتك الائتمانية. تتيح كل فترة اشتراك حتى ١٠ دعوات." },
      { h: "٤. سياسة الاسترداد", p: "يرجى الرجوع إلى صفحة سياسة الاسترداد للاطلاع على تفاصيل الاستردادات والإلغاءات." },
      { h: "٥. مسؤوليات المستخدم", p: "أنت مسؤول عن جميع المحتويات التي ترسلها. يجب ألا ترفع محتوى غير قانوني أو تشهيري أو فاضح أو ينتهك حقوق أطراف ثالثة. تحتفظ YalaInvite بالحق في إزالة المحتوى المخالف لهذه الشروط دون إشعار." },
      { h: "٦. الملكية الفكرية", p: "تحتفظ بملكية جميع المحتويات التي تنشئها. باستخدامك للخدمة، تمنح YalaInvite ترخيصًا محدودًا وغير حصري لاستضافة محتواك وعرضه فقط لأغراض تقديم الخدمة. منصة YalaInvite وتصميمها وبرمجياتها هي الملكية الحصرية لـ YalaInvite ولا يجوز نسخها أو إعادة إنتاجها دون إذن كتابي." },
      { h: "٧. الخصوصية", p: "يخضع استخدامك للخدمة أيضًا لسياسة الخصوصية الخاصة بنا." },
      { h: "٨. إخلاء مسؤولية الضمانات", p: "تُقدَّم الخدمة «كما هي» دون أي ضمانات. لا تضمن YalaInvite التشغيل المتواصل أو الخالي من الأخطاء للخدمة." },
      { h: "٩. تحديد المسؤولية", p: "إلى أقصى حد يسمح به القانون، لن تكون YalaInvite مسؤولة عن أي أضرار غير مباشرة أو عرضية أو تبعية ناجمة عن استخدامك للخدمة." },
      { h: "١٠. التغييرات على الشروط", p: "قد تُحدِّث YalaInvite هذه الشروط في أي وقت. استمرارك في استخدام الخدمة بعد التغييرات يُعدّ قبولًا للشروط الجديدة." },
      { h: "١١. القانون الحاكم", p: "تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة. تخضع أي نزاعات للاختصاص القضائي الحصري لمحاكم أبوظبي، الإمارات." },
      { h: "١٢. التواصل", p: "للاستفسار عن هذه الشروط، يرجى التواصل معنا على support@yalainvite.com." },
    ],
    footerLinks: { terms: "الشروط", privacy: "الخصوصية", refund: "الاسترداد" },
  },
};

export default function TermsOfService() {
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
          <Link href="/terms" style={footerLink(bodyFont)}>{t.footerLinks.terms}</Link>
          <Link href="/privacy" style={footerLink(bodyFont)}>{t.footerLinks.privacy}</Link>
          <Link href="/refund" style={footerLink(bodyFont)}>{t.footerLinks.refund}</Link>
        </div>
      </footer>
    </div>
  );
}

const footerLink = (font: string): React.CSSProperties => ({ color: "rgba(245,230,179,0.5)", fontSize: 13, textDecoration: "none", fontFamily: font });
