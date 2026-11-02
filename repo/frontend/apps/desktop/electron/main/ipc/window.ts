import { ipcMain, nativeTheme, type BrowserWindow } from "electron";
import { ipcLog } from "@main/utils/logger";
import { loginWindow } from "@main/window/login";
import { MAIN_WINDOW_TITLE_BAR_HEIGHT } from "@main/window/mainWindow";

/** 注册主窗口导航、外观和登录完成后的窗口协调命令。 */
export function registerWindowIpc(mainWindow: BrowserWindow | null) {
  ipcMain.on("login-success", () => {
    ipcLog.info("[IPC] login success");
    loginWindow?.close();
    mainWindow?.reload();
  });
  ipcMain.on("update-titlebar-color", (_event, color: unknown) => {
    if (typeof color !== "string") return;
    const isDark = color.toLowerCase() === "#ffffff" || color.toLowerCase() === "white";
    nativeTheme.themeSource = isDark ? "dark" : "light";
    // setTitleBarOverlay 仅 Windows / Linux 支持；macOS 红绿灯明暗外观由 nativeTheme 同步
    if (process.platform === "darwin") return;
    mainWindow?.setTitleBarOverlay({
      color: "rgba(0,0,0,0)",
      height: MAIN_WINDOW_TITLE_BAR_HEIGHT,
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
