"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@scopify/ui/shadcn/components/tabs";
import { FoliaFontSettingsSection } from "@/components/lyrics/FoliaFontSettingsSection";
import { FoliaSubtitleSettingsSection } from "@/components/lyrics/FoliaSubtitleSettingsSection";
import { FoliaBackgroundSettingsSection } from "@/components/lyrics/FoliaBackgroundSettingsSection";
import { FoliaVisualizerSettingsSection } from "@/components/lyrics/FoliaVisualizerSettingsSection";
import { FoliaGlobalSettingsCard } from "@/components/lyrics/FoliaGlobalSettingsCard";
import type { FoliaStageEditSection } from "@/types/foliaStage";
import type { FoliaVisualSettingsPanelProps } from "@/types/foliaVisualSettings";
import {
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
  getVisualizerBackgroundRegistryEntry,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";

export function FoliaVisualSettingsPanel({
  model,
  onOpenThemeLibrary,
}: FoliaVisualSettingsPanelProps) {
  const { t, activeSection, onSectionChange, theme } = model;
  const sections = [
    { value: "visualizer", label: t("folia.options.previewVisualizerSettings") },
    { value: "background", label: t("folia.options.previewBackgroundSettings") },
    { value: "common", label: t("folia.options.fontFamily") },
    { value: "subtitle", label: t("folia.options.previewSubtitleSettings") },
    { value: "global", label: t("folia.options.lyricsGlobalSettings") },
  ];
  const reset =
    activeSection === "visualizer"
      ? model.onResetVisualizerTuning
      : activeSection === "background"
        ? () =>
            getVisualizerBackgroundRegistryEntry(
              model.backgroundConfig.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE,
            ).resetSettings?.(model.backgroundActions)
        : activeSection === "subtitle"
          ? model.onResetSubtitleSettings
          : activeSection === "global"
            ? undefined
            : model.onResetCommonSettings;
  return (
    <Tabs
      value={activeSection}
      onValueChange={(value) => onSectionChange(value as FoliaStageEditSection)}
      className="min-h-0 gap-0"
    >
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-[var(--st-line)] px-4 sm:pl-6">
        <TabsList variant="line" className="folia-studio-tab-list min-w-0 flex-1">
          {sections.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="folia-studio-tab">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {reset ? (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded px-1 text-xs text-[color:var(--st-t2)] hover:text-[color:var(--st-t1)]"
          >
            {t("folia.ui.default")}
          </button>
        ) : null}
      </div>
      {sections.map(({ value }) => (
        <TabsContent
          key={value}
          value={value}
          className="st-scroll m-0 min-h-0 space-y-6 px-4 pt-6 pb-10 sm:pl-6 lg:overflow-y-auto"
        >
          {value === "visualizer" && <FoliaVisualizerSettingsSection model={model} />}
          {value === "background" && <FoliaBackgroundSettingsSection model={model} />}
          {value === "common" && (
            <FoliaFontSettingsSection model={model} onOpenThemeLibrary={onOpenThemeLibrary} />
          )}
          {value === "subtitle" && <FoliaSubtitleSettingsSection model={model} />}
          {value === "global" && (
            <FoliaGlobalSettingsCard controlCardBg="var(--st-card)" theme={theme} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
