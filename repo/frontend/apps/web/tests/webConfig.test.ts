import { expect, test } from "bun:test";
import { networkConfigOverrideSchema, normalizeWebConfig } from "@/types/config";

test("Web config keeps only Renderer-owned fields", () => {
  const config = normalizeWebConfig({
    app: { devTools: true, locale: "zh-TW" },
    backend: { host: "api.example.test", port: "4545", protocol: "https" },
    cache: { enabled: false },
    network: {
      proxyMode: "custom",
      proxyUrl: "http://127.0.0.1:7890",
      randomCNIP: true,
      timeout: "9000",
    },
    updater: { checkOnStartup: false },
  });

  expect(config).toEqual({
    app: { locale: "zh-TW" },
    backend: { host: "api.example.test", port: 4545, protocol: "https" },
    network: { randomCNIP: "true", timeout: 9000 },
  });
});

test("Web network overrides reject Desktop proxy fields", () => {
  expect(
    networkConfigOverrideSchema.parse({
      proxyMode: "custom",
      proxyUrl: "http://127.0.0.1:7890",
      randomCNIP: false,
      timeout: 6000,
    }),
  ).toEqual({ randomCNIP: "false", timeout: 6000 });
});
