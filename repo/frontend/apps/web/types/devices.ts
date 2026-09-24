export type LoginDeviceKind = "phone" | "laptop" | "desktop" | "unknown";
export type LoginDeviceTone = "mint" | "violet" | "sand" | "slate";
export type LoginDeviceView = "all" | "activity";

export interface LoginDevice {
  id: string;
  deviceKey: string | null;
  name: string;
  kind: LoginDeviceKind;
  tone: LoginDeviceTone;
  platform: string;
  lastActiveTime: number | null;
  activity: string;
  region: string;
  loginMethod: string;
  current: boolean;
}

export interface LoginDeviceSnapshot {
  devices: LoginDevice[];
  allowance: { used: number; limit: number } | null;
}

export type DeviceAction = { type: "rename" | "kickoff"; device: LoginDevice };
export interface DeviceKickoffInput {
  device: LoginDevice;
  captcha: string;
}

export interface FreshLoginDevice {
  cookie: string;
  name: string;
  backend: string;
}
