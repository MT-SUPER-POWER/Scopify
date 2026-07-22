"use client";

import { Volume2, Settings2, Shuffle, Heart, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import {
  getVisualizerBackgroundModeLabel,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/backgrounds/registry";
import {
  getVisualizerModeLabel,
  VISUALIZER_REGISTRY,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import { THEME_PRESETS } from "@/components/lyrics/folia/src/components/visualizer/themePresets";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
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

const QUICK_MODE_ICONS = [
  { mode: "classic", Icon: Shuffle },
  { mode: "monet", Icon: Heart },
  { mode: "fume", Icon: Plus },
] as const;

export function FoliaLyricsControls({ onOpenSettings, theme }: FoliaLyricsControlsProps) {
  const { t } = useTranslation();
  const model = useFoliaPanelControls();
  const isDaylight = theme.name === "snow";

  const currentPreset = THEME_PRESETS.find((p) => p.id === theme.name) ?? THEME_PRESETS[0];

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
      {/* Quick Mode Buttons */}
      <section className="flex items-center gap-2">
        {QUICK_MODE_ICONS.map(({ mode, Icon }) => {
          const isActive = model.visualizerMode === mode;
          return (
            <button
              key={mode}
              type="button"
              title={getVisualizerModeLabel(mode, (key) => String(t(key)))}
              onClick={() => model.setVisualizerMode(mode as LyricVisualizerMode)}
              className="flex size-10 items-center justify-center rounded-2xl transition-all"
              style={{
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.2)"
                  : colorWithAlpha(theme.backgroundColor, 0.3),
                color: isActive ? theme.primaryColor : theme.secondaryColor,
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </section>

      {/* Volume */}
      <section className="flex items-center gap-3">
        <button
          type="button"
          onClick={model.toggleMute}
          className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          style={{ color: theme.primaryColor }}
        >
          <Volume2 size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center justify-between text-xs"
            style={{ color: theme.secondaryColor }}
          >
            <span>{t("options.volume") ?? "音量"}</span>
            <span className="font-mono opacity-60">{model.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={model.volume}
            onChange={(event) => model.setVolume(parseInt(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>
      </section>

      {/* Lyrics Style */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenSettings("visualizer")}
            className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            style={{ color: theme.primaryColor }}
            title={String(t("options.openLyricsStyleSettings"))}
          >
            <Settings2 size={14} />
          </button>
          <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
            {t("options.lyricsRenderer")}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={String(t("options.lyricsRenderer"))}
            isDaylight={isDaylight}
            onChange={model.setVisualizerMode}
            options={visualizerOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerMode}
          />
        </span>
      </section>

      {/* Background */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenSettings("background")}
            className="rounded-md p-1 opacity-55 transition-opacity hover:bg-white/10 hover:opacity-100"
            style={{ color: theme.primaryColor }}
            title={String(t("options.previewBackgroundSettings"))}
          >
            <Settings2 size={14} />
          </button>
          <span className="text-xs font-medium opacity-60" style={{ color: theme.secondaryColor }}>
            {t("ui.background")}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          <FoliaQuickEffectPicker
            ariaLabel={String(t("options.visualizerBackgroundMode"))}
            isDaylight={isDaylight}
            onChange={model.setVisualizerBackgroundMode}
            options={backgroundOptions}
            primaryColor={theme.primaryColor}
            value={model.visualizerBackgroundMode}
          />
        </span>
      </section>

      {/* Theme Mode Selector */}
      <section className="space-y-2 pt-2">
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, 0.3) }}
        >
          <button
            type="button"
            className="flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              color: theme.primaryColor,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          >
            {t("options.themePresetsDefault") ?? "默认"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-full px-3 py-1.5 text-xs font-medium opacity-40 transition-colors hover:opacity-60"
            style={{ color: theme.primaryColor }}
          >
            AI{t("options.themePresetsDefault") === "墨染 / 素白" ? "主题" : "Theme"}
          </button>
          <button
            type="button"
            className="flex-1 rounded-full px-3 py-1.5 text-xs font-medium opacity-40 transition-colors hover:opacity-60"
            style={{ color: theme.primaryColor }}
          >
            {t("options.customTheme") ?? "自定义"}
          </button>
        </div>

        {/* Current Theme Name */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-xs opacity-55" style={{ color: theme.secondaryColor }}>
            {currentPreset.id === "snow" ? "☀️" : currentPreset.id === "midnight" ? "🌙" : "🎨"}
          </span>
          <span className="text-xs font-medium opacity-70" style={{ color: theme.primaryColor }}>
            {t(currentPreset.labelKey)}
          </span>
        </div>
      </section>
    </div>
  );
}
