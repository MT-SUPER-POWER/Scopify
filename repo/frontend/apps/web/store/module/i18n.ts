"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { i18n } from "@/lib/i18n";
import { type AppLocale, DEFAULT_WEB_CONFIG } from "@/types/settings/config";

interface I18nStore {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      // NOTE: setting 来控制的 i18n 的传入点
      locale: DEFAULT_WEB_CONFIG.app.locale,
      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: "i18n-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) void i18n.changeLanguage(state.locale);
      },
    },
  ),
);
