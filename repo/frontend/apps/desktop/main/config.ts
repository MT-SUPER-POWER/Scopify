import fs from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import * as yaml from "js-yaml";

import type { DesktopHostConfig } from "@mt-super-power/desktop-contract";
import { DEFAULT_DESKTOP_HOST_CONFIG, normalizeDesktopHostConfig } from "../types/config.js";

const resourceConfigDir = app.isPackaged
  ? join(process.resourcesPath, "config")
  : join(process.cwd(), "config");

const appConfigPathValue = join(resourceConfigDir, "app.config.yml");
const appConfigDefaultPathValue = join(resourceConfigDir, "app.config.default.yml");

export const appConfigPath = appConfigPathValue;
export const appConfigDefaultPath = appConfigDefaultPathValue;

function ensureConfigFile() {
  if (fs.existsSync(appConfigPathValue)) return;
  fs.mkdirSync(resourceConfigDir, { recursive: true });
  if (fs.existsSync(appConfigDefaultPathValue)) {
    fs.copyFileSync(appConfigDefaultPathValue, appConfigPathValue);
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
