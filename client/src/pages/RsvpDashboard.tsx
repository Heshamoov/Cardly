import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ARABIC_FONT } from "@/lib/i18n";

const DASH_TRANSLATIONS = {
  en: {
    title: "Guest Responses",
    subtitle: "LoveNote Dashboard",
    backToBuilder: "← Back to Builder",
    totalGuests: "Total Confirmed Guests",
    totalResponses: "Total Responses",
    invitations: "Invitations",
    noInvitations: "No invitations yet",
    noInvitationsHint: "Create and publish an invitation first.",
    noResponses: "No responses yet.",
    signInTitle: "Private Area",
    signInHint: "Please sign in to view guest responses.",
    signIn: "Sign In",
    guestName: "Guest Name",
    phone: "Mobile",
    partySize: "Party Size",
    message: "Message",
    date: "Date",
    reply: "reply",
    replies: "replies",
    views: "Views",
    confirmed: "Confirmed",
    cantAttend: "Can't Attend",
    totalGuestsLabel: "Total Guests",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting…",
    deleteConfirm: (title: string) => `Delete "${title}"? This cannot be undone.`,
  },
  ar: {
    title: "استجابات الضيوف",
    subtitle: "لوحة تحكم LoveNote",
    backToBuilder: "العودة إلى المنشئ ←",
    totalGuests: "إجمالي الضيوف المؤكدين",
    totalResponses: "إجمالي الردود",
    invitations: "الدعوات",
    noInvitations: "لا توجد دعوات بعد",
    noInvitationsHint: "أنشئ دعوة وانشرها أولاً.",
    noResponses: "لا توجد ردود بعد.",
    signInTitle: "منطقة خاصة",
    signInHint: "يرجى تسجيل الدخول لعرض استجابات الضيوف.",
    signIn: "تسجيل الدخول",
    guestName: "اسم الضيف",
    phone: "الهاتف",
    partySize: "عدد الأشخاص",
    message: "رسالة",
    date: "التاريخ",
    reply: "رد",
    replies: "ردود",
    views: "مشاهدات",
    confirmed: "مؤكدون",
    cantAttend: "لن يحضروا",
    totalGuestsLabel: "إجمالي الضيوف",
    cancel: "إلغاء",
    delete: "حذف",
    deleting: "جارٍ الحذف…",
    deleteConfirm: (title: string) => `حذف "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
  },
};

type DashLang = "en" | "ar";

export default function RsvpDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [lang, setLang] = useState<DashLang>("en");

  const isAr = lang === "ar";
  const t = DASH_TRANSLATIONS[lang];
  const bodyFont = isAr ? ARABIC_FONT : "'Lato', sans-serif";
  const scriptFont = isAr ? ARABIC_FONT : "'Cormorant Garamond', serif";
  const dir = isAr ? "rtl" : "ltr";

  const utils = trpc.useUtils();

  const { data: overview, isLoading: overviewLoading } = trpc.rsvp.getAllSlugs.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: detail, isLoading: detailLoading } = trpc.rsvp.getBySlug.useQuery(
    { slug: selectedSlug! },
    { enabled: !!selectedSlug }
  );

  const deleteMutation = trpc.invitations.delete.useMutation({
    onSuccess: () => {
      setDeletingSlug(null);
      setConfirmDelete(null);
      if (selectedSlug === deletingSlug) setSelectedSlug(null);
      utils.rsvp.getAllSlugs.invalidate();
    },
    onError: () => {
      setDeletingSlug(null);
    },
  });

  const handleDeleteClick = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(slug);
  };

  const handleConfirmDelete = (slug: string) => {
    setDeletingSlug(slug);
    deleteMutation.mutate({ slug });
  };

  // Language toggle button
  const LangToggle = () => (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => setLang("en")}
        style={{
          padding: "4px 14px",
          borderRadius: 20,
          border: `1px solid ${lang === "en" ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)"}`,
          background: lang === "en" ? "rgba(212,175,55,0.15)" : "transparent",
          color: lang === "en" ? "#D4AF37" : "rgba(212,175,55,0.5)",
          fontFamily: "'Lato', sans-serif",
          fontSize: 11,
          fontWeight: lang === "en" ? 700 : 400,
          letterSpacing: "0.1em",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLang("ar")}
        style={{
          padding: "4px 14px",
          borderRadius: 20,
          border: `1px solid ${lang === "ar" ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.3)"}`,
          background: lang === "ar" ? "rgba(212,175,55,0.15)" : "transparent",
          color: lang === "ar" ? "#D4AF37" : "rgba(212,175,55,0.5)",
          fontFamily: ARABIC_FONT,
          fontSize: 13,
          fontWeight: lang === "ar" ? 700 : 400,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        عربي
      </button>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F172A" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F172A" }} dir={dir}>
        <div className="text-center px-8">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <LangToggle />
          </div>
          <p className="font-script text-4xl mb-4" style={{ color: "#D4AF37", fontFamily: scriptFont }}>{t.signInTitle}</p>
          <p className="font-sans text-sm mb-6" style={{ color: "#E5C07B", opacity: 0.7, fontFamily: bodyFont }}>
            {t.signInHint}
          </p>
          <a
            href={getLoginUrl("/rsvp-dashboard")}
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "linear-gradient(135deg, #A88A1A, #D4AF37)",
              color: "#0F172A",
              borderRadius: 50,
              fontFamily: bodyFont,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: isAr ? "0" : "0.1em",
              textDecoration: "none",
              textTransform: isAr ? "none" : "uppercase",
            }}
          >
            {t.signIn}
          </a>
        </div>
      </div>
    );
  }

  const totalGuests = overview?.slugs.reduce((sum, s) => sum + s.totalGuests, 0) ?? 0;
  const totalResponses = overview?.slugs.reduce((sum, s) => sum + s.responseCount, 0) ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#0F172A", color: "#E5C07B" }} dir={dir}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #D4AF3722", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexDirection: isAr ? "row-reverse" : "row" }}>
        <div>
          <p style={{ fontFamily: scriptFont, fontSize: 22, color: "#D4AF37", fontWeight: 300 }}>
            {t.title}
          </p>
          <p style={{ fontFamily: bodyFont, fontSize: 11, color: "#E5C07B", opacity: 0.5, letterSpacing: isAr ? "0" : "0.1em", textTransform: isAr ? "none" : "uppercase", marginTop: 2 }}>
            {t.subtitle}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexDirection: isAr ? "row-reverse" : "row" }}>
          <LangToggle />
          <a
            href="/"
            style={{
              fontFamily: bodyFont,
              fontSize: 12,
              color: "#D4AF37",
              opacity: 0.7,
              textDecoration: "none",
              letterSpacing: "0.08em",
            }}
          >
            {t.backToBuilder}
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { label: t.totalGuests, value: totalGuests, icon: "👥" },
            { label: t.totalResponses, value: totalResponses, icon: "✉️" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              style={{
                background: "#1E293B",
                border: "1px solid #D4AF3733",
                borderRadius: 12,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: scriptFont, fontSize: 40, color: "#D4AF37", fontWeight: 300, lineHeight: 1 }}>
                {overviewLoading ? "—" : value}
              </div>
              <div style={{ fontFamily: bodyFont, fontSize: 11, color: "#E5C07B", opacity: 0.5, textTransform: isAr ? "none" : "uppercase", letterSpacing: isAr ? "0" : "0.1em", marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Per-invitation list */}
        {overviewLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
          </div>
        ) : overview?.slugs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#E5C07B", opacity: 0.5 }}>
            <p style={{ fontFamily: scriptFont, fontSize: 22 }}>{t.noInvitations}</p>
            <p style={{ fontFamily: bodyFont, fontSize: 13, marginTop: 8 }}>{t.noInvitationsHint}</p>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: bodyFont, fontSize: 11, color: "#D4AF37", opacity: 0.6, textTransform: isAr ? "none" : "uppercase", letterSpacing: isAr ? "0" : "0.1em", marginBottom: 12 }}>
              {t.invitations}
            </p>
            {overview?.slugs.map((inv) => (
              <div key={inv.slug}>
                {/* Confirm delete dialog */}
                {confirmDelete === inv.slug && (
                  <div
                    style={{
                      background: "#1E293B",
                      border: "1px solid #ef444466",
                      borderRadius: 10,
                      padding: "16px 20px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isAr ? "flex-end" : "space-between",
                      gap: 12,
                      flexDirection: isAr ? "row-reverse" : "row",
                    }}
                  >
                    <p style={{ fontFamily: bodyFont, fontSize: 13, color: "#E5C07B" }}>
                      {t.deleteConfirm(inv.title)}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: "1px solid #D4AF3766",
                          background: "transparent",
                          color: "#D4AF37",
                          fontFamily: bodyFont,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(inv.slug)}
                        disabled={deletingSlug === inv.slug}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: "none",
                          background: "#ef4444",
                          color: "#fff",
                          fontFamily: bodyFont,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          opacity: deletingSlug === inv.slug ? 0.6 : 1,
                        }}
                      >
                        {deletingSlug === inv.slug ? t.deleting : t.delete}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginBottom: selectedSlug === inv.slug ? 0 : 8, flexDirection: isAr ? "row-reverse" : "row" }}>
                  <button
                    onClick={() => setSelectedSlug(selectedSlug === inv.slug ? null : inv.slug)}
                    style={{
                      flex: 1,
                      background: selectedSlug === inv.slug ? "#1E293B" : "transparent",
                      border: `1px solid ${selectedSlug === inv.slug ? "#D4AF37" : "#D4AF3733"}`,
                      borderRadius: selectedSlug === inv.slug ? "10px 10px 0 0" : 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexDirection: isAr ? "row-reverse" : "row",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ textAlign: isAr ? "right" : "left" }}>
                      <p style={{ fontFamily: scriptFont, fontSize: 18, color: "#D4AF37", fontWeight: 400 }}>
                        {inv.title}
                      </p>
                      <p style={{ fontFamily: bodyFont, fontSize: 11, color: "#E5C07B", opacity: 0.5, marginTop: 2 }}>
                        /{inv.slug} · {new Date(inv.createdAt).toLocaleDateString(isAr ? "ar-AE" : "en-GB")}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexDirection: isAr ? "row-reverse" : "row", alignItems: "center" }}>
                      {[
                        { icon: "👁", value: (inv as any).views ?? 0, label: t.views },
                        { icon: "✅", value: (inv as any).confirmedCount ?? 0, label: t.confirmed },
                        { icon: "❌", value: (inv as any).declinedCount ?? 0, label: t.cantAttend },
                        { icon: "👥", value: inv.totalGuests, label: t.totalGuestsLabel },
                      ].map(({ icon, value, label }) => (
                        <div key={label} style={{ textAlign: "center", minWidth: 44 }}>
                          <div style={{ fontSize: 14 }}>{icon}</div>
                          <div style={{ fontFamily: scriptFont, fontSize: 20, color: "#D4AF37", lineHeight: 1.1 }}>{value}</div>
                          <div style={{ fontFamily: bodyFont, fontSize: 9, color: "#E5C07B", opacity: 0.45, textTransform: isAr ? "none" : "uppercase", letterSpacing: isAr ? 0 : "0.06em", marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(inv.slug, e)}
                    title={t.delete}
                    style={{
                      width: 40,
                      flexShrink: 0,
                      background: "transparent",
                      border: "1px solid #ef444444",
                      borderRadius: 10,
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ef444422"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    🗑
                  </button>
                </div>

                {/* Expanded guest list */}
                {selectedSlug === inv.slug && (
                  <div
                    style={{
                      background: "#0B1120",
                      border: "1px solid #D4AF3722",
                      borderTop: "none",
                      borderRadius: "0 0 10px 10px",
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    {detailLoading ? (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
                      </div>
                    ) : detail?.responses.length === 0 ? (
                      <p style={{ padding: "16px 20px", fontFamily: bodyFont, fontSize: 13, color: "#E5C07B", opacity: 0.4, textAlign: isAr ? "right" : "left" }}>
                        {t.noResponses}
                      </p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", direction: dir }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #D4AF3722" }}>
                            {[t.guestName, t.phone, t.partySize, t.message, t.date].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "10px 16px",
                                  textAlign: isAr ? "right" : "left",
                                  fontFamily: bodyFont,
                                  fontSize: 10,
                                  color: "#D4AF37",
                                  opacity: 0.6,
                                  textTransform: isAr ? "none" : "uppercase",
                                  letterSpacing: isAr ? "0" : "0.1em",
                                  fontWeight: 600,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail?.responses.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #D4AF3711" }}>
                              <td style={{ padding: "12px 16px", fontFamily: bodyFont, fontSize: 14, color: "#E5C07B" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>{r.attending ? "✅" : "❌"}</span>
                                  {r.guestName}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: bodyFont, fontSize: 13, color: "#E5C07B", opacity: 0.7, whiteSpace: "nowrap" }}>
                                {(r as any).phone ? (
                                  <a
                                    href={`tel:${(r as any).phone}`}
                                    style={{ color: "#D4AF37", textDecoration: "none", fontFamily: "'Lato', monospace" }}
                                  >
                                    {(r as any).phone}
                                  </a>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: scriptFont, fontSize: 20, color: "#D4AF37", textAlign: "center" }}>
                                {r.partySize}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: bodyFont, fontSize: 13, color: "#E5C07B", opacity: 0.6, maxWidth: 200 }}>
                                {r.message || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: bodyFont, fontSize: 12, color: "#E5C07B", opacity: 0.4, whiteSpace: "nowrap" }}>
                                {new Date(r.createdAt).toLocaleDateString(isAr ? "ar-AE" : "en-GB")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
