import type { BrowserWindow } from "electron";
export interface DesktopIconVisibilityServiceOptions {
  getControllerWindow?: () => BrowserWindow | null;
}
