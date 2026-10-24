import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { checkPackageQuality } from "./check-package-quality";

const temporaryRoot = resolve(import.meta.dir, "../.tmp");
const fixtures: string[] = [];

function createPackage(scripts: Record<string, string>, withTests = false) {
  mkdirSync(temporaryRoot, { recursive: true });
  const root = mkdtempSync(resolve(temporaryRoot, "package-quality-"));
  fixtures.push(root);
  const packageRoot = resolve(root, "example");
  mkdirSync(packageRoot);
  writeFileSync(resolve(packageRoot, "package.json"), JSON.stringify({ name: "example", scripts }));
  writeFileSync(resolve(packageRoot, "tsconfig.json"), "{}");
  if (withTests) writeFileSync(resolve(packageRoot, "example.test.ts"), "");
  return root;
}

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    if (!fixture.startsWith(`${temporaryRoot}${sep}`)) throw new Error("Unexpected fixture path");
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("requires lint and typecheck instead of silently skipping a package", () => {
  expect(checkPackageQuality(createPackage({}))).toEqual([
    "example: missing lint script",
    "example: missing typecheck script",
  ]);
});

test("requires a test script when test files exist", () => {
  const root = createPackage({ lint: "eslint .", typecheck: "tsc --noEmit" }, true);
  expect(checkPackageQuality(root)).toEqual(["example: missing test script"]);
});

test("accepts a package without tests without inventing an empty test command", () => {
  const root = createPackage({ lint: "eslint .", typecheck: "tsc --noEmit" });
  expect(checkPackageQuality(root)).toEqual([]);
});

test("requires a TypeScript project for the typecheck entry", () => {
  const root = createPackage({ lint: "eslint .", typecheck: "tsc --noEmit" });
  rmSync(resolve(root, "example/tsconfig.json"));
  expect(checkPackageQuality(root)).toEqual(["example: missing tsconfig.json"]);
});

test("accepts a package with its existing tests connected", () => {
  const root = createPackage(
    { lint: "eslint .", typecheck: "tsc --noEmit", test: "bun test" },
    true,
  );
  expect(checkPackageQuality(root)).toEqual([]);
});
