import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function RsvpDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const { data: overview, isLoading: overviewLoading } = trpc.rsvp.getAllSlugs.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: detail, isLoading: detailLoading } = trpc.rsvp.getBySlug.useQuery(
    { slug: selectedSlug! },
    { enabled: !!selectedSlug }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F172A" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F172A" }}>
        <div className="text-center px-8">
          <p className="font-script text-4xl mb-4" style={{ color: "#D4AF37" }}>Private Area</p>
          <p className="font-sans text-sm mb-6" style={{ color: "#E5C07B", opacity: 0.7 }}>
            Please sign in to view RSVP responses.
          </p>
          <a
            href={getLoginUrl()}
            style={{
              display: "inline-block",
              padding: "12px 32px",
              background: "linear-gradient(135deg, #A88A1A, #D4AF37)",
              color: "#0F172A",
              borderRadius: 50,
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.1em",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const totalGuests = overview?.slugs.reduce((sum, s) => sum + s.totalGuests, 0) ?? 0;
  const totalResponses = overview?.slugs.reduce((sum, s) => sum + s.responseCount, 0) ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#0F172A", color: "#E5C07B" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #D4AF3722", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#D4AF37", fontWeight: 300 }}>
            RSVP Responses
          </p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#E5C07B", opacity: 0.5, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            LoveNote Dashboard
          </p>
        </div>
        <a
          href="/"
          style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 12,
            color: "#D4AF37",
            opacity: 0.7,
            textDecoration: "none",
            letterSpacing: "0.08em",
          }}
        >
          ← Back to Builder
        </a>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Confirmed Guests", value: totalGuests, icon: "👥" },
            { label: "Total Responses", value: totalResponses, icon: "✉️" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              style={{
                background: "#1E293B",
                border: "1px solid #D4AF3733",
                borderRadius: 12,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "#D4AF37", fontWeight: 300, lineHeight: 1 }}>
                {overviewLoading ? "—" : value}
              </div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#E5C07B", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Per-invitation list */}
        {overviewLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
          </div>
        ) : overview?.slugs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#E5C07B", opacity: 0.5 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>No invitations yet</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, marginTop: 8 }}>Create and publish an invitation first.</p>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#D4AF37", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Invitations
            </p>
            {overview?.slugs.map((inv) => (
              <div key={inv.slug}>
                <button
                  onClick={() => setSelectedSlug(selectedSlug === inv.slug ? null : inv.slug)}
                  style={{
                    width: "100%",
                    background: selectedSlug === inv.slug ? "#1E293B" : "transparent",
                    border: `1px solid ${selectedSlug === inv.slug ? "#D4AF37" : "#D4AF3733"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#D4AF37", fontWeight: 400 }}>
                      {inv.title}
                    </p>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: "#E5C07B", opacity: 0.5, marginTop: 2 }}>
                      /{inv.slug} · {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#D4AF37" }}>
                      {inv.totalGuests}
                    </p>
                    <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: "#E5C07B", opacity: 0.5, textTransform: "uppercase" }}>
                      {inv.responseCount} {inv.responseCount === 1 ? "reply" : "replies"}
                    </p>
                  </div>
                </button>

                {/* Expanded guest list */}
                {selectedSlug === inv.slug && (
                  <div
                    style={{
                      background: "#0B1120",
                      border: "1px solid #D4AF3722",
                      borderTop: "none",
                      borderRadius: "0 0 10px 10px",
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    {detailLoading ? (
                      <div style={{ padding: 24, textAlign: "center" }}>
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4AF37", borderTopColor: "transparent" }} />
                      </div>
                    ) : detail?.responses.length === 0 ? (
                      <p style={{ padding: "16px 20px", fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#E5C07B", opacity: 0.4 }}>
                        No responses yet.
                      </p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #D4AF3722" }}>
                            {["Guest Name", "Party Size", "Message", "Date"].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: "10px 16px",
                                  textAlign: "left",
                                  fontFamily: "'Lato', sans-serif",
                                  fontSize: 10,
                                  color: "#D4AF37",
                                  opacity: 0.6,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  fontWeight: 600,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail?.responses.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #D4AF3711" }}>
                              <td style={{ padding: "12px 16px", fontFamily: "'Lato', sans-serif", fontSize: 14, color: "#E5C07B" }}>
                                {r.guestName}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#D4AF37", textAlign: "center" }}>
                                {r.partySize}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: "'Lato', sans-serif", fontSize: 13, color: "#E5C07B", opacity: 0.6, maxWidth: 200 }}>
                                {r.message || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", fontFamily: "'Lato', sans-serif", fontSize: 12, color: "#E5C07B", opacity: 0.4, whiteSpace: "nowrap" }}>
                                {new Date(r.createdAt).toLocaleDateString("en-GB")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
