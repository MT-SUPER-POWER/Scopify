import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DESKTOP_BRIDGE_PROTOCOL_VERSION } from "@scopify/desktop-contract";

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
    {
      bridgeProtocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
      buildTarget: "desktop",
      rendererVersion: webPackage.version,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Synced Desktop renderer artifact: ${sourceDir} -> ${targetDir}`);
