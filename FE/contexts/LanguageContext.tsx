"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = "biowatch_language";


export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with a stable initial state that matches the server (SSR)
  const [language, setLanguageState] = useState<Language>("en");

  // Sync with localStorage/navigator only after mounting on the client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "id") {
        setLanguageState(stored);
      } else if (navigator.language.toLowerCase().startsWith("id")) {
        setLanguageState("id");
      }
    } catch (e) {
      console.error("Failed to load language from storage:", e);
    }
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage;
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
