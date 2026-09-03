import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { getRememberedAppCloseAction } from "@main/window/appCloseAction";

const coreSource = readFileSync(
  fileURLToPath(new URL("../electron/main/core/index.ts", import.meta.url)),
  "utf8",
);
const mainWindowSource = readFileSync(
  fileURLToPath(new URL("../electron/main/window/mainWindow.ts", import.meta.url)),
  "utf8",
);
const appCloseWindowSource = readFileSync(
  fileURLToPath(new URL("../electron/main/window/appCloseWindow.ts", import.meta.url)),
  "utf8",
);
const ipcSource = readFileSync(
  fileURLToPath(new URL("../electron/main/ipc/application.ts", import.meta.url)),
  "utf8",
);

test("main-window close confirmation does not depend on the main renderer", () => {
  expect(coreSource).not.toContain('webContents.send("app-close-confirm")');
  expect(mainWindowSource).toContain("showAppCloseWindow");
  expect(appCloseWindowSource).toContain('const APP_CLOSE_ROUTE = "/app-close"');
  expect(appCloseWindowSource).toContain("new BrowserWindow");
  expect(appCloseWindowSource).toContain("loadURL(closeUrl)");
});

test("the close confirmation window persists a remembered action through its own IPC command", () => {
  const handlerStart = ipcSource.indexOf('ipcMain.on("app-close-action"');
  const handlerEnd = ipcSource.indexOf('ipcMain.on("exit-app"', handlerStart);
  const handlerSource = ipcSource.slice(handlerStart, handlerEnd);

  expect(handlerStart).toBeGreaterThan(-1);
  expect(handlerSource).toContain("isAppCloseWindowSender(event.sender.id)");
  expect(handlerSource).toContain("remember");
  expect(handlerSource).toContain("saveDesktopHostConfig");
});

test("only maps an explicitly remembered close choice to the persisted config values", () => {
  expect(getRememberedAppCloseAction("minimize", true)).toBe(0);
  expect(getRememberedAppCloseAction("exit", true)).toBe(1);
  expect(getRememberedAppCloseAction("cancel", true)).toBeNull();
  expect(getRememberedAppCloseAction("exit", false)).toBeNull();
});
