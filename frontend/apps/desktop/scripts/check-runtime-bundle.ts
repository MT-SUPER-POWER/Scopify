import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtimeBundles = [resolve("out/main/main.js"), resolve("out/main/preload.js")];
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
