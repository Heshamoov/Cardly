import { useState, useRef, useEffect, useCallback } from "react";
import FallingParticles from "@/components/FallingParticles";
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
  "navy-floral": {
    img: "/manus-storage/envelope-navy-floral_269d799e.png",
    sealColor: "#D4AF37",
    name: "Navy Floral",
    theme: {
      bg: "#0D1B2A", bgSecondary: "#162236", text: "#F5E6B3",
      accent: "#D4AF37", accentLight: "#F5E6B3", accentDark: "#A88A1A",
      accentSecondary: "#F5E6B3", buttonText: "#0D1B2A",
      sceneBg: "linear-gradient(180deg, #0D1B2A 0%, #162236 100%)",
    },
  },
  "white-floral": {
    img: "/manus-storage/envelope-white-floral_2b139886.png",
    sealColor: "#C8A040",
    name: "White Floral",
    theme: {
      bg: "#FDFAF4", bgSecondary: "#F5EDD8", text: "#3A3128",
      accent: "#C8A040", accentLight: "#E8C87A", accentDark: "#A07820",
      accentSecondary: "#7A1F2B", buttonText: "#FDFAF4",
      sceneBg: "linear-gradient(180deg, #F5EDD8 0%, #FDFAF4 100%)",
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
  couplePhotoUrl?: string;
  fontScale?: number;
  defaultLang?: "en" | "ar";
  arBrideFirstName?: string;
  arBrideLastName?: string;
  arGroomFirstName?: string;
  arGroomLastName?: string;
  arVenueName?: string;
  arVenueAddress?: string;
  arMessage?: string;
  musicUrl?: string;
  subHeadline?: string;
  arSubHeadline?: string;
  hostingLine?: string;
  arHostingLine?: string;
  rsvpDeadline?: string;
  scriptFont?: string;
  bodyFontChoice?: string;
  showParticles?: boolean;
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

  // Music state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolumeHint, setShowVolumeHint] = useState(false);

  // Language toggle — persisted per slug
  // Priority: 1) guest's explicit choice (localStorage), 2) couple's defaultLang, 3) "en"
  const LANG_KEY = `invite_lang_${slug}`;
  const LANG_CHOSEN_KEY = `invite_lang_chosen_${slug}`;
  const [lang, setLang] = useState<Lang>("en"); // will be updated once invitation data loads
  const toggleLang = () => {
    const next: Lang = lang === "en" ? "ar" : "en";
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
      localStorage.setItem(LANG_CHOSEN_KEY, "1"); // mark that guest explicitly chose
    } catch {}
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

  // Track view once when the invitation data first loads (fire-and-forget)
  const trackViewMutation = trpc.rsvp.trackView.useMutation();
  const viewTrackedRef = useRef(false);
  useEffect(() => {
    if (invitation && slug && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      trackViewMutation.mutate({ slug });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation, slug]);

  // Once invitation data is available, set the initial language:
  // use guest's explicit choice if they've toggled before, otherwise use couple's defaultLang
  useEffect(() => {
    if (!invitation) return;
    const invD = invitation.data as InvitationData;
    try {
      const guestChose = localStorage.getItem(LANG_CHOSEN_KEY);
      if (guestChose) {
        const saved = localStorage.getItem(LANG_KEY) as Lang | null;
        if (saved === "en" || saved === "ar") { setLang(saved); return; }
      }
    } catch {}
    // No explicit guest choice — use couple's default
    setLang(invD.defaultLang === "ar" ? "ar" : "en");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation]);

  const handleOpenEnvelope = () => {
    if (animStage !== "idle") return;
    setAnimStage("opening");

    // Start music if a musicUrl is set
    const musicUrl = (invitation?.data as InvitationData)?.musicUrl;
    if (musicUrl) {
      try {
        if (!audioRef.current) {
          const audio = new Audio(musicUrl);
          audio.loop = true;
          audio.volume = 0.45;
          audioRef.current = audio;
        }
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setShowVolumeHint(true);
          setTimeout(() => setShowVolumeHint(false), 4000);
        }).catch(() => {});
      } catch {}
    }

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

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Stop music when going back to envelope
  const handleBackToEnvelopeWithMusic = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setShowVolumeHint(false);
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

  // ── Payment gate: show lock screen if invitation is not yet paid ─────────────
  if (!invitation.isPaid) {
    return (
      <>
        {/* noindex for unpaid invitations */}
        <meta name="robots" content="noindex, nofollow" />
        <div className="cardly-pending-payment-screen">
          <div>
            <div className="lock-icon">🔒</div>
            <h2>Invitation Pending Payment</h2>
            <p>
              This invitation has been created but is not yet active.
              The couple needs to complete payment before guests can view it.
            </p>
            <p style={{ opacity: 0.5, fontSize: 13, marginTop: 16 }}>
              If you are the couple, please return to your invitation builder and complete the payment.
            </p>
          </div>
        </div>
      </>
    );
  }

  const invData = invitation.data as InvitationData;
  const brideName = [invData.brideFirstName, invData.brideLastName].filter(Boolean).join(" ");
  const groomName = [invData.groomFirstName, invData.groomLastName].filter(Boolean).join(" ");
  const envStyle = ENVELOPE_STYLES[invData.envelopeStyle ?? "ivory-gold"] ?? ENVELOPE_STYLES["ivory-gold"];

  // ── Event-passed read-only screen ──────────────────────────────────────────────────────────────────
  const eventDateStr = invData.date as string | undefined;
  const isEventPassed = (() => {
    if (!eventDateStr) return false;
    const eventDate = new Date(eventDateStr);
    if (isNaN(eventDate.getTime())) return false;
    const cutoff = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // +1 day grace
    return new Date() > cutoff;
  })();

  if (isEventPassed) {
    return (
      <div className="envelope-scene" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center px-8" style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💍</div>
          <h2 className="font-script gold-shimmer" style={{ fontSize: 36, marginBottom: 12 }}>
            {brideName && groomName ? `${brideName} & ${groomName}` : "The Wedding"}
          </h2>
          <p className="font-sans" style={{ color: "rgba(245,230,179,0.7)", fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
            This wedding has already taken place. Thank you to all the guests who celebrated with the couple.
          </p>
          {eventDateStr && (
            <p className="font-sans" style={{ color: "rgba(245,230,179,0.45)", fontSize: 13 }}>
              Event date: {new Date(eventDateStr).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  const isOpen = animStage === "opening" || animStage === "expand" || animStage === "done";
  const isExpanding = animStage === "expand" || animStage === "done";

  const handleBackToEnvelope = () => {
    handleBackToEnvelopeWithMusic();
    setShowInvitation(false);
    setAnimStage("idle");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };

  if (showInvitation) {
    return (
      <div ref={invitationRef}>
        <InvitationPage
          data={invData}
          slug={slug}
          lang={lang}
          onToggleLang={toggleLang}
          onBackToEnvelope={handleBackToEnvelope}
          isMuted={isPlaying}
          onToggleMute={togglePlayPause}
          showVolumeHint={showVolumeHint}
          hasMusicUrl={!!(invData as InvitationData).musicUrl}
        />
      </div>
    );
  }

  return (
    <div
      ref={sceneRef}
      className="envelope-scene"
      onClick={handleOpenEnvelope}
      style={{
        background: envStyle.theme.sceneBg,
        /* On desktop show a dark letterbox around the card */
        backgroundColor: envStyle.theme.sceneBg,
      }}
    >
      {/* Desktop letterbox: constrain envelope to phone-like width */}
      <div className="envelope-card-wrap">
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
            {(groomName[0] || "S")}&{(brideName[0] || "H")}
          </span>
        </div>

        {/* Couple portrait — circular photo overlapping the wax seal (only when photo is set) */}
        {invData.couplePhotoUrl && (
          <div
            className="fs-wax-seal"
            style={{
              opacity: isOpen ? 0 : 1,
              transition: "opacity 0.4s ease",
              background: "transparent",
              border: "none",
              boxShadow: "none",
              zIndex: 21,
            }}
          >
            <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${envStyle.theme.accent}`, boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 3px ${envStyle.theme.accentLight}55` }}>
              <img src={invData.couplePhotoUrl} alt="Couple" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}

        {/* Expand overlay */}
        <div
          className="fs-expand-overlay"
          style={{ opacity: isExpanding ? 1 : 0, background: envStyle.theme.bg }}
        />

        {/* Tap hint — animated gold pill button */}
        {animStage === "idle" && (
          <div className="fs-tap-hint">
            <div className="fs-tap-btn" style={{ borderColor: envStyle.theme.accent, color: envStyle.theme.accent }}>
              <span className="fs-tap-ripple" style={{ background: `${envStyle.theme.accent}22` }} />
              <span className="fs-tap-ripple fs-tap-ripple-2" style={{ background: `${envStyle.theme.accent}15` }} />
              <span style={{ fontSize: 22, lineHeight: 1 }}>👆</span>
              <span style={{
                fontFamily: lang === "ar" ? "'Amiri', serif" : "'Lato', sans-serif",
                fontSize: lang === "ar" ? 16 : 13,
                fontWeight: 700,
                letterSpacing: lang === "ar" ? "0.02em" : "0.18em",
                textTransform: lang === "ar" ? "none" : "uppercase",
                lineHeight: 1.2,
              }}>
                {lang === "ar" ? "اضغط لفتح الدعوة" : "Tap to Open"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Language Toggle Button ────────────────────────────────────────────────────
function LangToggle({ lang, onToggle, onBackToEnvelope, theme }: {
  lang: Lang; onToggle: () => void; onBackToEnvelope: () => void; theme: Theme;
}) {
  const btnBase: React.CSSProperties = {
    padding: "5px 14px",
    background: `${theme.bgSecondary}ee`,
    border: `1px solid ${theme.accent}66`,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    color: theme.accent,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 5,
    whiteSpace: "nowrap" as const,
  };
  return (
    <div style={{
      position: "fixed",
      top: 14,
      right: 14,
      zIndex: 200,
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}>
      <button
        onClick={onBackToEnvelope}
        title={lang === "ar" ? "العودة إلى الظرف" : "Back to envelope"}
        style={btnBase}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
        <span style={{ fontFamily: lang === "ar" ? ARABIC_FONT : "'Lato', sans-serif", letterSpacing: lang === "ar" ? 0 : "0.05em" }}>
          {lang === "ar" ? "الظرف" : "Envelope"}
        </span>
      </button>
      <button
        onClick={onToggle}
        style={{ ...btnBase, fontFamily: lang === "ar" ? ARABIC_FONT : "'Lato', sans-serif", letterSpacing: lang === "ar" ? 0 : "0.05em" }}
      >
        {lang === "en" ? "عربي" : "English"}
      </button>
    </div>
  );
}

// ── Full Invitation Page ──────────────────────────────────────────────────────
function InvitationPage({ data, slug, lang, onToggleLang, onBackToEnvelope, isMuted, onToggleMute, showVolumeHint, hasMusicUrl }: {
  data: InvitationData; slug: string; lang: Lang; onToggleLang: () => void; onBackToEnvelope: () => void;
  isMuted?: boolean; onToggleMute?: () => void; showVolumeHint?: boolean; hasMusicUrl?: boolean;
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
  const scriptFont = data.scriptFont ?? (isRtl ? "Amiri" : "Cormorant Garamond");
  const bodyFontChoice = data.bodyFontChoice ?? (isRtl ? "Noto Naskh Arabic" : "Lato");
  const bodyFont = isRtl ? (data.bodyFontChoice ?? ARABIC_FONT) : (data.bodyFontChoice ?? undefined);

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
        position: "relative",
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
      {/* Falling particles overlay */}
      {(data as any).sections?.particles !== false && <FallingParticles />}

      {/* Language Toggle + Envelope Button */}
      <LangToggle lang={lang} onToggle={onToggleLang} onBackToEnvelope={onBackToEnvelope} theme={theme} />

      {/* Volume hint banner — fades in/out */}
      {hasMusicUrl && showVolumeHint && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 300,
            background: `${theme.bgSecondary}ee`,
            border: `1px solid ${theme.accent}66`,
            borderRadius: 24,
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            backdropFilter: "blur(12px)",
            boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            animation: "fadeInUp 0.4s ease",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>🔊</span>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, letterSpacing: "0.08em", color: theme.accent }}>
            {lang === "ar" ? "ارفع مستوى الصوت" : "Turn up your volume"}
          </span>
        </div>
      )}

      {/* Play / Pause floating button */}
      {hasMusicUrl && (
        <button
          onClick={onToggleMute}
          title={isMuted ? (lang === "ar" ? "إيقاف مؤقت" : "Pause music") : (lang === "ar" ? "تشغيل الموسيقى" : "Play music")}
          style={{
            position: "fixed",
            bottom: 24,
            right: 14,
            zIndex: 300,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `${theme.bgSecondary}ee`,
            border: `1px solid ${theme.accent}66`,
            color: theme.accent,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            boxShadow: `0 4px 12px rgba(0,0,0,0.25)`,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isMuted ? "⏸" : "▶"}
        </button>
      )}

      <div className="mobile-container" style={{ paddingTop: 56 }}>

        {/* Hero — Names */}
        {data.sections?.names !== false && (
          <div className="invitation-section stagger" style={{ paddingTop: 12, paddingBottom: 8 }}>
            <div className="flex justify-center mb-3">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>

            {data.sections?.showHostingLine !== false && (
              <p className="invite-label text-gold opacity-60 animate-fade-in-up" style={{ fontFamily: `'${scriptFont}', serif`, whiteSpace: "pre-line" }}>
                {(isRtl ? (data.arHostingLine || t.togetherWith) : (data.hostingLine || t.togetherWith))}
              </p>
            )}

            <div className="my-2 animate-fade-in-up">
              <h1 className="gold-shimmer leading-tight" style={{ fontFamily: `'${scriptFont}', serif`, fontSize: "clamp(3rem, 14vw, 5rem)" }}>
                {groomName || "Groom"}
              </h1>
              <p className="text-2xl text-gold opacity-50 my-1" style={{ fontFamily: `'${scriptFont}', serif`, fontStyle: "italic" }}>
                &amp;
              </p>
              <h1 className="gold-shimmer leading-tight" style={{ fontFamily: `'${scriptFont}', serif`, fontSize: "clamp(3rem, 14vw, 5rem)" }}>
                {brideName || "Bride"}
              </h1>
            </div>

            <div className="divider-ornament" style={{ margin: "6px 0" }}>
              <span className="text-gold text-xl">✦</span>
            </div>

            {data.sections?.showSubHeadline !== false && (
              <p className="invite-detail opacity-60 mt-1 animate-fade-in-up" style={{ fontFamily: `'${bodyFontChoice}', sans-serif` }}>
                {(isRtl ? (data.arSubHeadline || t.requestPleasure) : (data.subHeadline || t.requestPleasure))}
              </p>
            )}
          </div>
        )}

        {/* Date */}
        {data.sections?.date !== false && formattedDate && (
          <div className="invitation-section py-3">
            <div className="divider-ornament mb-3">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{t.dateLabel}</p>
            <p className="invite-heading text-cream leading-relaxed" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{formattedDate}</p>
            {formattedTime && (
              <p className="invite-heading text-cream mt-2 opacity-80" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{formattedTime}</p>
            )}
          </div>
        )}

        {/* Venue */}
        {data.sections?.venue !== false && displayVenueName && (
          <div className="invitation-section py-3">
            <div className="divider-ornament mb-3">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{t.venueLabel}</p>
            <p className="invite-heading text-cream" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{displayVenueName}</p>
            {displayVenueAddress && (
              <p className="invite-detail opacity-40 mt-2" style={{ fontFamily: bodyFont }}>{displayVenueAddress}</p>
            )}
          </div>
        )}

        {/* Personal Message */}
        {data.sections?.message !== false && displayMessage && (
          <div className="invitation-section py-3 px-8">
            <div className="divider-ornament mb-3">
              <span className="text-gold">✦</span>
            </div>
            <p className="invite-detail text-xl opacity-75 leading-relaxed" style={{ fontFamily: bodyFont }}>
              "{displayMessage}"
            </p>
          </div>
        )}

        {/* Event Program */}
        {data.sections?.program === true && (() => {
          const programText = isRtl
            ? ((data as any).arEventProgram || (data as any).eventProgram || "")
            : ((data as any).eventProgram || "");
          if (!programText.trim()) return null;
          const lines = programText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
          return (
            <div className="invitation-section py-4 px-6">
              <div className="divider-ornament mb-3">
                <span className="text-gold">✷</span>
              </div>
              <p className="invite-label text-gold opacity-60 mb-4" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(0.95rem, 3vw, 1.05rem) * var(--font-scale, 1))`, letterSpacing: "0.18em" }}>
                {isRtl ? "برنامج الحدث" : "PROGRAM"}
              </p>
              <div className="flex flex-col gap-2 max-w-md mx-auto" dir={isRtl ? "rtl" : "ltr"}>
                {lines.map((line: string, i: number) => {
                  const sepIdx = line.indexOf(":");
                  const time = sepIdx > -1 ? line.slice(sepIdx + 1).trim() : "";
                  const event = sepIdx > -1 ? line.slice(0, sepIdx).trim() : line;
                  return (
                    <div key={i} className="flex items-baseline gap-3" style={{ borderBottom: `1px dashed ${theme.accent}33`, paddingBottom: 6 }}>
                      <span className="invite-detail flex-1" style={{ fontFamily: bodyFont, fontSize: `calc(0.95rem * var(--font-scale, 1))`, opacity: 0.85, textAlign: isRtl ? "right" : "left" }}>
                        {event}
                      </span>
                      {time && (
                        <span className="text-gold" style={{ fontFamily: bodyFont, fontSize: `calc(0.9rem * var(--font-scale, 1))`, fontWeight: 600, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          {time}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Countdown */}
        {data.sections?.countdown !== false && data.date && (
          <div className="invitation-section py-3">
            <div className="divider-ornament mb-3">
              <span className="text-gold">❧</span>
            </div>
            <CountdownTimer targetDate={data.date} label={t.countdownLabel} bodyFont={bodyFont} isRtl={isRtl} />
          </div>
        )}

        {/* Map */}
        {data.sections?.map !== false && mapSrc && (
          <div className="invitation-section py-3 px-4">
            <div className="divider-ornament mb-3">
              <span className="text-gold">📍</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-4" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1rem, 3.5vw, 1.15rem) * var(--font-scale, 1))` }}>{t.findUs}</p>
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
        <RsvpSection slug={slug} theme={theme} t={t} isRtl={isRtl} bodyFont={bodyFont} rsvpDeadline={data.rsvpDeadline} />

        {/* Footer */}
        <div className="invitation-section py-8">
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
  slug, theme, t, isRtl, bodyFont, rsvpDeadline,
}: {
  slug: string;
  theme: Theme;
  t: (typeof translations)["en"] | (typeof translations)["ar"];
  isRtl: boolean;
  bodyFont?: string;
  rsvpDeadline?: string;
}) {
  // Check if deadline has passed
  const deadlinePassed = rsvpDeadline
    ? new Date() > new Date(rsvpDeadline + "T23:59:59")
    : false;
  const STORAGE_KEY = `rsvp_submitted_${slug}`;
  const DECLINED_KEY = `rsvp_declined_${slug}`;
  const [submitted, setSubmitted] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [declined, setDeclined] = useState(() => !!localStorage.getItem(`rsvp_declined_${slug}`));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submitMutation = trpc.rsvp.submit.useMutation({
    onSuccess: (_data, variables) => {
      localStorage.setItem(STORAGE_KEY, "1");
      if (variables.attending === false) {
        localStorage.setItem(DECLINED_KEY, "1");
        setDeclined(true);
      }
      setSubmitted(true);
    },
    onError: (err) => setError(err.message || t.somethingWrong),
  });

  const handleSubmit = (e: React.FormEvent, attending: boolean) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError(t.nameRequired); return; }
    if (attending && (partySize < 1 || partySize > 50)) { setError(t.partySizeError); return; }
    submitMutation.mutate({ slug, guestName: name.trim(), partySize: attending ? partySize : 1, attending, message: message.trim() || undefined, phone: phone.trim() || undefined });
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

  // Deadline countdown state
  const [deadlineTimeLeft, setDeadlineTimeLeft] = useState(() => calcDeadlineTimeLeft(rsvpDeadline));
  function calcDeadlineTimeLeft(d?: string) {
    if (!d) return null;
    const diff = new Date(d + "T23:59:59").getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    };
  }
  useEffect(() => {
    if (!rsvpDeadline) return;
    const id = setInterval(() => setDeadlineTimeLeft(calcDeadlineTimeLeft(rsvpDeadline)), 60000);
    return () => clearInterval(id);
  }, [rsvpDeadline]);

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

      {/* RSVP Deadline display */}
      {rsvpDeadline && (
        <div style={{
          background: `${theme.bgSecondary}99`,
          border: `1px solid ${theme.accent}44`,
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
          textAlign: "center",
        }}>
          <p style={{ fontFamily: bodyFont, fontSize: 11, letterSpacing: "0.1em", color: theme.accent, opacity: 0.7, textTransform: "uppercase", marginBottom: 4 }}>
            {isRtl ? "يُرجى التأكيد قبل" : "Please Confirm before"}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: theme.accent, marginBottom: deadlineTimeLeft ? 8 : 0 }}>
            {new Date(rsvpDeadline).toLocaleDateString(isRtl ? "ar-AE" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          {deadlineTimeLeft && (
            <p style={{ fontFamily: bodyFont, fontSize: 12, color: theme.text, opacity: 0.55 }}>
              {isRtl
                ? `${deadlineTimeLeft.days} يوم · ${deadlineTimeLeft.hours} ساعة · ${deadlineTimeLeft.minutes} دقيقة`
                : `${deadlineTimeLeft.days}d · ${deadlineTimeLeft.hours}h · ${deadlineTimeLeft.minutes}m remaining`}
            </p>
          )}
        </div>
      )}

      {deadlinePassed ? (
        <div style={{
          background: `${theme.bgSecondary}cc`,
          border: `1px solid ${theme.accent}44`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <p className="font-script" style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", color: theme.accent }}>
            {isRtl ? "تم إغلاق باب التأكيد" : "Responses are now closed"}
          </p>
          <p className="font-sans mt-2" style={{ fontSize: 13, color: theme.text, opacity: 0.6, fontFamily: bodyFont }}>
            {isRtl ? "انتهت فترة التسجيل، شكراً لاهتمامكم." : "The RSVP period has ended. Thank you for your interest."}
          </p>
        </div>
      ) : submitted ? (
        <div
          style={{
            background: `${theme.bgSecondary}cc`,
            border: `1px solid ${theme.accent}44`,
            borderRadius: 12,
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>{declined ? "💌" : "🎉"}</div>
          <p className="font-script" style={{ fontSize: "clamp(1.4rem, 6vw, 2rem)", color: theme.accent }}>
            {t.thankYou}
          </p>
          <p className="font-sans mt-2" style={{ fontSize: 13, color: theme.text, opacity: 0.7, fontFamily: bodyFont }}>
            {declined ? t.rsvpDeclined : t.rsvpReceived}
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => handleSubmit(e, true)}
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
            <label style={labelStyle}>{t.mobileNumber}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.mobilePlaceholder}
              style={inputStyle}
              maxLength={32}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            <button
              type="button"
              disabled={submitMutation.isPending}
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, false)}
              style={{
                width: "100%",
                padding: "11px 28px",
                background: "transparent",
                color: theme.text,
                border: `1px solid ${theme.accent}55`,
                borderRadius: 50,
                fontFamily: bodyFont ?? "'Lato', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: isRtl ? 0 : "0.08em",
                textTransform: isRtl ? "none" : "uppercase" as const,
                cursor: submitMutation.isPending ? "not-allowed" : "pointer",
                opacity: submitMutation.isPending ? 0.5 : 0.75,
                transition: "opacity 0.2s",
              }}
            >
              {t.declineAttendance}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimer({ targetDate, label, bodyFont, isRtl }: { targetDate: string; label: string; bodyFont?: string; isRtl?: boolean }) {
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
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(8px, 3vw, 20px)", flexWrap: "wrap", maxWidth: "100%" }}>
        {([
          { unit: "days" as const, arLabel: "أيام", enLabel: "Days" },
          { unit: "hours" as const, arLabel: "ساعات", enLabel: "Hours" },
          { unit: "minutes" as const, arLabel: "دقائق", enLabel: "Mins" },
          { unit: "seconds" as const, arLabel: "ثواني", enLabel: "Secs" },
        ]).map(({ unit, arLabel, enLabel }) => (
          <div key={unit} style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              color: "var(--gold)",
              fontWeight: 300,
              lineHeight: 1,
              width: "clamp(60px, 18vw, 80px)",
              height: "clamp(60px, 18vw, 80px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--gold-dark)",
              borderRadius: 10,
              background: "var(--bg-secondary, transparent)",
            }}>
              {String(timeLeft[unit]).padStart(2, "0")}
            </div>
            <div style={{
              fontFamily: isRtl ? "'Noto Naskh Arabic', 'Amiri', serif" : (bodyFont ?? "'Lato', sans-serif"),
              fontSize: 11,
              letterSpacing: isRtl ? 0 : "0.12em",
              color: "var(--gold)",
              opacity: 0.55,
              textTransform: isRtl ? "none" : "uppercase",
              marginTop: 8,
            }}>
              {isRtl ? arLabel : enLabel}
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
