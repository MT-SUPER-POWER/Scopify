"use client";

import { SlidersHorizontal } from "lucide-react";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";

export function FoliaAudioSettingsControl({ theme }: { theme: Theme }) {
  const { t } = useI18n();
  const { musicQuality } = useMusicQuality();
  const equalizerEnabled = useAudioEqualizerStore((state) => state.settings.enabled);
  const openDialog = useAudioEqualizerStore((state) => state.openDialog);
  const isDaylight = theme.name === "snow";
  const currentQuality = QUALITY_OPTIONS.find((option) => option.value === musicQuality);
  const qualityLabel = currentQuality
    ? String(t(currentQuality.labelKey)).replace(/\s*\(.*?\)/g, "")
    : String(t("audioSettings.qualityTab"));
  const qualityBadgeLabel = currentQuality?.shortLabel ?? qualityLabel;

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`${t("audioSettings.qualityTab")}: ${qualityLabel}`}
        className={`inline-flex h-5 max-w-20 items-center rounded-md px-2 text-[9px] leading-none font-bold tracking-normal normal-case transition-colors ${
          isDaylight ? "hover:bg-white" : "hover:bg-white/14"
        }`}
        onClick={() => openDialog("quality")}
        title={`${t("audioSettings.qualityTab")}: ${qualityLabel}`}
        style={{
          backgroundColor: isDaylight ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.08)",
          color: theme.accentColor,
        }}
      >
        <span className="truncate">{qualityBadgeLabel}</span>
      </button>
      <button
        type="button"
        aria-label={t("audioEqualizer.open")}
        className={`inline-flex size-6 items-center justify-center rounded-md transition-colors ${
          isDaylight ? "hover:bg-black/8" : "hover:bg-white/10"
        }`}
        onClick={() => openDialog("equalizer")}
        title={t(equalizerEnabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
      >
        <SlidersHorizontal
          aria-hidden
          className={equalizerEnabled ? "opacity-100" : "opacity-55"}
          size={13}
          style={{ color: equalizerEnabled ? theme.accentColor : theme.primaryColor }}
        />
      </button>
    </span>
  );
}
