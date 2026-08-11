import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packagedAppRoot = resolve(scriptDir, "../../../../build/desktop/app");
const runtimeBundles = [
  resolve(packagedAppRoot, "out/main/main.js"),
  resolve(packagedAppRoot, "out/main/preload.js"),
];
const forbiddenWorkspaceImports = ["@scopify/desktop-contract"];

const violations = runtimeBundles.flatMap((bundlePath) => {
  const source = readFileSync(bundlePath, "utf8");
  return forbiddenWorkspaceImports
    .filter((specifier) => source.includes(`from \"${specifier}\"`))
    .map((specifier) => `${bundlePath} externalizes ${specifier}`);
});

if (violations.length > 0) {
  console.error(
    "Electron runtime bundle contains workspace imports that are unavailable at runtime:",
  );
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Electron runtime bundles contain no forbidden workspace imports.");
