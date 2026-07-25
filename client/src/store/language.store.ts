import { create } from "zustand";

export type Language = "vi" | "en";

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

function getInitialLanguage(): Language {
  const saved = localStorage.getItem("siteLanguage");
  return saved === "en" ? "en" : "vi";
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    localStorage.setItem("siteLanguage", language);
    document.documentElement.lang = language;
    set({ language });
  },
  toggleLanguage: () => get().setLanguage(get().language === "vi" ? "en" : "vi"),
}));

export function pickLanguage<T>(language: Language, vi: T, en: T): T {
  return language === "vi" ? vi : en;
}
