import type {
  DesktopPlaybackControllerHost,
  DesktopPlaybackWallpaperServiceHostOptions,
} from "@/types/service/desktop/wallpaper";
export type { DesktopPlaybackWallpaperServiceHostOptions } from "@/types/service/desktop/wallpaper";
import { join } from "node:path";

import { app, type BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import type {
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferences,
} from "@scopify/desktop-contract";

import { parseDesktopPlaybackWallpaperPreferencesUpdate } from "@/types/desktopPlaybackWallpaper";
import { wallpaperLog } from "@main/utils/logger";
import { getTrayWindow, trayWindow } from "@main/window/tray";
import {
  isDesktopPlaybackWallpaperControlSender,
  isDesktopPlaybackWallpaperModelReader,
} from "./authorization";
import { createDesktopPlaybackWallpaperService } from "./service";
import type {
  DesktopPlaybackWallpaperService,
  DesktopPlaybackWallpaperDriver,
} from "@/types/service/desktop/wallpaper/service";
import { createDesktopPlaybackWallpaperPreferencesRepository } from "./preferences";

const PREFERENCES_FILE = "desktop-playback-wallpaper.json";

let service: DesktopPlaybackWallpaperService | null = null;
let initializationPromise: Promise<DesktopPlaybackWallpaperModel> | null = null;
let controllerHost: DesktopPlaybackControllerHost | null = null;
let mainWindow: BrowserWindow | null = null;
let ipcRegistered = false;
let quitCleanupRegistered = false;
let getControllerWindow: () => BrowserWindow | null = () => null;

export function initializeDesktopPlaybackWallpaperService(
  nextMainWindow: BrowserWindow,
  options: DesktopPlaybackWallpaperServiceHostOptions = {},
) {
  mainWindow = nextMainWindow;
  controllerHost = options.controller ?? controllerHost;
  getControllerWindow = options.getControllerWindow ?? getControllerWindow;

  if (!service) {
    const preferences = createDesktopPlaybackWallpaperPreferencesRepository({
      filePath: options.preferencesFilePath ?? join(app.getPath("userData"), PREFERENCES_FILE),
      onError: (message, error) =>
        wallpaperLog.error(`[desktop-playback-wallpaper] ${message}`, error),
    });
    service = createDesktopPlaybackWallpaperService({
      controller: options.controller,
      driver: options.driver ?? createFoundationDriver(process.platform),
      onError: (message, error) =>
        wallpaperLog.error(`[desktop-playback-wallpaper] ${message}`, error),
      preferences,
    });
    service.subscribe(broadcastModel);
    initializationPromise = service.initialize();
  }

  registerIpcHandlers();

  if (!quitCleanupRegistered) {
    quitCleanupRegistered = true;
    app.once("will-quit", () => {
      void service?.dispose();
      service = null;
      initializationPromise = null;
      controllerHost = null;
    });
  }

  return service;
}

export function waitForDesktopPlaybackWallpaperInitialization() {
  if (initializationPromise) return initializationPromise;
  return Promise.resolve(service?.getModel() ?? null);
}

export function isDesktopPlaybackControllerOpen() {
  const controllerWindow = getControllerWindow();
  return Boolean(controllerWindow && !controllerWindow.isDestroyed());
}

/** 已打开且最小化时恢复，已打开时关闭，否则打开。返回切换后是否可见。 */
export async function toggleDesktopPlaybackController() {
  const controllerWindow = getControllerWindow();
  if (controllerWindow && !controllerWindow.isDestroyed()) {
    if (controllerWindow.isMinimized()) {
      controllerWindow.restore();
      controllerWindow.show();
      controllerWindow.focus();
      return true;
    }
    controllerWindow.close();
    return false;
  }
  const result = await requireService().showController();
  return result.opened;
}

function createFoundationDriver(platform: NodeJS.Platform): DesktopPlaybackWallpaperDriver {
  // The service ships before the real renderer driver on purpose: launchers can depend on a
  // stable model now, while an enabled intent can never be misreported as running.
  return {
    async reconcile(preferences: DesktopPlaybackWallpaperPreferences) {
      if (!preferences.enabled || (!preferences.layers.background && !preferences.layers.lyrics)) {
        return null;
      }

      if (platform !== "win32" && platform !== "darwin") {
        return {
          diagnostic: "Desktop playback wallpaper requires Windows or macOS.",
          state: "unsupported",
        };
      }

      return {
        diagnostic:
          "The desktop playback wallpaper service is ready, but its renderer driver is not connected yet.",
        retryable: false,
        state: "faulted",
      };
    },
  };
}

function registerIpcHandlers() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle("desktop-playback-wallpaper:get-model", (event) => {
    requireModelReader(event, "desktop-playback-wallpaper:get-model");
    return requireService().getModel();
  });

  ipcMain.handle("desktop-playback-wallpaper:configure", async (event, input: unknown) => {
    requireControlSender(event, "desktop-playback-wallpaper:configure");
    const update = parseDesktopPlaybackWallpaperPreferencesUpdate(input);
    return requireService().configure(update);
  });

  ipcMain.handle("desktop-playback-wallpaper:retry", (event) => {
    requireControlSender(event, "desktop-playback-wallpaper:retry");
    return requireService().retry();
  });

  ipcMain.handle("desktop-playback-controller:show", (event) => {
    requireControlSender(event, "desktop-playback-controller:show");
    return requireService().showController();
  });

  ipcMain.handle("desktop-playback-controller:close", (event) => {
    requireControlSender(event, "desktop-playback-controller:close");
    const controllerWindow = getControllerWindow();
    if (!controllerWindow || controllerWindow.isDestroyed()) return false;
    controllerWindow.close();
    return true;
  });

  ipcMain.handle("desktop-playback-controller:is-open", (event) => {
    requireModelReader(event, "desktop-playback-controller:is-open");
    return isDesktopPlaybackControllerOpen();
  });

  ipcMain.handle("desktop-playback-controller:toggle", (event) => {
    requireControlSender(event, "desktop-playback-controller:toggle");
    return toggleDesktopPlaybackController();
  });

  ipcMain.handle("desktop-playback-controller:set-layout", (event, input: unknown) => {
    requireControllerSender(event, "desktop-playback-controller:set-layout");
    if (!isDesktopPlaybackControllerLayout(input)) {
      throw new TypeError("Invalid desktop playback controller layout.");
    }
    return controllerHost?.setLayout(input) ?? false;
  });
}

