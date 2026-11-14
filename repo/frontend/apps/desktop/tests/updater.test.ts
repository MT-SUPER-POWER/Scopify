import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { BrowserWindow } from "electron";
import { normalizeDesktopHostConfig } from "../types/config";

const originalPlatform = process.platform;
const openExternalLink = mock(async (_url: string) => {});
class TestCancellationToken {
  cancelled = false;
  cancel() {
    this.cancelled = true;
  }
}

const nativeUpdater = Object.assign(new EventEmitter(), {
  autoDownload: true,
  allowPrerelease: false,
  allowDowngrade: true,
  channel: "latest",
  autoInstallOnAppQuit: true,
  setFeedURL: mock(() => {}),
  checkForUpdates: mock(async () => {}),
  downloadUpdate: mock(async (_cancellation?: TestCancellationToken) => {}),
  quitAndInstall: mock(() => {}),
});

mock.module("electron", () => ({
  app: { isPackaged: true, getVersion: () => "2.0.4" },
}));
mock.module("electron-updater", () => ({
  default: { autoUpdater: nativeUpdater },
  CancellationToken: TestCancellationToken,
}));
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
    allowPrerelease: false,
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
  updater.configureUpdater({ allowPrerelease: false, checkOnStartup: true, autoDownload: false });
});

afterAll(() => {
  Object.defineProperty(process, "platform", { value: originalPlatform });
  mock.restore();
});

test("macOS checks releases without downloading or opening the browser automatically", async () => {
  updater.configureUpdater({ allowPrerelease: false, checkOnStartup: true, autoDownload: true });
  nativeUpdater.emit("update-not-available");
  await updater.checkForUpdates();
  expect(nativeUpdater.checkForUpdates).toHaveBeenCalledTimes(1);
  expect(nativeUpdater.autoDownload).toBe(false);
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(false);
  nativeUpdater.emit("update-available", { version: "2.1.0" });
  updater.configureUpdater({ allowPrerelease: false, checkOnStartup: true, autoDownload: true });
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
  updater.configureUpdater({ allowPrerelease: false, checkOnStartup: true, autoDownload: true });
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

test("older configuration opts out of Beta while an explicit choice survives normalization", () => {
  expect(normalizeDesktopHostConfig({ updater: { autoDownload: true } }).updater).toEqual({
    allowPrerelease: false,
    autoDownload: true,
    checkOnStartup: true,
  });
  expect(
    normalizeDesktopHostConfig({ updater: { allowPrerelease: true } }).updater.allowPrerelease,
  ).toBe(true);
});

test("Beta selection enables its channel without permitting a downgrade", () => {
  nativeUpdater.allowDowngrade = true;
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  expect(nativeUpdater.channel).toBe("beta");
  expect(nativeUpdater.allowPrerelease).toBe(true);
  expect(nativeUpdater.allowDowngrade).toBe(false);
  nativeUpdater.emit("update-available", { version: "3.5.0-beta.1" });
  expect(updater.getUpdateState()).toMatchObject({
    status: "available",
    version: "3.5.0-beta.1",
  });
});

test("macOS opens the selected Beta release for manual installation", async () => {
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  nativeUpdater.emit("update-available", { version: "3.5.0-beta.1" });
  await updater.downloadUpdate();
  expect(openExternalLink).toHaveBeenCalledWith(
    "https://github.com/MT-SUPER-POWER/Scopify/releases/tag/v3.5.0-beta.1",
  );
  expect(nativeUpdater.downloadUpdate).not.toHaveBeenCalled();
});

test("opting out disarms a downloaded Beta and rejects a late Beta completion", () => {
  Object.defineProperty(process, "platform", { value: "win32" });
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  nativeUpdater.emit("update-downloaded", { version: "3.5.0-beta.1" });
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(true);
  updater.configureUpdater({
    allowPrerelease: false,
    checkOnStartup: true,
    autoDownload: false,
  });
  nativeUpdater.emit("update-downloaded", { version: "3.5.0-beta.1" });
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(false);
  expect(nativeUpdater.channel).toBe("latest");
  expect(nativeUpdater.allowPrerelease).toBe(false);
  expect(nativeUpdater.allowDowngrade).toBe(false);
  expect(updater.getUpdateState()).toMatchObject({ status: "idle", version: undefined });
  updater.quitAndInstallUpdate();
  expect(nativeUpdater.quitAndInstall).not.toHaveBeenCalled();
});

test("macOS returns the new channel state if the preference changes while opening a release", async () => {
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  let finishOpening!: () => void;
  openExternalLink.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishOpening = resolve;
      }),
  );
  nativeUpdater.checkForUpdates.mockImplementationOnce(async () => {
    nativeUpdater.emit("update-not-available");
  });
  nativeUpdater.emit("update-available", { version: "3.5.0-beta.1" });
  const download = updater.downloadUpdate();
  updater.configureUpdater({
    allowPrerelease: false,
    checkOnStartup: true,
    autoDownload: false,
  });
  finishOpening();
  expect(await download).toMatchObject({ status: "not-available", version: undefined });
});

test("a channel change ignores an in-flight check and rechecks the new channel", async () => {
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  let finishCheck!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishCheck = resolve;
  });
  nativeUpdater.checkForUpdates.mockImplementationOnce(async () => {
    await pending;
    nativeUpdater.emit("update-available", { version: "3.5.0-beta.1" });
  });
  nativeUpdater.checkForUpdates.mockImplementationOnce(async () => {
    nativeUpdater.emit("update-not-available");
  });

  const check = updater.checkForUpdates();
  updater.configureUpdater({
    allowPrerelease: false,
    checkOnStartup: true,
    autoDownload: false,
  });
  finishCheck();
  expect(await check).toMatchObject({ status: "not-available", version: undefined });
  expect(nativeUpdater.checkForUpdates).toHaveBeenCalledTimes(2);
  expect(nativeUpdater.downloadUpdate).not.toHaveBeenCalled();
});

test("a channel change cancels an old download and ignores its late events", async () => {
  Object.defineProperty(process, "platform", { value: "win32" });
  updater.configureUpdater({
    allowPrerelease: true,
    checkOnStartup: true,
    autoDownload: false,
  });
  let finishDownload!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishDownload = resolve;
  });
  nativeUpdater.downloadUpdate.mockImplementationOnce(async (cancellation) => {
    await pending;
    expect(cancellation?.cancelled).toBe(true);
    nativeUpdater.emit("update-downloaded", { version: "3.5.0-beta.1" });
    throw new Error("Old download cancelled");
  });
  nativeUpdater.checkForUpdates.mockImplementationOnce(async () => {
    nativeUpdater.emit("update-not-available");
  });

  nativeUpdater.emit("update-available", { version: "3.5.0-beta.1" });
  const download = updater.downloadUpdate();
  expect(updater.getUpdateState().status).toBe("downloading");
  updater.configureUpdater({
    allowPrerelease: false,
    checkOnStartup: true,
    autoDownload: false,
  });
  nativeUpdater.emit("download-progress", { percent: 90 });
  nativeUpdater.emit("error", new Error("Late download error"));
  finishDownload();
  expect(await download).toMatchObject({
    status: "not-available",
    version: undefined,
    message: undefined,
    percent: undefined,
  });
  expect(nativeUpdater.autoInstallOnAppQuit).toBe(false);
  updater.quitAndInstallUpdate();
  expect(nativeUpdater.quitAndInstall).not.toHaveBeenCalled();
});
