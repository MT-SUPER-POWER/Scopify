import type { Theme } from "@/components/lyrics/folia/src/types";
import type { RefObject } from "react";
import type { FoliaStageAssets } from "@/types/foliaAssets";
import type {
  FoliaQuickEffectPickerPosition,
  FoliaStageEditSection,
  FoliaStageTheme,
  FoliaThemeVariant,
} from "@/types/foliaStage";

export interface FoliaQuickEffectPickerOption<Value extends string> {
  label: string;
  value: Value;
}

export interface FoliaLyricsControlsProps {
  onOpenSettings: (section: FoliaStageEditSection) => void;
  onOpenThemeLibrary: () => void;
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
