"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRow,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import {
  getVisualizerBackgroundRegistryEntry,
  getVisualizerBackgroundModeLabel,
  VISUALIZER_BACKGROUND_REGISTRY,
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import VideoLayerSettingsSection from "@/components/lyrics/folia/src/components/modal/settings/VideoLayerSettingsSection";
import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";

export function FoliaBackgroundSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const mode = m.backgroundConfig.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;
  const entry = getVisualizerBackgroundRegistryEntry(mode);
  return (
    <>
      <FoliaSettingsGroup title={m.t("folia.options.previewBackgroundSettings")}>
        <FoliaSettingsRow label={m.t("folia.options.visualizerBackgroundMode")}>
          <select
            aria-label={m.t("folia.options.visualizerBackgroundMode")}
            value={mode}
            onChange={(e) => m.backgroundActions.onModeChange?.(e.target.value as typeof mode)}
            className="max-w-44 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm"
          >
            {VISUALIZER_BACKGROUND_REGISTRY.map((option) => (
              <option key={option.mode} value={option.mode}>
                {getVisualizerBackgroundModeLabel(option.mode, m.t)}
              </option>
            ))}
          </select>
        </FoliaSettingsRow>
      </FoliaSettingsGroup>
      <div className="folia-studio-tuning space-y-6">
        {entry.renderSettingsPanel?.({
          ...m,
          config: m.backgroundConfig,
          actions: m.backgroundActions,
        })}
        <VideoLayerSettingsSection {...m} />
      </div>
    </>
  );
}
