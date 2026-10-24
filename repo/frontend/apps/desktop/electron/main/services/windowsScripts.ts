import { join } from "node:path";
import { app } from "electron";

/** PowerShell cannot execute inside ASAR; public resources are unpacked by electron-builder. */
export function resolveWindowsScriptPath(scriptName: string) {
  const root = app.isPackaged ? join(process.resourcesPath, "app.asar.unpacked") : app.getAppPath();
  return join(root, "public", "windows", scriptName);
}
