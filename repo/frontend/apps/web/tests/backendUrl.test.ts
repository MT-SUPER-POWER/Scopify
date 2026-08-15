import { expect, test } from "bun:test";

import {
  buildBackendBaseUrl,
  cleanBackendHostInput,
  normalizeBackendConfig,
} from "@/lib/web/backendUrl";

test("cleans host inputs by stripping protocol, port, and trailing paths", () => {
  expect(cleanBackendHostInput(" https://api.example.com:8443/music/v1/ ")).toEqual({
    host: "api.example.com",
    port: 8443,
    protocol: "https",
  });
  expect(cleanBackendHostInput("http://127.0.0.1:3838")).toEqual({
    host: "127.0.0.1",
    port: 3838,
    protocol: "http",
  });
  expect(cleanBackendHostInput("127.0.0.1")).toEqual({
    host: "127.0.0.1",
  });
  expect(cleanBackendHostInput("api.example.com:443")).toEqual({
    host: "api.example.com",
    port: 443,
  });
});

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

test("normalizes clean host and explicit fields directly", () => {
  expect(
    normalizeBackendConfig({
      host: "127.0.0.1",
      port: 3838,
      protocol: "http",
    }),
  ).toEqual({
    backend: {
      host: "127.0.0.1",
      port: 3838,
      protocol: "http",
    },
    ok: true,
    url: "http://127.0.0.1:3838",
  });

  expect(
    normalizeBackendConfig({
      host: "api.example.test",
      port: 443,
      protocol: "https",
    }),
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

test("auto-extracts protocol and port if pasted into the host field", () => {
  expect(
    normalizeBackendConfig({
      host: "https://scopify-api.vercel.app:443/",
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

  expect(
    normalizeBackendConfig({
      host: "http://127.0.0.1:3838",
      port: 80,
      protocol: "https",
    }),
  ).toEqual({
    backend: {
      host: "127.0.0.1",
      port: 3838,
      protocol: "http",
    },
    ok: true,
    url: "http://127.0.0.1:3838",
  });
});

test("rejects an empty backend host", () => {
  expect(
    normalizeBackendConfig({
      host: "   ",
      port: 3838,
      protocol: "http",
    }),
  ).toMatchObject({ ok: false });
});

test("rejects an invalid backend port", () => {
  expect(
    normalizeBackendConfig({
      host: "127.0.0.1",
      port: 99999,
      protocol: "http",
    }),
  ).toMatchObject({ ok: false });
});
