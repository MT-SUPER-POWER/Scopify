import type { DesktopHostConfig } from "@mt-super-power/desktop-contract";
import type { WebConfig } from "@/types/config";

export type SettingsTabId = "general" | "network" | "storage" | "desktop" | "shortcuts";

export interface SettingsPageRouteProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export interface SettingsConfig {
  desktop: DesktopHostConfig | null;
  web: WebConfig;
}

type ConfigChangeHandler<Config> = <
  Section extends keyof Config,
  Key extends keyof Config[Section],
>(
  section: Section,
  key: Key,
  value: Config[Section][Key],
) => void;

export type DesktopSettingsChangeHandler = ConfigChangeHandler<DesktopHostConfig>;
export type WebSettingsChangeHandler = ConfigChangeHandler<WebConfig>;
