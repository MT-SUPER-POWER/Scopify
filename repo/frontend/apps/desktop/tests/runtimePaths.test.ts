import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { resolveElectronOutputDirectory } from "../lib/runtimePaths";

describe("Electron runtime output directory", () => {
  const desktopRoot = resolve("D:/workspace/Scopify/repo/frontend/apps/desktop");

  test("uses the package main directory while serving", () => {
    expect(resolveElectronOutputDirectory(desktopRoot, "serve")).toBe(
      resolve(desktopRoot, "out/main"),
    );
  });

  test("keeps packaged builds in the shared build directory", () => {
    expect(resolveElectronOutputDirectory(desktopRoot, "build")).toBe(
      resolve(desktopRoot, "../../../../build/desktop/app/out/main"),
    );
  });
});
