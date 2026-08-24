import type { WebConfig } from "@/types/config";
import type { SettingsConfig } from "@/types/settings";

/**
 * Keeps the renderer's API target independent from Desktop-owned local backend
 * lifecycle settings such as auto-start and the managed port.
 */
export function buildSavedSettingsConfig(
  config: SettingsConfig,
  backend: WebConfig["backend"],
): SettingsConfig {
  return {
    desktop: config.desktop,
    web: {
      ...config.web,
      backend,
    },
  };
}
