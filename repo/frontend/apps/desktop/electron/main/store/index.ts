import fs from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import * as yaml from "js-yaml";

import type { DesktopHostConfig } from "@scopify/desktop-contract";
import { DEFAULT_DESKTOP_HOST_CONFIG, normalizeDesktopHostConfig } from "@/types/config";

const resourceConfigDir = app?.isPackaged
  ? join(process.resourcesPath, "config")
  : join(process.cwd(), "config");

// 安装目录会在每次更新时被覆盖，用户配置必须放在 userData 里才能跨版本保留；
// 安装目录只保留随包分发的默认配置。
const userConfigDir = app?.isPackaged ? join(app.getPath("userData"), "config") : resourceConfigDir;

const appConfigPathValue = join(userConfigDir, "app.config.yml");
const appConfigDefaultPathValue = join(resourceConfigDir, "app.config.default.yml");

export const appConfigPath = appConfigPathValue;
export const appConfigDefaultPath = appConfigDefaultPathValue;

export function ensureConfigFile() {
  if (fs.existsSync(appConfigPathValue)) return;
  fs.mkdirSync(userConfigDir, { recursive: true });
  if (fs.existsSync(appConfigDefaultPathValue)) {
    fs.copyFileSync(appConfigDefaultPathValue, appConfigPathValue);
  } else {
    const yamlString = yaml.dump(DEFAULT_DESKTOP_HOST_CONFIG, { noRefs: true });
    fs.writeFileSync(appConfigPathValue, yamlString, "utf-8");
  }
}

function readYamlConfig(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return yaml.load(raw) ?? null;
}

export function loadDefaultDesktopHostConfig(): DesktopHostConfig {
  const defaultConfig = readYamlConfig(appConfigDefaultPathValue);
  return normalizeDesktopHostConfig(defaultConfig ?? DEFAULT_DESKTOP_HOST_CONFIG);
}

export function loadDesktopHostConfig(): DesktopHostConfig {
  ensureConfigFile();
  const config = readYamlConfig(appConfigPathValue);
  return normalizeDesktopHostConfig(config ?? loadDefaultDesktopHostConfig());
}

export function saveDesktopHostConfig(newConfig: DesktopHostConfig): DesktopHostConfig {
  ensureConfigFile();
  const normalizedConfig = normalizeDesktopHostConfig(newConfig);
  const yamlString = yaml.dump(normalizedConfig, { noRefs: true });
  fs.writeFileSync(appConfigPathValue, yamlString, "utf-8");
  return normalizedConfig;
}
