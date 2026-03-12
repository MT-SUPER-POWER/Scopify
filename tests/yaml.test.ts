import fs from "fs";
import { test, expect } from "bun:test";
import * as yaml from "js-yaml";
import path from "path/win32";
import { AppConfig } from "@/types/config";


test("Yaml read from file", () => {
  // 同步读取
  const configFilePath = path.resolve(__dirname, "../config/app.config.yml");
  const raw = fs.readFileSync(configFilePath, "utf-8");
  const config = yaml.load(raw) as AppConfig;

  // console.log("Loaded config:", config);

  expect(config.app.gpuAcceleration).toBe(true);
  expect(config.backend.port).toBe(3838);
  expect(config.logging.level).toBe("info");
});

test("Yaml write to file", () => {
  const configFilePath = path.resolve(__dirname, "../config/app.config.yml");
  const raw = fs.readFileSync(configFilePath, "utf-8");
  const config = yaml.load(raw) as AppConfig;

  // 修改配置
  config.app.devTools = true;
  config.backend.port = 4000;
  config.logging.level = "debug";

  expect(config.app.devTools).toBe(true);
  expect(config.backend.port).toBe(4000);
  expect(config.logging.level).toBe("debug");

  // 保存到本地
  const newRaw = yaml.dump(config);
  fs.writeFileSync(configFilePath, newRaw, "utf-8");

  // 重新读取验证
  const updatedRaw = fs.readFileSync(configFilePath, "utf-8");
  const updatedConfig = yaml.load(updatedRaw) as AppConfig;
  expect(updatedConfig.app.devTools).toBe(true);
});
