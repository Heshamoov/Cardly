import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

const ROTATE_INTERVAL = 6000; // ms per message

interface WallMessage {
  id: number;
  guestName: string;
  message: string;
  attending: boolean;
  partySize: number;
  createdAt: Date;
}

export default function WishesWall() {
  const [, params] = useRoute("/wall/:slug");
  const slug = params?.slug ?? "";

  const { data, isLoading, error } = trpc.rsvp.getWallMessages.useQuery(
    { slug },
    { enabled: !!slug, refetchInterval: 30000 } // auto-refresh every 30s for live events
  );

  const messages: WallMessage[] = (data?.messages ?? []) as WallMessage[];

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-rotate
  useEffect(() => {
    if (messages.length < 2) return;
    timerRef.current = setInterval(() => {
      advance();
    }, ROTATE_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [messages.length, current]);

  // Reset to first when messages load
  useEffect(() => {
    setCurrent(0);
  }, [messages.length]);

  const advance = () => {
    setDirection("out");
    setAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % messages.length);
      setDirection("in");
      setTimeout(() => setAnimating(false), 600);
    }, 500);
  };

  const goTo = (idx: number) => {
    if (idx === current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setDirection("out");
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setDirection("in");
      setTimeout(() => setAnimating(false), 600);
    }, 400);
  };

  const msg = messages[current];

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={styles.root}>
        <StarField />
        <div style={styles.center}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.root}>
        <StarField />
        <div style={styles.center}>
          <p style={{ ...styles.emptyTitle, color: "#ef4444" }}>Could not load messages.</p>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div style={styles.root}>
        <StarField />
        <div style={styles.center}>
          <div style={styles.emptyIcon}>💌</div>
          <p style={styles.emptyTitle}>No wishes to display yet.</p>
          <p style={styles.emptyHint}>
            Approve messages in the Guest Responses dashboard to show them here.
          </p>
        </div>
      </div>
    );
  }

  // ── Main display ─────────────────────────────────────────────────────────────
  const isAr = /[\u0600-\u06FF]/.test(msg?.message ?? "") || /[\u0600-\u06FF]/.test(msg?.guestName ?? "");

  return (
    <div style={styles.root} onClick={advance}>
      <StarField />

      {/* Decorative top ornament */}
      <div style={styles.ornamentTop}>
        <span style={styles.ornamentLine} />
        <span style={styles.ornamentDiamond}>◆</span>
        <span style={styles.ornamentLine} />
      </div>

      {/* Counter */}
      <div style={styles.counter}>
        {current + 1} / {messages.length}
      </div>

      {/* Message card */}
      <div
        style={{
          ...styles.cardWrap,
          opacity: animating ? 0 : 1,
          transform: animating
            ? direction === "out" ? "translateY(-30px) scale(0.97)" : "translateY(30px) scale(0.97)"
            : "translateY(0) scale(1)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Quote mark */}
        <div style={styles.quoteOpen}>"</div>

        {/* Message text */}
        {msg?.message ? (
          <p style={{
            ...styles.messageText,
            fontFamily: isAr ? "'Amiri', serif" : "'Cormorant Garamond', serif",
            fontSize: isAr ? "clamp(1.4rem, 4vw, 2.8rem)" : "clamp(1.3rem, 3.5vw, 2.6rem)",
            direction: isAr ? "rtl" : "ltr",
          }}>
            {msg.message}
          </p>
        ) : (
          <p style={{ ...styles.messageText, opacity: 0.4, fontStyle: "italic" }}>
            (No message left)
          </p>
        )}

        {/* Closing quote */}
        <div style={styles.quoteClose}>"</div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerStar}>✦</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Guest name */}
        <p style={{
          ...styles.guestName,
          fontFamily: isAr ? "'Amiri', serif" : "'Lato', sans-serif",
          direction: isAr ? "rtl" : "ltr",
        }}>
          {msg?.guestName}
          {msg?.attending && msg?.partySize > 1 && (
            <span style={styles.partyBadge}> &amp; {msg.partySize - 1} more</span>
          )}
        </p>
      </div>

      {/* Dot navigation */}
      <div style={styles.dots}>
        {messages.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); goTo(idx); }}
            style={{
              ...styles.dot,
              background: idx === current ? "#D4AF37" : "rgba(212,175,55,0.25)",
              transform: idx === current ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Tap hint */}
      <p style={styles.tapHint}>Tap anywhere to advance</p>

      {/* Decorative bottom ornament */}
      <div style={styles.ornamentBottom}>
        <span style={styles.ornamentLine} />
        <span style={styles.ornamentDiamond}>◆</span>
        <span style={styles.ornamentLine} />
      </div>
    </div>
  );
}

// ── Starfield background ──────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.4,
    delay: Math.random() * 4,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "#D4AF37",
            opacity: s.opacity,
            animation: `wallStarPulse 3s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg, #0A0F1E 0%, #0F172A 50%, #0A0F1E 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    userSelect: "none",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 1,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "2px solid rgba(212,175,55,0.3)",
    borderTopColor: "#D4AF37",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "1.8rem",
    color: "#D4AF37",
    textAlign: "center",
    margin: 0,
  },
  emptyHint: {
    fontFamily: "'Lato', sans-serif",
    fontSize: "0.9rem",
    color: "rgba(229,192,123,0.5)",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
  },
  ornamentTop: {
    position: "absolute",
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
    width: "min(400px, 80vw)",
  },
  ornamentBottom: {
    position: "absolute",
    bottom: 60,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
    width: "min(400px, 80vw)",
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
    display: "block",
  },
  ornamentDiamond: {
    color: "rgba(212,175,55,0.5)",
    fontSize: 10,
    flexShrink: 0,
  },
  counter: {
    position: "absolute",
    top: 28,
    right: 24,
    fontFamily: "'Lato', sans-serif",
    fontSize: 12,
    color: "rgba(212,175,55,0.4)",
    letterSpacing: "0.1em",
    zIndex: 1,
  },
  cardWrap: {
    zIndex: 1,
    width: "min(680px, 92vw)",
    textAlign: "center",
    padding: "0 8px",
  },
  quoteOpen: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(5rem, 12vw, 9rem)",
    color: "rgba(212,175,55,0.15)",
    lineHeight: 0.6,
    marginBottom: 8,
    display: "block",
  },
  quoteClose: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(5rem, 12vw, 9rem)",
    color: "rgba(212,175,55,0.15)",
    lineHeight: 0.3,
    marginTop: 8,
    display: "block",
  },
  messageText: {
    color: "#F5E6B3",
    lineHeight: 1.65,
    fontStyle: "italic",
    fontWeight: 400,
    margin: "0 auto",
    maxWidth: 600,
    textShadow: "0 2px 20px rgba(212,175,55,0.15)",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "28px auto",
    width: "min(200px, 50vw)",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(212,175,55,0.3)",
    display: "block",
  },
  dividerStar: {
    color: "#D4AF37",
    fontSize: 12,
    flexShrink: 0,
  },
  guestName: {
    fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
    color: "#D4AF37",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: 0,
  },
  partyBadge: {
    fontWeight: 400,
    opacity: 0.6,
    fontSize: "0.8em",
    letterSpacing: "0.06em",
  },
  dots: {
    display: "flex",
    gap: 8,
    marginTop: 40,
    zIndex: 1,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "80vw",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.3s ease",
  },
  tapHint: {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    fontFamily: "'Lato', sans-serif",
    fontSize: 11,
    color: "rgba(212,175,55,0.3)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    zIndex: 1,
    whiteSpace: "nowrap",
  },
};
