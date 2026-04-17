import fs from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import * as yaml from "js-yaml";

import {
  type AppConfig,
  DEFAULT_APP_CONFIG,
  normalizeAppConfig,
  type PartialAppConfig,
} from "../types/config.js";

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

function readYamlConfig(filePath: string): PartialAppConfig | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return (yaml.load(raw) as PartialAppConfig | null) ?? null;
}

export function loadDefaultAppConfig(): AppConfig {
  const defaultConfig = readYamlConfig(appConfigDefaultPathValue);
  return normalizeAppConfig(defaultConfig ?? DEFAULT_APP_CONFIG);
}

export function loadAppConfig(): AppConfig {
  ensureConfigFile();
  const config = readYamlConfig(appConfigPathValue);
  return normalizeAppConfig(config ?? loadDefaultAppConfig());
}

export function saveAppConfig(newConfig: AppConfig): AppConfig {
  ensureConfigFile();
  const normalizedConfig = normalizeAppConfig(newConfig);
  const yamlString = yaml.dump(normalizedConfig, { noRefs: true });
  fs.writeFileSync(appConfigPathValue, yamlString, "utf-8");
  return normalizedConfig;
}
