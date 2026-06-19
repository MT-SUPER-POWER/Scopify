import type { BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
import { logger } from "../constants.js";

const { autoUpdater } = electronUpdater;

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

let mainWindow: BrowserWindow | null = null;
let initialized = false;
let state: UpdateState = { status: "idle" };

function setState(next: UpdateState) {
  state = next;
  mainWindow?.webContents.send("updater:status-changed", state);
}

export function getUpdateState() {
  return state;
}

export function initializeUpdater(window: BrowserWindow) {
  mainWindow = window;
  if (initialized) return;

  initialized = true;
  autoUpdater.autoDownload = false;

  autoUpdater.on("checking-for-update", () => setState({ status: "checking" }));
  autoUpdater.on("update-available", (info) =>
    setState({ status: "available", version: info.version }),
  );
  autoUpdater.on("update-not-available", (info) =>
    setState({ status: "not-available", version: info.version }),
  );
  autoUpdater.on("download-progress", (progress) =>
    setState({ status: "downloading", percent: progress.percent }),
  );
  autoUpdater.on("update-downloaded", (info) =>
    setState({ status: "downloaded", version: info.version }),
  );
  autoUpdater.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[updater] update error:", message);
    setState({ status: "error", message });
  });
}

export async function checkForUpdates() {
  return autoUpdater.checkForUpdates();
}

export async function downloadUpdate() {
  return autoUpdater.downloadUpdate();
}

export function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall(false, true);
}
