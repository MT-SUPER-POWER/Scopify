"use client";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { FoliaVisualizerControls } from "@/components/lyrics/FoliaVisualizerControls";
import type { FoliaStageEditSection } from "@/types/foliaStage";

interface FoliaPanelSettingsProps {
  onOpenSettings: (section: FoliaStageEditSection) => void;
  onOpenThemeLibrary: () => void;
  theme: Theme;
}

export function FoliaPanelSettings({
  onOpenSettings,
  onOpenThemeLibrary,
  theme,
}: FoliaPanelSettingsProps) {
  return (
    <div>
      <FoliaVisualizerControls
        onOpenSettings={onOpenSettings}
        onOpenThemeLibrary={onOpenThemeLibrary}
        theme={theme}
      />
    </div>
  );
}
