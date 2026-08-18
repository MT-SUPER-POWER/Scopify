import React from "react";
import {
  getNomandEffectPanelColors,
  SliderRow,
  type NomandBackgroundEffectPanelProps,
  percent,
} from "./NomandBackgroundEffectPanel";

// src/components/visualizer/backgrounds/nomand/NomandPaperTextureSettings.tsx
// Renders the compact Paper Texture tuning panel.

const NomandPaperTextureSettings: React.FC<NomandBackgroundEffectPanelProps> = ({
  t,
  isDaylight,
  theme,
  rangeInputClass,
  tuning,
  onTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const { borderColor } = getNomandEffectPanelColors(theme, isDaylight);
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
        {t("folia.options.nomandBackgroundEffectPaperTexture")}
      </div>
      <SliderRow
        {...sliderProps}
        label={t("folia.options.nomandBackgroundPaperTextureContrast")}
        value={tuning.paperTextureContrast}
        min={0}
        max={1}
        step={0.05}
        format={percent}
        onChange={(paperTextureContrast) => onTuningChange?.({ paperTextureContrast })}
      />
      <SliderRow
        {...sliderProps}
        label={t("folia.options.nomandBackgroundPaperTextureRoughness")}
        value={tuning.paperTextureRoughness}
        min={0}
        max={1}
        step={0.05}
        format={percent}
        onChange={(paperTextureRoughness) => onTuningChange?.({ paperTextureRoughness })}
      />
      <SliderRow
        {...sliderProps}
        label={t("folia.options.nomandBackgroundPaperTextureFiber")}
        value={tuning.paperTextureFiber}
        min={0}
        max={1}
        step={0.05}
        format={percent}
        onChange={(paperTextureFiber) => onTuningChange?.({ paperTextureFiber })}
      />
    </div>
  );
};

export default NomandPaperTextureSettings;
