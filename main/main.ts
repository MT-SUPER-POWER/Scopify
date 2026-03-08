// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { join } from "path";
import fs from "fs/promises";
import type { BrowserWindow as BrowserWindowType } from "electron";
import { initTray } from "./module/tray";
import initializeLoginWindow from "./module/login";

export const __logoIcon = join(__dirname, "../assets/icon.ico");

/**
 * FIXME: 打包导致的 typescript 类型问题，待更好的方案
 * 虽然说我们目前的 preload 是用 ts 写的
 * 但是打包之后都是 .js 文件，所以只能够找同目录的 .js 文件，这个是没办法的
 */
export const __preloadScript = join(__dirname, "preload.js");

// 检查图标文件是否存在
fs.access(__logoIcon).catch(() => {
  console.warn("Warning: Icon file not found at", __logoIcon);
});

const appServe: ((win: BrowserWindowType) => Promise<void>) | null = app.isPackaged
  ? serve({ directory: join(__dirname, "../out") })
  : null;

const devPort = process.env.NEXT_PORT ?? "3000";
const devBase = `http://localhost:${devPort}`;

let mainWindow: BrowserWindowType | null = null;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 840,
    minHeight: 720,
    autoHideMenuBar: true,             // 自动隐藏菜单栏
    icon: __logoIcon,                  // 设置应用图标
    title: "scopify",        // 设置窗口标题
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
    // 注释掉 DevTools 以提升性能，需要时按 Ctrl+Shift+I 打开
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
      console.log("Did fail load:", code, desc);
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ IPC Module ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // IPC 事件监听 - 更新标题栏颜色
  ipcMain.on("update-titlebar-color", (_event, color) => {
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({
        color: 'rgba(0,0,0,0)',
        height: 35,
        symbolColor: color          // * 这里的颜色随着主题切换而切换，避免三控件标志看不见
      });
    }
  });

  // IPC 事件监听 - 全屏化
  ipcMain.on("window-enter-full-screen", () => {
    if (mainWindow) {
      mainWindow.setFullScreen(true);
    }
  });

  // IPC 事件监听 - 退出全屏
  ipcMain.on("window-exit-full-screen", (_event) => {
    if (mainWindow) {
      mainWindow.setFullScreen(false);
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

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// TODO: GPU 加速



// 应用程序准备就绪时的处理
app.whenReady().then(() => {
  console.log("Scopify ready, creating window...");

  createWindow();
  initTray();
  initializeLoginWindow();

  // Mac 的特殊处理
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
