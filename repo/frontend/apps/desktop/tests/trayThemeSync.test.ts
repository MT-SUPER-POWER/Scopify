import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const traySource = readFileSync(
  fileURLToPath(new URL("../main/module/tray.ts", import.meta.url)),
  "utf8",
);

test("tray uses the configured renderer origin for shared next-themes storage", () => {
  expect(traySource).not.toContain("http://localhost:");
  expect(traySource).toContain("desktopConfig.frontend.host");
  expect(traySource).toContain("desktopConfig.frontend.devPort");
});
