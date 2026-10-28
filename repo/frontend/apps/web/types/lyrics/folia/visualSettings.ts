import type { useFoliaStageSettingsPanel } from "@/hooks/player/useFoliaStageSettingsPanel";
import type { FoliaStageAssets } from "@/types/lyrics/folia/assets";
import type { FoliaStageEditSection } from "@/types/lyrics/folia/stage";
import type { Theme } from "@scopify/ui/folia";

export type FoliaVisualSettingsModel = ReturnType<typeof useFoliaStageSettingsPanel>;

export type FoliaStyleThumbnailProps = Omit<FoliaStyleShelfProps, "onSectionChange"> & {
  mode: string;
};

export interface FoliaVisualSettingsPanelProps {
  model: FoliaVisualSettingsModel;
  onOpenThemeLibrary: () => void;
}

export interface FoliaVisualSettingsSectionProps {
  model: FoliaVisualSettingsModel;
}

export interface FoliaStyleShelfProps {
  assets: FoliaStageAssets;
  theme: Theme;
  onSectionChange: (section: FoliaStageEditSection) => void;
}

export type FoliaPreviewHotspotSection = Exclude<FoliaStageEditSection, "common" | "global">;

export interface FoliaPreviewHotspot {
  section: FoliaPreviewHotspotSection;
  label: string;
  className: string;
  labelClassName: string;
}

export interface FoliaPreviewHotspotsProps {
  activeSection: FoliaStageEditSection;
  onSectionChange: (section: FoliaStageEditSection) => void;
  theme: Theme;
  labels: Record<FoliaPreviewHotspotSection, string>;
}
