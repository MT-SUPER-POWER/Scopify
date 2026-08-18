"use client";

import { FolderOpen } from "lucide-react";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { CachePreferences } from "@/types/cache";
import type { StorageSettingsTabProps } from "@/types/components/settings";
import { CacheSummaryRow } from "./CacheSummaryRow";
import { PageCacheAdvancedControls } from "./PageCacheAdvancedControls";
import { PlaybackCacheAdvancedControls } from "./PlaybackCacheAdvancedControls";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function StorageSettingsTab({
  cachePreferences,
  config,
  cacheStats,
  onChange,
  onCachePreferencesChange,
}: StorageSettingsTabProps) {
  const { t } = useI18n();

  const isDesktopHost = runtime.isDesktop && Boolean(config);

  const updatePage = (update: Partial<CachePreferences["page"]>) => {
    if (!cachePreferences) return;
    onCachePreferencesChange({
      ...cachePreferences,
      page: { ...cachePreferences.page, ...update },
    });
  };

  const updatePlayback = (update: Partial<CachePreferences["playback"]>) => {
    if (!cachePreferences) return;
    onCachePreferencesChange({
      ...cachePreferences,
      playback: { ...cachePreferences.playback, ...update },
    });
  };

  const handleBrowseDir = async () => {
    if (!config) return;
    const currentPath = config.cache.dir || cacheStats?.rootDir;
    const selected = await runtime.config.selectDirectory(currentPath);
    if (selected) {
      onChange("cache", "dir", selected);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      {isDesktopHost && config ? (
        <SettingSection title={t("settings.section.generalCache")}>
          <SettingRow
            label={t("settings.cache.dir.label")}
            sublabel={t("settings.cache.dir.sublabel")}
            isColumn
            control={
              <div className="flex w-full items-center gap-2">
                <SettingInput
                  value={config.cache.dir || cacheStats?.rootDir || ""}
                  onChange={(value) => onChange("cache", "dir", value)}
                  className="flex-1 text-left"
                  placeholder={t("settings.cache.dir.placeholder")}
                />
                <button
                  type="button"
                  onClick={() => void handleBrowseDir()}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded border border-input bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content hover:bg-accent"
                >
                  <FolderOpen className="size-4" />
                  {t("settings.cache.dir.browse")}
                </button>
              </div>
            }
          />
        </SettingSection>
      ) : null}

      <SettingSection title={t("settings.cache.scope.page.title")}>
        {cachePreferences ? (
          <PageCacheAdvancedControls preferences={cachePreferences.page} onChange={updatePage} />
        ) : null}
        <CacheSummaryRow
          maxSizeMB={cachePreferences?.page.maxSizeMB ?? 256}
          sizeBytes={cacheStats?.page.sizeBytes}
        />
      </SettingSection>

      <SettingSection title={t("settings.cache.scope.playback.title")}>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {t("settings.cache.playbackExplanation")}
        </p>
        {cachePreferences ? (
          <PlaybackCacheAdvancedControls
            preferences={cachePreferences.playback}
            onChange={updatePlayback}
          />
        ) : null}
        <CacheSummaryRow
          maxSizeMB={cachePreferences?.playback.maxSizeMB ?? 64}
          sizeBytes={cacheStats?.playback.sizeBytes}
        />
      </SettingSection>
    </div>
  );
}
