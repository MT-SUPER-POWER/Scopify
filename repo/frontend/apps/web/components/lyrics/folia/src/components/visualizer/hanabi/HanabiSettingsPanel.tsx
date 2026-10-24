import React from "react";
import type { TranslationKey } from "@/lib/i18n";
import { DEFAULT_HANABI_TUNING, type HanabiTuning } from "../../../types";
import type { VisualizerSettingsPanelProps } from "../definition";
import VisualizerPresetGroup from "../VisualizerPresetGroup";
import { TemperaRangeControl, TemperaSettingsSection } from "../tempera/TemperaSettingsControls";

// src/components/visualizer/hanabi/HanabiSettingsPanel.tsx
// 花火's tuning: fireworks, stage, text, decorations, colours and performance, in Folia's groups
// (hanabi/HanabiSettingsPanel.tsx). Sliders follow the host's draft / commit-on-release contract.

type NumberKey = {
  [K in keyof HanabiTuning]: HanabiTuning[K] extends number ? K : never;
}[keyof HanabiTuning];
type BooleanKey = {
  [K in keyof HanabiTuning]: HanabiTuning[K] extends boolean ? K : never;
}[keyof HanabiTuning];

interface SliderSpec {
  kind: "slider";
  key: NumberKey;
  labelKey: TranslationKey;
  min: number;
  max: number;
  step?: number;
  noteKey?: TranslationKey;
}
interface ToggleSpec {
  kind: "toggle";
  key: BooleanKey;
  labelKey: TranslationKey;
  noteKey?: TranslationKey;
}
type ControlSpec = SliderSpec | ToggleSpec;

const slider = (
  key: NumberKey,
  labelKey: TranslationKey,
  min: number,
  max: number,
  extra: Partial<SliderSpec> = {},
): SliderSpec => ({ kind: "slider", key, labelKey, min, max, ...extra });
const toggle = (
  key: BooleanKey,
  labelKey: TranslationKey,
  noteKey?: TranslationKey,
): ToggleSpec => ({
  kind: "toggle",
  key,
  labelKey,
  noteKey,
});

const GROUPS: Array<{ titleKey: TranslationKey; controls: ControlSpec[] }> = [
  {
    titleKey: "folia.options.hanabiFireworksSection",
    controls: [
      slider("sparkAmount", "folia.options.hanabiSparkAmount", 0, 2),
      slider("glow", "folia.options.hanabiGlow", 0, 2),
      slider("chorusBloom", "folia.options.hanabiChorusBloom", 0, 2, {
        noteKey: "folia.options.hanabiChorusBloomHint",
      }),
      slider("bloom", "folia.options.hanabiBloom", 0, 2, {
        noteKey: "folia.options.hanabiBloomHint",
      }),
      toggle("launches", "folia.options.hanabiLaunches", "folia.options.hanabiLaunchesHint"),
    ],
  },
  {
    titleKey: "folia.options.hanabiStageSection",
    controls: [
      slider("sky", "folia.options.hanabiSky", 0, 1, {
        step: 0.01,
        noteKey: "folia.options.hanabiSkyHint",
      }),
      slider("riseSpeed", "folia.options.hanabiRiseSpeed", 0, 2, {
        noteKey: "folia.options.hanabiRiseSpeedHint",
      }),
      slider("spin", "folia.options.hanabiSpin", 0, 2, { noteKey: "folia.options.hanabiSpinHint" }),
      slider("ambient", "folia.options.hanabiAmbient", 0, 2),
      toggle("overlayFrame", "folia.options.hanabiOverlayFrame"),
    ],
  },
  {
    titleKey: "folia.options.hanabiTextSection",
    controls: [
      toggle("textOnly", "folia.options.hanabiTextOnly", "folia.options.hanabiTextOnlyHint"),
      slider("textMotion", "folia.options.hanabiTextMotion", 0, 2),
      slider("blockOpacity", "folia.options.hanabiBlockOpacity", 0, 1, { step: 0.01 }),
    ],
  },
  {
    titleKey: "folia.options.hanabiDecorSection",
    controls: [
      slider("collage", "folia.options.hanabiCollage", 0, 2, {
        noteKey: "folia.options.hanabiCollageHint",
      }),
      slider("ornamentAmount", "folia.options.hanabiOrnamentAmount", 0, 2),
    ],
  },
];

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="-mt-2 text-xs leading-relaxed opacity-55"
    style={{ color: "var(--text-secondary)" }}
  >
    {children}
  </p>
);

