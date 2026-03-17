// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { AppConfig } from "@/types/config";
import * as yaml from "js-yaml";
import { join } from "path";
import fs from 'fs';
import { app } from "electron";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PATHS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __resourceConfigDir = app.isPackaged
  ? join(process.resourcesPath, "config")
  : join(process.cwd(), "config");

const __appConfigPath = join(__resourceConfigDir, "app.config.yml");
const __appConfigDefaultPath = join(__resourceConfigDir, "app.config.default.yml");

export const appConfigPath = __appConfigPath;
export const appConfigDefaultPath = __appConfigDefaultPath;

function ensureConfigFile() {
  if (fs.existsSync(__appConfigPath)) return;
  fs.mkdirSync(__resourceConfigDir, { recursive: true });
  if (fs.existsSync(__appConfigDefaultPath)) {
    fs.copyFileSync(__appConfigDefaultPath, __appConfigPath);
  }
}

/**
 * @returns AppConfig
 */
export function loadAppConfig(): AppConfig {
  ensureConfigFile();
  if (!fs.existsSync(__appConfigPath)) return loadDefaultAppConfig();

  const raw = fs.readFileSync(__appConfigPath, "utf-8");
  const config = yaml.load(raw) as AppConfig;
  return { ...loadDefaultAppConfig(), ...config };
}

export function loadDefaultAppConfig(): AppConfig {
  const raw = fs.readFileSync(__appConfigDefaultPath, "utf-8");
  const config = yaml.load(raw) as AppConfig;
  return config;
}

export function saveAppConfig(newConfig: AppConfig): AppConfig {
  ensureConfigFile();
  const yamlString = yaml.dump(newConfig);
  fs.writeFileSync(__appConfigPath, yamlString, "utf-8");
  return newConfig;
}
