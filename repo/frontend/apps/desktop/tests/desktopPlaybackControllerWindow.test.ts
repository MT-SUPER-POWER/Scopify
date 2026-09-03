import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const controllerWindowSource = readFileSync(
  fileURLToPath(
    new URL("../main/capabilities/desktopPlaybackWallpaper/controllerWindow.ts", import.meta.url),
  ),
  "utf8",
);

test("desktop playback controller uses the tray's shadow-free transparent-window setup", () => {
  expect(controllerWindowSource).toContain('backgroundColor: "#00000000"');
  expect(controllerWindowSource).toContain("frame: false");
  expect(controllerWindowSource).toContain("transparent: true");
  expect(controllerWindowSource).not.toContain("backgroundMaterial");
  expect(controllerWindowSource).toContain("hasShadow: false");
  expect(controllerWindowSource).not.toContain("roundedCorners");
  expect(controllerWindowSource).not.toContain("thickFrame");
});
