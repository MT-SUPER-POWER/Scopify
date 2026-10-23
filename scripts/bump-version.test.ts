import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { TARGET_PACKAGES } from "./bump-version";

describe("bump-version script", () => {
  it("all target package.json files should exist", () => {
    for (const relPath of TARGET_PACKAGES) {
      expect(existsSync(path.resolve(process.cwd(), relPath))).toBe(true);
    }
  });
});
