import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePackagedAppDirectory } from "../lib/runtimePaths";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const packagedAppRoot = resolvePackagedAppDirectory(desktopRoot);

mkdirSync(packagedAppRoot, { recursive: true });

// 1. 生成精简的生产运行时 package.json（剔除 monorepo 开发/构建依赖）
const desktopPackage = JSON.parse(
  readFileSync(resolve(desktopRoot, "package.json"), "utf8"),
) as Record<string, unknown>;

const packagedAppPackage: Record<string, unknown> = {
  ...desktopPackage,
  name: "scopify",
  productName: "Scopify",
};
delete packagedAppPackage.dependencies;
delete packagedAppPackage.devDependencies;
delete packagedAppPackage.scripts;

writeFileSync(
  resolve(packagedAppRoot, "package.json"),
  `${JSON.stringify(packagedAppPackage, null, 2)}\n`,
  "utf8",
);

// 2. 同步 public 静态资源供 asar 打包与解包
const publicSource = resolve(desktopRoot, "public");
const publicDestination = resolve(packagedAppRoot, "public");
rmSync(publicDestination, { force: true, recursive: true });
cpSync(publicSource, publicDestination, { recursive: true });

console.log(`Prepared Desktop package app directory: ${packagedAppRoot}`);
