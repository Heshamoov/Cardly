import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { translations, ARABIC_FONT, type Lang } from "@/lib/i18n";

const ENVELOPE_STYLES: Record<string, {
  img: string; sealColor: string; name: string;
  theme: {
    bg: string; bgSecondary: string; text: string;
    accent: string; accentLight: string; accentDark: string;
    accentSecondary: string; buttonText: string; sceneBg: string;
  }
}> = {
  "ivory-gold": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
    sealColor: "#7A1F2B",
    name: "Classic Ivory",
    theme: {
      bg: "#F8F4EC", bgSecondary: "#EFE7DA", text: "#3A3128",
      accent: "#C8A96B", accentLight: "#DFC28A", accentDark: "#A8893B",
      accentSecondary: "#7A1F2B", buttonText: "#F8F4EC",
      sceneBg: "linear-gradient(180deg, #EFE7DA 0%, #F8F4EC 100%)",
    },
  },
  "navy-gold": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
    sealColor: "#D4AF37",
    name: "Royal Navy",
    theme: {
      bg: "#0F172A", bgSecondary: "#1E293B", text: "#E5C07B",
      accent: "#D4AF37", accentLight: "#F5E6B3", accentDark: "#A88A1A",
      accentSecondary: "#F5E6B3", buttonText: "#0F172A",
      sceneBg: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
    },
  },
  "blush-rose": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
    sealColor: "#C98C7A",
    name: "Floral Blush",
    theme: {
      bg: "#F7E7E3", bgSecondary: "#EFD6D1", text: "#6E4F4B",
      accent: "#C98C7A", accentLight: "#D8A7A0", accentDark: "#A06858",
      accentSecondary: "#D8A7A0", buttonText: "#F7E7E3",
      sceneBg: "linear-gradient(180deg, #EFD6D1 0%, #F7E7E3 100%)",
    },
  },
  "black-emerald": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
    sealColor: "#1F5C4A",
    name: "Midnight Black",
    theme: {
      bg: "#0B0B0B", bgSecondary: "#1A1A1A", text: "#D4AF37",
      accent: "#B68D40", accentLight: "#D4AF37", accentDark: "#8A6A20",
      accentSecondary: "#1F5C4A", buttonText: "#0B0B0B",
      sceneBg: "linear-gradient(180deg, #0B0B0B 0%, #1A1A1A 100%)",
    },
  },
};

interface InvitationData {
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
  envelopeStyle?: string;
}

type AnimStage = "idle" | "opening" | "expand" | "done";
type Theme = typeof ENVELOPE_STYLES["navy-gold"]["theme"];

