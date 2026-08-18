"use client";

import { SlidersHorizontal } from "lucide-react";

import { FoliaQuickEffectPicker } from "@/components/lyrics/FoliaQuickEffectPicker";
import { QUALITY_OPTIONS } from "@/constants/playerBar";
import { useMusicQuality } from "@/hooks/player/useMusicQuality";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type { FoliaAudioSettingsControlProps } from "@/types/components/lyrics";
import type { MusicQuality } from "@/types/player";

export function FoliaAudioSettingsControl({
  onOpenEqualizer,
  theme,
}: FoliaAudioSettingsControlProps) {
  const { t } = useI18n();
  const { changeMusicQuality, musicQuality } = useMusicQuality();
  const equalizerEnabled = useAudioEqualizerStore((state) => state.settings.enabled);
  const isDaylight = theme.name === "snow";
  const qualityOptions = QUALITY_OPTIONS.map((option) => ({
    label: option.shortLabel ?? String(t(option.labelKey)).replace(/\s*\(.*?\)/g, ""),
    value: option.value as MusicQuality,
  }));

  return (
    <div className="flex items-center gap-1.5">
      <FoliaQuickEffectPicker
        ariaLabel={t("audioSettings.qualityTab")}
        isDaylight={isDaylight}
        onChange={(quality) => void changeMusicQuality(quality)}
        options={qualityOptions}
        primaryColor={theme.accentColor}
        value={musicQuality}
      />
      <button
        type="button"
        aria-label={t("audioEqualizer.open")}
        className={`inline-flex size-6 items-center justify-center rounded-md transition-colors ${
          isDaylight ? "hover:bg-black/8" : "hover:bg-white/10"
        }`}
        onClick={onOpenEqualizer}
        title={t(equalizerEnabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
      >
        <SlidersHorizontal
          aria-hidden
          className={equalizerEnabled ? "opacity-100" : "opacity-55"}
          size={13}
          style={{ color: equalizerEnabled ? theme.accentColor : theme.primaryColor }}
        />
      </button>
    </div>
  );
}
