import { screen, type BrowserWindow, type Rectangle } from "electron";

import type {
  DesktopPlaybackWallpaperSystemFallback,
  SystemWallpaperFallbackOperationResult,
} from "../../../types/systemWallpaperFallback.js";
import { logger } from "../../constants.js";
import type { DesktopPlaybackWallpaperDriver } from "./capability.js";
import { shouldUseDesktopPlaybackWallpaperSystemFallback } from "./fallbackPolicy.js";
import { createNativeWallpaperHost } from "./nativeWallpaperHost.js";
import { createWindowsSystemWallpaperFallback } from "./systemWallpaperFallback.js";

const WALLPAPER_PRESENTATION_READY_SELECTOR =
  '[data-desktop-playback-wallpaper-content-ready="true"]';

interface ActiveWallpaperProfile {
  bounds: Rectangle;
  displayId: string;
}

interface MainWindowState {
  alwaysOnTop: boolean;
  bounds: Rectangle;
  fullScreen: boolean;
  maximized: boolean;
  minimized: boolean;
  movable: boolean;
  resizable: boolean;
  visible: boolean;
}

export interface ElectronDesktopPlaybackWallpaperDriver extends DesktopPlaybackWallpaperDriver {
  isWallpaperActive(): boolean;
}

export interface ElectronDesktopPlaybackWallpaperDriverOptions {
  mainWindow: BrowserWindow;
  onHostLost?(diagnostic: string): void;
  systemWallpaperFallback?: DesktopPlaybackWallpaperSystemFallback | null;
}

/** Owns the main window's transition between normal application and WorkerW Stage presentation. */
export function createElectronDesktopPlaybackWallpaperDriver(
  options: ElectronDesktopPlaybackWallpaperDriverOptions,
): ElectronDesktopPlaybackWallpaperDriver {
  const systemWallpaperFallback =
    options.systemWallpaperFallback === undefined
      ? process.platform === "win32"
        ? createWindowsSystemWallpaperFallback()
        : null
      : options.systemWallpaperFallback;
  let activeProfile: ActiveWallpaperProfile | null = null;
  let normalWindowState: MainWindowState | null = null;
  let operationRevision = 0;
  const nativeHost = createNativeWallpaperHost({
    onLost: (diagnostic) => options.onHostLost?.(diagnostic),
  });

  const getWindow = () => (options.mainWindow.isDestroyed() ? null : options.mainWindow);

  const restoreMainWindow = async ({ focus, signal }: { focus: boolean; signal?: AbortSignal }) => {
    const window = getWindow();
    const wasAttached = nativeHost.isAttached();
    const state = normalWindowState;
    activeProfile = null;
    normalWindowState = null;
    if (!window) return { changed: false, success: true } as const;

    if (wasAttached && !(await nativeHost.detach(signal))) {
      const error = "The native wallpaper helper could not detach the main window.";
      logger.error(`[desktop-playback-wallpaper] ${error}`);
      return { error, success: false } as const;
    }

    window.setSkipTaskbar(false);
    if (state) {
      window.setAlwaysOnTop(state.alwaysOnTop);
      window.setMovable(state.movable);
      window.setResizable(state.resizable);
      window.setBounds(state.bounds);
      if (state.fullScreen) window.setFullScreen(true);
      else if (state.maximized) window.maximize();
      else if (state.minimized && !focus) window.minimize();
    }

    if (focus || state?.visible) {
      if (window.isMinimized()) window.restore();
      window.show();
      if (focus) window.focus();
    } else {
      window.hide();
    }
    return { changed: wasAttached, success: true } as const;
  };

  return {
    async dispose() {
      operationRevision += 1;
      systemWallpaperFallback?.dispose();
      await restoreMainWindow({ focus: false });
      await nativeHost.dispose();
    },

    isWallpaperActive() {
      return nativeHost.isAttached();
    },

    async reconcile(preferences, { reason, signal }) {
      const reconcileStartedAt = Date.now();
      operationRevision += 1;
      const revision = operationRevision;
      const hasVisibleLayer = preferences.layers.background || preferences.layers.lyrics;
      if (!preferences.enabled || !hasVisibleLayer) {
        const fallbackResult = await restoreSystemWallpaperFallback(
          systemWallpaperFallback,
          preferences.enabled ? "no-visible-layer" : "disabled",
          signal,
        );
        if (!fallbackResult.success) return toFallbackFault(fallbackResult);
        const restoreResult = await restoreMainWindow({
          focus: reason === "configure",
          signal,
        });
        if (!restoreResult.success) {
          return {
            diagnostic: restoreResult.error,
            retryable: true,
            state: "faulted",
          };
        }
        return null;
      }

      if (process.platform !== "win32") {
        systemWallpaperFallback?.restoreSync("unsupported-platform");
        await restoreMainWindow({ focus: reason === "configure", signal });
        return {
          diagnostic: "Desktop playback wallpaper requires Windows Explorer.",
          state: "unsupported",
        };
      }

      const window = getWindow();
      if (!window) {
        return {
          diagnostic: "The main window closed before it could enter wallpaper mode.",
          retryable: true,
          state: "faulted",
        };
      }

      const display = screen.getPrimaryDisplay();
      const nextProfile: ActiveWallpaperProfile = {
        bounds: { ...display.bounds },
        displayId: String(display.id),
      };
      if (nativeHost.isAttached() && activeProfile && profilesMatch(activeProfile, nextProfile)) {
        const fallbackResult = await reconcileSystemWallpaperFallback(
          systemWallpaperFallback,
          window,
          preferences,
          signal,
        );
        if (!fallbackResult.success) return toFallbackFault(fallbackResult);
        return { displayId: activeProfile.displayId, state: "running" };
      }

      const restoreResult = await restoreSystemWallpaperFallback(
        systemWallpaperFallback,
        "main-window-reconfigured",
        signal,
      );
      if (!restoreResult.success) return toFallbackFault(restoreResult);
      if (nativeHost.isAttached()) {
        const detachResult = await restoreMainWindow({ focus: false, signal });
        if (!detachResult.success) {
          return {
            diagnostic: detachResult.error,
            retryable: true,
            state: "faulted",
          };
        }
      }

      normalWindowState = captureMainWindowState(window);
      window.hide();

      try {
        await waitForWallpaperPresentation(window, signal);
        throwIfSuperseded(signal, revision, operationRevision);
        const attachResult = await nativeHost.attach(window, signal);
        throwIfSuperseded(signal, revision, operationRevision);
        const contentBounds = await waitForExactWallpaperContentBounds(
          window,
          nextProfile.bounds,
          signal,
        );
        activeProfile = nextProfile;
        window.setAlwaysOnTop(false);
        window.setSkipTaskbar(true);
        window.showInactive();

        const fallbackResult = await reconcileSystemWallpaperFallback(
          systemWallpaperFallback,
          window,
          preferences,
          signal,
        );
        logger.info("[desktop-playback-wallpaper] main window fallback settled", {
          elapsedMs: Date.now() - reconcileStartedAt,
          enabled: preferences.systemWallpaperFallback,
          success: fallbackResult.success,
        });
        throwIfSuperseded(signal, revision, operationRevision);
        if (!fallbackResult.success) {
          await restoreMainWindow({ focus: true, signal });
          return toFallbackFault(fallbackResult);
        }

        logger.info("[desktop-playback-wallpaper] main window attached to Windows desktop", {
          displayId: nextProfile.displayId,
          elapsedMs: Date.now() - reconcileStartedAt,
          host: attachResult,
          contentBounds,
          layers: preferences.layers,
        });
        return { displayId: nextProfile.displayId, state: "running" };
      } catch (error) {
        systemWallpaperFallback?.restoreSync("start-failure");
        if (signal.aborted || revision !== operationRevision) throw error;
        await restoreMainWindow({ focus: true });
        return {
          diagnostic: error instanceof Error ? error.message : String(error),
          retryable: true,
          state: "faulted",
        };
      }
    },
  };
}

