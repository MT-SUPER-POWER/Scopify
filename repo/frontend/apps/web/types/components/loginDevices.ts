import type {
  DeviceAction,
  LoginDevice,
  LoginDeviceKind,
  LoginDeviceSnapshot,
  LoginDeviceTone,
} from "@/types/devices";
export interface DeviceIllustrationProps {
  kind: LoginDeviceKind;
  tone: LoginDeviceTone;
  hero?: boolean;
}
export interface LoginDeviceCardProps {
  device: LoginDevice;
  onSelect: (device: LoginDevice) => void;
  onRename?: (device: LoginDevice) => void;
}
export interface LoginDeviceDetailsProps {
  device: LoginDevice | null;
  onClose: () => void;
  onAction: (action: DeviceAction) => void;
}
export interface LoginDeviceStageProps {
  devices: LoginDevice[];
  selectedDevice: LoginDevice;
  onSelect: (device: LoginDevice) => void;
}
export interface LoginDeviceContentProps {
  snapshot: LoginDeviceSnapshot;
  scope: string;
}
export interface LoginDevicesHeaderProps {
  allowance: LoginDeviceSnapshot["allowance"];
  refreshing: boolean;
  onRefresh: () => void;
  authenticated: boolean;
}
export interface DeviceActionDialogProps {
  action: DeviceAction | null;
  scope: string;
  onClose: () => void;
}
export interface LoginDeviceNameFieldProps {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}
