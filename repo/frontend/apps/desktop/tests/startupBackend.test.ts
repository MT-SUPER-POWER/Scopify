import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const coreSource = readFileSync(resolve(import.meta.dir, "../main/core/index.ts"), "utf8");

test("starts the managed backend without delaying the main window", () => {
  const createWindowIndex = coreSource.indexOf("async function createWindow()");
  const createWindowSource = coreSource.slice(createWindowIndex);
  const reconcileMatch = createWindowSource.match(/void backendController\s*\.reconcile/);
  const reconcileIndex = reconcileMatch?.index ?? -1;
  const mainWindowIndex = coreSource.indexOf("createMainWindow();", createWindowIndex);

  expect(createWindowIndex).toBeGreaterThan(-1);
  expect(reconcileIndex).toBeGreaterThan(-1);
  expect(mainWindowIndex - createWindowIndex).toBeGreaterThan(reconcileIndex);
  expect(coreSource.slice(createWindowIndex, mainWindowIndex)).not.toMatch(
    /await\s+backendController\s*\.reconcile/,
  );
});

test("does not block or quit when the startup backend is unavailable", () => {
  const createWindowIndex = coreSource.indexOf("async function createWindow()");
  const createWindowEnd = coreSource.indexOf("const discordPresenceController", createWindowIndex);
  const createWindowSource = coreSource.slice(createWindowIndex, createWindowEnd);

  expect(createWindowIndex).toBeGreaterThan(-1);
  expect(createWindowEnd).toBeGreaterThan(createWindowIndex);
  expect(createWindowSource).not.toContain("dialog.showMessageBox");
  expect(createWindowSource).not.toContain("app.quit()");
  expect(createWindowSource).not.toContain("while (true)");
});
