import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { shouldCheckVersion } = require("../resources/backend-entry.cjs") as {
  shouldCheckVersion(backendRoot: string, resourcesPath?: string): boolean;
};

test("checks the npm backend version only outside the packaged backend resource", () => {
  expect(
    shouldCheckVersion(
      "D:/Github/Scopify/repo/backend/api-enhanced",
      "D:/Github/Scopify/repo/frontend/apps/desktop/node_modules/electron/dist/resources",
    ),
  ).toBe(true);

  expect(shouldCheckVersion("D:/Apps/Scopify/resources/backend", "D:/Apps/Scopify/resources")).toBe(
    false,
  );
});

test("keeps the version check enabled when Electron does not expose a resources path", () => {
  expect(shouldCheckVersion(resolve(import.meta.dir, "../../../backend/api-enhanced"))).toBe(true);
});
