import { ipcMain, app, BrowserWindow } from "electron";
import { loadAppConfig, saveAppConfig } from "../config.js";
import { ensureBackendUrl } from "./backend.js";
import { logger } from "../constants.js";

export function registerIpcHandlers(mainWindow: BrowserWindow | null) {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BACKEND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 提供一个 IPC 接口，让前端可以获取后端 URL
  ipcMain.handle("backend:get-url", async () => ensureBackendUrl());

  // 提供一个同步 IPC 接口，供需要在渲染进程同步获取后端 URL 的场景使用
  ipcMain.on("backend:get-url-sync", (event) => {
    event.returnValue = ensureBackendUrl();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONFIG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 监听获取配置请求
  ipcMain.handle("get-app-config", () => {
    const config = loadAppConfig();
    logger.info("[IPC] 前端请求获取配置:", config);
    return config;
  });

  // 监听更新配置请求
  ipcMain.handle("update-app-config", (_event, newConfig) => {
    logger.info("[IPC] 接收到前端配置更新请求:", newConfig);
    // return saveAppConfig(newConfig);
  });


  // TODO: 用户修改完配置之后，如果涉及到需要重启才能生效的配置项（比如后端地址、日志级别等）
  // 可以在这里发送一个事件通知前端，提示用户重启应用以应用新配置。

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ OTHER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


  // IPC 事件监听 - 更新标题栏颜色
  ipcMain.on("update-titlebar-color", (_event, color) => {
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({
        color: 'rgba(0,0,0,0)',
        height: 35,
        symbolColor: color
      });
    }
  });

  ipcMain.on("window-enter-full-screen", () => {
    if (mainWindow) {
      mainWindow.setFullScreen(true);
    }
  });

  ipcMain.on("window-exit-full-screen", (_event) => {
    if (mainWindow) {
      mainWindow.setFullScreen(false);
    }
  });

  ipcMain.on("main-window-reload", () => {
    mainWindow?.reload();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ APP CLOSE AND MINIMIZE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ipcMain.on("app-close-action", (_event, action) => {
    if (action === "minimize") {
      mainWindow?.hide();
    } else if (action === "exit") {
      if (mainWindow) mainWindow.destroy();
      app.exit();
    }
  });

  ipcMain.on("exit-app", () => {
    if (mainWindow) mainWindow.destroy();
    app.exit();
  });

  ipcMain.on("minimize-to-tray", () => {
    mainWindow?.hide();
  });
}
