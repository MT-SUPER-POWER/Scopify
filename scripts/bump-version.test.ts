import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { calculateNextVersion, TARGET_PACKAGES } from "./bump-version";

describe("bump-version script", () => {
  it("bumps the core version separately from the Beta counter", () => {
    expect(calculateNextVersion("4.0.0-beta.2", "patch")).toBe("4.0.1-beta.1");
    expect(calculateNextVersion("4.0.0-beta.2", "minor")).toBe("4.1.0-beta.1");
    expect(calculateNextVersion("4.0.0-beta.2", "major")).toBe("5.0.0-beta.1");
    expect(calculateNextVersion("4.0.0-beta.9", "beta")).toBe("4.0.0-beta.10");
    expect(calculateNextVersion("3.4.4", "patch")).toBe("3.4.5");
    expect(calculateNextVersion("3.4.4", "beta")).toBe("3.4.4-beta.1");
  });

  it("all target package.json files should exist", () => {
    for (const relPath of TARGET_PACKAGES) {
      expect(existsSync(path.resolve(process.cwd(), relPath))).toBe(true);
    }
  });
});
