import { app, type BrowserWindow } from "electron";
import electronUpdater from "electron-updater";
import type {
  AppUpdateState,
  AppUpdateStatePatch,
  DesktopHostConfig,
} from "@scopifymusicplayer/desktop-contract";
import { logger } from "../constants.js";

const { autoUpdater } = electronUpdater;

let mainWindow: BrowserWindow | null = null;
let initialized = false;
let updaterConfig: DesktopHostConfig["updater"] = {
  checkOnStartup: true,
  autoDownload: false,
};
let state: AppUpdateState = {
  status: "idle",
  supported: false,
  currentVersion: app.getVersion(),
};

function isUpdaterSupported() {
  return app.isPackaged && (process.platform === "win32" || process.platform === "darwin");
}

function setState(patch: AppUpdateStatePatch) {
  state = {
    ...state,
    ...patch,
    supported: isUpdaterSupported(),
    currentVersion: app.getVersion(),
  };
  mainWindow?.webContents.send("updater:status-changed", state);
}

export function getUpdateState(): AppUpdateState {
  return {
    ...state,
    supported: isUpdaterSupported(),
    currentVersion: app.getVersion(),
  };
}

export function configureUpdater(config: DesktopHostConfig["updater"]) {
  updaterConfig = { ...config };

  if (updaterConfig.autoDownload && state.status === "available") {
    void downloadUpdate().catch((error) => {
      logger.warn("[updater] automatic download failed:", error);
    });
  }
}

export function initializeUpdater(window: BrowserWindow, config: DesktopHostConfig["updater"]) {
  mainWindow = window;
  if (initialized) return;

  initialized = true;
  configureUpdater(config);
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () =>
    setState({
      status: "checking",
      version: undefined,
      percent: undefined,
      message: undefined,
    }),
  );
  autoUpdater.on("update-available", (info) => {
    setState({
      status: "available",
      version: info.version,
      percent: undefined,
      message: undefined,
      lastCheckedAt: Date.now(),
    });

    if (updaterConfig.autoDownload) {
      void downloadUpdate().catch((error) => {
        logger.warn("[updater] automatic download failed:", error);
      });
    }
  });
  autoUpdater.on("update-not-available", () =>
    setState({
      status: "not-available",
      version: undefined,
      percent: undefined,
      message: undefined,
      lastCheckedAt: Date.now(),
    }),
  );
  autoUpdater.on("download-progress", (progress) =>
    setState({
      status: "downloading",
      percent: progress.percent,
      message: undefined,
    }),
  );
  autoUpdater.on("update-downloaded", (info) =>
    setState({
      status: "downloaded",
      version: info.version,
      percent: 100,
      message: undefined,
    }),
  );
  autoUpdater.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[updater] update error:", message);
    setState({
      status: "error",
      percent: undefined,
      message,
      lastCheckedAt: Date.now(),
    });
  });
}

export async function checkForUpdates(): Promise<AppUpdateState> {
  if (!isUpdaterSupported()) {
    setState({ status: "unsupported", percent: undefined, message: undefined });
    return getUpdateState();
  }

  if (state.status === "checking" || state.status === "downloading") {
    return getUpdateState();
  }

  try {
    setState({
      status: "checking",
      version: undefined,
      percent: undefined,
      message: undefined,
    });
    await autoUpdater.checkForUpdates();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[updater] check failed:", message);
    setState({
      status: "error",
      percent: undefined,
      message,
      lastCheckedAt: Date.now(),
    });
  }

  return getUpdateState();
}

export async function downloadUpdate(): Promise<AppUpdateState> {
  if (!isUpdaterSupported()) {
    setState({ status: "unsupported", percent: undefined, message: undefined });
    return getUpdateState();
  }

  if (state.status === "downloading" || state.status === "downloaded") {
    return getUpdateState();
  }

  if (state.status !== "available") {
    return getUpdateState();
  }

  try {
    setState({ status: "downloading", percent: 0, message: undefined });
    await autoUpdater.downloadUpdate();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[updater] download failed:", message);
    setState({ status: "error", percent: undefined, message });
  }

  return getUpdateState();
}

export function quitAndInstallUpdate() {
  if (!isUpdaterSupported() || state.status !== "downloaded") return;
  autoUpdater.quitAndInstall(false, true);
}

export function scheduleStartupUpdateCheck(delayMs = 5000) {
  if (!updaterConfig.checkOnStartup) {
    logger.info("[updater] startup check disabled by user preference");
    return;
  }

  if (!isUpdaterSupported()) {
    setState({ status: "unsupported", message: undefined });
    return;
  }

  setTimeout(() => {
    if (!updaterConfig.checkOnStartup) return;
    void checkForUpdates();
  }, delayMs);
}
