"use client";

import { useTranslation } from "react-i18next";
import { FoliaSlider } from "@scopify/ui/scopify/components/folia-panel/controls";
import { FoliaTooltip } from "@scopify/ui/scopify/components/folia-panel/tooltip";

import { AudioEqualizerSection } from "@/components/player/AudioEqualizerSection";
import { AUDIO_EFFECT_CONTROLS } from "@/constants/audioEqualizer";
import {
  AUDIO_EFFECT_SLIDER_MAX,
  formatEffectValue,
  fromEffectSliderPosition,
  toEffectSliderPosition,
} from "@/lib/player/audioEffectControls";
import type { AudioEqualizerEffectsProps } from "@/types/audio/equalizerPanelComponents";

// Folia's effect chain uses the same horizontal slider as its playback panel.
export function AudioEqualizerEffects({
  effects,
  onEffectChange,
  onCommit,
}: AudioEqualizerEffectsProps) {
  const { t } = useTranslation();
  return (
    <AudioEqualizerSection title={t("audioEqualizer.chain")} hint={t("audioEqualizer.chainHint")}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-x-7 gap-y-1.5 px-4 pt-3 pb-3.5">
        {AUDIO_EFFECT_CONTROLS.map((control) => {
          const value = effects[control.id];
          const neutral = value === control.neutral;
          const label = t(`audioEqualizer.effect.${control.id}`);
          const valueText = formatEffectValue(control, value);
          return (
            <div key={control.id} className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] leading-5">
                <span className="truncate">{label}</span>
                {(control.id === "crush" || control.id === "noise") && (
                  <FoliaTooltip
                    text={t("audioEqualizer.noiseHint")}
                    className="inline-flex shrink-0"
                  >
                    <span
                      className={`st-t-fast rounded px-[5px] text-[11px] leading-4 transition-colors ${
                        neutral
                          ? "bg-[var(--st-fill2)] text-[color:var(--st-t2)]"
                          : "bg-[var(--st-accent)] text-[color:var(--st-on-accent)]"
                      }`}
                    >
                      {t("audioEqualizer.noiseTag")}
                    </span>
                  </FoliaTooltip>
                )}
                <span className="ml-auto shrink-0 font-mono text-xs text-[color:var(--st-t2)]">
                  {valueText}
                </span>
              </div>
              <div className="mt-1 flex">
                <FoliaSlider
                  value={toEffectSliderPosition(control, value) / AUDIO_EFFECT_SLIDER_MAX}
                  label={label}
                  valueText={valueText}
                  onPreview={(position) => {
                    const next = fromEffectSliderPosition(
                      control,
                      position * AUDIO_EFFECT_SLIDER_MAX,
                    );
                    if (next !== value) onEffectChange(control.id, next);
                  }}
                  onCommit={onCommit}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AudioEqualizerSection>
  );
}
