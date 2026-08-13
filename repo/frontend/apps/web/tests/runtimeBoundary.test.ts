import { describe, expect, test } from "bun:test";

const DIRECT_BRIDGE_PATTERN = /\b(?:window\.)?electronAPI\b|\bIS_ELECTRON\b|\bIS_WEB\b/;
const ALLOWED_DIRECT_BRIDGE_FILES = new Set(["lib/runtime/index.ts", "types/electron.d.ts"]);

describe("Web Runtime seam", () => {
  test("keeps preload discovery out of application callers", async () => {
    const violations: string[] = [];
    const sourceFiles = new Bun.Glob("{app,components,hooks,lib,store}/**/*.{ts,tsx}");

    for await (const path of sourceFiles.scan({ cwd: process.cwd(), onlyFiles: true })) {
      const normalizedPath = path.replaceAll("\\", "/");
      if (ALLOWED_DIRECT_BRIDGE_FILES.has(normalizedPath)) continue;
      const contents = await Bun.file(path).text();
      if (DIRECT_BRIDGE_PATTERN.test(contents)) violations.push(normalizedPath);
    }

    expect(violations).toEqual([]);
  });

  test("keeps concrete adapters private to the Runtime composition root and tests", async () => {
    const violations: string[] = [];
    const callerFiles = new Bun.Glob("{app,components,hooks,store}/**/*.{ts,tsx}");

    for await (const path of callerFiles.scan({ cwd: process.cwd(), onlyFiles: true })) {
      const contents = await Bun.file(path).text();
      if (contents.includes("@/lib/runtime/adapters/")) violations.push(path);
    }

    expect(violations).toEqual([]);
  });
});
