import { describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { DesktopBackendStatus, DesktopHostConfig } from "@scopify/desktop-contract";

import { ensureStartupBackend } from "@/main/module/startupBackend";

const managedConfig: DesktopHostConfig["backend"] = { autoStart: true, port: 3838 };
const customConfig: DesktopHostConfig["backend"] = { autoStart: false, port: 3838 };
const mainSource = readFileSync(resolve(import.meta.dir, "../main/main.ts"), "utf8");

function backendStatus(
  state: DesktopBackendStatus["state"],
  error: string | null = null,
): DesktopBackendStatus {
  return {
    error,
    host: "127.0.0.1",
    managed: state === "running",
    origin: "http://127.0.0.1:3838",
    pid: state === "running" ? 1234 : null,
    port: 3838,
    source: state === "running" ? "managed" : null,
    state,
  };
}

describe("ensureStartupBackend", () => {
  test("opens the app after the managed backend reports running", async () => {
    const reconcile = mock(async () => backendStatus("running"));

    await expect(ensureStartupBackend(managedConfig, reconcile)).resolves.toEqual({
      message: null,
      ready: true,
    });
    expect(reconcile).toHaveBeenCalledWith(managedConfig);
  });

  test("blocks the app when the managed backend fails to start", async () => {
    const reconcile = mock(async () => backendStatus("error", "port is occupied"));

    await expect(ensureStartupBackend(managedConfig, reconcile)).resolves.toEqual({
      message: "port is occupied",
      ready: false,
    });
  });

  test("blocks the app when managed backend reconciliation throws", async () => {
    const reconcile = mock(async () => {
      throw new Error("backend process crashed");
    });

    await expect(ensureStartupBackend(managedConfig, reconcile)).resolves.toEqual({
      message: "backend process crashed",
      ready: false,
    });
  });

  test("does not gate startup when a custom backend is configured", async () => {
    const reconcile = mock(async () => backendStatus("disabled"));

    await expect(ensureStartupBackend(customConfig, reconcile)).resolves.toEqual({
      message: null,
      ready: true,
    });
  });

  test("does not block a custom backend when desktop reconciliation throws", async () => {
    const reconcile = mock(async () => {
      throw new Error("desktop backend controller failed");
    });

    await expect(ensureStartupBackend(customConfig, reconcile)).resolves.toEqual({
      message: "desktop backend controller failed",
      ready: true,
    });
  });
});

test("creates the main window only after the startup backend gate passes", () => {
  const gateIndex = mainSource.indexOf("await ensureStartupBackend");
  const readyIndex = mainSource.indexOf("if (startupBackend.ready)", gateIndex);
  const mainWindowIndex = mainSource.indexOf("createMainWindow();", readyIndex);

  expect(gateIndex).toBeGreaterThan(-1);
  expect(readyIndex).toBeGreaterThan(gateIndex);
  expect(mainWindowIndex).toBeGreaterThan(readyIndex);
});
