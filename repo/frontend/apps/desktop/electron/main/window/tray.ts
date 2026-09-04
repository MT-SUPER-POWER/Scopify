import { app, BrowserWindow, screen, Tray } from "electron";
import { __iconTray, __preloadScript, desktopConfig } from "@main/constants";
import { trayLog } from "@main/utils/logger";

const TRAY_WIDTH = 240;
const TRAY_HEIGHT = 420;
const X_OFFSET = 15;
const Y_OFFSET = 4;

// Electron 原生对象必须保留强引用，否则垃圾回收会让托盘和窗口提前失效。
export let trayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let lastBlurTime = 0;

export function getTrayWindow(): BrowserWindow | null {
  return trayWindow && !trayWindow.isDestroyed() ? trayWindow : null;
}

interface TrayOptions {
  onMainWindowRequested?(): Promise<void> | void;
}

function createTrayWindow() {
  const window = new BrowserWindow({
    width: TRAY_WIDTH,
    height: TRAY_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false, // 生产环境禁用开发者工具
    },
  });

  const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
  const devBase = `http://${desktopConfig.frontend.host}:${desktopConfig.frontend.devPort}`;
  const trayUrl = useStaticRenderer ? "app://-/tray/" : `${devBase}/tray`;

  trayWindow = window;
  void window.loadURL(trayUrl).catch((error) => {
    trayLog.error("failed to load", {
      destroyed: window.isDestroyed(),
      error,
    });
  });
  window.webContents.on("did-fail-load", (_event, code, desc, validatedURL) => {
    trayLog.error("did-fail-load", { code, desc, validatedURL });
  });

  window.on("blur", () => {
    lastBlurTime = Date.now();
    if (!window.isDestroyed()) window.destroy();
  });

  window.on("closed", () => {
    if (trayWindow === window) trayWindow = null;
  });

  return window;
}

function toggleTrayWindow(trayBounds?: Electron.Rectangle) {
  const timeSinceLastBlur = Date.now() - lastBlurTime;
  const existingWindow = trayWindow && !trayWindow.isDestroyed() ? trayWindow : null;

  if (existingWindow?.isVisible()) {
    existingWindow.destroy();
    return;
  }
  if (timeSinceLastBlur < 100) {
    return;
  }

  const currentTrayWindow = existingWindow ?? createTrayWindow();

  const windowBounds = currentTrayWindow.getBounds();
  const fallbackPoint = screen.getCursorScreenPoint();
  const targetPoint = trayBounds ?? fallbackPoint;
  const currentDisplay = screen.getDisplayNearestPoint(targetPoint);
  const workArea = currentDisplay.workArea;
  const maxRight = workArea.x + workArea.width;

  const bounds = trayBounds ?? {
    x: fallbackPoint.x,
    y: fallbackPoint.y,
    width: 0,
    height: 0,
  };

  let x = Math.round(bounds.x) + X_OFFSET;
  if (x + windowBounds.width > maxRight) {
    x = Math.round(bounds.x + bounds.width - windowBounds.width) - X_OFFSET;
  }
  if (x < workArea.x) x = workArea.x + 10;

  let y: number;
  if (bounds.y > currentDisplay.bounds.height / 2) {
    y = bounds.y - windowBounds.height - Y_OFFSET;
  } else {
    y = bounds.y + bounds.height + Y_OFFSET;
  }
  if (y < workArea.y) y = workArea.y + 10;
  if (y + windowBounds.height > workArea.y + workArea.height) {
    y = workArea.y + workArea.height - windowBounds.height - 10;
  }

  currentTrayWindow.setOpacity(0);
  currentTrayWindow.setPosition(x, y, false);
  currentTrayWindow.show();
  currentTrayWindow.focus();

  setTimeout(() => {
    if (currentTrayWindow && !currentTrayWindow.isDestroyed() && currentTrayWindow.isVisible()) {
      currentTrayWindow.setOpacity(1);
    }
  }, 20);
}

/** 初始化系统托盘和按需创建的托盘窗口。重复调用保持幂等。 */
export function initTray(mainWindow: BrowserWindow, options: TrayOptions = {}) {
  // 如果已经初始化过，不要重复创建
  if (tray) return;

  tray = new Tray(__iconTray);
  tray.setToolTip("Scopify");

  tray.on("right-click", (_event, trayBounds) => {
    toggleTrayWindow(trayBounds);
  });

  tray.on("click", (_event, trayBounds) => {
    toggleTrayWindow(trayBounds);
  });

  tray.on("double-click", () => {
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.destroy();
    }
    if (options.onMainWindowRequested) {
      void Promise.resolve(options.onMainWindowRequested()).catch((error) => {
        trayLog.error("failed to reveal the main window", error);
      });
      return;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  // 妥善清理 Tray，避免退出时系统托盘留下残影
  app.on("before-quit", () => {
    if (trayWindow && !trayWindow.isDestroyed()) trayWindow.destroy();
    trayWindow = null;
    if (tray) {
      tray.destroy();
      tray = null;
    }
  });
}
