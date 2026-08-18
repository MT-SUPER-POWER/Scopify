import React from "react";
import type { NomandBackgroundDitheringType } from "../../../../types";
import BackgroundToggleRow from "../BackgroundToggleRow";
import {
  getNomandEffectPanelColors,
  SliderRow,
  type NomandBackgroundEffectPanelProps,
} from "./NomandBackgroundEffectPanel";

// src/components/visualizer/backgrounds/nomand/NomandDitheringSettings.tsx
// Renders the legacy Nomand dithering controls.

const DITHERING_TYPES: NomandBackgroundDitheringType[] = ["2x2", "4x4", "8x8"];

const NomandDitheringSettings: React.FC<NomandBackgroundEffectPanelProps> = ({
  t,
  isDaylight,
  theme,
  rangeInputClass,
  tuning,
  onTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const { borderColor, selectedBg } = getNomandEffectPanelColors(theme, isDaylight);
  const sliderProps = {
    rangeInputClass,
    theme,
    onPointerDown: onSliderPointerDown,
    onPointerUp: onSliderCommit,
  };

  return (
    <div className="space-y-4 rounded-2xl border p-3" style={{ borderColor }}>
      <div
        className="text-xs font-medium tracking-[0.2em] uppercase"
        style={{ color: theme.secondaryColor }}
      >
        {t("folia.options.nomandBackgroundEffectDithering")}
      </div>
      <div className="space-y-2">
        <div className="text-sm" style={{ color: theme.primaryColor }}>
          {t("folia.options.nomandBackgroundDitheringType")}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DITHERING_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTuningChange?.({ ditheringType: type })}
              className="rounded-xl border p-2 text-xs"
              style={{
                borderColor: tuning.ditheringType === type ? theme.accentColor : borderColor,
                backgroundColor: tuning.ditheringType === type ? selectedBg : "transparent",
                color: theme.primaryColor,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <SliderRow
        {...sliderProps}
        label={t("folia.options.nomandBackgroundSize")}
        value={tuning.size}
        min={0.5}
        max={20}
        step={0.5}
        format={(value) => value.toFixed(1)}
        onChange={(size) => onTuningChange?.({ size })}
      />
      <SliderRow
        {...sliderProps}
        label={t("folia.options.nomandBackgroundColorSteps")}
        value={tuning.colorSteps}
        min={1}
        max={7}
        step={1}
        format={(value) => String(Math.round(value))}
        onChange={(colorSteps) => onTuningChange?.({ colorSteps })}
      />
      <BackgroundToggleRow
        label={t("folia.options.nomandBackgroundOriginalColors")}
        checked={tuning.originalColors}
        onChange={(originalColors) => onTuningChange?.({ originalColors })}
        theme={theme}
      />
      <BackgroundToggleRow
        label={t("folia.options.nomandBackgroundInverted")}
        checked={tuning.inverted}
        onChange={(inverted) => onTuningChange?.({ inverted })}
        theme={theme}
      />
    </div>
  );
};

export default NomandDitheringSettings;
