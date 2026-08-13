import {
  lstatSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const packagedAppRoot = resolve(desktopRoot, "../../../../build/desktop/app");
const sourceNodeModules = resolve(desktopRoot, "node_modules");
const packagedNodeModules = resolve(packagedAppRoot, "node_modules");

mkdirSync(packagedAppRoot, { recursive: true });
const desktopPackage = JSON.parse(
  readFileSync(resolve(desktopRoot, "package.json"), "utf8"),
) as Record<string, unknown>;
const packagedAppPackage = { ...desktopPackage };
delete packagedAppPackage.build;
const dependencies = packagedAppPackage.dependencies;
if (dependencies && typeof dependencies === "object" && !Array.isArray(dependencies)) {
  const runtimeDependencies = { ...(dependencies as Record<string, unknown>) };
  delete runtimeDependencies["@mt-super-power/desktop-contract"];
  packagedAppPackage.dependencies = runtimeDependencies;
}
writeFileSync(
  resolve(packagedAppRoot, "package.json"),
  `${JSON.stringify(packagedAppPackage, null, 2)}\n`,
  "utf8",
);

const existingNodeModules = lstatSync(packagedNodeModules, { throwIfNoEntry: false });
if (existingNodeModules) {
  if (!existingNodeModules.isSymbolicLink()) {
    throw new Error(
      `Refusing to replace a non-link node_modules directory: ${packagedNodeModules}`,
    );
  }
  unlinkSync(packagedNodeModules);
}
symlinkSync(sourceNodeModules, packagedNodeModules, "junction");

console.log(`Prepared Desktop package app directory: ${packagedAppRoot}`);
