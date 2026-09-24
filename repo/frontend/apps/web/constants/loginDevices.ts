import type { LoginDevicePreview } from "@/types/components/loginDevices";

// Design fixtures only. Never substitute these for an empty API response.
export const CURRENT_DEVICE_PREVIEW: LoginDevicePreview = {
  id: "preview-current",
  name: "Scopify · Windows",
  kind: "desktop",
  tone: "mint",
  platform: "Windows · Scopify",
  activityKey: "devices.time.now",
  regionKey: "devices.region.unknown",
  loginKey: "devices.login.qr",
  current: true,
};

export const OTHER_DEVICE_PREVIEWS: readonly LoginDevicePreview[] = [
  {
    id: "preview-phone",
    name: "iPhone 15 Plus",
    kind: "phone",
    tone: "mint",
    platform: "iOS",
    activityKey: "devices.time.recent",
    regionKey: "devices.region.example",
    loginKey: "devices.login.quick",
  },
  {
    id: "preview-mac",
    name: "MacBook Pro",
    kind: "laptop",
    tone: "violet",
    platform: "macOS",
    activityKey: "devices.time.yesterday",
    regionKey: "devices.region.example",
    loginKey: "devices.login.sms",
  },
  {
    id: "preview-pc",
    name: "Windows PC",
    kind: "desktop",
    tone: "sand",
    platform: "Windows",
    activityKey: "devices.time.days",
    regionKey: "devices.region.unknown",
    loginKey: "devices.login.qr",
  },
  {
    id: "preview-unknown",
    name: "pc",
    kind: "unknown",
    tone: "slate",
    platform: "PC",
    activityKey: "devices.time.earlier",
    regionKey: "devices.region.unknown",
    loginKey: "devices.login.qr",
  },
];
