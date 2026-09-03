import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

import { logger } from "../../constants.js";
import { trayWindow } from "../../window/tray.js";
import { getWindowsDesktopIconVisibility, setWindowsDesktopIconVisibility } from "./windows.js";

let ipcRegistered = false;
let mainWindow: BrowserWindow | null = null;
let getControllerWindow: () => BrowserWindow | null = () => null;

export interface DesktopIconVisibilityCapabilityOptions {
  getControllerWindow?: () => BrowserWindow | null;
}

export function initializeDesktopIconVisibilityCapability(
  window: BrowserWindow,
  options: DesktopIconVisibilityCapabilityOptions = {},
) {
  mainWindow = window;
  getControllerWindow = options.getControllerWindow ?? (() => null);
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle("desktop-icons:get-visibility", async (event) => {
    assertAuthorized(event);
    const state = await getWindowsDesktopIconVisibility();
    if (state.diagnostic) {
      logger.warn("[desktop-icons] visibility query did not fully succeed", state);
    }
    return state;
  });

  ipcMain.handle("desktop-icons:set-visibility", async (event, visible: unknown) => {
    assertAuthorized(event);
    if (typeof visible !== "boolean") {
      throw new TypeError("Desktop icon visibility must be a boolean.");
    }

    const state = await setWindowsDesktopIconVisibility(visible);
    if (state.diagnostic) {
      logger.warn("[desktop-icons] visibility update did not fully succeed", {
        requestedVisible: visible,
        ...state,
      });
    }
    return state;
  });
}

function assertAuthorized(event: IpcMainInvokeEvent) {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (
    senderWindow &&
    [mainWindow, trayWindow, getControllerWindow()].some((allowed) => allowed === senderWindow)
  ) {
    return;
  }

  logger.warn("[desktop-icons] rejected unauthorized renderer", {
    senderId: event.sender.id,
  });
  throw new Error("Renderer is not authorized to control desktop icons.");
}
