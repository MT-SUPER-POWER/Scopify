import { app, BrowserWindow, screen, type Rectangle } from "electron";

import type {
  DesktopPlaybackWallpaperSystemFallback,
  SystemWallpaperFallbackOperationResult,
} from "../../../types/systemWallpaperFallback.js";
import { __iconWindow, __preloadScript, logger } from "../../constants.js";
import type { DesktopPlaybackWallpaperDriver } from "./capability.js";
import { shouldUseDesktopPlaybackWallpaperSystemFallback } from "./fallbackPolicy.js";
import { createWindowsSystemWallpaperFallback } from "./systemWallpaperFallback.js";
import { attachWindowsDesktopSurface } from "./windowsDesktopSurfaceHost.js";

const DESKTOP_PLAYBACK_WALLPAPER_ROUTE = "/desktop-wallpaper";

interface ActiveWallpaperProfile {
  bounds: Rectangle;
  displayId: string;
  transparent: boolean;
}

export interface ElectronDesktopPlaybackWallpaperDriver extends DesktopPlaybackWallpaperDriver {
  getWindow(): BrowserWindow | null;
  prepare(): void;
}

export interface ElectronDesktopPlaybackWallpaperDriverOptions {
  rendererBaseUrl: string;
  systemWallpaperFallback?: DesktopPlaybackWallpaperSystemFallback | null;
}

