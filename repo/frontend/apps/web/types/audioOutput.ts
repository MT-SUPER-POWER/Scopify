export interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

export type AudioOutputDevicesErrorKey =
  | "audioSettings.outputLoadFailed"
  | "audioSettings.outputSelectFailed"
  | "audioSettings.outputUnsupported"
  | "audioSettings.inputAccessFailed";

export interface AudioOutputStore {
  selectedInputDeviceId: string;
  selectedDeviceId: string;
  setSelectedInputDeviceId: (deviceId: string) => void;
  setSelectedDeviceId: (deviceId: string) => void;
}

export interface AudioOutputOptionProps {
  active: boolean;
  label: string;
  onClick: () => void;
}
