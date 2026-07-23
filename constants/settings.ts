import type { TranslationKey } from "@/lib/i18n";
import type { SettingsTabId } from "@/types/settings";

export const SETTINGS_TABS: readonly { id: SettingsTabId; labelKey: TranslationKey }[] = [
  { id: "general", labelKey: "settings.tab.general" },
  { id: "network", labelKey: "settings.tab.network" },
  { id: "storage", labelKey: "settings.tab.storage" },
  { id: "desktop", labelKey: "settings.tab.desktop" },
  { id: "shortcuts", labelKey: "settings.tab.shortcuts" },
];
