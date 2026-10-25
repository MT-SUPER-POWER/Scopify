import { app, BrowserWindow, screen } from "electron";
import type { MainWindowOptions, MainWindowRenderingPolicy } from "@/types/electronWindow";
import { __iconWindow, __preloadScript } from "@main/constants";
import { loadDesktopHostConfig } from "@main/store";
import { rendererLog } from "@main/utils/logger";
import { showAppCloseWindow } from "@main/window/appCloseWindow";
import { createMainWindowRenderingPolicy } from "@main/window/mainWindowRendering";

/** 合并页面标题连续变更的等待时间，足以覆盖路由标题被渲染层改回的间隔。 */
const TITLE_SYNC_DELAY_MS = 120;
/** 首次打开的窗口尺寸（16:9），小屏幕上收敛到可用工作区内。 */
const DEFAULT_WINDOW_SIZE = { height: 900, width: 1600 } as const;
/** 隐藏系统标题栏后，窗口按钮叠加在渲染层顶栏上；高度与顶栏行（外边距 8px + 顶栏 56px）对齐。 */
export const MAIN_WINDOW_TITLE_BAR_HEIGHT = 64;
const renderingPolicies = new WeakMap<BrowserWindow, MainWindowRenderingPolicy>();

/** Create the main window and keep all BrowserWindow-specific policy local to this module. */
export function createMainWindow(options: MainWindowOptions) {
  const { workAreaSize } = screen.getPrimaryDisplay();
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    height: Math.min(DEFAULT_WINDOW_SIZE.height, workAreaSize.height),
    width: Math.min(DEFAULT_WINDOW_SIZE.width, workAreaSize.width),
    minHeight: 780,
    minWidth: 840,
    icon: __iconWindow,
    show: false,
    title: "Scopify",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "rgba(0,0,0,0)",
      height: MAIN_WINDOW_TITLE_BAR_HEIGHT,
      symbolColor: "white",
    },
    // macOS 红绿灯与顶栏内容垂直居中
    trafficLightPosition: { x: 16, y: 24 },
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: false,
      preload: __preloadScript,
      webgl: true,
    },
  });
  const rendering = createMainWindowRenderingPolicy({
    setBackgroundThrottling: (allowed) => {
      if (!window.webContents.isDestroyed()) window.webContents.setBackgroundThrottling(allowed);
    },
  });
  renderingPolicies.set(window, rendering);

  // Playback transports must be registered before loading the Renderer Authority.
  options.onBeforeLoad(window);

  window.webContents.once("did-finish-load", () => {
    void Promise.resolve(options.onRendererReady(window)).catch((error) => {
      rendererLog.error("[renderer] post-load initialization failed", error);
    });
  });
  window.webContents.on("before-input-event", (event, input) => {
    const isZoomShortcut =
      (input.control || input.meta) && ["0", "=", "+", "-"].includes(input.key);
    if (isZoomShortcut) event.preventDefault();
  });
  // 切换路由时 Next.js 先写入页面标题，渲染层随即改回「歌名 - 歌手」；
  // Electron 默认会把每次中间值都同步到原生标题栏，造成闪烁。这里合并短时间内的连续变更，
  // 只把最终标题写到窗口上。
  let titleSyncTimer: ReturnType<typeof setTimeout> | null = null;
  window.on("page-title-updated", (event) => {
    event.preventDefault();
    if (titleSyncTimer) clearTimeout(titleSyncTimer);
    titleSyncTimer = setTimeout(() => {
      titleSyncTimer = null;
      if (window.isDestroyed() || window.webContents.isDestroyed()) return;
      const title = window.webContents.getTitle();
      if (title && title !== window.getTitle()) window.setTitle(title);
    }, TITLE_SYNC_DELAY_MS);
  });
  window.on("closed", () => {
    if (titleSyncTimer) clearTimeout(titleSyncTimer);
  });
  window.on("enter-full-screen", () => {
    window.webContents.send("window-full-screen-changed", { isFullScreen: true });
  });
  window.on("leave-full-screen", () => {
    window.webContents.send("window-full-screen-changed", { isFullScreen: false });
  });

  const publishVisibility = () => notifyMainWindowVisibility(window);
  window.on("show", () => {
    rendering.shown();
    publishVisibility();
  });
  window.on("hide", () => {
    rendering.hidden();
    publishVisibility();
  });
  window.on("minimize", publishVisibility);
  window.on("restore", publishVisibility);
  window.on("close", (event) => {
    if (options.isQuitting()) return;

    event.preventDefault();
    const closeAction = loadDesktopHostConfig().app.closeAction;
    if (closeAction === 0) {
      window.hide();
      return;
    }
    if (closeAction === 1) {
      app.quit();
      return;
    }
    showAppCloseWindow(window, options.renderer.baseUrl);
  });
  window.on("closed", options.onClosed);

  void options.renderer
    .load(window)
    .catch((error) => rendererLog.error("[renderer] failed to load main window", error));
  return window;
}

/** Keeps a hidden main window drawing frames while it hosts, or is becoming, the desktop wallpaper. */
export function keepMainWindowRendering(window: BrowserWindow, keepAlive: boolean) {
  renderingPolicies.get(window)?.setKeepAlive(keepAlive);
}

export function notifyMainWindowVisibility(window: BrowserWindow) {
  if (window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("window-visibility-changed", window.isVisible() && !window.isMinimized());
}
