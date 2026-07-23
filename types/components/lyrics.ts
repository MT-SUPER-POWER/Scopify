import type { Theme } from "@/components/lyrics/folia/src/types";
import type { ChangeEvent, DragEvent, RefObject } from "react";
import type { FoliaStageAssets } from "@/types/foliaAssets";
import type { LyricDisplayLine, LyricMatchCandidate } from "@/types/lyrics";
import type { SongDetail } from "@/types/api/music";
import type {
  FoliaQuickEffectPickerPosition,
  FoliaStageEditSection,
  FoliaStageTheme,
  FoliaThemeColors,
  FoliaThemeVariant,
} from "@/types/foliaStage";

export interface FoliaQuickEffectPickerOption<Value extends string> {
  label: string;
  value: Value;
}

export interface FoliaLyricsControlsProps {
  onOpenLyricMatch: () => void;
  theme: Theme;
}

export interface FoliaLyricMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaLyricMatchResultsProps {
  candidates: LyricMatchCandidate[];
  isDaylight: boolean;
  isLoading: boolean;
  onSelect: (id: number) => void;
  selectedId: number | null;
  song: SongDetail | null;
  theme: Theme;
}

export interface FoliaLyricMatchSearchProps {
  candidates: LyricMatchCandidate[];
  isDaylight: boolean;
  isLoading: boolean;
  onSearch: (query: string) => Promise<void>;
  onSelect: (id: number) => void;
  query: string;
  selectedId: number | null;
  setQuery: (query: string) => void;
  song: SongDetail | null;
  theme: Theme;
}

export interface FoliaLyricMatchPreviewProps {
  candidate: LyricMatchCandidate | null;
  isDaylight: boolean;
  isLoading: boolean;
  isPureMusic: boolean;
  previewLines: LyricDisplayLine[];
  song: SongDetail | null;
  theme: Theme;
}

export interface FoliaStageSettingsProps {
  assets: FoliaStageAssets;
  isChromeHidden: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
}

export interface FoliaSettingsPreviewProps {
  activeSection: FoliaStageEditSection;
  assets: FoliaStageAssets;
  onSectionChange: (section: FoliaStageEditSection) => void;
  theme: Theme;
}

export interface FoliaVisualSettingsDialogProps {
  assets: FoliaStageAssets;
  isOpen: boolean;
  onClose: () => void;
  onOpenFontPicker: (target: "lyrics" | "subtitle") => void;
  onOpenThemeLibrary: () => void;
  onSectionChange: (section: FoliaStageEditSection) => void;
  section: FoliaStageEditSection;
  theme: Theme;
}

export interface FoliaThemeColorEditorProps {
  onDraftChange: (theme: FoliaStageTheme) => void;
  theme: FoliaStageTheme;
  variant: FoliaThemeVariant;
}

export interface FoliaThemeEditorProps {
  assets: FoliaStageAssets;
  onSelectTheme: (id: string) => void;
  selectedTheme: FoliaStageTheme;
}

export interface FoliaThemeLibraryDialogProps {
  assets: FoliaStageAssets;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaThemeLibraryListProps {
  onSelectTheme: (id: string) => void;
  selectedThemeId: string;
}

export interface FoliaThemeJsonTransferProps {
  onSelectTheme: (id: string) => void;
  theme: FoliaStageTheme;
}

export type FoliaThemeImportMode = "new" | "overwrite";

export type FoliaThemeJsonValidation = "empty" | "invalid" | "valid";

export interface FoliaThemeJsonExportProps {
  colors: FoliaThemeColors;
  json: string;
  onCopy: () => void;
  onDownload: () => void;
}

export interface FoliaThemeJsonImportProps {
  colors: FoliaThemeColors;
  currentThemeName: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  importMode: FoliaThemeImportMode;
  isDragOver: boolean;
  json: string;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onImportModeChange: (mode: FoliaThemeImportMode) => void;
  onJsonChange: (json: string) => void;
  themeName: string | null;
  validation: FoliaThemeJsonValidation;
}

export interface FoliaThemeJsonImportPreviewProps {
  colors: FoliaThemeColors;
  currentThemeName: string;
  importMode: FoliaThemeImportMode;
  onImportModeChange: (mode: FoliaThemeImportMode) => void;
  themeName: string | null;
  validation: FoliaThemeJsonValidation;
}

export interface FoliaThemeQuickPickerProps {
  onOpenThemeLibrary: () => void;
  theme: Theme;
}

export interface FoliaQuickEffectPickerProps<Value extends string> {
  ariaLabel: string;
  isDaylight: boolean;
  onChange: (value: Value) => void;
  options: FoliaQuickEffectPickerOption<Value>[];
  primaryColor: string;
  value: Value;
}

export interface FoliaQuickEffectPickerMenuProps<
  Value extends string,
> extends FoliaQuickEffectPickerProps<Value> {
  isOpen: boolean;
  menuPosition: FoliaQuickEffectPickerPosition;
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}
