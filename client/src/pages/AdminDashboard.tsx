import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLang, LangToggle } from "@/contexts/LangContext";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "overview" | "subscribers" | "invitations" | "promoCodes" | "users";

const T = {
  en: {
    title: "Admin Dashboard",
    tabs: { overview: "Overview", subscribers: "Subscribers", invitations: "Invitations", promoCodes: "Promo Codes", users: "Users" },
    overview: {
      mrr: "Monthly Revenue (AED)",
      active: "Active Subscribers",
      canceled: "Canceled",
      pastDue: "Past Due",
      totalInvitations: "Total Invitations",
      totalUsers: "Total Users",
      totalRsvps: "Total RSVPs",
    },
    subscribers: {
      name: "Name", email: "Email", status: "Status", used: "Used", renewsAt: "Renews At", since: "Since", stripeId: "Stripe Sub ID",
    },
    invitations: {
      title: "Title", slug: "Slug", owner: "Owner", views: "Views", created: "Created", link: "Link",
    },
    promoCodes: {
      code: "Code", discount: "Discount", redeemed: "Redeemed", maxUses: "Max Uses", expires: "Expires", status: "Status",
      createNew: "Create Promo Code",
      codePlaceholder: "e.g. WELCOME50",
      percentOff: "% Off",
      amountOff: "AED Off",
      maxRedemptions: "Max Redemptions",
      expiresInDays: "Expires In (days)",
      name: "Label (optional)",
      create: "Create",
      deactivate: "Deactivate",
      active: "Active",
      inactive: "Inactive",
    },
    users: {
      name: "Name", email: "Email", role: "Role", joined: "Joined", lastSeen: "Last Seen",
      access: "Access", lifetime: "Lifetime", paid: "Paid", free: "Free",
      grant: "Grant lifetime", revoke: "Revoke",
      grantConfirm: "Grant free lifetime (unlimited) access to this user?",
      revokeConfirm: "Revoke lifetime access from this user? They will need a paid subscription afterwards.",
      granted: "Lifetime access granted", revoked: "Lifetime access revoked",
    },
    noData: "No data yet.",
    loading: "Loading...",
    backHome: "← Back",
    forbidden: "Access Denied",
    forbiddenMsg: "You do not have admin access.",
  },
  ar: {
    title: "لوحة تحكم المدير",
    tabs: { overview: "نظرة عامة", subscribers: "المشتركون", invitations: "الدعوات", promoCodes: "أكواد الخصم", users: "المستخدمون" },
    overview: {
      mrr: "الإيرادات الشهرية (درهم)",
      active: "المشتركون النشطون",
      canceled: "ملغى",
      pastDue: "متأخر السداد",
      totalInvitations: "إجمالي الدعوات",
      totalUsers: "إجمالي المستخدمين",
      totalRsvps: "إجمالي الردود",
    },
    subscribers: {
      name: "الاسم", email: "البريد", status: "الحالة", used: "مستخدم", renewsAt: "تجديد في", since: "منذ", stripeId: "معرف Stripe",
    },
    invitations: {
      title: "العنوان", slug: "الرابط", owner: "المالك", views: "المشاهدات", created: "تاريخ الإنشاء", link: "رابط",
    },
    promoCodes: {
      code: "الكود", discount: "الخصم", redeemed: "مستخدم", maxUses: "الحد الأقصى", expires: "ينتهي", status: "الحالة",
      createNew: "إنشاء كود خصم",
      codePlaceholder: "مثال: WELCOME50",
      percentOff: "خصم %",
      amountOff: "خصم بالدرهم",
      maxRedemptions: "الحد الأقصى للاستخدام",
      expiresInDays: "ينتهي خلال (أيام)",
      name: "تسمية (اختياري)",
      create: "إنشاء",
      deactivate: "تعطيل",
      active: "نشط",
      inactive: "غير نشط",
    },
    users: {
      name: "الاسم", email: "البريد", role: "الدور", joined: "تاريخ الانضمام", lastSeen: "آخر زيارة",
      access: "الوصول", lifetime: "مدى الحياة", paid: "مدفوع", free: "مجاني",
      grant: "منح وصول دائم", revoke: "إلغاء",
      grantConfirm: "منح هذا المستخدم وصولاً مجانياً دائماً (غير محدود)؟",
      revokeConfirm: "إلغاء الوصول الدائم لهذا المستخدم؟ سيحتاج إلى اشتراك مدفوع بعد ذلك.",
      granted: "تم منح الوصول الدائم", revoked: "تم إلغاء الوصول الدائم",
    },
    noData: "لا توجد بيانات بعد.",
    loading: "جارٍ التحميل...",
    backHome: "رجوع ←",
    forbidden: "وصول مرفوض",
    forbiddenMsg: "ليس لديك صلاحية الوصول إلى لوحة المدير.",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  if (s === "active") return "#22c55e";
  if (s === "canceled") return "#ef4444";
  if (s === "past_due") return "#f59e0b";
  return "#94a3b8";
};

const fmt = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { lang, isAr, dir, bodyFont, scriptFont } = useLang();
  const t = T[lang];
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  // Promo code form state
  const [promoCode, setPromoCode] = useState("");
  const [promoType, setPromoType] = useState<"percent" | "amount">("percent");
  const [promoValue, setPromoValue] = useState("");
  const [promoMax, setPromoMax] = useState("");
  const [promoDays, setPromoDays] = useState("");
  const [promoName, setPromoName] = useState("");

  // tRPC queries
  const statsQ = trpc.admin.getStats.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const subsQ = trpc.admin.getAllSubscribers.useQuery(undefined, { enabled: tab === "subscribers" && !!user && user.role === "admin" });
  const invsQ = trpc.admin.getAllInvitations.useQuery(undefined, { enabled: tab === "invitations" && !!user && user.role === "admin" });
  const promoQ = trpc.admin.listPromoCodes.useQuery(undefined, { enabled: tab === "promoCodes" && !!user && user.role === "admin" });
  const usersQ = trpc.admin.getAllUsers.useQuery(undefined, { enabled: tab === "users" && !!user && user.role === "admin" });

  const createPromoMut = trpc.admin.createPromoCode.useMutation({
    onSuccess: (data) => {
      toast.success(`Promo code "${data.code}" created!`);
      promoQ.refetch();
      setPromoCode(""); setPromoValue(""); setPromoMax(""); setPromoDays(""); setPromoName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMut = trpc.admin.deactivatePromoCode.useMutation({
    onSuccess: () => { toast.success("Promo code deactivated"); promoQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const grantLifetimeMut = trpc.admin.grantLifetimeAccess.useMutation({
    onSuccess: () => { toast.success(t.users.granted); usersQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const revokeLifetimeMut = trpc.admin.revokeLifetimeAccess.useMutation({
    onSuccess: () => { toast.success(t.users.revoked); usersQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const pendingOpenId =
    (grantLifetimeMut.isPending ? grantLifetimeMut.variables?.openId : undefined) ??
    (revokeLifetimeMut.isPending ? revokeLifetimeMut.variables?.openId : undefined);

  if (authLoading) return <LoadingScreen font={bodyFont} msg={t.loading} dir={dir} />;
  if (!user || user.role !== "admin") {
    return (
      <div dir={dir} style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: bodyFont, gap: 12 }}>
        <h1 style={{ fontFamily: scriptFont, color: "#d4af37", fontSize: 32 }}>{t.forbidden}</h1>
        <p style={{ opacity: 0.6 }}>{t.forbiddenMsg}</p>
        <Link href="/" style={{ color: "#d4af37", textDecoration: "none", marginTop: 16 }}>{t.backHome}</Link>
      </div>
    );
  }

  const handleCreatePromo = () => {
    if (!promoCode.trim()) return toast.error("Enter a promo code");
    if (!promoValue || isNaN(Number(promoValue))) return toast.error("Enter a valid discount value");
    createPromoMut.mutate({
      code: promoCode.trim().toUpperCase(),
      ...(promoType === "percent" ? { percentOff: Number(promoValue) } : { amountOffAed: Number(promoValue) }),
      ...(promoMax ? { maxRedemptions: Number(promoMax) } : {}),
      ...(promoDays ? { expiresInDays: Number(promoDays) } : {}),
      ...(promoName ? { name: promoName } : {}),
    });
  };

  const TABS: Tab[] = ["overview", "subscribers", "invitations", "promoCodes", "users"];

  return (
    <div dir={dir} style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", fontFamily: bodyFont }}>
      {/* Nav */}
      <nav style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(212,175,55,0.18)", position: "sticky", top: 0, background: "#0a0f1e", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontFamily: scriptFont, fontSize: 22, fontWeight: 700, color: "#d4af37", textDecoration: "none" }}>YalaInvite</Link>
          <span style={{ opacity: 0.3, fontSize: 18 }}>|</span>
          <span style={{ fontSize: 13, opacity: 0.6, fontFamily: bodyFont }}>{t.title}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <LangToggle />
          <Link href="/" style={{ fontSize: 13, color: "rgba(245,230,179,0.5)", textDecoration: "none" }}>{t.backHome}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: "1px solid rgba(212,175,55,0.12)", paddingBottom: 0, flexWrap: "wrap" }}>
          {TABS.map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 18px",
                fontSize: 13, fontFamily: bodyFont,
                color: tab === t_ ? "#d4af37" : "rgba(245,230,179,0.5)",
                borderBottom: tab === t_ ? "2px solid #d4af37" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t.tabs[t_]}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div>
            {statsQ.isLoading ? <p style={{ opacity: 0.5 }}>{t.loading}</p> : statsQ.data ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                <KpiCard label={t.overview.mrr} value={`AED ${statsQ.data.mrr.toLocaleString()}`} accent="#d4af37" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.active} value={statsQ.data.subscribers.active} accent="#22c55e" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.canceled} value={statsQ.data.subscribers.canceled} accent="#ef4444" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.pastDue} value={statsQ.data.subscribers.pastDue} accent="#f59e0b" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.totalInvitations} value={statsQ.data.totalInvitations} accent="#818cf8" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.totalUsers} value={statsQ.data.totalUsers} accent="#38bdf8" font={bodyFont} scriptFont={scriptFont} />
                <KpiCard label={t.overview.totalRsvps} value={statsQ.data.totalRsvps} accent="#fb7185" font={bodyFont} scriptFont={scriptFont} />
              </div>
            ) : null}
          </div>
        )}

        {/* ── Subscribers ── */}
        {tab === "subscribers" && (
          <TableSection loading={subsQ.isLoading} noData={!subsQ.data?.length} noDataMsg={t.noData} loadingMsg={t.loading}>
            <TableHead cols={[t.subscribers.name, t.subscribers.email, t.subscribers.status, t.subscribers.used, t.subscribers.renewsAt, t.subscribers.since]} font={bodyFont} />
            <tbody>
              {subsQ.data?.map((s) => (
                <tr key={s.subId} style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                  <Td font={bodyFont}>{s.userName ?? "—"}</Td>
                  <Td font={bodyFont}>{s.userEmail ?? "—"}</Td>
                  <Td font={bodyFont}><StatusBadge status={s.status} font={bodyFont} /></Td>
                  <Td font={bodyFont}>{s.invitationsUsed} / {s.invitationsLimit}</Td>
                  <Td font={bodyFont}>{fmt(s.currentPeriodEnd)}</Td>
                  <Td font={bodyFont}>{fmt(s.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </TableSection>
        )}

        {/* ── Invitations ── */}
        {tab === "invitations" && (
          <TableSection loading={invsQ.isLoading} noData={!invsQ.data?.length} noDataMsg={t.noData} loadingMsg={t.loading}>
            <TableHead cols={[t.invitations.title, t.invitations.slug, t.invitations.owner, t.invitations.views, t.invitations.created, t.invitations.link]} font={bodyFont} />
            <tbody>
              {invsQ.data?.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                  <Td font={bodyFont}>{inv.title}</Td>
                  <Td font={bodyFont}><code style={{ fontSize: 11, opacity: 0.7 }}>{inv.slug}</code></Td>
                  <Td font={bodyFont}>{inv.userName ?? inv.userEmail ?? inv.ownerOpenId?.slice(0, 8) ?? "—"}</Td>
                  <Td font={bodyFont}>{inv.views}</Td>
                  <Td font={bodyFont}>{fmt(inv.createdAt)}</Td>
                  <Td font={bodyFont}>
                    <a href={`/invite/${inv.slug}`} target="_blank" rel="noreferrer" style={{ color: "#d4af37", fontSize: 12 }}>↗</a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableSection>
        )}

        {/* ── Promo Codes ── */}
        {tab === "promoCodes" && (
          <div>
            {/* Create form */}
            <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 12, padding: 24, marginBottom: 32 }}>
              <h3 style={{ fontFamily: scriptFont, color: "#d4af37", fontSize: 20, marginBottom: 20 }}>{t.promoCodes.createNew}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
                <Field label={t.promoCodes.code} font={bodyFont}>
                  <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={t.promoCodes.codePlaceholder} style={inputStyle} />
                </Field>
                <Field label="Type" font={bodyFont}>
                  <select value={promoType} onChange={(e) => setPromoType(e.target.value as "percent" | "amount")} style={inputStyle}>
                    <option value="percent">{t.promoCodes.percentOff}</option>
                    <option value="amount">{t.promoCodes.amountOff}</option>
                  </select>
                </Field>
                <Field label={promoType === "percent" ? t.promoCodes.percentOff : t.promoCodes.amountOff} font={bodyFont}>
                  <input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} placeholder={promoType === "percent" ? "50" : "100"} style={inputStyle} />
                </Field>
                <Field label={t.promoCodes.maxRedemptions} font={bodyFont}>
                  <input type="number" value={promoMax} onChange={(e) => setPromoMax(e.target.value)} placeholder="∞" style={inputStyle} />
                </Field>
                <Field label={t.promoCodes.expiresInDays} font={bodyFont}>
                  <input type="number" value={promoDays} onChange={(e) => setPromoDays(e.target.value)} placeholder="30" style={inputStyle} />
                </Field>
                <Field label={t.promoCodes.name} font={bodyFont}>
                  <input value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder="Summer Sale" style={inputStyle} />
                </Field>
              </div>
              <button
                onClick={handleCreatePromo}
                disabled={createPromoMut.isPending}
                style={{ marginTop: 20, background: "#d4af37", color: "#0a0f1e", border: "none", borderRadius: 8, padding: "10px 28px", fontFamily: bodyFont, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: createPromoMut.isPending ? 0.6 : 1 }}
              >
                {createPromoMut.isPending ? "..." : t.promoCodes.create}
              </button>
            </div>

            {/* List */}
            <TableSection loading={promoQ.isLoading} noData={!promoQ.data?.length} noDataMsg={t.noData} loadingMsg={t.loading}>
              <TableHead cols={[t.promoCodes.code, t.promoCodes.discount, t.promoCodes.redeemed, t.promoCodes.maxUses, t.promoCodes.expires, t.promoCodes.status, ""]} font={bodyFont} />
              <tbody>
                {promoQ.data?.map((pc: any) => (
                  <tr key={pc.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                    <Td font={bodyFont}><code style={{ fontSize: 13, color: "#d4af37", fontWeight: 700 }}>{pc.code}</code></Td>
                    <Td font={bodyFont}>{pc.percentOff ? `${pc.percentOff}%` : pc.amountOff ? `AED ${(pc.amountOff / 100).toFixed(0)}` : "—"}</Td>
                    <Td font={bodyFont}>{pc.timesRedeemed}</Td>
                    <Td font={bodyFont}>{pc.maxRedemptions ?? "∞"}</Td>
                    <Td font={bodyFont}>{pc.expiresAt ? fmt(pc.expiresAt) : "Never"}</Td>
                    <Td font={bodyFont}><StatusBadge status={pc.active ? "active" : "inactive"} font={bodyFont} /></Td>
                    <Td font={bodyFont}>
                      {pc.active && (
                        <button
                          onClick={() => deactivateMut.mutate({ promoCodeId: pc.id })}
                          style={{ background: "none", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", fontFamily: bodyFont }}
                        >
                          {t.promoCodes.deactivate}
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableSection>
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <TableSection loading={usersQ.isLoading} noData={!usersQ.data?.length} noDataMsg={t.noData} loadingMsg={t.loading}>
            <TableHead cols={[t.users.name, t.users.email, t.users.role, t.users.access, t.users.joined, t.users.lastSeen, ""]} font={bodyFont} />
            <tbody>
              {usersQ.data?.map((u) => {
                const busy = pendingOpenId === u.openId;
                return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.06)" }}>
                  <Td font={bodyFont}>{u.name ?? "—"}</Td>
                  <Td font={bodyFont}>{u.email ?? "—"}</Td>
                  <Td font={bodyFont}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: u.role === "admin" ? "rgba(212,175,55,0.15)" : "rgba(148,163,184,0.1)", color: u.role === "admin" ? "#d4af37" : "#94a3b8", fontFamily: bodyFont }}>
                      {u.role}
                    </span>
                  </Td>
                  <Td font={bodyFont}>
                    {u.hasLifetimeAccess ? (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(212,175,55,0.18)", color: "#d4af37", fontFamily: bodyFont }}>
                        ★ {t.users.lifetime}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(148,163,184,0.1)", color: "#94a3b8", fontFamily: bodyFont }}>
                        {t.users.free}
                      </span>
                    )}
                  </Td>
                  <Td font={bodyFont}>{fmt(u.createdAt)}</Td>
                  <Td font={bodyFont}>{fmt(u.lastSignedIn)}</Td>
                  <Td font={bodyFont}>
                    {u.hasLifetimeAccess ? (
                      <button
                        disabled={busy}
                        onClick={() => { if (window.confirm(t.users.revokeConfirm)) revokeLifetimeMut.mutate({ openId: u.openId }); }}
                        style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.4)", background: "transparent", color: "#f87171", cursor: busy ? "default" : "pointer", fontFamily: bodyFont, opacity: busy ? 0.5 : 1 }}
                      >
                        {busy ? "…" : t.users.revoke}
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => { if (window.confirm(t.users.grantConfirm)) grantLifetimeMut.mutate({ openId: u.openId }); }}
                        style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)", color: "#d4af37", cursor: busy ? "default" : "pointer", fontFamily: bodyFont, opacity: busy ? 0.5 : 1 }}
                      >
                        {busy ? "…" : t.users.grant}
                      </button>
                    )}
                  </Td>
                </tr>
              );})}
            </tbody>
          </TableSection>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, accent, font, scriptFont }: { label: string; value: string | number; accent: string; font: string; scriptFont: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}22`, borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ fontSize: 12, opacity: 0.55, fontFamily: font, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: scriptFont, fontSize: 32, color: accent, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TableSection({ loading, noData, noDataMsg, loadingMsg, children }: { loading: boolean; noData: boolean; noDataMsg: string; loadingMsg: string; children: React.ReactNode }) {
  if (loading) return <p style={{ opacity: 0.5 }}>{loadingMsg}</p>;
  if (noData) return <p style={{ opacity: 0.5 }}>{noDataMsg}</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function TableHead({ cols, font }: { cols: string[]; font: string }) {
  return (
    <thead>
      <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
        {cols.map((c) => (
          <th key={c} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, opacity: 0.5, fontFamily: font, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

function Td({ children, font }: { children: React.ReactNode; font: string }) {
  return <td style={{ padding: "10px 14px", fontFamily: font, verticalAlign: "middle" }}>{children}</td>;
}

function StatusBadge({ status, font }: { status: string; font: string }) {
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${statusColor(status)}18`, color: statusColor(status), fontFamily: font }}>
      {status}
    </span>
  );
}

function Field({ label, children, font }: { label: string; children: React.ReactNode; font: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, opacity: 0.55, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

function LoadingScreen({ font, msg, dir }: { font: string; msg: string; dir: string }) {
  return (
    <div dir={dir} style={{ background: "#0a0f1e", color: "#f5e6b3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <p style={{ opacity: 0.5 }}>{msg}</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#f5e6b3",
  fontSize: 13,
  width: "100%",
  outline: "none",
};
