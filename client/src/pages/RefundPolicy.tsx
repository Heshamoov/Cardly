import { useLang, LangToggle } from "@/contexts/LangContext";
import { Link } from "wouter";

const SECTIONS = {
  en: {
    title: "Refund Policy",
    lastUpdated: "Last updated: June 2025",
    backHome: "← Back to Home",
    items: [
      { h: "1. Overview", p: "We want you to be completely satisfied with YalaInvite. This Refund Policy explains the circumstances under which refunds are available for our monthly subscription service." },
      { h: "2. Subscription Cancellation", p: "You may cancel your monthly subscription at any time from your account settings or via the Stripe Customer Portal. Cancellation takes effect at the end of the current billing period. You will retain access to the Service and all your invitations until the period ends. No partial refunds are issued for unused days within a billing period." },
      { h: "3. Eligibility for Refund", p: "Full refund: If you were charged but experienced a critical technical failure that prevented you from accessing the Service at all, you may be eligible for a full refund of that month's payment. Please contact us within 7 days of the charge. Exceptional circumstances: If a significant technical issue prevents guests from accessing your invitation and we are unable to resolve it within 48 hours, you may be eligible for a partial or full refund at our discretion." },
      { h: "4. Non-Refundable Situations", p: "Refunds are not available for: change of mind after subscribing; invitations already created and shared with guests; unused invitations within a billing period; or cancellation of a subscription that has already been used." },
      { h: "5. How to Request a Refund", p: "To request a refund, email us at support@yalainvite.com with your registered email address, a description of the issue, and the date of the charge. We will respond within 2 business days." },
      { h: "6. Refund Processing", p: "Approved refunds are processed back to the original payment method within 5–10 business days, depending on your bank or card issuer." },
      { h: "7. Changes to This Policy", p: "We may update this Refund Policy from time to time. The latest version will always be available at this URL." },
      { h: "8. Contact", p: "For refund enquiries, contact us at support@yalainvite.com." },
    ],
    footerLinks: { terms: "Terms", privacy: "Privacy", refund: "Refund" },
  },
  ar: {
    title: "سياسة الاسترداد",
    lastUpdated: "آخر تحديث: يونيو ٢٠٢٥",
    backHome: "العودة إلى الرئيسية ←",
    items: [
      { h: "١. نظرة عامة", p: "نريدك أن تكون راضيًا تمامًا عن YalaInvite. توضح سياسة الاسترداد هذه الظروف التي يمكن فيها الحصول على استردادات لخدمة الاشتراك الشهري." },
      { h: "٢. إلغاء الاشتراك", p: "يمكنك إلغاء اشتراكك الشهري في أي وقت من إعدادات حسابك أو عبر بوابة عملاء Stripe. يسري الإلغاء في نهاية فترة الفوترة الحالية. ستحتفظ بالوصول إلى الخدمة وجميع دعواتك حتى نهاية الفترة. لا تُصدر استردادات جزئية للأيام غير المستخدمة ضمن فترة الفوترة." },
      { h: "٣. الأهلية للاسترداد", p: "استرداد كامل: إذا تم تحصيل رسوم منك لكنك واجهت خللًا تقنيًا حرجًا منعك من الوصول إلى الخدمة كليًا، فقد تكون مؤهلًا لاسترداد كامل لدفعة ذلك الشهر. يرجى التواصل معنا خلال ٧ أيام من تاريخ الرسوم. ظروف استثنائية: إذا منعت مشكلة تقنية كبيرة الضيوف من الوصول إلى دعوتك ولم نتمكن من حلها خلال ٤٨ ساعة، فقد تكون مؤهلًا لاسترداد جزئي أو كامل وفق تقديرنا." },
      { h: "٤. حالات عدم الاسترداد", p: "لا تتوفر الاستردادات في الحالات التالية: تغيير الرأي بعد الاشتراك؛ الدعوات التي تم إنشاؤها ومشاركتها مع الضيوف بالفعل؛ الدعوات غير المستخدمة ضمن فترة الفوترة؛ أو إلغاء اشتراك تم استخدامه بالفعل." },
      { h: "٥. كيفية طلب الاسترداد", p: "لطلب استرداد، أرسل بريدًا إلكترونيًا إلى support@yalainvite.com مع عنوان بريدك الإلكتروني المسجل ووصف المشكلة وتاريخ الرسوم. سنرد خلال يومي عمل." },
      { h: "٦. معالجة الاسترداد", p: "تُعالَج الاستردادات المعتمدة إلى طريقة الدفع الأصلية خلال ٥-١٠ أيام عمل، وفقًا لبنكك أو جهة إصدار بطاقتك." },
      { h: "٧. التغييرات على هذه السياسة", p: "قد نُحدِّث سياسة الاسترداد هذه من وقت لآخر. ستكون النسخة الأخيرة متاحة دائمًا على هذا الرابط." },
      { h: "٨. التواصل", p: "للاستفسار عن الاستردادات، تواصل معنا على support@yalainvite.com." },
    ],
    footerLinks: { terms: "الشروط", privacy: "الخصوصية", refund: "الاسترداد" },
  },
};

export default function RefundPolicy() {
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
