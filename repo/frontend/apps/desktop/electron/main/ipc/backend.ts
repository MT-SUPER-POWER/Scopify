import { ipcMain, type BrowserWindow } from "electron";
import type { DesktopBackendController } from "@main/services/backend";

/** 把本地后端状态投影给主 Renderer，并随窗口关闭解除订阅。 */
export function registerBackendIpc(
  mainWindow: BrowserWindow | null,
  backendController: DesktopBackendController,
) {
  ipcMain.handle("backend:get-status", () => backendController.getStatus());
  const unsubscribe = backendController.onStatusChanged((status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("backend:status-changed", status);
    }
  });
  mainWindow?.once("closed", unsubscribe);
}
