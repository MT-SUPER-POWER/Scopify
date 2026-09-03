import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readWorkspaceFile(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("controller and tray isolate rounded content from transparent host windows", () => {
  const controllerWindowSource = readWorkspaceFile(
    "../electron/main/capabilities/desktopPlaybackWallpaper/controllerWindow.ts",
  );
  const trayWindowSource = readWorkspaceFile("../electron/main/window/tray.ts");
  const controllerPageSource = readWorkspaceFile(
    "../../web/components/desktopWallpaper/DesktopPlaybackController.tsx",
  );
  const trayPageSource = readWorkspaceFile("../../web/app/tray/page.tsx");

  expect(controllerWindowSource).toContain("transparent: true");
  expect(controllerWindowSource).toContain("hasShadow: false");
  expect(trayWindowSource).toContain("transparent: true");
  expect(trayWindowSource).toContain("hasShadow: false");
  expect(controllerPageSource).toContain("bg-transparent p-1");
  expect(trayPageSource).toContain('className="size-full bg-transparent p-1"');
});

test("close confirmation uses its own rounded surface instead of a modal card over the main window", () => {
  const appCloseWindowSource = readWorkspaceFile("../electron/main/window/appCloseWindow.ts");
  const appClosePageSource = readWorkspaceFile("../../web/app/app-close/page.tsx");

  expect(appCloseWindowSource).toContain('backgroundColor: "#00000000"');
  expect(appCloseWindowSource).toContain("hasShadow: false");
  expect(appClosePageSource).toContain("bg-transparent p-1");
  expect(appClosePageSource).toContain("relative flex size-full");
  expect(appClosePageSource).toContain("overflow-hidden rounded-xl");
});
