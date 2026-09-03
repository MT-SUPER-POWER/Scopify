import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const splashSource = readFileSync(
  resolve(import.meta.dir, "../electron/main/window/splash.ts"),
  "utf8",
);

test("keeps the splash visible until it has rendered and the renderer is ready", () => {
  expect(splashSource).toContain('activeWindow.once("ready-to-show"');
  expect(splashSource).toContain("MINIMUM_VISIBLE_MS");
  expect(splashSource).toContain("await Promise.race");
  expect(splashSource).toContain("show: false");
});
