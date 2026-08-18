export type BackendStartupState = "failed" | "ready" | "starting";

export interface BackendStartupStatus {
  message?: string;
  ready: boolean;
  state: BackendStartupState;
  url: string;
}

export type DesktopBackendState = "disabled" | "error" | "running" | "starting" | "stopped";

export type DesktopBackendSource = "external" | "managed" | null;

export interface DesktopBackendStatus {
  error: string | null;
  host: string;
  managed: boolean;
  origin: string;
  pid: number | null;
  port: number;
  source: DesktopBackendSource;
  state: DesktopBackendState;
}
