import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useLang } from "@/contexts/LangContext";

const t = {
  en: {
    signIn: "Sign In",
    signUp: "Create Account",
    emailLabel: "Email",
    passwordLabel: "Password",
    nameLabel: "Full Name",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "Your name",
    loginBtn: "Sign In",
    registerBtn: "Create Account",
    googleBtn: "Continue with Google",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    switchToRegister: "Create one",
    switchToLogin: "Sign in",
    tagline: "Your event, beautifully delivered.",
    errorInvalid: "Invalid email or password.",
    errorExists: "An account with this email already exists.",
    errorGeneral: "Something went wrong. Please try again.",
    successLogin: "Welcome back!",
    successRegister: "Account created! Welcome to Cardly.",
    passwordMin: "Password must be at least 6 characters.",
    googleNotConfigured: "Google Sign-In is not configured yet.",
  },
  ar: {
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    nameLabel: "الاسم الكامل",
    emailPlaceholder: "example@email.com",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "اسمك",
    loginBtn: "تسجيل الدخول",
    registerBtn: "إنشاء حساب",
    googleBtn: "المتابعة مع Google",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    switchToRegister: "أنشئ حساباً",
    switchToLogin: "تسجيل الدخول",
    tagline: "مناسبتك، تُقدَّم بجمال.",
    errorInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    errorExists: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
    errorGeneral: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    successLogin: "مرحباً بعودتك!",
    successRegister: "تم إنشاء الحساب! مرحباً بك في Cardly.",
    passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    googleNotConfigured: "لم يتم تكوين تسجيل الدخول عبر Google بعد.",
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
      prompt: () => void;
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

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Get returnPath from URL query string
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
    onError: (err) => {
      toast.error(err.message || tr.errorInvalid);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(tr.successRegister);
      navigate(returnPath);
    },
    onError: (err) => {
      toast.error(err.message || tr.errorGeneral);
    },
  });

  const googleSignInMutation = trpc.auth.googleSignIn.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success(tr.successLogin);
      navigate(returnPath);
    },
    onError: (err) => {
      toast.error(err.message || tr.errorGeneral);
    },
  });

  // Load Google Sign-In script and render button
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
        // Google GSI loads as window.google but we access it via a typed alias
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
      if (password.length < 6) {
        toast.error(tr.passwordMin);
        return;
      }
      setLoading(true);
      try {
        await registerMutation.mutateAsync({ name, email, password });
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await loginMutation.mutateAsync({ email, password });
      } finally {
        setLoading(false);
      }
    }
  };

  const isRTL = lang === "ar";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0a0f1e] px-4 py-12"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#c9a84c]/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img
              src="/manus-storage/cardly-logo-v4_5f2425c5.png"
              alt="Cardly"
              className="h-10 mx-auto"
            />
          </a>
          <p className="text-[#c9a84c]/70 text-sm mt-3">{tr.tagline}</p>
        </div>

        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-xl">
              {mode === "login" ? tr.signIn : tr.signUp}
            </CardTitle>
            <CardDescription className="text-white/50 text-sm">
              {mode === "login" ? tr.noAccount : tr.hasAccount}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-[#c9a84c] hover:underline font-medium"
              >
                {mode === "login" ? tr.switchToRegister : tr.switchToLogin}
              </button>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Sign-In button (rendered by Google GSI) */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div id="google-signin-btn" className="flex justify-center" />
                <div className="flex items-center gap-3">
                  <Separator className="flex-1 bg-white/10" />
                  <span className="text-white/30 text-xs">or</span>
                  <Separator className="flex-1 bg-white/10" />
                </div>
              </>
            )}

            {/* Email / Password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-white/70 text-sm">
                    {tr.nameLabel}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={tr.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a84c]/50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-sm">
                  {tr.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={tr.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a84c]/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm">
                  {tr.passwordLabel}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={tr.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#c9a84c]/50"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || loginMutation.isPending || registerMutation.isPending}
                className="w-full bg-[#c9a84c] hover:bg-[#b8973b] text-[#0a0f1e] font-semibold h-11 transition-all active:scale-[0.97]"
              >
                {loading || loginMutation.isPending || registerMutation.isPending
                  ? "..."
                  : mode === "login"
                  ? tr.loginBtn
                  : tr.registerBtn}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to home */}
        <p className="text-center mt-6 text-white/30 text-sm">
          <a href="/" className="hover:text-white/60 transition-colors">
            ← {lang === "ar" ? "العودة إلى الرئيسية" : "Back to home"}
          </a>
        </p>
      </div>
    </div>
  );
}
