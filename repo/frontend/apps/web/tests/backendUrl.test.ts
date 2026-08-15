import { expect, test } from "bun:test";

import {
  buildBackendBaseUrl,
  cleanBackendHostInput,
  isBackendHostInputValid,
  isValidBackendHost,
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
  expect(cleanBackendHostInput("[::1]:3838")).toEqual({
    host: "[::1]",
    port: 3838,
  });
});

test("does NOT corrupt raw numeric or partial inputs to 0.0.0.x", () => {
  expect(cleanBackendHostInput("12323123123")).toEqual({
    host: "12323123123",
  });
  expect(cleanBackendHostInput("0.0.0.")).toEqual({
    host: "0.0.0.",
  });
});

test("validates valid and invalid host formats correctly", () => {
  // Valid IPv4
  expect(isValidBackendHost("127.0.0.1")).toBe(true);
  expect(isValidBackendHost("192.168.1.100")).toBe(true);
  expect(isValidBackendHost("0.0.0.0")).toBe(true);

  // Invalid IPv4
  expect(isValidBackendHost("0.0.0.12323123123")).toBe(false);
  expect(isValidBackendHost("256.0.0.1")).toBe(false);
  expect(isValidBackendHost("1.2.3")).toBe(false);

  // Valid domain / localhost / hostnames
  expect(isValidBackendHost("localhost")).toBe(true);
  expect(isValidBackendHost("api.example.com")).toBe(true);
  expect(isValidBackendHost("music-api.scopify.app")).toBe(true);
  expect(isValidBackendHost("local-server")).toBe(true);

  // Invalid domains / hostnames
  expect(isValidBackendHost("")).toBe(false);
  expect(isValidBackendHost("12323123123")).toBe(false);
  expect(isValidBackendHost("api..example.com")).toBe(false);
  expect(isValidBackendHost(".example.com")).toBe(false);
  expect(isValidBackendHost("example.com.")).toBe(false);
  expect(isValidBackendHost("-example.com")).toBe(false);
  expect(isValidBackendHost("api.example.com/subpath")).toBe(false);
  expect(isValidBackendHost("非法字符.com")).toBe(false);

  // Valid IPv6
  expect(isValidBackendHost("::1")).toBe(true);
  expect(isValidBackendHost("[::1]")).toBe(true);
});

test("validates full user host input strings", () => {
  expect(isBackendHostInputValid("127.0.0.1")).toBe(true);
  expect(isBackendHostInputValid("http://127.0.0.1:3838")).toBe(true);
  expect(isBackendHostInputValid("https://api.example.com:443/api")).toBe(true);
  expect(isBackendHostInputValid("ftp://127.0.0.1")).toBe(false);
  expect(isBackendHostInputValid("0.0.0.12323123123")).toBe(false);
  expect(isBackendHostInputValid("12323123123")).toBe(false);
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

test("rejects an invalid backend host format", () => {
  expect(
    normalizeBackendConfig({
      host: "0.0.0.12323123123",
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
