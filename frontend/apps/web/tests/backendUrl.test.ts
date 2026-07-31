import { expect, test } from "bun:test";

import { buildBackendBaseUrl } from "@/lib/web/backendUrl";

test("builds local HTTP backend origins with a non-standard port", () => {
  expect(buildBackendBaseUrl({ host: "127.0.0.1", port: 3838, protocol: "http" })).toBe(
    "http://127.0.0.1:3838",
  );
});

test("omits the standard HTTPS port for public API origins", () => {
  expect(buildBackendBaseUrl({ host: "api.example.test", port: 443, protocol: "https" })).toBe(
    "https://api.example.test",
  );
});
