import fs from "node:fs/promises";
import { app, BrowserWindow, ipcMain } from "electron";
import {
  __iconIcoPath,
  __iconWindow,
  __preloadScript,
  desktopConfig,
  logger,
} from "@main/constants";

// 在启动阶段尽早暴露资源打包错误，但不阻断主窗口启动。
fs.access(__iconIcoPath).catch(() => {
  console.warn("Warning: Icon file not found at", __iconIcoPath);
});

fs.access(__preloadScript).catch(() => {
  console.warn("Warning: Preload script file not found at", __preloadScript);
});

export let loginWindow: BrowserWindow | null = null;

/** 创建登录窗口；重复调用复用已有实例，保证同一时间只有一个登录会话。 */
export function createLoginWindow(mainWin: BrowserWindow) {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 450,
    height: 600,
    icon: __iconWindow,
    resizable: false,
    title: "Login - Scopify",
    autoHideMenuBar: true,
    parent: mainWin,
    // macOS modal 会变成原生 sheet，与当前登录页的独立窗口布局不兼容。
    modal: process.platform !== "darwin",
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
  const devBase = `http://${desktopConfig.frontend.host}:${desktopConfig.frontend.devPort}`;
  const loginUrl = useStaticRenderer ? "app://-/login/" : `${devBase}/login`;

  void loginWindow
    .loadURL(loginUrl)
    .catch((error) => logger.error("[login] failed to load login window", error));

  loginWindow.webContents.on("before-input-event", (event, input) => {
    const isDevToolsKey =
      input.code === "F12" ||
      ((input.control || input.meta) && input.shift && input.code === "KeyI") ||
      (process.platform === "darwin" && input.meta && input.alt && input.code === "KeyI");

    if (isDevToolsKey) {
      event.preventDefault();
    }
  });

  loginWindow.webContents.on("did-fail-load", (_event, code, desc, validatedURL) => {
    console.error("[login] did-fail-load", { code, desc, validatedURL });
  });

  loginWindow?.on("closed", () => {
    loginWindow = null;
  });
}

/**
 * 注册登录窗口的打开与关闭命令。
 * 调用者必须保证只初始化一次，避免重复监听同一 IPC 频道。
 */
export function initializeLoginWindow(mainWindow: BrowserWindow) {
  ipcMain.on("open-login-window", (_event) => {
    createLoginWindow(mainWindow);
    loginWindow?.show();
    loginWindow?.focus();
  });

  ipcMain.on("close-login-window", () => {
    loginWindow?.close();
  });
}
