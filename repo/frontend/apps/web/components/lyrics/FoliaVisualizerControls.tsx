"use client";

import { Dices } from "lucide-react";
import { useI18n } from "@/store/module/i18n";

import { FoliaAnimationIntensityControl } from "@/components/lyrics/FoliaAnimationIntensityControl";
import { FoliaBackgroundQuickControl } from "@/components/lyrics/FoliaBackgroundQuickControl";
import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import { FoliaThemeQuickPicker } from "@/components/lyrics/FoliaThemeQuickPicker";
import {
  getVisualizerBackgroundModeLabel,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  getVisualizerModeLabel,
  VISUALIZER_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import type { FoliaStageEditSection } from "@/types/foliaStage";
import { useLyricStageStore } from "@/store/module/lyrics";

const INTENSITY_VISUALIZER_MODES = new Set<string>([
  "classic",
  "cadenza",
  "partita",
  "fume",
  "monet",
  "cappella",
  "claddagh",
  "diorama",
  "pendolo",
  "sonnet",
]);

interface FoliaVisualizerControlsProps {
  onOpenSettings: (section: FoliaStageEditSection) => void;
  onOpenThemeLibrary: () => void;
  theme: Theme;
}

export function FoliaVisualizerControls({
  onOpenSettings,
  onOpenThemeLibrary,
  theme,
}: FoliaVisualizerControlsProps) {
  const { t } = useI18n();
  const model = useFoliaPanelControls();
  const randomVisualizerMode = useLyricStageStore((state) => state.randomVisualizerMode);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);
  const isDaylight = theme.name === "snow";
  const visualizerOptions = VISUALIZER_REGISTRY.map((entry) => ({
    label: getVisualizerModeLabel(entry.mode, t),
    value: entry.mode,
  }));
  const backgroundOptions = VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
    label: getVisualizerBackgroundModeLabel(entry.mode, t),
    value: entry.mode,
  }));
  const supportsAnimationIntensity = INTENSITY_VISUALIZER_MODES.has(model.visualizerMode);
  const stepButtonClass =
    "rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100";

  return (
    <div className="space-y-3 border-t border-white/5">
      <FoliaThemeQuickPicker onOpenThemeLibrary={onOpenThemeLibrary} theme={theme} />

      <section className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {t("folia.options.lyricsRenderer")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={t("folia.options.lyricsRenderer")}
            isDaylight={isDaylight}
            moreActionLabel={t("folia.ui.moreSettings")}
            onChange={model.setVisualizerMode}
            onMoreAction={() => onOpenSettings("visualizer")}
            options={visualizerOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerMode}
          />
          {supportsAnimationIntensity ? (
            <FoliaAnimationIntensityControl isDaylight={isDaylight} theme={theme} />
          ) : null}
          <button
            aria-pressed={randomVisualizerMode}
            className={stepButtonClass}
            onClick={() => patchSettings({ randomVisualizerMode: !randomVisualizerMode })}
            style={{ color: randomVisualizerMode ? theme.accentColor : theme.primaryColor }}
            title={t("folia.options.randomVisualizerMode")}
            type="button"
          >
            <Dices size={14} />
          </button>
        </span>
      </section>

      <section className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {t("folia.ui.background")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={t("folia.options.visualizerBackgroundMode")}
            isDaylight={isDaylight}
            moreActionLabel={t("folia.ui.moreSettings")}
            onChange={model.setVisualizerBackgroundMode}
            onMoreAction={() => onOpenSettings("background")}
            options={backgroundOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerBackgroundMode}
          />
          <FoliaBackgroundQuickControl isDaylight={isDaylight} theme={theme} />
        </span>
      </section>
    </div>
  );
}
