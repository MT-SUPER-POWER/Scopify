import { ipcMain, type BrowserWindow } from "electron";
import { logger } from "@main/constants";
import { loginWindow } from "@main/window/login";

/** 注册主窗口导航、外观和登录完成后的窗口协调命令。 */
export function registerWindowIpc(mainWindow: BrowserWindow | null) {
  ipcMain.on("login-success", () => {
    logger.info("[IPC] login success");
    loginWindow?.close();
    mainWindow?.reload();
  });
  ipcMain.on("update-titlebar-color", (_event, color) => {
    mainWindow?.setTitleBarOverlay({
      color: "rgba(0,0,0,0)",
      height: 35,
      symbolColor: color,
    });
  });
  ipcMain.on("window-enter-full-screen", () => mainWindow?.setFullScreen(true));
  ipcMain.on("window-exit-full-screen", () => mainWindow?.setFullScreen(false));
  ipcMain.on("main-window-reload", () => mainWindow?.reload());
  ipcMain.on("navigate-main-window", (_event, path) => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate-to", path);
  });
}
