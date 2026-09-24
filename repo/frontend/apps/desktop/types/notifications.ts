import type { BrowserWindow } from "electron";

export interface DesktopNotificationOptions {
  getMainWindow(): BrowserWindow | null;
  getBackendOrigin(): string;
  showMainWindow(): Promise<void>;
}
