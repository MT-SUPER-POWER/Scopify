import type { AppConfig } from "@/types/config";
import type { SettingsChangeHandler } from "@/types/settings";

export interface StorageSettingsTabProps {
  config: AppConfig;
  onChange: SettingsChangeHandler;
  playbackCacheStats: { entryCount: number; cacheDir: string | null } | null;
  isClearingPlaybackCache: boolean;
  onClearPlaybackCache: () => Promise<void>;
  isClearingCache: boolean;
  onClearCache: () => Promise<void>;
}
