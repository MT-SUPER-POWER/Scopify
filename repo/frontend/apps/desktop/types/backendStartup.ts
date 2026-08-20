import type { DesktopBackendStatus, DesktopHostConfig } from "@scopify/desktop-contract";

export type ReconcileStartupBackend = (
  config: DesktopHostConfig["backend"],
) => Promise<DesktopBackendStatus>;

export interface DesktopStartupBackendGateResult {
  message: string | null;
  ready: boolean;
}
