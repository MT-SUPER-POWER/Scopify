import { join } from "node:path";

import {
  app,
  type BrowserWindow,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
} from "electron";
import type {
  DesktopLyricSnapshot,
  DesktopPlaybackControllerLayout,
  DesktopPlaybackWallpaperAudioFrame,
  DesktopPlaybackWallpaperModel,
  DesktopPlaybackWallpaperPreferences,
} from "@scopify/desktop-contract";

import { parseDesktopPlaybackWallpaperPreferencesUpdate } from "../../../types/desktopPlaybackWallpaper.js";
import { logger } from "../../constants.js";
import { trayWindow } from "../tray.js";
import {
  isDesktopPlaybackWallpaperControlSender,
  isDesktopPlaybackWallpaperModelReader,
  isDesktopPlaybackWallpaperPublisherSender,
} from "./authorization.js";
import {
  createDesktopPlaybackWallpaperCapability,
  type DesktopPlaybackControllerLauncher,
  type DesktopPlaybackWallpaperCapability,
  type DesktopPlaybackWallpaperDriver,
} from "./capability.js";
import {
  isDesktopPlaybackWallpaperAudioFrame,
  isDesktopPlaybackWallpaperPresentationInput,
} from "./ipcValidation.js";
import { createDesktopPlaybackWallpaperPreferencesRepository } from "./preferences.js";

const PREFERENCES_FILE = "desktop-playback-wallpaper.json";

let capability: DesktopPlaybackWallpaperCapability | null = null;
let controllerHost: DesktopPlaybackControllerHost | null = null;
let mainWindow: BrowserWindow | null = null;
let ipcRegistered = false;
let quitCleanupRegistered = false;
let getControllerWindow: () => BrowserWindow | null = () => null;
let getWallpaperWindow: () => BrowserWindow | null = () => null;
let presentation: DesktopLyricSnapshot | null = null;

interface DesktopPlaybackControllerHost extends DesktopPlaybackControllerLauncher {
  setLayout(layout: DesktopPlaybackControllerLayout): boolean;
}

export interface DesktopPlaybackWallpaperCapabilityHostOptions {
  controller?: DesktopPlaybackControllerHost;
  driver?: DesktopPlaybackWallpaperDriver;
  getControllerWindow?: () => BrowserWindow | null;
  getWallpaperWindow?: () => BrowserWindow | null;
  preferencesFilePath?: string;
}

export function initializeDesktopPlaybackWallpaperCapability(
  nextMainWindow: BrowserWindow,
  options: DesktopPlaybackWallpaperCapabilityHostOptions = {},
) {
  mainWindow = nextMainWindow;
  controllerHost = options.controller ?? controllerHost;
  getControllerWindow = options.getControllerWindow ?? getControllerWindow;
  getWallpaperWindow = options.getWallpaperWindow ?? getWallpaperWindow;

  if (!capability) {
    const preferences = createDesktopPlaybackWallpaperPreferencesRepository({
      filePath: options.preferencesFilePath ?? join(app.getPath("userData"), PREFERENCES_FILE),
      onError: (message, error) => logger.error(`[desktop-playback-wallpaper] ${message}`, error),
    });
    capability = createDesktopPlaybackWallpaperCapability({
      controller: options.controller,
      driver: options.driver ?? createFoundationDriver(process.platform),
      onError: (message, error) => logger.error(`[desktop-playback-wallpaper] ${message}`, error),
      preferences,
    });
    capability.subscribe(broadcastModel);
    void capability.initialize();
  }

  registerIpcHandlers();

  if (!quitCleanupRegistered) {
    quitCleanupRegistered = true;
    app.once("will-quit", () => {
      void capability?.dispose();
      capability = null;
      controllerHost = null;
    });
  }

  return capability;
}

