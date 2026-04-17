"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type TranslationKey, type TranslationParams, translate } from "@/lib/i18n";
import type { TranslateFn } from "@/types/i18n.generated";
import { type AppLocale, DEFAULT_APP_CONFIG } from "@/types/config";

interface I18nStore {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      // NOTE: setting 来控制的 i18n 的传入点
      locale: DEFAULT_APP_CONFIG.app.locale,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "i18n-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * 自定义的 i18n hooks
 * @description 这个 hooks 提供了当前语言环境、设置语言环境的函数，以及一个翻译函数
 * 翻译函数接受一个翻译键，并返回对应的翻译文本 t("")
 * @returns { locale, setLocale, t } - 当前语言环境，设置语言环境的函数，以及翻译函数
 */
export function useI18n() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const t = ((key: TranslationKey, params?: TranslationParams) =>
    translate(locale, key, params)) as TranslateFn;

  return {
    locale,
    setLocale,
    t,
  };
}
