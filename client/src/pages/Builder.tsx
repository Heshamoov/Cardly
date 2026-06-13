import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { translations, ARABIC_FONT, type Lang } from "@/lib/i18n";
import FallingParticles from "@/components/FallingParticles";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLang, LangToggle } from "@/contexts/LangContext";

interface InvitationData {
  title: string;
  eventType: string; // "wedding", "engagement", "dinner", "birthday", "corporate", or custom
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
  couplePhotoUrl?: string;
  defaultLang?: "en" | "ar";
  musicUrl?: string;
  subHeadline?: string;
  arSubHeadline?: string;
  hostingLine?: string;
  arHostingLine?: string;
  rsvpDeadline?: string; // ISO date string YYYY-MM-DD
  scriptFont?: string; // font for names & hosting line
  bodyFontChoice?: string; // font for welcome message & body text
  showParticles?: boolean; // falling flowers & stars animation
  eventProgram?: string; // Optional event timeline
  arEventProgram?: string; // Arabic event timeline
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
  {
    id: "navy-floral",
    name: "Navy Floral",
    img: "/manus-storage/envelope-navy-floral_269d799e.png",
    sealColor: "#D4AF37",
    theme: {
      bg: "#0D1B2A",
      bgSecondary: "#162236",
      text: "#F5E6B3",
      accent: "#D4AF37",
      accentLight: "#F5E6B3",
      accentDark: "#A88A1A",
      accentSecondary: "#F5E6B3",
      buttonText: "#0D1B2A",
      sceneBg: "linear-gradient(180deg, #0D1B2A 0%, #162236 100%)",
    },
  },
  {
    id: "white-floral",
    name: "White Floral",
    img: "/manus-storage/envelope-white-floral_2b139886.png",
    sealColor: "#C8A040",
    theme: {
      bg: "#FDFAF4",
      bgSecondary: "#F5EDD8",
      text: "#3A3128",
      accent: "#C8A040",
      accentLight: "#E8C87A",
      accentDark: "#A07820",
      accentSecondary: "#7A1F2B",
      buttonText: "#FDFAF4",
      sceneBg: "linear-gradient(180deg, #F5EDD8 0%, #FDFAF4 100%)",
    },
  },
];

