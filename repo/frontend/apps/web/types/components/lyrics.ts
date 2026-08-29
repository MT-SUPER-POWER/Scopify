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

export interface FoliaVisualizerPresetOption<T> {
  label: string;
  value: T;
}

export interface FoliaVisualizerPresetGroupProps<T> {
  isDaylight: boolean;
  label: string;
  onChange: (next: T) => void;
  options: FoliaVisualizerPresetOption<T>[];
  theme: Theme;
  value: T;
}

export interface FoliaQuickEffectPickerOption<Value extends string> {
  label: string;
  value: Value;
}

export interface FoliaLyricsControlsProps {
  onOpenFoliaSettings: () => void;
  onOpenLyricMatch: () => void;
  theme: Theme;
}

export interface FoliaAudioSettingsControlProps {
  onOpenEqualizer: () => void;
  theme: Theme;
}

export interface FoliaPanelControlsProps extends FoliaAudioSettingsControlProps {
  onOpenFoliaSettings: () => void;
  onOpenLyricMatch: () => void;
}

export interface FoliaLyricTimelineOffsetControlProps {
  isDaylight: boolean;
  offsetMs: number;
  onOffsetChange: (offsetMs: number) => void;
  onOpenSettings?: () => void;
}

export interface FoliaAudioEqualizerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaVideoExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaGlobalLyricOffsetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaGlobalSettingsCardProps {
  controlCardBg: string;
  theme: Theme;
}

export interface FoliaHarmonySettingsCardProps {
  className?: string;
  controlCardBg: string;
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
  onVisualSettingsOpenChange: (open: boolean) => void;
  theme: Theme;
  themeLibraryRequestId: number;
}

export interface FoliaSonnetPerformanceWarningDialogProps {
  dontShowAgain: boolean;
  isDaylight: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDontShowAgainChange: (enabled: boolean) => void;
}

export interface FoliaSettingsPreviewProps {
  activeSection: FoliaStageEditSection;
  assets: FoliaStageAssets;
  onSectionChange: (section: FoliaStageEditSection) => void;
  theme: Theme;
  themeEditorContext?: FoliaThemePreviewContext;
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
  draftTheme: FoliaStageTheme;
  onDeleteTheme: () => void;
  onDraftChange: (theme: FoliaStageTheme) => void;
  onSelectTheme: (id: string) => void;
  selectedTheme: FoliaStageTheme;
  themeEditorContext: FoliaThemePreviewContext;
}

export interface FoliaThemeLibraryDialogProps {
  assets: FoliaStageAssets;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export interface FoliaThemeLibraryListProps {
  activeThemeId: string;
  collapsed: boolean;
  isDirty: boolean;
  onSelectTheme: (id: string) => void;
  onToggleCollapsed: () => void;
  selectedThemeId: string;
}

export interface FoliaThemePreviewContext {
  isApplied: boolean;
  isDirty: boolean;
  saveState: FoliaThemeSaveState;
  variant: FoliaThemeVariant;
}

export type FoliaThemeSaveState = "idle" | "saved";

export type FoliaThemePendingAction = { kind: "close" } | { kind: "select"; themeId: string };

export interface FoliaThemeLibraryPanelHandle {
  collapse: () => void;
  expand: () => void;
  isCollapsed: () => boolean;
}

export interface FoliaThemeLibraryItemProps {
  activeThemeId: string;
  collapsed: boolean;
  onSelect: () => void;
  selected: boolean;
  theme: FoliaStageTheme;
}

export interface FoliaThemeWorkbenchHeaderProps {
  activeThemeId: string;
  draftTheme: FoliaStageTheme;
  isDirty: boolean;
  onClose: () => void;
  onReset: () => void;
  onSaveAndApply: () => void;
  saveState: FoliaThemeSaveState;
  selectedThemeId: string;
  theme: Theme;
}

export interface FoliaThemeWorkbenchLayoutProps {
  activeThemeId: string;
  assets: FoliaStageAssets;
  draftTheme: FoliaStageTheme;
  isDirty: boolean;
  onDeleteTheme: () => void;
  onDraftChange: (theme: FoliaStageTheme) => void;
  onSelectTheme: (id: string) => void;
  selectedTheme: FoliaStageTheme;
  selectedThemeId: string;
  themeEditorContext: FoliaThemePreviewContext;
}

export interface FoliaThemeUnsavedDialogProps {
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  open: boolean;
}

export type FoliaThemeEditorTab = "edit" | "import-export";

export interface FoliaThemeEditorPanelProps {
  draftTheme: FoliaStageTheme;
  onDeleteTheme: () => void;
  onDraftChange: (theme: FoliaStageTheme) => void;
  onSelectTheme: (id: string) => void;
  selectedTheme: FoliaStageTheme;
}

export interface FoliaThemeIdentityControlsProps {
  draftTheme: FoliaStageTheme;
  onDeleteTheme: () => void;
  onDraftChange: (theme: FoliaStageTheme) => void;
}

export interface FoliaThemePreviewToolbarProps {
  context: FoliaThemePreviewContext;
  isPaused: boolean;
  modeLabel: string;
  onPauseChange: (paused: boolean) => void;
  onRestart: () => void;
  theme: Theme;
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
  moreActionLabel?: string;
  onChange: (value: Value) => void;
  onMoreAction?: () => void;
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
