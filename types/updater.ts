export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "unsupported"
  | "error";

export interface AppUpdateState {
  status: AppUpdateStatus;
  supported: boolean;
  currentVersion: string;
  version?: string;
  percent?: number;
  message?: string;
  lastCheckedAt?: number;
}

export type AppUpdateStatePatch = Pick<AppUpdateState, "status"> &
  Partial<Omit<AppUpdateState, "status">>;
