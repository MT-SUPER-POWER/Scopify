import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path/win32";
import * as yaml from "js-yaml";
import type { PartialAppConfig } from "@/types/config";
import { normalizeAppConfig } from "@/types/config";

test("app config yml keeps backend host and port", () => {
  const configFilePath = path.resolve(__dirname, "../config/app.config.yml");
  const raw = fs.readFileSync(configFilePath, "utf-8");
  const config = normalizeAppConfig(yaml.load(raw) as PartialAppConfig);

  expect(config.app.gpuAcceleration).toBe(true);
  expect(config.backend.host).toBe("127.0.0.1");
  expect(config.backend.port).toBe(3838);
  expect(config.logging.level).toBe("info");
  expect(config.cache.enabled).toBe(true);
  expect(config.cache.dir).toBe("");
  expect(config.cache.maxSizeMB).toBe(256);
  expect(config.cache.pageTtlMinutes).toBe(360);
  expect(config.cache.searchTtlMinutes).toBe(30);
});

test("normalizing legacy backend config ignores autoStart", () => {
  const config = normalizeAppConfig({
    backend: {
      host: "10.0.0.20",
      port: 4545,
      autoStart: true,
    } as PartialAppConfig["backend"] & { autoStart: boolean },
  });

  expect(config.backend.host).toBe("10.0.0.20");
  expect(config.backend.port).toBe(4545);
  expect("autoStart" in config.backend).toBe(false);
});

test("normalizing cache config clamps invalid values", () => {
  const config = normalizeAppConfig({
    cache: {
      enabled: "false",
      dir: "  D:/Scopify Cache  ",
      maxSizeMB: -1,
      pageTtlMinutes: 0,
      searchTtlMinutes: Number.NaN,
    } as unknown as PartialAppConfig["cache"],
  });

  expect(config.cache.enabled).toBe(false);
  expect(config.cache.dir).toBe("D:/Scopify Cache");
  expect(config.cache.maxSizeMB).toBe(256);
  expect(config.cache.pageTtlMinutes).toBe(360);
  expect(config.cache.searchTtlMinutes).toBe(30);
});
