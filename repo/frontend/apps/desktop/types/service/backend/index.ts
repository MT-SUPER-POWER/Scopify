import type { DesktopBackendConfig, DesktopBackendStatus } from "@scopify/desktop-contract";
export interface BackendProbeResult {
  occupied: boolean;
  reachable: boolean;
}

export interface BackendControllerOptions {
  log: {
    error(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
  };
}

export interface DesktopBackendController {
  dispose(): Promise<void>;
  getStatus(): DesktopBackendStatus;
  onStatusChanged(callback: (status: DesktopBackendStatus) => void): () => void;
  reconcile(config: DesktopBackendConfig): Promise<DesktopBackendStatus>;
  restart(config: DesktopBackendConfig): Promise<DesktopBackendStatus>;
}
