import { expect, test } from "bun:test";

import { verifySandboxedPreloadBundleSource } from "@/lib/runtimeBundle";

test("accepts a self-contained sandbox preload bundle", () => {
  expect(
    verifySandboxedPreloadBundleSource(`
      "use strict";
      const electron = require("electron");
      electron.contextBridge.exposeInMainWorld("desktopAPI", {});
    `),
  ).toEqual({ ok: true });
});

test("rejects a sandbox preload bundle that requires a generated chunk", () => {
  expect(
    verifySandboxedPreloadBundleSource(`
      "use strict";
      const shared = require("./chunks/shared.cjs");
      shared.install();
    `),
  ).toEqual({
    message: 'Sandbox preload bundle requires unsupported module "./chunks/shared.cjs".',
    ok: false,
  });
});

test("rejects external dependencies unavailable to a sandbox preload", () => {
  expect(verifySandboxedPreloadBundleSource('const schema = require("zod");')).toEqual({
    message: 'Sandbox preload bundle requires unsupported module "zod".',
    ok: false,
  });
});
