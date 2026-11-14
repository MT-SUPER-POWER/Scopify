import { app, type BrowserWindow } from "electron";
import electronUpdater, { CancellationToken } from "electron-updater";
import type {
  AppUpdateState,
  AppUpdateStatePatch,
  DesktopHostConfig,
} from "@scopify/desktop-contract";
import { openExternalLink } from "@main/service/externalLinks";
import { updaterLog } from "@main/utils/logger";
import { getReleaseBaseUrl, ReleaseProvider } from "./releaseProvider";

const { autoUpdater } = electronUpdater;

let mainWindow: BrowserWindow | null = null;
let initialized = false;
let updaterConfig: DesktopHostConfig["updater"] = {
  allowPrerelease: false,
  checkOnStartup: true,
  autoDownload: false,
};
let policyRevision = 0;
let checkRevision: number | null = null;
let downloadRevision: number | null = null;
let downloadCancellation: CancellationToken | null = null;
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
    manualInstall: process.platform === "darwin",
  };
  mainWindow?.webContents.send("updater:status-changed", state);
  syncTaskbarProgress();
}

/** 下载期间在任务栏图标上同步进度，其余状态清除。 */
function syncTaskbarProgress() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (state.status === "downloading") {
    const percent = typeof state.percent === "number" ? state.percent : 0;
    mainWindow.setProgressBar(Math.min(1, Math.max(0, percent / 100)));
  } else {
    mainWindow.setProgressBar(-1);
  }
}

export function getUpdateState(): AppUpdateState {
  return {
    ...state,
    supported: isUpdaterSupported(),
    currentVersion: app.getVersion(),
    manualInstall: process.platform === "darwin",
  };
}

export function configureUpdater(config: DesktopHostConfig["updater"]) {
  const channelChanged = updaterConfig.allowPrerelease !== config.allowPrerelease;
  updaterConfig = { ...config };
  autoUpdater.channel = config.allowPrerelease ? "beta" : "latest";
  autoUpdater.allowPrerelease = config.allowPrerelease;
  // Setting channel enables downgrades in electron-updater; opting out of Beta must not do so.
  autoUpdater.allowDowngrade = false;

  if (channelChanged) {
    policyRevision += 1;
    autoUpdater.autoInstallOnAppQuit = false;
    downloadCancellation?.cancel();
    setState({
      status: checkRevision !== null || downloadRevision !== null ? "checking" : "idle",
      version: undefined,
      percent: undefined,
      message: undefined,
      lastCheckedAt: undefined,
    });
  }

  if (process.platform !== "darwin" && updaterConfig.autoDownload && state.status === "available") {
    void downloadUpdate().catch((error) => {
      updaterLog.warn("[updater] automatic download failed:", error);
    });
  }
}

function isStaleUpdateOperation() {
  return (
    (checkRevision !== null && checkRevision !== policyRevision) ||
    (downloadRevision !== null && downloadRevision !== policyRevision)
  );
}

function isAllowedUpdateVersion(version: string) {
  return (
    !version.includes("-") ||
    (updaterConfig.allowPrerelease && /^\d+\.\d+\.\d+-beta\.\d+$/.test(version))
  );
}

export function initializeUpdater(window: BrowserWindow, config: DesktopHostConfig["updater"]) {
  mainWindow = window;
  if (initialized) return;

  initialized = true;
  configureUpdater(config);
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => {
    if (isStaleUpdateOperation()) return;
    setState({
      status: "checking",
      version: undefined,
      percent: undefined,
      message: undefined,
    });
  });
  autoUpdater.on("update-available", (info) => {
    if (isStaleUpdateOperation() || !isAllowedUpdateVersion(info.version)) return;
    setState({
      status: "available",
      version: info.version,
      percent: undefined,
      message: undefined,
      lastCheckedAt: Date.now(),
    });

    if (process.platform !== "darwin" && updaterConfig.autoDownload) {
      void downloadUpdate().catch((error) => {
        updaterLog.warn("[updater] automatic download failed:", error);
      });
    }
  });
  autoUpdater.on("update-not-available", () => {
    if (isStaleUpdateOperation()) return;
    setState({
      status: "not-available",
      version: undefined,
      percent: undefined,
      message: undefined,
      lastCheckedAt: Date.now(),
    });
  });
  autoUpdater.on("download-progress", (progress) => {
    if (isStaleUpdateOperation()) return;
    setState({
      status: "downloading",
      percent: progress.percent,
      message: undefined,
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    if (isStaleUpdateOperation() || !isAllowedUpdateVersion(info.version)) return;
    // 下载完成后，用户正常退出应用时静默安装，不必非得回到设置页点「重启并安装」。
    autoUpdater.autoInstallOnAppQuit = process.platform !== "darwin";
    setState({
      status: "downloaded",
      version: info.version,
      percent: 100,
      message: undefined,
    });
  });
  autoUpdater.on("error", (error) => {
    if (isStaleUpdateOperation()) return;
    const message = error instanceof Error ? error.message : String(error);
    updaterLog.warn("[updater] update error:", message);
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

  if (checkRevision !== null || downloadRevision !== null) {
    return getUpdateState();
  }

  const revision = policyRevision;
  checkRevision = revision;
  try {
    setState({
      status: "checking",
      version: undefined,
      percent: undefined,
      message: undefined,
    });
    autoUpdater.setFeedURL({ provider: "custom", updateProvider: ReleaseProvider });
    await autoUpdater.checkForUpdates();
  } catch (error) {
    if (revision === policyRevision) {
      const message = error instanceof Error ? error.message : String(error);
      updaterLog.warn("[updater] check failed:", message);
      setState({
        status: "error",
        percent: undefined,
        message,
        lastCheckedAt: Date.now(),
      });
    }
  } finally {
    checkRevision = null;
    if (revision !== policyRevision) await checkForUpdates();
  }

  return getUpdateState();
}

export async function downloadUpdate(): Promise<AppUpdateState> {
  if (!isUpdaterSupported()) {
    setState({ status: "unsupported", percent: undefined, message: undefined });
    return getUpdateState();
  }

  if (downloadRevision !== null || state.status === "downloaded") {
    return getUpdateState();
  }

  if (state.status !== "available") {
    return getUpdateState();
  }

  const revision = policyRevision;
  const cancellation = new CancellationToken();
  downloadRevision = revision;
  downloadCancellation = cancellation;
  try {
    if (process.platform === "darwin") {
      if (state.version) {
        await openExternalLink(
          `${getReleaseBaseUrl()}/tag/${encodeURIComponent(`v${state.version}`)}`,
        );
      }
    } else {
      setState({ status: "downloading", percent: 0, message: undefined });
      await autoUpdater.downloadUpdate(cancellation);
    }
  } catch (error) {
    if (revision === policyRevision && !cancellation.cancelled) {
      const message = error instanceof Error ? error.message : String(error);
      updaterLog.warn("[updater] download failed:", message);
      setState({ status: "error", percent: undefined, message });
    }
  } finally {
    downloadRevision = null;
    downloadCancellation = null;
    if (revision !== policyRevision) await checkForUpdates();
  }

  return getUpdateState();
}

export function quitAndInstallUpdate() {
  if (process.platform === "darwin" || !isUpdaterSupported() || state.status !== "downloaded")
    return;
  autoUpdater.quitAndInstall(false, true);
}

export function scheduleStartupUpdateCheck(delayMs = 5000) {
  if (!updaterConfig.checkOnStartup) {
    updaterLog.info("[updater] startup check disabled by user preference");
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
