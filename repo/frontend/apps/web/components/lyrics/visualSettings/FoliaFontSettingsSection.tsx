"use client";

import {
  FoliaSettingsGroup,
  FoliaSettingsRange,
  FoliaSettingsRow,
} from "@scopify/ui/scopify/components/folia-studio/settings";
import { FoliaThemeQuickPicker } from "@/components/lyrics/FoliaThemeQuickPicker";
import type { FoliaVisualSettingsPanelProps } from "@/types/lyrics/folia/visualSettings";

export function FoliaFontSettingsSection({
  model: m,
  onOpenThemeLibrary,
}: FoliaVisualSettingsPanelProps) {
  const { t } = m;
  return (
    <>
      <FoliaSettingsGroup title={t("folia.options.previewCommonSettings")}>
        <FoliaSettingsRow label={t("folia.options.fontFamily")}>
          <select
            aria-label={t("folia.options.fontFamily")}
            value={m.fontStyleValue}
            onChange={(e) => m.onFontStyleChange(e.target.value as typeof m.fontStyleValue)}
            className="max-w-44 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm"
          >
            {m.fontStyleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FoliaSettingsRow>
        <FoliaSettingsRange
          label={t("folia.options.fontSize")}
          min={0.85}
          max={1.4}
          step={0.05}
          value={m.fontScale}
          valueText={`${Math.round(m.fontScale * 100)}%`}
          onChange={m.onFontScaleChange}
        />
        <FoliaSettingsRange
          label={t("folia.options.visualizerOpacity")}
          min={0.2}
          max={1}
          step={0.05}
          value={m.visualizerOpacity}
          valueText={`${Math.round(m.visualizerOpacity * 100)}%`}
          onChange={m.onVisualizerOpacityChange}
        />
      </FoliaSettingsGroup>
      {m.fontStyleValue === "custom" ? (
        <button
          type="button"
          onClick={() => m.onFontStyleChange("custom")}
          className="rounded-lg bg-[var(--st-fill)] px-3 py-2 text-xs"
        >
          {t("folia.options.customFont")}
        </button>
      ) : null}
      <FoliaThemeQuickPicker theme={m.theme} onOpenThemeLibrary={onOpenThemeLibrary} />
    </>
  );
}
