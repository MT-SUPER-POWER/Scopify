import type { LyricDisplayLine } from "./model";

export type LyricSegmentationOverrides = Record<string, string[]>;

export interface LyricSegmentationSettings {
  automatic: boolean;
  overrides?: LyricSegmentationOverrides;
}

export interface LyricSegmentationEdit {
  trackId: string;
  line: LyricDisplayLine;
  boundaries: string[] | null;
}

export interface LyricSegmentationLineEditorProps {
  text: string;
  saved?: string[];
  automatic: boolean;
  isSaving: boolean;
  onSave: (boundaries: string[] | null) => void;
}
