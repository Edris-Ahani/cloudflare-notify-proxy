"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import enMessages from "@/locales/en.json";
import faMessages from "@/locales/fa.json";

export type Locale = "en" | "fa";

interface I18nContextType {
  locale: Locale;
  dir: "ltr" | "rtl";
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const translations: Record<Locale, any> = {
  en: enMessages,
  fa: faMessages,
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  dir: "ltr",
  isRtl: false,
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Check local storage preference
    const savedLocale = localStorage.getItem("app_lang") as Locale | null;
    if (savedLocale === "en" || savedLocale === "fa") {
      setLocaleState(savedLocale);
      setIsInitialized(true);
      return;
    }

    // 2. Check cookie set by middleware
    const match = document.cookie.match(/(?:^|;\s*)cf_country=([^;]+)/);
    const country = match ? match[1].toUpperCase() : null;

    if (country === "IR") {
      setLocaleState("fa");
      setIsInitialized(true);
      return;
    }

    // 3. Fallback to client heuristics (Timezone or browser languages)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isIranTz = tz === "Asia/Tehran" || tz === "Iran";
      const isPersianLang = navigator.languages
        ? navigator.languages.some((l) => l.toLowerCase().startsWith("fa"))
        : navigator.language.toLowerCase().startsWith("fa");

      if (isIranTz || isPersianLang) {
        setLocaleState("fa");
        setIsInitialized(true);
        return;
      }
    } catch {
      // Ignore heuristic failures
    }

    // 4. Asynchronously query geo endpoint in case header was missed
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data?.isIran) {
          setLocaleState("fa");
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app_lang", newLocale);
  };

  const isRtl = locale === "fa";
  const dir = isRtl ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    let current: any = translations[locale];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English translation
        let fallbackVal: any = translations["en"];
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return fallback || keyPath;
          }
        }
        return typeof fallbackVal === "string" ? fallbackVal : fallback || keyPath;
      }
    }

    return typeof current === "string" ? current : fallback || keyPath;
  };

  return (
    <I18nContext.Provider value={{ locale, dir, isRtl, setLocale, t }}>
      <div dir={dir} className={isRtl ? "font-sans rtl" : "font-sans ltr"}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs font-medium shadow-sm backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 rounded transition-colors ${
          locale === "en"
            ? "bg-blue-600 text-white font-semibold shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("fa")}
        className={`px-2.5 py-1 rounded transition-colors ${
          locale === "fa"
            ? "bg-blue-600 text-white font-semibold shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {t("common.persian", "FA")}
      </button>
    </div>
  );
}
