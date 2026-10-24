import { spawn } from "node:child_process";

import { resolveWindowsScriptPath } from "@main/services/windowsScripts";

import type { DesktopIconVisibilityState } from "@scopify/desktop-contract";

import { parseWindowsDesktopIconVisibilityResult } from "./result";

import type {
  DesktopIconAction,
  WindowsDesktopIconVisibilityOptions,
} from "@/types/desktopIconVisibility";
export type { WindowsDesktopIconVisibilityOptions } from "@/types/desktopIconVisibility";

export function getWindowsDesktopIconVisibility(
  options: WindowsDesktopIconVisibilityOptions = {},
): Promise<DesktopIconVisibilityState> {
  return runWindowsDesktopIconAction("Get", options);
}

export function setWindowsDesktopIconVisibility(
  visible: boolean,
  options: WindowsDesktopIconVisibilityOptions = {},
): Promise<DesktopIconVisibilityState> {
  return runWindowsDesktopIconAction(visible ? "Show" : "Hide", options);
}

async function runWindowsDesktopIconAction(
  action: DesktopIconAction,
  options: WindowsDesktopIconVisibilityOptions,
): Promise<DesktopIconVisibilityState> {
  if (process.platform !== "win32") {
    return {
      diagnostic: "Desktop icon visibility control requires Windows Explorer.",
      supported: false,
      visible: null,
    };
  }

  const scriptPath = options.scriptPath ?? resolveWindowsScriptPath("desktop-icons.ps1");
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
      action,
    ],
    { windowsHide: true },
  );

  let stdout = "";
  let stderr = "";
  let launchError: unknown;
  let timedOut = false;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill();
  }, 10_000);
  const exitCode = await new Promise<number | null>((resolve) => {
    child.once("error", (error) => {
      launchError = error;
      resolve(null);
    });
    child.once("close", resolve);
  });
  clearTimeout(timeout);

  if (launchError || timedOut) {
    return {
      diagnostic: timedOut
        ? "Windows desktop icon control timed out."
        : `Failed to launch Windows desktop icon control: ${String(launchError)}`,
      supported: false,
      visible: null,
    };
  }

  return parseWindowsDesktopIconVisibilityResult(stdout, stderr, exitCode);
}
