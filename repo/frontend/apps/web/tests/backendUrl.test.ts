import { expect, test } from "bun:test";

import { buildBackendBaseUrl, normalizeBackendConfig } from "@/lib/web/backendUrl";

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

test("normalizes a pasted HTTPS origin into matching fields", () => {
  expect(
    normalizeBackendConfig({
      host: " https://scopify-api.vercel.app/ ",
      port: 3838,
      protocol: "http",
    }),
  ).toEqual({
    backend: {
      host: "scopify-api.vercel.app",
      port: 443,
      protocol: "https",
    },
    ok: true,
    url: "https://scopify-api.vercel.app",
  });
});

test("infers HTTPS from a bare host with port 443", () => {
  expect(
    normalizeBackendConfig({ host: "api.example.test:443", port: 3838, protocol: "http" }),
  ).toEqual({
    backend: {
      host: "api.example.test",
      port: 443,
      protocol: "https",
    },
    ok: true,
    url: "https://api.example.test",
  });
});

test("infers HTTPS from the port field when the host is bare", () => {
  expect(normalizeBackendConfig({ host: "api.example.test", port: 443, protocol: "http" })).toEqual(
    {
      backend: {
        host: "api.example.test",
        port: 443,
        protocol: "https",
      },
      ok: true,
      url: "https://api.example.test",
    },
  );
});

test("normalizes a protocol-relative host using the configured standard port", () => {
  expect(
    normalizeBackendConfig({ host: "//api.example.test", port: 443, protocol: "http" }),
  ).toEqual({
    backend: {
      host: "api.example.test",
      port: 443,
      protocol: "https",
    },
    ok: true,
    url: "https://api.example.test",
  });
});

test("keeps a local HTTP host and custom port", () => {
  expect(normalizeBackendConfig({ host: "127.0.0.1", port: 3838, protocol: "http" })).toEqual({
    backend: {
      host: "127.0.0.1",
      port: 3838,
      protocol: "http",
    },
    ok: true,
    url: "http://127.0.0.1:3838",
  });
});

test("rejects a backend path because API routes are rooted at the origin", () => {
  expect(
    normalizeBackendConfig({
      host: "https://api.example.test/music",
      port: 443,
      protocol: "https",
    }),
  ).toMatchObject({ ok: false });
});
