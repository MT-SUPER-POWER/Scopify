import { ipcMain, app, BrowserWindow, session } from "electron";
import { loadAppConfig, saveAppConfig } from "../config.js";
import { ensureBackendUrl } from "./backend.js";
import { appConfig, logger } from "../constants.js";
import { Tray } from "electron/main";
import { Minimize } from 'lucide-react';
import { trayWindow } from "./tray.js";
import { updateThumbarButtons } from "./thumbarButtons.js";
import { loginWindow } from "./login.js";

export function registerIpcHandlers(mainWindow: BrowserWindow | null) {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PLAYER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ipcMain.on("player-state-changed", (_event, { isPlaying }: { isPlaying: boolean }) => {
    if (mainWindow) {
      updateThumbarButtons(mainWindow, isPlaying);
    }
  });

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
    logger.info("\n[IPC] 前端请求获取配置:", config);
    return config;
  });

  // 监听更新配置请求
  ipcMain.handle("update-app-config", (_event, newConfig) => {
    logger.info("\n[IPC] 接收到前端配置更新请求:", newConfig);
    return saveAppConfig(newConfig);
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ OTHER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ipcMain.on("login-success", () => {
    logger.info("[IPC] 登录成功，准备关闭登录窗口并打开主窗口");
    loginWindow?.close();
    mainWindow?.webContents.send("show-login-toast");
    mainWindow?.reload();
  });


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

  ipcMain.on("navigate-main-window", (_event, path) => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send("navigate-to", path);
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ APP CLOSE AND MINIMIZE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ipcMain.on("app-close-action", (_event, action) => {
    if (action === "minimize") {
      mainWindow?.hide();
    } else if (action === "exit") {
      app.quit();
    }
  });

  ipcMain.on("exit-app", () => {
    app.quit();
  });

  // minimizeApp: () => void;
  ipcMain.on("minimize-to-tray", () => {
    mainWindow?.hide();
    trayWindow?.hide();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COOKIE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ipcMain.handle("set-music-cookie", async (_event, cookieStr: string) => {
    try {
      const musicUMatch = cookieStr.match(/MUSIC_U=([^;]+)/);
      const value = musicUMatch ? musicUMatch[1] : cookieStr;

      // 修正：Electron 设置域名为 IP 的 Cookie 时，url 必须包含协议前缀，且不能带端口，更不能有 $ 符号
      const url = `http://${appConfig.backend.host}`;

      // 存储到默认 session，供渲染进程后续请求使用
      await session.defaultSession.cookies.set({
        url: url,
        name: 'MUSIC_U',
        value: value,
        path: '/',
        sameSite: 'no_restriction', // ← 对应 SameSite=None
        expirationDate: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60) // 60天
      });
      logger.info('[IPC] set-music-cookie success');
      return true;
    } catch (err) {
      logger.error('[IPC] set-music-cookie failed', err);
      throw err;
    }
  });

}
