"use client";

import {
  getVisualizerBackgroundRegistryEntry,
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import VideoLayerSettingsSection from "@/components/lyrics/folia/src/components/modal/settings/VideoLayerSettingsSection";
import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";

export function FoliaBackgroundSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const mode = m.backgroundConfig.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;
  const entry = getVisualizerBackgroundRegistryEntry(mode);
  return (
    <div className="folia-studio-tuning space-y-6">
      {entry.renderSettingsPanel?.({
        ...m,
        config: m.backgroundConfig,
        actions: m.backgroundActions,
      })}
      <VideoLayerSettingsSection {...m} />
    </div>
  );
}
