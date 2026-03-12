// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { AppConfig } from "@/types/config";
import * as yaml from "js-yaml";
import { join } from "path";
import fs from 'fs';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PATHS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const __appConfigDefaultPath = join(__dirname, "../config/app.config.default.yml");
const __appConfigPath = join(__dirname, "../config/app.config.yml");

/**
 * @returns AppConfig
 */
export function loadAppConfig(): AppConfig {
  const raw = fs.readFileSync(__appConfigPath, "utf-8");
  const config = yaml.load(raw) as AppConfig;
  return config;
}

export function loadDefaultAppConfig(): AppConfig {
  const raw = fs.readFileSync(__appConfigDefaultPath, "utf-8");
  const config = yaml.load(raw) as AppConfig;
  return config;
}

export function saveAppConfig(newConfig: AppConfig) {
  const yamlString = yaml.dump(newConfig);
  fs.writeFileSync(__appConfigPath, yamlString, "utf-8");
}
