import type { TranslationKey } from "@/lib/i18n";
import type { ShortcutCommandDefinition, ShortcutGroup } from "@/types/shortcuts";

export const SHORTCUT_COMMANDS: readonly ShortcutCommandDefinition[] = [
  {
    id: "toggle-playback",
    group: "playback",
    labelKey: "shortcuts.command.togglePlayback",
    defaultBinding: { key: "Space" },
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
