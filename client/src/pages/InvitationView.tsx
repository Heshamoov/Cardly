import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const ENVELOPE_STYLES: Record<string, { img: string; sealColor: string; name: string }> = {
  "ivory-gold": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
    sealColor: "#8b1a1a",
    name: "Classic Ivory",
  },
  "navy-gold": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
    sealColor: "#b8860b",
    name: "Royal Navy",
  },
  "blush-rose": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
    sealColor: "#b5736a",
    name: "Blush Rose",
  },
  "black-emerald": {
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
    sealColor: "#1a5c3a",
    name: "Midnight Star",
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

  // Calculate split point based on actual rendered image size
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

    // Stage 1: both halves slide apart (2000ms)
    setAnimStage("opening");
    setTimeout(() => {
      // Stage 2: cream overlay fades in (500ms)
      setAnimStage("expand");
      setTimeout(() => {
        // Stage 3: show invitation, scroll to top
        setAnimStage("done");
        setShowInvitation(true);
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          if (invitationRef.current) {
            invitationRef.current.scrollTop = 0;
          }
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
        <InvitationPage data={invData} />
      </div>
    );
  }

  return (
    <div ref={sceneRef} className="envelope-scene" onClick={handleOpenEnvelope}>
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
          {(brideName[0] || "H")}&amp;{(groomName[0] || "S")}
        </span>
      </div>

      {/* Expand overlay — cream fade before invitation appears */}
      <div
        className="fs-expand-overlay"
        style={{ opacity: isExpanding ? 1 : 0 }}
      />

      {/* Tap hint */}
      {animStage === "idle" && (
        <div className="fs-tap-hint">
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, letterSpacing: "0.2em", color: "rgba(201,168,76,0.7)", textTransform: "uppercase" }}>
            Tap to open
          </p>
          <span style={{ color: "rgba(201,168,76,0.5)", fontSize: 18, animation: "bounce 1s infinite" }}>↑</span>
        </div>
      )}
    </div>
  );
}

// ── Floating petals decoration ────────────────────────────────────────────────
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

// ── Full Invitation Page ──────────────────────────────────────────────────────
function InvitationPage({ data }: { data: InvitationData }) {
  const brideName = [data.brideFirstName, data.brideLastName].filter(Boolean).join(" ");
  const groomName = [data.groomFirstName, data.groomLastName].filter(Boolean).join(" ");

  const weddingDate = data.date ? new Date(data.date) : null;
  const formattedDate = weddingDate
    ? weddingDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const formattedTime = data.time
    ? new Date(`2000-01-01T${data.time}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
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

  return (
    <div className="invitation-page" style={{ "--font-scale": fontScale } as React.CSSProperties}>
      <div className="mobile-container">

        {/* Hero — Names */}
        {data.sections?.names !== false && (
          <div className="invitation-section pt-16 pb-8 stagger">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>

            <p className="invite-label text-gold opacity-60 animate-fade-in-up">
              Together with their families
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

            <p className="invite-detail opacity-60 mt-5 animate-fade-in-up">
              request the pleasure of your company
            </p>
            <p className="invite-detail opacity-60 animate-fade-in-up">
              at their wedding celebration
            </p>
          </div>
        )}

        {/* Date */}
        {data.sections?.date !== false && formattedDate && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3">Date</p>
            <p className="invite-heading text-cream text-2xl leading-relaxed">{formattedDate}</p>
          </div>
        )}

        {/* Time */}
        {data.sections?.time !== false && formattedTime && (
          <div className="invitation-section py-6">
            <p className="invite-label text-gold opacity-50 mb-3">Time</p>
            <p className="invite-heading text-cream text-2xl">{formattedTime}</p>
          </div>
        )}

        {/* Venue */}
        {data.sections?.venue !== false && data.venueName && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-3">Venue</p>
            <p className="invite-heading text-cream text-2xl">{data.venueName}</p>
            {data.venueAddress && (
              <p className="invite-detail opacity-40 mt-2">{data.venueAddress}</p>
            )}
          </div>
        )}

        {/* Personal Message */}
        {data.sections?.message !== false && data.message && (
          <div className="invitation-section py-8 px-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">✦</span>
            </div>
            <p className="invite-detail text-xl opacity-75 leading-relaxed">
              "{data.message}"
            </p>
          </div>
        )}

        {/* Countdown */}
        {data.sections?.countdown !== false && data.date && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <CountdownTimer targetDate={data.date} />
          </div>
        )}

        {/* Map */}
        {data.sections?.map !== false && mapSrc && (
          <div className="invitation-section py-8 px-4">
            <div className="divider-ornament mb-5">
              <span className="text-gold">📍</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-4">Find Us</p>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
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
                  background: "linear-gradient(135deg, #c9a84c, #9a7a2e)",
                  color: "#1a1a2e",
                  borderRadius: 50,
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(201,168,76,0.4)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                📍 Get Directions
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="invitation-section py-12">
          <div className="divider-ornament mb-6">
            <span className="text-gold text-xl">✦</span>
          </div>
          <p className="font-script gold-shimmer" style={{ fontSize: "clamp(2rem, 10vw, 3rem)" }}>
            {[data.brideFirstName, "&", data.groomFirstName].filter(Boolean).join(" ")}
          </p>
          <p className="invite-label opacity-30 mt-4">
            {formattedDate || ""}
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimer({ targetDate }: { targetDate: string }) {
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

  return (
    <div>
      <p className="invite-label text-gold opacity-50 mb-6">Counting Down</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
          <div key={unit} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 8vw, 3rem)",
              color: "#c9a84c",
              fontWeight: 300,
              lineHeight: 1,
              minWidth: 56,
            }}>
              {String(timeLeft[unit]).padStart(2, "0")}
            </div>
            <div style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "rgba(201,168,76,0.5)",
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
