// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import { join } from "path";
import type { BrowserWindow as BrowserWindowType } from "electron";

// module
import initTray from "./module/tray.js";
import initializeLoginWindow from "./module/login.js";
import { initThumbarButtons } from "./module/thumbarButtons.js";
import { __logoIcon, __preloadScript, appConfig, cleanOldLogs, logger } from "./constants.js";
import { registerIpcHandlers } from "./module/ipc.js";
import { startManagedBackend, stopManagedBackend } from "./module/backend.js";
import { log } from "console";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// NOTE: electron-serve 结合 next.js
const appServe: ((win: BrowserWindowType) => Promise<void>) | null = app.isPackaged
  ? serve({ directory: join(__dirname, "../renderer") })
  : null;

// 初始化配置

const devPort = appConfig.frontend.devPort;
const devBase = `http://localhost:${devPort}`;
let mainWindow: BrowserWindowType | null = null;

logger.info("--------------------------------------------------");
logger.info("Fronted Base URL is", devBase);
logger.info("--------------------------------------------------");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 840,
    minHeight: 720,
    autoHideMenuBar: true,             // 自动隐藏菜单栏
    icon: __logoIcon,                  // 设置应用图标
    title: "scopify",                  // 设置窗口标题
    titleBarOverlay: {
      color: 'rgba(0,0,0,0)',          // 完全透明
      height: 35,
      symbolColor: 'white'
    },
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (app.isPackaged) {
    appServe && appServe(mainWindow).then(() => {
      mainWindow?.loadURL("app://-");
    });
  } else {
    mainWindow.loadURL(devBase);
    if (appConfig.app.devTools) {
      mainWindow.webContents.openDevTools();
    }
    mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
      logger.error("Did fail load:", code, desc);
      mainWindow?.webContents.reloadIgnoringCache();
    });
  }

  // 禁用缩放快捷键（防止误触）
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // 禁止 Ctrl/Cmd + 数字 0 (重置缩放)
    if ((input.control || input.meta) && input.key === "0") {
      event.preventDefault();
    }
    // 禁止 Ctrl/Cmd + = 和 Ctrl/Cmd + + (放大)
    if ((input.control || input.meta) && (input.key === "=" || input.key === "+")) {
      event.preventDefault();
    }
    // 禁止 Ctrl/Cmd + - (缩小)
    if ((input.control || input.meta) && input.key === "-") {
      event.preventDefault();
    }
  });

  // 监听窗口进入全屏事件（包括 F11）
  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      // NOTE: 主线程通过 webContents 来通知 preload
      mainWindow.webContents.send("window-full-screen-changed", { isFullScreen: true });
    }
  });

  // 监听窗口退出全屏事件（包括 F11）
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("window-full-screen-changed", { isFullScreen: false });
    }
  });

  mainWindow.on("close", (e: any) => {
    e.preventDefault(); // 阻止默认的关闭行为
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send("app-close-confirm");
    }
  });
}

if (!appConfig.app.gpuAcceleration) {
  app.disableHardwareAcceleration();
  logger.warn("[app] Hardware acceleration disabled based on config.");
}

app.whenReady().then(() => {
  logger.info("Scopify ready, creating window...");
  startManagedBackend();

  try {
    createWindow();
  } catch (err) {
    logger.error("Failed to create main window:", err);
  }

  if (mainWindow) {
    registerIpcHandlers(mainWindow);
    initTray(mainWindow);
    initializeLoginWindow(mainWindow);
    initThumbarButtons(mainWindow);
  }

  // 定时清理日志
  cleanOldLogs();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopManagedBackend();
});

// 对于线程意外崩溃或未捕获的异常，记录日志并退出
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  app.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  app.exit(1);
});
