import type { TranslationKey } from "@/lib/i18n";

export type LoginDeviceKind = "phone" | "laptop" | "desktop" | "unknown";
export type LoginDeviceTone = "mint" | "violet" | "sand" | "slate";
export type LoginDeviceView = "all" | "activity";

export interface LoginDevicePreview {
  id: string;
  name: string;
  kind: LoginDeviceKind;
  tone: LoginDeviceTone;
  platform: string;
  activityKey: TranslationKey;
  regionKey: TranslationKey;
  loginKey: TranslationKey;
  current?: boolean;
}

export interface DeviceIllustrationProps {
  kind: LoginDeviceKind;
  tone: LoginDeviceTone;
  hero?: boolean;
}

export interface LoginDeviceCardProps {
  device: LoginDevicePreview;
  onSelect: (device: LoginDevicePreview) => void;
}

export interface LoginDeviceDetailsProps {
  device: LoginDevicePreview | null;
  onClose: () => void;
}

export interface LoginDeviceStageProps {
  selectedDevice: LoginDevicePreview;
  onSelect: (device: LoginDevicePreview) => void;
}
