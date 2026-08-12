import type { DesktopHostConfig, DiscordPresenceStatus } from "@scopify/desktop-contract";
import type { DesktopSettingsChangeHandler } from "@/types/settings";
import type { SettingsConfig, WebSettingsChangeHandler } from "@/types/settings";

export interface NetworkSettingsTabProps {
  config: SettingsConfig;
  isPingingBackend: boolean;
  onDesktopChange: DesktopSettingsChangeHandler;
  onPingBackend: () => Promise<void>;
  onWebChange: WebSettingsChangeHandler;
}

export interface SaveConfirmModalProps {
  isSaving: boolean;
  isWeb?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  requiresRestart?: boolean;
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
  discordStatus: DiscordPresenceStatus | null;
  isTestingDiscord: boolean;
  onChange: DesktopSettingsChangeHandler;
  onTestDiscord: () => Promise<void>;
}

export interface AppUpdaterSectionProps {
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
}
