import type { ReactNode } from "react";
import type { LyricsPreviewSettings } from "./appearance";

export interface SubtitleSettingsEditorProps {
  settings: LyricsPreviewSettings;
  onChange: (patch: Partial<LyricsPreviewSettings>) => void;
}

export interface SubtitlePayload {
  source: string;
  target: string;
  isChinese: boolean;
}
export interface SubtitleCapsuleProps {
  fillProgress?: number[];
  settings: LyricsPreviewSettings;
  payload: SubtitlePayload;
  replayId: number;
  playback: SubtitlePlayback;
  loop: boolean;
}
export type SubtitlePreviewScene = "short" | "long" | "bilingual" | "chinese";

export interface SubtitlePreviewControlsProps {
  activeScene: SubtitlePreviewScene | null;
  onSceneChange: (scene: SubtitlePreviewScene) => void;
  payload: SubtitlePayload;
  onPayloadChange: (payload: SubtitlePayload) => void;
}

export interface LyricsStylePreviewProps extends SubtitleCapsuleProps {
  note?: string;
  visible: boolean;
}

export interface SubtitlePlayback {
  position: number;
  startedAt: number | null;
}
export interface SubtitlePlaybackControlsProps {
  playback: SubtitlePlayback;
  duration: number;
  loop: boolean;
  onTogglePlayback: () => void;
  onReplay: () => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onLoopChange: (loop: boolean) => void;
}
export type SubtitlePalette = Pick<
  LyricsPreviewSettings,
  | "color"
  | "gradientColor"
  | "colorMode"
  | "gradientAngle"
  | "unsungColor"
  | "secondaryColor"
  | "backgroundColor"
  | "backdropOpacity"
>;

export interface BuiltinSubtitlePalette {
  id: `builtin:${string}`;
  label: "white" | "mint" | "sunset" | "ice";
  settings: SubtitlePalette;
}

export interface SubtitlePaletteFieldsProps {
  settings: SubtitlePalette;
  onChange: (patch: Partial<SubtitlePalette>) => void;
  readOnly?: boolean;
}

export interface SavedSubtitleTheme {
  id: string;
  name: string;
  settings: SubtitlePalette;
}
export interface SubtitleThemeStore {
  themes: SavedSubtitleTheme[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  save: (theme: SavedSubtitleTheme) => void;
  remove: (ids: string[]) => void;
}
export interface SubtitleThemeDeleteProps {
  themes: SavedSubtitleTheme[];
  onClose: () => void;
  onConfirm: () => void;
}
export interface SubtitleFillTextProps {
  progress?: number[];
  text: string;
  settings: LyricsPreviewSettings;
}

export interface SubtitleThemeCardProps {
  theme: SavedSubtitleTheme;
  selected: boolean;
  managing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export interface SubtitlePreviewWorkspaceProps {
  palettePreview?: boolean;
  settings: LyricsPreviewSettings;
  children: ReactNode;
  note?: string;
}

export interface SubtitleThemeEditorProps {
  themeId: string | null;
  copyFrom: string | null;
  useCurrent: boolean;
}
