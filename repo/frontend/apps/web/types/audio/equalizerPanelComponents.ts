import type { ReactNode } from "react";

import type { AudioEffectId, AudioEffectSettings } from "./equalizer";

export interface AudioEqualizerPanelSectionProps {
  hint?: string;
  announceHint?: boolean;
  grow?: boolean;
  children: ReactNode;
  title: string;
}

export interface AudioEqualizerBandsProps {
  gains: number[];
  onBandChange: (index: number, value: number) => void;
  onCommit: () => void;
}

export interface AudioEqualizerEffectsProps {
  effects: AudioEffectSettings;
  onEffectChange: (id: AudioEffectId, value: number) => void;
  onCommit: () => void;
}

export interface AudioFaderScale {
  min: number;
  max: number;
  step: number;
}

export interface AudioFaderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  valueText: string;
  onPreview: (value: number) => void;
  onCommit: () => void;
  glide?: boolean;
}
