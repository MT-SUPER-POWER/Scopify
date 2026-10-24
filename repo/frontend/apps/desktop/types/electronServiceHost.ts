import type { BrowserWindow } from "electron";

import type { createDiscordPresenceController } from "@main/service/discordPresence";
import type { DesktopBackendController } from "@/types/service/backend";

export interface WindowServiceHostOptions {
  backendController: DesktopBackendController;
  discordPresence: ReturnType<typeof createDiscordPresenceController>;
  getMainWindow(): BrowserWindow | null;
  rendererBaseUrl: string;
}
