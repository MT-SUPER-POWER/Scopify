import React, { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { FolderOpen, KeyRound, X } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import type { TranslateFn } from "@/types/i18n/model";
import type { Theme } from "../../../types";
import { colorWithAlpha } from "../../visualizer/colorMix";
import {
  ensureVideoLayerFileRestored,
  useVideoLayerSettingsStore,
  VIDEO_LAYER_OPACITY_BOUNDS,
  type VideoLayerFit,
} from "../../../stores/useVideoLayerSettingsStore";

// src/components/modal/settings/VideoLayerSettingsSection.tsx
// Settings for the built-in video layer behind the lyrics. Reads the store directly.
// Deliberately outside the appearance import/export payload and the OBS sources.

interface VideoLayerSettingsSectionProps {
  t: TranslateFn;
  isDaylight: boolean;
  theme: Theme;
  controlCardBg: string;
  rangeInputClass?: string;
}

const FIT_OPTIONS: Array<[VideoLayerFit, TranslationKey]> = [
  ["cover", "folia.options.videoLayerFitCover"],
  ["contain", "folia.options.videoLayerFitContain"],
];

const VideoLayerSettingsSection: React.FC<VideoLayerSettingsSectionProps> = ({
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass = "accent-current",
}) => {
  const settings = useVideoLayerSettingsStore(
    useShallow((state) => ({
      enabled: state.videoLayerEnabled,
      url: state.videoLayerUrl,
      opacity: state.videoLayerOpacity,
      fit: state.videoLayerFit,
      localFileName: state.localFileName,
      localFileStatus: state.localFileStatus,
      canPersistLocalFile: state.canPersistLocalFile,
    })),
  );
  const actions = useVideoLayerSettingsStore(
    useShallow((state) => ({
      setEnabled: state.setVideoLayerEnabled,
      setUrl: state.setVideoLayerUrl,
      setOpacity: state.setVideoLayerOpacity,
      setFit: state.setVideoLayerFit,
      pickLocalFile: state.pickLocalFile,
      clearLocalFile: state.clearLocalFile,
      regrantLocalFile: state.regrantLocalFile,
    })),
  );
  const [urlDraft, setUrlDraft] = useState(settings.url);

  useEffect(() => {
    ensureVideoLayerFileRestored();
  }, []);

  useEffect(() => {
    setUrlDraft(settings.url);
  }, [settings.url]);

  const handlePick = async () => {
    try {
      await actions.pickLocalFile();
    } catch (error) {
      console.error("[VideoLayer] Failed to pick a video:", error);
    }
  };

  const hasLocalFile = settings.localFileStatus !== "none";
  const borderColor = colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16);

  const getAccentOptionStyle = (active: boolean): React.CSSProperties =>
    active
      ? {
          borderColor: theme.accentColor,
          boxShadow: `inset 0 0 0 1px ${theme.accentColor}`,
          backgroundColor: colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16),
        }
      : {
          borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16),
          backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
        };

  return (
    <div
      className="space-y-4 rounded-[24px] border p-4"
      style={{ backgroundColor: controlCardBg, borderColor }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
            {t("folia.options.videoLayerEnabled")}
          </div>
          <div className="max-w-[400px] text-xs opacity-50" style={{ color: theme.secondaryColor }}>
            {t("folia.options.videoLayerDesc")}
          </div>
        </div>
        <button
          onClick={() => actions.setEnabled(!settings.enabled)}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          style={{
            backgroundColor: settings.enabled
              ? theme.secondaryColor
              : colorWithAlpha(theme.secondaryColor, 0.18),
          }}
          aria-pressed={settings.enabled}
          aria-label={t("folia.options.videoLayerEnabled")}
          type="button"
        >
          <div
            className={`size-5 rounded-full shadow-sm transition-transform ${
              settings.enabled ? "translate-x-5" : "translate-x-0"
            }`}
            style={{ backgroundColor: theme.backgroundColor }}
          />
        </button>
      </div>

      <div
        className="space-y-2 border-t pt-4"
        style={{ borderColor: colorWithAlpha(theme.secondaryColor, 0.1) }}
      >
        <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
          {t("folia.options.videoLayerLocalFile")}
        </div>
        <div className="max-w-[400px] text-xs opacity-50" style={{ color: theme.secondaryColor }}>
          {t(
            settings.canPersistLocalFile
              ? "folia.options.videoLayerLocalFileDesc"
              : "folia.options.videoLayerLocalFileSessionDesc",
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handlePick()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all"
            style={{
              ...getAccentOptionStyle(false),
              color: theme.primaryColor,
            }}
          >
            <FolderOpen size={12} className="opacity-70" />
            <span>{t("folia.options.videoLayerPickFile")}</span>
          </button>
          {settings.localFileStatus === "needs-permission" && (
            <button
              type="button"
              onClick={() => void actions.regrantLocalFile()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all"
              style={{
                ...getAccentOptionStyle(true),
                color: theme.primaryColor,
              }}
            >
              <KeyRound size={12} className="opacity-70" />
              <span>{t("folia.options.videoLayerRegrant")}</span>
            </button>
          )}
          {hasLocalFile && (
            <span
              className="flex min-w-0 items-center gap-1 text-xs"
              style={{ color: theme.secondaryColor }}
            >
              <span className="max-w-[220px] truncate" title={settings.localFileName ?? undefined}>
                {settings.localFileName}
              </span>
              <button
                type="button"
                onClick={() => void actions.clearLocalFile()}
                className="rounded p-0.5 opacity-60 hover:opacity-100"
                aria-label={t("folia.options.videoLayerClearFile")}
                title={t("folia.options.videoLayerClearFile")}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
          {t("folia.options.videoLayerUrl")}
        </div>
        <div className="max-w-[400px] text-xs opacity-50" style={{ color: theme.secondaryColor }}>
          {t("folia.options.videoLayerUrlDesc")}
        </div>
        <input
          type="url"
          value={urlDraft}
          placeholder="https://example.com/loop.mp4"
          onChange={(event) => setUrlDraft(event.target.value)}
          onBlur={() => actions.setUrl(urlDraft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") actions.setUrl(urlDraft);
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs transition-colors focus:border-white/30 focus:outline-none"
          style={{ color: theme.primaryColor }}
        />
      </div>

      <div
        className="space-y-4 border-t pt-4"
        style={{ borderColor: colorWithAlpha(theme.secondaryColor, 0.1) }}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
              {t("folia.options.videoLayerOpacity")}
            </div>
            <span className="shrink-0 font-mono text-xs" style={{ color: theme.primaryColor }}>
              {Math.round(settings.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={VIDEO_LAYER_OPACITY_BOUNDS.min}
            max={VIDEO_LAYER_OPACITY_BOUNDS.max}
            step={0.05}
            value={settings.opacity}
            onChange={(event) => actions.setOpacity(Number(event.currentTarget.value))}
            className={`w-full ${rangeInputClass}`}
            style={{ accentColor: theme.accentColor }}
            aria-label={t("folia.options.videoLayerOpacity")}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
            {t("folia.options.videoLayerFit")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {FIT_OPTIONS.map(([value, labelKey]) => (
              <button
                key={value}
                type="button"
                onClick={() => actions.setFit(value)}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-all"
                style={{
                  ...getAccentOptionStyle(settings.fit === value),
                  color: theme.primaryColor,
                }}
              >
                <span className="text-xs font-semibold">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs opacity-50" style={{ color: theme.secondaryColor }}>
        {t("folia.options.videoLayerNotInExport")}
      </div>
    </div>
  );
};

export default VideoLayerSettingsSection;
