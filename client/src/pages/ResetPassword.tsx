import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { Lock, CheckCircle2, AlertTriangle } from "lucide-react";

const t = {
  en: {
    title: "Choose a new password",
    sub: "Enter a new password for your Cardly account.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    placeholder: "At least 6 characters",
    submit: "Reset password",
    successTitle: "Password updated",
    successSub: "Your password has been changed. You can now sign in with your new password.",
    goToLogin: "Go to sign in",
    mismatch: "Passwords do not match.",
    tooShort: "Password must be at least 6 characters.",
    missingToken: "This reset link is missing or invalid.",
    requestNew: "Request a new link",
    general: "Something went wrong. Please try again.",
  },
  ar: {
    title: "اختر كلمة مرور جديدة",
    sub: "أدخل كلمة مرور جديدة لحسابك في Cardly.",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    placeholder: "6 أحرف على الأقل",
    submit: "إعادة تعيين كلمة المرور",
    successTitle: "تم تحديث كلمة المرور",
    successSub: "تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    goToLogin: "الذهاب لتسجيل الدخول",
    mismatch: "كلمتا المرور غير متطابقتين.",
    tooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    missingToken: "رابط إعادة التعيين مفقود أو غير صالح.",
    requestNew: "اطلب رابطاً جديداً",
    general: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
};

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const tr = t[lang] ?? t.en;
  const isRTL = lang === "ar";

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => toast.error(err.message || tr.general),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetMutation.isPending) return;
    if (password.length < 6) { toast.error(tr.tooShort); return; }
    if (password !== confirm) { toast.error(tr.mismatch); return; }
    if (!token) { toast.error(tr.missingToken); return; }
    await resetMutation.mutateAsync({ token, newPassword: password });
  };

  return (
    <>
      <style>{`
        .reset-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: #0a0f1e;
          direction: ${isRTL ? "rtl" : "ltr"};
        }
        .reset-card {
          width: 100%;
          max-width: 420px;
          background: linear-gradient(135deg, #0d1528 0%, #0a0f1e 100%);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 1rem;
          padding: 2.5rem 2rem;
        }
        .reset-input {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }
        .reset-input::placeholder { color: rgba(255,255,255,0.25) !important; }
        .reset-input:focus { border-color: rgba(201,168,76,0.5) !important; }
      `}</style>

      <div className="reset-page">
        <div className="reset-card">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <a href="/">
              <img src="/manus-storage/cardly-logo-v4_5f2425c5.png" alt="Cardly" style={{ height: "30px", width: "auto" }} />
            </a>
          </div>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <CheckCircle2 size={48} style={{ color: "#4ade80" }} />
              </div>
              <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.5rem" }}>{tr.successTitle}</h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{tr.successSub}</p>
              <Button onClick={() => navigate("/login")} style={{ width: "100%", height: "2.75rem", fontWeight: 600, background: "#c9a84c", color: "#0a0f1e", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
                {tr.goToLogin}
              </Button>
            </div>
          ) : !token ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <AlertTriangle size={44} style={{ color: "#c9a84c" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{tr.missingToken}</p>
              <Button onClick={() => navigate("/login")} style={{ width: "100%", height: "2.75rem", fontWeight: 600, background: "#c9a84c", color: "#0a0f1e", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
                {tr.requestNew}
              </Button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
                <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.35rem" }}>{tr.title}</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>{tr.sub}</p>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <Label htmlFor="new-password" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>{tr.newPassword}</Label>
                  <div style={{ position: "relative" }}>
                    <Lock size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                    <Input id="new-password" type="password" placeholder={tr.placeholder} value={password} onChange={(e) => setPassword(e.target.value)} required className="reset-input" style={{ paddingLeft: "2.25rem" }} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>{tr.confirmPassword}</Label>
                  <div style={{ position: "relative" }}>
                    <Lock size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                    <Input id="confirm-password" type="password" placeholder={tr.placeholder} value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="reset-input" style={{ paddingLeft: "2.25rem" }} />
                  </div>
                </div>
                <Button type="submit" disabled={resetMutation.isPending} style={{ width: "100%", height: "2.75rem", fontWeight: 600, marginTop: "0.25rem", background: resetMutation.isPending ? "rgba(201,168,76,0.5)" : "#c9a84c", color: "#0a0f1e", border: "none", borderRadius: "0.5rem", cursor: resetMutation.isPending ? "not-allowed" : "pointer" }}>
                  {resetMutation.isPending ? "..." : tr.submit}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
