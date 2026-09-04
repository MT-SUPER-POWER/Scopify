import { BrowserWindow, screen } from "electron";

import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackControllerOpenResult,
} from "@scopify/desktop-contract";

import { __iconWindow, __preloadScript } from "@main/constants";
import { wallpaperLog } from "@main/utils/logger";
import {
  DESKTOP_PLAYBACK_CONTROLLER_SIZES,
  resolveDesktopPlaybackControllerBounds,
} from "./controllerLayout";

const DESKTOP_PLAYBACK_CONTROLLER_ROUTE = "/desktop-playback-controller";

export interface DesktopPlaybackControllerWindowOptions {
  rendererBaseUrl: string;
}

export interface DesktopPlaybackControllerWindow {
  close(): boolean;
  dispose(): void;
  getWindow(): BrowserWindow | null;
  setLayout(layout: DesktopPlaybackControllerLayout): boolean;
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
    const compactSize = DESKTOP_PLAYBACK_CONTROLLER_SIZES.compact;
    const window = new BrowserWindow({
      autoHideMenuBar: true,
      backgroundColor: "#00000000",
      transparent: true,
      frame: false,
      hasShadow: false,
      icon: __iconWindow,
      maximizable: false,
      minimizable: true,
      resizable: false,
      show: false,
      skipTaskbar: false,
      title: "Scopify Desktop Music Controller",
      height: compactSize.height,
      width: compactSize.width,
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
      wallpaperLog.error("[desktop-playback-controller] failed to load", {
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
        wallpaperLog.error("[desktop-playback-controller] load failed", error);
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

    setLayout(layout) {
      const window = getWindow();
      if (!window) return false;
      const currentBounds = window.getBounds();
      const display = screen.getDisplayMatching(currentBounds);
      window.setBounds(
        resolveDesktopPlaybackControllerBounds(layout, currentBounds, display.workArea),
      );
      return true;
    },

    async show() {
      if (process.platform !== "win32") {
        return { opened: false, reason: "unsupported" };
      }

      const window = ensureWindow();
      const loaded = await loadPromise;
      if (!loaded || window.isDestroyed() || controllerWindow !== window) {
        if (window && !window.isDestroyed()) {
          window.destroy();
        }
        controllerWindow = null;
        loadPromise = null;
        return { opened: false, reason: "failed" };
      }

      if (window.isMinimized()) {
        window.restore();
      }
      if (!window.isVisible()) {
        window.center();
      }
      window.setAlwaysOnTop(true, "floating");
      window.show();
      window.focus();
      return { opened: true };
    },
  };
}
