import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "ar";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isAr: boolean;
  dir: "ltr" | "rtl";
  /** Body font — Arabic or Latin */
  bodyFont: string;
  /** Script / display font */
  scriptFont: string;
}

const STORAGE_KEY = "cardly_lang";
const ARABIC_BODY = "'Noto Naskh Arabic', 'Amiri', serif";
const ARABIC_SCRIPT = "'Amiri', serif";
const LATIN_BODY = "'Lato', sans-serif";
const LATIN_SCRIPT = "'Cormorant Garamond', serif";

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  isAr: false,
  dir: "ltr",
  bodyFont: LATIN_BODY,
  scriptFont: LATIN_SCRIPT,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ar" || stored === "en") return stored;
    } catch {}
    return "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  // Sync <html> dir attribute so the whole document flips
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const isAr = lang === "ar";
  const value: LangContextValue = {
    lang,
    setLang,
    isAr,
    dir: isAr ? "rtl" : "ltr",
    bodyFont: isAr ? ARABIC_BODY : LATIN_BODY,
    scriptFont: isAr ? ARABIC_SCRIPT : LATIN_SCRIPT,
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Reusable EN/AR toggle button pair */
export function LangToggle({ style }: { style?: React.CSSProperties }) {
  const { lang, setLang } = useLang();
  return (
    <div
      style={{
        display: "flex",
        borderRadius: 20,
        border: "1px solid rgba(212,175,55,0.3)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(["en", "ar"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "5px 14px",
            background: lang === l ? "rgba(212,175,55,0.18)" : "transparent",
            color: lang === l ? "#d4af37" : "rgba(212,175,55,0.45)",
            border: "none",
            fontFamily: l === "ar" ? "'Noto Naskh Arabic', serif" : "'Lato', sans-serif",
            fontSize: 12,
            fontWeight: lang === l ? 700 : 400,
            cursor: "pointer",
            transition: "all 0.18s",
            letterSpacing: l === "en" ? "0.06em" : 0,
          }}
        >
          {l === "en" ? "EN" : "عربي"}
        </button>
      ))}
    </div>
  );
}
