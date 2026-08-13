"use client";

import { useI18n } from "@/store/module/i18n";
import type { PageCachePreferences } from "@/types/cache";
import type { CacheAdvancedScopeControlsProps } from "@/types/components/settings";
import { SettingInput, SettingRow, Toggle } from "./SettingsUI";

export function PageCacheAdvancedControls({
  preferences,
  onChange,
}: CacheAdvancedScopeControlsProps<PageCachePreferences>) {
  const { t } = useI18n();

  return (
    <>
      <SettingRow
        label={t("settings.cache.scope.page.enabled")}
        sublabel={t("settings.cache.scope.page.description")}
        control={
          <Toggle
            enabled={preferences.enabled}
            onChange={() => onChange({ enabled: !preferences.enabled })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.page.limit")}
        sublabel={t("settings.cache.scope.page.limitDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.maxSizeMB}
            onChange={(value) => onChange({ maxSizeMB: Number(value) })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.page.ttl")}
        sublabel={t("settings.cache.scope.page.ttlDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.ttlMinutes}
            onChange={(value) => onChange({ ttlMinutes: Number(value) })}
          />
        }
      />
      <SettingRow
        label={t("settings.cache.scope.page.searchTtl")}
        sublabel={t("settings.cache.scope.page.searchTtlDescription")}
        control={
          <SettingInput
            type="number"
            value={preferences.searchTtlMinutes}
            onChange={(value) => onChange({ searchTtlMinutes: Number(value) })}
          />
        }
      />
    </>
  );
}
