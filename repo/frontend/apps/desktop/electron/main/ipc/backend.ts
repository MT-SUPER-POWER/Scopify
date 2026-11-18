import { ipcMain, type BrowserWindow } from "electron";
import type { DesktopBackendController } from "@/types/service/backend";
import { loadDesktopHostConfig } from "@main/store";
import { isMainRenderer } from "./sender";

/** 把本地后端状态投影给主 Renderer，并随窗口关闭解除订阅。 */
export function registerBackendIpc(
  mainWindow: BrowserWindow | null,
  backendController: DesktopBackendController,
  qqBackendController: DesktopBackendController,
) {
  ipcMain.handle("backend:get-status", () => backendController.getStatus());
  ipcMain.handle("backend:restart", (event) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized backend restart.");
    return backendController.restart(loadDesktopHostConfig().backend.netease);
  });
  // Stop only for this session: the saved config keeps autoStart, so the next launch starts it again.
  ipcMain.handle("backend:stop", (event) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized backend stop.");
    return backendController.reconcile({
      ...loadDesktopHostConfig().backend.netease,
      autoStart: false,
    });
  });
  ipcMain.handle("qq-backend:get-status", () => qqBackendController.getStatus());
  ipcMain.handle("qq-backend:restart", (event) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized backend restart.");
    return qqBackendController.restart(loadDesktopHostConfig().backend.qq);
  });
  ipcMain.handle("qq-backend:stop", (event) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized backend stop.");
    return qqBackendController.reconcile({
      ...loadDesktopHostConfig().backend.qq,
      autoStart: false,
    });
  });

  const forward = (channel: string) => (status: unknown) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, status);
  };
  const unsubscribe = backendController.onStatusChanged(forward("backend:status-changed"));
  const unsubscribeQq = qqBackendController.onStatusChanged(forward("qq-backend:status-changed"));
  mainWindow?.once("closed", () => {
    unsubscribe();
    unsubscribeQq();
  });
}
