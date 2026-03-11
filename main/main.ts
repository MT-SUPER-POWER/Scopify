// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { app, BrowserWindow, ipcMain } from "electron";
import serve from "electron-serve";
import { dirname, join } from "path";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import type { BrowserWindow as BrowserWindowType } from "electron";
import log from "electron-log";

// NOTE: 配置日志自定义存储位置
const logPath = app.isPackaged
  ? join(app.getPath("userData"), "logs/main.log")
  : join(__dirname, "../logs/main.log");

log.transports.file.resolvePathFn = () => logPath;
log.transports.file.level = "info";

log.info("App starting...");
log.info("[logger] logging to:", logPath);

// module
import initTray from "./module/tray.js";
import initializeLoginWindow from "./module/login.js";
import { initThumbarButtons } from "./module/thumbarButtons.js";
import { __logoIcon, __preloadScript } from "./constants.js";
import { getFinalConfig } from "./config.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// NOTE: electron-serve 结合 next.js
const appServe: ((win: BrowserWindowType) => Promise<void>) | null = app.isPackaged
  ? serve({ directory: join(__dirname, "../renderer") })
  : null;

// 初始化配置
const appConfig = getFinalConfig();

const devPort = appConfig.frontend.devPort;
const devBase = `http://localhost:${devPort}`;
let mainWindow: BrowserWindowType | null = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BACKEND  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let backendProcess: ChildProcess | null = null;
let backendUrl = process.env.BACKEND_URL;

function resolveBackendPath() {
  if (!app.isPackaged) {
    return join(__dirname, "..", "backend", "api-enhanced");
  }
  return join(process.resourcesPath, "backend", "api-enhanced");
}

function ensureBackendUrl() {
  if (backendUrl) return backendUrl;
  backendUrl = `http://${appConfig.backend.host}:${appConfig.backend.port}`;
  return backendUrl;
}

function startManagedBackend() {
  // 如果配置禁用或已指定外部后端则不启动
  if (!appConfig.backend.autoStart || process.env.BACKEND_URL) {
    log.info("[backend] use external or disabled:", process.env.BACKEND_URL ?? "disabled");
    backendUrl = process.env.BACKEND_URL;
    return;
  }

  const backendDir = resolveBackendPath();
  const entry = join(backendDir, "app.js");

  log.info("[backend] checking path:", backendDir);
  log.info("[backend] checking entry:", entry);

  if (!fs.existsSync(entry)) {
    log.error("[backend] entry not found:", entry);
    return;
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: `${appConfig.backend.port}`,
    NODE_ENV: "production",
    ELECTRON_RUN_AS_NODE: "1",
  };

  log.info(`[backend] starting ${entry} on PORT ${env.PORT}`);
  backendProcess = spawn(process.execPath, [entry], {
    cwd: backendDir,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  log.info(`[backend] Process initialized with PID: ${backendProcess.pid}`);

  backendProcess!.stdout?.on("data", (d) => log.info("[backend:stdout]", d.toString().trim()));
  backendProcess!.stderr?.on("data", (d) => log.error("[backend:stderr]", d.toString().trim()));
  backendProcess!.on("exit", (code) => {
    log.error("[backend:exit]", `exited with code ${code}`);
  });
  backendProcess!.on("error", (err) => {
    log.error("[backend:error]", err.message);
  });

  backendUrl = ensureBackendUrl();
}

function stopManagedBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HARDWARE ACCELERATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (!appConfig.app.gpuAcceleration) {
  app.disableHardwareAcceleration();
  console.warn("[app] Hardware acceleration disabled based on config.");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LIFECYCLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.whenReady().then(() => {
  console.log("Scopify ready, creating window...");

  startManagedBackend();

  ipcMain.handle("backend:get-url", async () => ensureBackendUrl());
  ipcMain.on("backend:get-url-sync", (event) => {
    event.returnValue = ensureBackendUrl();
  });

  createWindow();

  if (mainWindow) {
    initTray(mainWindow);
    initializeLoginWindow(mainWindow);
    initThumbarButtons(mainWindow);
  }

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

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  app.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  app.exit(1);
});
