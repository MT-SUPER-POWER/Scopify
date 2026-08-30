import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(import.meta.dir, "../components/commandWorkspace/CommandWorkspaceSettings.tsx"),
  "utf8",
);

test("exposes both Folia setting surfaces through their existing shortcut commands", () => {
  expect(source).toContain('executeShortcut("open-folia-settings")');
  expect(source).toContain('executeShortcut("open-folia-theme-library")');
  expect(source).toContain("Folia 视觉设置");
  expect(source).toContain("Folia 主题库");
});

test("shows desktop playback settings only in the desktop runtime", () => {
  expect(source).toContain("setIsDesktop(runtime.isDesktop)");
  expect(source).toContain("if (isDesktop)");
});

test("unifies settings item layout with the inset rounded command list rhythm", () => {
  expect(source).toContain("flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left");
  expect(source).toContain("size-7 shrink-0 items-center justify-center rounded-md bg-white/8");
});
