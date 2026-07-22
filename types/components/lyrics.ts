import type { Theme } from "@/components/lyrics/folia/src/types";
import type { FoliaStageAssets } from "@/types/foliaAssets";
import type { FoliaPlaybackBridge, FoliaStageEditSection } from "@/types/foliaStage";

export interface FoliaQuickEffectPickerOption<Value extends string> {
  label: string;
  value: Value;
}

export interface FoliaLyricsControlsProps {
  onOpenSettings: (section: FoliaStageEditSection) => void;
  theme: Theme;
}

export interface FoliaStageSettingsProps {
  assets: FoliaStageAssets;
  bridge: FoliaPlaybackBridge;
  isChromeHidden: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
}

export interface FoliaSettingsPreviewProps {
  assets: FoliaStageAssets;
  bridge: FoliaPlaybackBridge;
  theme: Theme;
}

export interface FoliaVisualSettingsDialogProps {
  assets: FoliaStageAssets;
  bridge: FoliaPlaybackBridge;
  isOpen: boolean;
  onClose: () => void;
  onOpenFontPicker: (target: "lyrics" | "subtitle") => void;
  onSectionChange: (section: FoliaStageEditSection) => void;
  section: FoliaStageEditSection;
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
