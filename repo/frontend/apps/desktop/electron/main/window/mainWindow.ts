import { app, BrowserWindow } from "electron";

import type { MainWindowOptions } from "@/types/electronWindow";
import { __iconWindow, __preloadScript, logger } from "@main/constants";
import { loadDesktopHostConfig } from "@main/store";
import { showAppCloseWindow } from "@main/window/appCloseWindow";

/** Create the main window and keep all BrowserWindow-specific policy local to this module. */
export function createMainWindow(options: MainWindowOptions) {
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    height: 900,
    icon: __iconWindow,
    minHeight: 720,
    minWidth: 840,
    show: false,
    title: "Scopify",
    titleBarOverlay: {
      color: "rgba(0,0,0,0)",
      height: 35,
      symbolColor: "white",
    },
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: false,
      preload: __preloadScript,
      webgl: true,
    },
    width: 1400,
  });

  // Playback transports must be registered before loading the Renderer Authority.
  options.onBeforeLoad(window);

  window.webContents.once("did-finish-load", () => {
    void Promise.resolve(options.onRendererReady(window)).catch((error) => {
      logger.error("[renderer] post-load initialization failed", error);
    });
  });
  window.webContents.on("before-input-event", (event, input) => {
    const isZoomShortcut =
      (input.control || input.meta) && ["0", "=", "+", "-"].includes(input.key);
    if (isZoomShortcut) event.preventDefault();
  });
  window.on("enter-full-screen", () => {
    window.webContents.send("window-full-screen-changed", { isFullScreen: true });
  });
  window.on("leave-full-screen", () => {
    window.webContents.send("window-full-screen-changed", { isFullScreen: false });
  });

  const publishVisibility = () => notifyMainWindowVisibility(window);
  window.on("show", publishVisibility);
  window.on("hide", publishVisibility);
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
    .catch((error) => logger.error("[renderer] failed to load main window", error));
  return window;
}

export function notifyMainWindowVisibility(window: BrowserWindow) {
  if (window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("window-visibility-changed", window.isVisible() && !window.isMinimized());
}
