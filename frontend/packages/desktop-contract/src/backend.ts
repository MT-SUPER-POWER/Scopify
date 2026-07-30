export type BackendStartupState = "failed" | "ready" | "starting";

export interface BackendStartupStatus {
  message?: string;
  ready: boolean;
  state: BackendStartupState;
  url: string;
}