export default function InvitationView() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "";
  const { data: invitation, isLoading, error } = trpc.invitations.get.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const [animStage, setAnimStage] = useState<AnimStage>("idle");
  const [showInvitation, setShowInvitation] = useState(false);
  const invitationRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Language toggle — persisted per slug
  const LANG_KEY = `invite_lang_${slug}`;
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as Lang) || "en"; } catch { return "en"; }
  });
  const toggleLang = () => {
    const next: Lang = lang === "en" ? "ar" : "en";
    setLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch {}
  };

  const updateSplitPoint = useCallback(() => {
    const img = sceneRef.current?.querySelector<HTMLImageElement>(".fs-half-top .fs-half-img");
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const renderedH = img.getBoundingClientRect().height;
    const vpH = window.innerHeight;
    const imgTop = Math.max(0, (vpH - renderedH) / 2);
    const splitY = imgTop + renderedH / 2;
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
    setAnimStage("opening");
    setTimeout(() => {
      setAnimStage("expand");
      setTimeout(() => {
        setAnimStage("done");
        setShowInvitation(true);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          if (invitationRef.current) invitationRef.current.scrollTop = 0;
        });
      }, 500);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="envelope-scene" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center">
          <div className="font-script text-4xl gold-shimmer mb-4" style={{ color: "#c9a84c" }}>Loading…</div>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "#c9a84c", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  if (!invitation || error) {
    return (
      <div className="envelope-scene" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center px-8">
          <div className="font-script text-5xl gold-shimmer mb-4" style={{ color: "#c9a84c" }}>Oops…</div>
          <p className="font-sans text-sm" style={{ color: "#9a7a2e", opacity: 0.7 }}>
            This invitation could not be found. Please check the link.
          </p>
        </div>
      </div>
    );
  }

  const invData = invitation.data as InvitationData;
  const brideName = [invData.brideFirstName, invData.brideLastName].filter(Boolean).join(" ");
  const groomName = [invData.groomFirstName, invData.groomLastName].filter(Boolean).join(" ");
  const envStyle = ENVELOPE_STYLES[invData.envelopeStyle ?? "ivory-gold"] ?? ENVELOPE_STYLES["ivory-gold"];

  const isOpen = animStage === "opening" || animStage === "expand" || animStage === "done";
  const isExpanding = animStage === "expand" || animStage === "done";

  if (showInvitation) {
    return (
      <div ref={invitationRef}>
        <InvitationPage data={invData} slug={slug} lang={lang} onToggleLang={toggleLang} />
      </div>
    );
  }

  return (
    <div ref={sceneRef} className="envelope-scene" onClick={handleOpenEnvelope} style={{ background: envStyle.theme.sceneBg }}>
      {/* Top half */}
      <div className={`fs-half fs-half-top ${isOpen ? "open" : ""}`}>
        <img
          src={envStyle.img}
          alt="Wedding envelope"
          className="fs-half-img"
          onLoad={updateSplitPoint}
        />
      </div>

      {/* Bottom half */}
      <div className={`fs-half fs-half-bottom ${isOpen ? "open" : ""}`}>
        <img
          src={envStyle.img}
          alt=""
          className="fs-half-img"
          aria-hidden="true"
        />
      </div>

      {/* Wax seal */}
      <div className="fs-wax-seal" style={{ opacity: isOpen ? 0 : 1, transition: "opacity 0.4s ease" }}>
        <span style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: "clamp(1.2rem, 5vw, 1.8rem)",
          color: envStyle.sealColor,
          letterSpacing: "-1px",
          border: `2px solid ${envStyle.sealColor}55`,
        }}>
          {(brideName[0] || "H")}&{(groomName[0] || "S")}
        </span>
      </div>

      {/* Expand overlay */}
      <div
        className="fs-expand-overlay"
        style={{ opacity: isExpanding ? 1 : 0, background: envStyle.theme.bg }}
      />

      {/* Tap hint */}
      {animStage === "idle" && (
        <div className="fs-tap-hint">
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: `${envStyle.theme.accent}BB`, textTransform: "uppercase" }}>
            {lang === "ar" ? "اضغط للفتح" : "Tap to open"}
          </p>
          <span style={{ color: `${envStyle.theme.accent}88`, fontSize: 18, animation: "bounce 1s infinite" }}>↑</span>
        </div>
      )}
    </div>
  );
}

// ── Language Toggle Button ────────────────────────────────────────────────────
function LangToggle({ lang, onToggle, theme }: { lang: Lang; onToggle: () => void; theme: Theme }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 200,
        padding: "5px 14px",
        background: `${theme.bgSecondary}ee`,
        border: `1px solid ${theme.accent}66`,
        borderRadius: 20,
        fontFamily: lang === "ar" ? ARABIC_FONT : "'Lato', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        color: theme.accent,
        cursor: "pointer",
        letterSpacing: "0.05em",
        backdropFilter: "blur(8px)",
        transition: "all 0.2s",
      }}
    >
      {lang === "en" ? "عربي" : "English"}
    </button>
  );
}

