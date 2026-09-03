import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const coreSource = readFileSync(
  fileURLToPath(new URL("../electron/main/core/index.ts", import.meta.url)),
  "utf8",
);
const capabilityHostSource = readFileSync(
  fileURLToPath(new URL("../electron/main/core/capabilityHost.ts", import.meta.url)),
  "utf8",
);
const mainWindowSource = readFileSync(
  fileURLToPath(new URL("../electron/main/window/mainWindow.ts", import.meta.url)),
  "utf8",
);
const desktopLyricSource = readFileSync(
  fileURLToPath(new URL("../electron/main/window/desktopLyric.ts", import.meta.url)),
  "utf8",
);
const traySource = readFileSync(
  fileURLToPath(new URL("../electron/main/window/tray.ts", import.meta.url)),
  "utf8",
);

test("does not create the desktop lyric renderer during application startup", () => {
  const initializeStart = desktopLyricSource.indexOf(
    "export function initializeDesktopLyricCompanion",
  );
  const getWindowStart = desktopLyricSource.indexOf(
    "export function getDesktopLyricWindow",
    initializeStart,
  );

  expect(capabilityHostSource).toContain("initializeDesktopLyricCompanion(window");
  expect(initializeStart).toBeGreaterThan(-1);
  expect(getWindowStart).toBeGreaterThan(initializeStart);
  expect(desktopLyricSource.slice(initializeStart, getWindowStart)).not.toContain(
    "new BrowserWindow",
  );
});

test("destroys and releases the desktop lyric renderer when lyrics are disabled", () => {
  expect(desktopLyricSource).toContain("desktopLyricWindow.destroy()");
  expect(desktopLyricSource).toContain("desktopLyricWindow = null");
});

test("does not pre-create optional companion renderers at startup", () => {
  expect(coreSource).not.toContain("controllerWindow?.prepare()");

  const initTrayStart = traySource.indexOf("function initTray");
  const rightClickStart = traySource.indexOf('tray.on("right-click"', initTrayStart);
  expect(initTrayStart).toBeGreaterThan(-1);
  expect(rightClickStart).toBeGreaterThan(initTrayStart);
  expect(traySource.slice(initTrayStart, rightClickStart)).not.toContain("createTrayWindow()");
});

test("releases the tray renderer after its popup loses focus", () => {
  const blurStart = traySource.indexOf('window.on("blur"');
  const closedStart = traySource.indexOf('window.on("closed"', blurStart);
  expect(blurStart).toBeGreaterThan(-1);
  expect(closedStart).toBeGreaterThan(blurStart);
  expect(traySource.slice(blurStart, closedStart)).toContain("destroy()");
});

test("reports main-window visibility so hidden lyric surfaces can suspend", () => {
  expect(mainWindowSource).toContain('window.on("hide", publishVisibility)');
  expect(mainWindowSource).toContain('window.on("minimize", publishVisibility)');
  expect(mainWindowSource).toContain('"window-visibility-changed"');
});
