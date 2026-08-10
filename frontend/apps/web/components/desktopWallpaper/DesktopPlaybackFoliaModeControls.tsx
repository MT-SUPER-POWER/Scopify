"use client";

import { Activity, ImageIcon, Waves } from "lucide-react";

import {
  DESKTOP_FOLIA_ANIMATION_OPTIONS,
  DESKTOP_FOLIA_BACKGROUND_OPTIONS,
  DESKTOP_FOLIA_VISUALIZER_OPTIONS,
} from "@/constants/desktopPlaybackController";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useLyricStageStore } from "@/store/module/lyrics";

export function DesktopPlaybackFoliaModeControls() {
  const { t } = useI18n();
  const settings = useLyricStageStore();

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-content-muted flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
          <Waves className="size-3.5" />
          {t("folia.options.lyricsRenderer")}
        </span>
        <select
          aria-label={t("folia.options.lyricsRenderer")}
          className="border-border bg-surface-overlay text-content h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-current"
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
        <span className="text-content-muted flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
          <ImageIcon className="size-3.5" />
          {t("folia.options.visualizerBackgroundMode")}
        </span>
        <select
          aria-label={t("folia.options.visualizerBackgroundMode")}
          className="border-border bg-surface-overlay text-content h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-current"
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
        <span className="text-content-muted flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase">
          <Activity className="size-3.5" />
          {t("folia.options.animationIntensity")}
        </span>
        <div className="bg-surface-overlay grid grid-cols-3 gap-1 rounded-lg p-1">
          {DESKTOP_FOLIA_ANIMATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={settings.animationIntensity === option.value}
              className={cn(
                "h-8 rounded-md text-xs transition-colors",
                settings.animationIntensity === option.value
                  ? "bg-content/12 text-content font-medium"
                  : "text-content-muted hover:text-content",
              )}
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
          className="accent-brand h-1.5 w-full cursor-pointer"
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
