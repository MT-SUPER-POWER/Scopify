import type { TranslationKey } from "@/lib/i18n";
import type {
  CommandWorkspaceRootPage,
  CommandWorkspaceUsageCounts,
} from "@/types/commandWorkspace";

export interface ShortcutCommandIconProps {
  className?: string;
  commandId: string;
}

export type ShortcutCommandId =
  | "toggle-playback"
  | "toggle-like"
  | "previous-track"
  | "next-track"
  | "increase-volume"
  | "decrease-volume"
  | "seek-backward-5s"
  | "seek-forward-5s"
  | "seek-backward-1s"
  | "seek-forward-1s"
  | "open-search"
  | "toggle-lyric-stage"
  | "toggle-stage-settings"
  | "open-folia-settings"
  | "open-folia-theme-library"
  | "toggle-sidebar"
  | "navigate-home"
  | "navigate-back"
  | "navigate-forward"
  | "toggle-now-playing-panel"
  | "open-shortcut-settings"
  | "toggle-queue"
  | "toggle-audio-settings"
  | "toggle-audio-output-device"
  | "toggle-subtitle-controls"
  | "toggle-desktop-subtitle"
  | "toggle-dynamic-island"
  | "toggle-taskbar-lyric"
  | "toggle-desktop-controller"
  | "toggle-desktop-music-mode"
  | "show-shortcut-help"
  | "open-command-palette"
  | "open-whats-new"
  | "toggle-mute"
  | "toggle-fullscreen"
  | "toggle-developer-tools"
  | "open-current-track-comments"
  | "focus-playlist-search"
  | "playlist-view-list"
  | "playlist-view-lattice"
  | "toggle-lattice-lights-off";

export type ShortcutGroup = "playback" | "interface" | "shortcuts";
export type ShortcutScope = "global" | "playlist";

export interface ShortcutBinding {
  key: string;
  primary?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface ShortcutCommandDefinition {
  id: ShortcutCommandId;
  group: ShortcutGroup;
  labelKey: TranslationKey;
  keywords?: string;
  /** `null` leaves the command unassigned until the user records a binding. */
  defaultBinding: ShortcutBinding | null;
  scope?: ShortcutScope;
}

/** Page state that decides whether a command is offered in the command palette. */
export interface ShortcutAvailabilityContext {
  latticeActive: boolean;
  latticeAvailable: boolean;
}

export interface ShortcutCommandExecutorOptions {
  navigateTo?(path: string): void;
}

export type ShortcutOverrides = Partial<Record<ShortcutCommandId, ShortcutBinding | null>>;
export type ShortcutUsageCounts = Partial<Record<ShortcutCommandId, number>>;

export interface ShortcutStoreState {
  commandWorkspaceUsageCounts: CommandWorkspaceUsageCounts;
  overrides: ShortcutOverrides;
  usageCounts: ShortcutUsageCounts;
  incrementCommandWorkspaceUsage: (page: CommandWorkspaceRootPage) => void;
  setOverride: (commandId: ShortcutCommandId, binding: ShortcutBinding | null) => void;
  resetOverride: (commandId: ShortcutCommandId) => void;
  resetAllOverrides: () => void;
  incrementUsage: (commandId: ShortcutCommandId) => void;
}

export type ShortcutAssignmentResult =
  { ok: true } | { ok: false; conflictCommandId: ShortcutCommandId };

export interface InWindowShortcutsOptions {
  commandIds?: readonly ShortcutCommandId[];
  executeCommand?: (commandId: ShortcutCommandId) => void;
  scope?: ShortcutScope;
}
