import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = resolve(import.meta.dir, "..");
const rootLayoutSource = readFileSync(resolve(appRoot, "app/layout.tsx"), "utf8");
const mainLayoutSource = readFileSync(resolve(appRoot, "components/MainLayout.tsx"), "utf8");
const notificationSource = readFileSync(
  resolve(appRoot, "hooks/backend/useBackendStatusNotification.ts"),
  "utf8",
);

test("keeps the dashboard available while the backend starts or fails", () => {
  expect(mainLayoutSource).not.toContain("useBackendStartup");
  expect(mainLayoutSource).not.toContain('backendStartup.state === "starting"');
  expect(mainLayoutSource).not.toContain('backendStartup.state === "failed"');
});

test("mounts a non-blocking backend status notification", () => {
  expect(rootLayoutSource).toContain("BackendStatusNotifier");
  expect(rootLayoutSource).toContain("<BackendStatusNotifier />");
  expect(notificationSource).toMatch(/runtime\.backend\s*\.getStatus\(\)/);
  expect(notificationSource).toContain("runtime.backend.onStatusChanged");
  expect(notificationSource).toContain("toast.error");
  expect(notificationSource).toContain('router.push("/setting")');
});
