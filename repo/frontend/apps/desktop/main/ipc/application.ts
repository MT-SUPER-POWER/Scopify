import { app, BrowserWindow, ipcMain } from "electron";
import { loadDesktopHostConfig, saveDesktopHostConfig } from "../store/index.js";
import { logger } from "../constants.js";
import { getRememberedAppCloseAction, isAppCloseAction } from "../window/appCloseAction.js";
import { isAppCloseWindowSender } from "../window/appCloseWindow.js";
import { trayWindow } from "../window/tray.js";

/** 注册应用重启、退出以及“关闭窗口”决策的命令接口。 */
export function registerApplicationIpc(mainWindow: BrowserWindow | null) {
  ipcMain.on("relaunch-app", () => {
    logger.info("[IPC] relaunch requested");
    app.relaunch();
    app.quit();
  });
  ipcMain.on("app-close-action", (event, action: unknown, remember: unknown) => {
    if (!isAppCloseWindowSender(event.sender.id)) {
      logger.warn("[app-close] rejected action from an unexpected renderer");
      return;
    }
    if (!isAppCloseAction(action) || typeof remember !== "boolean") return;

    const rememberedAction = getRememberedAppCloseAction(action, remember);
    if (rememberedAction !== null) {
      try {
        const config = loadDesktopHostConfig();
        saveDesktopHostConfig({
          ...config,
          app: { ...config.app, closeAction: rememberedAction },
        });
      } catch (error) {
        logger.error("[app-close] failed to persist the remembered action", error);
      }
    }
    if (action === "minimize" || action === "cancel") {
      const actionWindow = BrowserWindow.fromWebContents(event.sender);
      if (actionWindow && actionWindow !== mainWindow) actionWindow.close();
      if (action === "minimize") mainWindow?.hide();
      return;
    }
    if (action === "exit") app.quit();
  });
  ipcMain.on("exit-app", () => app.quit());
  ipcMain.on("minimize-to-tray", () => {
    mainWindow?.hide();
    trayWindow?.hide();
  });
}
