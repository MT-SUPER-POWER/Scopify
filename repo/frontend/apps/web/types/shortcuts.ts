import type { TranslationKey } from "@/lib/i18n";

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
  | "toggle-sidebar"
  | "open-shortcut-settings"
  | "toggle-queue"
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

export interface ShortcutStoreState {
  overrides: ShortcutOverrides;
  usageCounts: Partial<Record<ShortcutCommandId, number>>;
  setOverride: (commandId: ShortcutCommandId, binding: ShortcutBinding | null) => void;
  resetOverride: (commandId: ShortcutCommandId) => void;
  resetAllOverrides: () => void;
  incrementUsage: (commandId: ShortcutCommandId) => void;
}

export type ShortcutAssignmentResult =
  { ok: true } | { ok: false; conflictCommandId: ShortcutCommandId };
