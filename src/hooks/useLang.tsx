/** Shared, reactive language state for every client component. */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "@/lib/i18n";

const LS_KEY = "setu_lang";
type LangContextValue = readonly [Lang, (lang: Lang) => void];
const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children, initialLang = "en" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    localStorage.setItem(LS_KEY, lang);
    const onStorage = (event: StorageEvent) => {
      if (event.key === LS_KEY && (event.newValue === "en" || event.newValue === "gu")) {
        setLangState(event.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    localStorage.setItem(LS_KEY, nextLang);
    document.cookie = `${LS_KEY}=${nextLang}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<LangContextValue>(() => [lang, setLang], [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used within LangProvider");
  return context;
}
