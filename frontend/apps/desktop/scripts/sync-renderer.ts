import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRendererArtifactManifest } from "../lib/rendererArtifact";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const webRoot = resolve(desktopRoot, "..", "web");
const sourceDir = resolve(webRoot, "out");
const targetDir = resolve(desktopRoot, "renderer");

if (!existsSync(resolve(sourceDir, "index.html"))) {
  throw new Error(
    `Desktop renderer is missing at ${sourceDir}. Run the Web desktop build profile first.`,
  );
}

rmSync(targetDir, { force: true, recursive: true });
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

const webPackage = JSON.parse(readFileSync(resolve(webRoot, "package.json"), "utf8")) as {
  version: string;
};

writeFileSync(
  resolve(targetDir, "renderer.manifest.json"),
  `${JSON.stringify(
    createRendererArtifactManifest(targetDir, {
      rendererVersion: webPackage.version,
      sourceRevision:
        process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "local-development",
    }),
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Synced Desktop renderer artifact: ${sourceDir} -> ${targetDir}`);
