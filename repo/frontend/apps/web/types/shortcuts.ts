import type { TranslationKey } from "@/lib/i18n";
import type {
  CommandWorkspaceRootPage,
  CommandWorkspaceUsageCounts,
} from "@/types/commandWorkspace";

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
  | "open-folia-settings"
  | "open-folia-theme-library"
  | "toggle-sidebar"
  | "open-shortcut-settings"
  | "toggle-queue"
  | "toggle-audio-settings"
  | "toggle-desktop-controller"
  | "toggle-desktop-music-mode"
  | "show-shortcut-help"
  | "open-command-palette"
  | "toggle-mute"
  | "toggle-fullscreen"
  | "toggle-developer-tools"
  | "open-current-track-comments"
  | "focus-playlist-search";

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
  defaultBinding: ShortcutBinding;
  scope?: ShortcutScope;
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