const HanabiSettingsPanel: React.FC<VisualizerSettingsPanelProps> = ({
  t,
  isDaylight,
  theme,
  rangeInputClass,
  controlCardBg,
  hanabiTuning = DEFAULT_HANABI_TUNING,
  onHanabiTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}) => {
  const onOff = [
    { value: true, label: t("folia.options.temperaToggleOn") },
    { value: false, label: t("folia.options.temperaToggleOff") },
  ];

  const renderControl = (spec: ControlSpec) => (
    <React.Fragment key={spec.key}>
      {spec.kind === "slider" ? (
        <TemperaRangeControl
          label={t(spec.labelKey)}
          value={hanabiTuning[spec.key]}
          min={spec.min}
          max={spec.max}
          step={spec.step ?? 0.05}
          rangeInputClass={rangeInputClass}
          onChange={(value) => onHanabiTuningChange?.({ [spec.key]: value })}
          onPointerDown={onSliderPointerDown}
          onPointerUp={onSliderCommit}
        />
      ) : (
        <VisualizerPresetGroup
          label={t(spec.labelKey)}
          value={hanabiTuning[spec.key]}
          options={onOff}
          onChange={(value) => onHanabiTuningChange?.({ [spec.key]: value })}
          isDaylight={isDaylight}
          theme={theme}
        />
      )}
      {spec.noteKey ? <Note>{t(spec.noteKey)}</Note> : null}
    </React.Fragment>
  );

  return (
    <div
      className="space-y-4 rounded-[24px] border border-white/10 p-4"
      style={{ backgroundColor: controlCardBg }}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {t("folia.options.hanabiSettings")}
        </div>
        <div className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
          {t("folia.options.hanabiSettingsDesc")}
        </div>
        <div className="text-xs opacity-50" style={{ color: "var(--text-secondary)" }}>
          {t("folia.options.hanabiFontSizeAutoNotice")}
        </div>
      </div>

      {GROUPS.map((group) => (
        <TemperaSettingsSection key={group.titleKey} title={t(group.titleKey)}>
          {group.controls.map(renderControl)}
        </TemperaSettingsSection>
      ))}

      <TemperaSettingsSection title={t("folia.options.hanabiColorSection")}>
        <VisualizerPresetGroup<HanabiTuning["colorMode"]>
          label={t("folia.options.hanabiColorMode")}
          value={hanabiTuning.colorMode}
          options={[
            { value: "mixed", label: t("folia.options.hanabiColorModeMixed") },
            { value: "vivid", label: t("folia.options.hanabiColorModeVivid") },
            { value: "theme", label: t("folia.options.hanabiColorModeTheme") },
          ]}
          onChange={(colorMode) => onHanabiTuningChange?.({ colorMode })}
          isDaylight={isDaylight}
          theme={theme}
        />
        <Note>{t("folia.options.hanabiColorModeHint")}</Note>
      </TemperaSettingsSection>

      <TemperaSettingsSection title={t("folia.options.hanabiPerformanceSection")}>
        <VisualizerPresetGroup<HanabiTuning["renderQuality"]>
          label={t("folia.options.hanabiRenderQuality")}
          value={hanabiTuning.renderQuality}
          options={[
            { value: "full", label: t("folia.options.hanabiRenderQualityFull") },
            { value: "balanced", label: t("folia.options.hanabiRenderQualityBalanced") },
            { value: "low", label: t("folia.options.hanabiRenderQualityLow") },
          ]}
          onChange={(renderQuality) => onHanabiTuningChange?.({ renderQuality })}
          isDaylight={isDaylight}
          theme={theme}
        />
        <Note>{t("folia.options.hanabiRenderQualityHint")}</Note>
      </TemperaSettingsSection>
    </div>
  );
};

export default HanabiSettingsPanel;
