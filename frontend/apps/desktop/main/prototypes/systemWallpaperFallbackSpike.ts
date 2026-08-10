import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { app, type BrowserWindow } from "electron";
import { z } from "zod";

import { logger } from "../constants.js";

const WALLPAPER_RESULT_SCHEMA = z
  .object({
    Error: z.string().optional(),
    Ok: z.boolean(),
  })
  .passthrough();

let fallbackImagePath = "";
let initialized = false;
let journalPath = "";
let scriptPath = "";

export function initializeSystemWallpaperFallbackSpike() {
  if (process.env.SCOPIFY_DESKTOP_WALLPAPER_SPIKE_SYSTEM_FALLBACK !== "1") return false;
  if (initialized) return true;

  const stateDirectory =
    process.env.SCOPIFY_DESKTOP_WALLPAPER_SPIKE_STATE_DIR?.trim() ||
    join(app.getPath("userData"), "prototypes", "desktop-wallpaper-host-spike");
  mkdirSync(stateDirectory, { recursive: true });
  fallbackImagePath = join(stateDirectory, "system-wallpaper-fallback.png");
  journalPath = join(stateDirectory, "system-wallpaper-journal.json");
  scriptPath = join(
    app.getAppPath(),
    "prototypes",
    "desktop-wallpaper-host-spike",
    "system-wallpaper.ps1",
  );

  restoreSystemWallpaperFallbackSync("startup-recovery");
  app.once("will-quit", () => restoreSystemWallpaperFallbackSync("will-quit"));
  initialized = true;
  return true;
}

export async function applySystemWallpaperFallbackSpike(window: BrowserWindow) {
  if (!initialized) {
    return { error: "System-wallpaper fallback is not initialized.", success: false } as const;
  }

  const statusHidden = await window.webContents.executeJavaScript(`
    (() => {
      const element =
        document.querySelector("[data-desktop-wallpaper-spike-status]") ??
        document.querySelector("aside");
      if (!(element instanceof HTMLElement)) return false;
      element.dataset.previousVisibility = element.style.visibility;
      element.style.visibility = "hidden";
      return true;
    })()
  `);
  if (statusHidden !== true) {
    return {
      error: "The diagnostic overlay could not be hidden before capture.",
      success: false,
    } as const;
  }

  try {
    await window.webContents.executeJavaScript(
      "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    );
    const image = await window.webContents.capturePage(undefined, { stayHidden: true });
    if (image.isEmpty()) {
      return {
        error: "Electron returned an empty system-wallpaper fallback frame.",
        success: false,
      } as const;
    }
    writeFileSync(fallbackImagePath, image.toPNG());
  } finally {
    await window.webContents.executeJavaScript(`
      (() => {
        const element =
          document.querySelector("[data-desktop-wallpaper-spike-status]") ??
          document.querySelector("aside");
        if (!(element instanceof HTMLElement)) return;
        element.style.visibility = element.dataset.previousVisibility ?? "";
        delete element.dataset.previousVisibility;
      })()
    `);
  }

  const result = await runSystemWallpaperScript("Apply", [
    "-ImagePath",
    fallbackImagePath,
    "-JournalPath",
    journalPath,
  ]);
  if (!result.success) {
    restoreSystemWallpaperFallbackSync("apply-failure");
  }
  return result;
}

function getPowerShellArguments(action: "Apply" | "Restore", extraArguments: string[]) {
  return [
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
}

function parseWallpaperResult(stdout: string, stderr: string, exitCode: number | null) {
  const lastOutputLine = stdout.trim().split(/\r?\n/).at(-1);
  if (!lastOutputLine) {
    return {
      error: stderr.trim() || "System-wallpaper host returned no result.",
      exitCode,
      success: false,
    } as const;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lastOutputLine);
  } catch (error) {
    return {
      error: `System-wallpaper host returned invalid JSON: ${String(error)}`,
      exitCode,
      success: false,
    } as const;
  }

  const result = WALLPAPER_RESULT_SCHEMA.safeParse(parsed);
  if (!result.success || exitCode !== 0 || !result.data.Ok) {
    return {
      error: result.success
        ? (result.data.Error ?? "System-wallpaper host rejected the operation.")
        : result.error.message,
      exitCode,
      ...(result.success ? { result: result.data } : {}),
      stderr: stderr.trim(),
      success: false,
    } as const;
  }
  return { result: result.data, success: true } as const;
}

async function runSystemWallpaperScript(action: "Apply" | "Restore", extraArguments: string[]) {
  const child = spawn("powershell.exe", getPowerShellArguments(action, extraArguments), {
    windowsHide: true,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  }).catch((error) => {
    stderr += String(error);
    return null;
  });
  return parseWallpaperResult(stdout, stderr, exitCode);
}

function restoreSystemWallpaperFallbackSync(reason: string) {
  const child = spawnSync(
    "powershell.exe",
    getPowerShellArguments("Restore", ["-JournalPath", journalPath]),
    { encoding: "utf8", timeout: 15_000, windowsHide: true },
  );
  const result = parseWallpaperResult(child.stdout ?? "", child.stderr ?? "", child.status);
  if (result.success) {
    logger.info("[desktop-wallpaper-spike] system wallpaper restore", {
      reason,
      result: result.result,
    });
  } else {
    logger.error("[desktop-wallpaper-spike] system wallpaper restore failed", {
      reason,
      result,
    });
  }
}
