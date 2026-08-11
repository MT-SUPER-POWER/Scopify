"use client";

import { Power } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      {/* Controls row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-pressed={settings.enabled}
          onClick={() => setEnabled(!settings.enabled)}
          className={cn(
            "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            settings.enabled && "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          <Power className="size-3" />
          {t(settings.enabled ? "audioEqualizer.enabled" : "audioEqualizer.disabled")}
        </button>

        <Select
          value={settings.preset}
          onValueChange={(val) => applyPreset(val as AudioEqualizerModeId)}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs font-medium">
            <SelectValue placeholder="预设" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_IDS.map((preset) => (
              <SelectItem key={preset} value={preset} className="text-xs">
                {t(`audioEqualizer.preset.${preset}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* EQ bands */}
      <div className="bg-muted/40 border-border rounded-xl border p-3">
        <div className="text-muted-foreground mb-3 flex items-center justify-between text-[10px] font-semibold tracking-widest uppercase">
          <span>{t("audioEqualizer.bandGain")}</span>
          <span>+12 dB · 0 · −12 dB</span>
        </div>
        <div className="flex justify-between">
          {AUDIO_EQUALIZER_BANDS.map((band, index) => {
            const gain = settings.gains[index] ?? 0;
            return (
              <label key={band.frequency} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "text-muted-foreground text-[10px] font-semibold tabular-nums",
                    gain !== 0 && "text-primary",
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
                  className="accent-primary bg-border h-24 w-1.5 cursor-pointer appearance-none rounded-full"
                  style={{ direction: "rtl", writingMode: "vertical-lr" }}
                />
                <span className="text-muted-foreground text-[10px] font-semibold tabular-nums">
                  {band.label}
                </span>
              </label>
            );
          })}
        </div>
        <div className="text-muted-foreground mt-2 text-center text-[9px] tracking-widest uppercase">
          Hz
        </div>
      </div>
    </div>
  );
}
