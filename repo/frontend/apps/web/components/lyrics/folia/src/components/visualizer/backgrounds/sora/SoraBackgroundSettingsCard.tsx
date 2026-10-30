import type { TranslateFn } from "@/types/i18n.generated";
import {
  DEFAULT_SORA_BACKGROUND_TUNING,
  type SoraBackgroundTuning,
  type Theme,
} from "../../../../types";
import { colorWithAlpha } from "../../colorMix";
import BackgroundToggleRow from "../BackgroundToggleRow";

// src/components/visualizer/backgrounds/sora/SoraBackgroundSettingsCard.tsx
// UI controls for Sora starfield tuning.

interface SoraBackgroundSettingsCardProps {
  t?: TranslateFn;
  isDaylight: boolean;
  theme: Theme;
  controlCardBg: string;
  rangeInputClass: string;
  tuning: SoraBackgroundTuning;
  onTuningChange?: (patch: Partial<SoraBackgroundTuning>) => void;
  vignetteDisabled?: boolean;
  onVignetteDisabledChange?: (disabled: boolean) => void;
  onSliderPointerDown?: () => void;
  onSliderCommit?: () => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  theme: Theme;
  rangeInputClass: string;
  onChange: (value: number) => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  format,
  theme,
  rangeInputClass,
  onChange,
  onPointerDown,
  onPointerUp,
}) => (
  <label className="block space-y-2">
    <span className="flex justify-between gap-3 text-sm" style={{ color: theme.primaryColor }}>
      <span>{label}</span>
      <span className="font-mono opacity-70">{format ? format(value) : value}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className={rangeInputClass}
    />
  </label>
);

export default function SoraBackgroundSettingsCard({
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass,
  tuning,
  onTuningChange,
  vignetteDisabled = false,
  onVignetteDisabledChange,
  onSliderPointerDown,
  onSliderCommit,
}: SoraBackgroundSettingsCardProps) {
  const borderColor = colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16);

  return (
    <div
      className="space-y-4 rounded-[24px] border p-4"
      style={{ backgroundColor: controlCardBg, borderColor }}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
          {t ? t("folia.options.soraBackgroundSettings") : "空背景设置"}
        </div>
        <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
          滑块动起来，实时改动粒子速度、亮度和闪烁。
        </div>
      </div>

      <BackgroundToggleRow
        label={t ? t("folia.options.soraBlank") : "完全空白"}
        description={
          t
            ? t("folia.options.soraBlankDesc")
            : "不再渲染 WebGL 星空，只显示静态纯色画面：夜间纯黑，日间纯白。适合搭配视频层使用。"
        }
        checked={Boolean(tuning.blank)}
        onChange={(blank) => onTuningChange?.({ blank })}
        theme={theme}
      />

      <BackgroundToggleRow
        label={t ? t("folia.options.disableVisualizerVignette") : "禁用暗角"}
        description={t ? t("folia.options.disableVisualizerVignetteDesc") : undefined}
        checked={vignetteDisabled}
        onChange={onVignetteDisabledChange}
        theme={theme}
      />

      {!vignetteDisabled && (
        <SliderRow
          label={t ? t("folia.options.soraVignetteSpread") : "暗角范围"}
          value={tuning.vignetteSpread ?? DEFAULT_SORA_BACKGROUND_TUNING.vignetteSpread!}
          min={10}
          max={60}
          step={1}
          format={(value) => `${value}%`}
          theme={theme}
          rangeInputClass={rangeInputClass}
          onChange={(vignetteSpread) => onTuningChange?.({ vignetteSpread })}
          onPointerDown={onSliderPointerDown}
          onPointerUp={onSliderCommit}
        />
      )}

      {!tuning.blank && (
        <div className="space-y-3 rounded-2xl border p-3" style={{ borderColor }}>
          <SliderRow
            label="星点密度"
            value={tuning.starDensity}
            min={0.35}
            max={2}
            step={0.05}
            format={(value) => value.toFixed(2)}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(starDensity) => onTuningChange?.({ starDensity })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="星点大小"
            value={tuning.starSize}
            min={0.2}
            max={2.5}
            step={0.05}
            format={(value) => value.toFixed(2)}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(starSize) => onTuningChange?.({ starSize })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="流动速度"
            value={tuning.starSpeed}
            min={0.2}
            max={3}
            step={0.05}
            format={(value) => value.toFixed(2)}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(starSpeed) => onTuningChange?.({ starSpeed })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="闪烁强度"
            value={tuning.twinkleIntensity}
            min={0}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(twinkleIntensity) => onTuningChange?.({ twinkleIntensity })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="强调色比例"
            value={tuning.accentRatio}
            min={0}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(accentRatio) => onTuningChange?.({ accentRatio })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="歌曲节拍跟随"
            value={tuning.audioSyncStrength}
            min={0}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(audioSyncStrength) => onTuningChange?.({ audioSyncStrength })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <SliderRow
            label="背景亮度"
            value={tuning.backgroundBrightness}
            min={0.1}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            theme={theme}
            rangeInputClass={rangeInputClass}
            onChange={(backgroundBrightness) => onTuningChange?.({ backgroundBrightness })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
        </div>
      )}
    </div>
  );
}
