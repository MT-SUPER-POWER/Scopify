"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRange,
  FoliaSettingsToggle,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import type { FoliaVisualSettingsSectionProps } from "@/types/lyrics/folia/visualSettings";

/** The cloud-step group shown in Folia's lyric-style studio. Keep the two stagger bounds ordered. */
export function FoliaPartitaSettingsSection({ model: m }: FoliaVisualSettingsSectionProps) {
  const { t, partitaTuning: tuning, onPartitaTuningChange: patch } = m;
  const min = Math.min(tuning.staggerMin, tuning.staggerMax);
  const max = Math.max(tuning.staggerMin, tuning.staggerMax);
  return (
    <FoliaSettingsGroup title={t("folia.options.partitaSettings")}>
      <FoliaSettingsToggle
        label={t("folia.options.partitaGuideLines")}
        checked={tuning.showGuideLines}
        onChange={(showGuideLines) => patch({ showGuideLines })}
      />
      <FoliaSettingsToggle
        label={t("folia.options.partitaSemanticLayout")}
        checked={tuning.useSemanticLayout}
        onChange={(useSemanticLayout) => patch({ useSemanticLayout })}
      />
      <FoliaSettingsRange
        label={t("folia.options.partitaStaggerMin")}
        min={0}
        max={180}
        step={5}
        value={min}
        valueText={`${min}px`}
        onChange={(staggerMin) => patch({ staggerMin, staggerMax: Math.max(staggerMin, max) })}
      />
      <FoliaSettingsRange
        label={t("folia.options.partitaStaggerMax")}
        min={0}
        max={180}
        step={5}
        value={max}
        valueText={`${max}px`}
        onChange={(staggerMax) => patch({ staggerMax, staggerMin: Math.min(min, staggerMax) })}
      />
    </FoliaSettingsGroup>
  );
}
