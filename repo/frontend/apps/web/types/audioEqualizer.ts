export type AudioEqualizerPresetId = "flat" | "lofi" | "radio" | "vinyl" | "vocal" | "bass";
export type AudioEqualizerModeId = AudioEqualizerPresetId | "custom";
export type AudioSettingsTab = "equalizer" | "quality";

export interface AudioEqualizerSettings {
  enabled: boolean;
  gains: number[];
  preset: AudioEqualizerModeId;
  customGains: number[];
}

export interface AudioEqualizerStore {
  dialogTab: AudioSettingsTab;
  isDialogOpen: boolean;
  settings: AudioEqualizerSettings;
  applyPreset: (preset: AudioEqualizerModeId) => void;
  closeDialog: () => void;
  openDialog: (tab?: AudioSettingsTab) => void;
  setBandGain: (index: number, gain: number) => void;
  setDialogTab: (tab: AudioSettingsTab) => void;
  setEnabled: (enabled: boolean) => void;
}
