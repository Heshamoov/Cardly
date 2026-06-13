import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";
import { Heart, Sparkles, Mail, Lock, User } from "lucide-react";

const t = {
  en: {
    signIn: "Welcome back",
    signUp: "Create your account",
    signInSub: "Sign in to manage your invitations",
    signUpSub: "Start creating beautiful digital invitations",
    emailLabel: "Email address",
    passwordLabel: "Password",
    nameLabel: "Full name",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "At least 6 characters",
    namePlaceholder: "Your name",
    loginBtn: "Sign In",
    registerBtn: "Create Account",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    switchToRegister: "Create one",
    switchToLogin: "Sign in",
    tagline: "Your event,\nbeautifully delivered.",
    subTagline:
      "Create stunning digital invitations with animated envelopes, bilingual support, live venue maps, and RSVP collection — all in one link.",
    errorInvalid: "Invalid email or password.",
    errorGeneral: "Something went wrong. Please try again.",
    successLogin: "Welcome back!",
    successRegister: "Account created! Welcome to Cardly.",
    passwordMin: "Password must be at least 6 characters.",
    feature1: "Animated envelopes",
    feature2: "Arabic & English",
    feature3: "Live RSVP tracking",
    backHome: "Back to home",
  },
  ar: {
    signIn: "مرحباً بعودتك",
    signUp: "إنشاء حسابك",
    signInSub: "سجّل دخولك لإدارة دعواتك",
    signUpSub: "ابدأ بإنشاء دعوات رقمية جميلة",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    nameLabel: "الاسم الكامل",
    emailPlaceholder: "example@email.com",
    passwordPlaceholder: "6 أحرف على الأقل",
    namePlaceholder: "اسمك",
    loginBtn: "تسجيل الدخول",
    registerBtn: "إنشاء حساب",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    switchToRegister: "أنشئ حساباً",
    switchToLogin: "تسجيل الدخول",
    tagline: "مناسبتك،\nتُقدَّم بجمال.",
    subTagline:
      "أنشئ دعوات رقمية مذهلة مع مظاريف متحركة، ودعم ثنائي اللغة، وخرائط حية، وتتبع الحضور — كل ذلك في رابط واحد.",
    errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errorGeneral: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    successLogin: "مرحباً بعودتك!",
    successRegister: "تم إنشاء الحساب! مرحباً بك في Cardly.",
    passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    feature1: "مظاريف متحركة",
    feature2: "عربي وإنجليزي",
    feature3: "تتبع الحضور مباشرة",
    backHome: "العودة إلى الرئيسية",
  },
};

type GoogleGSI = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: { theme: string; size: string; width: number; text: string }
      ) => void;
    };
  };
};

declare global {
  interface Window {
    googleGSI?: GoogleGSI;
  }
}

