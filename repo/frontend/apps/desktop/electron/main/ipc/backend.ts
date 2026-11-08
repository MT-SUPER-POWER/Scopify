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
  ipcMain.handle("qq-backend:get-status", () => qqBackendController.getStatus());
  ipcMain.handle("qq-backend:restart", (event) => {
    if (!isMainRenderer(event, mainWindow)) throw new Error("Unauthorized backend restart.");
    return qqBackendController.restart(loadDesktopHostConfig().backend.qq);
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
