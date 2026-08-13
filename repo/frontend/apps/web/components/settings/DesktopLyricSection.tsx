"use client";

import { Music } from "lucide-react";
import { useEffect, useState } from "react";
import type { DesktopLyricPreferences } from "@scopifymusicplayer/desktop-contract";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function DesktopLyricSection() {
  const { t } = useI18n();
  const [preferences, setPreferences] = useState<DesktopLyricPreferences | null>(null);

  useEffect(() => {
    if (runtime.isDesktop) {
      void runtime.desktopLyrics.getPreferences().then(setPreferences);
    }
  }, []);

  const handleToggle = () => {
    void runtime.desktopLyrics.toggle();
  };

  const handlePreferenceChange = (key: keyof DesktopLyricPreferences, value: boolean) => {
    void runtime.desktopLyrics.updatePreferences({ [key]: value }).then((updated) => {
      if (updated) {
        setPreferences(updated);
      }
    });
  };

  if (!runtime.isDesktop) return null;

  return (
    <SettingSection title={t("settings.section.desktopLyrics")}>
      <SettingRow
        label={t("settings.desktopLyrics.test.label")}
        sublabel={t("settings.desktopLyrics.test.sublabel")}
        control={
          <button
            type="button"
            onClick={handleToggle}
            className="border-input text-foreground hover:border-content inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <Music className="size-4" />
            {t("settings.desktopLyrics.test.button")}
          </button>
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.alwaysOnTop.label")}
        sublabel={t("settings.desktopLyrics.alwaysOnTop.sublabel")}
        control={
          <Toggle
            enabled={Boolean(preferences?.alwaysOnTop)}
            onChange={() => handlePreferenceChange("alwaysOnTop", !preferences?.alwaysOnTop)}
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.clickThrough.label")}
        sublabel={t("settings.desktopLyrics.clickThrough.sublabel")}
        control={
          <Toggle
            enabled={Boolean(preferences?.clickThrough)}
            onChange={() => handlePreferenceChange("clickThrough", !preferences?.clickThrough)}
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.skipTaskbar.label")}
        sublabel={t("settings.desktopLyrics.skipTaskbar.sublabel")}
        control={
          <Toggle
            enabled={Boolean(preferences?.skipTaskbar)}
            onChange={() => handlePreferenceChange("skipTaskbar", !preferences?.skipTaskbar)}
          />
        }
      />
    </SettingSection>
  );
}
