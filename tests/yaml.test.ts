import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path/win32";
import * as yaml from "js-yaml";
import { networkConfigOverrideSchema, normalizeAppConfig } from "@/types/config";

test("app config yml keeps backend host and port", () => {
  const configFilePath = path.resolve(__dirname, "../config/app.config.yml");
  const raw = fs.readFileSync(configFilePath, "utf-8");
  const config = normalizeAppConfig(yaml.load(raw));

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
    },
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
    },
  });

  expect(config.cache.enabled).toBe(false);
  expect(config.cache.dir).toBe("D:/Scopify Cache");
  expect(config.cache.maxSizeMB).toBe(256);
  expect(config.cache.pageTtlMinutes).toBe(360);
  expect(config.cache.searchTtlMinutes).toBe(30);
});

test("normalizing legacy and malformed config falls back per field", () => {
  const config = normalizeAppConfig({
    app: { locale: "unsupported" },
    network: {
      max_retries: 5,
      proxyMode: "unsupported",
      randomCNIP: true,
      retry_delay: 1000,
      timeout: "9000",
    },
  });

  expect(config.app.locale).toBe("zh-CN");
  expect(config.network.timeout).toBe(9000);
  expect(config.network.randomCNIP).toBe("true");
  expect(config.network.proxyMode).toBe("system");
  expect("max_retries" in config.network).toBe(false);
  expect("retry_delay" in config.network).toBe(false);
});

test("network overrides retain valid values and discard invalid or legacy fields", () => {
  const result = networkConfigOverrideSchema.safeParse({
    max_retries: 5,
    proxyMode: "unsupported",
    proxyUrl: "  http://127.0.0.1:7890  ",
    randomCNIP: true,
    retry_delay: 1000,
    timeout: "9000",
  });

  expect(result.success).toBe(true);
  if (!result.success) return;

  expect(result.data).toEqual({
    proxyUrl: "http://127.0.0.1:7890",
    randomCNIP: "true",
    timeout: 9000,
  });
});
