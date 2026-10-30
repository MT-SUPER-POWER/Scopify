import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePackagedAppDirectory } from "../../lib/runtimePaths";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..", "..");
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

// 3. 同步原生模块产物到 build/desktop/app/native
const nativeDestination = resolve(packagedAppRoot, "native");
mkdirSync(nativeDestination, { recursive: true });

const nativeModules = ["audio-engine", "taskbar-lyric", "wallpaper-helper"];
for (const mod of nativeModules) {
  const modSourceDir = resolve(desktopRoot, "native", mod);
  if (!existsSync(modSourceDir)) continue;

  const targetModDir = resolve(nativeDestination, mod);
  mkdirSync(targetModDir, { recursive: true });

  // 复制当前模块目录下的 .node 二进制文件及类型定义文件
  const files = readdirSync(modSourceDir);
  for (const file of files) {
    if (file.endsWith(".node") || file.endsWith(".d.ts")) {
      cpSync(join(modSourceDir, file), join(targetModDir, file));
    }
  }
}

console.log(`[prepare-app] Prepared Desktop package app directory with native modules: ${packagedAppRoot}`);
