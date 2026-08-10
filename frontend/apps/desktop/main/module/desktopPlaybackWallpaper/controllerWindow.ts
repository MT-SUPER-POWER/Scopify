import { BrowserWindow } from "electron";

import type { DesktopPlaybackControllerOpenResult } from "@scopify/desktop-contract";

import { __iconWindow, __preloadScript, logger } from "../../constants.js";

const DESKTOP_PLAYBACK_CONTROLLER_ROUTE = "/desktop-playback-controller";
const CONTROLLER_WIDTH = 420;
const CONTROLLER_HEIGHT = 580;

export interface DesktopPlaybackControllerWindowOptions {
  rendererBaseUrl: string;
}

export interface DesktopPlaybackControllerWindow {
  close(): boolean;
  dispose(): void;
  getWindow(): BrowserWindow | null;
  prepare(): void;
  show(): Promise<DesktopPlaybackControllerOpenResult>;
}

export function createDesktopPlaybackControllerWindow(
  options: DesktopPlaybackControllerWindowOptions,
): DesktopPlaybackControllerWindow {
  const controllerUrl = new URL(
    DESKTOP_PLAYBACK_CONTROLLER_ROUTE,
    options.rendererBaseUrl,
  ).toString();
  let controllerWindow: BrowserWindow | null = null;
  let loadPromise: Promise<boolean> | null = null;

  const getWindow = () =>
    controllerWindow && !controllerWindow.isDestroyed() ? controllerWindow : null;

  const createWindow = () => {
    const window = new BrowserWindow({
      autoHideMenuBar: true,
      backgroundColor: "#0b0c10",
      frame: false,
      hasShadow: true,
      height: CONTROLLER_HEIGHT,
      icon: __iconWindow,
      maximizable: false,
      minimizable: true,
      resizable: false,
      show: false,
      skipTaskbar: false,
      title: "Scopify Desktop Music",
      width: CONTROLLER_WIDTH,
      webPreferences: {
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
        preload: __preloadScript,
        sandbox: true,
      },
    });

    controllerWindow = window;
    window.setAlwaysOnTop(true, "floating");
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("did-fail-load", (_event, code, description, validatedURL) => {
      logger.error("[desktop-playback-controller] failed to load", {
        code,
        description,
        validatedURL,
      });
    });
    window.on("closed", () => {
      if (controllerWindow === window) {
        controllerWindow = null;
        loadPromise = null;
      }
    });

    loadPromise = window
      .loadURL(controllerUrl)
      .then(() => true)
      .catch((error) => {
        logger.error("[desktop-playback-controller] load failed", error);
        return false;
      });
    return window;
  };

  const ensureWindow = () => getWindow() ?? createWindow();

  return {
    close() {
      const window = getWindow();
      if (!window) return false;
      window.close();
      return true;
    },

    dispose() {
      const window = getWindow();
      controllerWindow = null;
      loadPromise = null;
      if (window) window.destroy();
    },

    getWindow,

    prepare() {
      ensureWindow();
    },

    async show() {
      if (process.platform !== "win32") {
        return { opened: false, reason: "unsupported" };
      }

      const window = ensureWindow();
      const loaded = await loadPromise;
      if (!loaded || window.isDestroyed() || controllerWindow !== window) {
        return { opened: false, reason: "failed" };
      }

      if (!window.isVisible()) window.center();
      window.show();
      window.focus();
      return { opened: true };
    },
  };
}
