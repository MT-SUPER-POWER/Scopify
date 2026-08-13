import { SETTINGS_TABS } from "@/constants/settings";
import type { SettingsTabId } from "@/types/settings";

export function parseSettingsTab(value: string | string[] | undefined): SettingsTabId {
  const candidate = typeof value === "string" ? value : "";
  return SETTINGS_TABS.some((tab) => tab.id === candidate)
    ? (candidate as SettingsTabId)
    : "general";
}
