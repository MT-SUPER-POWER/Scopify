import { app, BrowserWindow, screen } from "electron";

import { __iconWindow, __preloadScript, logger } from "../constants.js";
import { attachWindowsDesktopSurface } from "../capabilities/desktopPlaybackWallpaper/windowsDesktopSurfaceHost.js";
import {
  applySystemWallpaperFallbackSpike,
  initializeSystemWallpaperFallbackSpike,
} from "./systemWallpaperFallbackSpike.js";

const SPIKE_ROUTE = "/desktop-wallpaper-spike";
let spikeWindow: BrowserWindow | null = null;

/**
 * PROTOTYPE: creates one primary-display renderer and attaches its HWND to Explorer.
 * The module is environment-gated and intentionally excluded from packaged builds.
 */
export function initializeDesktopWallpaperHostSpike(rendererBaseUrl: string) {
  if (process.env.SCOPIFY_DESKTOP_WALLPAPER_SPIKE !== "1") return;

  if (process.platform !== "win32") {
    logger.warn("[desktop-wallpaper-spike] skipped: Windows is required.");
    return;
  }

  if (app.isPackaged) {
    logger.warn("[desktop-wallpaper-spike] skipped: prototype is development-only.");
    return;
  }

  const transparent = process.env.SCOPIFY_DESKTOP_WALLPAPER_SPIKE_TRANSPARENT === "1";
  const systemWallpaperFallbackEnabled = initializeSystemWallpaperFallbackSpike();
  const applySystemWallpaperFallback = systemWallpaperFallbackEnabled && !transparent;
  if (systemWallpaperFallbackEnabled && transparent) {
    logger.warn(
      "[desktop-wallpaper-spike] system-wallpaper fallback skipped for transparent mode.",
    );
  }
  const display = screen.getPrimaryDisplay();
  spikeWindow = new BrowserWindow({
    ...display.bounds,
    autoHideMenuBar: true,
    backgroundColor: transparent ? "#00000000" : "#07111f",
    focusable: false,
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    icon: __iconWindow,
    movable: false,
    resizable: false,
    roundedCorners: false,
    show: false,
    skipTaskbar: true,
    transparent,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
      webgl: true,
    },
  });

  spikeWindow.setIgnoreMouseEvents(true);
  spikeWindow.webContents.once("did-finish-load", () => {
    const currentWindow = spikeWindow;
    if (!currentWindow || currentWindow.isDestroyed()) return;

    void attachWindowsDesktopSurface(currentWindow, display.bounds).then(async (result) => {
      if (!spikeWindow || spikeWindow.isDestroyed()) return;

      if (!result.success) {
        logger.error("[desktop-wallpaper-spike] attach failed; destroying renderer", result);
        spikeWindow.destroy();
        spikeWindow = null;
        return;
      }

      if (applySystemWallpaperFallback) {
        const fallbackResult = await applySystemWallpaperFallbackSpike(spikeWindow);
        if (!spikeWindow || spikeWindow.isDestroyed()) return;
        if (fallbackResult.success) {
          logger.info("[desktop-wallpaper-spike] system wallpaper fallback applied", {
            result: fallbackResult.result,
          });
        } else {
          logger.error("[desktop-wallpaper-spike] system wallpaper fallback failed", {
            result: fallbackResult,
          });
        }
      }

      logger.info("[desktop-wallpaper-spike] attached", result.host);
      spikeWindow.showInactive();
    });
  });

  spikeWindow.webContents.on(
    "did-fail-load",
    (_event, code, description, validatedUrl, isMainFrame) => {
      if (!isMainFrame) return;

      const failedWindow = spikeWindow;
      if (failedWindow && !failedWindow.isDestroyed()) failedWindow.destroy();
      spikeWindow = null;

      logger.error("[desktop-wallpaper-spike] renderer failed to load; destroyed renderer", {
        code,
        description,
        validatedUrl,
      });
    },
  );

  spikeWindow.on("closed", () => {
    spikeWindow = null;
  });

  const url = new URL(SPIKE_ROUTE, rendererBaseUrl);
  if (transparent) url.searchParams.set("transparent", "1");
  void spikeWindow.loadURL(url.toString());
}
