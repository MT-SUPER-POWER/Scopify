import type { TranslationKey } from "@/lib/i18n";
import type {
  ShortcutCommandDefinition,
  ShortcutCommandId,
  ShortcutGroup,
} from "@/types/shortcuts";

export const SHORTCUT_COMMANDS: readonly ShortcutCommandDefinition[] = [
  {
    id: "toggle-playback",
    group: "playback",
    labelKey: "shortcuts.command.togglePlayback",
    defaultBinding: { key: "Space" },
  },
  {
    id: "toggle-like",
    group: "playback",
    labelKey: "shortcuts.command.toggleLike",
    defaultBinding: { key: "KeyL", primary: true, alt: true },
  },
  {
    id: "previous-track",
    group: "playback",
    labelKey: "shortcuts.command.previousTrack",
    defaultBinding: { key: "ArrowLeft", primary: true },
  },
  {
    id: "next-track",
    group: "playback",
    labelKey: "shortcuts.command.nextTrack",
    defaultBinding: { key: "ArrowRight", primary: true },
  },
  {
    id: "increase-volume",
    group: "playback",
    labelKey: "shortcuts.command.increaseVolume",
    defaultBinding: { key: "ArrowUp", primary: true },
  },
  {
    id: "decrease-volume",
    group: "playback",
    labelKey: "shortcuts.command.decreaseVolume",
    defaultBinding: { key: "ArrowDown", primary: true },
  },
  {
    id: "toggle-mute",
    group: "playback",
    labelKey: "shortcuts.command.toggleMute",
    defaultBinding: { key: "KeyM", primary: true, alt: true },
  },
  {
    id: "seek-backward-5s",
    group: "playback",
    labelKey: "shortcuts.command.seekBackward5s",
    defaultBinding: { key: "ArrowLeft" },
  },
  {
    id: "seek-forward-5s",
    group: "playback",
    labelKey: "shortcuts.command.seekForward5s",
    defaultBinding: { key: "ArrowRight" },
  },
  {
    id: "seek-backward-1s",
    group: "playback",
    labelKey: "shortcuts.command.seekBackward1s",
    defaultBinding: { key: "ArrowLeft", shift: true },
  },
  {
    id: "seek-forward-1s",
    group: "playback",
    labelKey: "shortcuts.command.seekForward1s",
    defaultBinding: { key: "ArrowRight", shift: true },
  },
  {
    id: "open-search",
    group: "interface",
    labelKey: "shortcuts.command.openSearch",
    defaultBinding: { key: "KeyK", primary: true },
  },
  {
    id: "toggle-lyric-stage",
    group: "interface",
    labelKey: "shortcuts.command.toggleLyricStage",
    defaultBinding: { key: "KeyM", primary: true, shift: true },
  },
  {
    id: "toggle-sidebar",
    group: "interface",
    labelKey: "shortcuts.command.toggleSidebar",
    defaultBinding: { key: "KeyB", primary: true },
  },
  {
    id: "toggle-queue",
    group: "interface",
    labelKey: "shortcuts.command.toggleQueue",
    defaultBinding: { key: "KeyJ", primary: true },
  },
  {
    id: "toggle-fullscreen",
    group: "interface",
    labelKey: "shortcuts.command.toggleFullscreen",
    defaultBinding: { key: "KeyF", primary: true, shift: true },
  },
  {
    id: "toggle-developer-tools",
    group: "interface",
    labelKey: "shortcuts.command.toggleDeveloperTools",
    defaultBinding: { key: "F12" },
  },
  {
    id: "open-current-track-comments",
    group: "interface",
    labelKey: "shortcuts.command.openCurrentTrackComments",
    defaultBinding: { key: "KeyC", primary: true, alt: true },
  },
  {
    id: "focus-playlist-search",
    group: "interface",
    labelKey: "shortcuts.command.focusPlaylistSearch",
    defaultBinding: { key: "KeyF", primary: true, alt: true },
    scope: "playlist",
  },
  {
    id: "open-shortcut-settings",
    group: "shortcuts",
    labelKey: "shortcuts.command.openSettings",
    defaultBinding: { key: "KeyK", primary: true, alt: true },
  },
  {
    id: "show-shortcut-help",
    group: "shortcuts",
    labelKey: "shortcuts.command.showHelp",
    defaultBinding: { key: "Slash", primary: true },
  },
  {
    id: "open-command-palette",
    group: "shortcuts",
    labelKey: "shortcuts.command.openCommandPalette",
    defaultBinding: { key: "KeyP", primary: true, shift: true },
  },
];

export const SHORTCUT_GROUPS = ["playback", "interface", "shortcuts"] as const;

export const SHORTCUT_GROUP_LABEL_KEYS: Record<ShortcutGroup, TranslationKey> = {
  playback: "shortcuts.group.playback",
  interface: "shortcuts.group.interface",
  shortcuts: "shortcuts.group.shortcuts",
};

/** Commands that make sense while the compact desktop music controller owns focus. */
export const DESKTOP_PLAYBACK_CONTROLLER_SHORTCUT_COMMAND_IDS = [
  "toggle-playback",
  "toggle-like",
  "previous-track",
  "next-track",
  "increase-volume",
  "decrease-volume",
  "toggle-mute",
  "seek-backward-5s",
  "seek-forward-5s",
  "seek-backward-1s",
  "seek-forward-1s",
  "open-current-track-comments",
] as const satisfies readonly ShortcutCommandId[];
