"use client";

import { useI18n } from "@/store/module/i18n";
import type { PlaybackCachePreferences } from "@/types/cache";
import type { CacheAdvancedScopeControlsProps } from "@/types/components/settings";
import { SettingInput, SettingRow, Toggle } from "./SettingsUI";

export function PlaybackCacheAdvancedControls({
  preferences,
  onChange,
}: CacheAdvancedScopeControlsProps<PlaybackCachePreferences>) {
  const { t } = useI18n();

  return (
    <>
      <SettingRow
        label={t("settings.cache.scope.playback.enabled")}
        sublabel={t("settings.cache.scope.playback.description")}
        control={
          <Toggle
            enabled={preferences.enabled}
            onChange={() => onChange({ enabled: !preferences.enabled })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.playback.limit")}
        sublabel={t("settings.cache.scope.playback.limitDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.maxSizeMB}
            onChange={(value) => onChange({ maxSizeMB: Number(value) })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.playback.maxEntries")}
        sublabel={t("settings.cache.scope.playback.maxEntriesDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.maxEntries}
            onChange={(value) => onChange({ maxEntries: Number(value) })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.playback.urlTtl")}
        sublabel={t("settings.cache.scope.playback.urlTtlDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.urlTtlMinutes}
            onChange={(value) => onChange({ urlTtlMinutes: Number(value) })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.playback.lyricTtl")}
        sublabel={t("settings.cache.scope.playback.lyricTtlDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.lyricTtlMinutes}
            onChange={(value) => onChange({ lyricTtlMinutes: Number(value) })}
          />
        }
      />
    </>
  );
}
