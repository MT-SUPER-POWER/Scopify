import type { DesktopHostConfig } from "@scopify/desktop-contract";
import type { DesktopSettingsChangeHandler } from "@/types/settings";
import type { BackendPingResult } from "@/types/network";
import type { SettingsConfig, WebSettingsChangeHandler } from "@/types/settings";

export interface NetworkSettingsTabProps {
  backendPingResult: BackendPingResult | null;
  config: SettingsConfig;
  isPingingBackend: boolean;
  onDesktopChange: DesktopSettingsChangeHandler;
  onPingBackend: () => Promise<void>;
  onWebChange: WebSettingsChangeHandler;
}

export interface StorageSettingsTabProps {
  config: DesktopHostConfig | null;
  onChange: DesktopSettingsChangeHandler;
  playbackCacheStats: { entryCount: number; cacheDir: string | null } | null;
  isClearingPlaybackCache: boolean;
  onClearPlaybackCache: () => Promise<void>;
  isClearingCache: boolean;
  onClearCache: () => Promise<void>;
}

export interface DesktopSettingsTabProps {
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
}

export interface AppUpdaterSectionProps {
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
}
