import type { TranslationKey } from "@/lib/i18n";
import { DEFAULT_METAPHOR_TUNING, METAPHOR_LIMITS } from "@/lib/lyrics/metaphorTuning";
import type {
  MetaphorBooleanKey,
  MetaphorNumberKey,
  MetaphorTuning,
} from "@/types/lyrics/folia/metaphor";
import { formatLyricRenderScale, LYRIC_RENDER_SCALES } from "../../../utils/lyricRenderQuality";
import type { VisualizerSettingsPanelProps } from "../definition";
import {
  Group,
  PanelFrame,
  Row,
  Segmented,
  SliderRow,
  times,
  ToggleRow,
  type SettingsGroupDef,
} from "../panelRows";

const CAMERA_GROUP: SettingsGroupDef = {
  id: "vis-metaphor-camera",
  titleKey: "folia.options.metaphorCameraSection",
};
const INK_GROUP: SettingsGroupDef = {
  id: "vis-metaphor-ink",
  titleKey: "folia.options.metaphorInkSection",
};
const RENDER_GROUP: SettingsGroupDef = {
  id: "vis-metaphor-render",
  titleKey: "folia.options.lyricRenderSection",
};

type SliderSpec = [key: MetaphorNumberKey, label: TranslationKey, hint?: TranslationKey];
type ToggleSpec = [key: MetaphorBooleanKey, label: TranslationKey, hint?: TranslationKey];

const CAMERA_SLIDERS: SliderSpec[] = [
  ["cutPace", "folia.options.metaphorCutPace", "folia.options.metaphorCutPaceHint"],
  ["cameraMotion", "folia.options.metaphorCameraMotion"],
];
const CAMERA_TOGGLES: ToggleSpec[] = [
  ["negative", "folia.options.metaphorNegative", "folia.options.metaphorNegativeHint"],
  ["transitions", "folia.options.metaphorTransitions", "folia.options.metaphorTransitionsHint"],
];
const INK_TOGGLES: ToggleSpec[] = [
  ["flip", "folia.options.metaphorFlip", "folia.options.metaphorFlipHint"],
  [
    "keywordColors",
    "folia.options.metaphorKeywordColors",
    "folia.options.metaphorKeywordColorsHint",
  ],
];
const INK_SLIDERS: SliderSpec[] = [
  ["flow", "folia.options.metaphorFlow"],
  ["blobs", "folia.options.metaphorBlobs"],
  ["halftone", "folia.options.metaphorHalftone"],
  ["grain", "folia.options.metaphorGrain"],
];

export default function MetaphorSettingsPanel({
  t,
  theme,
  isDaylight,
  controlCardBg,
  rangeInputClass,
  metaphorTuning = DEFAULT_METAPHOR_TUNING,
  onMetaphorTuningChange,
  onSliderPointerDown,
  onSliderCommit,
}: VisualizerSettingsPanelProps) {
  const patch = (value: Partial<MetaphorTuning>) => onMetaphorTuningChange?.(value);
  const renderSlider = ([key, labelKey, hintKey]: SliderSpec) => (
    <SliderRow
      key={key}
      label={t(labelKey)}
      note={hintKey && t(hintKey)}
      value={metaphorTuning[key]}
      min={METAPHOR_LIMITS[key].min}
      max={METAPHOR_LIMITS[key].max}
      step={0.05}
      format={times}
      onChange={(value) => patch({ [key]: value })}
      onDragStart={onSliderPointerDown}
      onDragEnd={onSliderCommit}
    />
  );
  const renderToggle = ([key, labelKey, hintKey]: ToggleSpec) => (
    <ToggleRow
      key={key}
      label={t(labelKey)}
      note={hintKey && t(hintKey)}
      checked={metaphorTuning[key]}
      onChange={(value) => patch({ [key]: value })}
    />
  );

  return (
    <PanelFrame
      title={t("folia.ui.visualizerMetaphor")}
      t={t}
      theme={theme}
      isDaylight={isDaylight}
      controlCardBg={controlCardBg}
      rangeInputClass={rangeInputClass}
    >
      <Group def={CAMERA_GROUP}>
        {CAMERA_SLIDERS.map(renderSlider)}
        {CAMERA_TOGGLES.map(renderToggle)}
      </Group>
      <Group def={INK_GROUP}>
        {INK_TOGGLES.map(renderToggle)}
        {INK_SLIDERS.map(renderSlider)}
      </Group>
      <Group def={RENDER_GROUP}>
        <Row label={t("folia.options.lyricRenderScale")}>
          <Segmented
            value={String(metaphorTuning.render.scale)}
            options={[
              { value: "global", label: t("folia.options.lyricRenderFollowGlobal") },
              ...LYRIC_RENDER_SCALES.map((scale) => ({
                value: String(scale),
                label: formatLyricRenderScale(scale),
              })),
            ]}
            onChange={(value) =>
              patch({
                render: {
                  ...metaphorTuning.render,
                  scale: LYRIC_RENDER_SCALES.find((scale) => String(scale) === value) ?? "global",
                },
              })
            }
          />
        </Row>
      </Group>
    </PanelFrame>
  );
}
