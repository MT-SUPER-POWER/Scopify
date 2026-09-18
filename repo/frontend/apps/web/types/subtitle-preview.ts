import type { LyricsPreviewSettings } from "./appearance";

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
export interface SubtitleColorControlProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}
export type SubtitlePreviewScene = "short" | "long" | "bilingual" | "chinese";

export interface SubtitlePreviewControlsProps {
  activeScene: SubtitlePreviewScene | null;
  onSceneChange: (scene: SubtitlePreviewScene) => void;
  payload: SubtitlePayload;
  onPayloadChange: (payload: SubtitlePayload) => void;
}

export interface LyricsStylePreviewProps extends SubtitleCapsuleProps {
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
export interface SavedSubtitleTheme {
  kind?: "style" | "palette";
  id: string;
  name: string;
  settings: LyricsPreviewSettings;
}
export interface SubtitleThemeStore {
  themes: SavedSubtitleTheme[];
  save: (theme: SavedSubtitleTheme) => void;
  remove: (ids: string[]) => void;
}
export interface SubtitleThemeDialogProps {
  theme: SavedSubtitleTheme;
  onClose: () => void;
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
  onRename: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export interface SubtitleThemeLibraryProps {
  paletteOnly?: boolean;
}
export interface SubtitlePaletteEditorProps {
  settings: LyricsPreviewSettings;
  onChange: (settings: LyricsPreviewSettings) => void;
}
