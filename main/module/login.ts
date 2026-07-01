import fs from "node:fs/promises";
import { app, BrowserWindow, ipcMain } from "electron";
import { __iconIcoPath, __iconWindow, __preloadScript, appConfig } from "../constants.js";

// 检查图标文件是否存在
fs.access(__iconIcoPath).catch(() => {
  console.warn("Warning: Icon file not found at", __iconIcoPath);
});

fs.access(__preloadScript).catch(() => {
  console.warn("Warning: Preload script file not found at", __preloadScript);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export let loginWindow: BrowserWindow | null = null; // 登录窗口实例

export const createLoginWindow = async (mainWin: BrowserWindow) => {
  // 如果登录窗口已存在，则聚焦并返回
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 450,
    height: 600,
    icon: __iconWindow, // 设置应用图标
    resizable: false,
    title: "Login - Scopify",
    autoHideMenuBar: true,
    parent: mainWin, // 设置父窗口
    modal: process.platform !== "darwin", // macOS 下设为 false 避免变成无边框的 sheet
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
  const devPort = appConfig.frontend.devPort || 3000;
  const loginUrl = useStaticRenderer ? "app://-/login/" : `http://localhost:${devPort}/login`;

  loginWindow.loadURL(loginUrl);

  if (appConfig.app.devTools) {
    loginWindow.webContents.openDevTools({ mode: "detach" });
  }

  loginWindow.webContents.on("before-input-event", (event, input) => {
    const isDevToolsKey =
      input.code === "F12" ||
      ((input.control || input.meta) && input.shift && input.code === "KeyI") ||
      (process.platform === "darwin" && input.meta && input.alt && input.code === "KeyI");

    if (isDevToolsKey) {
      if (appConfig.app.devTools) {
        if (input.type === "keyDown") {
          loginWindow?.webContents.toggleDevTools();
        }
      }
      event.preventDefault();
    }
  });

  loginWindow.webContents.on("did-fail-load", (_event, code, desc, validatedURL) => {
    console.error("[login] did-fail-load", { code, desc, validatedURL });
  });

  loginWindow?.on("closed", () => {
    loginWindow = null;
  });
};

/**
 * 初始化登录窗口相关的IPC监听
 */
export function initializeLoginWindow(mainWindow: Electron.BrowserWindow) {
  ipcMain.on("open-login-window", (_event) => {
    createLoginWindow(mainWindow);
    loginWindow?.show();
    loginWindow?.focus();
  });

  ipcMain.on("close-login-window", () => {
    console.log("[Main] Received close-login-window IPC message");
    loginWindow?.close();
  });
}

export default initializeLoginWindow;
