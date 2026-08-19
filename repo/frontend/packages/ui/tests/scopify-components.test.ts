import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const packageRoot = resolve(import.meta.dir, "..");
const sourceRoots = ["components", "hooks", "types"].map((directory) =>
  resolve(packageRoot, `scopify/${directory}`),
);

describe("Scopify component boundary", () => {
  test("components do not depend on Web application aliases", async () => {
    const sourceFiles = (
      await Promise.all(
        sourceRoots.map(async (sourceRoot) =>
          (await readdir(sourceRoot))
            .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
            .map((file) => resolve(sourceRoot, file)),
        ),
      )
    ).flat();

    for (const sourceFile of sourceFiles) {
      const source = await Bun.file(sourceFile).text();

      expect(source).not.toContain('from "@/');
      expect(source).not.toContain("repo/frontend/apps/web");
      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source).not.toMatch(
        /\b(?:bg|text|border|ring|fill|stroke)-(?:black|white|zinc|gray|neutral|red|blue|green|yellow|orange|purple|pink)(?:-\d{1,3})?\b/,
      );
      expect(source).not.toContain("rgba(");
    }
  });

  test("package exports the Scopify component namespace", async () => {
    const packageManifest = await Bun.file(resolve(packageRoot, "package.json")).json();

    expect(packageManifest.exports["./scopify/components/*"]).toBe("./scopify/components/*.tsx");
    expect(packageManifest.exports["./scopify/hooks/*"]).toBe("./scopify/hooks/*.ts");
    expect(packageManifest.exports["./scopify/types/*"]).toBe("./scopify/types/*.ts");
  });
});
