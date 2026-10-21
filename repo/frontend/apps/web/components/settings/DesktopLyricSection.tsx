"use client";

import { useEffect, useState } from "react";
import type { DesktopLyricPreferences } from "@scopify/desktop-contract";
import { useDesktopIconVisibility } from "@/hooks/desktopWallpaper/useDesktopIconVisibility";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import { SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function DesktopLyricSection() {
  const { t } = useI18n();
  const [preferences, setPreferences] = useState<DesktopLyricPreferences | null>(null);
  const desktopIcons = useDesktopIconVisibility();

  useEffect(() => {
    if (runtime.isDesktop) {
      void runtime.desktopLyrics.getPreferences().then(setPreferences);

      const onFocus = () => {
        void runtime.desktopLyrics.getPreferences().then(setPreferences);
      };
      window.addEventListener("focus", onFocus);
      // 锁定状态也可能在歌词窗口或托盘里被切换。
      const unsubscribe = runtime.desktopLyrics.onPreferencesChanged(setPreferences);
      return () => {
        window.removeEventListener("focus", onFocus);
        unsubscribe();
      };
    }
  }, []);

  const handleToggleOpen = async () => {
    const isCurrentlyOpen = Boolean(preferences?.enabled);
    if (isCurrentlyOpen) {
      await runtime.desktopLyrics.close();
      setPreferences((prev) => (prev ? { ...prev, enabled: false } : null));
    } else {
      await runtime.desktopLyrics.open();
      setPreferences((prev) => (prev ? { ...prev, enabled: true } : null));
    }
  };

  const handlePreferenceChange = (key: keyof DesktopLyricPreferences, value: boolean) => {
    void runtime.desktopLyrics.updatePreferences({ [key]: value }).then((updated) => {
      if (updated) {
        setPreferences(updated);
      }
    });
  };

  const handleToggleHideDesktopIcons = async () => {
    const isCurrentlyHidden = desktopIcons.state?.visible === false;
    await desktopIcons.setVisible(isCurrentlyHidden);
  };

  if (!runtime.isDesktop) return null;

  const isDesktopIconsHidden = desktopIcons.state?.visible === false;

  return (
    <SettingSection title={t("settings.section.desktopLyrics")}>
      <SettingRow
        label={t("settings.desktopLyrics.enabled.label")}
        sublabel={t("settings.desktopLyrics.enabled.sublabel")}
        control={
          <Toggle
            enabled={Boolean(preferences?.enabled)}
            onChange={() => void handleToggleOpen()}
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.locked.label")}
        sublabel={t("settings.desktopLyrics.locked.sublabel")}
        control={
          <Toggle
            enabled={Boolean(preferences?.locked)}
            onChange={() => handlePreferenceChange("locked", !preferences?.locked)}
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.alwaysOnTop.label")}
        sublabel={t("settings.desktopLyrics.alwaysOnTop.sublabel")}
        control={
          <Toggle
            enabled={preferences?.alwaysOnTop ?? true}
            onChange={() =>
              handlePreferenceChange("alwaysOnTop", !(preferences?.alwaysOnTop ?? true))
            }
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.showSecondaryLyric.label")}
        sublabel={t("settings.desktopLyrics.showSecondaryLyric.sublabel")}
        control={
          <Toggle
            enabled={preferences?.showSecondaryLyric ?? true}
            onChange={() =>
              handlePreferenceChange(
                "showSecondaryLyric",
                !(preferences?.showSecondaryLyric ?? true),
              )
            }
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.hideDesktopIcons.label")}
        sublabel={t("settings.desktopLyrics.hideDesktopIcons.sublabel")}
        control={
          <Toggle
            enabled={isDesktopIconsHidden}
            onChange={() => void handleToggleHideDesktopIcons()}
          />
        }
      />
      <SettingRow
        label={t("settings.desktopLyrics.preventSleepOnPlayback.label")}
        sublabel={t("settings.desktopLyrics.preventSleepOnPlayback.sublabel")}
        control={
          <Toggle
            enabled={preferences?.preventSleepOnPlayback ?? true}
            onChange={() =>
              handlePreferenceChange(
                "preventSleepOnPlayback",
                !(preferences?.preventSleepOnPlayback ?? true),
              )
            }
          />
        }
      />
    </SettingSection>
  );
}
