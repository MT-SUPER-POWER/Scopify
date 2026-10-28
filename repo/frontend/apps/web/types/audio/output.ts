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
  isPopoverOpen: boolean;
  setSelectedInputDeviceId: (deviceId: string) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  setPopoverOpen: (open: boolean) => void;
  togglePopover: () => void;
}
