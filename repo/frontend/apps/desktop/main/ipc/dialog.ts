import { dialog, ipcMain, type BrowserWindow } from "electron";
import { isMainRenderer } from "./sender.js";

/** 注册需要原生系统对话框的通用选择能力。 */
export function registerDialogIpc(mainWindow: BrowserWindow | null) {
  ipcMain.handle("dialog:select-directory", async (event, defaultPath?: string) => {
    if (!isMainRenderer(event, mainWindow)) return null;
    const options: Electron.OpenDialogOptions = {
      properties: ["openDirectory"],
      defaultPath:
        typeof defaultPath === "string" && defaultPath.trim() ? defaultPath.trim() : undefined,
    };
    const result =
      mainWindow && !mainWindow.isDestroyed()
        ? await dialog.showOpenDialog(mainWindow, options)
        : await dialog.showOpenDialog(options);
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });
}
