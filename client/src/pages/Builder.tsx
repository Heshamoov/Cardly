import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { translations, ARABIC_FONT, type Lang } from "@/lib/i18n";

interface InvitationData {
  title: string;
  brideFirstName: string;
  brideLastName: string;
  groomFirstName: string;
  groomLastName: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  venueMapQuery: string;
  message: string;
  sections: Record<string, boolean>;
  envelopeStyle: string;
  fontScale: number; // 0.8 – 1.4, default 1.0
  // Arabic content fields (optional)
  arBrideFirstName?: string;
  arBrideLastName?: string;
  arGroomFirstName?: string;
  arGroomLastName?: string;
  arVenueName?: string;
  arVenueAddress?: string;
  arMessage?: string;
}

const ENVELOPE_STYLES = [
  {
    id: "ivory-gold",
    name: "Classic Ivory",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
    sealColor: "#7A1F2B",
    theme: {
      bg: "#F8F4EC",
      bgSecondary: "#EFE7DA",
      text: "#3A3128",
      accent: "#C8A96B",
      accentLight: "#DFC28A",
      accentDark: "#A8893B",
      accentSecondary: "#7A1F2B",
      buttonText: "#F8F4EC",
      sceneBg: "linear-gradient(180deg, #EFE7DA 0%, #F8F4EC 100%)",
    },
  },
  {
    id: "navy-gold",
    name: "Royal Navy",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
    sealColor: "#D4AF37",
    theme: {
      bg: "#0F172A",
      bgSecondary: "#1E293B",
      text: "#E5C07B",
      accent: "#D4AF37",
      accentLight: "#F5E6B3",
      accentDark: "#A88A1A",
      accentSecondary: "#F5E6B3",
      buttonText: "#0F172A",
      sceneBg: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
    },
  },
  {
    id: "blush-rose",
    name: "Floral Blush",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
    sealColor: "#C98C7A",
    theme: {
      bg: "#F7E7E3",
      bgSecondary: "#EFD6D1",
      text: "#6E4F4B",
      accent: "#C98C7A",
      accentLight: "#D8A7A0",
      accentDark: "#A06858",
      accentSecondary: "#D8A7A0",
      buttonText: "#F7E7E3",
      sceneBg: "linear-gradient(180deg, #EFD6D1 0%, #F7E7E3 100%)",
    },
  },
  {
    id: "black-emerald",
    name: "Midnight Black",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
    sealColor: "#1F5C4A",
    theme: {
      bg: "#0B0B0B",
      bgSecondary: "#1A1A1A",
      text: "#D4AF37",
      accent: "#B68D40",
      accentLight: "#D4AF37",
      accentDark: "#8A6A20",
      accentSecondary: "#1F5C4A",
      buttonText: "#0B0B0B",
      sceneBg: "linear-gradient(180deg, #0B0B0B 0%, #1A1A1A 100%)",
    },
  },
];

const defaultData: InvitationData = {
  title: "",
  brideFirstName: "",
  brideLastName: "",
  groomFirstName: "",
  groomLastName: "",
  date: "",
  time: "",
  venueName: "",
  venueAddress: "",
  venueMapQuery: "",
  message: "",
  envelopeStyle: "ivory-gold",
  fontScale: 1.0,
  arBrideFirstName: "",
  arBrideLastName: "",
  arGroomFirstName: "",
  arGroomLastName: "",
  arVenueName: "",
  arVenueAddress: "",
  arMessage: "",
  sections: {
    names: true,
    date: true,
    time: true,
    venue: true,
    message: true,
    map: true,
    countdown: true,
  },
};

// ── Helpers for venue map URL parsing ───────────────────────────────────────
function extractGoogleMapsEmbedUrl(input: string): string | null {
  if (!input.trim()) return null;

  // If user pasted a full Google Maps URL, convert to embed
  // Handles: https://maps.google.com/..., https://www.google.com/maps/..., https://goo.gl/maps/...
  if (input.includes("google.com/maps") || input.includes("goo.gl/maps") || input.includes("maps.app.goo.gl")) {
    // Try to extract place query from URL
    const qMatch = input.match(/[?&]q=([^&]+)/);
    const placeMatch = input.match(/place\/([^/@]+)/);
    const query = qMatch ? decodeURIComponent(qMatch[1]) : placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) : null;
    if (query) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
    // Fallback: use the whole URL as a search
    return `https://maps.google.com/maps?q=${encodeURIComponent(input)}&output=embed`;
  }

  // Plain text search query
  return `https://maps.google.com/maps?q=${encodeURIComponent(input)}&output=embed`;
}

