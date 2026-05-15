import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

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
}

export default function InvitationView() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "";
  const { data: invitation, isLoading, error } = trpc.invitations.get.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  const handleOpenEnvelope = () => {
    if (envelopeOpen) return;
    setEnvelopeOpen(true);
    // Generate sparkle particles
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 0.5,
      }))
    );
    // Show invitation after card slides out
    setTimeout(() => setShowInvitation(true), 1400);
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

  // ── Invitation scrollable page ──────────────────────────────────────────
  if (showInvitation) {
    return <InvitationPage data={invData} />;
  }

  // ── Envelope screen ─────────────────────────────────────────────────────
  return (
    <div className="envelope-scene" onClick={handleOpenEnvelope}>
      {/* Floating petals background */}
      <FloatingPetals />

      <div className="text-center animate-fade-in-up mobile-container px-6">
        {/* Invitation label */}
        <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2">
          You are invited to
        </p>
        <h2 className="font-script text-4xl gold-shimmer mb-8 leading-tight">
          {brideName && groomName
            ? `${brideName} & ${groomName}`
            : "A Wedding Celebration"}
        </h2>

        {/* Envelope */}
        <div
          className={`envelope-wrapper animate-float mx-auto ${envelopeOpen ? "open" : ""}`}
          style={{ animationPlayState: envelopeOpen ? "paused" : "running" }}
        >
          {/* Card peeking out */}
          <div className="invitation-card-preview">
            <div className="card-inner">
              <p className="font-script text-xl text-gold-dark leading-tight">
                {brideName || "Bride"}
              </p>
              <p className="font-serif text-sm italic text-gold-dark opacity-60">
                &amp;
              </p>
              <p className="font-script text-xl text-gold-dark leading-tight">
                {groomName || "Groom"}
              </p>
            </div>
          </div>

          {/* Envelope body */}
          <div className="envelope-body">
            <div className="envelope-left" />
            <div className="envelope-right" />
          </div>

          {/* Flap */}
          <div className="envelope-flap">
            <div className="envelope-flap-face" />
            <div className="envelope-flap-back" />
          </div>

          {/* Wax seal */}
          {!envelopeOpen && (
            <div className="wax-seal">
              {brideName[0] || "H"}&{groomName[0] || "S"}
            </div>
          )}

          {/* Sparkles on open */}
          {envelopeOpen &&
            particles.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  animationDelay: `${p.delay}s`,
                  pointerEvents: "none",
                }}
                className="text-gold text-lg"
                css-animation="sparkle 0.8s ease forwards"
              >
                ✦
              </div>
            ))}
        </div>

        {/* Tap hint */}
        {!envelopeOpen && (
          <div className="mt-8 animate-fade-in">
            <p className="font-sans text-xs uppercase tracking-widest opacity-40">
              Tap to open
            </p>
            <div className="mt-2 flex justify-center">
              <span className="text-gold opacity-40 text-lg animate-bounce">↑</span>
            </div>
          </div>
        )}

        {envelopeOpen && !showInvitation && (
          <div className="mt-8 animate-fade-in">
            <p className="font-script text-2xl gold-shimmer">
              Opening your invitation…
            </p>
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

  // Smart map embed: handles plain text queries AND pasted Google Maps links
  function extractMapEmbedUrl(input: string): string {
    if (!input.trim()) return "";
    // Detect Google Maps share links and extract the query
    if (input.includes("google.com/maps") || input.includes("goo.gl/maps") || input.includes("maps.app.goo.gl")) {
      const qMatch = input.match(/[?&]q=([^&]+)/);
      const placeMatch = input.match(/place\/([^/@?]+)/);
      const query = qMatch
        ? decodeURIComponent(qMatch[1])
        : placeMatch
        ? decodeURIComponent(placeMatch[1].replace(/\+/g, " "))
        : input;
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }
    // Plain text search
    return `https://maps.google.com/maps?q=${encodeURIComponent(input)}&output=embed`;
  }

  const mapSrc = data.venueMapQuery ? extractMapEmbedUrl(data.venueMapQuery) : "";
  const directionsUrl = data.venueMapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery)}`
    : "";

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
