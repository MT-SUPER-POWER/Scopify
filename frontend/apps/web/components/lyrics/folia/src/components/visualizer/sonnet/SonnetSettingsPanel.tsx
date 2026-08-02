import React, { useMemo } from "react";
import {
  DEFAULT_SONNET_TUNING,
  type SonnetOuterFrameMode,
  type SonnetTuning,
} from "../../../types";
import { colorWithAlpha } from "../colorMix";
import type { VisualizerSettingsPanelProps } from "../definition";
import VisualizerPresetGroup, { type VisualizerPresetOption } from "../VisualizerPresetGroup";
import { SonnetRangeControl, SonnetSettingsSection } from "./SonnetSettingsControls";

// src/components/visualizer/sonnet/SonnetSettingsPanel.tsx
// Keeps Sonnet's tuning controls adjacent to the mode implementation.
const SonnetSettingsPanel: React.FC<VisualizerSettingsPanelProps> = ({
  t,
  isDaylight,
  theme,
  rangeInputClass,
  controlCardBg,
  sonnetTuning = DEFAULT_SONNET_TUNING,
  onSonnetTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const booleanOptions: VisualizerPresetOption<boolean>[] = useMemo(
    () => [
      { value: true, label: t("folia.options.sonnetToggleOn") || "开启" },
      { value: false, label: t("folia.options.sonnetToggleOff") || "关闭" },
    ],
    [t],
  );

  const outerFrameOptions: VisualizerPresetOption<SonnetOuterFrameMode>[] = useMemo(
    () => [
      { value: "none", label: t("folia.options.sonnetOuterFrameNone") || "完全隐藏" },
      { value: "frame", label: t("folia.options.sonnetOuterFrameFrame") || "仅显示框架" },
      { value: "full", label: t("folia.options.sonnetOuterFrameFull") || "完全显示" },
    ],
    [t],
  );

  const visibilityControls: Array<{
    key: Extract<
      keyof SonnetTuning,
      | "showOnlyText"
      | "showGuide"
      | "showBackgroundMg"
      | "showFixedGeo"
      | "showGiantDecorativeText"
      | "showBackgroundDecor"
      | "enableTransitions"
    >;
    label: string;
  }> = [
    { key: "showOnlyText", label: t("folia.options.sonnetShowOnlyText") || "仅显示文字" },
    { key: "showGuide", label: t("folia.options.sonnetShowGuide") || "轨迹线" },
    { key: "showBackgroundMg", label: t("folia.options.sonnetShowBackgroundMg") || "主场景" },
    { key: "showFixedGeo", label: t("folia.options.sonnetShowFixedGeo") || "文字浮标" },
    {
      key: "showGiantDecorativeText",
      label: t("folia.options.sonnetShowGiantDecorativeText") || "巨型装饰镂空文字",
    },
    {
      key: "showBackgroundDecor",
      label: t("folia.options.sonnetShowBackgroundDecor") || "背景装饰",
    },
    { key: "enableTransitions", label: t("folia.options.sonnetEnableTransitions") || "场景转场" },
  ];

  const motionControls: Array<{
    key: Extract<keyof SonnetTuning, "cameraIntensity" | "typographyMotion" | "mgDensity">;
    label: string;
  }> = [
    { key: "cameraIntensity", label: t("folia.options.sonnetCameraIntensity") },
    { key: "typographyMotion", label: t("folia.options.sonnetTypographyMotion") },
    { key: "mgDensity", label: t("folia.options.sonnetMgDensity") },
  ];

  return (
    <div
      className="space-y-4 rounded-[24px] border border-white/10 p-4"
      style={{ backgroundColor: controlCardBg }}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {t("folia.options.sonnetSettings")}
        </div>
        <div className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
          {t("folia.options.sonnetSettingsDesc")}
        </div>
      </div>

      <SonnetSettingsSection title={t("folia.options.sonnetQualitySection")}>
        <div
          className="space-y-2.5 rounded-2xl border p-3.5"
          style={{
            borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.14),
            backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
          }}
        >
          <SonnetRangeControl
            label={t("folia.options.sonnetTextureResolution")}
            value={sonnetTuning.textureResolution}
            min={0.5}
            max={4}
            step={0.25}
            rangeInputClass={rangeInputClass}
            onChange={(textureResolution) => onSonnetTuningChange?.({ textureResolution })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
          <p
            className="text-xs leading-relaxed opacity-60"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("folia.options.sonnetTexturePerformanceWarning")}
          </p>
        </div>
      </SonnetSettingsSection>

      <SonnetSettingsSection title={t("folia.options.sonnetMotionSection")}>
        {motionControls.map((control) => (
          <SonnetRangeControl
            key={control.key}
            label={control.label}
            value={sonnetTuning[control.key]}
            rangeInputClass={rangeInputClass}
            onChange={(value) => onSonnetTuningChange?.({ [control.key]: value })}
            onPointerDown={onSliderPointerDown}
            onPointerUp={onSliderCommit}
          />
        ))}
      </SonnetSettingsSection>

      <SonnetSettingsSection title={t("folia.options.sonnetDisplaySection")}>
        <VisualizerPresetGroup
          label={t("folia.options.sonnetOuterFrameMode")}
          value={sonnetTuning.outerFrameMode}
          options={outerFrameOptions}
          onChange={(outerFrameMode) => onSonnetTuningChange?.({ outerFrameMode })}
          isDaylight={isDaylight}
          theme={theme}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {visibilityControls.map((control) => (
            <VisualizerPresetGroup
              key={control.key}
              label={control.label}
              value={sonnetTuning[control.key]}
              options={booleanOptions}
              onChange={(next) => onSonnetTuningChange?.({ [control.key]: next })}
              isDaylight={isDaylight}
              theme={theme}
            />
          ))}
        </div>
      </SonnetSettingsSection>
    </div>
  );
};

export default SonnetSettingsPanel;