function VenueLocationInput({
  data,
  set,
}: {
  data: InvitationData;
  set: (field: keyof InvitationData, value: string) => void;
}) {
  const [debouncedQuery, setDebouncedQuery] = useState(data.venueMapQuery);

  // Debounce the query by 800ms so we don't fire on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(data.venueMapQuery), 800);
    return () => clearTimeout(timer);
  }, [data.venueMapQuery]);

  const { data: resolved, isFetching } = trpc.invitations.resolveMapUrl.useQuery(
    { url: debouncedQuery },
    { enabled: !!debouncedQuery.trim() }
  );

  return (
    <div className="space-y-3">
      <div>
        <label className="font-sans text-xs opacity-50 block mb-1">Venue Name</label>
        <input
          className="wedding-input"
          placeholder="e.g. The Grand Ballroom"
          value={data.venueName}
          onChange={(e) => set("venueName", e.target.value)}
        />
      </div>
      <div>
        <label className="font-sans text-xs opacity-50 block mb-1">Address</label>
        <input
          className="wedding-input"
          placeholder="e.g. 123 Rose Avenue, New York, USA"
          value={data.venueAddress}
          onChange={(e) => set("venueAddress", e.target.value)}
        />
      </div>
      <div>
        <label className="font-sans text-xs opacity-50 block mb-1">
          Search Location or Paste Google Maps Link
        </label>
        <input
          className="wedding-input"
          placeholder="Type a place name or paste a Google Maps link"
          value={data.venueMapQuery}
          onChange={(e) => set("venueMapQuery", e.target.value)}
        />
        <p className="font-sans text-xs opacity-30 mt-1">
          Type a place name to search, or paste any Google Maps link (e.g. from the Share button)
        </p>
      </div>

      {/* Live map preview */}
      {data.venueMapQuery.trim() && (
        <div className="mt-3">
          <p className="font-sans text-xs opacity-40 mb-2 uppercase tracking-wider">
            {isFetching ? "Resolving location…" : "Map Preview"}
          </p>
          {isFetching && (
            <div className="flex items-center justify-center h-24 rounded-xl border border-gold/20">
              <span className="font-sans text-xs opacity-40 animate-pulse">Loading map…</span>
            </div>
          )}
          {!isFetching && resolved && (
            <>
              <div className="rounded-xl overflow-hidden border border-gold/20">
                <iframe
                  src={resolved.embedUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue Map Preview"
                />
              </div>
              <a
                href={resolved.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-xs text-gold opacity-60 underline mt-1 inline-block"
              >
                Open in Google Maps →
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={`toggle-btn ${on ? "on" : ""}`}
      onClick={onToggle}
      title={on ? "Hide section" : "Show section"}
      type="button"
    />
  );
}

function SectionCard({
  label,
  sectionKey,
  sections,
  onToggle,
  children,
  hiddenText,
  labelFont,
}: {
  label: string;
  sectionKey: string;
  sections: Record<string, boolean>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  hiddenText?: string;
  labelFont?: string;
}) {
  const isOn = sections[sectionKey];
  return (
    <div className={`section-card ${!isOn ? "hidden-section" : ""}`}>
      <div className="flex items-center justify-between mb-3 pr-12">
        <span className="font-sans text-xs uppercase tracking-widest text-gold opacity-80" style={labelFont ? { fontFamily: labelFont, textTransform: "none" } : {}}>
          {label}
        </span>
        <Toggle on={isOn} onToggle={() => onToggle(sectionKey)} />
      </div>
      {isOn && <div>{children}</div>}
      {!isOn && (
        <p className="font-sans text-xs text-center opacity-40 mt-1" style={labelFont ? { fontFamily: labelFont } : {}}>
          {hiddenText ?? "Section hidden — toggle to show"}
        </p>
      )}
    </div>
  );
}

const STORAGE_KEY = "lovenote-builder-draft";

function loadDraft(): InvitationData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<InvitationData>;
      return { ...defaultData, ...parsed, fontScale: parsed.fontScale ?? 1.0, sections: { ...defaultData.sections, ...(parsed.sections ?? {}) } };
    }
  } catch {
    // ignore parse errors
  }
  return defaultData;
}

export default function Builder() {
  const [data, setData] = useState<InvitationData>(loadDraft);
  const [previewing, setPreviewing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formLang, setFormLang] = useState<Lang>("en");
  const [, navigate] = useLocation();

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [data]);

  const createMutation = trpc.invitations.create.useMutation({
    onSuccess: ({ slug }) => {
      setPublishedSlug(slug);
    },
  });

  const set = (field: keyof InvitationData, value: string | number) =>
    setData((d) => ({ ...d, [field]: value }));

  const ft = translations[formLang]; // form translations

  const toggleSection = (key: string) =>
    setData((d) => ({
      ...d,
      sections: { ...d.sections, [key]: !d.sections[key] },
    }));

  const handlePublish = () => {
    if (!data.brideFirstName || !data.groomFirstName || !data.date) {
      alert("Please fill in at least the names and date before publishing.");
      return;
    }
    createMutation.mutate({ title: data.title || "Untitled", data });
  };

  const shareUrl = publishedSlug
    ? `${window.location.origin}/invite/${publishedSlug}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Published success screen ──────────────────────────────────────────────
  if (publishedSlug) {
    return (
      <div className="builder-page flex items-center justify-center min-h-screen">
        <div className="mobile-container px-6 text-center">
          <div className="animate-fade-in-up">
            <div className="text-6xl mb-4">💌</div>
            <h2 className="font-script text-5xl gold-shimmer mb-2">
              Your Invitation is Live!
            </h2>
            <p className="font-sans text-sm opacity-60 mb-8">
              Share this link with your guests
            </p>

            <div className="section-card mb-6">
              <p className="font-sans text-xs break-all opacity-80 mb-3">
                {shareUrl}
              </p>
              <button className="btn-gold w-full" onClick={copyLink}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href={`https://wa.me/?text=${encodeURIComponent("You're invited! 💍 " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                Share on WhatsApp
              </a>
              <button
                className="btn-outline text-sm"
                onClick={() => navigate(`/invite/${publishedSlug}`)}
              >
                Preview Invitation
              </button>
            </div>

            <button
              className="mt-8 font-sans text-xs opacity-40 underline cursor-pointer bg-transparent border-none text-cream"
              onClick={() => {
                setPublishedSlug(null);
                setData(defaultData);
                try { localStorage.removeItem(STORAGE_KEY); } catch {}
              }}
            >
              Create another invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview mode ──────────────────────────────────────────────────────────
  if (previewing) {
    return <PreviewWithEnvelope data={data} onEdit={() => setPreviewing(false)} onPublish={handlePublish} isPublishing={createMutation.isPending} onFontScaleChange={(scale) => set("fontScale", scale)} initialLang={formLang} />;
  }

  // ── Builder mode ──────────────────────────────────────────────────────────
  return (
    <div className="builder-page">
      <div className="mobile-container px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold mb-1 opacity-70" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.createYour}
          </p>
          <h1 className="font-script text-5xl gold-shimmer" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, fontSize: "2.5rem" } : {}}>
            {ft.weddingInvitation}
          </h1>
          <p className="font-sans text-xs opacity-40 mt-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.builderSubtitle}
          </p>
          {/* Language toggle */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setFormLang("en")}
              style={{
                padding: "6px 20px",
                borderRadius: 20,
                border: `1px solid ${formLang === "en" ? "rgba(201,168,76,0.9)" : "rgba(201,168,76,0.3)"}`,
                background: formLang === "en" ? "rgba(201,168,76,0.15)" : "transparent",
                color: formLang === "en" ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.5)",
                fontFamily: "'Lato', sans-serif",
                fontSize: 12,
                fontWeight: formLang === "en" ? 700 : 400,
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              EN
            </button>
            <button
              onClick={() => setFormLang("ar")}
              style={{
                padding: "6px 20px",
                borderRadius: 20,
                border: `1px solid ${formLang === "ar" ? "rgba(201,168,76,0.9)" : "rgba(201,168,76,0.3)"}`,
                background: formLang === "ar" ? "rgba(201,168,76,0.15)" : "transparent",
                color: formLang === "ar" ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.5)",
                fontFamily: `'Noto Naskh Arabic', 'Amiri', serif`,
                fontSize: 14,
                fontWeight: formLang === "ar" ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              عربي
            </button>
          </div>
          {formLang === "ar" && (
            <p style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif`, fontSize: 11, color: "rgba(201,168,76,0.5)", marginTop: 6 }}>
              أدخل المحتوى بالعربية — سيظهر للضيوف عند اختيار العربية
            </p>
          )}
          <a
            href="/rsvp-dashboard"
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "6px 18px",
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: 20,
              fontFamily: formLang === "ar" ? ARABIC_FONT : "'Lato', sans-serif",
              fontSize: 11,
              color: "rgba(201,168,76,0.8)",
              letterSpacing: formLang === "ar" ? "0" : "0.1em",
              textDecoration: "none",
              textTransform: formLang === "ar" ? "none" as const : "uppercase" as const,
            }}
          >
            📊 {ft.viewRsvp}
          </a>
        </div>

        {/* ── Invitation Title ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-3" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
            {formLang === "ar" ? "عنوان الدعوة" : "Invitation Title"}
          </p>
          <input
            className="wedding-input"
            placeholder={formLang === "ar" ? "مثال: حفل زفاف سارة وأحمد" : "e.g. Sara & Ahmed's Wedding"}
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            dir={formLang === "ar" ? "rtl" : undefined}
            style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}
          />
          <p className="font-sans text-xs opacity-30 mt-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "يظهر في لوحة الاستجابات فقط" : "Shown in your Guest Responses dashboard only"}
          </p>
        </div>

        {/* ── Envelope Style Picker ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-4" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
            {ft.chooseEnvelope}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ENVELOPE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => set("envelopeStyle", style.id)}
                className="relative rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none"
                style={{
                  borderColor: data.envelopeStyle === style.id ? "var(--gold)" : "transparent",
                  boxShadow: data.envelopeStyle === style.id
                    ? "0 0 0 2px rgba(201,168,76,0.4), 0 8px 24px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(0,0,0,0.3)",
                  transform: data.envelopeStyle === style.id ? "scale(1.04)" : "scale(1)",
                }}
              >
                <img
                  src={style.img}
                  alt={style.name}
                  className="w-full h-28 object-cover block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="font-sans text-xs text-cream opacity-90">{style.name}</span>
                </div>
                {data.envelopeStyle === style.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                    <span className="text-dark text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Section: Names ── */}
        <SectionCard
          label={ft.sectionNames}
          sectionKey="names"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          {formLang === "en" ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Groom's First Name</label>
                  <input className="wedding-input" placeholder="Groom's first name" value={data.groomFirstName} onChange={(e) => set("groomFirstName", e.target.value)} />
                </div>
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Groom's Last Name</label>
                  <input className="wedding-input" placeholder="Optional" value={data.groomLastName} onChange={(e) => set("groomLastName", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Bride's First Name</label>
                  <input className="wedding-input" placeholder="Bride's first name" value={data.brideFirstName} onChange={(e) => set("brideFirstName", e.target.value)} />
                </div>
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Bride's Last Name</label>
                  <input className="wedding-input" placeholder="Optional" value={data.brideLastName} onChange={(e) => set("brideLastName", e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>اسم العريس الأول</label>
                  <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="اسم العريس" value={data.arGroomFirstName ?? ""} onChange={(e) => set("arGroomFirstName", e.target.value)} />
                </div>
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>اسم العائلة (اختياري)</label>
                  <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="اختياري" value={data.arGroomLastName ?? ""} onChange={(e) => set("arGroomLastName", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>اسم العروس الأول</label>
                  <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="اسم العروس" value={data.arBrideFirstName ?? ""} onChange={(e) => set("arBrideFirstName", e.target.value)} />
                </div>
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>اسم العائلة (اختياري)</label>
                  <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="اختياري" value={data.arBrideLastName ?? ""} onChange={(e) => set("arBrideLastName", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Section: Date ── */}
        <SectionCard
          label={ft.sectionDate}
          sectionKey="date"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <label className="font-sans text-xs opacity-50 block mb-1" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.date}
          </label>
          <input
            className="wedding-input"
            type="date"
            value={data.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </SectionCard>

        {/* ── Section: Time ── */}
        <SectionCard
          label={ft.sectionTime}
          sectionKey="time"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <label className="font-sans text-xs opacity-50 block mb-1" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.time}
          </label>
          <input
            className="wedding-input"
            type="time"
            value={data.time}
            onChange={(e) => set("time", e.target.value)}
          />
        </SectionCard>

        {/* ── Section: Venue ── */}
        <SectionCard
          label={ft.sectionVenue}
          sectionKey="venue"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          {formLang === "en" ? (
            <VenueLocationInput data={data} set={set} />
          ) : (
            <div dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} className="space-y-3">
              <div>
                <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>اسم المكان</label>
                <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="مثال: قاعة الأفراح الكبرى" value={data.arVenueName ?? ""} onChange={(e) => set("arVenueName", e.target.value)} />
              </div>
              <div>
                <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>العنوان</label>
                <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="مثال: شارع الورد، أبوظبي" value={data.arVenueAddress ?? ""} onChange={(e) => set("arVenueAddress", e.target.value)} />
              </div>
              <p className="font-sans text-xs opacity-30 mt-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>رابط الخريطة يُحدد في تبويب اللغة الإنجليزية</p>
            </div>
          )}
        </SectionCard>

        {/* ── Section: Message ── */}
        <SectionCard
          label={ft.sectionMessage}
          sectionKey="message"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          {formLang === "en" ? (
            <>
              <label className="font-sans text-xs opacity-50 block mb-1">Message to Guests</label>
              <textarea className="wedding-input" rows={3} placeholder="e.g. We joyfully invite you to share in our happiness as we begin our new journey together…" value={data.message} onChange={(e) => set("message", e.target.value)} />
            </>
          ) : (
            <div dir="rtl">
              <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>رسالة إلى الضيوف</label>
              <textarea className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} rows={3} placeholder="مثال: يسعدنا دعوتكم لمشاركتنا فرحة زفافنا…" value={data.arMessage ?? ""} onChange={(e) => set("arMessage", e.target.value)} />
            </div>
          )}
        </SectionCard>

        {/* ── Section: Map ── */}
        <SectionCard
          label={ft.sectionMap}
          sectionKey="map"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <p className="font-sans text-xs opacity-50" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "ستظهر خريطة Google تفاعلية لمكان الحفل في الدعوة." : "An interactive Google Map of your venue will appear in the invitation."}
          </p>
        </SectionCard>

        {/* ── Section: Countdown ── */}
        <SectionCard
          label={ft.sectionCountdown}
          sectionKey="countdown"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <p className="font-sans text-xs opacity-50" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "سيظهر عداد تنازلي حتى يوم زفافكم في الدعوة." : "A live countdown to your wedding day will appear in the invitation."}
          </p>
        </SectionCard>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 mt-6 pb-8">
          <button
            className="btn-gold w-full"
            onClick={() => setPreviewing(true)}
            style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}
          >
            {formLang === "ar" ? "معاينة الدعوة ←" : "Preview Invitation →"}
          </button>
          <button
            className="btn-outline w-full"
            onClick={handlePublish}
            disabled={createMutation.isPending}
            style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}
          >
            {createMutation.isPending
              ? (formLang === "ar" ? "جارٍ النشر…" : "Publishing…")
              : (formLang === "ar" ? "تخطي المعاينة والنشر" : "Skip Preview & Publish")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview With Envelope (full guest experience in preview mode) ────────────
function PreviewWithEnvelope({
  data,
  onEdit,
  onPublish,
  isPublishing,
  onFontScaleChange,
  initialLang = "en",
}: {
  data: InvitationData;
  onEdit: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  onFontScaleChange: (scale: number) => void;
  initialLang?: Lang;
}) {
  const [animStage, setAnimStage] = useState<"idle" | "opening" | "expand" | "done">("idle");
  const [showInvitation, setShowInvitation] = useState(false);
  const [lang, setLang] = useState<Lang>(initialLang);
  const toggleLang = () => setLang((l) => l === "en" ? "ar" : "en");
  const sceneRef = useRef<HTMLDivElement>(null);

  const brideName = [data.brideFirstName, data.brideLastName].filter(Boolean).join(" ");
  const groomName = [data.groomFirstName, data.groomLastName].filter(Boolean).join(" ");
  const envStyle = ENVELOPE_STYLES.find((s) => s.id === (data.envelopeStyle ?? "ivory-gold")) ?? ENVELOPE_STYLES[0];
  const isOpen = animStage === "opening" || animStage === "expand" || animStage === "done";
  const isExpanding = animStage === "expand" || animStage === "done";

  // Calculate split point based on actual rendered image size
  const updateSplitPoint = useCallback(() => {
    const img = sceneRef.current?.querySelector<HTMLImageElement>(".fs-half-top .fs-half-img");
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const renderedH = img.getBoundingClientRect().height;
    const vpH = window.innerHeight;
    const imgTop = Math.max(0, (vpH - renderedH) / 2);
    const splitY = imgTop + renderedH / 2;
    // Set on scene (for halves) and on document root (for fixed wax seal)
    sceneRef.current?.style.setProperty("--img-top", `${imgTop}px`);
    sceneRef.current?.style.setProperty("--split-y", `${splitY}px`);
    document.documentElement.style.setProperty("--split-y", `${splitY}px`);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateSplitPoint);
    return () => window.removeEventListener("resize", updateSplitPoint);
  }, [updateSplitPoint]);

  const handleOpenEnvelope = () => {
    if (animStage !== "idle") return;
    // Stage 1: both halves slide apart (2000ms)
    setAnimStage("opening");
    setTimeout(() => {
      // Stage 2: cream overlay fades in (500ms)
      setAnimStage("expand");
      setTimeout(() => {
        setAnimStage("done");
        setShowInvitation(true);
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }, 500);
    }, 2000);
  };

  const resetEnvelope = () => {
    setAnimStage("idle");
    setShowInvitation(false);
  };

  return (
    <div className="builder-page" style={{ position: "relative" }}>
      {/* Floating banner — compact mobile-first bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(10,8,24,0.88)", borderBottom: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {/* Font size slider — only shown when invitation content is visible */}
          {showInvitation ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, letterSpacing: "0.12em", color: "rgba(201,168,76,0.7)", textTransform: "uppercase", whiteSpace: "nowrap" }}>A</span>
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={data.fontScale}
                onChange={(e) => onFontScaleChange(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "#c9a84c", cursor: "pointer", height: 3 }}
                title={`Font size: ${Math.round(data.fontScale * 100)}%`}
              />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, letterSpacing: "0.12em", color: "rgba(201,168,76,0.7)", textTransform: "uppercase", whiteSpace: "nowrap" }}>A</span>
            </div>
          ) : (
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, letterSpacing: "0.15em", color: "rgba(201,168,76,0.8)", textTransform: "uppercase" }}>Preview</span>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            {showInvitation && (
              <button
                onClick={resetEnvelope}
                style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, letterSpacing: "0.1em", padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.5)", background: "transparent", color: "rgba(201,168,76,0.9)", cursor: "pointer", textTransform: "uppercase" }}
              >
                💌 Envelope
              </button>
            )}
            <button
              onClick={onEdit}
              style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, letterSpacing: "0.1em", padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.5)", background: "transparent", color: "rgba(201,168,76,0.9)", cursor: "pointer", textTransform: "uppercase" }}
            >
              ← Edit
            </button>
            <button
              onClick={onPublish}
              disabled={isPublishing}
              style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, letterSpacing: "0.1em", padding: "5px 12px", borderRadius: 20, background: "linear-gradient(135deg, #c9a84c, #e8d48b)", color: "#1a1a2e", border: "none", cursor: "pointer", fontWeight: 700, textTransform: "uppercase" }}
            >
              {isPublishing ? "⏳" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* Envelope scene — OUTSIDE mobile-container so it fills the full screen */}
      {!showInvitation && (
        <div ref={sceneRef} className="envelope-scene" onClick={handleOpenEnvelope} style={{ background: envStyle.theme.sceneBg }}>

          {/* Top half — shows top portion of envelope photo, slides UP */}
          <div className={`fs-half fs-half-top ${isOpen ? "open" : ""}`}>
            <img
              src={envStyle.img}
              alt=""
              className="fs-half-img"
              draggable={false}
              onLoad={updateSplitPoint}
            />
          </div>

          {/* Bottom half — shows bottom portion of envelope photo, slides DOWN */}
          <div className={`fs-half fs-half-bottom ${isOpen ? "open" : ""}`}>
            <img src={envStyle.img} alt="" className="fs-half-img" draggable={false} />
          </div>

          {/* Wax seal — centered at the split line */}
          <div
            className={`fs-wax-seal ${isOpen ? "open" : ""}`}
            style={{
              background: `radial-gradient(circle at 35% 35%, ${envStyle.sealColor}ee, ${envStyle.sealColor}88)`,
            }}
          >
            <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 24, color: "rgba(255,255,255,0.92)", lineHeight: 1 }}>
              {(groomName[0] || "S")}&amp;{(brideName[0] || "H")}
            </span>
          </div>

          {/* Expand overlay — fades to theme background before invitation appears */}
          <div
            className="fs-expand-overlay"
            style={{ opacity: isExpanding ? 1 : 0, transition: "opacity 0.5s ease", background: envStyle.theme.bg }}
          />

          {/* Tap hint */}
          {animStage === "idle" && (
            <div className="fs-tap-hint">
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: `${envStyle.theme.accent}BB`, textTransform: "uppercase" }}>
                Tap to open
              </p>
              <span style={{ color: `${envStyle.theme.accent}88`, fontSize: 18 }}>↑</span>
            </div>
          )}
        </div>
      )}

      {/* Invitation content after envelope opens */}
      {showInvitation && (
        <div className="mobile-container" style={{ "--font-scale": data.fontScale } as React.CSSProperties}>
          <PreviewContent data={data} lang={lang} onToggleLang={toggleLang} />
        </div>
      )}

    </div>
  );
}

// ── Floating petals (shared) ───────────────────────────────────────────────────────────────────
function FloatingPetals() {
  const petals = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${10 + i * 11}%`,
    delay: `${i * 0.7}s`,
    duration: `${4 + (i % 3)}s`,
    size: 6 + (i % 4) * 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            borderRadius: "50% 0 50% 0",
            background: "rgba(201,168,76,0.15)",
            animation: `float ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── Preview Content (shared between preview mode and invitation page) ─────────
function PreviewContent({ data, lang = "en", onToggleLang }: { data: InvitationData; lang?: Lang; onToggleLang?: () => void }) {
  const t = translations[lang];
  const isRtl = lang === "ar";
  const bodyFont = isRtl ? ARABIC_FONT : undefined;

  // Use Arabic content when lang=ar, fall back to English if Arabic not filled in
  const brideName = isRtl
    ? ([data.arBrideFirstName, data.arBrideLastName].filter(Boolean).join(" ") || [data.brideFirstName, data.brideLastName].filter(Boolean).join(" "))
    : [data.brideFirstName, data.brideLastName].filter(Boolean).join(" ");
  const groomName = isRtl
    ? ([data.arGroomFirstName, data.arGroomLastName].filter(Boolean).join(" ") || [data.groomFirstName, data.groomLastName].filter(Boolean).join(" "))
    : [data.groomFirstName, data.groomLastName].filter(Boolean).join(" ");
  const displayVenueName = isRtl ? (data.arVenueName || data.venueName) : data.venueName;
  const displayVenueAddress = isRtl ? (data.arVenueAddress || data.venueAddress) : data.venueAddress;
  const displayMessage = isRtl ? (data.arMessage || data.message) : data.message;

  const weddingDate = data.date ? new Date(data.date) : null;
  const formattedDate = weddingDate
    ? weddingDate.toLocaleDateString(isRtl ? "ar-AE" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const formattedTime = data.time
    ? new Date(`2000-01-01T${data.time}`).toLocaleTimeString(isRtl ? "ar-AE" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  // Use server-side resolver for accurate map embed (handles short URLs)
  const { data: resolvedMap } = trpc.invitations.resolveMapUrl.useQuery(
    { url: data.venueMapQuery },
    { enabled: !!data.venueMapQuery.trim() }
  );
  const mapSrc = resolvedMap?.embedUrl ?? extractGoogleMapsEmbedUrl(data.venueMapQuery);
  const mapsDirectionsUrl = resolvedMap?.directionsUrl ?? (
    data.venueMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery)}` : ""
  );

  const envStyle = ENVELOPE_STYLES.find((s) => s.id === data.envelopeStyle) ?? ENVELOPE_STYLES[0];
  const theme = envStyle.theme;

  return (
    <div
      className="invitation-page"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        background: theme.bg,
        "--gold": theme.accent,
        "--gold-light": theme.accentLight,
        "--gold-dark": theme.accentDark,
        "--cream": theme.text,
        "--bg-secondary": theme.bgSecondary,
        "--text-primary": theme.text,
        "--accent-secondary": theme.accentSecondary,
        "--btn-text": theme.buttonText,
        color: theme.text,
        fontFamily: bodyFont,
      } as React.CSSProperties}
    >
      {/* Hero / Names */}
      {data.sections.names && (
        <div className="invitation-section pt-16 pb-8 stagger">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-70 animate-fade-in-up" style={{ fontFamily: bodyFont }}>
            {t.togetherWith}
          </p>
          <div className="my-6 animate-fade-in-up">
            <h1 className="font-script text-6xl gold-shimmer leading-tight">
              {groomName || "Groom"}
            </h1>
            <p className="font-serif text-2xl italic text-gold opacity-60 my-2">
              &amp;
            </p>
            <h1 className="font-script text-6xl gold-shimmer leading-tight">
              {brideName || "Bride"}
            </h1>
          </div>
          <div className="divider-ornament">
            <span className="text-gold text-lg">✦</span>
          </div>
          <p className="font-serif italic text-lg opacity-60 mt-4 animate-fade-in-up" style={{ fontFamily: bodyFont }}>
            {t.requestPleasure}
          </p>
        </div>
      )}

      {/* Date */}
      {data.sections.date && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont }}>
            {t.dateLabel}
          </p>
          <p className="font-serif text-2xl text-cream">
            {formattedDate || "Sunday, 24 May 2026"}
          </p>
        </div>
      )}

      {/* Time */}
      {data.sections.time && (
        <div className="invitation-section py-4">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont }}>
            {t.dateLabel}
          </p>
          <p className="font-serif text-2xl text-cream">
            {formattedTime || "9:00 PM"}
          </p>
        </div>
      )}

      {/* Venue */}
      {data.sections.venue && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont }}>
            {t.venueLabel}
          </p>
          <p className="font-serif text-2xl text-cream" style={{ fontFamily: bodyFont }}>
            {displayVenueName || "Al Rekab Restaurant"}
          </p>
          <p className="font-sans text-sm opacity-50 mt-1" style={{ fontFamily: bodyFont }}>
            {displayVenueAddress || "Al Ain, Abu Dhabi, UAE"}
          </p>
        </div>
      )}

      {/* Message */}
      {data.sections.message && displayMessage && (
        <div className="invitation-section py-6 px-8">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">✦</span>
          </div>
          <p className="font-serif italic text-lg opacity-80 leading-relaxed" style={{ fontFamily: bodyFont }}>
            "{displayMessage}"
          </p>
        </div>
      )}

      {/* Countdown */}
      {data.sections.countdown && data.date && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <CountdownTimer targetDate={data.date} label={t.countdownLabel} bodyFont={bodyFont} />
        </div>
      )}

      {/* Map */}
      {data.sections.map && mapSrc && (
        <div className="invitation-section py-6 px-4">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-4" style={{ fontFamily: bodyFont }}>
            {t.findUs}
          </p>
          <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${theme.accent}44`, boxShadow: `0 8px 32px rgba(0,0,0,0.3)` }}>
            <iframe
              src={mapSrc}
              width="100%"
              height="280"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Venue Map"
            />
          </div>
          {mapsDirectionsUrl && (
            <a
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 16,
                padding: "12px 28px",
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                color: theme.buttonText,
                borderRadius: 50,
                fontFamily: "'Lato', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "none",
                textAlign: "center",
                boxShadow: `0 4px 16px ${theme.accent}44`,
                textTransform: "uppercase",
              }}
            >
              {t.getDirections}
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="invitation-section py-10">
        <div className="divider-ornament mb-6">
          <span className="text-gold text-lg">✦</span>
        </div>
        <p className="font-script text-3xl gold-shimmer">
          {[data.groomFirstName, "&", data.brideFirstName]
            .filter(Boolean)
            .join(" ") || "Groom & Bride"}
        </p>
        <p className="font-sans text-xs opacity-30 mt-4 tracking-widest uppercase" style={{ fontFamily: bodyFont }}>
          {t.withLove}
        </p>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate, label = "Counting Down", bodyFont }: { targetDate: string; label?: string; bodyFont?: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useState(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  });

  if (!timeLeft) return null;

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-4" style={{ fontFamily: bodyFont }}>
        {label}
      </p>
      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div
              className="font-serif text-4xl font-light w-16 h-16 flex items-center justify-center rounded-lg"
              style={{ color: "var(--gold)", border: "1px solid var(--gold-dark)", background: "var(--bg-secondary, transparent)" }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <p className="font-sans text-xs opacity-40 mt-1 uppercase tracking-wider">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