function createFoundationDriver(platform: NodeJS.Platform): DesktopPlaybackWallpaperDriver {
  // The capability ships before the real renderer driver on purpose: launchers can depend on a
  // stable model now, while an enabled intent can never be misreported as running.
  return {
    async reconcile(preferences: DesktopPlaybackWallpaperPreferences) {
      if (!preferences.enabled || (!preferences.layers.background && !preferences.layers.lyrics)) {
        return null;
      }

      if (platform !== "win32") {
        return {
          diagnostic: "Desktop playback wallpaper requires Windows.",
          state: "unsupported",
        };
      }

      return {
        diagnostic:
          "The desktop playback wallpaper capability is ready, but its renderer driver is not connected yet.",
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
    return requireCapability().getModel();
  });

  ipcMain.handle("desktop-playback-wallpaper:get-presentation", (event) => {
    requireModelReader(event, "desktop-playback-wallpaper:get-presentation");
    return presentation;
  });

  ipcMain.handle("desktop-playback-wallpaper:configure", async (event, input: unknown) => {
    requireControlSender(event, "desktop-playback-wallpaper:configure");
    const update = parseDesktopPlaybackWallpaperPreferencesUpdate(input);
    return requireCapability().configure(update);
  });

  ipcMain.handle("desktop-playback-wallpaper:retry", (event) => {
    requireControlSender(event, "desktop-playback-wallpaper:retry");
    return requireCapability().retry();
  });

  ipcMain.handle("desktop-playback-controller:show", (event) => {
    requireControlSender(event, "desktop-playback-controller:show");
    return requireCapability().showController();
  });

  ipcMain.handle("desktop-playback-controller:close", (event) => {
    requireControlSender(event, "desktop-playback-controller:close");
    const controllerWindow = getControllerWindow();
    if (!controllerWindow || controllerWindow.isDestroyed()) return false;
    controllerWindow.close();
    return true;
  });

  ipcMain.handle("desktop-playback-controller:set-layout", (event, input: unknown) => {
    requireControllerSender(event, "desktop-playback-controller:set-layout");
    if (!isDesktopPlaybackControllerLayout(input)) {
      throw new TypeError("Invalid desktop playback controller layout.");
    }
    return controllerHost?.setLayout(input) ?? false;
  });

  ipcMain.handle("desktop-playback-wallpaper:publish-presentation", (event, input: unknown) => {
    requireMainWindowSender(event, "desktop-playback-wallpaper:publish-presentation");
    if (!isDesktopPlaybackWallpaperPresentationInput(input)) {
      throw new Error("Invalid desktop playback wallpaper presentation.");
    }
    presentation = { ...input, updatedAt: Date.now() };
    sendPresentation(getWallpaperWindow(), presentation);
    return presentation;
  });

  ipcMain.on("desktop-playback-wallpaper:audio-frame", (event, input: unknown) => {
    if (!isMainWindowSender(event)) {
      logRejectedSender("desktop-playback-wallpaper:audio-frame");
      return;
    }
    if (!isDesktopPlaybackWallpaperAudioFrame(input)) return;
    sendAudioFrame(getWallpaperWindow(), input);
  });
}

function requireCapability() {
  if (!capability) {
    throw new Error("Desktop playback wallpaper capability has not been initialized.");
  }
  return capability;
}

function isControlSender(senderId: number) {
  return isDesktopPlaybackWallpaperControlSender(senderId, {
    controllerWindowId: getWindowId(getControllerWindow()),
    mainWindowId: getWindowId(mainWindow),
    trayWindowId: getWindowId(trayWindow),
  });
}

function requireControlSender(event: IpcMainInvokeEvent, channel: string) {
  if (isControlSender(event.sender.id)) return;
  logger.warn(`[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`);
  throw new Error("The renderer is not authorized to control desktop playback wallpaper.");
}

function requireControllerSender(event: IpcMainInvokeEvent, channel: string) {
  if (event.sender.id === getWindowId(getControllerWindow())) return;
  logger.warn(`[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`);
  throw new Error("Only the desktop playback controller may perform this action.");
}

function requireModelReader(event: IpcMainInvokeEvent, channel: string) {
  if (
    isDesktopPlaybackWallpaperModelReader(event.sender.id, {
      controllerWindowId: getWindowId(getControllerWindow()),
      mainWindowId: getWindowId(mainWindow),
      trayWindowId: getWindowId(trayWindow),
      wallpaperWindowId: getWindowId(getWallpaperWindow()),
    })
  ) {
    return;
  }
  logger.warn(`[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`);
  throw new Error("The renderer is not authorized to read desktop playback wallpaper state.");
}

function requireMainWindowSender(event: IpcMainEvent | IpcMainInvokeEvent, channel: string) {
  if (isMainWindowSender(event)) return;
  logRejectedSender(channel);
  throw new Error("Only the main renderer may publish desktop playback state.");
}

function isMainWindowSender(event: IpcMainEvent | IpcMainInvokeEvent) {
  return isDesktopPlaybackWallpaperPublisherSender(event.sender.id, getWindowId(mainWindow));
}

function logRejectedSender(channel: string) {
  logger.warn(`[desktop-playback-wallpaper] rejected IPC from an unexpected renderer: ${channel}`);
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
  sendModel(trayWindow, model);
  sendModel(getControllerWindow(), model);
  sendModel(getWallpaperWindow(), model);
}

function sendModel(window: BrowserWindow | null, model: DesktopPlaybackWallpaperModel) {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("desktop-playback-wallpaper:model-changed", model);
}

function sendPresentation(window: BrowserWindow | null, snapshot: DesktopLyricSnapshot) {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("desktop-playback-wallpaper:presentation-changed", snapshot);
}

function sendAudioFrame(window: BrowserWindow | null, frame: DesktopPlaybackWallpaperAudioFrame) {
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) return;
  window.webContents.send("desktop-playback-wallpaper:audio-frame", frame);
}
