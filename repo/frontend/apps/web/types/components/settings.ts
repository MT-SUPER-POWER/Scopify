import type {
  DesktopBackendStatus,
  DesktopHostConfig,
  DiscordPresenceStatus,
  McpCapability,
  McpClientConfiguration,
  McpConnectionTestResult,
  McpStatus,
} from "@scopify/desktop-contract";
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
  onBackendHostBlur?: () => void;
}

export interface BackendStatusIndicatorProps {
  status: DesktopBackendStatus | null;
}

export interface LocalBackendSettingsSectionProps {
  backendStatus: DesktopBackendStatus | null;
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
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
  backendStatus: DesktopBackendStatus | null;
  config: DesktopHostConfig;
  discordStatus: DiscordPresenceStatus | null;
  isTestingDiscord: boolean;
  mcpStatusRefreshKey: number;
  onChange: DesktopSettingsChangeHandler;
  onTestDiscord: () => Promise<void>;
}

export interface AppUpdaterSectionProps {
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
}

/** Props for the Electron-only local MCP management section. */
export interface McpSettingsSectionProps {
  config: DesktopHostConfig["mcp"];
  onChange: DesktopSettingsChangeHandler;
  /** Increments after the Main process has reconciled a saved MCP policy. */
  statusRefreshKey: number;
}

export interface McpCredentialControlsProps {
  clientConfiguration: McpClientConfiguration | null;
  isRevealingCredential: boolean;
  isRotatingCredential: boolean;
  onRevealCredential(): Promise<McpClientConfiguration | null>;
  onRotateCredential(): Promise<McpClientConfiguration | null>;
}

export interface McpClientConfigurationPreviewProps {
  configuration: McpClientConfiguration;
  isRotating?: boolean;
  onCopy(): Promise<void>;
  onRotate?(): Promise<void>;
}

export interface McpRuntimeControlsProps {
  canTestConnection: boolean;
  connectionTestResult: McpConnectionTestResult | null;
  isRestarting: boolean;
  isTestingConnection: boolean;
  onRestart(): Promise<McpStatus | null>;
  onTestConnection(): Promise<McpConnectionTestResult | null>;
}

export interface McpCapabilitiesModalProps {
  capabilities: McpCapability[];
  onCapabilitiesChange(capabilities: McpCapability[]): void;
  onClose(): void;
  open: boolean;
}
