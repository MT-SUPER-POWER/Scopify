import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readWorkspaceFile(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("uses a notification-area-sized Scopify image for the system tray", () => {
  const constantsSource = readWorkspaceFile("../main/constants.ts");
  const icon = readFileSync(
    fileURLToPath(new URL("../resources/icon.iconset/icon_32x32.png", import.meta.url)),
  );

  expect(icon.subarray(1, 4).toString()).toBe("PNG");
  expect(icon.readUInt32BE(16)).toBe(32);
  expect(icon.readUInt32BE(20)).toBe(32);
  expect(constantsSource).toContain('join(__iconsetDir, "icon_32x32.png")');
  expect(constantsSource).toContain("export const __iconTray = _nativeTray");
});

test("copies runtime resources into the directly runnable host build", () => {
  const prepareSource = readWorkspaceFile("../scripts/prepare-packaged-app.ts");

  expect(prepareSource).toContain("cpSync");
  expect(prepareSource).toContain('copyRuntimeDirectory("resources")');
  expect(prepareSource).toContain("resolve(desktopRoot, name)");
  expect(prepareSource).toContain("resolve(packagedAppRoot, name)");
});
