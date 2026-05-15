import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  envelopeStyle: string;
}

const ENVELOPE_STYLES = [
  {
    id: "ivory-gold",
    name: "Classic Ivory",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_ivory_gold-c4CMUQ9ZncnqYJ2Gq4huYK.webp",
    sealColor: "#8b1a1a",
  },
  {
    id: "navy-gold",
    name: "Royal Navy",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_navy_gold-4km7M5i6ZhTiMMte5zY3i4.webp",
    sealColor: "#b8860b",
  },
  {
    id: "blush-rose",
    name: "Blush Rose",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_blush_rose-HByHvDtXorH2SVPndKTVVD.webp",
    sealColor: "#b5736a",
  },
  {
    id: "black-emerald",
    name: "Midnight Star",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029094267/cwkwQE2ZytYK5D22sZcWLW/envelope_black_emerald-EEFgnZzoHwUGvwvWXt2WJN.webp",
    sealColor: "#1a5c3a",
  },
];

const defaultData: InvitationData = {
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
          placeholder="e.g. Al Rekab Restaurant"
          value={data.venueName}
          onChange={(e) => set("venueName", e.target.value)}
        />
      </div>
      <div>
        <label className="font-sans text-xs opacity-50 block mb-1">Address</label>
        <input
          className="wedding-input"
          placeholder="e.g. Al Ain, Abu Dhabi, UAE"
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
}: {
  label: string;
  sectionKey: string;
  sections: Record<string, boolean>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  const isOn = sections[sectionKey];
  return (
    <div className={`section-card ${!isOn ? "hidden-section" : ""}`}>
      <div className="flex items-center justify-between mb-3 pr-12">
        <span className="font-sans text-xs uppercase tracking-widest text-gold opacity-80">
          {label}
        </span>
        <Toggle on={isOn} onToggle={() => onToggle(sectionKey)} />
      </div>
      {isOn && <div>{children}</div>}
      {!isOn && (
        <p className="font-sans text-xs text-center opacity-40 mt-1">
          Section hidden — toggle to show
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
      return { ...defaultData, ...parsed, sections: { ...defaultData.sections, ...(parsed.sections ?? {}) } };
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

  const set = (field: keyof InvitationData, value: string) =>
    setData((d) => ({ ...d, [field]: value }));

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
    createMutation.mutate({ data });
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
    return (
      <div className="builder-page">
        <div className="mobile-container">
          {/* Preview banner */}
          <div className="sticky top-0 z-50 bg-dark-mid border-b border-gold/20 px-4 py-3 flex items-center justify-between">
            <span className="font-sans text-xs uppercase tracking-widest text-gold">
              Preview Mode
            </span>
            <div className="flex gap-3">
              <button
                className="btn-outline text-xs py-2 px-4"
                onClick={() => setPreviewing(false)}
              >
                ← Edit
              </button>
              <button
                className="btn-gold text-xs py-2 px-4"
                onClick={handlePublish}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          {/* Preview content */}
          <PreviewContent data={data} />
        </div>
      </div>
    );
  }

  // ── Builder mode ──────────────────────────────────────────────────────────
  return (
    <div className="builder-page">
      <div className="mobile-container px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold mb-1 opacity-70">
            Create Your
          </p>
          <h1 className="font-script text-5xl gold-shimmer">
            Wedding Invitation
          </h1>
          <p className="font-sans text-xs opacity-40 mt-2">
            Fill in your details · Toggle sections on or off · Preview & Publish
          </p>
        </div>

        {/* ── Envelope Style Picker ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-4">
            Choose Your Envelope Style
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
          label="Bride & Groom Names"
          sectionKey="names"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="font-sans text-xs opacity-50 block mb-1">
                Bride's First Name
              </label>
              <input
                className="wedding-input"
                placeholder="e.g. Hend"
                value={data.brideFirstName}
                onChange={(e) => set("brideFirstName", e.target.value)}
              />
            </div>
            <div>
              <label className="font-sans text-xs opacity-50 block mb-1">
                Bride's Last Name
              </label>
              <input
                className="wedding-input"
                placeholder="Optional"
                value={data.brideLastName}
                onChange={(e) => set("brideLastName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs opacity-50 block mb-1">
                Groom's First Name
              </label>
              <input
                className="wedding-input"
                placeholder="e.g. Sami"
                value={data.groomFirstName}
                onChange={(e) => set("groomFirstName", e.target.value)}
              />
            </div>
            <div>
              <label className="font-sans text-xs opacity-50 block mb-1">
                Groom's Last Name
              </label>
              <input
                className="wedding-input"
                placeholder="Optional"
                value={data.groomLastName}
                onChange={(e) => set("groomLastName", e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Section: Date ── */}
        <SectionCard
          label="Wedding Date"
          sectionKey="date"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <label className="font-sans text-xs opacity-50 block mb-1">
            Date
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
          label="Start Time"
          sectionKey="time"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <label className="font-sans text-xs opacity-50 block mb-1">
            Time
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
          label="Venue & Location"
          sectionKey="venue"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <VenueLocationInput data={data} set={set} />
        </SectionCard>

        {/* ── Section: Message ── */}
        <SectionCard
          label="Personal Message"
          sectionKey="message"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <label className="font-sans text-xs opacity-50 block mb-1">
            Message to Guests
          </label>
          <textarea
            className="wedding-input"
            rows={3}
            placeholder="e.g. We joyfully invite you to share in our happiness as we begin our journey together…"
            value={data.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </SectionCard>

        {/* ── Section: Map ── */}
        <SectionCard
          label="Venue Map"
          sectionKey="map"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <p className="font-sans text-xs opacity-50">
            An interactive Google Map of your venue will appear in the
            invitation.
          </p>
        </SectionCard>

        {/* ── Section: Countdown ── */}
        <SectionCard
          label="Countdown Timer"
          sectionKey="countdown"
          sections={data.sections}
          onToggle={toggleSection}
        >
          <p className="font-sans text-xs opacity-50">
            A live countdown to your wedding day will appear in the invitation.
          </p>
        </SectionCard>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 mt-6 pb-8">
          <button
            className="btn-gold w-full"
            onClick={() => setPreviewing(true)}
          >
            Preview Invitation →
          </button>
          <button
            className="btn-outline w-full"
            onClick={handlePublish}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Publishing…" : "Skip Preview & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Content (shared between preview mode and invitation page) ─────────
function PreviewContent({ data }: { data: InvitationData }) {
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

  // Use server-side resolver for accurate map embed (handles short URLs)
  const { data: resolvedMap } = trpc.invitations.resolveMapUrl.useQuery(
    { url: data.venueMapQuery },
    { enabled: !!data.venueMapQuery.trim() }
  );
  const mapSrc = resolvedMap?.embedUrl ?? extractGoogleMapsEmbedUrl(data.venueMapQuery);
  const mapsDirectionsUrl = resolvedMap?.directionsUrl ?? (
    data.venueMapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(data.venueMapQuery)}` : ""
  );

  return (
    <div className="invitation-page">
      {/* Hero / Names */}
      {data.sections.names && (
        <div className="invitation-section pt-16 pb-8 stagger">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-70 animate-fade-in-up">
            Together with their families
          </p>
          <div className="my-6 animate-fade-in-up">
            <h1 className="font-script text-6xl gold-shimmer leading-tight">
              {brideName || "Bride"}
            </h1>
            <p className="font-serif text-2xl italic text-gold opacity-60 my-2">
              &amp;
            </p>
            <h1 className="font-script text-6xl gold-shimmer leading-tight">
              {groomName || "Groom"}
            </h1>
          </div>
          <div className="divider-ornament">
            <span className="text-gold text-lg">✦</span>
          </div>
          <p className="font-serif italic text-lg opacity-60 mt-4 animate-fade-in-up">
            request the pleasure of your company
          </p>
          <p className="font-serif italic text-lg opacity-60 animate-fade-in-up">
            at their wedding celebration
          </p>
        </div>
      )}

      {/* Date */}
      {data.sections.date && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2">
            Date
          </p>
          <p className="font-serif text-2xl text-cream">
            {formattedDate || "Sunday, 24 May 2026"}
          </p>
        </div>
      )}

      {/* Time */}
      {data.sections.time && (
        <div className="invitation-section py-4">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2">
            Time
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
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-2">
            Venue
          </p>
          <p className="font-serif text-2xl text-cream">
            {data.venueName || "Al Rekab Restaurant"}
          </p>
          <p className="font-sans text-sm opacity-50 mt-1">
            {data.venueAddress || "Al Ain, Abu Dhabi, UAE"}
          </p>
        </div>
      )}

      {/* Message */}
      {data.sections.message && data.message && (
        <div className="invitation-section py-6 px-8">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">✦</span>
          </div>
          <p className="font-serif italic text-lg opacity-80 leading-relaxed">
            "{data.message}"
          </p>
        </div>
      )}

      {/* Countdown */}
      {data.sections.countdown && data.date && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <CountdownTimer targetDate={data.date} />
        </div>
      )}

      {/* Map */}
      {data.sections.map && mapSrc && (
        <div className="invitation-section py-6 px-4">
          <div className="divider-ornament mb-4">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-4">
            Find Us
          </p>
          <div className="rounded-xl overflow-hidden border border-gold/20 shadow-lg">
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
              className="btn-gold w-full mt-4 text-center block"
              style={{ textDecoration: 'none' }}
            >
              📍 Get Directions
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
          {[data.brideFirstName, "&", data.groomFirstName]
            .filter(Boolean)
            .join(" ") || "Bride & Groom"}
        </p>
        <p className="font-sans text-xs opacity-30 mt-4 tracking-widest uppercase">
          With love
        </p>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
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
      <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-60 mb-4">
        Counting Down
      </p>
      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="font-serif text-4xl text-gold font-light w-16 h-16 flex items-center justify-center border border-gold/30 rounded-lg">
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
