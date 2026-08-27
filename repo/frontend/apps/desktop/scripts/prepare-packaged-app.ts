import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const packagedAppRoot = resolve(desktopRoot, "build/desktop/app");
const packagedNodeModules = resolve(packagedAppRoot, "node_modules");

function copyRuntimeDirectory(name: "config" | "resources") {
  const source = resolve(desktopRoot, name);
  const destination = resolve(packagedAppRoot, name);
  rmSync(destination, { force: true, recursive: true });
  cpSync(source, destination, { recursive: true });
}

mkdirSync(packagedAppRoot, { recursive: true });
const desktopPackage = JSON.parse(
  readFileSync(resolve(desktopRoot, "package.json"), "utf8"),
) as Record<string, unknown>;

const packagedAppPackage = { ...desktopPackage };
delete packagedAppPackage.build;
delete packagedAppPackage.dependencies;
delete packagedAppPackage.devDependencies;
delete packagedAppPackage.scripts;

writeFileSync(
  resolve(packagedAppRoot, "package.json"),
  `${JSON.stringify(packagedAppPackage, null, 2)}\n`,
  "utf8",
);

copyRuntimeDirectory("config");
copyRuntimeDirectory("resources");

// Clean up any legacy node_modules link/folder in packagedAppRoot
rmSync(packagedNodeModules, { force: true, recursive: true });

console.log(`Prepared Desktop package app directory: ${packagedAppRoot}`);
