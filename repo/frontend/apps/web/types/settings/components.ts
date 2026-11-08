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
import type { WebConfig } from "@/types/settings/config";
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

export interface SettingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  title?: string;
  "aria-label"?: string;
}

export interface NetworkSettingsTabProps {
  backendPingResult: BackendPingResult | null;
  /** Desktop-hosted NetEase API; `null` outside Desktop. */
  backendStatus: DesktopBackendStatus | null;
  /** Desktop-hosted QQ Music API; `null` outside Desktop. */
  qqBackendStatus: DesktopBackendStatus | null;
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

/** A custom backend address the card offers instead of the built-in API. */
export interface BackendCustomAddressProps {
  address: WebConfig["backend"];
  pingResult: BackendPingResult | null;
  isPinging: boolean;
  onWebChange: WebSettingsChangeHandler;
  onPing: () => Promise<void>;
  onHostBlur?: () => void;
}

export interface BuiltinBackendRowsProps {
  backendStatus: DesktopBackendStatus | null;
  canRestart: boolean;
  isRestarting: boolean;
  onPortChange: (port: number) => void;
  onRestart: () => void;
  port: number;
}

/** One platform's backend card: built-in Desktop API, or a custom address when one is offered. */
export interface BackendSourceCardProps {
  platform: keyof DesktopHostConfig["backend"];
  /** `null` outside Desktop, where only the custom address exists. */
  desktopConfig: DesktopHostConfig | null;
  backendStatus: DesktopBackendStatus | null;
  onDesktopChange: DesktopSettingsChangeHandler;
  /** Omitted for platforms that only run built-in (QQ Music until requests split by platform). */
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
