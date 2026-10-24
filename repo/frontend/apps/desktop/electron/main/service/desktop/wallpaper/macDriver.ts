import { screen } from "electron";

import type { MacWallpaperWindowState } from "@/types/nativeWallpaper";
import { wallpaperLog } from "@main/utils/logger";
import type {
  ElectronDesktopPlaybackWallpaperDriver,
  ElectronDesktopPlaybackWallpaperDriverOptions,
} from "@/types/electronWallpaperDriver";
import type { DesktopPlaybackWallpaperDriver } from "@/types/service/desktop/wallpaper/service";
import { createNativeWallpaperHost } from "./nativeWallpaperHost";
import {
  createAbortError,
  throwIfAborted,
  waitForExactWallpaperContentBounds,
  waitForWallpaperPresentation,
} from "./presentation";
import { resolveWallpaperTargetDisplay } from "./wallpaperTargetDisplay";

/** macOS uses the same Rust ABI and Renderer IPC as Windows; AppKit owns desktop layering. */
export function createMacDesktopPlaybackWallpaperDriver(
  options: ElectronDesktopPlaybackWallpaperDriverOptions,
): ElectronDesktopPlaybackWallpaperDriver {
  const window = options.mainWindow;
  const host = createNativeWallpaperHost({ onLost: options.onHostLost });
  let state: MacWallpaperWindowState | null = null;
  let displayId: string | null = null;
  let pending: Promise<unknown> = Promise.resolve();
  let disposed = false;

  const restore = async (focus: boolean) => {
    if (!(await host.detach()))
      throw new Error("The native wallpaper session did not acknowledge detach.");
    const previous = state;
    displayId = null;
    state = null;
    if (!previous || window.isDestroyed()) return;
    window.setMinimumSize(...previous.minimumSize);
    window.setMovable(previous.movable);
    window.setResizable(previous.resizable);
    window.setBounds(previous.bounds);
    if (previous.simpleFullScreen) window.setSimpleFullScreen(true);
    else if (previous.fullScreen) window.setFullScreen(true);
    else if (previous.maximized) window.maximize();
    else if (previous.minimized && !focus) window.minimize();
    if (focus || previous.visible) {
      if (window.isMinimized()) window.restore();
      if (focus) {
        window.show();
        window.focus();
      } else window.showInactive();
    } else window.hide();
  };

  const reconcile: DesktopPlaybackWallpaperDriver["reconcile"] = async (
    preferences,
    { reason, signal },
  ) => {
    throwIfAborted(signal);
    if (disposed) throw createAbortError();
    if (!preferences.enabled || (!preferences.layers.background && !preferences.layers.lyrics)) {
      await restore(reason === "configure");
      return null;
    }
    if (window.isDestroyed()) throw new Error("The wallpaper window has closed.");
    const display =
      resolveWallpaperTargetDisplay({
        screen,
        sessionDisplayId: displayId,
        windowBounds: state?.bounds ?? window.getNormalBounds(),
      }) ?? screen.getPrimaryDisplay();
    if (host.isAttached() && displayId === String(display.id)) {
      const bounds = window.getContentBounds();
      if (
        bounds.x === display.bounds.x &&
        bounds.y === display.bounds.y &&
        bounds.width === display.bounds.width &&
        bounds.height === display.bounds.height
      ) {
        return { state: "running", displayId: String(display.id) };
      }
    }
    if (state) await restore(false);
    state = {
      bounds: window.getNormalBounds(),
      minimumSize: window.getMinimumSize(),
      movable: window.isMovable(),
      resizable: window.isResizable(),
      visible: window.isVisible(),
      minimized: window.isMinimized(),
      maximized: window.isMaximized(),
      fullScreen: window.isFullScreen(),
      simpleFullScreen: window.isSimpleFullScreen(),
    };
    try {
      window.hide();
      if (window.isMinimized()) window.restore();
      if (window.isSimpleFullScreen()) window.setSimpleFullScreen(false);
      await leaveNativeFullScreen(window, signal);
      if (window.isMaximized()) window.unmaximize();
      window.setMinimumSize(0, 0);
      window.setMovable(false);
      // Place on the target screen before asking the native host for its full display bounds.
      window.setBounds(display.workArea);
      await waitForWallpaperPresentation(window, signal);
      throwIfAborted(signal);
      const attachment = await host.attach(window, signal);
      await waitForExactWallpaperContentBounds(window, display.bounds, signal);
      throwIfAborted(signal);
      displayId = String(display.id);
      window.showInactive();
      if (!host.isAttached()) throw new Error("macOS did not preserve the desktop window level.");
      wallpaperLog.info("[desktop-playback-wallpaper] native macOS desktop attached", {
        attachment,
        displayId,
      });
      return { state: "running", displayId };
    } catch (error) {
      await restore(!signal.aborted);
      throw error;
    }
  };

  const onDisplayChanged = () => {
    if (host.isAttached()) options.onHostLost?.("The wallpaper display configuration changed.");
  };
  screen.on("display-removed", onDisplayChanged);
  screen.on("display-metrics-changed", onDisplayChanged);

  return {
    reconcile(preferences, context) {
      // Cancellation must finish restoring the old window before the next operation mutates it.
      const operation = pending.then(() => reconcile(preferences, context));
      pending = operation.catch(() => undefined);
      return operation;
    },
    isWallpaperActive: host.isAttached,
    async dispose() {
      disposed = true;
      screen.removeListener("display-removed", onDisplayChanged);
      screen.removeListener("display-metrics-changed", onDisplayChanged);
      await pending;
      await restore(false);
      await host.dispose();
    },
  };
}

async function leaveNativeFullScreen(window: Electron.BrowserWindow, signal: AbortSignal) {
  if (!window.isFullScreen()) return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      window.removeListener("leave-full-screen", onLeave);
    };
    const onLeave = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("macOS full-screen exit timed out."));
    }, 5_000);
    signal.addEventListener("abort", onAbort, { once: true });
    window.once("leave-full-screen", onLeave);
    window.setFullScreen(false);
  });
}
