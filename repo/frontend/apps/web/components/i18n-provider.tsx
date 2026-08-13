"use client";

import { useEffect } from "react";
import { useI18nStore } from "@/store/module/i18n";
import type { WebConfig } from "@/types/config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleConfigUpdate = (event: Event) => {
      const nextConfig = (event as CustomEvent<WebConfig>).detail;
      if (nextConfig) {
        setLocale(nextConfig.app.locale);
      }
    };

    window.addEventListener("app-config-updated", handleConfigUpdate);

    return () => {
      window.removeEventListener("app-config-updated", handleConfigUpdate);
    };
  }, [setLocale]);

  return children;
}
