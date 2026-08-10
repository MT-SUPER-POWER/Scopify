"use client";

import { Power } from "lucide-react";

import {
  AUDIO_EQUALIZER_BANDS,
  AUDIO_EQUALIZER_MAX_GAIN_DB,
  AUDIO_EQUALIZER_MIN_GAIN_DB,
} from "@/constants/audioEqualizer";
import { cn } from "@/lib/utils";
import { useAudioEqualizerStore } from "@/store/module/audioEqualizer";
import { useI18n } from "@/store/module/i18n";
import type { AudioEqualizerModeId } from "@/types/audioEqualizer";

const PRESET_IDS: AudioEqualizerModeId[] = [
  "flat",
  "lofi",
  "radio",
  "vinyl",
  "vocal",
  "bass",
  "custom",
];

export function AudioEqualizerPanel() {
  const { t } = useI18n();
  const settings = useAudioEqualizerStore((state) => state.settings);
  const applyPreset = useAudioEqualizerStore((state) => state.applyPreset);
  const setBandGain = useAudioEqualizerStore((state) => state.setBandGain);
  const setEnabled = useAudioEqualizerStore((state) => state.setEnabled);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={settings.enabled}
          onClick={() => setEnabled(!settings.enabled)}
          className={cn(
            "border-brand/15 bg-brand/5 text-content-muted hover:border-brand/30 hover:bg-brand/10 hover:text-brand flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
            settings.enabled && "border-brand/40 text-brand",
          )}
        >
          <Power className="size-3.5" />
          {t(settings.enabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
        </button>
        {PRESET_IDS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={settings.preset === preset}
            onClick={() => applyPreset(preset)}
            className={cn(
              "border-brand/15 bg-brand/5 text-content-muted hover:border-brand/30 hover:bg-brand/10 hover:text-brand rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
              settings.preset === preset && "border-brand/40 bg-brand/10 text-brand",
            )}
          >
            {t(`audioEqualizer.preset.${preset}`)}
          </button>
        ))}
      </div>

      <div className="border-brand/20 bg-brand/5 overflow-x-auto rounded-2xl border p-4">
        <div className="text-content-muted mb-4 flex min-w-130 items-center justify-between text-[10px] font-semibold tracking-widest uppercase">
          <span>{t("audioEqualizer.bandGain")}</span>
          <span>+12 dB · 0 · −12 dB</span>
        </div>
        <div className="grid min-w-130 grid-cols-10 gap-2">
          {AUDIO_EQUALIZER_BANDS.map((band, index) => {
            const gain = settings.gains[index] ?? 0;
            return (
              <label key={band.frequency} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "text-content-muted text-[10px] font-semibold tabular-nums",
                    gain !== 0 && "text-brand",
                  )}
                >
                  {gain > 0 ? "+" : ""}
                  {gain}
                </span>
                <input
                  type="range"
                  min={AUDIO_EQUALIZER_MIN_GAIN_DB}
                  max={AUDIO_EQUALIZER_MAX_GAIN_DB}
                  step={1}
                  value={gain}
                  aria-label={`${band.label} Hz`}
                  onChange={(event) => setBandGain(index, Number(event.currentTarget.value))}
                  className="bg-brand/15 accent-brand h-32 w-1.5 cursor-pointer appearance-none rounded-full"
                  style={{ direction: "rtl", writingMode: "vertical-lr" }}
                />
                <span className="text-content-muted text-[10px] font-semibold tabular-nums">
                  {band.label}
                </span>
              </label>
            );
          })}
        </div>
        <div className="text-content-subtle mt-2 min-w-130 text-center text-[9px] tracking-widest uppercase">
          Hz
        </div>
      </div>
    </div>
  );
}
