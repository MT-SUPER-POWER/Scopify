import type { TranslationKey } from "@/lib/i18n";
import type { SettingsTabId } from "@/types/settings";

export const SETTINGS_TABS: readonly { id: SettingsTabId; labelKey: TranslationKey }[] = [
  { id: "general", labelKey: "settings.tab.general" },
  { id: "appearance", labelKey: "settings.tab.appearance" },
  { id: "network", labelKey: "settings.tab.network" },
  { id: "storage", labelKey: "settings.tab.storage" },
  { id: "desktop", labelKey: "settings.tab.desktop" },
  { id: "shortcuts", labelKey: "settings.tab.shortcuts" },
];

export const SETTINGS_ACTION_BUTTON_CLASS_NAME =
  "inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:opacity-50";
