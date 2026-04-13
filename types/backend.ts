export type BackendStartupState = "starting" | "ready" | "failed";

export interface BackendStartupStatus {
  state: BackendStartupState;
  ready: boolean;
  url: string;
  message?: string;
}
