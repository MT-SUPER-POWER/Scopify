"use client";

import { FolderOpen } from "lucide-react";
import type { DesktopHostConfig } from "@mt-super-power/desktop-contract";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import type { CachePreferences } from "@/types/cache";
import type { StorageSettingsTabProps } from "@/types/components/settings";
import { PageCacheAdvancedControls } from "./PageCacheAdvancedControls";
import { PlaybackCacheAdvancedControls } from "./PlaybackCacheAdvancedControls";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

interface CacheAdvancedSettingsProps {
  cachePreferences: CachePreferences;
  config: DesktopHostConfig | null;
  onCachePreferencesChange: StorageSettingsTabProps["onCachePreferencesChange"];
  onChange: StorageSettingsTabProps["onChange"];
  rootDir?: string;
}

export function CacheAdvancedSettings({
  cachePreferences,
  config,
  onCachePreferencesChange,
  onChange,
  rootDir,
}: CacheAdvancedSettingsProps) {
  const { t } = useI18n();
  const updatePage = (update: Partial<CachePreferences["page"]>) =>
    onCachePreferencesChange({
      ...cachePreferences,
      page: { ...cachePreferences.page, ...update },
    });
  const updatePlayback = (update: Partial<CachePreferences["playback"]>) =>
    onCachePreferencesChange({
      ...cachePreferences,
      playback: { ...cachePreferences.playback, ...update },
    });

  const handleBrowseDir = async () => {
    const currentPath = config?.cache.dir || rootDir;
    const selected = await runtime.config.selectDirectory(currentPath);
    if (selected) {
      onChange("cache", "dir", selected);
    }
  };

  return (
    <SettingSection title={t("settings.cache.advanced")}>
      {config ? (
        <SettingRow
          label={t("settings.cache.dir.label")}
          sublabel={t("settings.cache.dir.sublabel")}
          isColumn
          control={
            <div className="flex w-full items-center gap-2">
              <SettingInput
                value={config.cache.dir || rootDir || ""}
                onChange={(value) => onChange("cache", "dir", value)}
                className="flex-1 text-left"
                placeholder={t("settings.cache.dir.placeholder")}
              />
              <button
                type="button"
                onClick={() => void handleBrowseDir()}
                className="border-input text-foreground hover:bg-accent hover:border-content flex shrink-0 cursor-pointer items-center gap-1.5 rounded border bg-transparent px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <FolderOpen className="size-4" />
                {t("settings.cache.dir.browse")}
              </button>
            </div>
          }
        />
      ) : null}
      <PageCacheAdvancedControls preferences={cachePreferences.page} onChange={updatePage} />
      <PlaybackCacheAdvancedControls
        preferences={cachePreferences.playback}
        onChange={updatePlayback}
      />
    </SettingSection>
  );
}
