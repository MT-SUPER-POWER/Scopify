"use client";

import { useEffect } from "react";
import { useI18nStore } from "@/store/module/i18n";
import type { AppConfig } from "@/types/config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.getAppConfig) return;

    let cancelled = false;

    const syncLocale = async () => {
      try {
        const config = await window.electronAPI?.getAppConfig();
        if (!cancelled && config) {
          setLocale(config.app.locale);
        }
      } catch {
        // Ignore startup sync failures and keep the persisted locale.
      }
    };

    const handleConfigUpdate = (event: Event) => {
      const nextConfig = (event as CustomEvent<AppConfig>).detail;
      if (nextConfig) {
        setLocale(nextConfig.app.locale);
      }
    };

    void syncLocale();
    window.addEventListener("app-config-updated", handleConfigUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("app-config-updated", handleConfigUpdate);
    };
  }, [setLocale]);

  return children;
}
