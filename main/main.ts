// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { join } from "path";
import type { BrowserWindow as BrowserWindowType } from "electron";

// module
import initTray from "./module/tray.js";
import initializeLoginWindow from "./module/login.js";
import { initThumbarButtons } from "./module/thumbarButtons.js";
import { __logoIcon, __preloadScript } from "./constants.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const appServe: ((win: BrowserWindowType) => Promise<void>) | null = app.isPackaged
  ? serve({ directory: join(__dirname, "../renderer") })
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

  // IPC 事件监听 - 刷新主窗口
  ipcMain.on("main-window-reload", () => {
    console.log("Received main-window-reload event, reloading main window...");
    mainWindow?.reload();
  })

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

  // TODO: 关闭按钮显示，最小化或者关闭程序，而不是直接关闭
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// TODO: GPU 加速


// TODO: 修改软件的进程名字 和 icon 图标

// 应用程序准备就绪时的处理
app.whenReady().then(() => {
  console.log("Scopify ready, creating window...");

  createWindow();

  if (mainWindow) {
    initTray(mainWindow);
    initializeLoginWindow(mainWindow);
    initThumbarButtons(mainWindow);
  }

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

// 捕获未处理的异常，直接退出 Electron
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  app.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  app.exit(1);
});
