import type { BrowserWindow } from "electron";

import type { createDiscordPresenceController } from "@main/services/discordPresence";
import type { DesktopBackendController } from "@main/services/backend";

export interface WindowCapabilityHostOptions {
  backendController: DesktopBackendController;
  discordPresence: ReturnType<typeof createDiscordPresenceController>;
  getMainWindow(): BrowserWindow | null;
  rendererBaseUrl: string;
}
