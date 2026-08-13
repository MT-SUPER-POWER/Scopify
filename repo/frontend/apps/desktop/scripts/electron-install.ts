import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/";

export function getElectronPlatformPath(platform: string = process.platform) {
  switch (platform) {
    case "darwin":
    case "mas":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      throw new Error(`Electron builds are not available on platform: ${platform}`);
  }
}

export function isElectronInstalled(
  electronDir: string,
  version: string,
  platform = process.platform,
) {
  try {
    const platformPath = getElectronPlatformPath(platform);
    const installedVersion = readFileSync(join(electronDir, "dist", "version"), "utf-8").replace(
      /^v/,
      "",
    );
    const installedPath = readFileSync(join(electronDir, "path.txt"), "utf-8");

    return (
      installedVersion === version &&
      installedPath === platformPath &&
      existsSync(join(electronDir, "dist", platformPath))
    );
  } catch {
    return false;
  }
}

export function ensureElectronInstalled(projectRoot = process.cwd()) {
  const electronDir = join(projectRoot, "node_modules", "electron");
  const packageJsonPath = join(electronDir, "package.json");
  const installScript = join(electronDir, "install.js");

  if (!existsSync(packageJsonPath) || !existsSync(installScript)) {
    throw new Error("Electron package is missing. Run `bun install` first.");
  }

  const { version } = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { version: string };

  if (isElectronInstalled(electronDir, version)) {
    console.log(`Electron ${version} binary is already installed.`);
    return;
  }

  console.log(`Installing Electron ${version} binary...`);

  const env = {
    ...process.env,
    ELECTRON_MIRROR: process.env.ELECTRON_MIRROR ?? DEFAULT_ELECTRON_MIRROR,
    npm_config_electron_mirror:
      process.env.npm_config_electron_mirror ??
      process.env.ELECTRON_MIRROR ??
      DEFAULT_ELECTRON_MIRROR,
  };

  const result = spawnSync(process.execPath, [installScript], {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Electron binary install failed with exit code ${result.status ?? "unknown"}.`);
  }

  if (!isElectronInstalled(electronDir, version)) {
    throw new Error("Electron install finished, but the expected binary is still missing.");
  }

  console.log(`Electron ${version} binary installed.`);
}
