import type { DesktopHostConfig, DiscordPresenceStatus } from "@scopify/desktop-contract";
import type {
  DesktopSettingsChangeHandler,
  SettingsConfig,
  WebSettingsChangeHandler,
} from "@/types/settings";
import type { BackendPingResult } from "@/types/network";
import type { CacheStats } from "@/types/cache";
import type { CachePreferences } from "@/types/cache";

export interface GeneralSettingsTabProps {
  config: SettingsConfig;
  onDesktopChange: DesktopSettingsChangeHandler;
  onWebChange: WebSettingsChangeHandler;
}

export interface NetworkSettingsTabProps {
  backendPingResult: BackendPingResult | null;
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
  cachePreferences: CachePreferences | null;
  config: DesktopHostConfig | null;
  onChange: DesktopSettingsChangeHandler;
  onCachePreferencesChange: (preferences: CachePreferences) => void;
  cacheStats: CacheStats | null;
}

export interface CacheAdvancedScopeControlsProps<Preferences> {
  preferences: Preferences;
  onChange: (update: Partial<Preferences>) => void;
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
