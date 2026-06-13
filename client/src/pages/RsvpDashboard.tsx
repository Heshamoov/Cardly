import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ARABIC_FONT } from "@/lib/i18n";
import { useLang, LangToggle as GlobalLangToggle } from "@/contexts/LangContext";

const DASH_TRANSLATIONS = {
  en: {
    title: "Guest Responses",
    subtitle: "Cardly Dashboard",
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
    downloadCsv: "Download CSV",
    attendance: "Attendance",
    duplicate: "Duplicate",
    duplicating: "Duplicating…",
    editInBuilder: "Edit in Builder",
    clearResponses: "Clear Responses",
    clearing: "Clearing…",
    clearConfirm: "Delete ALL responses for this invitation? This cannot be undone.",
    copyLink: "Copy Link",
    linkCopied: "Copied!",
    showOnWall: "Show on Wall",
    hiddenFromWall: "Hidden",
    openWall: "Open Wishes Wall",
    exportPptx: "Export as PowerPoint",
    exporting: "Exporting…",
    exportError: "No approved messages to export.",
  },
  ar: {
    title: "استجابات الضيوف",
    subtitle: "لوحة تحكم Cardly",
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
    deleting: "جارِ الحذف…",
    deleteConfirm: (title: string) => `حذف "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
    downloadCsv: "تحميل CSV",
    attendance: "الحضور",
    duplicate: "نسخ",
    duplicating: "جارِ النسخ…",
    editInBuilder: "تعديل في المنشئ",
    clearResponses: "مسح الردود",
    clearing: "جارِ المسح…",
    clearConfirm: "حذف جميع ردود هذه الدعوة؟ لا يمكن التراجع عن هذا الإجراء.",
    copyLink: "نسخ الرابط",
    linkCopied: "تم النسخ!",
    showOnWall: "عرض على الشاشة",
    hiddenFromWall: "مخفي",
    openWall: "فتح جدار الأمنيات",
    exportPptx: "تصدير كـ PowerPoint",
    exporting: "جارِ التصدير…",
    exportError: "لا توجد رسائل معتمدة للتصدير.",
  },
};

type DashLang = "en" | "ar";

function downloadCsv(responses: Array<{ guestName: string; phone?: string | null; partySize: number; attending: boolean; message?: string | null; createdAt: number | Date }>, invTitle: string) {
  const headers = ["Guest Name", "Phone", "Party Size", "Attendance", "Message", "Submitted At"];
  const rows = responses.map((r) => [
    r.guestName,
    (r as any).phone ?? "",
    String(r.partySize),
    r.attending ? "Confirmed" : "Declined",
    r.message ?? "",
    new Date(r.createdAt).toLocaleString("en-GB"),
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows/mobile renders Arabic correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invTitle.replace(/[^a-z0-9]/gi, "_")}_guests.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RsvpDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { lang, isAr, dir, bodyFont: globalBodyFont, scriptFont: globalScriptFont } = useLang();
  const [duplicatingSlug, setDuplicatingSlug] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<string | null>(null);
  const [clearingSlug, setClearingSlug] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [wallSlug, setWallSlug] = useState<string | null>(null);
  const [copiedWallSlug, setCopiedWallSlug] = useState<string | null>(null);
  const [exportingSlug, setExportingSlug] = useState<string | null>(null);
  const [exportErrSlug, setExportErrSlug] = useState<string | null>(null);

  const handleExportPptx = async (slug: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[Export] Button clicked, slug:', slug, 'exportingSlug:', exportingSlug);
    if (exportingSlug) {
      console.log('[Export] Already exporting, returning');
      return;
    }
    setExportingSlug(slug);
    setExportErrSlug(null);
    try {
      console.log('[Export] Fetching /api/wall-export/' + slug);
      const res = await fetch(`/api/wall-export/${slug}`);
      console.log('[Export] Fetch complete. Status:', res.status, 'ok:', res.ok);
      if (!res.ok) {
        console.log('[Export] Response not OK, setting error');
        setExportErrSlug(slug);
        setTimeout(() => setExportErrSlug(null), 3500);
        return;
      }
      console.log('[Export] Converting response to blob...');
      const blob = await res.blob();
      console.log('[Export] Blob created. Size:', blob.size, 'Type:', blob.type);
      const url = URL.createObjectURL(blob);
      console.log('[Export] Object URL created:', url);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="(.+?)"/);
      a.download = match ? match[1] : `${title.replace(/[^a-z0-9]/gi, "_")}_Wishes_Wall.pptx`;
      console.log('[Export] Download filename:', a.download);
      console.log('[Export] Clicking...');
      a.click();
      console.log('[Export] Revoking URL');
      URL.revokeObjectURL(url);
      console.log('[Export] Done!');
    } catch (err) {
      console.error('[Export] Caught error:', err);
      setExportErrSlug(slug);
      setTimeout(() => setExportErrSlug(null), 3500);
    } finally {
      console.log('[Export] Finally - clearing exportingSlug');
      setExportingSlug(null);
    }
  };

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/i/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const t = DASH_TRANSLATIONS[lang as DashLang] ?? DASH_TRANSLATIONS.en;
  const bodyFont = globalBodyFont;
  const scriptFont = globalScriptFont;

  const utils = trpc.useUtils();
  const [, navigate] = useLocation();

  const duplicateMutation = trpc.invitations.duplicate.useMutation({
    onSuccess: (data) => {
      setDuplicatingSlug(null);
      utils.rsvp.getAllSlugs.invalidate();
      navigate(`/?slug=${data.slug}`);
    },
    onError: () => setDuplicatingSlug(null),
  });

  const { data: overview, isLoading: overviewLoading } = trpc.rsvp.getAllSlugs.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: detail, isLoading: detailLoading } = trpc.rsvp.getBySlug.useQuery(
    { slug: selectedSlug! },
    { enabled: !!selectedSlug }
  );

  const toggleWallMutation = trpc.rsvp.toggleShowOnWall.useMutation({
    onSuccess: () => {
      utils.rsvp.getBySlug.invalidate({ slug: selectedSlug! });
    },
  });

  const handleCopyWallLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/wall/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedWallSlug(slug);
      setTimeout(() => setCopiedWallSlug(null), 2000);
    });
  };

  const clearMutation = trpc.rsvp.clearResponses.useMutation({
    onSuccess: () => {
      setClearingSlug(null);
      setConfirmClear(null);
      utils.rsvp.getAllSlugs.invalidate();
      utils.rsvp.getBySlug.invalidate({ slug: selectedSlug! });
    },
    onError: () => setClearingSlug(null),
  });

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

  // Language toggle — uses global LangContext
  const LangToggle = () => <GlobalLangToggle />;

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

                  {/* Copy Link button */}
                  <button
                    onClick={(e) => handleCopyLink(inv.slug, e)}
                    title={t.copyLink}
                    style={{
                      width: 40,
                      flexShrink: 0,
                      background: copiedSlug === inv.slug ? "#D4AF3722" : "transparent",
                      border: `1px solid ${copiedSlug === inv.slug ? "#D4AF37" : "#D4AF3744"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      color: "#D4AF37",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { if (copiedSlug !== inv.slug) (e.currentTarget as HTMLButtonElement).style.background = "#D4AF3722"; }}
                    onMouseLeave={(e) => { if (copiedSlug !== inv.slug) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {copiedSlug === inv.slug ? "✓" : "🔗"}
                  </button>

                  {/* Duplicate button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDuplicatingSlug(inv.slug); duplicateMutation.mutate({ slug: inv.slug }); }}
                    title={t.duplicate}
                    disabled={duplicatingSlug === inv.slug}
                    style={{
                      width: 40,
                      flexShrink: 0,
                      background: "transparent",
                      border: "1px solid #D4AF3744",
                      borderRadius: 10,
                      cursor: duplicatingSlug === inv.slug ? "not-allowed" : "pointer",
                      color: "#D4AF37",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                      opacity: duplicatingSlug === inv.slug ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (duplicatingSlug !== inv.slug) (e.currentTarget as HTMLButtonElement).style.background = "#D4AF3722"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {duplicatingSlug === inv.slug ? "⏳" : "📋"}
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
                    {/* CSV download bar + Clear Responses + Wall link */}
                    {!detailLoading && detail && (
                      <div style={{ padding: "10px 16px", borderBottom: "1px solid #D4AF3722", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", flexDirection: isAr ? "row-reverse" : "row", gap: 8 }}>
                        {/* Open Wishes Wall */}
                        <a
                          href={`/wall/${inv.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 20,
                            border: "1px solid rgba(212,175,55,0.6)",
                            background: "rgba(212,175,55,0.12)",
                            color: "#D4AF37",
                            fontFamily: bodyFont,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: isAr ? 0 : "0.08em",
                            textTransform: isAr ? "none" : "uppercase",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            textDecoration: "none",
                            transition: "all 0.2s",
                          }}
                        >
                          ✨ {t.openWall}
                        </a>
                        {/* Export as PowerPoint */}
                        <button
                          onClick={(e) => handleExportPptx(inv.slug, inv.title, e)}
                          disabled={exportingSlug === inv.slug}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 20,
                            border: "1px solid rgba(212,175,55,0.5)",
                            background: exportErrSlug === inv.slug ? "rgba(239,68,68,0.12)" : "transparent",
                            color: exportErrSlug === inv.slug ? "#ef4444" : "#D4AF37",
                            fontFamily: bodyFont,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: isAr ? 0 : "0.08em",
                            textTransform: isAr ? "none" : "uppercase",
                            cursor: exportingSlug === inv.slug ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            opacity: exportingSlug === inv.slug ? 0.7 : 1,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { if (exportingSlug !== inv.slug) (e.currentTarget as HTMLButtonElement).style.background = "#D4AF3722"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          {exportingSlug === inv.slug ? (
                            <>
                              <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid rgba(212,175,55,0.35)", borderTopColor: "#D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              {t.exporting}
                            </>
                          ) : exportErrSlug === inv.slug ? (
                            <>⚠️ {t.exportError}</>
                          ) : (
                            <>⬇️ {t.exportPptx}</>
                          )}
                        </button>

                        {/* Download CSV */}
                        {detail.responses.length > 0 && (
                          <button
                            onClick={() => downloadCsv(detail.responses, inv.title)}
                            style={{
                              padding: "6px 16px",
                              borderRadius: 20,
                              border: "1px solid #D4AF3766",
                              background: "transparent",
                              color: "#D4AF37",
                              fontFamily: bodyFont,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: isAr ? 0 : "0.08em",
                              textTransform: isAr ? "none" : "uppercase",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#D4AF3722"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          >
                            ↓ {t.downloadCsv}
                          </button>
                        )}
                        {/* Clear Responses */}
                        {detail.responses.length > 0 && (
                          confirmClear === inv.slug ? (
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, flexDirection: isAr ? "row-reverse" : "row" }}>
                              <span style={{ fontFamily: bodyFont, fontSize: 11, color: "#ef4444", opacity: 0.8, flex: "1 1 auto", minWidth: 0 }}>{t.clearConfirm}</span>
                              <button
                                onClick={() => { setClearingSlug(inv.slug); clearMutation.mutate({ slug: inv.slug }); }}
                                disabled={clearingSlug === inv.slug}
                                style={{ padding: "4px 12px", borderRadius: 16, border: "1px solid #ef444488", background: "#ef444422", color: "#ef4444", fontFamily: bodyFont, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                {clearingSlug === inv.slug ? t.clearing : "✓ " + t.clearResponses}
                              </button>
                              <button
                                onClick={() => setConfirmClear(null)}
                                style={{ padding: "4px 12px", borderRadius: 16, border: "1px solid #D4AF3744", background: "transparent", color: "#D4AF37", fontFamily: bodyFont, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
                              >
                                {t.cancel}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmClear(inv.slug)}
                              style={{
                                padding: "6px 16px",
                                borderRadius: 20,
                                border: "1px solid #ef444444",
                                background: "transparent",
                                color: "#ef4444",
                                fontFamily: bodyFont,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: isAr ? 0 : "0.08em",
                                textTransform: isAr ? "none" : "uppercase",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ef444411"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                            >
                              ✕ {t.clearResponses}
                            </button>
                          )
                        )}
                      </div>
                    )}
                    {detailLoading ? (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
                      </div>
                    ) : detail?.responses.length === 0 ? (
                      <p style={{ padding: "16px 20px", fontFamily: bodyFont, fontSize: 13, color: "#E5C07B", opacity: 0.4, textAlign: isAr ? "right" : "left" }}>
                        {t.noResponses}
                      </p>
                    ) : (
                      <div style={{ direction: dir }}>
                        {detail?.responses.map((r, idx) => (
                          <div
                            key={r.id}
                            style={{
                              borderBottom: idx < (detail?.responses.length ?? 0) - 1 ? "1px solid #D4AF3711" : "none",
                              padding: "14px 16px",
                            }}
                          >
                            {/* Row 1: name + attendance badge + date */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{r.attending ? "✅" : "❌"}</span>
                                <span style={{ fontFamily: bodyFont, fontSize: 15, color: "#E5C07B", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.guestName}
                                </span>
                              </div>
                              <span style={{ fontFamily: bodyFont, fontSize: 11, color: "#E5C07B", opacity: 0.4, flexShrink: 0 }}>
                                {new Date(r.createdAt).toLocaleDateString(isAr ? "ar-AE" : "en-GB")}
                              </span>
                            </div>

                            {/* Row 2: phone + party size */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: (r as any).message ? 6 : 0 }}>
                              <span style={{ fontFamily: "'Lato', monospace", fontSize: 13, color: "#D4AF37", opacity: 0.8 }}>
                                {(r as any).phone ? (
                                  <a href={`tel:${(r as any).phone}`} style={{ color: "#D4AF37", textDecoration: "none" }}>
                                    {(r as any).phone}
                                  </a>
                                ) : "—"}
                              </span>
                              <span style={{ fontFamily: bodyFont, fontSize: 12, color: "#E5C07B", opacity: 0.55 }}>
                                {isAr ? `${r.partySize} ${r.partySize === 1 ? "شخص" : "أشخاص"}` : `${r.partySize} ${r.partySize === 1 ? "guest" : "guests"}`}
                              </span>
                            </div>

                            {/* Row 3: message (only if present) */}
                            {(r as any).message && (
                              <div style={{
                                marginTop: 4,
                                padding: "6px 10px",
                                background: "rgba(212,175,55,0.06)",
                                borderRadius: 8,
                                borderLeft: isAr ? "none" : "2px solid rgba(212,175,55,0.25)",
                                borderRight: isAr ? "2px solid rgba(212,175,55,0.25)" : "none",
                                fontFamily: bodyFont,
                                fontSize: 13,
                                color: "#E5C07B",
                                opacity: 0.7,
                                lineHeight: 1.5,
                              }}>
                                {(r as any).message}
                              </div>
                            )}

                            {/* Row 4: Show on Wall checkbox */}
                            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexDirection: isAr ? "row-reverse" : "row" }}>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  cursor: toggleWallMutation.isPending ? "not-allowed" : "pointer",
                                  opacity: toggleWallMutation.isPending ? 0.6 : 1,
                                  userSelect: "none",
                                  flexDirection: isAr ? "row-reverse" : "row",
                                }}
                              >
                                {/* Custom styled checkbox */}
                                <span
                                  onClick={() => !toggleWallMutation.isPending && toggleWallMutation.mutate({ responseId: r.id, showOnWall: !(r as any).showOnWall })}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    border: `2px solid ${(r as any).showOnWall ? "#D4AF37" : "rgba(212,175,55,0.35)"}`,
                                    background: (r as any).showOnWall ? "#D4AF37" : "transparent",
                                    transition: "all 0.18s",
                                    flexShrink: 0,
                                  }}
                                >
                                  {(r as any).showOnWall && (
                                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                      <path d="M1 4L4 7.5L10 1" stroke="#0A0F1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </span>
                                <span
                                  onClick={() => !toggleWallMutation.isPending && toggleWallMutation.mutate({ responseId: r.id, showOnWall: !(r as any).showOnWall })}
                                  style={{
                                    fontFamily: bodyFont,
                                    fontSize: 12,
                                    fontWeight: (r as any).showOnWall ? 700 : 400,
                                    color: (r as any).showOnWall ? "#D4AF37" : "rgba(212,175,55,0.45)",
                                    letterSpacing: isAr ? 0 : "0.05em",
                                    textTransform: isAr ? "none" : "uppercase",
                                    transition: "color 0.18s",
                                  }}
                                >
                                  {(r as any).showOnWall ? t.showOnWall : t.hiddenFromWall}
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
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
