import { spawn } from "node:child_process";
import { app, type BrowserWindow, type Rectangle } from "electron";
import { z } from "zod";

import { desktopSurfaceHostCoversExactBounds } from "./desktopSurfaceBounds.js";
import { resolveDesktopPlaybackWallpaperScriptPath } from "./scriptPaths.js";

const WINDOWS_DESKTOP_SURFACE_HOST_RESULT_SCHEMA = z.object({
  ActualBottom: z.number(),
  ActualClientBottom: z.number(),
  ActualClientLeft: z.number(),
  ActualClientRight: z.number(),
  ActualClientTop: z.number(),
  ActualLeft: z.number(),
  ActualRight: z.number(),
  ActualTop: z.number(),
  CoversRequestedBounds: z.boolean(),
  CoversRequestedClientBounds: z.boolean(),
  DefView: z.number(),
  Message: z.string(),
  Mode: z.string(),
  Ok: z.boolean(),
  Progman: z.number(),
  RenderWindow: z.number(),
  RequestedBottom: z.number(),
  RequestedLeft: z.number(),
  RequestedRight: z.number(),
  RequestedTop: z.number(),
  Win32Error: z.number(),
  WorkerW: z.number(),
});

export type WindowsDesktopSurfaceHostResult = z.infer<
  typeof WINDOWS_DESKTOP_SURFACE_HOST_RESULT_SCHEMA
>;

export type WindowsDesktopSurfaceAttachResult =
  | { host: WindowsDesktopSurfaceHostResult; success: true }
  | {
      error: string;
      exitCode?: number | null;
      host?: WindowsDesktopSurfaceHostResult;
      stderr?: string;
      success: false;
    };

export interface WindowsDesktopSurfaceAttachOptions {
  scriptPath?: string;
  signal?: AbortSignal;
}

export async function attachWindowsDesktopSurface(
  window: BrowserWindow,
  targetBounds: Rectangle,
  options: WindowsDesktopSurfaceAttachOptions = {},
): Promise<WindowsDesktopSurfaceAttachResult> {
  throwIfAborted(options.signal);
  const handle = readNativeWindowHandle(window.getNativeWindowHandle());
  const scriptPath =
    options.scriptPath ??
    resolveDesktopPlaybackWallpaperScriptPath("host.ps1", {
      appPath: app.getAppPath(),
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
    });
  const child = spawn(
    "powershell.exe",
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-Action",
      "Attach",
      "-Hwnd",
      handle.toString(),
      "-TargetLeft",
      targetBounds.x.toString(),
      "-TargetTop",
      targetBounds.y.toString(),
      "-TargetWidth",
      targetBounds.width.toString(),
      "-TargetHeight",
      targetBounds.height.toString(),
    ],
    { windowsHide: true },
  );

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
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const exitCode = await new Promise<number | null>((resolve) => {
    child.once("error", (error) => {
      launchError = error;
      resolve(null);
    });
    child.once("close", resolve);
  });
  options.signal?.removeEventListener("abort", onAbort);
  throwIfAborted(options.signal);

  if (launchError) {
    return {
      error: `Failed to launch the Windows desktop surface host: ${String(launchError)}`,
      exitCode,
      stderr: stderr.trim(),
      success: false,
    };
  }

  const lastOutputLine = stdout.trim().split(/\r?\n/).at(-1);
  if (!lastOutputLine) {
    return {
      error: stderr.trim() || "Windows desktop surface host returned no result.",
      exitCode,
      success: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lastOutputLine);
  } catch (error) {
    return {
      error: `Windows desktop surface host returned invalid JSON: ${String(error)}`,
      exitCode,
      stderr: stderr.trim(),
      success: false,
    };
  }

  const host = WINDOWS_DESKTOP_SURFACE_HOST_RESULT_SCHEMA.safeParse(parsed);
  if (!host.success || exitCode !== 0 || !host.data.Ok) {
    return {
      error: host.success ? host.data.Message : host.error.message,
      exitCode,
      ...(host.success ? { host: host.data } : {}),
      stderr: stderr.trim(),
      success: false,
    };
  }

  if (!desktopSurfaceHostCoversExactBounds(host.data, targetBounds)) {
    return {
      error:
        "Windows accepted the wallpaper host, but its render client does not cover the display.",
      exitCode,
      host: host.data,
      stderr: stderr.trim(),
      success: false,
    };
  }

  return { host: host.data, success: true };
}

function readNativeWindowHandle(handle: Buffer) {
  return handle.byteLength >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0));
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error("Windows desktop surface attachment was cancelled.");
  error.name = "AbortError";
  throw error;
}