export default function Login() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const tr = t[lang] ?? t.en;
  const isRTL = lang === "ar";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const returnPath = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("returnPath") || "/create";
  })();

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(tr.successLogin);
      navigate(returnPath);
    },
    onError: (err) => toast.error(err.message || tr.errorInvalid),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(tr.successRegister);
      navigate(returnPath);
    },
    onError: (err) => toast.error(err.message || tr.errorGeneral),
  });

  const googleSignInMutation = trpc.auth.googleSignIn.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(tr.successLogin);
      navigate(returnPath);
    },
    onError: (err) => toast.error(err.message || tr.errorGeneral),
  });

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;
    const scriptId = "google-gsi-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).googleGSI = (window as any).google;
        initGoogle();
      };
      document.head.appendChild(script);
    } else if ((window as any).google) {
      (window as any).googleGSI = (window as any).google;
      initGoogle();
    }
    function initGoogle() {
      const el = document.getElementById("google-signin-btn");
      if (!window.googleGSI || !el) return;
      window.googleGSI.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential: string }) => {
          googleSignInMutation.mutate({ idToken: response.credential });
        },
      });
      window.googleGSI.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (mode === "register") {
      if (password.length < 6) { toast.error(tr.passwordMin); return; }
      setLoading(true);
      try { await registerMutation.mutateAsync({ name, email, password }); }
      finally { setLoading(false); }
    } else {
      setLoading(true);
      try { await loginMutation.mutateAsync({ email, password }); }
      finally { setLoading(false); }
    }
  };

  const isBusy = loading || loginMutation.isPending || registerMutation.isPending;

  return (
    <>
      {/* Responsive CSS */}
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: #0a0f1e;
          direction: ${isRTL ? "rtl" : "ltr"};
        }
        .login-left {
          display: none;
          width: 50%;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0d1528 0%, #0a0f1e 50%, #12192e 100%);
          border-right: 1px solid rgba(201,168,76,0.15);
          flex-shrink: 0;
        }
        @media (min-width: 1024px) {
          .login-left { display: flex; }
        }
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          min-height: 100vh;
        }
        @media (min-width: 1024px) {
          .login-right { padding: 2rem 5rem; }
        }
        .login-form-inner {
          width: 100%;
          max-width: 400px;
        }
        .login-input {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #fff !important;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.25) !important; }
        .login-input:focus { border-color: rgba(201,168,76,0.5) !important; }
        .login-mobile-logo { display: block; margin-bottom: 2rem; }
        @media (min-width: 1024px) { .login-mobile-logo { display: none; } }
      `}</style>

      <div className="login-page">

        {/* ── Left: Branding ── */}
        <div className="login-left">
          {/* Glow */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 50% at 30% 60%, rgba(201,168,76,0.07) 0%, transparent 70%)"
          }} />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <a href="/">
              <img src="/manus-storage/cardly-logo-v4_5f2425c5.png" alt="Cardly" style={{ height: "34px", width: "auto" }} />
            </a>
          </div>

          {/* Tagline */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              color: "#c9a84c",
              lineHeight: 1.25,
              whiteSpace: "pre-line",
              marginBottom: "1.25rem",
            }}>
              {tr.tagline}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", lineHeight: 1.75, maxWidth: "360px", marginBottom: "1.5rem" }}>
              {tr.subTagline}
            </p>
            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {[tr.feature1, tr.feature2, tr.feature3].map((f) => (
                <span key={f} style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.35rem 0.75rem", borderRadius: "9999px",
                  background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
                  color: "#c9a84c", fontSize: "0.75rem", fontWeight: 500,
                }}>
                  <Sparkles size={11} />
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Sample card */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              borderRadius: "1rem", padding: "1.25rem",
              background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
              maxWidth: "300px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Heart size={13} style={{ color: "#c9a84c" }} />
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>SAMPLE INVITATION</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Ahmad & Sara's Wedding</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>Saturday, 15 November 2025 · Abu Dhabi</p>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>47 guests confirmed</span>
                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(74,222,128,0.12)", color: "#4ade80", fontSize: "0.7rem" }}>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Form ── */}
        <div className="login-right">
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <a href="/">
              <img src="/manus-storage/cardly-logo-v4_5f2425c5.png" alt="Cardly" style={{ height: "30px", width: "auto" }} />
            </a>
          </div>

          <div className="login-form-inner">
            {/* Heading */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                {mode === "login" ? tr.signIn : tr.signUp}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
                {mode === "login" ? tr.signInSub : tr.signUpSub}
              </p>
            </div>

            {/* Google Sign-In */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div id="google-signin-btn" style={{ display: "flex", justifyContent: "center" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mode === "register" && (
                <div>
                  <Label htmlFor="name" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                    {tr.nameLabel}
                  </Label>
                  <div style={{ position: "relative" }}>
                    <User size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                    <Input id="name" type="text" placeholder={tr.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} required className="login-input" style={{ paddingLeft: "2.25rem" }} />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                  {tr.emailLabel}
                </Label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                  <Input id="email" type="email" placeholder={tr.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required className="login-input" style={{ paddingLeft: "2.25rem" }} />
                </div>
              </div>

              <div>
                <Label htmlFor="password" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", display: "block", marginBottom: "0.4rem" }}>
                  {tr.passwordLabel}
                </Label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                  <Input id="password" type="password" placeholder={tr.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} required className="login-input" style={{ paddingLeft: "2.25rem" }} />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isBusy}
                style={{
                  width: "100%", height: "2.75rem", fontWeight: 600, marginTop: "0.25rem",
                  background: isBusy ? "rgba(201,168,76,0.5)" : "#c9a84c",
                  color: "#0a0f1e", border: "none", borderRadius: "0.5rem",
                  cursor: isBusy ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {isBusy ? "..." : mode === "login" ? tr.loginBtn : tr.registerBtn}
              </Button>
            </form>

            {/* Switch mode */}
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)" }}>
              {mode === "login" ? tr.noAccount : tr.hasAccount}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                style={{ color: "#c9a84c", fontWeight: 500, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                {mode === "login" ? tr.switchToRegister : tr.switchToLogin}
              </button>
            </p>

            {/* Back to home */}
            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
                ← {tr.backHome}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
