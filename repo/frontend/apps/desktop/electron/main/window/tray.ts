import { __iconTray, __preloadScript, desktopConfig, RENDERER_SCHEME } from "@main/constants";
import { app, BrowserWindow, nativeTheme, screen, Tray } from "electron";
import { createTrayPanelController } from "./trayPanel";
import type { TrayOptions } from "@/types/tray";
import { trayLog } from "@main/utils/logger";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 默认 TrayWindow 大小
const TRAY_WIDTH = 240;
const TRAY_HEIGHT = 520;

// Electron 原生对象必须保留强引用，否则垃圾回收会让托盘和窗口提前失效。
export let trayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

let panelController: ReturnType<typeof createTrayPanelController> | null = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FUNCTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 获取托盘窗口
 */
export function getTrayWindow(): BrowserWindow | null {
  return trayWindow && !trayWindow.isDestroyed() ? trayWindow : null;
}

/**
 * 创建托盘窗口
 */
function createTrayWindow() {
  const _trayWindow = new BrowserWindow({
    width: TRAY_WIDTH,
    height: TRAY_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    transparent: false,
    // 关闭 Windows 原生边框动效，消除显隐与关闭时的系统过渡残影
    thickFrame: false,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#18181b" : "#ffffff",
    webPreferences: {
      preload: __preloadScript,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false, // 是否启用开发者工具
      backgroundThrottling: true, // 是否开启后台运行时保持活跃
    },
  });

  const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
  const devBase = `http://${desktopConfig.frontend.host}:${desktopConfig.frontend.devPort}`;
  const trayUrl = useStaticRenderer ? `${RENDERER_SCHEME}://-/tray/` : `${devBase}/tray`;

  trayWindow = _trayWindow; // 创建 trayWindow 并赋值
  const controller = createTrayPanelController({
    window: _trayWindow,
    getWorkArea: (point) => screen.getDisplayNearestPoint(point).workArea,
  });
  panelController = controller;
  // 页面加载完成后直接标记控制器就绪
  void _trayWindow
    .loadURL(trayUrl)
    .then(() => {
      if (!_trayWindow.isDestroyed()) controller.markReady();
    })
    .catch((error) => {
      trayLog.error("failed to load", {
        destroyed: _trayWindow.isDestroyed(),
        error,
      });
    });
  _trayWindow.webContents.on("did-fail-load", (_event, code, desc, validatedURL) => {
    trayLog.error("did-fail-load", { code, desc, validatedURL });
  });

  // 失去焦点时隐藏
  _trayWindow.on("blur", () => {
    controller.blur();
  });

  _trayWindow.on("closed", () => {
    controller.dispose();
    if (trayWindow === _trayWindow) {
      trayWindow = null;
      panelController = null;
    }
  });

  return _trayWindow;
}

/**
 * 唤醒主窗口
 * @param mainWindow 主窗口
 * @param options 回调
 */
const AwakeMainWindow = (mainWindow: BrowserWindow, options: TrayOptions) => {
  panelController?.hide();
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
};

/** 初始化系统托盘和常驻托盘窗口。重复调用保持幂等。 */
export function initTray(mainWindow: BrowserWindow, options: TrayOptions = {}) {
  // 如果已经初始化过，不要重复创建
  if (tray) return;

  tray = new Tray(__iconTray);
  tray.setToolTip("Scopify");

  tray.on("right-click", () => {
    // 在事件入口保存点击位置，等待首次渲染期间移动鼠标不会改变锚点。
    const point = screen.getCursorScreenPoint();
    if (!getTrayWindow()) createTrayWindow();
    panelController?.requestOpen(point);
  });

  tray.on("click", (_event) => {
    AwakeMainWindow(mainWindow, options);
  });

  tray.on("double-click", (_event) => {
    AwakeMainWindow(mainWindow, options);
  });

  // 预热托盘窗口，使其在后台静默完成渲染，避免初次呼出时出现黑底或延迟
  createTrayWindow();

  // 妥善清理 Tray && TrayWindow，避免退出时系统托盘留下残影
  app.on("before-quit", () => {
    panelController?.dispose();
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.destroy();
      trayWindow = null;
    }
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
      tray = null;
    }
  });
}
