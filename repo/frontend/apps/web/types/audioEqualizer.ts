export type AudioEqualizerPresetId = "flat" | "lofi" | "radio" | "vinyl" | "vocal" | "bass";
export type AudioEqualizerCustomSlotId = "custom-1" | "custom-2" | "custom-3";
export type AudioEqualizerUserPresetId = `user:${string}`;
export type AudioEqualizerModeId =
  AudioEqualizerPresetId | AudioEqualizerCustomSlotId | AudioEqualizerUserPresetId;
export type AudioSettingsTab = "equalizer" | "output" | "quality";
export type AudioEffectId =
  "highpass" | "lowpass" | "drive" | "crush" | "wow" | "noise" | "width" | "space" | "punch";
export type AudioEffectSettings = Record<AudioEffectId, number>;

export interface AudioEffectControl {
  id: AudioEffectId;
  max: number;
  min: number;
  neutral: number;
  scale: "linear" | "log";
  step: number;
  unit: "hz" | "ratio";
}

export interface AudioEqualizerSettings {
  customPresets: AudioEqualizerUserPreset[];
  customSlots: AudioEqualizerCustomSlot[];
  enabled: boolean;
  effects: AudioEffectSettings;
  gains: number[];
  preset: AudioEqualizerModeId;
  customGains: number[];
}

export interface AudioEqualizerUserPreset {
  createdAt: number;
  effects: AudioEffectSettings;
  gains: number[];
  id: AudioEqualizerUserPresetId;
  name: string;
  updatedAt: number;
}

export interface AudioEqualizerCustomSlot {
  effects: AudioEffectSettings;
  gains: number[];
}

export interface AudioEqualizerStore {
  dialogTab: AudioSettingsTab;
  isDialogOpen: boolean;
  settings: AudioEqualizerSettings;
  applyPreset: (preset: AudioEqualizerModeId) => void;
  commitSettings: (settings: AudioEqualizerSettings) => void;
  createCustomPreset: (name?: string) => AudioEqualizerUserPresetId;
  deleteCustomPreset: (id: AudioEqualizerUserPresetId) => void;
  duplicateCustomPreset: (id: AudioEqualizerUserPresetId) => AudioEqualizerUserPresetId | null;
  closeDialog: () => void;
  openDialog: (tab?: AudioSettingsTab) => void;
  setBandGain: (index: number, gain: number) => void;
  setDialogTab: (tab: AudioSettingsTab) => void;
  setEnabled: (enabled: boolean) => void;
  setEffect: (id: AudioEffectId, value: number) => void;
  resetCustomSlot: (slot: AudioEqualizerCustomSlotId) => void;
  renameCustomPreset: (id: AudioEqualizerUserPresetId, name: string) => void;
}
