import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const coreSource = readFileSync(resolve(import.meta.dir, "../main/core/index.ts"), "utf8");

test("keeps the splash visible until it has rendered and the renderer is ready", () => {
  expect(coreSource).toContain('splashWindow.once("ready-to-show"');
  expect(coreSource).toContain("SPLASH_MINIMUM_VISIBLE_MS");
  expect(coreSource).toContain("await waitForSplashVisibility()");
  expect(coreSource).toContain("show: false");
});
