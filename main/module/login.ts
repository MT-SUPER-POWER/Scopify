import { __logoIcon, __preloadScript } from "../constants.js";
import fs from "fs/promises";
import { app, BrowserWindow, ipcMain } from "electron";

// 检查图标文件是否存在
fs.access(__logoIcon).catch(() => {
  console.warn("Warning: Icon file not found at", __logoIcon);
});

fs.access(__preloadScript).catch(() => {
  console.warn("Warning: Preload script file not found at", __preloadScript);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let loginWindow: BrowserWindow | null = null; // 登录窗口实例

export const createLoginWindow = async (mainWin: BrowserWindow) => {


  // 如果登录窗口已存在，则聚焦并返回
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  // NOTE: Electron 子窗口的创建
  loginWindow = new BrowserWindow({
    width: 450,
    height: 600,
    icon: __logoIcon,                  // 设置应用图标
    resizable: false,
    title: "Login - Scopify",
    autoHideMenuBar: true,
    parent: mainWin, // 设置父窗口
    modal: true, // 可选：如果你希望它是模态的
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const devPort = process.env.NEXT_PORT ?? "3000";
  const loginUrl = app.isPackaged
    ? "app://-/login.html"
    : `http://localhost:${devPort}/login`;

  loginWindow.loadURL(loginUrl);

  loginWindow?.on("closed", () => {
    loginWindow = null;
  });
};

/**
 * 初始化登录窗口相关的IPC监听
 */
export function initializeLoginWindow(mainWindow: Electron.BrowserWindow) {
  ipcMain.on('open-login-window', (event) => {
    createLoginWindow(mainWindow);
    loginWindow?.show();
    loginWindow?.focus();
  });

  ipcMain.on('close-login-window', () => {
    loginWindow?.close();
  });
}

export default initializeLoginWindow;