// ── Full Invitation Page ──────────────────────────────────────────────────────
function InvitationPage({ data, slug, lang, onToggleLang }: {
  data: InvitationData; slug: string; lang: Lang; onToggleLang: () => void;
}) {
  const isRtl = lang === "ar";
  const brideName = isRtl
    ? ([(data as any).arBrideFirstName, (data as any).arBrideLastName].filter(Boolean).join(" ") || [data.brideFirstName, data.brideLastName].filter(Boolean).join(" "))
    : [data.brideFirstName, data.brideLastName].filter(Boolean).join(" ");
  const groomName = isRtl
    ? ([(data as any).arGroomFirstName, (data as any).arGroomLastName].filter(Boolean).join(" ") || [data.groomFirstName, data.groomLastName].filter(Boolean).join(" "))
    : [data.groomFirstName, data.groomLastName].filter(Boolean).join(" ");
  const displayVenueName = isRtl ? ((data as any).arVenueName || data.venueName) : data.venueName;
  const displayVenueAddress = isRtl ? ((data as any).arVenueAddress || data.venueAddress) : data.venueAddress;
  const displayMessage = isRtl ? ((data as any).arMessage || data.message) : data.message;
  const envStyle = ENVELOPE_STYLES[(data as { envelopeStyle?: string }).envelopeStyle ?? "ivory-gold"] ?? ENVELOPE_STYLES["ivory-gold"];
  const t = translations[lang];
  const bodyFont = isRtl ? ARABIC_FONT : undefined;

  const weddingDate = data.date ? new Date(data.date) : null;
  const formattedDate = weddingDate
    ? weddingDate.toLocaleDateString(isRtl ? "ar-AE" : "en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  const formattedTime = data.time
    ? new Date(`2000-01-01T${data.time}`).toLocaleTimeString(isRtl ? "ar-AE" : "en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    : "";

  const { data: resolvedMap } = trpc.invitations.resolveMapUrl.useQuery(
    { url: data.venueMapQuery },
    { enabled: !!data.venueMapQuery?.trim() }
  );
  const mapSrc = resolvedMap?.embedUrl ?? (
    data.venueMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery)}&output=embed` : ""
  );
  const directionsUrl = resolvedMap?.directionsUrl ?? (
    data.venueMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery)}` : ""
  );

  const fontScale = (data as { fontScale?: number }).fontScale ?? 1.0;
  const theme = envStyle.theme;

  return (
    <div
      className="invitation-page"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        background: theme.bg,
        "--font-scale": fontScale,
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
      {/* Language Toggle */}
      <LangToggle lang={lang} onToggle={onToggleLang} theme={theme} />

      <div className="mobile-container">

        {/* Hero — Names */}
        {data.sections?.names !== false && (
          <div className="invitation-section pt-16 pb-8 stagger">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>

            <p className="invite-label text-gold opacity-60 animate-fade-in-up" style={{ fontFamily: bodyFont }}>
              {t.togetherWith}
            </p>

            <div className="my-8 animate-fade-in-up">
              <h1 className="font-script gold-shimmer leading-tight" style={{ fontSize: "clamp(3rem, 14vw, 5rem)" }}>
                {brideName || "Bride"}
              </h1>
              <p className="font-fell text-3xl text-gold opacity-50 my-3" style={{ fontStyle: "italic" }}>
                &amp;
              </p>
              <h1 className="font-script gold-shimmer leading-tight" style={{ fontSize: "clamp(3rem, 14vw, 5rem)" }}>
                {groomName || "Groom"}
              </h1>
            </div>

            <div className="divider-ornament">
              <span className="text-gold text-xl">✦</span>
            </div>

            <p className="invite-detail opacity-60 mt-5 animate-fade-in-up" style={{ fontFamily: bodyFont }}>
              {t.requestPleasure}
            </p>
          </div>
        )}

        {/* Date */}
        {data.sections?.date !== false && formattedDate && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3" style={{ fontFamily: bodyFont }}>{t.dateLabel}</p>
            <p className="invite-heading text-cream text-2xl leading-relaxed" style={{ fontFamily: bodyFont }}>{formattedDate}</p>
            {formattedTime && (
              <p className="invite-heading text-cream text-xl mt-2 opacity-80" style={{ fontFamily: bodyFont }}>{formattedTime}</p>
            )}
          </div>
        )}

        {/* Venue */}
        {data.sections?.venue !== false && displayVenueName && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3" style={{ fontFamily: bodyFont }}>{t.venueLabel}</p>
            <p className="invite-heading text-cream text-2xl" style={{ fontFamily: bodyFont }}>{displayVenueName}</p>
            {displayVenueAddress && (
              <p className="invite-detail opacity-40 mt-2" style={{ fontFamily: bodyFont }}>{displayVenueAddress}</p>
            )}
          </div>
        )}

        {/* Personal Message */}
        {data.sections?.message !== false && displayMessage && (
          <div className="invitation-section py-8 px-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">✦</span>
            </div>
            <p className="invite-detail text-xl opacity-75 leading-relaxed" style={{ fontFamily: bodyFont }}>
              "{displayMessage}"
            </p>
          </div>
        )}

        {/* Countdown */}
        {data.sections?.countdown !== false && data.date && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <CountdownTimer targetDate={data.date} label={t.countdownLabel} bodyFont={bodyFont} />
          </div>
        )}

        {/* Map */}
        {data.sections?.map !== false && mapSrc && (
          <div className="invitation-section py-8 px-4">
            <div className="divider-ornament mb-5">
              <span className="text-gold">📍</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-4" style={{ fontFamily: bodyFont }}>{t.findUs}</p>
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${theme.accent}44`, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              <iframe
                src={mapSrc}
                width="100%"
                height="260"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Wedding Venue Map"
              />
            </div>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                  padding: "12px 28px",
                  background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                  color: theme.buttonText,
                  borderRadius: 50,
                  fontFamily: bodyFont ?? "'Lato', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  boxShadow: `0 4px 16px ${theme.accent}44`,
                  textTransform: "uppercase",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {t.getDirections}
              </a>
            )}
          </div>
        )}

        {/* RSVP Section */}
        <RsvpSection slug={slug} theme={theme} t={t} isRtl={isRtl} bodyFont={bodyFont} />

        {/* Footer */}
        <div className="invitation-section py-12">
          <div className="divider-ornament mb-6">
            <span className="text-gold text-xl">✶</span>
          </div>
          <p className="font-script gold-shimmer" style={{ fontSize: "clamp(2rem, 10vw, 3rem)" }}>
            {[data.brideFirstName, "&", data.groomFirstName].filter(Boolean).join(" ")}
          </p>
          <p className="invite-label opacity-30 mt-4" style={{ fontFamily: bodyFont }}>
            {t.withLove}
          </p>
        </div>

      </div>
    </div>
  );
}

// ── RSVP Section ─────────────────────────────────────────────────────────────
function RsvpSection({
  slug, theme, t, isRtl, bodyFont,
}: {
  slug: string;
  theme: Theme;
  t: (typeof translations)["en"] | (typeof translations)["ar"];
  isRtl: boolean;
  bodyFont?: string;
}) {
  const STORAGE_KEY = `rsvp_submitted_${slug}`;
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitMutation = trpc.rsvp.submit.useMutation({
    onSuccess: () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setSubmitted(true);
    },
    onError: (err) => setError(err.message || t.somethingWrong),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError(t.nameRequired); return; }
    if (partySize < 1 || partySize > 50) { setError(t.partySizeError); return; }
    submitMutation.mutate({ slug, guestName: name.trim(), partySize, message: message.trim() || undefined });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: `${theme.bgSecondary}cc`,
    border: `1px solid ${theme.accent}55`,
    borderRadius: 8,
    padding: "10px 14px",
    color: theme.text,
    fontFamily: bodyFont ?? "'Lato', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box" as const,
    direction: isRtl ? "rtl" : "ltr",
    textAlign: isRtl ? "right" : "left",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: bodyFont ?? "'Lato', sans-serif",
    fontSize: 11,
    letterSpacing: isRtl ? 0 : "0.1em",
    textTransform: isRtl ? "none" : "uppercase" as const,
    color: theme.text,
    opacity: 0.6,
    marginBottom: 6,
  };

  return (
    <div className="invitation-section" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div className="divider-ornament mb-6">
        <span style={{ color: theme.accent, fontSize: 20 }}>✉</span>
      </div>
      <p
        className="font-sans uppercase tracking-widest mb-6"
        style={{ fontSize: 11, color: theme.accent, opacity: 0.7, fontFamily: bodyFont }}
      >
        {t.rsvpLabel}
      </p>

      {submitted ? (
        <div
          style={{
            background: `${theme.bgSecondary}cc`,
            border: `1px solid ${theme.accent}44`,
            borderRadius: 12,
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
          <p className="font-script" style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", color: theme.accent }}>
            {t.thankYou}
          </p>
          <p className="font-sans mt-2" style={{ fontSize: 13, color: theme.text, opacity: 0.7, fontFamily: bodyFont }}>
            {t.rsvpReceived}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ textAlign: isRtl ? "right" : "left", maxWidth: 360, margin: "0 auto" }}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t.yourName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              style={inputStyle}
              maxLength={128}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{t.numberOfGuests}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: isRtl ? "flex-end" : "flex-start" }}>
              <button
                type="button"
                onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `${theme.bgSecondary}cc`,
                  border: `1px solid ${theme.accent}55`,
                  color: theme.accent, fontSize: 20, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: theme.accent, minWidth: 32, textAlign: "center" }}>
                {partySize}
              </span>
              <button
                type="button"
                onClick={() => setPartySize((p) => Math.min(50, p + 1))}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `${theme.bgSecondary}cc`,
                  border: `1px solid ${theme.accent}55`,
                  color: theme.accent, fontSize: 20, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t.messageOptional}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              maxLength={500}
            />
          </div>

          {error && (
            <p style={{ color: theme.accentSecondary, fontSize: 13, marginBottom: 12, fontFamily: bodyFont ?? "'Lato', sans-serif" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            style={{
              width: "100%",
              padding: "13px 28px",
              background: submitMutation.isPending
                ? `${theme.accentDark}88`
                : `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
              color: theme.buttonText,
              border: "none",
              borderRadius: 50,
              fontFamily: bodyFont ?? "'Lato', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: isRtl ? 0 : "0.1em",
              textTransform: isRtl ? "none" : "uppercase" as const,
              cursor: submitMutation.isPending ? "not-allowed" : "pointer",
              boxShadow: `0 4px 16px ${theme.accent}44`,
              transition: "opacity 0.2s",
            }}
          >
            {submitMutation.isPending ? t.sending : t.confirmAttendance}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimer({ targetDate, label, bodyFont }: { targetDate: string; label: string; bodyFont?: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  function calcTimeLeft(date: string) {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div>
      <p className="invite-label text-gold opacity-50 mb-6" style={{ fontFamily: bodyFont }}>{label}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
          <div key={unit} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 8vw, 3rem)",
              color: "var(--gold)",
              fontWeight: 300,
              lineHeight: 1,
              minWidth: 56,
              border: "1px solid var(--gold-dark)",
              borderRadius: 8,
              padding: "8px 4px",
              background: "var(--bg-secondary, transparent)",
            }}>
              {String(timeLeft[unit]).padStart(2, "0")}
            </div>
            <div style={{
              fontFamily: bodyFont ?? "'Lato', sans-serif",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "var(--gold)",
              opacity: 0.5,
              textTransform: "uppercase",
              marginTop: 6,
            }}>
              {unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Floating Petals ───────────────────────────────────────────────────────────
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
            borderRadius: "50% 0",
            background: "rgba(201,168,76,0.3)",
            animation: `fall ${p.duration} ${p.delay} linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