function requireService() {
  if (!service) {
    throw new Error("Desktop playback wallpaper service has not been initialized.");
  }
  return service;
}

function isControlSender(senderId: number) {
  return isDesktopPlaybackWallpaperControlSender(senderId, {
    controllerWindowId: getWindowId(getControllerWindow()),
    mainWindowId: getWindowId(mainWindow),
    trayWindowId: getWindowId(getTrayWindow()),
  });
}

function requireControlSender(event: IpcMainInvokeEvent, channel: string) {
  if (isControlSender(event.sender.id)) return;
  wallpaperLog.warn(
    `[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`,
  );
  throw new Error("The renderer is not authorized to control desktop playback wallpaper.");
}

function requireControllerSender(event: IpcMainInvokeEvent, channel: string) {
  if (event.sender.id === getWindowId(getControllerWindow())) return;
  wallpaperLog.warn(
    `[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`,
  );
  throw new Error("Only the desktop playback controller may perform this action.");
}

function requireModelReader(event: IpcMainInvokeEvent, channel: string) {
  if (
    isDesktopPlaybackWallpaperModelReader(event.sender.id, {
      controllerWindowId: getWindowId(getControllerWindow()),
      mainWindowId: getWindowId(mainWindow),
      trayWindowId: getWindowId(getTrayWindow()),
    })
  ) {
    return;
  }
  wallpaperLog.warn(
    `[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`,
  );
  throw new Error("The renderer is not authorized to read desktop playback wallpaper state.");
}

function getWindowId(window: BrowserWindow | null) {
  return window && !window.isDestroyed() ? window.webContents.id : null;
}

function isDesktopPlaybackControllerLayout(
  value: unknown,
): value is DesktopPlaybackControllerLayout {
  return value === "compact" || value === "expanded";
}

function broadcastModel(model: DesktopPlaybackWallpaperModel) {
  sendModel(mainWindow, model);
  sendModel(getTrayWindow(), model);
  sendModel(getControllerWindow(), model);
}

function sendModel(window: BrowserWindow | null, model: DesktopPlaybackWallpaperModel) {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("desktop-playback-wallpaper:model-changed", model);
}