const defaultData: InvitationData = {
  title: "",
  eventType: "wedding",
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
  couplePhotoUrl: "",
  defaultLang: "en",
  musicUrl: "",
  subHeadline: "",
  arSubHeadline: "",
  hostingLine: "",
  arHostingLine: "",
  rsvpDeadline: "",
  scriptFont: "Cormorant Garamond",
  bodyFontChoice: "Lato",
  eventProgram: "",
  arEventProgram: "",
  sections: {
    names: true,
    date: true,
    time: true,
    venue: true,
    rsvp: true,
    message: true,
    map: true,
    countdown: true,
    showHostingLine: true,
    showSubHeadline: true,
    particles: true,
    program: false,
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
          placeholder="e.g. 123 Rose Avenue, London, UK"
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

// ── Message Suggestion Dropdown ─────────────────────────────────────────────
const EN_SUGGESTIONS = [
  "Together with our families, we joyfully invite you to share in our happiness as we begin our new journey together.",
  "With hearts full of love and joy, we invite you to witness and celebrate the beginning of our forever.",
  "Two souls, one heart. We would be honoured to have you by our side on this most special day.",
  "Love is the greatest adventure, and we are thrilled to begin ours. Please join us as we say \u2018I do\u2019.",
  "On this beautiful day, we invite you to celebrate with us as two hearts become one. Your presence would make our joy complete.",
  "With great joy and love, we invite you to be part of our wedding celebration and share in the magic of this unforgettable day.",
  "We are overjoyed to invite you to witness the union of two hearts and the start of a beautiful new chapter in our lives.",
  "A love story written in the stars \u2014 we invite you to celebrate with us as we begin our happily ever after.",
];
const AR_SUGGESTIONS = [
  "\u0645\u0639 \u0639\u0627\u0626\u0644\u062a\u064a\u0646\u0627 \u0627\u0644\u0643\u0631\u064a\u0645\u062a\u064a\u0646\u060c \u064a\u0633\u0639\u062f\u0646\u0627 \u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u0645\u0634\u0627\u0631\u0643\u062a\u0646\u0627 \u0641\u0631\u062d\u0629 \u0632\u0641\u0627\u0641\u0646\u0627 \u0648\u0627\u0644\u0627\u062d\u062a\u0641\u0627\u0644 \u0628\u0647\u0630\u0647 \u0627\u0644\u0644\u062d\u0638\u0629 \u0627\u0644\u062c\u0645\u064a\u0644\u0629.",
  "\u0628\u0642\u0644\u0648\u0628 \u0645\u0641\u0639\u0645\u0629 \u0628\u0627\u0644\u062d\u0628 \u0648\u0627\u0644\u0628\u0647\u062c\u0629\u060c \u0646\u062a\u0634\u0631\u0641 \u0628\u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u062a\u0643\u0648\u0646\u0648\u0627 \u0634\u0647\u0648\u062f\u0627\u064b \u0639\u0644\u0649 \u0628\u062f\u0627\u064a\u0629 \u0631\u062d\u0644\u062a\u0646\u0627 \u0645\u0639\u0627\u064b.",
  "\u0631\u0648\u062d\u0627\u0646 \u0627\u0644\u062a\u0642\u062a\u0627 \u0648\u0642\u0644\u0628\u0627\u0646 \u0627\u062a\u062d\u062f\u0627. \u064a\u0634\u0631\u0641\u0646\u0627 \u062d\u0636\u0648\u0631\u0643\u0645 \u0645\u0639\u0646\u0627 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u064a\u0648\u0645 \u0627\u0644\u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a.",
  "\u0627\u0644\u062d\u0628 \u0623\u062c\u0645\u0644 \u0631\u062d\u0644\u0629 \u0641\u064a \u0627\u0644\u062d\u064a\u0627\u0629\u060c \u0648\u0647\u0627 \u0646\u062d\u0646 \u0646\u0628\u062f\u0623\u0647\u0627 \u0645\u0639\u0627\u064b. \u0646\u062a\u0645\u0646\u0649 \u0623\u0646 \u062a\u0643\u0648\u0646\u0648\u0627 \u062c\u0632\u0621\u0627\u064b \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0644\u062d\u0638\u0629 \u0627\u0644\u062e\u0627\u0644\u062f\u0629.",
  "\u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u064a\u0648\u0645 \u0627\u0644\u0645\u0628\u0627\u0631\u0643\u060c \u0646\u062f\u0639\u0648\u0643\u0645 \u0644\u0645\u0634\u0627\u0631\u0643\u062a\u0646\u0627 \u0641\u0631\u062d\u0629 \u0627\u0644\u0632\u0641\u0627\u0641 \u0648\u062a\u0643\u0631\u064a\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0627\u0644\u063a\u0627\u0644\u064a\u0629 \u0628\u062d\u0636\u0648\u0631\u0643\u0645 \u0627\u0644\u0643\u0631\u064a\u0645.",
  "\u0628\u0643\u0644 \u0627\u0644\u0641\u0631\u062d \u0648\u0627\u0644\u0633\u0639\u0627\u062f\u0629\u060c \u0646\u0633\u0639\u062f \u0628\u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u0644\u0627\u062d\u062a\u0641\u0627\u0644 \u0645\u0639\u0646\u0627 \u0628\u0623\u062c\u0645\u0644 \u064a\u0648\u0645 \u0641\u064a \u062d\u064a\u0627\u062a\u0646\u0627 \u0648\u0628\u062f\u0627\u064a\u0629 \u0641\u0635\u0644 \u062c\u062f\u064a\u062f \u0645\u0644\u064a\u0621 \u0628\u0627\u0644\u062d\u0628.",
  "\u0642\u0635\u0629 \u062d\u0628 \u0643\u064f\u062a\u0628\u062a \u0641\u064a \u0627\u0644\u0646\u062c\u0648\u0645 \u2014 \u064a\u0633\u0639\u062f\u0646\u0627 \u062f\u0639\u0648\u062a\u0643\u0645 \u0644\u062a\u0643\u0648\u0646\u0648\u0627 \u062c\u0632\u0621\u0627\u064b \u0645\u0646 \u0628\u062f\u0627\u064a\u062a\u0646\u0627 \u0627\u0644\u0633\u0639\u064a\u062f\u0629.",
  "\u064a\u0633\u0639\u062f\u0646\u0627 \u0623\u0646 \u0646\u0634\u0627\u0631\u0643\u0643\u0645 \u0623\u0633\u0639\u062f \u0644\u062d\u0638\u0627\u062a \u062d\u064a\u0627\u062a\u0646\u0627\u060c \u0648\u0646\u062a\u0637\u0644\u0639 \u0644\u0631\u0624\u064a\u062a\u0643\u0645 \u0641\u064a \u062d\u0641\u0644 \u0632\u0641\u0627\u0641\u0646\u0627.",
];

function MessageSuggestionDropdown({ lang, onSelect }: { lang: "en" | "ar"; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const suggestions = lang === "en" ? EN_SUGGESTIONS : AR_SUGGESTIONS;
  const placeholder = lang === "en" ? "\u2728 Choose a suggested message\u2026" : "\u2728 \u0627\u062e\u062a\u0631 \u0631\u0633\u0627\u0644\u0629 \u0645\u0642\u062a\u0631\u062d\u0629\u2026";
  const arabicFont = `'Noto Naskh Arabic', 'Amiri', serif`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 8 }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 14px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: 8,
          color: "rgba(201,168,76,0.8)",
          fontSize: 13,
          fontFamily: lang === "ar" ? arabicFont : "inherit",
          cursor: "pointer",
          textAlign: lang === "ar" ? "right" : "left",
        }}
      >
        <span>{placeholder}</span>
        <span style={{ fontSize: 10, opacity: 0.7, marginLeft: lang === "ar" ? 0 : 6, marginRight: lang === "ar" ? 6 : 0 }}>{open ? "\u25b2" : "\u25bc"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          zIndex: 999,
          background: "#1a1a2e",
          border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          maxHeight: 260,
          overflowY: "auto",
          padding: "4px 0",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { onSelect(s); setOpen(false); }}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                color: hovered === i ? "#c9a84c" : "#e8d5a3",
                background: hovered === i ? "rgba(201,168,76,0.12)" : "transparent",
                cursor: "pointer",
                fontFamily: lang === "ar" ? arabicFont : "inherit",
                textAlign: lang === "ar" ? "right" : "left",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(201,168,76,0.1)" : "none",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Font options ────────────────────────────────────────────────────────────
const SCRIPT_FONTS_EN = [
  { value: "Cormorant Garamond", label: "Cormorant Garamond", preview: "Cormorant Garamond" },
  { value: "Great Vibes", label: "Great Vibes", preview: "Great Vibes" },
  { value: "Alex Brush", label: "Alex Brush", preview: "Alex Brush" },
  { value: "Playfair Display", label: "Playfair Display", preview: "Playfair Display" },
  { value: "Cinzel", label: "Cinzel", preview: "Cinzel" },
  { value: "IM Fell English", label: "IM Fell English", preview: "IM Fell English" },
  { value: "Libre Baskerville", label: "Libre Baskerville", preview: "Libre Baskerville" },
];

const SCRIPT_FONTS_AR = [
  { value: "Amiri", label: "أميري", preview: "أميري" },
  { value: "Scheherazade New", label: "شهرزاد", preview: "شهرزاد" },
  { value: "Reem Kufi", label: "ريم كوفي", preview: "ريم كوفي" },
  { value: "Noto Naskh Arabic", label: "نوتو نسخ", preview: "نوتو نسخ" },
  { value: "Lateef", label: "لطيف", preview: "لطيف" },
];

const BODY_FONTS_EN = [
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Libre Baskerville", label: "Libre Baskerville" },
];

const BODY_FONTS_AR = [
  { value: "Noto Naskh Arabic", label: "نوتو نسخ" },
  { value: "Amiri", label: "أميري" },
  { value: "Scheherazade New", label: "شهرزاد" },
  { value: "Reem Kufi", label: "ريم كوفي" },
];

// ── Genre sample tracks ──────────────────────────────────────────────────────
const MUSIC_GENRES = [
  { id: "western-classical", name: "Western Classical", nameAr: "كلاسيكي غربي", emoji: "🎻", url: "/manus-storage/music-western-classical_fe8f1e6b.mp3" },
  { id: "arabic-oud", name: "Arabic Oud", nameAr: "عود عربي", emoji: "🎵", url: "/manus-storage/music-arabic-oud_519d7df8.mp3" },
  { id: "romantic-piano", name: "Romantic Piano", nameAr: "بيانو رومانسي", emoji: "🎹", url: "/manus-storage/music-romantic-piano_1442c414.mp3" },
  { id: "celtic", name: "Celtic", nameAr: "سلتي", emoji: "🎻", url: "/manus-storage/music-celtic_a21028b9.mp3" },
  { id: "latin", name: "Latin", nameAr: "لاتيني", emoji: "🎸", url: "/manus-storage/music-latin_e0bac558.mp3" },
  { id: "jazz", name: "Jazz", nameAr: "جاز", emoji: "🎺", url: "/manus-storage/music-jazz_cd4da150.mp3" },
];

function MusicSection({
  data,
  set,
  formLang,
  uploadMusicMutation,
}: {
  data: InvitationData;
  set: (field: keyof InvitationData, value: string | number) => void;
  formLang: "en" | "ar";
  uploadMusicMutation: { isPending: boolean; isError: boolean; mutate: (args: { base64: string; mimeType: string }) => void };
}) {
  const ft = translations[formLang];
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileRef = useRef<HTMLInputElement>(null);

  const togglePreview = (genreId: string, url: string) => {
    if (previewingId === genreId) {
      // Stop preview
      previewAudioRef.current?.pause();
      setPreviewingId(null);
    } else {
      // Start preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => setPreviewingId(null);
      previewAudioRef.current = audio;
      setPreviewingId(genreId);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
    };
  }, []);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadMusicMutation.mutate({ base64, mimeType: file.type || "audio/mpeg" });
    };
    reader.onerror = () => console.error("FileReader error");
    reader.readAsDataURL(file);
  };

  const selectedGenre = MUSIC_GENRES.find((g) => g.url === data.musicUrl);

  return (
    <div className="section-card mb-6 animate-fade-in-up">
      <p
        className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-1"
        style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}
      >
        {ft.sectionMusic}
      </p>
      <p className="font-sans text-xs opacity-40 mb-4" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
        {ft.musicHint}
      </p>

      {/* Genre grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {MUSIC_GENRES.map((genre) => {
          const isSelected = data.musicUrl === genre.url;
          const isPreviewing = previewingId === genre.id;
          return (
            <div
              key={genre.id}
              style={{
                borderRadius: 10,
                border: `1.5px solid ${isSelected ? "rgba(201,168,76,0.9)" : "rgba(201,168,76,0.2)"}`,
                background: isSelected ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                padding: "10px 6px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                position: "relative",
                transition: "all 0.2s",
              }}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "rgba(201,168,76,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#1a1a2e", fontSize: 9, fontWeight: 700 }}>✓</span>
                </div>
              )}
              <span style={{ fontSize: 20 }}>{genre.emoji}</span>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, letterSpacing: "0.05em", color: isSelected ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.6)", textAlign: "center", lineHeight: 1.3 }}>
                {formLang === "ar" ? genre.nameAr : genre.name}
              </span>
              <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
                {/* Preview button */}
                <button
                  type="button"
                  onClick={() => togglePreview(genre.id, genre.url)}
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: 8, letterSpacing: "0.08em", padding: "3px 7px", borderRadius: 10, border: "1px solid rgba(201,168,76,0.4)", background: isPreviewing ? "rgba(201,168,76,0.2)" : "transparent", color: "rgba(201,168,76,0.8)", cursor: "pointer", textTransform: "uppercase" }}
                >
                  {isPreviewing ? "⏹" : "▶"}
                </button>
                {/* Select button */}
                <button
                  type="button"
                  onClick={() => {
                    set("musicUrl", isSelected ? "" : genre.url);
                    if (previewingId === genre.id) {
                      previewAudioRef.current?.pause();
                      setPreviewingId(null);
                    }
                  }}
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: 8, letterSpacing: "0.08em", padding: "3px 7px", borderRadius: 10, border: `1px solid ${isSelected ? "rgba(201,168,76,0.8)" : "rgba(201,168,76,0.4)"}`, background: isSelected ? "rgba(201,168,76,0.25)" : "transparent", color: isSelected ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.7)", cursor: "pointer", textTransform: "uppercase" }}
                >
                  {isSelected ? (formLang === "ar" ? ft.musicRemove : "Remove") : (formLang === "ar" ? ft.musicSelected : "Use")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", marginBottom: 12 }} />

      {/* Custom upload */}
      <input
        ref={musicFileRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/m4a,audio/*"
        onChange={handleMusicUpload}
        style={{ display: "none" }}
      />
      {data.musicUrl && !selectedGenre ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(201,168,76,0.6)", background: "rgba(201,168,76,0.08)" }}>
          <span style={{ fontSize: 18 }}>🎵</span>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.9)", flex: 1 }}>
            {formLang === "ar" ? "موسيقى مخصصة" : "Custom music"}
          </span>
          <button
            type="button"
            onClick={() => set("musicUrl", "")}
            style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 10, border: "1px solid rgba(201,168,76,0.4)", background: "transparent", color: "rgba(201,168,76,0.7)", cursor: "pointer", textTransform: "uppercase" }}
          >
            {ft.musicRemove}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => musicFileRef.current?.click()}
          disabled={uploadMusicMutation.isPending}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", width: "100%", border: "1.5px dashed rgba(201,168,76,0.3)", borderRadius: 10, background: "transparent", cursor: uploadMusicMutation.isPending ? "wait" : "pointer", transition: "border-color 0.2s" }}
        >
          {uploadMusicMutation.isPending ? (
            <>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(201,168,76,0.3)", borderTopColor: "rgba(201,168,76,0.9)", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.6)", letterSpacing: "0.08em" }}>{ft.musicUploading}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>⬆️</span>
              <div style={{ textAlign: formLang === "ar" ? "right" : "left" }}>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{ft.musicCustomUpload}</p>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, color: "rgba(201,168,76,0.4)", margin: "2px 0 0" }}>{ft.musicCustomHint}</p>
              </div>
            </>
          )}
        </button>
      )}
      {uploadMusicMutation.isError && (
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#e57373", marginTop: 8, textAlign: "center" }}>{ft.musicUploadFailed}</p>
      )}
    </div>
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
      <div className="flex items-center justify-between mb-3">
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

const STORAGE_KEY = "cardly-builder-draft";

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
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [draftSlug, setDraftSlug] = useState<string | null>(() => {
    try { return localStorage.getItem("cardly_draft_slug") || null; } catch { return null; }
  });
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [copied, setCopied] = useState(false);
  const { lang: formLang, setLang: setFormLang } = useLang();
  const [, navigate] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();

  // ── ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS (Rules of Hooks) ──

  // Persist draft slug across navigation (so post-Stripe-redirect can pick it up)
  useEffect(() => {
    try {
      if (draftSlug) localStorage.setItem("cardly_draft_slug", draftSlug);
      else localStorage.removeItem("cardly_draft_slug");
    } catch { /* ignore */ }
  }, [draftSlug]);

  // Read ?subscribed=1 query params after returning from Stripe subscription checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscribed = params.get("subscribed");
    if (subscribed === "1") {
      setPaymentInProgress(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (subscribed === "0") {
      toast.error(formLang === "ar" ? "تم إلغاء الاشتراك." : "Subscription cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscription status query — only runs when user is authenticated
  const subscriptionQuery = trpc.payments.getSubscriptionStatus.useQuery(undefined, {
    refetchInterval: paymentInProgress ? 3000 : false,
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
  const subscription = subscriptionQuery.data;
  const isSubscribed = !!subscription?.isActive;

  useEffect(() => {
    if (paymentInProgress && isSubscribed) {
      setPaymentInProgress(false);
      setSubscriptionChecked(true);
      toast.success(formLang === "ar" ? "مرحباً بك! اشتراكك نشط الآن." : "Welcome! Your subscription is now active.");
    }
  }, [paymentInProgress, isSubscribed, formLang]);

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [data]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Note: "create" creates a DRAFT row in the DB. We only mark `publishedSlug`
  // after the user has paid and confirms publish.
  const createMutation = trpc.invitations.create.useMutation();

  const uploadPhotoMutation = trpc.invitations.uploadPhoto.useMutation({
    onSuccess: ({ url }) => {
      setData((d) => ({ ...d, couplePhotoUrl: url }));
    },
  });

  const uploadMusicMutation = trpc.invitations.uploadMusic.useMutation({
    onSuccess: ({ url }) => {
      setData((d) => ({ ...d, musicUrl: url }));
    },
  });

  // Subscription checkout mutation
  const subscribeCheckoutMutation = trpc.payments.createSubscriptionCheckout.useMutation();
  const portalSessionMutation = trpc.payments.createPortalSession.useMutation();

  // ── Auth gate: conditional returns AFTER all hooks ───────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1e" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#d4af37", marginBottom: 16 }}>Cardly</div>
          <div style={{ width: 32, height: 32, border: "2px solid #d4af37", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0f1e", fontFamily: "'Lato', sans-serif", gap: 24, padding: 24 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#d4af37" }}>Cardly</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f5e6b3", textAlign: "center", margin: 0 }}>Sign in to create your invitation</h2>
        <p style={{ color: "rgba(245,230,179,0.6)", fontSize: 15, textAlign: "center", maxWidth: 380, margin: 0 }}>You need a free Cardly account to build and manage your digital invitation.</p>
        <a href={getLoginUrl("/create")}>
          <button style={{ background: "linear-gradient(135deg, #d4af37 0%, #f5e6b3 50%, #d4af37 100%)", color: "#0a0f1e", border: "none", borderRadius: 8, padding: "14px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: "0.06em" }}>
            Sign in to continue
          </button>
        </a>
        <a href="/" style={{ color: "rgba(245,230,179,0.5)", fontSize: 13, textDecoration: "none" }}>← Back to home</a>
      </div>
    );
  }

  // ── Helpers and derived state (safe to use after hooks) ──────────────────
  const set = (field: keyof InvitationData, value: string | number) =>
    setData((d) => ({ ...d, [field]: value }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadPhotoMutation.mutate({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => console.error("FileReader error");
    reader.readAsDataURL(file);
  };

  const ft = translations[formLang]; // form translations

  const toggleSection = (key: string) =>
    setData((d) => ({
      ...d,
      sections: { ...d.sections, [key]: !d.sections[key] },
    }));

  const validateBeforePublish = (): boolean => {
    if (!data.brideFirstName || !data.groomFirstName || !data.date) {
      toast.error(formLang === "ar" ? "يرجى ملء الأسماء والتاريخ قبل النشر." : "Please fill in names and date before publishing.");
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateBeforePublish()) return;
    if (!user) {
      toast.message(formLang === "ar" ? "يرجى تسجيل الدخول للمتابعة" : "Please sign in to continue");
      window.location.href = getLoginUrl("/");
      return;
    }
    // Must have an active subscription
    if (!isSubscribed) {
      await handleSubscribe();
      return;
    }
    // Subscription active → create and publish
    createMutation.mutate({ title: data.title || "Untitled", data });
  };

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = getLoginUrl("/");
      return;
    }
    try {
      const result = await subscribeCheckoutMutation.mutateAsync({ origin: window.location.origin });
      if (result.alreadySubscribed) {
        toast.success(formLang === "ar" ? "اشتراكك نشط بالفعل." : "Your subscription is already active.");
        subscriptionQuery.refetch();
        return;
      }
      if (result.checkoutUrl) {
        toast.message(formLang === "ar" ? "جارِ التحويل إلى صفحة الاشتراك…" : "Redirecting to subscription checkout…");
        setPaymentInProgress(true);
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      console.error("Subscribe error:", error);
      toast.error(error?.message || (formLang === "ar" ? "فشل بدء الاشتراك." : "Failed to start subscription."));
    }
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
    return <PreviewWithEnvelope data={data} onEdit={() => setPreviewing(false)} onPublish={handlePublish} isPublishing={createMutation.isPending || subscribeCheckoutMutation.isPending} onFontScaleChange={(scale) => set("fontScale", scale)} onScriptFontChange={(font) => set("scriptFont", font)} initialLang={formLang} isPaid={isSubscribed} />;
  }

  // ── Builder mode ──────────────────────────────────────────────────────────
  return (
    <div className="builder-page builder-split">
      <div className="builder-form-pane mobile-container px-4 pt-8" dir={formLang === "ar" ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          {/* User menu row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            {/* Home link */}
            <a href="/" style={{ color: "rgba(201,168,76,0.5)", fontSize: 12, textDecoration: "none", fontFamily: "'Lato', sans-serif", letterSpacing: "0.06em" }}>← {formLang === "ar" ? "الرئيسية" : "Home"}</a>
            {/* User info + sign out */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.role === "admin" && (
                <a
                  href="/admin"
                  style={{ color: "rgba(201,168,76,0.6)", fontSize: 11, textDecoration: "none", fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12, padding: "3px 10px" }}
                >
                  {formLang === "ar" ? "لوحة الإدارة" : "Admin"}
                </a>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #d4af37, #f5e6b3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#0a0f1e", flexShrink: 0 }}>
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(245,230,179,0.7)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name?.split(" ")[0]}
                </span>
                <button
                  onClick={async () => { try { await logout(); } catch {} }}
                  style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12, padding: "3px 10px", color: "rgba(201,168,76,0.6)", fontFamily: "'Lato', sans-serif", fontSize: 11, cursor: "pointer", letterSpacing: "0.06em", whiteSpace: "nowrap" }}
                >
                  {formLang === "ar" ? "تسجيل خروج" : "Sign Out"}
                </button>
              </div>
            </div>
          </div>

          <p className="font-sans text-xs uppercase tracking-widest text-gold mb-1 opacity-70" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.createYour}
          </p>
          <h1 className="font-script text-5xl gold-shimmer" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, fontSize: "2.5rem" } : {}}>
            {ft.weddingInvitation}
          </h1>
          <p className="font-sans text-xs opacity-40 mt-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.builderSubtitle}
          </p>
          {/* Language toggle — uses global LangContext so choice persists across all pages */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <LangToggle />
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

        {/* ── Subscription Status Banner ── */}
        {subscriptionQuery.data && (
          <div
            className="section-card mb-4 animate-fade-in-up"
            style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}
          >
            {isSubscribed ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <div>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.9)", margin: 0, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {formLang === "ar" ? "الاشتراك نشط" : "Active Subscription"}
                    </p>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                      {formLang === "ar"
                        ? `${subscription?.invitationsUsed ?? 0} / ${subscription?.invitationsLimit ?? 10} دعوات مستخدمة`
                        : `${subscription?.invitationsUsed ?? 0} / ${subscription?.invitationsLimit ?? 10} invitations used`}
                      {subscription?.renewsAt && ` · ${formLang === "ar" ? "يتجدد" : "Renews"} ${new Date(subscription.renewsAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const result = await portalSessionMutation.mutateAsync({ origin: window.location.origin });
                      if (result.url) window.open(result.url, "_blank");
                    } catch (e: any) {
                      toast.error(e?.message || "Could not open billing portal");
                    }
                  }}
                  disabled={portalSessionMutation.isPending}
                  style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 16, padding: "5px 14px", color: "rgba(201,168,76,0.7)", fontFamily: "'Lato', sans-serif", fontSize: 11, cursor: "pointer", letterSpacing: "0.06em" }}
                >
                  {portalSessionMutation.isPending ? "..." : (formLang === "ar" ? "إدارة الاشتراك" : "Manage")}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <div>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(255,150,100,0.9)", margin: 0, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {formLang === "ar" ? "لا يوجد اشتراك نشط" : "No Active Subscription"}
                    </p>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                      {formLang === "ar" ? "اشترك بـ 200 درهم/شهر للنشر" : "Subscribe for AED 200/month to publish"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribeCheckoutMutation.isPending}
                  style={{ background: "linear-gradient(135deg, #d4af37, #f5e6b3, #d4af37)", border: "none", borderRadius: 16, padding: "6px 16px", color: "#0a0f1e", fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}
                >
                  {subscribeCheckoutMutation.isPending ? "..." : (formLang === "ar" ? "اشترك الآن" : "Subscribe Now")}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Event Type Selector ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-4" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
            {formLang === "ar" ? "نوع الحدث" : "EVENT TYPE"}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {["wedding", "engagement", "dinner", "birthday", "corporate"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set("eventType", type)}
                className="px-3 py-2 rounded-lg font-sans text-xs uppercase tracking-widest transition-all duration-200 border-2"
                style={{
                  borderColor: data.eventType === type ? "var(--gold)" : "rgba(201,168,76,0.3)",
                  backgroundColor: data.eventType === type ? "rgba(201,168,76,0.2)" : "transparent",
                  color: data.eventType === type ? "var(--gold)" : "rgba(201,168,76,0.6)",
                }}
              >
                {formLang === "ar"
                  ? { wedding: "زفاف", engagement: "خطوبة", dinner: "عشاء", birthday: "عيد ميلاد", corporate: "شركة" }[type]
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div>
            <label className="font-sans text-xs opacity-50 block mb-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
              {formLang === "ar" ? "أو أدخل نوع حدث مخصص" : "Or enter a custom event type"}
            </label>
            <input
              className="wedding-input"
              placeholder={formLang === "ar" ? "مثال: حفلة تخرج" : "e.g. Graduation Party"}
              value={!["wedding", "engagement", "dinner", "birthday", "corporate"].includes(data.eventType) ? data.eventType : ""}
              onChange={(e) => set("eventType", e.target.value || "wedding")}
              style={formLang === "ar" ? { fontFamily: ARABIC_FONT, direction: "rtl" } : {}}
            />
          </div>
        </div>

        {/* ── Invitation Title ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-3" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
            {formLang === "ar" ? "عنوان الدعوة" : "Invitation Title"}
          </p>
          <input
            className="wedding-input"
            placeholder={formLang === "ar" ? "مثال: حفل زفاف ليلى وكريم" : "e.g. Jordan & Alex's Wedding"}
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            dir={formLang === "ar" ? "rtl" : undefined}
            style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}
          />
          <p className="font-sans text-xs opacity-30 mt-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "يظهر في لوحة الاستجابات فقط" : "Shown in your Guest Responses dashboard only"}
          </p>

          {/* Default language for guests */}
          <div style={{ marginTop: 20 }}>
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
              {formLang === "ar" ? "اللغة الافتراضية للدعوة" : "Default Invitation Language"}
            </p>
            <p className="font-sans text-xs opacity-30 mb-3" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
              {formLang === "ar" ? "اللغة التي ستفتح بها الدعوة عند أول زيارة" : "Language guests see when they first open the invitation"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["en", "ar"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set("defaultLang", l)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: `1.5px solid ${data.defaultLang === l ? "rgba(201,168,76,0.9)" : "rgba(201,168,76,0.25)"}`,
                    background: data.defaultLang === l ? "rgba(201,168,76,0.15)" : "transparent",
                    color: data.defaultLang === l ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.45)",
                    fontFamily: l === "ar" ? ARABIC_FONT : "'Lato', sans-serif",
                    fontSize: 13,
                    fontWeight: data.defaultLang === l ? 700 : 400,
                    letterSpacing: l === "en" ? "0.1em" : 0,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {l === "en" ? "🇬🇧  English" : "🇦🇪  عربي"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Couple Photo ── */}
        <div className="section-card mb-6 animate-fade-in-up">
          <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-80 mb-3" style={formLang === "ar" ? { fontFamily: ARABIC_FONT, textTransform: "none" } : {}}>
            {ft.sectionPhoto}
          </p>
          <p className="font-sans text-xs opacity-40 mb-4" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "اختياري — تظهر فوق ختم الشمع على الظرف" : "Optional — displays as a circular portrait over the wax seal"}
          </p>
          {/* Hidden file input — triggered programmatically */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />

          {data.couplePhotoUrl ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(201,168,76,0.7)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                <img src={data.couplePhotoUrl} alt="Couple" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, letterSpacing: "0.1em", padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.5)", background: "transparent", color: "rgba(201,168,76,0.8)", cursor: "pointer", textTransform: "uppercase" }}
                >
                  {uploadPhotoMutation.isPending ? (formLang === "ar" ? "جارٍ الرفع…" : "Uploading…") : (formLang === "ar" ? "تغيير الصورة" : "Change Photo")}
                </button>
                <button
                  type="button"
                  onClick={() => setData((d) => ({ ...d, couplePhotoUrl: "" }))}
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, letterSpacing: "0.1em", padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(201,168,76,0.3)", background: "transparent", color: "rgba(201,168,76,0.5)", cursor: "pointer", textTransform: "uppercase" }}
                >
                  {formLang === "ar" ? "حذف" : "Remove"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px", width: "100%", border: "2px dashed rgba(201,168,76,0.3)", borderRadius: 12, background: "transparent", cursor: uploadPhotoMutation.isPending ? "wait" : "pointer", transition: "border-color 0.2s" }}
            >
              {uploadPhotoMutation.isPending ? (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(201,168,76,0.3)", borderTopColor: "rgba(201,168,76,0.9)", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.6)", letterSpacing: "0.1em" }}>
                    {formLang === "ar" ? "جارٍ الرفع…" : "Uploading…"}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "rgba(201,168,76,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {formLang === "ar" ? "اضغط لرفع صورة" : "Tap to upload photo"}
                  </span>
                </>
              )}
            </button>
          )}
          {uploadPhotoMutation.isError && (
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#e57373", marginTop: 8, textAlign: "center" }}>
              {formLang === "ar" ? "فشل الرفع — يرجى المحاولة مرة أخرى" : "Upload failed — please try again"}
            </p>
          )}
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
        {/* ── Card: Hosting Line ── */}
        <SectionCard
          label={formLang === "ar" ? "سطر الاستضافة" : "HOSTING LINE"}
          sectionKey="showHostingLine"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          {formLang === "en" ? (
            <textarea
              className="wedding-input"
              rows={2}
              placeholder="Together with their families"
              value={data.hostingLine ?? ""}
              onChange={(e) => set("hostingLine", e.target.value)}
              style={{ resize: "vertical" }}
            />
          ) : (
            <textarea
              className="wedding-input"
              dir="rtl"
              rows={2}
              placeholder="بمشاركة عائلتيهما"
              value={data.arHostingLine ?? ""}
              onChange={(e) => set("arHostingLine", e.target.value)}
              style={{ resize: "vertical", fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}
            />
          )}
        </SectionCard>

        {/* ── Card: Bride & Groom Names ── */}
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
                  <input className="wedding-input" placeholder="e.g. Jordan" value={data.groomFirstName} onChange={(e) => set("groomFirstName", e.target.value)} />
                </div>
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Groom's Last Name</label>
                  <input className="wedding-input" placeholder="Optional" value={data.groomLastName} onChange={(e) => set("groomLastName", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-xs opacity-50 block mb-1">Bride's First Name</label>
                  <input className="wedding-input" placeholder="e.g. Alex" value={data.brideFirstName} onChange={(e) => set("brideFirstName", e.target.value)} />
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

        {/* ── Card: Welcome Message ── */}
        <SectionCard
          label={formLang === "ar" ? "رسالة الترحيب" : "WELCOME MESSAGE"}
          sectionKey="showSubHeadline"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          {formLang === "en" ? (
            <textarea
              className="wedding-input"
              rows={3}
              placeholder="request the pleasure of your company at the celebration of their marriage"
              value={data.subHeadline ?? ""}
              onChange={(e) => set("subHeadline", e.target.value)}
              style={{ resize: "vertical" }}
            />
          ) : (
            <textarea
              className="wedding-input"
              dir="rtl"
              rows={3}
              placeholder="يطلبان شرف حضوركم لمشاركتهم فرحة زفافهم"
              value={data.arSubHeadline ?? ""}
              onChange={(e) => set("arSubHeadline", e.target.value)}
              style={{ resize: "vertical", fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}
            />
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
                <input className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} placeholder="مثال: شارع الورد، بيروت" value={data.arVenueAddress ?? ""} onChange={(e) => set("arVenueAddress", e.target.value)} />
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
              <MessageSuggestionDropdown
                lang="en"
                onSelect={(v) => set("message", v)}
              />
              <textarea className="wedding-input" rows={3} placeholder="e.g. We joyfully invite you to share in our happiness as we begin our new journey together…" value={data.message} onChange={(e) => set("message", e.target.value)} />
            </>
          ) : (
            <div dir="rtl">
              <label className="font-sans text-xs opacity-50 block mb-1" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}>رسالة إلى الضيوف</label>
              <MessageSuggestionDropdown
                lang="ar"
                onSelect={(v) => set("arMessage", v)}
              />
              <textarea className="wedding-input" dir="rtl" style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }} rows={3} placeholder="مثال: يسعدنا دعوتكم لمشاركتنا فرحة زفافنا…" value={data.arMessage ?? ""} onChange={(e) => set("arMessage", e.target.value)} />
            </div>
          )}
        </SectionCard>

        {/* ── Section: Event Program ── */}
        <SectionCard
          label={ft.sectionProgram}
          sectionKey="program"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <p className="font-sans text-xs opacity-50 mb-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {ft.programHint}
          </p>
          {formLang === "en" ? (
            <textarea
              className="wedding-input"
              rows={6}
              placeholder={ft.programPlaceholder}
              value={data.eventProgram ?? ""}
              onChange={(e) => set("eventProgram", e.target.value)}
            />
          ) : (
            <textarea
              className="wedding-input"
              dir="rtl"
              style={{ fontFamily: `'Noto Naskh Arabic', 'Amiri', serif` }}
              rows={6}
              placeholder={ft.programPlaceholder}
              value={data.arEventProgram ?? ""}
              onChange={(e) => set("arEventProgram", e.target.value)}
            />
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

        {/* ── Section: Reply Deadline ── */}
        <SectionCard
          label={formLang === "ar" ? "آخر موعد للتأكيد" : "REPLY DEADLINE"}
          sectionKey="rsvp"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <label className="font-sans text-xs opacity-50 block mb-1" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar" ? "يُرجى التأكيد قبل" : "Please Confirm before"}
          </label>
          <input
            type="date"
            className="wedding-input"
            value={data.rsvpDeadline ?? ""}
            onChange={(e) => set("rsvpDeadline", e.target.value)}
          />
          <p className="font-sans text-xs opacity-40 mt-2" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar"
              ? "بعد هذا التاريخ سيظهر للضيوف رسالة “تم إغلاق باب التأكيد” بدلاً من نموذج التسجيل."
              : "After this date, guests will see \"Responses are now closed\" instead of the reply form."}
          </p>
        </SectionCard>

        {/* ── Section: Falling Flowers & Stars ── */}
        <SectionCard
          label={formLang === "ar" ? "زهور ونجوم متساقطة" : "FALLING FLOWERS & STARS"}
          sectionKey="particles"
          sections={data.sections}
          onToggle={toggleSection}
          hiddenText={formLang === "ar" ? "القسم مخفي — اضغط للتفعيل" : undefined}
          labelFont={formLang === "ar" ? ARABIC_FONT : undefined}
        >
          <p className="font-sans text-xs opacity-50" style={formLang === "ar" ? { fontFamily: ARABIC_FONT } : {}}>
            {formLang === "ar"
              ? "زهور ونجوم صغيرة تتساقط بلطف أثناء قراءة الدعوة."
              : "Tiny flowers 🌸 and stars ✨ gently fall as guests read the invitation."}
          </p>
        </SectionCard>

        {/* ── Section: Music ── */}
        <MusicSection data={data} set={set} formLang={formLang} uploadMusicMutation={uploadMusicMutation} />

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 mt-6 pb-24">
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
            {createMutation.isPending || subscribeCheckoutMutation.isPending
              ? (formLang === "ar" ? "جارس النشر…" : "Publishing…")
              : isSubscribed
              ? (formLang === "ar" ? "تخطي المعاينة والنشر" : "Skip Preview & Publish")
              : (formLang === "ar" ? "اشترك وانشر - 200 درهم/شهر" : "Subscribe & Publish - AED 200/mo")}
          </button>
        </div>
      </div>

      {/* Desktop Sticky Live Preview Pane (right side) */}
      <aside className="builder-preview-pane" aria-label="Live Preview">
        <div className="builder-preview-header">
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: "rgba(201,168,76,0.7)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
            👁 {formLang === "ar" ? "معاينة مباشرة" : "Live Preview"}
          </span>
          <span style={{ fontFamily: formLang === "ar" ? ARABIC_FONT : "'Lato', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", marginInlineStart: 12 }}>
            {formLang === "ar" ? "تحديث فوري" : "Updates instantly"}
          </span>
        </div>
        <div className="builder-preview-body">
          <LivePreviewContent data={data} lang={formLang} isPaid={isSubscribed} />
        </div>
      </aside>

      {/* Mobile Floating Live Preview Button (shown only on small screens) */}
      <button
        className="builder-preview-mobile-btn"
        onClick={() => setLivePreviewOpen(true)}
        aria-label={formLang === "ar" ? "معاينة مباشرة" : "Live Preview"}
      >
        <span style={{ fontSize: 16 }}>👁</span>
        {formLang === "ar" ? "معاينة مباشرة" : "Live Preview"}
      </button>

      {/* Live Preview Side Panel */}
      {livePreviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 200ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          onClick={() => setLivePreviewOpen(false)}
        >
          <div
            style={{
              width: "min(440px, 100vw)",
              height: "100vh",
              background: "#1a1424",
              borderLeft: "1px solid rgba(201,168,76,0.3)",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
              animation: "slideInRight 280ms cubic-bezier(0.23, 1, 0.32, 1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(201,168,76,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                background: "rgba(0,0,0,0.4)",
              }}
            >
              <div>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: "rgba(201,168,76,0.6)", letterSpacing: "0.15em", margin: 0, textTransform: "uppercase" }}>
                  {formLang === "ar" ? "معاينة مباشرة" : "Live Preview"}
                </p>
                <p style={{ fontFamily: formLang === "ar" ? ARABIC_FONT : "'Lato', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                  {formLang === "ar" ? "تحديث فوري" : "Updates instantly as you type"}
                </p>
              </div>
              <button
                onClick={() => setLivePreviewOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  border: "1px solid rgba(201,168,76,0.4)",
                  background: "transparent",
                  color: "rgba(201,168,76,0.9)",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Live Preview Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative", background: "#1a1424" }}>
              <LivePreviewContent data={data} lang={formLang} isPaid={isSubscribed} />
            </div>
          </div>
        </div>
      )}

      {/* Inject animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}


// Shared toolbar button style
const btnTool: React.CSSProperties = {
  fontFamily: "'Lato',sans-serif",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  padding: '5px 9px',
  borderRadius: 20,
  border: '1px solid rgba(201,168,76,0.5)',
  background: 'transparent',
  color: 'rgba(201,168,76,0.9)',
  cursor: 'pointer',
  flexShrink: 0,
  whiteSpace: 'nowrap' as const,
};

// ── Preview With Envelope (full guest experience in preview mode) ────────────
function PreviewWithEnvelope({
  data,
  onEdit,
  onPublish,
  isPublishing,
  onFontScaleChange,
  onScriptFontChange,
  initialLang = "en",
  isPaid = false,
}: {
  data: InvitationData;
  onEdit: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  onFontScaleChange: (scale: number) => void;
  onScriptFontChange: (font: string) => void;
  initialLang?: Lang;
  isPaid?: boolean;
}) {
  const [animStage, setAnimStage] = useState<"idle" | "opening" | "expand" | "done">("idle");
  const [showInvitation, setShowInvitation] = useState(false);
  const [lang, setLang] = useState<Lang>(initialLang);
  const toggleLang = () => setLang((l) => l === "en" ? "ar" : "en");
  const sceneRef = useRef<HTMLDivElement>(null);

  // Local overrides so font/scale changes re-render the preview immediately
  const [localScriptFont, setLocalScriptFont] = useState<string | undefined>(data.scriptFont);
  const [localFontScale, setLocalFontScale] = useState<number>(data.fontScale ?? 1);
  const previewData: InvitationData = { ...data, scriptFont: localScriptFont, fontScale: localFontScale };

  // Music state — mirrors InvitationView exactly
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showVolumeHint, setShowVolumeHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Stop music when leaving preview
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

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
    setAnimStage("opening");

    // Start music if selected — mirrors InvitationView behaviour
    if (data.musicUrl) {
      try {
        if (!audioRef.current) {
          const audio = new Audio(data.musicUrl);
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
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }, 500);
    }, 2000);
  };

  const resetEnvelope = () => {
    // Stop music when going back to envelope
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setShowVolumeHint(false);
    setAnimStage("idle");
    setShowInvitation(false);
  };

  return (
    <div className="builder-page" style={{ position: "relative" }}>
      {/* Floating banner — compact mobile-first bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(10,8,24,0.92)", borderBottom: "1px solid rgba(201,168,76,0.2)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>

          {/* ── Left: font size A−/A+ ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => { const v = Math.max(0.8, Math.round((localFontScale - 0.05) * 100) / 100); setLocalFontScale(v); onFontScaleChange(v); }}
              title="Decrease font size"
              style={btnTool}
            >A−</button>
            <span style={{ fontSize: 9, color: "rgba(201,168,76,0.5)", minWidth: 26, textAlign: "center", fontFamily: "'Lato',sans-serif" }}>{Math.round(localFontScale * 100)}%</span>
            <button
              onClick={() => { const v = Math.min(1.4, Math.round((localFontScale + 0.05) * 100) / 100); setLocalFontScale(v); onFontScaleChange(v); }}
              title="Increase font size"
              style={btnTool}
            >A+</button>
          </div>

          {/* ── Centre: font picker ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <select
              value={localScriptFont ?? (lang === "ar" ? "Amiri" : "Cormorant Garamond")}
              onChange={(e) => { setLocalScriptFont(e.target.value); onScriptFontChange(e.target.value); }}
              style={{
                width: "100%",
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.35)",
                borderRadius: 20,
                color: "rgba(201,168,76,0.95)",
                fontSize: 11,
                padding: "4px 10px",
                fontFamily: `'${localScriptFont ?? (lang === "ar" ? "Amiri" : "Cormorant Garamond")}', serif`,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                textAlign: "center",
              }}
            >
              {(lang === "ar" ? SCRIPT_FONTS_AR : SCRIPT_FONTS_EN).map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', serif`, background: "#0a0818", color: "#c9a84c" }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Right: EN/AR · 💌 · ✏️ · Publish ── */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
            <button onClick={toggleLang} style={{ ...btnTool, fontFamily: lang === "ar" ? "'Noto Naskh Arabic',serif" : "'Lato',sans-serif", minWidth: 32 }}>
              {lang === "en" ? "عربي" : "EN"}
            </button>
            {showInvitation && (
              <button onClick={resetEnvelope} title="Back to envelope" style={btnTool}>💌</button>
            )}
            <button onClick={onEdit} title="Back to editor" style={btnTool}>✏️</button>
            <button
              onClick={onPublish}
              disabled={isPublishing}
              style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, letterSpacing: "0.1em", padding: "5px 12px", borderRadius: 20, background: "linear-gradient(135deg,#c9a84c,#e8d48b)", color: "#1a1a2e", border: "none", cursor: "pointer", fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}
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

          {/* Couple portrait — circular photo overlapping the wax seal (only when photo is set) */}
          {data.couplePhotoUrl && (
            <div
              className={`fs-wax-seal ${isOpen ? "open" : ""}`}
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                zIndex: 21,
              }}
            >
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${envStyle.theme.accent}`, boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 3px ${envStyle.theme.accentLight}55` }}>
                <img src={data.couplePhotoUrl} alt="Couple" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          )}

          {/* Expand overlay — fades to theme background before invitation appears */}
          <div
            className="fs-expand-overlay"
            style={{ opacity: isExpanding ? 1 : 0, transition: "opacity 0.5s ease", background: envStyle.theme.bg }}
          />

          {/* Tap hint — animated gold pill button (mirrors InvitationView exactly) */}
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
      )}

      {/* Invitation content after envelope opens */}
      {showInvitation && (
        <div
          className={isPaid ? undefined : "cardly-unpaid-watermark"}
          onContextMenu={isPaid ? undefined : (e) => e.preventDefault()}
          style={{ "--font-scale": localFontScale, paddingTop: 56 } as React.CSSProperties}
        >
          <div className="mobile-container">
            <PreviewContent data={previewData} lang={lang} onToggleLang={toggleLang} blurSensitive={!isPaid} />
          </div>
        </div>
      )}

      {/* Volume hint banner — same as InvitationView */}
      {showInvitation && data.musicUrl && showVolumeHint && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 300,
            background: `${envStyle.theme.bgSecondary}ee`,
            border: `1px solid ${envStyle.theme.accent}66`,
            borderRadius: 24,
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>🔊</span>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, letterSpacing: "0.08em", color: envStyle.theme.accent }}>
            {lang === "ar" ? "ارفع مستوى الصوت" : "Turn up your volume"}
          </span>
        </div>
      )}

      {/* Play / Pause floating button — same as InvitationView */}
      {showInvitation && data.musicUrl && (
        <button
          onClick={togglePlayPause}
          title={isPlaying ? (lang === "ar" ? "إيقاف مؤقت" : "Pause music") : (lang === "ar" ? "تشغيل الموسيقى" : "Play music")}
          style={{
            position: "fixed",
            bottom: 24,
            right: 14,
            zIndex: 300,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `${envStyle.theme.bgSecondary}ee`,
            border: `1px solid ${envStyle.theme.accent}66`,
            color: envStyle.theme.accent,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
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
function PreviewContent({ data, lang = "en", onToggleLang, blurSensitive = false }: { data: InvitationData; lang?: Lang; onToggleLang?: () => void; blurSensitive?: boolean; }) {
  const blurClass = blurSensitive ? "cardly-blur-protected" : "";
  const t = translations[lang];
  const isRtl = lang === "ar";
  const scriptFont = data.scriptFont ?? (isRtl ? "Amiri" : "Cormorant Garamond");
  const bodyFontChoice = data.bodyFontChoice ?? (isRtl ? "Noto Naskh Arabic" : "Lato");
  const bodyFont = isRtl ? (data.bodyFontChoice ?? ARABIC_FONT) : (data.bodyFontChoice ?? undefined);

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

  const fontScale = (data as { fontScale?: number }).fontScale ?? 1.0;

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
      {data.sections.particles !== false && <FallingParticles />}

      {/* Hero / Names */}
      {data.sections.names && (
        <div className="invitation-section stagger" style={{ paddingTop: 12, paddingBottom: 8 }}>
          {data.sections.showHostingLine !== false && (
            <p className="font-sans text-xs uppercase tracking-widest text-gold opacity-70 animate-fade-in-up" style={{ fontFamily: `'${scriptFont}', serif`, whiteSpace: "pre-line" }}>
              {(isRtl ? (data.arHostingLine || t.togetherWith) : (data.hostingLine || t.togetherWith))}
            </p>
          )}
          <div className="my-2 animate-fade-in-up">
            <h1 className="gold-shimmer leading-tight" style={{ fontFamily: `'${scriptFont}', serif`, fontSize: `calc(clamp(2.5rem, 12vw, 3.5rem) * ${fontScale})` }}>
              {groomName || "Groom"}
            </h1>
            <p className="font-serif italic text-gold opacity-60 my-1" style={{ fontFamily: `'${scriptFont}', serif`, fontSize: `calc(1.5rem * ${fontScale})` }}>
              &amp;
            </p>
            <h1 className="gold-shimmer leading-tight" style={{ fontFamily: `'${scriptFont}', serif`, fontSize: `calc(clamp(2.5rem, 12vw, 3.5rem) * ${fontScale})` }}>
              {brideName || "Bride"}
            </h1>
          </div>
          <div className="divider-ornament" style={{ margin: "6px 0" }}>
            <span className="text-gold text-lg">✦</span>
          </div>
          {data.sections.showSubHeadline !== false && (
            <p className="font-serif italic opacity-60 mt-1 animate-fade-in-up" style={{ fontFamily: `'${bodyFontChoice}', sans-serif`, fontSize: `calc(clamp(1.05rem, 3.5vw, 1.2rem) * ${fontScale})` }}>
              {(isRtl ? (data.arSubHeadline || t.requestPleasure) : (data.subHeadline || t.requestPleasure))}
            </p>
          )}
        </div>
      )}

      {/* Date */}
      {data.sections.date && (
        <div className="invitation-section py-3">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {t.dateLabel}
          </p>
          <p className="font-serif text-cream" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {formattedDate || "Sunday, 24 May 2026"}
          </p>
        </div>
      )}

      {/* Time */}
      {data.sections.time && (
        <div className="invitation-section py-3">
          <p className="font-sans uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {t.dateLabel}
          </p>
          <p className={`font-serif text-cream ${blurClass}`} style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {formattedTime || "9:00 PM"}
          </p>
        </div>
      )}

      {/* Venue */}
      {data.sections.venue && (
        <div className="invitation-section py-3">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans uppercase tracking-widest text-gold opacity-60 mb-2" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {t.venueLabel}
          </p>
          <p className="font-serif text-cream" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {displayVenueName || "Grand Ballroom"}
          </p>
          <p className={`font-sans opacity-50 mt-1 ${blurClass}`} style={{ fontFamily: bodyFont, fontSize: `calc(0.875rem * ${fontScale})` }}>
            {displayVenueAddress || "123 Rose Avenue, London, UK"}
          </p>
        </div>
      )}

      {/* Message */}
      {data.sections.message && displayMessage && (
        <div className="invitation-section py-3 px-8">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">✦</span>
          </div>
          <p className={`font-serif italic opacity-80 leading-relaxed ${blurClass}`} style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.05rem, 3.5vw, 1.2rem) * ${fontScale})` }}>
            "{displayMessage}"
          </p>
        </div>
      )}

      {/* Countdown */}
      {data.sections.countdown && data.date && (
        <div className="invitation-section py-3">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">❧</span>
          </div>
          <CountdownTimer targetDate={data.date} label={t.countdownLabel} bodyFont={bodyFont} isRtl={isRtl} />
        </div>
      )}

      {/* Map */}
      {data.sections.map && mapSrc && (
        <div className="invitation-section py-3 px-4">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans uppercase tracking-widest text-gold opacity-60 mb-4" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
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

      {/* RSVP Preview */}
      {data.sections.rsvp && (
        <div className="invitation-section py-6">
          <div className="divider-ornament mb-3">
            <span className="text-gold text-sm">❧</span>
          </div>
          <p className="font-sans uppercase tracking-widest text-gold opacity-60 mb-4" style={{ fontFamily: bodyFont, fontSize: `calc(clamp(1.1rem, 4vw, 1.3rem) * ${fontScale})` }}>
            {isRtl ? "تأكيد الحضور" : "RSVP"}
          </p>
          {data.rsvpDeadline && (() => {
            const deadline = new Date(data.rsvpDeadline);
            const now = new Date();
            const passed = now > deadline;
            const diffMs = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: bodyFont, fontSize: 13, color: theme.accent, opacity: 0.8, marginBottom: 4 }}>
                  {isRtl ? `يُرجى التأكيد قبل ${deadline.toLocaleDateString("ar-AE")}` : `Please confirm before ${deadline.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                </p>
                {!passed && diffDays > 0 && (
                  <p style={{ fontFamily: bodyFont, fontSize: 12, color: theme.text, opacity: 0.5 }}>
                    {isRtl ? `متبقي ${diffDays} يوم` : `${diffDays} day${diffDays !== 1 ? "s" : ""} remaining`}
                  </p>
                )}
                {passed && (
                  <p style={{ fontFamily: bodyFont, fontSize: 12, color: theme.accentSecondary, opacity: 0.8 }}>
                    {isRtl ? "تم إغلاق باب التأكيد" : "Responses are now closed"}
                  </p>
                )}
              </div>
            );
          })()}
          <div
            style={{
              background: theme.bgSecondary,
              borderRadius: 16,
              padding: "24px 20px",
              border: `1px solid ${theme.accent}33`,
              textAlign: isRtl ? "right" : "left",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.accent, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: bodyFont }}>
                {isRtl ? "اسمك" : "Your Name"}
              </label>
              <div style={{ background: theme.bg, border: `1px solid ${theme.accent}44`, borderRadius: 8, padding: "10px 14px", color: theme.text, opacity: 0.4, fontSize: 14, fontFamily: bodyFont }}>
                {isRtl ? "اكتب اسمك هنا" : "Enter your name"}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.accent, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: bodyFont }}>
                {isRtl ? "رقم الجوال" : "Mobile Number"}
              </label>
              <div style={{ background: theme.bg, border: `1px solid ${theme.accent}44`, borderRadius: 8, padding: "10px 14px", color: theme.text, opacity: 0.4, fontSize: 14, fontFamily: bodyFont }}>
                {isRtl ? "رقم الجوال" : "e.g. 050 123 4567"}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.accent, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, fontFamily: bodyFont }}>
                {isRtl ? "هل ستحضر؟" : "Will you attend?"}
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${theme.accent}66`, textAlign: "center", color: theme.accent, fontSize: 13, fontFamily: bodyFont }}>
                  {isRtl ? "✅ سأحضر" : "✅ Attending"}
                </div>
                <div style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${theme.accent}33`, textAlign: "center", color: theme.text, opacity: 0.5, fontSize: 13, fontFamily: bodyFont }}>
                  {isRtl ? "❌ لن أحضر" : "❌ Can't Attend"}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "block",
                width: "100%",
                padding: "14px 0",
                borderRadius: 50,
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                color: theme.buttonText,
                fontFamily: bodyFont ?? "'Lato', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textAlign: "center",
                textTransform: "uppercase",
                boxShadow: `0 4px 16px ${theme.accent}44`,
                opacity: 0.85,
              }}
            >
              {isRtl ? "إرسال التأكيد" : "Send Reply"}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="invitation-section py-8">
        <div className="divider-ornament mb-6">
          <span className="text-gold text-lg">✦</span>
        </div>
        <p className="font-script gold-shimmer" style={{ fontSize: `calc(clamp(1.5rem, 6vw, 2rem) * ${fontScale})` }}>
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

