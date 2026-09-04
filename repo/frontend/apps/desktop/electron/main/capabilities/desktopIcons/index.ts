import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

import { desktopIconsLog } from "@main/utils/logger";
import { trayWindow } from "@main/window/tray";
import { getWindowsDesktopIconVisibility, setWindowsDesktopIconVisibility } from "./windows";

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
      desktopIconsLog.warn("[desktop-icons] visibility query did not fully succeed", state);
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
      desktopIconsLog.warn("[desktop-icons] visibility update did not fully succeed", {
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

  desktopIconsLog.warn("[desktop-icons] rejected unauthorized renderer", {
    senderId: event.sender.id,
  });
  throw new Error("Renderer is not authorized to control desktop icons.");
}
