import { BrowserWindow } from "electron";

import { __iconWindow, __splashHtmlPath } from "@main/constants";
import { windowLog } from "@main/utils/logger";

const MINIMUM_VISIBLE_MS = 900;
const READY_TIMEOUT_MS = 1_500;

/** Owns the splash window and the timing contract that prevents a one-frame flash. */
export function createSplashWindowController() {
  let window: BrowserWindow | null = null;
  let shownAtMs = 0;
  let released = false;
  let resolveReady: (() => void) | null = null;
  let ready = Promise.resolve();

  function destroy() {
    if (window && !window.isDestroyed()) window.destroy();
    window = null;
  }

  function begin() {
    released = false;
    shownAtMs = 0;
    ready = new Promise((resolve) => {
      resolveReady = resolve;
    });

    window = new BrowserWindow({
      alwaysOnTop: true,
      frame: false,
      height: 700,
      icon: __iconWindow,
      movable: false,
      resizable: false,
      show: false,
      skipTaskbar: true,
      transparent: true,
      width: 700,
    });
    const activeWindow = window;
    const settleReady = () => {
      resolveReady?.();
      resolveReady = null;
    };

    activeWindow.once("ready-to-show", () => {
      if (activeWindow.isDestroyed() || window !== activeWindow) return;
      shownAtMs = Date.now();
      activeWindow.show();
      activeWindow.center();
      activeWindow.focus();
      settleReady();
    });
    activeWindow.webContents.once("did-fail-load", (_event, code, description) => {
      windowLog.error("[splash] failed to load", { code, description });
      settleReady();
    });
    void activeWindow.loadFile(__splashHtmlPath).catch((error) => {
      windowLog.error("[splash] failed to load", error);
      settleReady();
    });
  }

  async function reveal(mainWindow: BrowserWindow) {
    if (released || mainWindow.isDestroyed()) return false;
    await Promise.race([
      ready,
      new Promise<void>((resolve) => setTimeout(resolve, READY_TIMEOUT_MS)),
    ]);
    const remainingMs = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - shownAtMs));
    if (remainingMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
    if (released || mainWindow.isDestroyed()) return false;

    released = true;
    destroy();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(false);
    return true;
  }

  return {
    begin,
    dismiss() {
      released = true;
      destroy();
    },
    reveal,
  };
}