function captureMainWindowState(window: BrowserWindow): MainWindowState {
  return {
    alwaysOnTop: window.isAlwaysOnTop(),
    bounds: { ...window.getBounds() },
    fullScreen: window.isFullScreen(),
    maximized: window.isMaximized(),
    minimized: window.isMinimized(),
    movable: window.isMovable(),
    resizable: window.isResizable(),
    visible: window.isVisible(),
  };
}

async function waitForWallpaperPresentation(window: BrowserWindow, signal: AbortSignal) {
  throwIfAborted(signal);
  if (!window.webContents.getURL() || window.webContents.isLoadingMainFrame()) {
    await waitForMainFrame(window, signal);
  }
  const ready = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const deadline = performance.now() + 5000;
      const check = () => {
        if (document.querySelector(${JSON.stringify(WALLPAPER_PRESENTATION_READY_SELECTOR)})) {
          resolve(true);
          return;
        }
        if (performance.now() >= deadline) {
          resolve(false);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    })
  `);
  throwIfAborted(signal);
  if (ready !== true) {
    throw new Error("The main Renderer did not enter its Stage-only wallpaper presentation.");
  }
}

function waitForMainFrame(window: BrowserWindow, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      window.webContents.removeListener("did-fail-load", onFail);
      window.webContents.removeListener("did-finish-load", onReady);
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };
    const onFail = (_event: Electron.Event, code: number, description: string) => {
      cleanup();
      reject(new Error(`The main Renderer failed to load (${code}): ${description}`));
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
    window.webContents.once("did-fail-load", onFail);
    window.webContents.once("did-finish-load", onReady);
  });
}

async function waitForExactWallpaperContentBounds(
  window: BrowserWindow,
  targetBounds: Rectangle,
  signal: AbortSignal,
) {
  const deadline = Date.now() + 2_000;
  let contentBounds = window.getContentBounds();
  while (!rectanglesMatch(contentBounds, targetBounds) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    throwIfAborted(signal);
    contentBounds = window.getContentBounds();
  }
  if (!rectanglesMatch(contentBounds, targetBounds)) {
    throw new Error(
      `WorkerW content bounds ${JSON.stringify(contentBounds)} do not cover display ${JSON.stringify(targetBounds)}.`,
    );
  }
  return contentBounds;
}

function rectanglesMatch(left: Rectangle, right: Rectangle) {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
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

function profilesMatch(left: ActiveWallpaperProfile, right: ActiveWallpaperProfile) {
  return (
    left.displayId === right.displayId &&
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
