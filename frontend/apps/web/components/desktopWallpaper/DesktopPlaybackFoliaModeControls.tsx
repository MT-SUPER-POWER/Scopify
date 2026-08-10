"use client";

import { Activity, ImageIcon, Waves } from "lucide-react";

import {
  DESKTOP_FOLIA_ANIMATION_OPTIONS,
  DESKTOP_FOLIA_BACKGROUND_OPTIONS,
  DESKTOP_FOLIA_VISUALIZER_OPTIONS,
} from "@/constants/desktopPlaybackController";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

export function DesktopPlaybackFoliaModeControls() {
  const { t } = useI18n();
  const settings = useLyricStageStore();

  return (
    <div className="desktop-controller-card space-y-3 rounded-2xl p-3">
      <label className="block space-y-2">
        <span className="text-content-muted flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
          <Waves className="size-3.5" />
          {t("folia.options.lyricsRenderer")}
        </span>
        <select
          aria-label={t("folia.options.lyricsRenderer")}
          className="desktop-controller-field h-9 w-full rounded-xl px-3 text-xs transition"
          onChange={(event) => {
            const option = DESKTOP_FOLIA_VISUALIZER_OPTIONS.find(
              ({ value }) => value === event.currentTarget.value,
            );
            if (option) settings.requestVisualizerMode(option.value);
          }}
          value={settings.mode}
        >
          {DESKTOP_FOLIA_VISUALIZER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-content-muted flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
          <ImageIcon className="size-3.5" />
          {t("folia.options.visualizerBackgroundMode")}
        </span>
        <select
          aria-label={t("folia.options.visualizerBackgroundMode")}
          className="desktop-controller-field h-9 w-full rounded-xl px-3 text-xs transition"
          onChange={(event) => {
            const option = DESKTOP_FOLIA_BACKGROUND_OPTIONS.find(
              ({ value }) => value === event.currentTarget.value,
            );
            if (option) settings.setBackgroundMode(option.value);
          }}
          value={settings.background.mode ?? "latent"}
        >
          {DESKTOP_FOLIA_BACKGROUND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-content-muted flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
          <Activity className="size-3.5" />
          {t("folia.options.animationIntensity")}
        </span>
        <div className="desktop-controller-segment grid grid-cols-3 gap-1 rounded-xl p-1">
          {DESKTOP_FOLIA_ANIMATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.animationIntensity === option.value}
              className="desktop-controller-segment-button h-8 rounded-lg text-xs transition"
              data-active={settings.animationIntensity === option.value}
              onClick={() => settings.patchSettings({ animationIntensity: option.value })}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <label className="text-content-muted block space-y-2 text-xs">
        <span className="flex items-center justify-between gap-3">
          <span>{t("folia.options.visualizerOpacity")}</span>
          <span className="tabular-nums">{Math.round(settings.visualizerOpacity * 100)}%</span>
        </span>
        <input
          type="range"
          aria-label={t("folia.options.visualizerOpacity")}
          className="desktop-controller-range w-full cursor-pointer"
          max={100}
          min={20}
          onChange={(event) =>
            settings.patchSettings({
              visualizerOpacity: Number(event.currentTarget.value) / 100,
            })
          }
          step={1}
          value={Math.round(settings.visualizerOpacity * 100)}
        />
      </label>
    </div>
  );
}
