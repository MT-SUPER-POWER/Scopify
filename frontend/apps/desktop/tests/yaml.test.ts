import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path/win32";
import * as yaml from "js-yaml";
import { normalizeDesktopHostConfig } from "@/types/config";

test("desktop config yml contains only host-owned settings", () => {
  const configFilePath = path.resolve(__dirname, "../config/app.config.yml");
  const raw = fs.readFileSync(configFilePath, "utf-8");
  const parsed = yaml.load(raw);
  const config = normalizeDesktopHostConfig(parsed);

  expect(config.app.gpuAcceleration).toBe(true);
  expect(config.app.devTools).toBe(false);
  expect(config.frontend.host).toBe("127.0.0.1");
  expect(config.frontend.devPort).toBe(3000);
  expect(config.logging.level).toBe("info");
  expect(config.cache.enabled).toBe(true);
  expect(config.cache.dir).toBe("");
  expect(config.cache.maxSizeMB).toBe(256);
  expect(config.cache.pageTtlMinutes).toBe(360);
  expect(config.cache.searchTtlMinutes).toBe(30);
  expect(config.updater.checkOnStartup).toBe(true);
  expect(config.updater.autoDownload).toBe(false);
  expect(parsed).not.toHaveProperty("backend");
  expect(parsed).not.toHaveProperty("app.locale");
  expect(parsed).not.toHaveProperty("network.timeout");
  expect(parsed).not.toHaveProperty("network.randomCNIP");
});

test("normalizing legacy config drops Web-owned and unknown fields", () => {
  const config = normalizeDesktopHostConfig({
    app: { locale: "zh-TW" },
    backend: { autoStart: true, host: "10.0.0.20", port: 4545 },
    network: {
      max_retries: 5,
      proxyMode: "custom",
      proxyUrl: "  http://127.0.0.1:7890  ",
      randomCNIP: true,
      retry_delay: 1000,
      timeout: "9000",
    },
  });

  expect(config.network).toEqual({
    proxyMode: "custom",
    proxyUrl: "http://127.0.0.1:7890",
  });
  expect(config.app).not.toHaveProperty("locale");
  expect(config).not.toHaveProperty("backend");
});

test("normalizing cache config clamps invalid values", () => {
  const config = normalizeDesktopHostConfig({
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

test("normalizing malformed host config falls back per field", () => {
  const config = normalizeDesktopHostConfig({
    app: { closeAction: 99 },
    network: { proxyMode: "unsupported" },
  });

  expect(config.app.closeAction).toBe(2);
  expect(config.network.proxyMode).toBe("system");
  expect(config.updater.checkOnStartup).toBe(true);
  expect(config.updater.autoDownload).toBe(false);
});

test("normalizing updater config accepts persisted boolean strings", () => {
  const config = normalizeDesktopHostConfig({
    updater: {
      checkOnStartup: "false",
      autoDownload: "true",
    },
  });

  expect(config.updater.checkOnStartup).toBe(false);
  expect(config.updater.autoDownload).toBe(true);
});
