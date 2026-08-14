import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "bun:test";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themeEntryPath = resolve(packageDirectory, "theme.css");

test("the aggregate theme entry only imports existing local theme layers", () => {
  const imports = [
    ...readFileSync(themeEntryPath, "utf8").matchAll(/@import\s+["'](\.[^"']+)["']/g),
  ];

  expect(imports.length).toBeGreaterThan(0);
  for (const [, importedPath] of imports) {
    expect(existsSync(resolve(dirname(themeEntryPath), importedPath))).toBe(true);
  }
});
