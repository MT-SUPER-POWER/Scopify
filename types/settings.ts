import type { AppConfig } from "@/types/config";

export type SettingsTabId = "general" | "network" | "storage" | "desktop" | "shortcuts";

export interface SettingsPageRouteProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export type SettingsChangeHandler = <
  Section extends keyof AppConfig,
  Key extends keyof AppConfig[Section],
>(
  section: Section,
  key: Key,
  value: AppConfig[Section][Key],
) => void;