export function createElectronDesktopPlaybackWallpaperDriver(
  options: ElectronDesktopPlaybackWallpaperDriverOptions,
): ElectronDesktopPlaybackWallpaperDriver {
  const { rendererBaseUrl } = options;
  const systemWallpaperFallback =
    options.systemWallpaperFallback === undefined
      ? process.platform === "win32" && !app.isPackaged
        ? createWindowsSystemWallpaperFallback()
        : null
      : options.systemWallpaperFallback;
  let wallpaperWindow: BrowserWindow | null = null;
  let wallpaperWindowReady = false;
  let activeProfile: ActiveWallpaperProfile | null = null;
  let operationRevision = 0;
  let rendererWarmup: Promise<void> | null = null;

  const getWindow = () =>
    wallpaperWindow && !wallpaperWindow.isDestroyed() ? wallpaperWindow : null;

  const destroyWindow = (candidate = wallpaperWindow) => {
    if (!candidate) return;
    if (wallpaperWindow === candidate) {
      wallpaperWindow = null;
      wallpaperWindowReady = false;
      activeProfile = null;
    }
    if (!candidate.isDestroyed()) candidate.destroy();
  };

  return {
    async dispose() {
      operationRevision += 1;
      systemWallpaperFallback?.dispose();
      destroyWindow();
    },

    getWindow,

    prepare() {
      if (app.isPackaged || rendererWarmup) return;
      const startedAt = Date.now();
      const routeUrl = new URL(DESKTOP_PLAYBACK_WALLPAPER_ROUTE, rendererBaseUrl).toString();
      rendererWarmup = fetch(routeUrl)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Wallpaper renderer warmup returned HTTP ${response.status}.`);
          }
          await response.arrayBuffer();
          logger.info("[desktop-playback-wallpaper] renderer route warmed", {
            elapsedMs: Date.now() - startedAt,
          });
        })
        .catch((error) => {
          logger.warn("[desktop-playback-wallpaper] renderer route warmup failed", error);
        });
    },

    async reconcile(preferences, { signal }) {
      const reconcileStartedAt = Date.now();
      operationRevision += 1;
      const revision = operationRevision;
      const hasVisibleLayer = preferences.layers.background || preferences.layers.lyrics;
      if (!preferences.enabled || !hasVisibleLayer) {
        await restoreSystemWallpaperFallback(
          systemWallpaperFallback,
          preferences.enabled ? "no-visible-layer" : "disabled",
          signal,
        );
        destroyWindow();
        return null;
      }

      if (process.platform !== "win32") {
        systemWallpaperFallback?.restoreSync("unsupported-platform");
        destroyWindow();
        return {
          diagnostic: "Desktop playback wallpaper requires Windows Explorer.",
          state: "unsupported",
        };
      }

      if (app.isPackaged) {
        systemWallpaperFallback?.restoreSync("packaged-driver-unsupported");
        destroyWindow();
        return {
          diagnostic:
            "Desktop playback wallpaper is currently available in development builds only; the packaged native host is not bundled yet.",
          state: "unsupported",
        };
      }

      const display = screen.getPrimaryDisplay();
      const nextProfile: ActiveWallpaperProfile = {
        bounds: { ...display.bounds },
        displayId: String(display.id),
        transparent: !preferences.layers.background,
      };
      const currentWindow = getWindow();
      if (
        currentWindow &&
        wallpaperWindowReady &&
        activeProfile &&
        profilesMatch(activeProfile, nextProfile)
      ) {
        const fallbackResult = await reconcileSystemWallpaperFallback(
          systemWallpaperFallback,
          currentWindow,
          preferences,
          signal,
        );
        if (!fallbackResult.success) return toFallbackFault(fallbackResult);
        return { displayId: activeProfile.displayId, state: "running" };
      }

      const restoreResult = await restoreSystemWallpaperFallback(
        systemWallpaperFallback,
        "renderer-replaced",
        signal,
      );
      if (!restoreResult.success) return toFallbackFault(restoreResult);
      destroyWindow();
      throwIfAborted(signal);
      const candidate = createWallpaperWindow(nextProfile);
      wallpaperWindow = candidate;
      wallpaperWindowReady = false;
      activeProfile = nextProfile;
      candidate.on("closed", () => {
        if (wallpaperWindow === candidate) {
          wallpaperWindow = null;
          wallpaperWindowReady = false;
          activeProfile = null;
        }
      });
      candidate.webContents.on("render-process-gone", (_event, details) => {
        logger.error("[desktop-playback-wallpaper] renderer process exited", details);
        destroyWindow(candidate);
      });

      try {
        const routeUrl = new URL(DESKTOP_PLAYBACK_WALLPAPER_ROUTE, rendererBaseUrl).toString();
        const rendererLoad = loadWallpaperRenderer(candidate, routeUrl, signal).then(() => {
          logger.info("[desktop-playback-wallpaper] renderer ready", {
            elapsedMs: Date.now() - reconcileStartedAt,
          });
        });
        const surfaceAttach = attachWindowsDesktopSurface(candidate, nextProfile.bounds, {
          signal,
        }).then((result) => {
          logger.info("[desktop-playback-wallpaper] Windows surface host settled", {
            elapsedMs: Date.now() - reconcileStartedAt,
            success: result.success,
          });
          return result;
        });

        const [, attachResult] = await Promise.all([rendererLoad, surfaceAttach]);
        throwIfSuperseded(signal, revision, operationRevision);
        if (!attachResult.success) {
          destroyWindow(candidate);
          return {
            diagnostic: attachResult.error,
            retryable: true,
            state: "faulted",
          };
        }

        if (candidate.isDestroyed() || wallpaperWindow !== candidate) {
          throw new Error("Desktop playback wallpaper renderer closed before it could be shown.");
        }
        const fallbackResult = await reconcileSystemWallpaperFallback(
          systemWallpaperFallback,
          candidate,
          preferences,
          signal,
        );
        logger.info("[desktop-playback-wallpaper] fallback settled", {
          elapsedMs: Date.now() - reconcileStartedAt,
          enabled: preferences.systemWallpaperFallback,
          success: fallbackResult.success,
        });
        throwIfSuperseded(signal, revision, operationRevision);
        if (!fallbackResult.success) {
          destroyWindow(candidate);
          return toFallbackFault(fallbackResult);
        }
        logger.info("[desktop-playback-wallpaper] attached to Windows desktop surface", {
          displayId: nextProfile.displayId,
          host: attachResult.host,
          layers: preferences.layers,
        });
        wallpaperWindowReady = true;
        candidate.showInactive();
        logger.info("[desktop-playback-wallpaper] startup complete", {
          elapsedMs: Date.now() - reconcileStartedAt,
        });
        return { displayId: nextProfile.displayId, state: "running" };
      } catch (error) {
        systemWallpaperFallback?.restoreSync("start-failure");
        destroyWindow(candidate);
        if (signal.aborted || revision !== operationRevision) throw error;
        return {
          diagnostic: error instanceof Error ? error.message : String(error),
          retryable: true,
          state: "faulted",
        };
      }
    },
  };
}

async function reconcileSystemWallpaperFallback(
  fallback: DesktopPlaybackWallpaperSystemFallback | null,
  window: BrowserWindow,
  preferences: Parameters<DesktopPlaybackWallpaperDriver["reconcile"]>[0],
  signal: AbortSignal,
): Promise<SystemWallpaperFallbackOperationResult> {
  if (!shouldUseDesktopPlaybackWallpaperSystemFallback(preferences)) {
    return restoreSystemWallpaperFallback(fallback, "preference-disabled", signal);
  }
  if (!fallback) {
    return {
      error: "Windows system-wallpaper fallback is unavailable in this runtime.",
      success: false,
    };
  }
  return fallback.apply(window, signal);
}

async function restoreSystemWallpaperFallback(
  fallback: DesktopPlaybackWallpaperSystemFallback | null,
  reason: string,
  signal: AbortSignal,
): Promise<SystemWallpaperFallbackOperationResult> {
  if (!fallback?.isApplied()) return { changed: false, success: true };
  return fallback.restore(reason, signal);
}

function toFallbackFault(
  result: Extract<SystemWallpaperFallbackOperationResult, { success: false }>,
) {
  return {
    diagnostic: `Windows taskbar fallback failed: ${result.error}`,
    retryable: true,
    state: "faulted" as const,
  };
}

function createWallpaperWindow(profile: ActiveWallpaperProfile) {
  const window = new BrowserWindow({
    ...profile.bounds,
    autoHideMenuBar: true,
    backgroundColor: profile.transparent ? "#00000000" : "#07111f",
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
    thickFrame: false,
    transparent: profile.transparent,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
      webgl: true,
    },
  });
  window.setIgnoreMouseEvents(true);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return window;
}

async function loadWallpaperRenderer(window: BrowserWindow, url: string, signal: AbortSignal) {
  throwIfAborted(signal);
  let rejectForAbort: ((error: Error) => void) | null = null;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    rejectForAbort = reject;
  });
  const onAbort = () => {
    if (!window.isDestroyed()) window.destroy();
    const error = createAbortError();
    rejectForAbort?.(error);
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    await Promise.race([window.loadURL(url), abortPromise]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

function profilesMatch(left: ActiveWallpaperProfile, right: ActiveWallpaperProfile) {
  return (
    left.displayId === right.displayId &&
    left.transparent === right.transparent &&
    left.bounds.x === right.bounds.x &&
    left.bounds.y === right.bounds.y &&
    left.bounds.width === right.bounds.width &&
    left.bounds.height === right.bounds.height
  );
}

function throwIfSuperseded(signal: AbortSignal, revision: number, activeRevision: number) {
  if (!signal.aborted && revision === activeRevision) return;
  throw createAbortError();
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw createAbortError();
}

function createAbortError() {
  const error = new Error("Desktop playback wallpaper operation was cancelled.");
  error.name = "AbortError";
  return error;
}
