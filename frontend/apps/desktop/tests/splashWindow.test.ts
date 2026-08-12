import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(resolve(import.meta.dir, "../main/main.ts"), "utf8");

test("keeps the splash visible until it has rendered and the renderer is ready", () => {
  expect(mainSource).toContain('splashWindow.once("ready-to-show"');
  expect(mainSource).toContain("SPLASH_MINIMUM_VISIBLE_MS");
  expect(mainSource).toContain("await waitForSplashVisibility()");
  expect(mainSource).toContain("show: false");
});
