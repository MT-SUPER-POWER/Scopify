"use client";

import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import { FoliaThemeQuickPicker } from "@/components/lyrics/FoliaThemeQuickPicker";
import { FoliaVolumeControl } from "@/components/lyrics/FoliaVolumeControl";
import {
  getVisualizerBackgroundModeLabel,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  getVisualizerModeLabel,
  VISUALIZER_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useFoliaPanelControls } from "@/hooks/player/useFoliaPanelControls";
import type { FoliaLyricsControlsProps } from "@/types/components/lyrics";
import type { LyricVisualizerMode } from "@/types/lyrics";

function isLyricVisualizerMode(mode: string): mode is LyricVisualizerMode {
  return (
    mode === "cadenza" ||
    mode === "cappella" ||
    mode === "claddagh" ||
    mode === "classic" ||
    mode === "diorama" ||
    mode === "fume" ||
    mode === "monet" ||
    mode === "partita" ||
    mode === "tilt"
  );
}

export function FoliaLyricsControls({
  onOpenSettings,
  onOpenThemeLibrary,
  theme,
}: FoliaLyricsControlsProps) {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const isDaylight = theme.name === "snow";
  const translate = (key: string) => String(t(key));

  const visualizerOptions = VISUALIZER_REGISTRY.flatMap((entry) =>
    isLyricVisualizerMode(entry.mode)
      ? [
          {
            label: getVisualizerModeLabel(entry.mode, (key) => String(t(key))),
            value: entry.mode,
          },
        ]
      : [],
  );
  const backgroundOptions = VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
    label: getVisualizerBackgroundModeLabel(entry.mode, (key) => String(t(key))),
    value: entry.mode,
  }));

  return (
    <div className="space-y-3">
      <FoliaVolumeControl
        onChange={model.setVolume}
        onToggleMute={model.toggleMute}
        theme={theme}
        volume={model.volume}
      />

      <FoliaThemeQuickPicker onOpenThemeLibrary={onOpenThemeLibrary} theme={theme} />

      {/* Lyrics Style */}
      <section className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {translate("options.lyricsRenderer")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={String(t("options.lyricsRenderer"))}
            isDaylight={isDaylight}
            onChange={model.setVisualizerMode}
            options={visualizerOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerMode}
          />
          <button
            type="button"
            onClick={() => onOpenSettings("visualizer")}
            className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            style={{ color: theme.primaryColor }}
            title={String(t("options.openLyricsStyleSettings"))}
          >
            <Settings2 size={14} />
          </button>
        </span>
      </section>

      {/* Background */}
      <section className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
          {translate("ui.background")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={String(t("options.visualizerBackgroundMode"))}
            isDaylight={isDaylight}
            onChange={model.setVisualizerBackgroundMode}
            options={backgroundOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerBackgroundMode}
          />
          <button
            type="button"
            onClick={() => onOpenSettings("background")}
            className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            style={{ color: theme.primaryColor }}
            title={String(t("options.previewBackgroundSettings"))}
          >
            <Settings2 size={14} />
          </button>
        </span>
      </section>
    </div>
  );
}
