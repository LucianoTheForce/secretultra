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

import {
  availableLanguages,
  fallbackLanguage,
  getLanguageLabel,
  getTranslation,
  type Language,
} from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "app-preferred-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  available: typeof availableLanguages;
  getLabel: (language: Language) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function resolveInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return fallbackLanguage;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (stored === "pt" || stored === "en") {
    return stored;
  }

  const browserLanguage = window.navigator.language?.toLowerCase() ?? "";

  if (browserLanguage.startsWith("pt")) {
    return "pt";
  }

  return fallbackLanguage;
}

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const translate = (key: string, params?: Record<string, string | number>) =>
      getTranslation(language, key, params);

    return {
      language,
      setLanguage,
      t: translate,
      available: availableLanguages,
      getLabel: getLanguageLabel,
    };
  }, [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
