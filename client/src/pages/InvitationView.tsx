import { useState, useEffect, useRef } from "react";
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

// ── Animation stages ──────────────────────────────────────────────────────────
// idle → shake (0.4s) → opening (2s: flaps open + card rises) → expand (0.7s) → done
type AnimStage = "idle" | "shake" | "opening" | "expand" | "done";

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

  const handleOpenEnvelope = () => {
    if (animStage !== "idle") return;

    // Stage 1: both flaps open + card rises (2000ms)
    setAnimStage("opening");
    setTimeout(() => {
      // Stage 2: expand overlay covers screen (700ms)
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
      }, 700);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="envelope-scene">
        <div className="text-center">
          <div className="font-script text-4xl gold-shimmer mb-4">Loading…</div>
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto opacity-60" />
        </div>
      </div>
    );
  }

  if (!invitation || error) {
    return (
      <div className="envelope-scene">
        <div className="text-center px-8">
          <div className="font-script text-5xl gold-shimmer mb-4">Oops…</div>
          <p className="font-sans text-sm opacity-50">
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

  const isOpening = animStage === "opening" || animStage === "expand" || animStage === "done";
  const isShaking = animStage === "shake";
  const isExpanding = animStage === "expand";

  // ── Invitation page (after envelope opens) ───────────────────────────────
  if (showInvitation) {
    return (
      <div ref={invitationRef}>
        <InvitationPage data={invData} />
      </div>
    );
  }

  // ── Envelope scene ────────────────────────────────────────────────────────
  return (
    <div
      className="envelope-scene"
      onClick={handleOpenEnvelope}
      style={{ opacity: isExpanding ? 0 : 1, transition: "opacity 0.5s ease" }}
    >
      <FloatingPetals />

      {/* Expand overlay — slides up to cover screen before showing invitation */}
      {isExpanding && (
        <div
          className="fs-expand-overlay expanding"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Full-screen envelope */}
      <div className="fs-envelope">
        {/* Envelope photo */}
        <img
          src={envStyle.img}
          alt="Wedding Envelope"
          className="fs-envelope-img"
          draggable={false}
        />

        {/* Top flap — opens upward (hinge at bottom edge, rotates backward) */}
        <div
          className="fs-flap-top"
          style={{
            transform: isOpening
              ? "perspective(1200px) rotateX(175deg)"
              : "perspective(1200px) rotateX(0deg)",
            transition: isOpening
              ? "transform 2s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          }}
        >
          <div className="fs-flap-top-face" />
        </div>

        {/* Bottom flap — opens downward (hinge at top edge, rotates forward) */}
        <div
          className="fs-flap-bottom"
          style={{
            transform: isOpening
              ? "perspective(1200px) rotateX(-175deg)"
              : "perspective(1200px) rotateX(0deg)",
            transition: isOpening
              ? "transform 2s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          }}
        >
          <div className="fs-flap-bottom-face" />
        </div>

        {/* Wax seal — cracks and flies off */}
        <div
          className="fs-wax-seal"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${envStyle.sealColor}ee, ${envStyle.sealColor}88)`,
            opacity: isOpening ? 0 : 1,
            transform: isOpening
              ? "translate(-50%, -50%) scale(1.6) rotate(20deg)"
              : "translate(-50%, -50%) scale(1) rotate(0deg)",
            transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
          }}
        >
          <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 26, color: "rgba(255,255,255,0.92)" }}>
            {(brideName[0] || "H")}&{(groomName[0] || "S")}
          </span>
        </div>

        {/* Invitation card rising from inside */}
        <div
          className={`fs-card-rising ${isOpening ? "risen" : ""}`}
          style={{
            transitionDelay: isOpening ? "0.3s" : "0s",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 28, color: "#9a7a2e", lineHeight: 1.3 }}>
              {brideName || "Bride"}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#9a7a2e", opacity: 0.6, margin: "6px 0" }}>
              &amp;
            </p>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 28, color: "#9a7a2e", lineHeight: 1.3 }}>
              {groomName || "Groom"}
            </p>
          </div>
        </div>
      </div>

      {/* Tap hint */}
      {animStage === "idle" && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10 pointer-events-none animate-fade-in">
          <p className="invite-label opacity-40 mb-2">Tap to open</p>
          <span className="text-gold opacity-40 text-2xl animate-bounce">↑</span>
        </div>
      )}

      {animStage === "opening" && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10 pointer-events-none animate-fade-in">
          <p className="font-script text-2xl gold-shimmer">Opening your invitation…</p>
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

  return (
    <div className="invitation-page">
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
              <span className="text-gold">❧</span>
            </div>
            <p className="invite-label text-gold opacity-50 mb-5">Find Us</p>
            <div className="rounded-2xl overflow-hidden border border-gold/20 shadow-2xl">
              <iframe
                src={mapSrc}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Venue Map"
              />
            </div>
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full mt-4 text-center block"
                style={{ textDecoration: "none" }}
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
            {[data.brideFirstName, "&", data.groomFirstName].filter(Boolean).join(" ") || "Bride & Groom"}
          </p>
          <p className="invite-label opacity-25 mt-4">With love</p>
          <div className="flex justify-center mt-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>
        </div>

      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div>
        <p className="font-script text-3xl gold-shimmer">Today is the Day! 🎉</p>
      </div>
    );
  }

  return (
    <div>
      <p className="invite-label text-gold opacity-50 mb-5">Counting Down</p>
      <div className="flex justify-center gap-3">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div
              className="invite-heading text-3xl text-gold font-light flex items-center justify-center border border-gold/25 rounded-xl"
              style={{ width: 64, height: 64 }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <p className="invite-label opacity-35 mt-2">{label}</p>
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
