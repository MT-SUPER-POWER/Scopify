import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { app, type BrowserWindow } from "electron";

import type {
  DesktopPlaybackWallpaperSystemFallback,
  SystemWallpaperFallbackOperationResult,
  WindowsSystemWallpaperFallbackOptions,
} from "@/types/systemWallpaperFallback";
import { wallpaperLog } from "@main/utils/logger";
import { loadNativeWallpaperModule } from "@main/service/desktop/nativeModule";

const BACKGROUND_CAPTURE_EVENT = "desktop-playback-wallpaper:capture-background";
const CAPTURE_READY_SELECTOR = '[data-desktop-playback-wallpaper-content-ready="true"]';
const CAPTURE_MODE_SELECTOR = '[data-desktop-playback-wallpaper-capture-background="true"]';
const FALLBACK_IMAGE_FILE = "system-wallpaper-fallback.png";
const JOURNAL_FILE = "system-wallpaper-journal.json";

export function createWindowsSystemWallpaperFallback(
  options: WindowsSystemWallpaperFallbackOptions = {},
): DesktopPlaybackWallpaperSystemFallback {
  const stateDirectory =
    options.stateDirectory ?? join(app.getPath("userData"), "desktop-playback-wallpaper");
  const fallbackImagePath = join(stateDirectory, FALLBACK_IMAGE_FILE);
  const journalPath = join(stateDirectory, JOURNAL_FILE);
  let applied = false;
  let recoveryPending = false;
  mkdirSync(stateDirectory, { recursive: true });

  const restoreSync = (reason: string): SystemWallpaperFallbackOperationResult => {
    if (!existsSync(journalPath)) {
      applied = false;
      recoveryPending = false;
      return { changed: false, success: true };
    }
    let result: SystemWallpaperFallbackOperationResult;
    try {
      result = loadNativeWallpaperModule().restoreSystemWallpaperSync(journalPath);
    } catch (error) {
      result = nativeFailure(error);
    }
    if (result.success) {
      applied = false;
      recoveryPending = false;
    } else recoveryPending = true;
    logOperation("restore", reason, result);
    return result;
  };

  if (existsSync(journalPath)) {
    restoreSync("startup-recovery");
  }

  return {
    async apply(window, signal) {
      if (recoveryPending)
        return { error: "The previous system wallpaper has not been recovered.", success: false };
      if (applied) return { changed: false, success: true };
      throwIfAborted(signal);

      try {
        const png = await captureBackgroundFrame(window, signal);
        throwIfAborted(signal);
        writeFileSync(fallbackImagePath, png);
        const result = await loadNativeWallpaperModule().applySystemWallpaper(
          fallbackImagePath,
          journalPath,
        );
        throwIfAborted(signal);
        if (!result.success) {
          restoreSync("apply-failure");
          return result;
        }
        applied = true;
        logOperation("apply", "background-visible", result);
        return result;
      } catch (error) {
        restoreSync("apply-exception");
        if (signal.aborted) throw error;
        return {
          error: error instanceof Error ? error.message : String(error),
          success: false,
        };
      }
    },

    dispose() {
      restoreSync("dispose");
    },

    isApplied() {
      return applied || recoveryPending;
    },

    async restore(reason, signal) {
      if (!applied && !recoveryPending) return { changed: false, success: true };
      throwIfAborted(signal);
      let result: SystemWallpaperFallbackOperationResult;
      try {
        result = await loadNativeWallpaperModule().restoreSystemWallpaper(journalPath);
      } catch (error) {
        result = nativeFailure(error);
      }
      if (result.success) {
        applied = false;
        recoveryPending = false;
      } else recoveryPending = true;
      throwIfAborted(signal);
      logOperation("restore", reason, result);
      return result;
    },

    restoreSync,
  };
}

async function captureBackgroundFrame(window: BrowserWindow, signal: AbortSignal) {
  throwIfAborted(signal);
  const ready = await window.webContents.executeJavaScript(
    `new Promise((resolve) => {
      const startedAt = performance.now();
      const poll = () => {
        if (document.querySelector(${JSON.stringify(CAPTURE_READY_SELECTOR)})) {
          resolve(true);
          return;
        }
        if (performance.now() - startedAt > 5_000) {
          resolve(false);
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
    })`,
    true,
  );
  if (ready !== true) {
    throw new Error("Desktop playback wallpaper was not ready for background capture.");
  }

  const captureModeEnabled = await window.webContents.executeJavaScript(
    `(() => {
      window.dispatchEvent(new CustomEvent(${JSON.stringify(BACKGROUND_CAPTURE_EVENT)}, {
        detail: { enabled: true },
      }));
      return true;
    })()`,
    true,
  );
  if (captureModeEnabled !== true) {
    throw new Error("Desktop playback wallpaper rejected background-only capture mode.");
  }

  try {
    await window.webContents.executeJavaScript(
      `new Promise((resolve, reject) => {
        const startedAt = performance.now();
        const poll = () => {
          if (document.querySelector(${JSON.stringify(CAPTURE_MODE_SELECTOR)})) {
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 120)));
            return;
          }
          if (performance.now() - startedAt > 3_000) {
            reject(new Error("Background-only capture mode did not become ready."));
            return;
          }
          requestAnimationFrame(poll);
        };
        poll();
      })`,
      true,
    );
    throwIfAborted(signal);
    const image = await window.webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) {
      throw new Error("Electron returned an empty system-wallpaper fallback frame.");
    }
    return image.toPNG();
  } finally {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      await window.webContents.executeJavaScript(
        `window.dispatchEvent(new CustomEvent(${JSON.stringify(BACKGROUND_CAPTURE_EVENT)}, {
          detail: { enabled: false },
        }))`,
        true,
      );
    }
  }
}

function nativeFailure(error: unknown): SystemWallpaperFallbackOperationResult {
  return { success: false, error: error instanceof Error ? error.message : String(error) };
}

function logOperation(
  operation: "apply" | "restore",
  reason: string,
  result: SystemWallpaperFallbackOperationResult,
) {
  const payload = { reason, result };
  if (result.success) {
    wallpaperLog.info(`[desktop-playback-wallpaper] system fallback ${operation}`, payload);
  } else {
    wallpaperLog.error(`[desktop-playback-wallpaper] system fallback ${operation} failed`, payload);
  }
}

function throwIfAborted(signal: AbortSignal) {
  if (!signal.aborted) return;
  const error = new Error("System-wallpaper fallback operation was cancelled.");
  error.name = "AbortError";
  throw error;
}
