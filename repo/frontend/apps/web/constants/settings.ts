import type { SettingsTabDefinition } from "@/types/settings";

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
  { id: "general", labelKey: "settings.tab.general" },
  { id: "appearance", labelKey: "settings.tab.appearance" },
  { id: "network", labelKey: "settings.tab.network" },
  { id: "storage", labelKey: "settings.tab.storage" },
  { id: "desktop", labelKey: "settings.tab.desktop" },
  { id: "shortcuts", labelKey: "settings.tab.shortcuts" },
  { id: "notifications", labelKey: "notifications.title" },
];

export const SETTINGS_ACTION_BUTTON_CLASS_NAME =
  "inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
