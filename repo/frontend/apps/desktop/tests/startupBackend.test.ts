import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(resolve(import.meta.dir, "../main/main.ts"), "utf8");

test("starts the managed backend without delaying the main window", () => {
  const createWindowIndex = mainSource.indexOf("async function createWindow()");
  const createWindowSource = mainSource.slice(createWindowIndex);
  const reconcileMatch = createWindowSource.match(/void backendController\s*\.reconcile/);
  const reconcileIndex = reconcileMatch?.index ?? -1;
  const mainWindowIndex = mainSource.indexOf("createMainWindow();", createWindowIndex);

  expect(createWindowIndex).toBeGreaterThan(-1);
  expect(reconcileIndex).toBeGreaterThan(-1);
  expect(mainWindowIndex - createWindowIndex).toBeGreaterThan(reconcileIndex);
  expect(mainSource.slice(createWindowIndex, mainWindowIndex)).not.toMatch(
    /await\s+backendController\s*\.reconcile/,
  );
});

test("does not block or quit when the startup backend is unavailable", () => {
  const createWindowIndex = mainSource.indexOf("async function createWindow()");
  const createWindowEnd = mainSource.indexOf("const discordPresenceController", createWindowIndex);
  const createWindowSource = mainSource.slice(createWindowIndex, createWindowEnd);

  expect(createWindowIndex).toBeGreaterThan(-1);
  expect(createWindowEnd).toBeGreaterThan(createWindowIndex);
  expect(createWindowSource).not.toContain("dialog.showMessageBox");
  expect(createWindowSource).not.toContain("app.quit()");
  expect(createWindowSource).not.toContain("while (true)");
});