function CountdownTimer({ targetDate, label = "Counting Down", bodyFont, isRtl }: { targetDate: string; label?: string; bodyFont?: string; isRtl?: boolean }) {
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
      <div className="flex justify-center gap-6">
        {[
          { value: timeLeft.days, label: isRtl ? "أيام" : "Days" },
          { value: timeLeft.hours, label: isRtl ? "ساعات" : "Hours" },
          { value: timeLeft.minutes, label: isRtl ? "دقائق" : "Mins" },
          { value: timeLeft.seconds, label: isRtl ? "ثواني" : "Secs" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div
              className="font-serif text-4xl font-light flex items-center justify-center rounded-lg"
              style={{ color: "var(--gold)", border: "1px solid var(--gold-dark)", background: "var(--bg-secondary, transparent)", width: 80, height: 80, padding: "0 12px" }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <p className="font-sans text-xs opacity-40 mt-2" style={{ letterSpacing: isRtl ? 0 : "0.1em", textTransform: isRtl ? "none" : "uppercase", fontFamily: isRtl ? "'Noto Naskh Arabic', serif" : undefined }}>
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


// ── Live Preview Content (used by floating preview side panel) ──────────────
function LivePreviewContent({ data, lang, isPaid = false }: { data: InvitationData; lang: Lang; isPaid?: boolean }) {
  const envStyle = ENVELOPE_STYLES.find((s) => s.id === (data.envelopeStyle ?? "ivory-gold")) ?? ENVELOPE_STYLES[0];
  const fontScale = data.fontScale ?? 1;
  // Block right-click on unpaid preview
  const handleContextMenu = isPaid ? undefined : (e: React.MouseEvent) => { e.preventDefault(); };
  return (
    <div
      className={isPaid ? undefined : "cardly-unpaid-watermark"}
      onContextMenu={handleContextMenu}
      style={{
        width: "100%",
        minHeight: "100%",
        background: envStyle.theme.bg,
        color: envStyle.theme.text,
        ["--font-scale" as string]: fontScale,
      } as React.CSSProperties}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="mobile-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <PreviewContent data={data} lang={lang} blurSensitive={!isPaid} />
      </div>
    </div>
  );
}
