"use client";

import { IS_ELECTRON } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { StorageSettingsTabProps } from "@/types/components/settings";
import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";

export function StorageSettingsTab({
  config,
  onChange,
  playbackCacheStats,
  isClearingPlaybackCache,
  onClearPlaybackCache,
  isClearingCache,
  onClearCache,
}: StorageSettingsTabProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.playbackCache.section")}>
        <SettingRow
          label={t("settings.playbackCache.count")}
          sublabel={
            IS_ELECTRON && playbackCacheStats?.cacheDir ? playbackCacheStats.cacheDir : undefined
          }
          control={
            <span className="text-sm font-medium text-white">
              {playbackCacheStats
                ? t("settings.playbackCache.countValue", { count: playbackCacheStats.entryCount })
                : "-"}
            </span>
          }
        />
        <SettingRow
          label={t("settings.playbackCache.clearButton")}
          control={
            <button
              type="button"
              onClick={() => void onClearPlaybackCache()}
              disabled={isClearingPlaybackCache}
              className="rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
            >
              {isClearingPlaybackCache
                ? t("settings.playbackCache.clearing")
                : t("settings.playbackCache.clearButton")}
            </button>
          }
        />
      </SettingSection>
      {IS_ELECTRON ? (
        <SettingSection title={t("settings.section.cache")}>
          <SettingRow
            label={t("settings.cache.enabled.label")}
            sublabel={t("settings.cache.enabled.sublabel")}
            control={
              <Toggle
                enabled={config.cache.enabled}
                onChange={() => onChange("cache", "enabled", !config.cache.enabled)}
              />
            }
          />
          <SettingRow
            label={t("settings.cache.dir.label")}
            sublabel={t("settings.cache.dir.sublabel")}
            isColumn
            control={
              <SettingInput
                value={config.cache.dir}
                onChange={(value) => onChange("cache", "dir", value)}
                className="w-full text-left"
                placeholder={t("settings.cache.dir.placeholder")}
              />
            }
          />
          <SettingRow
            label={t("settings.cache.maxSize.label")}
            sublabel={t("settings.cache.maxSize.sublabel")}
            control={
              <SettingInput
                type="number"
                value={config.cache.maxSizeMB}
                onChange={(value) => onChange("cache", "maxSizeMB", Number(value))}
              />
            }
          />
          <SettingRow
            label={t("settings.cache.pageTtl.label")}
            sublabel={t("settings.cache.pageTtl.sublabel")}
            control={
              <SettingInput
                type="number"
                value={config.cache.pageTtlMinutes}
                onChange={(value) => onChange("cache", "pageTtlMinutes", Number(value))}
              />
            }
          />
          <SettingRow
            label={t("settings.cache.searchTtl.label")}
            sublabel={t("settings.cache.searchTtl.sublabel")}
            control={
              <SettingInput
                type="number"
                value={config.cache.searchTtlMinutes}
                onChange={(value) => onChange("cache", "searchTtlMinutes", Number(value))}
              />
            }
          />
          <SettingRow
            label={t("settings.cache.clear.label")}
            sublabel={t("settings.cache.clear.sublabel")}
            control={
              <button
                type="button"
                onClick={() => void onClearCache()}
                disabled={isClearingCache}
                className="rounded bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {isClearingCache
                  ? t("settings.cache.clear.clearing")
                  : t("settings.cache.clear.button")}
              </button>
            }
          />
        </SettingSection>
      ) : null}
    </div>
  );
}
