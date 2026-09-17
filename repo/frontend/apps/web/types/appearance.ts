import type { ReactNode } from "react";

export type BuiltinThemeId = "silver" | "mist" | "sage" | "sand" | "lavender";
export type BackgroundPresetId = BuiltinThemeId | "custom" | `user:${string}`;
export type BackgroundRotation = "fixed" | "daily" | "schedule";
export interface SavedBackgroundTheme {
  id: `user:${string}`;
  name: string;
  top: string;
  bottom: string;
  intensity: number;
  height: number;
}
export interface ThemeTimeSlot {
  start: number;
  themeId: BackgroundPresetId;
}
export interface ThemeOption {
  id: BackgroundPresetId;
  name: string;
  top: string;
  bottom: string;
}
export interface ThemeEditorProps {
  theme: SavedBackgroundTheme;
  isNew: boolean;
  onClose: () => void;
}
export interface ThemeEditorFieldsProps {
  draft: SavedBackgroundTheme;
  onChange: (draft: SavedBackgroundTheme) => void;
}
export interface ThemeRotationDialogProps {
  mode: "daily" | "schedule";
  onClose: () => void;
}
export interface ThemeScheduleEditorProps {
  slots: ThemeTimeSlot[];
  options: ThemeOption[];
  onChange: (slots: ThemeTimeSlot[]) => void;
}
export interface ThemeTimelineProps {
  slots: ThemeTimeSlot[];
  options: ThemeOption[];
}
export interface ThemeCardProps {
  theme: ThemeOption;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  selectionMode?: boolean;
}
export interface SavedThemeLibraryProps {
  activeId: BackgroundPresetId;
  onCreate: () => void;
  onEdit: (theme: SavedBackgroundTheme) => void;
}
export interface ThemeBulkDeleteDialogProps {
  themes: SavedBackgroundTheme[];
  onClose: () => void;
  onConfirm: () => void;
}
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
  secondarySize: number;
  secondaryColor: string;
  showTranslation: boolean;
  autoCollapseChinese: boolean;
  maxWidth: number;
  textAlign: "left" | "center" | "right";
  backgroundColor: string;
  gradientColor: string;
  colorMode: "solid" | "gradient";
  gradientAngle: number;
  radius: number;
  blur: number;
  paddingX: number;
  paddingY: number;
  fontWeight: number;
  textShadow: boolean;
  entrance: "none" | "fade" | "slide" | "scale" | "typewriter";
  animationDuration: number;
  characterInterval: number;
  fillEnabled: boolean;
  unsungColor: string;
  fillDuration: number;
  fillSoftness: number;
}

export interface AppearanceStore {
  background: BackgroundSettings;
  themes: SavedBackgroundTheme[];
  dailyThemeIds: BackgroundPresetId[];
  schedule: ThemeTimeSlot[];
  applyTheme: (id: BackgroundPresetId) => void;
  saveTheme: (theme: SavedBackgroundTheme) => void;
  deleteTheme: (id: SavedBackgroundTheme["id"]) => void;
  deleteThemes: (ids: SavedBackgroundTheme["id"][]) => void;
  setDailyThemes: (ids: BackgroundPresetId[]) => void;
  setSchedule: (slots: ThemeTimeSlot[]) => void;
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
