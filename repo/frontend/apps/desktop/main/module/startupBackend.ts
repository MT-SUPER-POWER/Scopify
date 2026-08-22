import type { DesktopHostConfig } from "@scopify/desktop-contract";

import type {
  DesktopStartupBackendGateResult,
  ReconcileStartupBackend,
} from "../../types/backendStartup.js";

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : String(error);
}

/**
 * Blocks desktop startup only when Scopify owns the local backend lifecycle.
 * A custom backend remains the renderer's responsibility and must not delay the window.
 */
export async function ensureStartupBackend(
  config: DesktopHostConfig["backend"],
  reconcile: ReconcileStartupBackend,
): Promise<DesktopStartupBackendGateResult> {
  try {
    const status = await reconcile(config);

    if (!config.autoStart) return { message: null, ready: true };
    if (status.state === "running") return { message: null, ready: true };

    return {
      message: status.error ?? `本地后端未就绪（当前状态：${status.state}）。`,
      ready: false,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    return config.autoStart ? { message, ready: false } : { message, ready: true };
  }
}
