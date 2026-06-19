import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getElectronPlatformPath, isElectronInstalled } from "@/lib/electron-install";

const tempDirs: string[] = [];

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "scopify-electron-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

test("getElectronPlatformPath returns the Windows executable path", () => {
  expect(getElectronPlatformPath("win32")).toBe("electron.exe");
});

test("isElectronInstalled returns true when version, path, and binary match", () => {
  const electronDir = createTempDir();
  mkdirSync(join(electronDir, "dist"), { recursive: true });
  writeFileSync(join(electronDir, "dist", "version"), "42.4.1");
  writeFileSync(join(electronDir, "path.txt"), "electron.exe");
  writeFileSync(join(electronDir, "dist", "electron.exe"), "");

  expect(isElectronInstalled(electronDir, "42.4.1", "win32")).toBe(true);
});

test("isElectronInstalled returns false when the Electron binary is missing", () => {
  const electronDir = createTempDir();
  mkdirSync(join(electronDir, "dist"), { recursive: true });
  writeFileSync(join(electronDir, "dist", "version"), "42.4.1");
  writeFileSync(join(electronDir, "path.txt"), "electron.exe");

  expect(isElectronInstalled(electronDir, "42.4.1", "win32")).toBe(false);
});
