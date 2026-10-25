import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { BrowserWindow } from "electron";

const originalPlatform = process.platform;
const openExternalLink = mock(async (_url: string) => {});
const nativeUpdater = Object.assign(new EventEmitter(), {
  autoDownload: true,
  autoInstallOnAppQuit: true,
  checkForUpdates: mock(async () => {}),
  downloadUpdate: mock(async () => {}),
  quitAndInstall: mock(() => {}),
});

mock.module("electron", () => ({
  app: { isPackaged: true, getVersion: () => "2.0.4" },
}));
mock.module("electron-updater", () => ({ default: { autoUpdater: nativeUpdater } }));
mock.module("../electron/main/service/externalLinks", () => ({ openExternalLink }));
mock.module("../electron/main/utils/logger", () => ({ updaterLog: { info() {}, warn() {} } }));

const updater = await import("../electron/main/service/updates");
const setProgressBar = mock((_progress: number) => {});
updater.initializeUpdater(
  {
    webContents: { send() {} },
    isDestroyed: () => false,
    setProgressBar,
  } as unknown as BrowserWindow,
  {
    checkOnStartup: true,
    autoDownload: true,
  },
);

beforeEach(() => {
  Object.defineProperty(process, "platform", { value: "darwin" });
  openExternalLink.mockClear();
  nativeUpdater.downloadUpdate.mockClear();
  nativeUpdater.checkForUpdates.mockClear();
  nativeUpdater.quitAndInstall.mockClear();
  nativeUpdater.emit("checking-for-update");
  updater.configureUpdater({ checkOnStartup: true, autoDownload: false });
});

afterAll(() => {
  Object.defineProperty(process, "platform", { value: originalPlatform });
  mock.restore();
});

test("macOS checks releases without downloading or opening the browser automatically", async () => {
  updater.configureUpdater({ checkOnStartup: true, autoDownload: true });
  nativeUpdater.emit("update-not-available");
  await updater.checkForUpdates();
  expect(nativeUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
  expect(nativeUpdater.autoDownload).toBe(false);
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(false);
  nativeUpdater.emit("update-available", { version: "2.1.0" });
  updater.configureUpdater({ checkOnStartup: true, autoDownload: true });
  expect(updater.getUpdateState()).toMatchObject({
    status: "available",
    currentVersion: "2.0.4",
    version: "2.1.0",
    manualInstall: true,
  });
  expect(nativeUpdater.downloadUpdate).not.toHaveBeenCalled();
  expect(openExternalLink).not.toHaveBeenCalled();
});

test("macOS opens the detected release only on explicit download", async () => {
  nativeUpdater.emit("update-available", { version: "2.1.0" });
  expect((await updater.downloadUpdate()).status).toBe("available");
  expect(openExternalLink).toHaveBeenCalledWith(
    "https://github.com/MT-SUPER-POWER/Scopify/releases/tag/v2.1.0",
  );
  expect(nativeUpdater.downloadUpdate).not.toHaveBeenCalled();
  nativeUpdater.emit("update-downloaded", { version: "2.1.0" });
  updater.quitAndInstallUpdate();
  expect(nativeUpdater.quitAndInstall).not.toHaveBeenCalled();
});

test("macOS reports browser launch failures without attempting native installation", async () => {
  nativeUpdater.emit("update-available", { version: "2.1.0" });
  openExternalLink.mockRejectedValueOnce(new Error("Browser launch failed"));
  expect(await updater.downloadUpdate()).toMatchObject({
    status: "error",
    message: "Browser launch failed",
    manualInstall: true,
  });
  expect(nativeUpdater.downloadUpdate).not.toHaveBeenCalled();
});

test("Windows retains automatic download and explicit installation", async () => {
  Object.defineProperty(process, "platform", { value: "win32" });
  updater.configureUpdater({ checkOnStartup: true, autoDownload: true });
  nativeUpdater.emit("update-available", { version: "2.1.0" });
  expect(nativeUpdater.downloadUpdate).toHaveBeenCalledTimes(1);
  expect(updater.getUpdateState().manualInstall).toBe(false);
  expect(openExternalLink).not.toHaveBeenCalled();
  nativeUpdater.emit("download-progress", { percent: 42 });
  expect(setProgressBar).toHaveBeenLastCalledWith(0.42);
  nativeUpdater.emit("update-downloaded", { version: "2.1.0" });
  expect(setProgressBar).toHaveBeenLastCalledWith(-1);
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(true);
  updater.quitAndInstallUpdate();
  expect(nativeUpdater.quitAndInstall).toHaveBeenCalledWith(false, true);
});
