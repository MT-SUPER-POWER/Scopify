import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyRendererArtifact } from "../lib/rendererArtifact";
import { verifySandboxedPreloadBundleSource } from "../lib/runtimeBundle";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packagedAppRoot = resolve(scriptDir, "../build/desktop/app");
const runtimeBundles = [
  resolve(packagedAppRoot, "out/main/main.js"),
  resolve(packagedAppRoot, "out/main/preload.js"),
];
const sandboxedPreloadBundles = runtimeBundles.slice(1);
const rendererRoot = resolve(packagedAppRoot, "renderer");
const forbiddenWorkspaceImports = ["@scopify/desktop-contract"];

const missingRuntimeBundles = runtimeBundles.filter(
  (bundlePath) => !existsSync(bundlePath) || !statSync(bundlePath).isFile(),
);

if (missingRuntimeBundles.length > 0) {
  console.error("Electron runtime bundle is missing required entries:");
  for (const bundlePath of missingRuntimeBundles) console.error(`- ${bundlePath}`);
  process.exit(1);
}

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

const sandboxViolations = sandboxedPreloadBundles.flatMap((bundlePath) => {
  const verification = verifySandboxedPreloadBundleSource(readFileSync(bundlePath, "utf8"));
  return verification.ok ? [] : [`${bundlePath}: ${verification.message}`];
});

if (sandboxViolations.length > 0) {
  console.error("Electron sandbox preload bundles are not self-contained:");
  for (const violation of sandboxViolations) console.error(`- ${violation}`);
  process.exit(1);
}

const rendererVerification = verifyRendererArtifact(rendererRoot);
if (!rendererVerification.ok) {
  console.error(`Desktop renderer artifact validation failed: ${rendererVerification.message}`);
  process.exit(1);
}

console.log(
  "Electron runtime bundles and the static renderer artifact passed production validation.",
);
