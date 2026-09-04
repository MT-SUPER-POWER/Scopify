import { expect, test } from "bun:test";
import { buildSavedSettingsConfig } from "@/lib/settings/buildSavedSettingsConfig";
import type { SettingsConfig } from "@/types/settings";

const settingsWithManagedLocalBackend: SettingsConfig = {
  desktop: {
    app: { closeAction: 2, devTools: false, gpuAcceleration: true },
    backend: { autoStart: true, port: 4040 },
    cache: {
      dir: "",
      page: { enabled: true, maxSizeMB: 256, searchTtlMinutes: 30, ttlMinutes: 360 },
      playback: {
        enabled: true,
        lyricTtlMinutes: 1440,
        maxEntries: 100,
        maxSizeMB: 64,
        urlTtlMinutes: 30,
      },
    },
    discord: { applicationId: "", enabled: false },
    frontend: { devPort: 3000, host: "127.0.0.1" },
    logging: { dir: "", format: "", keepDays: 7, level: "info", maxSizeMB: 16 },
    mcp: { capabilities: ["playback.read"], enabled: false, port: 31927 },
    network: { proxyMode: "system", proxyUrl: "" },
    updater: { autoDownload: false, checkOnStartup: true },
  },
  web: {
    app: { locale: "zh-CN" },
    backend: { host: "api.example.test", port: 8443, protocol: "https" },
    network: { randomCNIP: "false", timeout: 10_000 },
  },
};

test("saving settings preserves a custom API target when the local backend auto-starts", () => {
  const saved = buildSavedSettingsConfig(
    settingsWithManagedLocalBackend,
    settingsWithManagedLocalBackend.web.backend,
  );

  expect(saved.desktop?.backend).toEqual({ autoStart: true, port: 4040 });
  expect(saved.web.backend).toEqual({
    host: "api.example.test",
    port: 8443,
    protocol: "https",
  });
});
