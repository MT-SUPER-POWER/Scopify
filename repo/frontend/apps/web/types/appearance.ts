import type { ReactNode } from "react";

export type BackgroundPresetId = "silver" | "mist" | "sage" | "sand" | "lavender" | "custom";
export type BackgroundRotation = "fixed" | "daily";
export type LyricsPreviewFont = "sans" | "serif" | "mono";

export interface BackgroundSettings {
  preset: BackgroundPresetId;
  intensity: number;
  height: number;
  rotation: BackgroundRotation;
  customTop: string;
  customBottom: string;
}

export interface LyricsPreviewSettings {
  font: LyricsPreviewFont;
  fontSize: number;
  color: string;
  backdropOpacity: number;
}

export interface AppearanceStore {
  background: BackgroundSettings;
  lyricsPreview: LyricsPreviewSettings;
  updateBackground: (patch: Partial<BackgroundSettings>) => void;
  updateLyricsPreview: (patch: Partial<LyricsPreviewSettings>) => void;
  resetBackground: () => void;
  resetLyricsPreview: () => void;
}

export interface AppearancePreviewProps {
  children: ReactNode;
}

export interface AppBackgroundProps {
  className?: string;
}

export interface AppearanceRangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}
