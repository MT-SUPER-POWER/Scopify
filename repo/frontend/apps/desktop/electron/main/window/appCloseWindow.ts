import { BrowserWindow } from "electron";

import { __iconWindow, __preloadScript, logger } from "@main/constants";

const APP_CLOSE_ROUTE = "/app-close";

let appCloseWindow: BrowserWindow | null = null;

function getAppCloseWindow() {
  return appCloseWindow && !appCloseWindow.isDestroyed() ? appCloseWindow : null;
}

export function isAppCloseWindowSender(senderId: number) {
  return getAppCloseWindow()?.webContents.id === senderId;
}

export function showAppCloseWindow(parent: BrowserWindow, rendererBaseUrl: string) {
  const existingWindow = getAppCloseWindow();
  if (existingWindow) {
    existingWindow.show();
    existingWindow.focus();
    return;
  }

  const window = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    hasShadow: false,
    height: 440,
    icon: __iconWindow,
    maximizable: false,
    minimizable: false,
    modal: true,
    parent,
    resizable: false,
    show: false,
    skipTaskbar: true,
    title: "Close Scopify",
    width: 480,
    transparent: true,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: __preloadScript,
      sandbox: true,
    },
  });

  appCloseWindow = window;
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("did-fail-load", (_event, code, description, validatedURL) => {
    logger.error("[app-close] failed to load", { code, description, validatedURL });
  });
  window.on("closed", () => {
    if (appCloseWindow === window) appCloseWindow = null;
  });

  const closeUrl = new URL(APP_CLOSE_ROUTE, rendererBaseUrl).toString();
  void window
    .loadURL(closeUrl)
    .then(() => {
      if (window.isDestroyed() || appCloseWindow !== window) return;
      window.center();
      window.show();
      window.focus();
    })
    .catch((error) => {
      logger.error("[app-close] load failed", error);
    });
}

export function disposeAppCloseWindow() {
  const window = getAppCloseWindow();
  appCloseWindow = null;
  if (window) window.destroy();
}
