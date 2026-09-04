import { ipcMain, type BrowserWindow } from "electron";

import type { McpRuntime } from "@main/capabilities/mcp";

import { isMainRenderer } from "./sender";

/**
 * Restricted Renderer control plane for the MCP capability. The returned
 * client configuration is exposed only through explicit view/rotation
 * actions; status and connection-test results never contain the bearer token.
 */
export function registerMcpIpc(mainWindow: BrowserWindow | null, runtime: McpRuntime) {
  ipcMain.handle("mcp:get-status", (event) => {
    assertMainRenderer(event, mainWindow);
    return runtime.getStatus();
  });
  ipcMain.handle("mcp:get-client-configuration", async (event) => {
    assertMainRenderer(event, mainWindow);
    return runtime.getClientConfiguration();
  });
  ipcMain.handle("mcp:restart", async (event) => {
    assertMainRenderer(event, mainWindow);
    return runtime.restart();
  });
  ipcMain.handle("mcp:rotate-credential", async (event) => {
    assertMainRenderer(event, mainWindow);
    return runtime.rotateCredential();
  });
  ipcMain.handle("mcp:test-connection", async (event) => {
    assertMainRenderer(event, mainWindow);
    return runtime.testConnection();
  });
}

function assertMainRenderer(
  event: Parameters<typeof isMainRenderer>[0],
  mainWindow: BrowserWindow | null,
) {
  if (!isMainRenderer(event, mainWindow)) {
    throw new Error("Unauthorized MCP control request.");
  }
}
