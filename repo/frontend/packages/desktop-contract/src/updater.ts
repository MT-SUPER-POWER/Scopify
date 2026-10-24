export type AppUpdateStatus =
  | "available"
  | "checking"
  | "downloaded"
  | "downloading"
  | "error"
  | "idle"
  | "not-available"
  | "unsupported";

export interface AppUpdateState {
  currentVersion: string;
  manualInstall?: boolean;
  lastCheckedAt?: number;
  message?: string;
  percent?: number;
  status: AppUpdateStatus;
  supported: boolean;
  version?: string;
}

export type AppUpdateStatePatch = Pick<AppUpdateState, "status"> &
  Partial<Omit<AppUpdateState, "status">>;
