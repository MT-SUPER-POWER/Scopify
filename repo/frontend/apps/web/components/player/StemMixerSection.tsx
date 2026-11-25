"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FoliaToggle } from "@scopify/ui/scopify/components/folia-panel/controls";

import { AudioEqualizerSection } from "@/components/player/AudioEqualizerSection";
import { AudioFader } from "@/components/player/AudioFader";
import {
  STEM_MIXER_GAIN_MAX,
  STEM_MIXER_GAIN_MIN,
  STEM_MIXER_PRESETS,
  STEM_MIXER_STEMS,
} from "@/constants/stemMixer";
import { hasStemMixerPlatform } from "@/lib/player/stemMixer/availability";
import { cn } from "@/lib/utils";
import { useStemMixerStore } from "@/store/module/stemMixer";

const PRESETS = ["reset", "karaoke", "vocals"] as const;
const FADER_STEP = 0.05;

// 预设按钮的样子同 ModCurveNotice 的动作按钮；选中的那组同 PresetChips 选中的样子。
const CHIP_CLASS =
  "st-t-fast h-7 whitespace-nowrap rounded-lg px-3 text-[13px] transition-[background-color,color,scale] active:scale-[0.96]";
const CHIP_IDLE =
  "bg-[var(--st-fill)] text-[color:var(--st-t2)] hover:bg-[var(--st-fill2)] hover:text-[color:var(--st-t1)]";
const CHIP_CHOSEN = "bg-[var(--st-accent)] text-[color:var(--st-on-accent)]";

const formatGain = (gain: number) => `${gain.toFixed(2)}×`;

export function StemMixerSection() {
  const { t } = useTranslation();
  const switchLabel = useId();
  const { enabled, gains, phase, block, setEnabled, setGain, commitGains, applyPreset } =
    useStemMixerStore();
  const unavailable = block ?? (hasStemMixerPlatform() ? null : "noGpu");
  const live = enabled && unavailable === null;
  const chosen = PRESETS.find((preset) =>
    STEM_MIXER_PRESETS[preset].every((gain, index) => gain === gains[index]),
  );
  // 关着时变淡、仍够得着：先调好再开。
  const controls = (
    <div className={cn("st-t-move transition-opacity", !live && "opacity-40")}>
      <div className="grid grid-cols-4 gap-2 px-4 pt-3">
        {STEM_MIXER_STEMS.map((stem, index) => {
          const gain = gains[index];
          const name = t(`stemMixer.stem.${stem}`);
          return (
            <div
              key={stem}
              className="flex min-h-[168px] flex-col items-center gap-1.5 font-mono text-[11px] leading-4"
            >
              <span
                aria-hidden
                className={gain === 1 ? "text-[color:var(--st-t3)]" : "text-[color:var(--st-t1)]"}
              >
                {formatGain(gain)}
              </span>
              <AudioFader
                value={gain}
                min={STEM_MIXER_GAIN_MIN}
                max={STEM_MIXER_GAIN_MAX}
                step={FADER_STEP}
                label={name}
                valueText={formatGain(gain)}
                onPreview={(value) => setGain(stem, value)}
                onCommit={commitGains}
              />
              <span aria-hidden className="font-sans text-xs text-[color:var(--st-t2)]">
                {name}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-3.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={chosen === preset}
            className={`${CHIP_CLASS} ${chosen === preset ? CHIP_CHOSEN : CHIP_IDLE}`}
            onClick={() => applyPreset(preset)}
          >
            {t(`stemMixer.preset.${preset}`)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AudioEqualizerSection
      title={t("stemMixer.title")}
      hint={live && phase !== "off" ? t(`stemMixer.status.${phase}`) : undefined}
      announceHint
    >
      <div className="flex items-start gap-3 px-4 pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-5">{t("stemMixer.hint")}</p>
          <p className="mt-0.5 text-xs leading-[18px] text-[color:var(--st-t2)]">
            {unavailable ? t(`stemMixer.block.${unavailable}`) : t("stemMixer.status.off")}
          </p>
        </div>
        <div className="flex shrink-0 items-center pt-0.5">
          <span id={switchLabel} className="sr-only">
            {t("stemMixer.toggle")}
          </span>
          <FoliaToggle
            checked={live}
            onChange={setEnabled}
            disabled={unavailable !== null}
            labelledBy={switchLabel}
          />
        </div>
      </div>
      {/* GPU 分不了时不画推子，只留原因。 */}
      {unavailable ? <div className="pb-3.5" /> : controls}
    </AudioEqualizerSection>
  );
}
