import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const mainSource = readFileSync(fileURLToPath(new URL("../main/main.ts", import.meta.url)), "utf8");
const appCloseWindowSource = readFileSync(
  fileURLToPath(new URL("../main/module/appCloseWindow.ts", import.meta.url)),
  "utf8",
);

test("main-window close confirmation does not depend on the main renderer", () => {
  expect(mainSource).not.toContain('webContents.send("app-close-confirm")');
  expect(mainSource).toContain("showAppCloseWindow");
  expect(appCloseWindowSource).toContain('const APP_CLOSE_ROUTE = "/app-close"');
  expect(appCloseWindowSource).toContain("new BrowserWindow");
  expect(appCloseWindowSource).toContain("loadURL(closeUrl)");
});
