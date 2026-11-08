import type { ComponentType, ReactNode } from "react";
import type { AppUpdateState } from "@/types/desktop/updater";
import type {
  DesktopBackendStatus,
  DesktopHostConfig,
  DiscordPresenceStatus,
  MCP_PLAYBACK_CAPABILITIES,
  McpCapability,
  McpClientConfiguration,
  McpConnectionTestResult,
  McpStatus,
} from "@scopify/desktop-contract";
import type {
  DesktopSettingsChangeHandler,
  SettingsConfig,
  WebSettingsChangeHandler,
} from "@/types/settings/model";
import type { BackendPingResult } from "@/types/network/model";
import type { BackendAddress, BackendPlatform } from "@/types/settings/config";
import type { CacheStats } from "@/types/cache/model";
import type { CachePreferences } from "@/types/cache/model";

export interface GeneralSettingsTabProps {
  config: SettingsConfig;
  onDesktopChange: DesktopSettingsChangeHandler;
  onWebChange: WebSettingsChangeHandler;
}

export interface SettingSectionProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export interface SettingRowProps {
  label: ReactNode;
  sublabel?: string;
  control: ReactNode;
  isColumn?: boolean;
  requiresRestart?: boolean;
  isDebug?: boolean;
  /** Marks a setting as a Beta feature independently of the installed release channel. */
  isBeta?: boolean;
  badge?: ReactNode;
  className?: string;
}

export interface SaveChangesButtonProps {
  visible: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  /** Backward-compatible alias for onSave */
  onClick?: () => void;
  isSaving?: boolean;
}

export interface SettingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  title?: string;
  "aria-label"?: string;
}

export interface SettingPortInputProps {
  value: number;
  onChange: (port: number) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  align?: "left" | "right";
  isInvalid?: boolean;
}

export interface NetworkSettingsTabProps {
  /** Desktop-hosted API per platform; `null` outside Desktop. */
  backendStatuses: Record<BackendPlatform, DesktopBackendStatus | null>;
  backendPingResults: Record<BackendPlatform, BackendPingResult | null>;
  pingingBackends: Record<BackendPlatform, boolean>;
  config: SettingsConfig;
  onBackendAddressChange: <K extends keyof BackendAddress>(
    platform: BackendPlatform,
    key: K,
    value: BackendAddress[K],
  ) => void;
  onBackendHostBlur: (platform: BackendPlatform) => void;
  onDesktopChange: DesktopSettingsChangeHandler;
  onPingBackend: (platform: BackendPlatform) => Promise<void>;
  onWebChange: WebSettingsChangeHandler;
}

export interface BackendStatusIndicatorProps {
  status: DesktopBackendStatus | null;
}

/** A custom backend address the card offers instead of the built-in API. */
export interface BackendCustomAddressProps {
  address: BackendAddress;
  pingResult: BackendPingResult | null;
  isPinging: boolean;
  onChange: <K extends keyof BackendAddress>(key: K, value: BackendAddress[K]) => void;
  onPing: () => Promise<void>;
  onHostBlur?: () => void;
}

export interface BackendPingBadgeProps {
  result: BackendPingResult;
}

export interface BuiltinBackendRowsProps {
  platform: BackendPlatform;
  backendStatus: DesktopBackendStatus | null;
  canRestart: boolean;
  canStop: boolean;
  isRunning: boolean;
  isRestarting: boolean;
  isStopping: boolean;
  onPortChange: (port: number) => void;
  onRestart: () => void;
  onStop: () => void;
  port: number;
}

/** One platform's backend card: built-in Desktop API, or a custom address when one is offered. */
export interface BackendSourceCardProps {
  platform: BackendPlatform;
  /** `null` outside Desktop, where only the custom address exists. */
  desktopConfig: DesktopHostConfig | null;
  backendStatus: DesktopBackendStatus | null;
  onDesktopChange: DesktopSettingsChangeHandler;
  /** Omitted for a platform that can only run built-in; the alternative is then "off". */
  custom?: BackendCustomAddressProps;
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
  mcpStatusRefreshKey: number;
  onChange: DesktopSettingsChangeHandler;
  onTestDiscord: () => Promise<void>;
}

export interface AppUpdaterSectionProps {
  config: DesktopHostConfig;
  onChange: DesktopSettingsChangeHandler;
}

export interface AppUpdaterStatusProps {
  state: AppUpdateState;
  onCheck: () => Promise<void>;
  onDownload: () => Promise<void>;
  onInstall: () => void;
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

export type McpGranularCapability = (typeof MCP_PLAYBACK_CAPABILITIES)[number];

export interface CapabilityItemDef {
  capability: McpGranularCapability;
  icon: ComponentType<{ className?: string }>;
  labelKey:
    | "settings.mcp.capability.readStatus.label"
    | "settings.mcp.capability.readTrack.label"
    | "settings.mcp.capability.controlPlay.label"
    | "settings.mcp.capability.controlPause.label"
    | "settings.mcp.capability.controlToggle.label"
    | "settings.mcp.capability.controlNext.label"
    | "settings.mcp.capability.controlPrevious.label"
    | "settings.mcp.capability.controlSeek.label"
    | "settings.mcp.capability.controlVolume.label";
  sublabelKey:
    | "settings.mcp.capability.readStatus.sublabel"
    | "settings.mcp.capability.readTrack.sublabel"
    | "settings.mcp.capability.controlPlay.sublabel"
    | "settings.mcp.capability.controlPause.sublabel"
    | "settings.mcp.capability.controlToggle.sublabel"
    | "settings.mcp.capability.controlNext.sublabel"
    | "settings.mcp.capability.controlPrevious.sublabel"
    | "settings.mcp.capability.controlSeek.sublabel"
    | "settings.mcp.capability.controlVolume.sublabel";
  toolName: string;
}
