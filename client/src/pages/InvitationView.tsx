import { useState, useEffect } from "react";
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

export default function InvitationView() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "";
  const { data: invitation, isLoading, error } = trpc.invitations.get.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const [animStage, setAnimStage] = useState<"idle" | "shake" | "opening" | "risen" | "done">("idle");
  const [showInvitation, setShowInvitation] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; angle: number }[]>([]);

  const handleOpenEnvelope = () => {
    if (animStage !== "idle") return;
    // Stage 1: shake (300ms)
    setAnimStage("shake");
    setTimeout(() => {
      // Stage 2: flap opens + card rises (900ms)
      setAnimStage("opening");
      // Burst particles
      setParticles(
        Array.from({ length: 16 }, (_, i) => ({
          id: i,
          x: 20 + Math.random() * 60,
          y: 10 + Math.random() * 70,
          delay: Math.random() * 0.4,
          angle: Math.random() * 360,
        }))
      );
      setTimeout(() => {
        // Stage 3: card fully risen
        setAnimStage("risen");
        setTimeout(() => {
          // Stage 4: fade to invitation
          setAnimStage("done");
          setTimeout(() => setShowInvitation(true), 500);
        }, 600);
      }, 900);
    }, 350);
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
  const brideName = [invData.brideFirstName, invData.brideLastName]
    .filter(Boolean)
    .join(" ");
  const groomName = [invData.groomFirstName, invData.groomLastName]
    .filter(Boolean)
    .join(" ");

  const envStyle = ENVELOPE_STYLES[invData.envelopeStyle ?? "ivory-gold"] ?? ENVELOPE_STYLES["ivory-gold"];
  const isOpening = animStage === "opening" || animStage === "risen" || animStage === "done";
  const isShaking = animStage === "shake";

  // ── Invitation scrollable page ───────────────────────────────────────
  if (showInvitation) {
    return <InvitationPage data={invData} />;
  }

  // ── Envelope screen ──────────────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="envelope-scene"
      style={{ opacity: animStage === "done" ? 0 : 1, transition: "opacity 0.5s ease" }}
      onClick={handleOpenEnvelope}
    >
      <FloatingPetals />

      <div className="text-center animate-fade-in-up mobile-container px-6">
        <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2">
          You are invited to
        </p>
        <h2 className="font-script text-4xl gold-shimmer mb-8 leading-tight">
          {brideName && groomName ? `${brideName} & ${groomName}` : "A Wedding Celebration"}
        </h2>

        {/* Photo envelope with CSS 3D animation */}
        <div
          className="photo-envelope mx-auto"
          style={{
            animation: isShaking ? "envelopeShake 0.35s ease" : isOpening ? "none" : "float 3s ease-in-out infinite",
            transform: animStage === "done" ? "scale(0.9)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        >
          {/* The envelope photo — flap folds open */}
          <div className="photo-envelope-img-wrap">
            <img
              src={envStyle.img}
              alt="Wedding Envelope"
              className="photo-envelope-img"
              style={{
                transformOrigin: "top center",
                transform: isOpening ? "perspective(800px) rotateX(-160deg)" : "perspective(800px) rotateX(0deg)",
                transition: isOpening ? "transform 0.85s cubic-bezier(0.4,0,0.2,1)" : "none",
                backfaceVisibility: "hidden",
              }}
            />
            {/* Wax seal — cracks and fades on open */}
            <div
              className="photo-wax-seal"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${envStyle.sealColor}dd, ${envStyle.sealColor}88)`,
                opacity: isOpening ? 0 : 1,
                transform: isOpening ? "scale(1.4) rotate(15deg)" : "scale(1) rotate(0deg)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: 22, color: "rgba(255,255,255,0.9)" }}>
                {(brideName[0] || "H")}&{(groomName[0] || "S")}
              </span>
            </div>
          </div>

          {/* Invitation card rising from envelope */}
          <div
            className="photo-card-rising"
            style={{
              transform: isOpening
                ? animStage === "risen" || animStage === "done"
                  ? "translateX(-50%) translateY(-130%)"
                  : "translateX(-50%) translateY(-80%)"
                : "translateX(-50%) translateY(10%)",
              opacity: isOpening ? 1 : 0,
              transition: "transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
              transitionDelay: isOpening ? "0.2s" : "0s",
            }}
          >
            <div className="photo-card-inner">
              <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 22, color: "#9a7a2e", lineHeight: 1.3 }}>
                {brideName || "Bride"}
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: "#9a7a2e", opacity: 0.6, margin: "4px 0" }}>&amp;</p>
              <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 22, color: "#9a7a2e", lineHeight: 1.3 }}>
                {groomName || "Groom"}
              </p>
            </div>
          </div>

          {/* Sparkle burst */}
          {isOpening && particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
                animation: "sparkle 0.8s ease forwards",
                pointerEvents: "none",
                color: "var(--gold)",
                fontSize: 14 + Math.random() * 10,
                transform: `rotate(${p.angle}deg)`,
              }}
            >
              ❆
            </div>
          ))}
        </div>

        {/* Tap hint */}
        {animStage === "idle" && (
          <div className="mt-8 animate-fade-in">
            <p className="font-sans text-xs uppercase tracking-widest opacity-40">Tap to open</p>
            <div className="mt-2 flex justify-center">
              <span className="text-gold opacity-40 text-lg animate-bounce">↑</span>
            </div>
          </div>
        )}
        {isOpening && animStage !== "done" && (
          <div className="mt-8 animate-fade-in">
            <p className="font-script text-2xl gold-shimmer">Opening your invitation…</p>
          </div>
        )}
      </div>
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
  const brideName = [data.brideFirstName, data.brideLastName]
    .filter(Boolean)
    .join(" ");
  const groomName = [data.groomFirstName, data.groomLastName]
    .filter(Boolean)
    .join(" ");

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

  // Use server-side resolver for accurate map embed (handles short URLs like maps.app.goo.gl)
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
        {/* Hero */}
        {data.sections?.names !== false && (
          <div className="invitation-section pt-16 pb-8 stagger">
            {/* Decorative top border */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            </div>

            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 animate-fade-in-up">
              Together with their families
            </p>

            <div className="my-8 animate-fade-in-up">
              <h1 className="font-script text-7xl gold-shimmer leading-tight">
                {brideName || "Bride"}
              </h1>
              <p className="font-serif text-3xl italic text-gold opacity-50 my-3">
                &amp;
              </p>
              <h1 className="font-script text-7xl gold-shimmer leading-tight">
                {groomName || "Groom"}
              </h1>
            </div>

            <div className="divider-ornament">
              <span className="text-gold text-xl">✦</span>
            </div>

            <p className="font-serif italic text-lg opacity-60 mt-5 animate-fade-in-up">
              request the pleasure of your company
            </p>
            <p className="font-serif italic text-lg opacity-60 animate-fade-in-up">
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
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-50 mb-3">
              Date
            </p>
            <p className="font-serif text-2xl text-cream leading-relaxed">
              {formattedDate}
            </p>
          </div>
        )}

        {/* Time */}
        {data.sections?.time !== false && formattedTime && (
          <div className="invitation-section py-6">
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-50 mb-3">
              Time
            </p>
            <p className="font-serif text-2xl text-cream">{formattedTime}</p>
          </div>
        )}

        {/* Venue */}
        {data.sections?.venue !== false && data.venueName && (
          <div className="invitation-section py-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">❧</span>
            </div>
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-50 mb-3">
              Venue
            </p>
            <p className="font-serif text-2xl text-cream">{data.venueName}</p>
            {data.venueAddress && (
              <p className="font-sans text-sm opacity-40 mt-2">
                {data.venueAddress}
              </p>
            )}
          </div>
        )}

        {/* Personal Message */}
        {data.sections?.message !== false && data.message && (
          <div className="invitation-section py-8 px-8">
            <div className="divider-ornament mb-5">
              <span className="text-gold">✦</span>
            </div>
            <p className="font-serif italic text-xl opacity-75 leading-relaxed">
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
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-50 mb-5">
              Find Us
            </p>
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
                style={{ textDecoration: 'none' }}
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
          <p className="font-script text-4xl gold-shimmer">
            {[data.brideFirstName, "&", data.groomFirstName]
              .filter(Boolean)
              .join(" ") || "Bride & Groom"}
          </p>
          <p className="font-sans text-xs opacity-25 mt-4 tracking-widest uppercase">
            With love
          </p>
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
      <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-50 mb-5">
        Counting Down
      </p>
      <div className="flex justify-center gap-3">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div
              className="font-serif text-3xl text-gold font-light flex items-center justify-center border border-gold/25 rounded-xl"
              style={{ width: 64, height: 64 }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <p className="font-sans text-xs opacity-35 mt-2 uppercase tracking-wider">
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
