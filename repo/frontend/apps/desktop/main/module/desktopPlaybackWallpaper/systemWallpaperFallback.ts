import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { app, type BrowserWindow } from "electron";

import type {
  DesktopPlaybackWallpaperSystemFallback,
  SystemWallpaperFallbackOperationResult,
  WindowsSystemWallpaperFallbackOptions,
} from "../../../types/systemWallpaperFallback.js";
import { logger } from "../../constants.js";
import { parseSystemWallpaperResult } from "./fallbackPolicy.js";
import { resolveDesktopPlaybackWallpaperScriptPath } from "./scriptPaths.js";

const BACKGROUND_CAPTURE_EVENT = "desktop-playback-wallpaper:capture-background";
const CAPTURE_READY_SELECTOR = '[data-desktop-playback-wallpaper-content-ready="true"]';
const CAPTURE_MODE_SELECTOR = '[data-desktop-playback-wallpaper-capture-background="true"]';
const FALLBACK_IMAGE_FILE = "system-wallpaper-fallback.png";
const JOURNAL_FILE = "system-wallpaper-journal.json";
type SystemWallpaperAction = "Apply" | "Restore";

export function createWindowsSystemWallpaperFallback(
  options: WindowsSystemWallpaperFallbackOptions = {},
): DesktopPlaybackWallpaperSystemFallback {
  const stateDirectory =
    options.stateDirectory ?? join(app.getPath("userData"), "desktop-playback-wallpaper");
  const fallbackImagePath = join(stateDirectory, FALLBACK_IMAGE_FILE);
  const journalPath = join(stateDirectory, JOURNAL_FILE);
  const scriptPath =
    options.scriptPath ??
    resolveDesktopPlaybackWallpaperScriptPath("system-wallpaper.ps1", {
      appPath: app.getAppPath(),
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
    });
  let applied = false;

  mkdirSync(stateDirectory, { recursive: true });

  const getArguments = (action: SystemWallpaperAction, extraArguments: string[]) => [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-Action",
    action,
    ...extraArguments,
  ];

  const restoreSync = (reason: string): SystemWallpaperFallbackOperationResult => {
    const child = spawnSync(
      "powershell.exe",
      getArguments("Restore", ["-JournalPath", journalPath]),
      { encoding: "utf8", timeout: 15_000, windowsHide: true },
    );
    const result = parseSystemWallpaperResult(child.stdout ?? "", child.stderr ?? "", child.status);
    applied = false;
    logOperation("restore", reason, result);
    return result;
  };

  if (existsSync(journalPath)) {
    restoreSync("startup-recovery");
  }

  return {
    async apply(window, signal) {
      if (applied) return { changed: false, success: true };
      throwIfAborted(signal);

      try {
        const png = await captureBackgroundFrame(window, signal);
        throwIfAborted(signal);
        writeFileSync(fallbackImagePath, png);
        const result = await runSystemWallpaperScript(
          getArguments("Apply", ["-ImagePath", fallbackImagePath, "-JournalPath", journalPath]),
          signal,
        );
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
      return applied;
    },

    async restore(reason, signal) {
      if (!applied) return { changed: false, success: true };
      const result = await runSystemWallpaperScript(
        getArguments("Restore", ["-JournalPath", journalPath]),
        signal,
      );
      if (result.success) applied = false;
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

async function runSystemWallpaperScript(
  arguments_: string[],
  signal: AbortSignal,
): Promise<SystemWallpaperFallbackOperationResult> {
  throwIfAborted(signal);
  const child = spawn("powershell.exe", arguments_, { windowsHide: true });
  let stdout = "";
  let stderr = "";
  let launchError: unknown;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const onAbort = () => child.kill();
  signal.addEventListener("abort", onAbort, { once: true });
  const exitCode = await new Promise<number | null>((resolve) => {
    child.once("error", (error) => {
      launchError = error;
      resolve(null);
    });
    child.once("close", resolve);
  });
  signal.removeEventListener("abort", onAbort);
  throwIfAborted(signal);
  if (launchError) {
    return {
      error: `Failed to launch the Windows system-wallpaper host: ${String(launchError)}`,
      success: false,
    };
  }
  return parseSystemWallpaperResult(stdout, stderr, exitCode);
}

function logOperation(
  operation: "apply" | "restore",
  reason: string,
  result: SystemWallpaperFallbackOperationResult,
) {
  const payload = { reason, result };
  if (result.success) {
    logger.info(`[desktop-playback-wallpaper] system fallback ${operation}`, payload);
  } else {
    logger.error(`[desktop-playback-wallpaper] system fallback ${operation} failed`, payload);
  }
}

function throwIfAborted(signal: AbortSignal) {
  if (!signal.aborted) return;
  const error = new Error("System-wallpaper fallback operation was cancelled.");
  error.name = "AbortError";
  throw error;
}
