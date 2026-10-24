import { screen, type BrowserWindow, type Rectangle } from "electron";
import type {
  ActiveWallpaperProfile,
  MainWindowState,
  ElectronDesktopPlaybackWallpaperDriver,
  ElectronDesktopPlaybackWallpaperDriverOptions,
} from "@/types/electronWallpaperDriver";
export type {
  ElectronDesktopPlaybackWallpaperDriver,
  ElectronDesktopPlaybackWallpaperDriverOptions,
} from "@/types/electronWallpaperDriver";

import type {
  DesktopPlaybackWallpaperSystemFallback,
  SystemWallpaperFallbackOperationResult,
} from "@/types/systemWallpaperFallback";
import { wallpaperLog } from "@main/utils/logger";
import type { DesktopPlaybackWallpaperDriver } from "@/types/service/desktop/wallpaper/service";
import { shouldUseDesktopPlaybackWallpaperSystemFallback } from "./fallbackPolicy";
import { createNativeWallpaperHost } from "./nativeWallpaperHost";
import { createMacDesktopPlaybackWallpaperDriver } from "./macDriver";
import {
  createAbortError,
  waitForExactWallpaperContentBounds,
  waitForWallpaperPresentation,
} from "./presentation";
import { createWindowsSystemWallpaperFallback } from "./systemWallpaperFallback";
import { resolveWallpaperTargetDisplay } from "./wallpaperTargetDisplay";

/** Selects the platform posture; both backends share the native Rust host and IPC capability. */
export function createElectronDesktopPlaybackWallpaperDriver(
  options: ElectronDesktopPlaybackWallpaperDriverOptions,
): ElectronDesktopPlaybackWallpaperDriver {
  if (process.platform === "darwin") return createMacDesktopPlaybackWallpaperDriver(options);

  const driver = createWindowsDriver(options);
  let pending: Promise<unknown> = Promise.resolve();
  return {
    isWallpaperActive: driver.isWallpaperActive,
    reconcile(preferences, context) {
      const operation = pending.then(() => driver.reconcile(preferences, context));
      pending = operation.catch(() => undefined);
      return operation;
    },
    async dispose() {
      await pending;
      await driver.dispose?.();
    },
  };
}

function createWindowsDriver(
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
    if (!(await nativeHost.detach(signal))) {
      const error = "The native wallpaper helper could not detach the main window.";
      wallpaperLog.error(`[desktop-playback-wallpaper] ${error}`);
      return { error, success: false } as const;
    }

    activeProfile = null;
    normalWindowState = null;
    if (!window) return { changed: false, success: true } as const;

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

      // Folia 7452afd2: the wallpaper covers the display the main window is on, not always the
      // primary one. While attached, the window *is* the display, so the session's display and
      // the bounds captured before attach stand in for it.
      const attached = nativeHost.isAttached();
      const display =
        resolveWallpaperTargetDisplay({
          screen,
          sessionDisplayId: attached ? activeProfile?.displayId : null,
          windowBounds: attached ? normalWindowState?.bounds : readOrdinaryWindowBounds(window),
        }) ?? screen.getPrimaryDisplay();
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
      // The helper fills the monitor the window sits on when it is re-parented. The window is
      // normally already there; it only moves when the session's display differs from it.
      if (screen.getDisplayMatching(readOrdinaryWindowBounds(window)).id !== display.id) {
        window.setBounds(display.workArea);
      }

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
        wallpaperLog.info("[desktop-playback-wallpaper] main window fallback settled", {
          elapsedMs: Date.now() - reconcileStartedAt,
          enabled: preferences.systemWallpaperFallback,
          success: fallbackResult.success,
        });
        throwIfSuperseded(signal, revision, operationRevision);
        if (!fallbackResult.success) {
          await restoreMainWindow({ focus: true, signal });
          return toFallbackFault(fallbackResult);
        }

        wallpaperLog.info("[desktop-playback-wallpaper] main window attached to Windows desktop", {
          displayId: nextProfile.displayId,
          elapsedMs: Date.now() - reconcileStartedAt,
          host: attachResult,
          contentBounds,
          layers: preferences.layers,
        });
        return { displayId: nextProfile.displayId, state: "running" };
      } catch (error) {
        systemWallpaperFallback?.restoreSync("start-failure");
        await restoreMainWindow({ focus: !signal.aborted });
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

/** A minimized window reports a parked off-screen rect; its restore rect is where it lives. */
function readOrdinaryWindowBounds(window: BrowserWindow): Rectangle {
  return window.isMinimized() ? window.getNormalBounds() : window.getBounds();
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
